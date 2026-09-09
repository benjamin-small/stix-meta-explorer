"""Package or install the pinned, prebuilt STIX browser model and WASM release.

Pages needs only Python's standard library; training and native toolchains stay local.
"""
import argparse
import hashlib
import json
from pathlib import Path, PurePosixPath
import re
import shutil
import tempfile
import urllib.request
import zipfile

ROOT = Path(__file__).resolve().parents[2]
REPOSITORY = 'benjamin-small/stix-meta-explorer'
LOCK_PATH = ROOT / 'scripts/agent/release-lock.json'
ROOT_FILES = ['knowledge.json', 'prompt.json', 'runtime-manifest.json', 'FLARE-LICENSE.txt',
              'MODEL-LICENSE.txt', 'MODEL-CARD.md', 'OASIS-NOTICES.txt']


def digest(path):
    with path.open('rb') as stream:
        return hashlib.file_digest(stream, 'sha256').hexdigest()


def matches(path, entry):
    return path.is_file() and path.stat().st_size == entry['bytes'] and digest(path) == entry['sha256']


def verify_bundle(directory):
    manifest = json.loads((directory / 'model/manifest.json').read_text())
    runtime = json.loads((directory / 'runtime-manifest.json').read_text())
    if manifest['datasetVersion'] != 'stix-2.1-agent-1.1.0' or manifest['quantization'] != 'Q4_0':
        raise ValueError('Expected the validated STIX 2.1 Q4_0 bundle.')
    for entry in manifest['files'].values():
        if PurePosixPath(entry['path']).name != entry['path'] or not matches(directory / 'model' / entry['path'], entry):
            raise ValueError('Model bundle integrity check failed: ' + entry['path'])
    for name, key in [('knowledge.json', 'knowledgeSha256'), ('prompt.json', 'promptSha256')]:
        if digest(directory / name) != manifest[key]:
            raise ValueError('Model/reference mismatch: ' + name)
    if runtime['modelSha256'] != manifest['files']['weights']['sha256']:
        raise ValueError('Runtime manifest belongs to another model.')
    for name, sha in runtime['files'].items():
        if not name.startswith('runtime/') or '..' in PurePosixPath(name).parts or digest(directory / name) != sha:
            raise ValueError('Runtime integrity check failed: ' + name)
    return manifest, runtime


def pack(tag):
    if not re.fullmatch(r'stix-agent-v\d+\.\d+\.\d+', tag):
        raise ValueError('Use a semantic release tag such as stix-agent-v0.1.0.')
    directory = ROOT / 'public/stix-agent'
    manifest, runtime = verify_bundle(directory)
    paths = sorted(ROOT_FILES + ['model/manifest.json'] +
                   ['model/' + entry['path'] for entry in manifest['files'].values()] + list(runtime['files']))
    out = ROOT / '.agent-artifacts/releases'
    out.mkdir(parents=True, exist_ok=True)
    archive = out / f'{tag}.zip'
    with zipfile.ZipFile(archive, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=6) as bundle:
        for name in paths:
            source = directory / name
            info = zipfile.ZipInfo(name, date_time=(2026, 9, 9, 0, 0, 0))
            info.compress_type = zipfile.ZIP_DEFLATED
            info.external_attr = 0o100644 << 16
            with source.open('rb') as src, bundle.open(info, 'w') as dst:
                shutil.copyfileobj(src, dst)
    lock = {
        'schemaVersion': 1,
        'tag': tag,
        'url': f'https://github.com/{REPOSITORY}/releases/download/{tag}/{archive.name}',
        'bytes': archive.stat().st_size,
        'sha256': digest(archive),
        'files': {name: {'bytes': (directory / name).stat().st_size, 'sha256': digest(directory / name)} for name in paths},
    }
    LOCK_PATH.write_text(json.dumps(lock, indent=2) + '\n')
    print(f'Packaged {len(paths)} files in {archive} ({lock["bytes"]:,} bytes).')
    print('Publish this archive before pushing the enabled Pages workflow to main.')


def install(archive, root=ROOT, lock_path=LOCK_PATH):
    lock = json.loads(lock_path.read_text())
    if lock['schemaVersion'] != 1:
        raise ValueError('Unsupported release lock.')
    destination = root / 'public/stix-agent'
    # Refuse to overwrite a newer corpus or license with stale release material.
    for name in ROOT_FILES:
        if not matches(destination / name, lock['files'][name]):
            raise ValueError('Checkout and release differ: ' + name)
    if archive is None:
        expected = f'https://github.com/{REPOSITORY}/releases/download/{lock["tag"]}/{lock["tag"]}.zip'
        if lock['url'] != expected or not re.fullmatch(r'stix-agent-v\d+\.\d+\.\d+', lock['tag']):
            raise ValueError('Unexpected release URL or tag.')
        cache = root / '.agent-cache/releases'
        cache.mkdir(parents=True, exist_ok=True)
        archive = cache / (lock['tag'] + '.zip')
        if not matches(archive, lock):
            with tempfile.NamedTemporaryFile(dir=cache, delete=False) as out:
                pending = Path(out.name)
                try:
                    with urllib.request.urlopen(lock['url'], timeout=60) as response:
                        shutil.copyfileobj(response, out)
                    out.close()
                    if not matches(pending, lock):
                        raise ValueError('Downloaded release checksum/size mismatch.')
                    pending.replace(archive)
                finally:
                    pending.unlink(missing_ok=True)
    if not matches(archive, lock):
        raise ValueError('Release archive checksum/size mismatch.')
    # Validate all bytes before installing any file; never use extractall.
    with tempfile.TemporaryDirectory() as temporary, zipfile.ZipFile(archive) as bundle:
        staged = Path(temporary)
        names = bundle.namelist()
        if len(names) != len(set(names)) or set(names) != set(lock['files']):
            raise ValueError('Unexpected or duplicate files in release.')
        for info in bundle.infolist():
            path = PurePosixPath(info.filename)
            if path.is_absolute() or '..' in path.parts or '\\' in info.filename or info.is_dir():
                raise ValueError('Unsafe release path.')
            entry = lock['files'][info.filename]
            if info.file_size != entry['bytes']:
                raise ValueError('Incorrect release member size.')
            target = staged / info.filename
            target.parent.mkdir(parents=True, exist_ok=True)
            with bundle.open(info) as src, target.open('wb') as dst:
                shutil.copyfileobj(src, dst)
            if not matches(target, entry):
                raise ValueError('Release member checksum mismatch: ' + info.filename)
        verify_bundle(staged)
        for name in names:
            if name in ROOT_FILES:
                continue
            target = destination / name
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(staged / name, target)
    print(f'Installed verified {lock["tag"]}; {len(names)} files. Model loads only when the sidebar opens.')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    commands = parser.add_subparsers(dest='command', required=True)
    package = commands.add_parser('pack')
    package.add_argument('--tag', required=True)
    prepare = commands.add_parser('install')
    prepare.add_argument('--archive', type=Path, help='Use an already downloaded release archive.')
    args = parser.parse_args()
    if args.command == 'pack':
        pack(args.tag)
    else:
        install(args.archive)


if __name__ == '__main__':
    main()
