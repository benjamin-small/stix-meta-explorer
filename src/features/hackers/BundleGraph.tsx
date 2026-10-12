import { useEffect, useMemo, useRef, useState } from 'react';
import { GraphExplorer } from '@poietic-tech/graphing-library/react';
import type { AnimationSpec, GraphClient, StyleSpec } from '@poietic-tech/graphing-library';
import { hackersById, labelOf, objectFamily, objectHref } from '../../data/hackers';
import { graphSelection, wholeCaseGraph as graph } from './graph-model';
import { typeShapeRules } from './graph-shapes';
import ShapeLegend from './ShapeLegend';
import GraphLabels from './GraphLabels';
import type { LabelNode, LabelEdge } from './graph-label-layout';
import GraphObjectCard from './GraphObjectCard';
import { useGraphObjectCard } from './useGraphObjectCard';
import { focusCaseGraph } from './case-camera';
import { followStoryLayout } from './story-camera';

interface Props {
  selected: string;
  focusRequest?: number;
  onNodeSelect: (id: string) => void;
}

const families = ['threat-actor', 'file', 'sighting', 'report'].map(objectFamily);
const simulation = { link_distance: 180, charge_strength: -900 };
const nodeIds = graph.nodes.map(node => node.id);

export default function BundleGraph({ selected, focusRequest = 0, onNodeSelect }: Props) {
  const [client, setClient] = useState<GraphClient | null>(null);
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const canvasHost = useRef<HTMLDivElement>(null);
  const framedClient = useRef<GraphClient | null>(null);
  const cancelFit = useRef<(() => void) | null>(null);
  const stopFollowing = () => { cancelFit.current?.(); cancelFit.current = null; };
  const selection = useMemo(() => graphSelection(selected), [selected]);
  const card = useGraphObjectCard(client, canvasHost, nodeIds);
  const animation = useMemo<AnimationSpec>(() => ({
    reduced_motion: reducedMotion, halo: { enabled: false },
    transition: { duration_ms: 450, easing: 'ease-in-out', camera_follow: true, layout_tween: false },
  }), [reducedMotion]);
  const style = useMemo<StyleSpec>(() => ({
    node_base: { color: '#9babb9', radius: 48, opacity: .4, shape: 'circle', label_visible: false },
    node_rules: [
      ...typeShapeRules,
      ...families.map(family => ({ when: { attr: 'family', equals: family.label }, set: { color: family.color } })),
      { when: { attr: 'stix_id', one_of: selection.nearbyIds }, set: { opacity: 1 } },
      { when: { attr: 'stix_id', one_of: selection.focusIds }, set: { radius: 66, color: '#ffdc91', opacity: 1 } },
    ],
    edge_base: { color: '#71899c', width: 2, opacity: .35, label_attr: 'label', label_visible: false },
    edge_rules: [
      { when: { attr: 'edge_id', one_of: selection.edgeIds }, set: { color: '#b8d7e8', width: 4, opacity: 1 } },
      { when: { attr: 'relationshipId', equals: selected }, set: { color: '#ffdc91', width: 5, opacity: 1 } },
    ],
    labels: { min_screen_radius_px: 2, max_labels: 0, edge_min_screen_length_px: 45, max_edge_labels: 0 },
  }), [selected, selection]);

  const labelNodes = useMemo<LabelNode[]>(() => graph.nodes.map(node => {
    const focus = selection.focusIds.includes(node.id);
    return { id: node.id, text: node.label, radius: focus ? 66 : 48, priority: focus ? 0 : 2,
      tone: focus ? 'selected' : 'normal', visible: selection.nearbyIds.includes(node.id) };
  }), [selection]);
  const labelEdges = useMemo<LabelEdge[]>(() => graph.edges.filter(edge => selection.edgeIds.includes(edge.id)).map(edge => ({
    id: edge.id, source: edge.source, target: edge.target, text: edge.attrs.label,
    priority: edge.attrs.relationshipId === selected ? 1 : 3,
    tone: edge.attrs.relationshipId === selected ? 'selected' : 'normal',
  })), [selection, selected]);

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(query.matches);
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    if (!client) return;
    stopFollowing();
    if (framedClient.current !== client) {
      framedClient.current = client;
      cancelFit.current = followStoryLayout(client, () => focusCaseGraph(client, selection.focusIds[0], reducedMotion));
    } else focusCaseGraph(client, selection.focusIds[0], reducedMotion);
    return stopFollowing;
  }, [client, selection, focusRequest, reducedMotion]);

  useEffect(() => {
    const host = canvasHost.current;
    if (!client || !host) return;
    let { width, height } = host.getBoundingClientRect();
    let frame = 0;
    const observer = new ResizeObserver(([entry]) => {
      if (entry.contentRect.width === width && entry.contentRect.height === height) return;
      ({ width, height } = entry.contentRect);
      cancelAnimationFrame(frame);
      // The binding resizes its canvas first; refit after a responsive layout change.
      frame = requestAnimationFrame(() => client.fitView());
    });
    observer.observe(host);
    return () => { observer.disconnect(); cancelAnimationFrame(frame); };
  }, [client]);

  return <section className="case-graph case-panel" aria-label="Dataset graph">
    <div className="case-panel-heading">
      <h2>Case graph</h2><span className="case-help">{graph.nodes.length} objects · {graph.edges.length} connections</span>
    </div>
    <p className="case-graph-selection"><strong>{labelOf(hackersById.get(selected)!)}</strong><span>{selection.edgeIds.length ? 'Direct connections highlighted · distant objects dimmed' : 'Context object · see its references in the inspector'}</span></p>
    <div ref={canvasHost} id="case-graph" className="case-graph-canvas" role="group" aria-label="Interactive case graph" tabIndex={0}
      onPointerDownCapture={stopFollowing} onWheelCapture={stopFollowing}
      aria-description="Hover over a node for details, or use arrow keys to preview objects. Escape closes the card.">
      <GraphExplorer
        graph={graph}
        styleSpec={style}
        animationSpec={animation}
        simulationSpec={simulation}
        background="#121b24"
        focusOnClick={false}
        fitOnLoad={false}
        onReady={setClient}
        onNodeClick={details => { if (details) onNodeSelect(details.id); }}
      />
      <GraphLabels client={client} host={canvasHost} nodes={labelNodes} edges={labelEdges} />
    </div>
    <GraphObjectCard {...card} />
    <div className="case-graph-footer">
      <span className="case-help">Hover for details; arrow keys preview objects. Drag to arrange or pan; scroll to zoom.</span>
      <div className="case-segment" aria-label="Graph zoom">
        <button aria-label="Zoom out" disabled={!client} onClick={() => { stopFollowing(); client?.zoomOut(); }}>−</button>
        <button disabled={!client} onClick={() => { stopFollowing(); client?.fitView(); }}>Fit all</button>
        <button aria-label="Zoom in" disabled={!client} onClick={() => { stopFollowing(); client?.zoomIn(); }}>+</button>
      </div>
    </div>
    <div className="case-legend">{families.map(family => <span key={family.label}><i style={{ background: family.color }} />{family.label}</span>)}</div>
    <ShapeLegend />
    <details className="case-graph-list">
      <summary>Graph objects ({graph.nodes.length})</summary>
      <p className="case-help">An accessible list of the objects in this view. Also available if your browser cannot display the graph.</p>
      <ul>{graph.nodes.map(node => <li key={node.id}><a href={objectHref(node.id)} aria-current={node.id === selected ? 'true' : undefined}>{node.label}</a><small>{node.attrs.stix_type}</small></li>)}</ul>
    </details>
  </section>;
}
