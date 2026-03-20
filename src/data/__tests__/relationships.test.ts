import { relationships } from '../relationships';
import { stixObjects, getObjectByType } from '../index';

test('relationship map has entries', () => {
  expect(relationships.length).toBeGreaterThan(0);
});

test('every relationship references valid source and target types', () => {
  const validTypes = new Set(stixObjects.map((o) => o.type));
  for (const rel of relationships) {
    expect(validTypes.has(rel.sourceType)).toBe(true);
    for (const target of rel.targetTypes) {
      expect(validTypes.has(target)).toBe(true);
    }
  }
});

test('attack-pattern has outgoing relationships', () => {
  const ap = getObjectByType('attack-pattern');
  expect(ap!.relationships.outgoing.length).toBeGreaterThan(0);
  const targets = ap!.relationships.outgoing.find((r) => r.relationshipType === 'targets');
  expect(targets).toBeDefined();
  expect(targets!.objectTypes).toContain('identity');
});

test('identity has incoming relationships', () => {
  const identity = getObjectByType('identity');
  expect(identity!.relationships.incoming.length).toBeGreaterThan(0);
});

test('contains all 32 distinct relationship types', () => {
  const types = new Set(relationships.map((r) => r.relationshipType));
  expect(types.size).toBe(32);
});
