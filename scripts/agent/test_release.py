"""Publication integrity checks without loading the large production model."""
import hashlib
import json
from pathlib import Path
import tempfile
import unittest
import zipfile
from unittest.mock import patch
from release import ROOT_FILES, install


class ReleaseTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.files = {name: name.encode() for name in ROOT_FILES}
        self.files['model/manifest.json'] = b'{}'
        self.archive = self.root / 'release.zip'
        self.lock = self.root / 'lock.json'
        for name in ROOT_FILES:
            target = self.root / 'public/stix-agent' / name
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(self.files[name])
        self.package()

    def package(self):
        with zipfile.ZipFile(self.archive, 'w') as bundle:
            for name, content in self.files.items():
                bundle.writestr(name, content)
        entry = lambda value: {'bytes': len(value), 'sha256': hashlib.sha256(value).hexdigest()}
        self.lock.write_text(json.dumps({'schemaVersion': 1, 'tag': 'test', **entry(self.archive.read_bytes()), 'files': {name: entry(value) for name, value in self.files.items()}}))

    def test_rejects_corrupt_archive_before_install(self):
        self.archive.write_bytes(b'corrupt')
        with self.assertRaisesRegex(ValueError, 'archive checksum'):
            install(self.archive, self.root, self.lock)
        self.assertFalse((self.root / 'public/stix-agent/model').exists())

    def test_rejects_checkout_reference_mismatch(self):
        (self.root / 'public/stix-agent/knowledge.json').write_text('different references')
        with self.assertRaisesRegex(ValueError, 'Checkout and release differ'):
            install(self.archive, self.root, self.lock)

    def test_rejects_path_traversal_even_in_a_matching_lock(self):
        self.files['../escape.txt'] = b'unsafe'
        self.package()
        with self.assertRaisesRegex(ValueError, 'Unsafe release path'):
            install(self.archive, self.root, self.lock)

    def test_does_not_install_if_bundle_validation_fails(self):
        with patch('release.verify_bundle', side_effect=ValueError('invalid model')):
            with self.assertRaisesRegex(ValueError, 'invalid model'):
                install(self.archive, self.root, self.lock)
        self.assertFalse((self.root / 'public/stix-agent/model').exists())

    def test_installs_verified_files(self):
        with patch('release.verify_bundle') as verify:
            install(self.archive, self.root, self.lock)
            verify.assert_called_once()
        self.assertEqual((self.root / 'public/stix-agent/model/manifest.json').read_bytes(), b'{}')


if __name__ == '__main__':
    unittest.main()
