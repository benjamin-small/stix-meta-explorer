import { boxesOverlap, layoutGraphLabels, type ScreenLabelNode, type LabelEdge, type LabelBox } from '../graph-label-layout';

const measure = (text: string) => Array.from(text).length * 7;
const node = (id: string, x: number, y: number, extra: Partial<ScreenLabelNode> = {}): ScreenLabelNode =>
  ({ id, x, y, text: id, radius: 6, priority: 2, tone: 'normal', ...extra });
function expectReadable(labels: LabelBox[], width: number, height: number) {
  for (const label of labels) {
    expect(label.x).toBeGreaterThanOrEqual(8);
    expect(label.y).toBeGreaterThanOrEqual(8);
    expect(label.x + label.width).toBeLessThanOrEqual(width - 8);
    expect(label.y + label.height).toBeLessThanOrEqual(height - 8);
    expect(measure(label.text)).toBeLessThanOrEqual(label.width - 12);
    for (const other of labels) if (other !== label) expect(boxesOverlap(label, other)).toBe(false);
  }
}

test('flips edge-adjacent labels inward and keeps long text inside a narrow panel', () => {
  const labels = layoutGraphLabels([
    node('right', 297, 50), node('left', 3, 110),
    node('long', 160, 210, { text: 'http://ellingson-mineral.example/gibson/garbage' }),
  ], [], 300, 300, measure);
  expect(labels).toHaveLength(3);
  expect(labels.find(l => l.id === 'node:right')!.x).toBeLessThan(297);
  expect(labels.find(l => l.id === 'node:left')!.x).toBeGreaterThan(3);
  const long = labels.find(l => l.id === 'node:long')!;
  expect(long.text.endsWith('…')).toBe(true);
  expect(long.fullText).toBe('http://ellingson-mineral.example/gibson/garbage');
  expectReadable(labels, 300, 300);
});

test('selected objects win crowded space and hidden/distant objects never acquire labels', () => {
  const nodes = Array.from({ length: 25 }, (_, i) => node(`object-${i}`, 150, 100));
  nodes.push(node('selected', 150, 100, { priority: 0, tone: 'selected' }));
  nodes.push(node('distant', 60, 250, { visible: false }));
  const labels = layoutGraphLabels(nodes, [], 300, 300, measure);
  expect(labels[0].id).toBe('node:selected');
  expect(labels.length).toBeLessThan(nodes.length);
  expect(labels.map(l => l.id)).not.toContain('node:distant');
  expectReadable(labels, 300, 300);
});

test('relationship labels share collision space with nodes and require visible separated endpoints', () => {
  const nodes = [node('a', 30, 100), node('b', 270, 100), node('c', 160, 100, { text: 'Selected object', priority: 0 })];
  const edges: LabelEdge[] = [
    { id: 'ab', source: 'a', target: 'b', text: 'uses', priority: 1, tone: 'selected' },
    { id: 'missing', source: 'a', target: 'offscreen', text: 'targets', priority: 1, tone: 'normal' },
    { id: 'short', source: 'a', target: 'a', text: 'uses', priority: 1, tone: 'normal' },
  ];
  const labels = layoutGraphLabels(nodes, edges, 300, 240, measure);
  expect(labels.some(l => l.id === 'edge:ab')).toBe(true);
  expect(labels.some(l => l.id === 'edge:missing' || l.id === 'edge:short')).toBe(false);
  expectReadable(labels, 300, 240);
  for (const label of labels) for (const n of nodes) {
    expect(boxesOverlap(label, { x: n.x - n.radius, y: n.y - n.radius, width: n.radius * 2, height: n.radius * 2 }, 0)).toBe(false);
  }
});

test('selected labels escape a tight cluster with a connector to their own node', () => {
  const labels = layoutGraphLabels([
    node('selected', 150, 100, { text: 'Zero Cool', priority: 0, tone: 'selected' }),
    ...[-20, 0, 20].flatMap(x => [-20, 0, 20].map(y => node(`${x}-${y}`, 150 + x, 100 + y, { visible: false, radius: 12 }))),
  ], [], 300, 240, measure);
  expect(labels).toHaveLength(1);
  expect(labels[0].text).toBe('Zero Cool');
  expect(labels[0].leader).toBeDefined();
  expect(Math.hypot(labels[0].leader!.x - 150, labels[0].leader!.y - 100)).toBeCloseTo(6);
  expectReadable(labels, 300, 240);
});

test('dense layouts stay within bounds without overlaps across narrow and wide sizes', () => {
  for (const width of [160, 240, 320, 400, 800]) {
    const nodes = Array.from({ length: 40 }, (_, i) => node(`object-${i}`, (i * 73 + 13) % width, (i * 91 + 7) % 340, {
      text: i % 3 ? `Object ${i}` : `A long STIX object name ${i}`, priority: i < 6 ? 1 : 4,
    }));
    const labels = layoutGraphLabels(nodes, [], width, 340, measure);
    expect(labels.length).toBeGreaterThan(0);
    expectReadable(labels, width, 340);
  }
  expect(layoutGraphLabels([node('a', NaN, 20)], [], 300, 200, measure)).toEqual([]);
  expect(layoutGraphLabels([node('a', 20, 20)], [], 40, 30, measure)).toEqual([]);
});
