// Execute the shipped WASM libraries in Node. Browser GPU checks are separate.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import flareInit, { FlareTokenizer, FlareEngine } from '../../public/stix-agent/runtime/flare/flare_web.js';
import knowledgeInit, { StixKnowledge } from '../../public/stix-agent/runtime/knowledge/stix_agent_core.js';
import { boundPrompt } from '../../src/features/stix-agent/prompt.ts';
const read = p => fs.readFileSync(p);
const json = p => JSON.parse(read(p));
const hash = p => createHash('sha256').update(read(p)).digest('hex');
await flareInit({module_or_path:read('public/stix-agent/runtime/flare/flare_web_bg.wasm')});
await knowledgeInit({module_or_path:read('public/stix-agent/runtime/knowledge/stix_agent_core_bg.wasm')});
const tokenizer = FlareTokenizer.from_json(read('public/stix-agent/model/tokenizer.json').toString());
const knowledge = new StixKnowledge(read('public/stix-agent/knowledge.json').toString());
const system = json('public/stix-agent/prompt.json').system;
let prompts=0, tokens=0;
const ragRows=json('.agent-artifacts/evaluation/q4_0-retrieval.json').results;
for (const name of ['q4_0','q4_0-retrieval']) for (const row of json(`.agent-artifacts/evaluation/${name}.json`).results) {
  const found=JSON.parse(knowledge.retrieve(row.case.question,'[]'));
  if(name==='q4_0')found.facts=[];
  const bounded=boundPrompt(system,row.case.question,found,s=>tokenizer.encode(s));
  assert.deepEqual(bounded.retrieval.facts,row.evidence,`${row.case.id}: reference parity`);
  assert.deepEqual([...bounded.ids],row.inputTokens,`${row.case.id}: template/token parity`);
  prompts++; tokens+=bounded.ids.length;
}
const engine=FlareEngine.load(new Uint8Array(read('public/stix-agent/model/stix-expert-q4_0.gguf')));
const generations=[];
for(const id of ['required-indicator','sco-version','unknown-1']) {
  const row=ragRows.find(r=>r.case.id===id);assert.ok(row);
  engine.reset();engine.set_rng_seed(42);
  await engine.begin_stream_with_params_async(new Uint32Array(row.inputTokens),16,0,1,0,1,0);
  const ids=[];
  for(let i=0;i<16;i++){const token=await engine.next_token_async();if(token===undefined)break;ids.push(token);}
  assert.deepEqual(ids,row.outputTokens.slice(0,ids.length),`${id}: deterministic generation parity`);
  generations.push({id,tokens:ids,text:tokenizer.decode(new Uint32Array(ids))});
}
engine.free();knowledge.free();tokenizer.free();
const result={passed:true,prompts,tokenIdsCompared:tokens,generations,modelSha256:hash('public/stix-agent/model/stix-expert-q4_0.gguf'),knowledgeSha256:hash('public/stix-agent/knowledge.json'),scope:'Actual shipped WASM libraries in Node versus native llama.cpp. GPU verified separately in browser.'};
fs.writeFileSync('.agent-artifacts/evaluation/wasm-parity.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result,null,2));
