"""Install a trained bundle and compiled WASM assets under Vite's existing base path."""
import argparse
import hashlib
import json
from pathlib import Path
import shutil
import subprocess
ROOT=Path(__file__).resolve().parents[2]
def digest(p):
    with p.open('rb') as f:return hashlib.file_digest(f,'sha256').hexdigest()
def main():
    p=argparse.ArgumentParser();p.add_argument('--quantization',choices=['q4_0','q8_0'],default='q4_0');p.add_argument('--bundle',type=Path);args=p.parse_args()
    bundle=args.bundle or ROOT/'.agent-artifacts/bundles'/args.quantization
    manifest_path=bundle/'manifest.json'
    if not manifest_path.exists():raise SystemExit('No trained STIX bundle found. Run agent:setup, agent:data, agent:train and agent:export, or supply --bundle PATH.')
    manifest=json.loads(manifest_path.read_text())
    if not str(manifest.get('datasetVersion','')).startswith('stix-2.1-agent-'):raise ValueError('Expected a STIX-trained model bundle, not the research-station model.')
    for info in manifest['files'].values():
        path=bundle/info['path']
        if path.resolve().parent!=bundle.resolve() or path.stat().st_size!=info['bytes'] or digest(path)!=info['sha256']:raise ValueError('Invalid bundle file '+info['path'])
    out=ROOT/'public/stix-agent';(out/'model').mkdir(parents=True,exist_ok=True)
    for info in manifest['files'].values():shutil.copy2(bundle/info['path'],out/'model'/info['path'])
    shutil.copy2(manifest_path,out/'model/manifest.json')
    runtime=out/'runtime/flare';runtime.mkdir(parents=True,exist_ok=True)
    for name in ['flare_web.js','flare_web_bg.wasm']:
        source=ROOT/'.agent-cache/flare-pkg'/name
        if not source.exists():raise SystemExit('Missing compiled Flare. Run npm run agent:setup first.')
        shutil.copy2(source,runtime/name)
    shutil.copy2(ROOT/'.agent-cache/flare-pkg/flare_web.d.ts',ROOT/'src/features/stix-agent/runtime/flare_web.d.ts')
    subprocess.run(['wasm-pack','build','crates/stix-agent-core','--target','web','--release','--out-dir','../../public/stix-agent/runtime/knowledge','--','--locked'],cwd=ROOT,check=True)
    shutil.copy2(out/'runtime/knowledge/stix_agent_core.d.ts',ROOT/'src/features/stix-agent/runtime/stix_agent_core.d.ts')
    (out/'runtime-manifest.json').write_text(json.dumps({'modelSha256':manifest['files']['weights']['sha256'],'files':{str(f.relative_to(out)):digest(f) for f in (out/'runtime').rglob('*') if f.suffix in ['.js','.wasm']}},indent=2)+'\n')
    print('Installed '+manifest['id']+'; opening the sidebar is the only runtime load trigger.')
if __name__=='__main__':main()
