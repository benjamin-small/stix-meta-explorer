"""A small additional wording check added after the model and retrieval were frozen."""
import json
import subprocess
from evaluate import server, request, grade
from prepare_data import ROOT, SYSTEM, render, digest, write
def main():
    rows=[
        ('fresh-creator','In campaign, who is identified by created_by_ref?',['identity']),
        ('fresh-os','What does malware.operating_system_refs refer to?',['software']),
        ('fresh-until','Explain indicator.valid_until in plain English.',['valid_until','valid_from']),
        ('fresh-exploit','Could malware be the source of an exploits relationship to a vulnerability?',['malware','exploits','vulnerability']),
        ('fresh-communication','Which target types does infrastructure communicates-with support?',['ipv4-addr','ipv6-addr','domain-name','url']),
        ('fresh-attribution','How is a campaign linked to a threat actor using attributed-to?',['campaign','attributed-to','threat-actor']),
        ('fresh-hashes','What is file.hashes?',['hashes','dictionary']),
        ('fresh-observations','What does an observed-data object use object_refs for?',['object_refs','SCO']),
        ('fresh-identity','How is identity_class typed on an identity?',['identity_class','open-vocab']),
        ('fresh-bundle','What does bundle.objects contain?',['objects','STIX']),
    ]
    cases=[dict(id=id,question=q,need=need,category='additional_wording') for id,q,need in rows]
    cases += [dict(id='fresh-unknown-'+str(i),question=q,category='unknown') for i,q in enumerate(['What is x_never_defined_secret_rating on a tool?','Which IP is currently controlling this malware on my laptop?'])]
    process=subprocess.run([str(ROOT/'crates/stix-agent-core/target/debug/stix-agent-core'),str(ROOT/'public/stix-agent/knowledge.json')],input=''.join(json.dumps({'query':c['question']})+'\n' for c in cases),text=True,capture_output=True,check=True)
    found=[json.loads(line)['facts'] for line in process.stdout.splitlines()];results=[]
    weights=ROOT/'.agent-artifacts/models/stix-expert-q4_0.gguf'
    with server(weights) as port:
        for case,evidence in zip(cases,found):
            content=render(case['question'],evidence)
            prompt=f'<|im_start|>system\n{SYSTEM}<|im_end|>\n<|im_start|>user\n{content}<|im_end|>\n<|im_start|>assistant\n'
            ids=request(port,'tokenize',{'content':prompt,'add_special':False,'parse_special':True})['tokens']
            if len(ids)>1792:raise ValueError('Additional check exceeds application context.')
            answer=request(port,'completion',{'prompt':prompt,'n_predict':256,'temperature':0,'seed':42,'cache_prompt':False})['content']
            results.append(dict(case=case,answer=answer,evidence=evidence,**grade(case,answer,evidence)))
    result=dict(modelSha256=digest(weights),corpusSha256=digest(ROOT/'public/stix-agent/knowledge.json'),referenceChecksPassed=sum(r['correct'] for r in results[:10]),referenceChecks=10,unknownChecksPassed=sum(r['correct'] for r in results[10:]),unknownChecks=2,results=results,method='Small additional wording check created after training/retrieval were frozen. Heuristic assertions, not a broad expert benchmark. No further tuning based on these results.')
    write(ROOT/'.agent-artifacts/evaluation/additional-wording.json',result)
    print(json.dumps({k:v for k,v in result.items() if k!='results'},indent=2))
if __name__=='__main__':main()
