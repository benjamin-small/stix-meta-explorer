"""Validate the owned bundle and pattern fixtures with the OASIS Python tools.

Install scripts/hackers-validation-requirements.txt in an isolated environment.
"""
import copy
import importlib.metadata
import json
from pathlib import Path

from stix2 import parse
from stix2matcher.matcher import match
from stix2patterns.validator import run_validator
from stix2validator import ValidationOptions, validate_instance

root = Path(__file__).resolve().parents[1]
bundle = json.loads((root / 'src/data/hackers-1995/bundle.json').read_text())
fixtures = json.loads((root / 'src/data/hackers-1995/patterns.json').read_text())
parsed = parse(bundle, version='2.1')
validation = validate_instance(bundle, ValidationOptions(version='2.1', enforce_refs=True))
results = []

for fixture in fixtures:
    pattern = fixture['pattern']
    errors = run_validator(pattern, stix_version='2.1')
    ids = set()
    if not errors:
        if any(operator in pattern for operator in ('] AND [', '] OR [', '] FOLLOWEDBY [')):
            matched = match(pattern, [copy.deepcopy(bundle)], stix_version='2.1')
            ids = {obj['id'] for piece in matched for obj in piece['objects'] if obj['type'] == 'observed-data'}
        else:
            for observed in (obj for obj in bundle['objects'] if obj['type'] == 'observed-data'):
                piece = copy.deepcopy(bundle)
                piece['objects'] = [obj for obj in piece['objects'] if obj['type'] != 'observed-data' or obj['id'] == observed['id']]
                if match(pattern, [piece], stix_version='2.1'):
                    ids.add(observed['id'])
    results.append({
        'name': fixture['name'], 'grammar_errors': errors, 'observed_data': sorted(ids),
        'passed': not errors and sorted(ids) == sorted(fixture['expect']['observed_data'])
        and bool(ids) == fixture['expect']['matched'],
    })

print(json.dumps({
    'tools': {name: importlib.metadata.version(name) for name in ('stix2-validator', 'stix2', 'stix2-patterns', 'stix2-matcher')},
    'object_count': len(parsed.objects),
    'validator': {'valid': validation.is_valid, 'errors': [str(e) for e in validation.errors], 'warnings': [str(w) for w in validation.warnings]},
    'patterns': results,
}, indent=2))
raise SystemExit(0 if validation.is_valid and all(result['passed'] for result in results) else 1)
