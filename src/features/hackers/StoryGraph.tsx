import { useEffect, useMemo, useRef, useState } from 'react';
import { GraphExplorer } from '@poietic-tech/graphing-library/react';
import type { AnimationSpec, GraphClient, StyleSpec } from '@poietic-tech/graphing-library';
import { storyFrames, storyScenes } from './story-scenes';
import { revealStoryGraph } from './story-graph';
import { typeShapeRules } from './graph-shapes';
import ShapeLegend from './ShapeLegend';

const simulation = { link_distance: 150, charge_strength: -750, alpha_decay: 0.045 };

export default function StoryGraph({ step, selected, onSelect, onReady, onInteract }: {
  step: number; selected: string | null; onSelect: (id: string) => void;
  onReady: (ready: boolean) => void; onInteract: () => void;
}) {
  const [client, setClient] = useState<GraphClient | null>(null);
  const [error, setError] = useState('');
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const host = useRef<HTMLDivElement>(null);
  const loaded = useRef<{ client: GraphClient; graph: (typeof storyFrames)[number]['graph'] } | null>(null);
  const frame = storyFrames[step];

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(query.matches);
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  const animation = useMemo<AnimationSpec>(() => ({
    reduced_motion: reducedMotion, halo: { enabled: false },
    transition: { duration_ms: 700, easing: 'ease-in-out', layout_tween: true, camera_follow: true, fit_on_settle: true },
  }), [reducedMotion]);
  const style = useMemo<StyleSpec>(() => ({
    node_base: { color: '#91a9b8', radius: 13, opacity: .5, label_visible: true },
    node_rules: [
      ...typeShapeRules,
      { when: { attr: 'stix_id', one_of: frame.activeIds }, set: { color: '#b1daeb', opacity: 1 } },
      { when: { attr: 'stix_id', one_of: storyScenes[step].introduced }, set: { color: '#f1b86a', radius: 17, opacity: 1 } },
      { when: { attr: 'stix_id', equals: selected ?? '' }, set: { color: '#fff0c7', radius: 20, opacity: 1 } },
    ],
    edge_base: { color: '#6d889a', width: 1.3, opacity: .3, label_visible: false, label_attr: 'label' },
    edge_rules: [{ when: { attr: 'edge_id', one_of: frame.newEdges.map(e => e.id) }, set: { color: '#f1b86a', width: 2.5, opacity: 1, label_visible: true } }],
    labels: { min_screen_radius_px: 2, max_labels: 32, edge_min_screen_length_px: 65, max_edge_labels: 10 },
  }), [frame, step, selected]);

  useEffect(() => {
    if (!client) return;
    try {
      revealStoryGraph(client, loaded.current?.client === client ? loaded.current.graph : null, frame.graph);
      loaded.current = { client, graph: frame.graph };
      onReady(true);
    } catch {
      onReady(false);
      // Report a failure from the imperative WASM operation, not derived React state.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setError('The graph could not update. You can still follow the story and its object list.');
    }
  }, [client, frame, onReady]);

  useEffect(() => {
    if (!client || !host.current) return;
    let raf = 0;
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => client.fitView());
    });
    observer.observe(host.current);
    return () => { observer.disconnect(); cancelAnimationFrame(raf); };
  }, [client]);

  return <>
    <div ref={host} className="story-canvas" role="group" aria-label="Story graph" onPointerDown={onInteract} onWheel={onInteract}>
      <GraphExplorer style={{ position: 'absolute', inset: 0 }} styleSpec={style} animationSpec={animation} simulationSpec={simulation} background="#101a24"
        focusOnClick={false} onReady={setClient} onNodeClick={node => { if (node) onSelect(node.id); }} />
      {error && <p role="alert" className="story-graph-error">{error}</p>}
    </div>
    <div className="story-graph-tools">
      <span><i className="story-dot new" /> New this scene <i className="story-dot" /> Already revealed</span>
      <div className="case-segment" aria-label="Story graph zoom">
        <button aria-label="Zoom out" disabled={!client} onClick={() => { onInteract(); client?.zoomOut(); }}>−</button>
        <button disabled={!client} onClick={() => { onInteract(); client?.fitView(); }}>Fit</button>
        <button aria-label="Zoom in" disabled={!client} onClick={() => { onInteract(); client?.zoomIn(); }}>+</button>
      </div>
    </div>
    <ShapeLegend />
  </>;
}
