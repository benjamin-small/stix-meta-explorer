import { expect, test } from 'vitest';
import { isMemoryFailure } from '../runtime-errors';

test.each([
  new RangeError('WebAssembly.Memory.grow(): Unable to grow instance memory'),
  new Error('memory allocation of 671088640 bytes failed'),
  new Error('GPU buffer allocation failed'),
  new Error('out of memory'),
])('recognizes catchable allocation failures: %s', error => {
  expect(isMemoryFailure(error)).toBe(true);
});
test('does not label a missing model or GPU adapter as an allocation failure', () => {
  expect(isMemoryFailure(new Error('Could not load model (HTTP 404)'))).toBe(false);
  expect(isMemoryFailure(new Error('WebGPU adapter unavailable'))).toBe(false);
});
