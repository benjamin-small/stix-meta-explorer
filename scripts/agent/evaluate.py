"""Local GGUF regression suite. Heuristic checks are not a conformance certification."""
import argparse
import contextlib
import json
from pathlib import Path
import re
import socket
import statistics
import subprocess
import time
import urllib.request
from prepare_data import ROOT, SYSTEM, render, digest, write

def request(port,path,body=None):
    req=urllib.request.Request(f'http://127.0.0.1:{port}/{path}',data=None if body is None else json.dumps(body).encode(),headers={'Content-Type':'application/json'})
    return json.load(urllib.request.urlopen(req,timeout=120))
@contextlib.contextmanager
def server(weights):
    with socket.socket() as s:s.bind(('127.0.0.1',0));port=s.getsockname()[1]
    log=ROOT/'.agent-artifacts/evaluation/reference.log';log.parent.mkdir(parents=True,exist_ok=True)
    with log.open('w') as f:
        p=subprocess.Popen([str(ROOT/'.agent-cache/llama-build/bin/llama-server'),'-m',str(weights),'--host','127.0.0.1','--port',str(port),'-c','2048','-ngl','99','--no-webui','--jinja'],stdout=f,stderr=f)
        try:
            for _ in range(100):
                if p.poll() is not None:raise RuntimeError('Reference runtime exited; see '+str(log))
                try:
                    if request(port,'health').get('status') in ['ok','ready']:break
                except OSError:time.sleep(.2)
            else:raise RuntimeError('Reference runtime did not become ready.')
            yield port
        finally:
            p.terminate()
            try:p.wait(timeout=10)
            except subprocess.TimeoutExpired:p.kill();p.wait()

def cases():
    manual=[
      ('required-indicator','Which properties are required for an indicator?',['pattern','pattern_type','valid_from','created','modified','spec_version','id','type']),
      ('malware-family','Is name required for a malware family?',['name','family']),
      ('malware-family-flag','What does malware.is_family mean?',['family','true','instance','false']),
      ('rel-indicator','How does an indicator relate to malware?',['indicator','indicates','malware','source_ref','target_ref']),
      ('rel-threat-actor','Which types can a threat-actor target?',['identity','location','vulnerability']),
      ('ref-samples','What may malware.sample_refs point to?',['file','artifact']),
      ('pattern-type','What is the pattern_type property on an indicator?',['pattern','type']),
      ('observed-count','Explain number_observed on observed-data.',['number','observed']),
      ('confidence','What is the allowed confidence range?',['0','100']),
      ('sco-version','Is spec_version mandatory on an IPv4 address SCO?',['optional','2.1']),
      ('bundle','Does a bundle have spec_version?',['bundle','no','spec_version']),
      ('file-minimum','What is the minimum set of file properties?',['hashes','name']),
      ('net-minimum','Which properties are required for network-traffic?',['protocols','src_ref','dst_ref']),
      ('artifact-exclusive','Which properties are required for an artifact?',['payload_bin','url']),
      ('enum','How are open vocabularies different from enums?',['vocabulary','enumeration']),
      ('custom-rel','Can I define my own custom relationship type?',['user-defined','relationship_type']),
      ('schema-not-proof','Does passing JSON Schema prove STIX conformance?',['non-normative','conformance']),
      ('revoke','Can I create another version after revoking an object?',['future','MUST NOT']),
      ('timestamp','How do created and modified timestamps differ?',['created','modified']),
      ('ids','What is the STIX identifier format?',['object-type--UUID']),
      ('embedded','What is an embedded relationship?',['_ref','relationship']),
      ('sighting','What is a sighting?',['seen']),
    ]
    rows=[dict(id=id,category='manual_regression',question=q,need=need) for id,q,need in manual]
    for i,q in enumerate(['What is the required attack_success_percentage on malware?','What is the secret_access_token field of indicator?','Who is attacking my network right now?','Give me the STIX 4.8 mandatory schema fields.','What is the password of the selected identity?','Does the specification require a magic_risk_score on a campaign?']):
        rows.append(dict(id='unknown-'+str(i),category='unknown',question=q))
    generated=json.loads((ROOT/'.agent-artifacts/data/evaluation.json').read_text())
    rows+=sorted([r for r in generated if r['category']=='held_out_topic'],key=lambda r:r['id'])[:20]
    return rows

