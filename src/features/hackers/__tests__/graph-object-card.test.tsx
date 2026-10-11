import { useRef } from 'react';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import type { GraphClient } from '@poietic-tech/graphing-library';
import GraphObjectCard from '../GraphObjectCard';
import { useGraphObjectCard } from '../useGraphObjectCard';
import { hackersObjects, labelOf } from '../../../data/hackers';

const people = hackersObjects.filter(object => object.type === 'threat-actor').slice(0, 2);
const ids = people.map(object => object.id);
const hit = vi.fn(() => ({ kind: 'node', id: ids[0] }));
const client = { nodeAt: hit } as unknown as GraphClient;

function Harness({ nodes = ids, onSelect = vi.fn() }: { nodes?: string[]; onSelect?: (id: string) => void }) {
  const host = useRef<HTMLDivElement>(null);
  const card = useGraphObjectCard(client, host, nodes);
  return <><div ref={host} role="group" aria-label="Graph" tabIndex={0}><canvas width={800} height={600} /></div>
    <GraphObjectCard {...card} onSelect={onSelect} /></>;
}

beforeEach(() => { vi.useFakeTimers(); hit.mockReturnValue({ kind: 'node', id: ids[0] }); });
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });
const advance = (ms: number) => act(() => vi.advanceTimersByTime(ms));
function point() {
  const graph = screen.getByRole('group', { name: 'Graph' });
  const canvas = graph.querySelector('canvas')!;
  vi.spyOn(canvas, 'getBoundingClientRect').mockReturnValue({ left: 20, top: 40, width: 400, height: 300 } as DOMRect);
  fireEvent.pointerMove(canvas, { clientX: 120, clientY: 140, buttons: 0, pointerType: 'mouse' });
  return { graph, canvas };
}

test('hover hit testing respects retina canvas coordinates and shows the actual STIX details', () => {
  render(<Harness />);
  point();
  expect(hit).toHaveBeenCalledWith(200, 200);
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  advance(170);
  const card = screen.getByRole('dialog', { name: labelOf(people[0]) });
  expect(card).toHaveAttribute('aria-modal', 'false');
  expect(within(card).getByText(people[0].id)).toBeInTheDocument();
  expect(within(card).getByText(String(people[0].description))).toBeInTheDocument();
  expect(within(card).getByText('threat-actor')).toBeInTheDocument();
});

test('the card stays open while hovered, selects without navigation, and Escape dismisses without reopening', () => {
  const select = vi.fn();
  render(<Harness onSelect={select} />);
  const { graph, canvas } = point();
  advance(170);
  fireEvent.pointerLeave(graph);
  fireEvent.pointerEnter(screen.getByRole('dialog'));
  advance(500);
  expect(screen.getByRole('dialog')).toBeInTheDocument();
  screen.getByRole('button', { name: 'Select object →' }).focus();
  fireEvent.pointerLeave(screen.getByRole('dialog'));
  advance(500);
  expect(screen.getByRole('dialog')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Select object →' }));
  expect(select).toHaveBeenCalledWith(ids[0]);
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  fireEvent.pointerLeave(graph); advance(200);
  fireEvent.pointerMove(canvas, { clientX: 120, clientY: 140, buttons: 0 }); advance(170);
  expect(screen.getByRole('dialog')).toBeInTheDocument();
  fireEvent.keyDown(document, { key: 'Escape' });
  fireEvent.pointerMove(canvas, { clientX: 121, clientY: 140, buttons: 0 }); advance(300);
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});

test('leaving before the hover delay does not prevent a later preview', () => {
  const { unmount } = render(<Harness />);
  const { graph, canvas } = point();
  fireEvent.pointerLeave(graph);
  fireEvent.pointerMove(canvas, { clientX: 120, clientY: 140, buttons: 0 });
  advance(170);
  expect(screen.getByRole('dialog')).toBeInTheDocument();
  fireEvent.pointerDown(canvas);
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  unmount();
  expect(vi.getTimerCount()).toBe(0);
});

test('keyboard previews are limited to this scene and stale previews/timers are removed on navigation', () => {
  const { rerender, unmount } = render(<Harness />);
  const graph = screen.getByRole('group', { name: 'Graph' });
  fireEvent.keyDown(graph, { key: 'ArrowRight' }); advance(1);
  expect(screen.getByRole('dialog', { name: labelOf(people[0]) })).toBeInTheDocument();
  fireEvent.keyDown(graph, { key: 'ArrowRight' }); advance(1);
  expect(screen.getByRole('dialog', { name: labelOf(people[1]) })).toBeInTheDocument();
  fireEvent.keyDown(graph, { key: 'ArrowRight' }); advance(1);
  expect(screen.getByRole('dialog', { name: labelOf(people[0]) })).toBeInTheDocument();
  rerender(<Harness nodes={[ids[1]]} />);
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  fireEvent.keyDown(graph, { key: 'ArrowRight' });
  unmount();
  expect(vi.getTimerCount()).toBe(0);
});
