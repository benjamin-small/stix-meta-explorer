import { stixObjects, getObjectByType } from '../index';
import type { StixCategory } from '../../types/stix';

test('contains exactly 43 object types', () => {
  expect(stixObjects).toHaveLength(43);
});

test('has correct category counts', () => {
  const counts = stixObjects.reduce(
    (acc, obj) => {
      acc[obj.category]++;
      return acc;
    },
    { sdo: 0, sro: 0, sco: 0, meta: 0 } as Record<StixCategory, number>
  );
  expect(counts.sdo).toBe(19);
  expect(counts.sro).toBe(2);
  expect(counts.sco).toBe(18);
  expect(counts.meta).toBe(4);
});

test('every object has required fields', () => {
  for (const obj of stixObjects) {
    expect(obj.type).toBeTruthy();
    expect(obj.name).toBeTruthy();
    expect(obj.category).toBeTruthy();
    expect(obj.description).toBeTruthy();
    expect(obj.properties.length).toBeGreaterThan(0);
    expect(obj.specUrl).toMatch(/^https:\/\//);
  }
});

test('getObjectByType returns correct object', () => {
  const ap = getObjectByType('attack-pattern');
  expect(ap).toBeDefined();
  expect(ap!.name).toBe('Attack Pattern');
  expect(ap!.category).toBe('sdo');
});

test('getObjectByType returns undefined for invalid type', () => {
  expect(getObjectByType('nonexistent')).toBeUndefined();
});

test('no duplicate type values', () => {
  const types = stixObjects.map((o) => o.type);
  expect(new Set(types).size).toBe(types.length);
});

test('every object has at least one non-common property', () => {
  for (const obj of stixObjects) {
    const unique = obj.properties.filter((p) => !p.isCommon);
    expect(unique.length).toBeGreaterThan(0);
  }
});
