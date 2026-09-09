"""Fetch pinned build inputs. Network access occurs only in this explicit setup command."""
import argparse
import hashlib
import json
from pathlib import Path
import shutil
import subprocess
import sys
import tarfile
import urllib.request

ROOT=Path(__file__).resolve().parents[2]
CACHE=ROOT/'.agent-cache'
def sha(p):
    with p.open('rb') as f:return hashlib.file_digest(f,'sha256').hexdigest()
def run(args,cwd=ROOT):subprocess.run([str(x) for x in args],cwd=cwd,check=True)
def download(url,path,expected=None):
    path.parent.mkdir(parents=True,exist_ok=True)
    if path.exists():
        if expected and sha(path)!=expected:raise ValueError(f'Hash mismatch: {path}; move it aside before retrying.')
        return
    print('Downloading',path.name,flush=True)
    req=urllib.request.Request(url,headers={'User-Agent':'STIX-Meta-Explorer-local-build'})
    partial=path.with_suffix(path.suffix+'.partial')
    with urllib.request.urlopen(req,timeout=180) as source,partial.open('wb') as target:shutil.copyfileobj(source,target,1024*1024)
    if expected and sha(partial)!=expected:raise ValueError(f'Hash mismatch: {partial}')
    partial.replace(path)
def extract(archive,dest):
    if dest.exists():return
    stage=dest.parent/(dest.name+'-extract');stage.mkdir(exist_ok=True)
    with tarfile.open(archive) as t:t.extractall(stage,filter='data')
    children=list(stage.iterdir())
    if len(children)!=1 or not children[0].is_dir():raise ValueError('Unexpected archive layout')
    children[0].rename(dest);stage.rmdir()
def main():
    p=argparse.ArgumentParser();p.add_argument('--from-poc',type=Path,help='Reuse the verified llm-in-browser runtime and model inputs instead of downloading/building them.');p.add_argument('--skip-python',action='store_true');args=p.parse_args()
    lock=json.loads((ROOT/'scripts/agent/runtime-lock.json').read_text());CACHE.mkdir(exist_ok=True)
    if sha(ROOT/'patches/flare-smollm2.patch')!=lock['flare_patch_sha256']:raise ValueError('Flare patch differs from runtime lock.')
    sources=CACHE/'sources'
    download('https://docs.oasis-open.org/cti/stix/v2.1/os/stix-v2.1-os.html',sources/'spec.html',lock['specification_sha256'])
    rev=lock['schema_revision']
    download(f'https://codeload.github.com/oasis-open/cti-stix2-json-schemas/tar.gz/{rev}',sources/'schemas.tar.gz',lock['schema_archive_sha256'])
    extract(sources/'schemas.tar.gz',sources/f'cti-stix2-json-schemas-{rev}')
    if args.from_poc:
        poc=args.from_poc.resolve();original=json.loads((poc/'runtime-lock.json').read_text())
        if any(original[k]!=lock[k] for k in ['flare','llama_cpp','model_revision']) or sha(poc/'patches/flare-smollm2.patch')!=lock['flare_patch_sha256']:raise ValueError('POC runtime pins do not match.')
        for name in ['hf-base','llama.cpp','llama-build','flare-pkg']:
            target=CACHE/name
            if not target.exists():target.symlink_to(poc/'.cache'/name,target_is_directory=True)
        target=CACHE/'base-q8.gguf'
        if not target.exists():target.symlink_to(poc/'.cache/models'/lock['gguf_file'])
    else:
        for repo,key,name in [('sauravpanda/flarellm','flare','flare'),('ggml-org/llama.cpp','llama_cpp','llama.cpp')]:
            archive=CACHE/(name+'.tar.gz');download(f'https://codeload.github.com/{repo}/tar.gz/{lock[key]}',archive)
            extract(archive,CACHE/name)
        applied=CACHE/'flare/.stix-patch-applied'
        if not applied.exists():
            run(['patch','--batch','-p1','-i',ROOT/'patches/flare-smollm2.patch'],CACHE/'flare');applied.write_text(lock['flare_patch_sha256'])
        elif applied.read_text()!=lock['flare_patch_sha256']:raise ValueError('Existing runtime uses a different patch.')
        run(['wasm-pack','build','flare-web','--target','web','--release','--out-dir',CACHE/'flare-pkg','--','--locked'],CACHE/'flare')
        run(['cmake','-S',CACHE/'llama.cpp','-B',CACHE/'llama-build','-DCMAKE_BUILD_TYPE=Release','-DLLAMA_CURL=OFF','-DLLAMA_BUILD_TESTS=OFF'])
        run(['cmake','--build',CACHE/'llama-build','--config','Release','-j','8','--target','llama-server','llama-quantize'])
        hf=f"https://huggingface.co/{lock['model']}/resolve/{lock['model_revision']}/"
        for name in ['config.json','generation_config.json','tokenizer.json','tokenizer_config.json','special_tokens_map.json','merges.txt','vocab.json']:
            download(hf+name,CACHE/'hf-base'/name)
        download(hf+'model.safetensors',CACHE/'hf-base/model.safetensors','e6bffe7435d7ddc10fd3b9a9efd429dafbacb1cb17015fb5562664e7532bf86e')
        download(f"https://huggingface.co/{lock['gguf_repository']}/resolve/{lock['gguf_revision']}/{lock['gguf_file']}",CACHE/'base-q8.gguf','48ab3034d0dd401fbc721eb1df3217902fee7dab9078992d66431f09b7750201')
    if not args.skip_python:
        if not (ROOT/'.agent-venv/bin/python').exists():run([sys.executable,'-m','venv',ROOT/'.agent-venv'])
        run([ROOT/'.agent-venv/bin/python','-m','pip','install','-r',ROOT/'scripts/agent/requirements.lock.txt'])
    print('Pinned build inputs ready. Run npm run agent:data, agent:train, agent:export, then agent:assets.')
if __name__=='__main__':main()
