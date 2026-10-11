import type { GraphClient } from '@poietic-tech/graphing-library';
import { followStoryLayout } from '../story-camera';

beforeEach(() => vi.useFakeTimers());
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });

test('refits after initially hidden nodes settle, then stops consuming frames', () => {
  const fitView = vi.fn();
  let moving = true;
  const client = { fitView, zoom: vi.fn(), graphNodes: () => [{ id: 'node', x: moving ? null : 150, y: moving ? null : 150 }] } as unknown as GraphClient;
  followStoryLayout(client);
  vi.advanceTimersByTime(1200);
  const firstFits = fitView.mock.calls.length;
  expect(firstFits).toBeGreaterThan(1);
  moving = false;
  vi.advanceTimersByTime(1500);
  expect(fitView.mock.calls.length).toBeGreaterThan(firstFits);
  const settledFits = fitView.mock.calls.length;
  vi.advanceTimersByTime(10000);
  expect(fitView).toHaveBeenCalledTimes(settledFits);
  expect(vi.getTimerCount()).toBe(0);
});

test('manual interaction or scene cleanup cancels pending framing', () => {
  const fitView = vi.fn();
  const client = { fitView, zoom: vi.fn(), graphNodes: () => [{ id: 'moving', x: null, y: null }] } as unknown as GraphClient;
  const cancel = followStoryLayout(client);
  vi.advanceTimersByTime(100);
  cancel();
  const count = fitView.mock.calls.length;
  vi.advanceTimersByTime(20000);
  expect(fitView).toHaveBeenCalledTimes(count);
  expect(vi.getTimerCount()).toBe(0);
});
