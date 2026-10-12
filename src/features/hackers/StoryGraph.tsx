import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { GraphExplorer } from '@poietic-tech/graphing-library/react';
import type { AnimationSpec, GraphClient, StyleSpec } from '@poietic-tech/graphing-library';
import { storyFrames, storyScenes } from './story-scenes';
import { revealStoryGraph } from './story-graph';
import { typeShapeRules } from './graph-shapes';
import ShapeLegend from './ShapeLegend';
import GraphLabels from './GraphLabels';
import type { LabelNode, LabelEdge } from './graph-label-layout';
import { fitStoryGraph, followStoryLayout } from './story-camera';
import GraphObjectCard from './GraphObjectCard';
import { useGraphObjectCard } from './useGraphObjectCard';

const simulation = { link_distance: 150, charge_strength: -750, alpha_decay: 0.045 };

export default function StoryGraph({ step, selected, onSelect, onReady }: {
  step: number; selected: string | null; onSelect: (id: string) => void;
  onReady: (ready: boolean) => void;
}) {
  const [client, setClient] = useState<GraphClient | null>(null);
  const [error, setError] = useState('');
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const host = useRef<HTMLDivElement>(null);
  const loaded = useRef<{ client: GraphClient; graph: (typeof storyFrames)[number]['graph'] } | null>(null);
  const frame = storyFrames[step];
  const nodeIds = useMemo(() => frame.graph.nodes.map(node => node.id), [frame]);
  const card = useGraphObjectCard(client, host, nodeIds);
  const cancelFit = useRef<(() => void) | null>(null);
  const stopFollowing = () => { cancelFit.current?.(); cancelFit.current = null; };
  const followLayout = useCallback(() => {
    cancelFit.current?.();
    if (client) cancelFit.current = followStoryLayout(client);
  }, [client]);

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(query.matches);
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  const animation = useMemo<AnimationSpec>(() => ({
    reduced_motion: reducedMotion, halo: { enabled: false },
    transition: { duration_ms: 700, easing: 'ease-in-out', layout_tween: true, camera_follow: false, fit_on_settle: true },
  }), [reducedMotion]);
  const style = useMemo<StyleSpec>(() => ({
    node_base: { color: '#91a9b8', radius: 13, opacity: .5, label_visible: false },
    node_rules: [
      ...typeShapeRules,
      { when: { attr: 'stix_id', one_of: frame.activeIds }, set: { color: '#b1daeb', opacity: 1 } },
      { when: { attr: 'stix_id', one_of: storyScenes[step].introduced }, set: { color: '#f1b86a', radius: 17, opacity: 1 } },
      { when: { attr: 'stix_id', equals: selected ?? '' }, set: { color: '#fff0c7', radius: 20, opacity: 1 } },
    ],
    edge_base: { color: '#6d889a', width: 1.3, opacity: .3, label_visible: false, label_attr: 'label' },
    edge_rules: [{ when: { attr: 'edge_id', one_of: frame.newEdges.map(e => e.id) }, set: { color: '#f1b86a', width: 2.5, opacity: 1 } }],
    labels: { min_screen_radius_px: 2, max_labels: 0, edge_min_screen_length_px: 65, max_edge_labels: 0 },
  }), [frame, step, selected]);

  const labelNodes = useMemo<LabelNode[]>(() => frame.graph.nodes.map(node => {
    const isNew = storyScenes[step].introduced.includes(node.id);
    const focus = node.id === selected;
    const active = frame.activeIds.includes(node.id);
    return { id: node.id, text: node.label, radius: focus ? 20 : isNew ? 17 : 13,
      priority: focus ? 0 : isNew ? 1 : active ? 2 : 4,
      tone: focus ? 'selected' : isNew ? 'new' : active ? 'normal' : 'muted' };
  }), [frame, step, selected]);
  const labelEdges = useMemo<LabelEdge[]>(() => frame.newEdges.map(edge => ({
    id: edge.id, source: edge.source, target: edge.target, text: edge.label.replaceAll('_', ' '), priority: 3, tone: 'new',
  })), [frame]);

  useEffect(() => {
    if (!client) return;
    try {
      revealStoryGraph(client, loaded.current?.client === client ? loaded.current.graph : null, frame.graph);
      loaded.current = { client, graph: frame.graph };
      followLayout();
      onReady(true);
    } catch {
      onReady(false);
      // Report a failure from the imperative WASM operation, not derived React state.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setError('The graph could not update. You can still follow the story and its object list.');
    }
    return stopFollowing;
  }, [client, frame, onReady, followLayout]);

  useEffect(() => {
    if (!client || !host.current) return;
    let raf = 0;
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(followLayout);
    });
    observer.observe(host.current);
    return () => { observer.disconnect(); cancelAnimationFrame(raf); };
  }, [client, followLayout]);

  return <>
    <div ref={host} className="story-canvas" role="group" aria-label="Story graph" tabIndex={0}
      aria-description="Hover over a node for details, or use arrow keys to preview objects. Escape closes the card."
      onPointerDownCapture={stopFollowing} onWheelCapture={stopFollowing}>
      <GraphExplorer style={{ position: 'absolute', inset: 0 }} styleSpec={style} animationSpec={animation} simulationSpec={simulation} background="#101a24"
        focusOnClick={false} onReady={setClient} onNodeClick={node => { if (node) onSelect(node.id); }} />
      <GraphLabels client={client} host={host} nodes={labelNodes} edges={labelEdges} />
      {error && <p role="alert" className="story-graph-error">{error}</p>}
    </div>
    <GraphObjectCard {...card} />
    <div className="story-graph-tools">
      <span><i className="story-dot new" /> New this scene <i className="story-dot" /> Already revealed</span>
      <div className="case-segment" aria-label="Story graph zoom">
        <button aria-label="Zoom out" disabled={!client} onClick={() => { stopFollowing(); client?.zoomOut(); }}>−</button>
        <button disabled={!client} onClick={() => { stopFollowing(); if (client) fitStoryGraph(client); }}>Fit</button>
        <button aria-label="Zoom in" disabled={!client} onClick={() => { stopFollowing(); client?.zoomIn(); }}>+</button>
      </div>
    </div>
    <ShapeLegend />
  </>;
}
