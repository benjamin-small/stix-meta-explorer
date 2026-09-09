import { afterEach, expect, test, vi } from 'vitest';
import { assessDevice, previousRuntimeSession, startRuntimeSession } from '../availability';

afterEach(() => { vi.unstubAllGlobals(); sessionStorage.clear(); });
test.each([0.25, 0.5, 1, 2, 4])('blocks approximately %s GB RAM', deviceMemory => {
  expect(assessDevice({ deviceMemory })).toMatchObject({ status: 'blocked', reason: 'memory', memoryGB: deviceMemory });
});
test.each([undefined, 0, -1, NaN, Infinity])('does not mistake invalid or missing RAM (%s) for sufficient memory', deviceMemory => {
  expect(assessDevice({ deviceMemory })).toMatchObject({ status: 'confirm', reason: 'unknown' });
});
test.each([
  { userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_0 like Mac OS X) AppleWebKit/605.1.15 Safari/604.1' },
  { userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_0 like Mac OS X) AppleWebKit/605.1.15 CriOS/140 Mobile/15E148 Safari/604.1' },
  { userAgent: 'Mozilla/5.0 (Linux; Android 16; Pixel 10) AppleWebKit/537.36 Chrome/140 Mobile Safari/537.36' },
  { userAgent: 'Mozilla/5.0 (Linux; Android 16) AppleWebKit/537.36 Chrome/140 Safari/537.36' },
  { userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15) AppleWebKit/605.1.15', platform: 'MacIntel', maxTouchPoints: 5 },
  { userAgentData: { mobile: true } },
])('blocks mobile/tablet hints even with high reported RAM: %j', hints => {
  expect(assessDevice({ ...hints, deviceMemory: 16 })).toMatchObject({ status: 'blocked', reason: 'mobile' });
});
test('does not block a Windows touch laptop or ordinary Mac by touch or UA alone', () => {
  expect(assessDevice({ platform: 'Win32', maxTouchPoints: 10, deviceMemory: 8 }).status).toBe('allowed');
  expect(assessDevice({ platform: 'MacIntel', maxTouchPoints: 0, deviceMemory: 8 }).status).toBe('allowed');
});
test('records an active runtime until explicitly released, and old cleanup cannot clear a newer session', () => {
  expect(previousRuntimeSession()).toBeNull();
  const clearOld = startRuntimeSession();
  expect(previousRuntimeSession()).toBe('interrupted');
  const clearNew = startRuntimeSession();
  clearOld();
  expect(previousRuntimeSession()).toBe('interrupted');
  clearNew();
  expect(previousRuntimeSession()).toBeNull();
});
test('unavailable storage requires confirmation and never prevents runtime cleanup', () => {
  vi.stubGlobal('sessionStorage', { getItem() { throw Error('blocked'); }, setItem() { throw Error('blocked'); } });
  expect(previousRuntimeSession()).toBe('unavailable');
  expect(() => startRuntimeSession()()).not.toThrow();
});
