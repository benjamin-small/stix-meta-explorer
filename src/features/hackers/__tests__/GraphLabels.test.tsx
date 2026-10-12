import { createRef } from 'react';
import { act, fireEvent, render } from '@testing-library/react';
import type { GraphClient } from '@poietic-tech/graphing-library';
import GraphLabels from '../GraphLabels';
import type { LabelNode } from '../graph-label-layout';

let frames: Map<number, FrameRequestCallback>;
let resize: ResizeObserverCallback;
let callbacks: Map<string, () => void>;
let width: number;
let points: { id: string; x: number; y: number }[];
let scheduled: boolean;
let client: GraphClient;
const definitions: LabelNode[] = [{ id: 'a', text: 'Zero Cool', radius: 10, priority: 0, tone: 'selected' }];
const edges: [] = [];

beforeEach(() => {
  frames = new Map(); callbacks = new Map(); width = 300; points = [{ id: 'a', x: 400, y: 200 }]; scheduled = false;
  let next = 0;
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => { frames.set(++next, cb); return next; });
  vi.stubGlobal('cancelAnimationFrame', (id: number) => frames.delete(id));
  vi.stubGlobal('ResizeObserver', class { constructor(cb: ResizeObserverCallback) { resize = cb; } observe() {} disconnect() {} });
  vi.spyOn(HTMLCanvasElement.prototype, 'getBoundingClientRect').mockImplementation(() => ({ width, height: 200 } as DOMRect));
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({ measureText: (text: string) => ({ width: text.length * 7 }) } as CanvasRenderingContext2D);
  client = { visibleNodes: vi.fn(() => points), project: (x: number, y: number) => ({ x: x * 2, y: y * 2 }),
    get scheduled() { return scheduled; }, on: (event: string, callback: () => void) => {
      callbacks.set(event, callback); return () => callbacks.delete(event);
    } } as unknown as GraphClient;
});
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });
const flush = () => act(() => { const pending = [...frames.values()]; frames.clear(); pending.forEach(fn => fn(0)); });
function mount() {
  const host = createRef<HTMLDivElement>();
  const view = render(<div ref={host}><canvas width={600} height={400} /><GraphLabels client={client} host={host} nodes={definitions} edges={edges} /></div>);
  return { ...view, host, label: () => view.container.querySelector<HTMLElement>('.graph-label')! };
}

test('converts Retina coordinates, follows camera/resize changes and parks when idle', () => {
  const view = mount();
  flush();
  expect(view.label().textContent).toBe('Zero Cool');
  expect(parseFloat(view.label().style.left)).toBeGreaterThan(200);
  expect(parseFloat(view.label().style.left)).toBeLessThan(230);
  expect(frames.size).toBe(0);
  expect(view.container.querySelector('.graph-labels')).toHaveAttribute('aria-hidden', 'true');
  points = [{ id: 'a', x: 80, y: 200 }];
  act(() => callbacks.get('viewport')!());
  flush();
  expect(parseFloat(view.label().style.left)).toBeLessThan(80);
  width = 200;
  act(() => resize([], {} as ResizeObserver));
  flush();
  expect(parseFloat(view.label().style.left) + parseFloat(view.label().style.width)).toBeLessThanOrEqual(192);
  view.unmount();
  expect(callbacks.size).toBe(0);
  expect(frames.size).toBe(0);
});

test('keeps labels attached during physics and removes them when a node leaves the viewport', () => {
  const view = mount();
  scheduled = true;
  flush();
  expect(frames.size).toBe(1);
  points = [{ id: 'a', x: 200, y: 200 }];
  scheduled = false;
  flush();
  expect(parseFloat(view.label().style.left)).toBeGreaterThan(100);
  expect(frames.size).toBe(0);
  points = [];
  fireEvent.pointerMove(view.host.current!);
  flush();
  expect(view.label()).toBeNull();
  view.unmount();
  expect(frames.size).toBe(0);
});
