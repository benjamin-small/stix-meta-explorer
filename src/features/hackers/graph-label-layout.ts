export type LabelTone = 'selected' | 'new' | 'normal' | 'muted';
export interface LabelNode {
  id: string;
  text: string;
  radius: number;
  priority: number;
  tone: LabelTone;
  visible?: boolean;
}
export interface ScreenLabelNode extends LabelNode { x: number; y: number }
export interface LabelEdge {
  id: string;
  source: string;
  target: string;
  text: string;
  priority: number;
  tone: LabelTone;
}
export interface LabelBox {
  id: string;
  text: string;
  fullText: string;
  kind: 'node' | 'edge';
  tone: LabelTone;
  x: number;
  y: number;
  width: number;
  height: number;
  leader?: { x: number; y: number; endX: number; endY: number };
}
export const LABEL_FONT = '600 12px system-ui, sans-serif';
const PAD = 8;
const HEIGHT = 22;
const GAP = 4;
const INSET = 6;

type Rect = Pick<LabelBox, 'x' | 'y' | 'width' | 'height'>;
export function boxesOverlap(a: Rect, b: Rect, gap = GAP) {
  return a.x < b.x + b.width + gap && a.x + a.width + gap > b.x &&
    a.y < b.y + b.height + gap && a.y + a.height + gap > b.y;
}

function shorten(text: string, available: number, measure: (text: string) => number) {
  if (measure(text) <= available) return text;
  const chars = Array.from(text);
  let lo = 0, hi = chars.length;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    if (measure(chars.slice(0, mid).join('') + '…') <= available) lo = mid;
    else hi = mid - 1;
  }
  return lo >= 3 ? chars.slice(0, lo).join('').trimEnd() + '…' : '';
}

// All geometry is in CSS pixels. Lower priorities are placed first; no label
// displaces a higher-priority label or a node. Crowding removes text, not data.
export function layoutGraphLabels(nodes: ScreenLabelNode[], edges: LabelEdge[], width: number, height: number,
  measure: (text: string) => number): LabelBox[] {
  if (width < 64 || height < HEIGHT + PAD * 2) return [];
  const onScreen = nodes.filter(n => Number.isFinite(n.x) && Number.isFinite(n.y) &&
    n.x >= 0 && n.x <= width && n.y >= 0 && n.y <= height);
  const byId = new Map(onScreen.map(n => [n.id, n]));
  const obstacles = onScreen.map(n => ({ x: n.x - n.radius, y: n.y - n.radius, width: n.radius * 2, height: n.radius * 2 }));
  const candidates = [
    ...onScreen.filter(n => n.visible !== false && n.text).map(n => ({
      ...n, id: `node:${n.id}`, kind: 'node' as const,
    })),
    ...edges.flatMap(e => {
      const a = byId.get(e.source), b = byId.get(e.target);
      if (!a || !b || Math.hypot(a.x - b.x, a.y - b.y) < 90) return [];
      return [{ ...e, id: `edge:${e.id}`, kind: 'edge' as const, radius: 0,
        x: (a.x + b.x) / 2, y: (a.y + b.y) / 2,
        offsetX: (b.x - a.x) * 0.15, offsetY: (b.y - a.y) * 0.15 }];
    }),
  ].sort((a, b) => a.priority - b.priority || a.id.localeCompare(b.id));
  const placed: LabelBox[] = [];
  const limit = Math.min(32, Math.max(6, Math.floor(width * height / 10000)));
  for (const label of candidates) {
    if (placed.length >= limit) break;
    const maxWidth = Math.min(label.kind === 'edge' ? 150 : 230, width - PAD * 2);
    const fullWidth = Math.ceil(measure(label.text)) + INSET * 2;
    const widths = [...new Set([Math.min(fullWidth, maxWidth), Math.min(fullWidth, maxWidth, 130)])];
    let found: LabelBox | undefined;
    for (const available of widths) {
      const text = shorten(label.text, available - INSET * 2, measure);
      if (!text) continue;
      const w = Math.ceil(measure(text)) + INSET * 2;
      const r = label.radius + GAP + 1;
      const centered = Math.max(PAD, Math.min(width - PAD - w, label.x - w / 2));
      const positions = label.kind === 'edge' ? [0, -1, 1].flatMap(direction => {
        const x = label.x + direction * label.offsetX - w / 2;
        const y = label.y + direction * label.offsetY;
        return [[x, y - HEIGHT / 2], [x, y - HEIGHT - GAP], [x, y + GAP]];
      }) : (label.priority === 0 ? [0, 26, 52] : [0]).flatMap(offset => [
        [label.x + r + offset, label.y - HEIGHT / 2, offset],
        [label.x - r - offset - w, label.y - HEIGHT / 2, offset],
        [centered, label.y - r - offset - HEIGHT, offset],
        [centered, label.y + r + offset, offset],
        [label.x + r + offset, label.y - r - offset - HEIGHT, offset],
        [label.x - r - offset - w, label.y - r - offset - HEIGHT, offset],
        [label.x + r + offset, label.y + r + offset, offset],
        [label.x - r - offset - w, label.y + r + offset, offset],
      ]);
      for (const [x, y, offset] of positions) {
        const box: LabelBox = { id: label.id, text, fullText: label.text, kind: label.kind, tone: label.tone,
          x: Math.round(x), y: Math.round(y), width: w, height: HEIGHT };
        if (box.x < PAD || box.y < PAD || box.x + w > width - PAD || box.y + HEIGHT > height - PAD) continue;
        if (placed.some(other => boxesOverlap(box, other)) || obstacles.some(other => boxesOverlap(box, other, 2))) continue;
        if (offset) {
          const endX = Math.max(box.x, Math.min(box.x + w, label.x));
          const endY = Math.max(box.y, Math.min(box.y + HEIGHT, label.y));
          const length = Math.hypot(endX - label.x, endY - label.y);
          box.leader = { x: label.x + (endX - label.x) * label.radius / length,
            y: label.y + (endY - label.y) * label.radius / length, endX, endY };
        }
        found = box;
        break;
      }
      if (found) break;
    }
    if (found) placed.push(found);
  }
  return placed;
}
