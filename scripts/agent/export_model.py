"""Fuse the best local LoRA checkpoint and export pinned GGUF Q8_0/Q4_0 bundles."""
import hashlib
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys

ROOT=Path(__file__).resolve().parents[2]
def digest(p):
    with p.open('rb') as f:return hashlib.file_digest(f,'sha256').hexdigest()
def run(args):subprocess.run([str(x) for x in args],cwd=ROOT,check=True)
def main():
    os.environ['HF_HUB_OFFLINE']='1';os.environ['HF_HUB_DISABLE_TELEMETRY']='1'
    fused=ROOT/'.agent-artifacts/training/fused';out=ROOT/'.agent-artifacts/models';out.mkdir(parents=True,exist_ok=True)
    base=ROOT/'.agent-cache/hf-base';summary=json.loads((ROOT/'.agent-artifacts/training/summary.json').read_text())
    if summary['stepsCompleted']!=600:raise ValueError('Complete the configured 600-step training run first.')
    lock=json.loads((ROOT/'scripts/agent/runtime-lock.json').read_text())
    run([sys.executable,'-m','mlx_lm.fuse','--model',base,'--adapter-path',ROOT/'.agent-artifacts/training/best','--save-path',fused])
    for p in base.iterdir():
        if p.name in ['tokenizer.json','tokenizer_config.json','config.json','generation_config.json','special_tokens_map.json','merges.txt','vocab.json']:shutil.copy2(p,fused/p.name)
    f16=out/'stix-expert-f16.gguf'
    run([sys.executable,ROOT/'.agent-cache/llama.cpp/convert_hf_to_gguf.py',fused,'--outfile',f16,'--outtype','f16'])
    for q in ['Q8_0','Q4_0']:
        weights=out/f'stix-expert-{q.lower()}.gguf'
        run([ROOT/'.agent-cache/llama-build/bin/llama-quantize',f16,weights,q])
        bundle=ROOT/'.agent-artifacts/bundles'/q.lower();bundle.mkdir(parents=True,exist_ok=True)
        files={}
        for role,p in dict(weights=weights,tokenizer=fused/'tokenizer.json',tokenizerConfig=fused/'tokenizer_config.json',config=fused/'config.json',generationConfig=fused/'generation_config.json').items():
            shutil.copy2(p,bundle/p.name);files[role]=dict(path=p.name,bytes=p.stat().st_size,sha256=digest(p))
        manifest=dict(schemaVersion=1,id='stix-2.1-'+q.lower(),name='STIX 2.1 · SmolLM2 360M',model=lock['model'],revision=lock['model_revision'],quantization=q,datasetVersion=summary['dataset']['version'],training=summary,files=files,runtime=dict(flare=lock['flare'],llamaCpp=lock['llama_cpp'],patchSha256=digest(ROOT/'patches/flare-smollm2.patch')))
        manifest.update(knowledgeSha256=digest(ROOT/'public/stix-agent/knowledge.json'),promptSha256=digest(ROOT/'public/stix-agent/prompt.json'))
        (bundle/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
    print('Exported both variants. Evaluate before selecting the default.')
if __name__=='__main__':main()
