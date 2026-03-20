import { examples } from '../examples';
import { stixObjects } from '../index';

test('has an example for every object type', () => {
  const exampleTypes = Object.keys(examples);
  const objectTypes = stixObjects.map((o) => o.type);
  for (const type of objectTypes) {
    expect(exampleTypes).toContain(type);
  }
});

test('every example has a type field matching its key', () => {
  for (const [key, example] of Object.entries(examples)) {
    expect(example.type).toBe(key);
  }
});

test('every example has an id field', () => {
  for (const example of Object.values(examples)) {
    expect(example.id).toBeTruthy();
  }
});
