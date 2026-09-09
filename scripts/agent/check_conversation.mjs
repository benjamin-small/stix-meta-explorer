// Real shipped WASM generation. No browser UI or mocked model participates.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import flareInit, {FlareTokenizer, FlareEngine} from '../../public/stix-agent/runtime/flare/flare_web.js';
import knowledgeInit, {StixKnowledge} from '../../public/stix-agent/runtime/knowledge/stix_agent_core.js';
import {preparePrompt} from '../../src/features/stix-agent/prompt.ts';

const read = p => fs.readFileSync(p);
const hash = p => createHash('sha256').update(read(p)).digest('hex');
await flareInit({module_or_path:read('public/stix-agent/runtime/flare/flare_web_bg.wasm')});
await knowledgeInit({module_or_path:read('public/stix-agent/runtime/knowledge/stix_agent_core_bg.wasm')});
const tokenizer=FlareTokenizer.from_json(read('public/stix-agent/model/tokenizer.json').toString());
const knowledge=new StixKnowledge(read('public/stix-agent/knowledge.json').toString());
const engine=FlareEngine.load(new Uint8Array(read('public/stix-agent/model/stix-expert-q4_0.gguf')));
const {system}=JSON.parse(read('public/stix-agent/prompt.json'));
const retrieve=(q,previous)=>JSON.parse(knowledge.retrieve(q,JSON.stringify(previous)));
const cases=[
  {id:'malware-name',question:'Is name required for a malware family?',need:['malware.name','family','MUST']},
  {id:'topic-change-note',question:'Should I put the location of an attack in a Note?',need:['Note'],forbid:['malware.name']},
  {id:'unknown-after-answer',question:'What is the secret_access_token field of indicator?',unknown:true},
  {id:'known-after-unknown',question:'Which properties are required for an indicator?',need:['indicator.required','pattern','pattern_type','valid_from','created','modified']},
  {id:'pronoun-followup',question:'What about its pattern_type?',need:['indicator.pattern_type','open-vocab']},
  {id:'missing-pronoun-property',question:'What about its secret_access_token?',unknown:true},
  {id:'off-topic',question:'Who won the baseball game yesterday?',unknown:true},
  {id:'new-chat',question:'Is name required for a malware family?',newChat:true,need:['malware.name','family','MUST']},
];
const results=[];let history=[];
try {
  for(const test of cases){
    if(test.newChat)history=[];
    const prompt=preparePrompt(system,history,test.question,undefined,retrieve,s=>tokenizer.encode(s));
    engine.reset();engine.set_rng_seed(42);
    await engine.begin_stream_with_params_async(prompt.ids,256,0,1,0,1,0);
    const tokens=[];
    for(let i=0;i<256;i++){const token=await engine.next_token_async();if(token===undefined)break;tokens.push(token);}
    const answer=tokenizer.decode(new Uint32Array(tokens));
    const cited=[...answer.matchAll(/\[([a-z0-9_.-]+)\]/g)].map(m=>m[1]);
    const failures=[];
    if(!answer.trim())failures.push('empty answer');
    if(test.unknown && !/don't know|do not know|not (?:defined|specified|available)|cannot (?:infer|determine)/i.test(answer))failures.push('did not abstain');
    for(const required of test.need||[])if(!answer.includes(required))failures.push('missing '+required);
    for(const forbidden of test.forbid||[])if(answer.includes(forbidden))failures.push('stale '+forbidden);
    if(history.at(-1)?.content===answer)failures.push('repeated previous answer');
    // Adjacent unknown questions may correctly use the same abstention phrase.
    if(test.unknown && results.at(-1)?.case.unknown) {
      const index=failures.indexOf('repeated previous answer');if(index>=0)failures.splice(index,1);
    }
    for(const id of cited)if(!prompt.retrieval.facts.some(f=>f.id===id))failures.push('unsupported citation '+id);
    results.push({case:test,answer,evidence:prompt.retrieval.facts,inputTokens:[...prompt.ids],outputTokens:tokens,failures});
    console.log(`${test.id}: ${failures.length ? 'FAIL '+failures.join(', ') : 'PASS'} (${prompt.ids.length} input, ${tokens.length} output tokens)`);
    history.push({role:'user',content:test.question},{role:'assistant',content:answer});
  }
} finally {engine.free();knowledge.free();tokenizer.free();}
const result={passed:results.every(r=>!r.failures.length),cases:results.length,modelSha256:hash('public/stix-agent/model/stix-expert-q4_0.gguf'),knowledgeSha256:hash('public/stix-agent/knowledge.json'),scope:'Actual shipped WASM CPU, same prompt preparation as worker, sequential turns with one reset engine; subject reconstructed from user history each turn, including restart behavior.',results};
fs.mkdirSync('.agent-artifacts/evaluation',{recursive:true});
fs.writeFileSync('.agent-artifacts/evaluation/conversation-regression.json',JSON.stringify(result,null,2)+'\n');
assert.ok(result.passed,'Conversation regression failed; see .agent-artifacts/evaluation/conversation-regression.json');
