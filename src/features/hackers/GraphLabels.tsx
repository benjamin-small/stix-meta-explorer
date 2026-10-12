import { useEffect, useRef, type RefObject } from 'react';
import type { GraphClient } from '@poietic-tech/graphing-library';
import { LABEL_FONT, layoutGraphLabels, type LabelNode, type LabelEdge } from './graph-label-layout';
import './graph-labels.css';

export default function GraphLabels({ client, host, nodes, edges }: {
  client: GraphClient | null;
  host: RefObject<HTMLDivElement | null>;
  nodes: LabelNode[];
  edges: LabelEdge[];
}) {
  const layer = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = host.current, overlay = layer.current;
    if (!client || !element || !overlay) return;
    const canvas = element.querySelector('canvas');
    if (!canvas) return;
    const context = document.createElement('canvas').getContext('2d');
    if (!context) return;
    context.font = LABEL_FONT;
    const definitions = new Map(nodes.map(n => [n.id, n]));
    let raf = 0;
    let disposed = false;
    let lastMarkup = '';
    const tick = () => {
      raf = 0;
      if (disposed || document.hidden) return;
      const { width, height } = canvas.getBoundingClientRect();
      if (width && height && canvas.width && canvas.height) {
        // Public engine coordinates are physical pixels, including on Retina.
        const sx = width / canvas.width, sy = height / canvas.height;
        const origin = client.project(0, 0), unit = client.project(1, 0);
        const scale = origin && unit ? Math.hypot((unit.x - origin.x) * sx, (unit.y - origin.y) * sy) : 1;
        const points = client.visibleNodes().flatMap(n => {
          const definition = definitions.get(n.id);
          if (!definition || n.x === null || n.y === null) return [];
          return [{ ...definition, x: n.x * sx, y: n.y * sy, radius: Math.max(3, definition.radius * scale * 1.15) }];
        });
        const labels = layoutGraphLabels(points, edges, width, height, text => context.measureText(text).width);
        const markup = JSON.stringify(labels);
        if (markup !== lastMarkup) {
          lastMarkup = markup;
          // This isolated, pointer-transparent layer owns its text only. React
          // and the library retain ownership of the graph and all interaction.
          const leaders = labels.flatMap(label => {
            if (!label.leader) return [];
            const { x, y, endX, endY } = label.leader;
            const line = document.createElement('span');
            line.className = 'graph-label-leader';
            Object.assign(line.style, { left: `${x}px`, top: `${y}px`,
              width: `${Math.hypot(endX - x, endY - y)}px`,
              transform: `rotate(${Math.atan2(endY - y, endX - x)}rad)` });
            return [line];
          });
          overlay.replaceChildren(...leaders, ...labels.map(label => {
            const span = document.createElement('span');
            span.className = `graph-label ${label.kind} ${label.tone}`;
            span.dataset.labelId = label.id;
            span.dataset.fullText = label.fullText;
            span.textContent = label.text;
            Object.assign(span.style, { left: `${label.x}px`, top: `${label.y}px`, width: `${label.width}px`, height: `${label.height}px` });
            return span;
          }));
        }
      }
      // Follow live physics/camera motion, then park alongside the renderer.
      if (client.scheduled) raf = requestAnimationFrame(tick);
    };
    const wake = () => { if (!disposed && !raf) raf = requestAnimationFrame(tick); };
    // Engine events may fire inside a WASM call; defer queries to the next frame.
    const off = [client.on('viewport', wake), client.on('mutate', wake)];
    const observer = new ResizeObserver(wake);
    observer.observe(element);
    element.addEventListener('pointermove', wake);
    element.addEventListener('pointerdown', wake);
    element.addEventListener('pointerup', wake);
    element.addEventListener('wheel', wake, { passive: true });
    document.addEventListener('visibilitychange', wake);
    wake();
    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      off.forEach(unsubscribe => unsubscribe());
      observer.disconnect();
      element.removeEventListener('pointermove', wake);
      element.removeEventListener('pointerdown', wake);
      element.removeEventListener('pointerup', wake);
      element.removeEventListener('wheel', wake);
      document.removeEventListener('visibilitychange', wake);
      overlay.replaceChildren();
    };
  }, [client, host, nodes, edges]);
  return <div ref={layer} className="graph-labels" aria-hidden="true" />;
}