def norm(s):return re.sub(r'\s+',' ',s.lower()).strip()
def grade(case,answer,evidence):
    a=norm(answer)
    if case['category']=='unknown':correct=bool(re.search(r"don't know|do not know|not (?:defined|specified|available|provided)|cannot (?:infer|determine)|no (?:evidence|information)",a))
    elif 'need' in case:correct=all(norm(x) in a for x in case['need'])
    else:correct=norm(case['expected']) in a
    cited=re.findall(r'\[([a-z0-9_.-]+)\]',answer)
    bad_citations=[c for c in cited if c not in {d['id'] for d in evidence}]
    return dict(correct=correct,citedReferenceIds=cited,unsupportedCitations=bad_citations)

def main():
    p=argparse.ArgumentParser();p.add_argument('--quick',action='store_true');p.add_argument('--models',nargs='+',default=['base','q8_0','q4_0']);args=p.parse_args()
    rows=cases();write(ROOT/'.agent-artifacts/evaluation/cases.json',rows)
    process=subprocess.run([str(ROOT/'crates/stix-agent-core/target/debug/stix-agent-core'),str(ROOT/'public/stix-agent/knowledge.json')],input=''.join(json.dumps({'query':r['question']})+'\n' for r in rows),text=True,capture_output=True,check=True)
    found=[json.loads(line) for line in process.stdout.splitlines()]
    summaries=[]
    for name in args.models:
        weights=ROOT/'.agent-cache/base-q8.gguf' if name=='base' else ROOT/f'.agent-artifacts/models/stix-expert-{name}.gguf'
        with server(weights) as port:
            for rag in ([True] if args.quick or name=='q8_0' else [False,True]):
                results=[]
                for case,retrieval in zip(rows,found):
                    evidence=retrieval['facts'].copy() if rag else []
                    while True:
                        content=render(case['question'],evidence)
                        prompt=f'<|im_start|>system\n{SYSTEM}<|im_end|>\n<|im_start|>user\n{content}<|im_end|>\n<|im_start|>assistant\n'
                        native=request(port,'apply-template',{'messages':[{'role':'system','content':SYSTEM},{'role':'user','content':content}],'add_generation_prompt':True})['prompt']
                        if native!=prompt:raise RuntimeError('Chat-template parity failed.')
                        ids=request(port,'tokenize',{'content':prompt,'add_special':False,'parse_special':True})['tokens']
                        if len(ids)<=1792:break
                        if not evidence:raise ValueError('Oversized evaluation prompt')
                        evidence.pop()
                    response=request(port,'completion',{'prompt':prompt,'n_predict':256,'temperature':0,'seed':42,'cache_prompt':False,'return_tokens':True})
                    answer=response['content']
                    results.append(dict(case=case,answer=answer,evidence=evidence,prompt=prompt,inputTokens=ids,outputTokens=response.get('tokens'),timings=response.get('timings'),**grade(case,answer,evidence)))
                categories={c:dict(count=sum(r['case']['category']==c for r in results),correct=sum(r['correct'] for r in results if r['case']['category']==c)) for c in sorted({r['case']['category'] for r in results})}
                summary=dict(configuration=name+('-retrieval' if rag else ''),categories=categories,unsupportedCitationCount=sum(bool(r['unsupportedCitations']) for r in results),modelSha256=digest(weights),modelBytes=weights.stat().st_size,corpusSha256=digest(ROOT/'public/stix-agent/knowledge.json'),medianNativeDecodeTokensPerSecond=statistics.median(r['timings']['predicted_per_second'] for r in results),method='Deterministic synthetic regression checks; substring assertions and exact reference reproduction, not a human conformance assessment.')
                write(ROOT/'.agent-artifacts/evaluation'/(summary['configuration']+'.json'),dict(summary=summary,results=results));summaries.append(summary);print(json.dumps(summary),flush=True)
    write(ROOT/'.agent-artifacts/evaluation/summary.json',summaries)
if __name__=='__main__':main()
