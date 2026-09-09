"""Check example lengths, source hashes and held-card leakage without an LLM judge."""
import json
from pathlib import Path
from tokenizers import Tokenizer
from prepare_data import ROOT, digest, write
def main():
    data=ROOT/'.agent-artifacts/data';manifest=json.loads((data/'manifest.json').read_text())
    tokenizer=Tokenizer.from_file(str(ROOT/'.agent-cache/hf-base/tokenizer.json'))
    result={}
    for name,expected in manifest['files'].items():
        if digest(data/name)!=expected:raise ValueError('Data changed: '+name)
    for split in ['train','valid']:
        text=(data/(split+'.jsonl')).read_text();rows=[json.loads(line) for line in text.splitlines()];lengths=[]
        for row in rows:
            prompt=''.join('<|im_start|>'+m['role']+'\n'+m['content']+'<|im_end|>\n' for m in row['messages'])
            lengths.append(len(tokenizer.encode(prompt,add_special_tokens=False).ids))
        if max(lengths)>1024:raise ValueError('An example would be truncated: '+split)
        if split=='train' and any('['+id+']' in text for id in manifest['heldOutTopicIds']):raise ValueError('Held-card evidence appears in training.')
        result[split]=dict(examples=len(rows),maxTokens=max(lengths),overLimit=0)
    result.update(heldCardCitationLeaks=0,passed=True,corpusSha256=digest(ROOT/'public/stix-agent/knowledge.json'))
    write(ROOT/'.agent-artifacts/evaluation/data-audit.json',result);print(json.dumps(result,indent=2))
if __name__=='__main__':main()
