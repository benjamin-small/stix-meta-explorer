import { useEffect, useMemo, useRef, useState } from 'react';
import { GraphExplorer } from '@poietic-tech/graphing-library/react';
import type { GraphClient, StyleSpec } from '@poietic-tech/graphing-library';
import { objectFamily, objectHref } from '../../data/hackers';
import { graphForSelection } from './graph-model';
import { typeShapeRules } from './graph-shapes';
import ShapeLegend from './ShapeLegend';
import GraphObjectCard from './GraphObjectCard';
import { useGraphObjectCard } from './useGraphObjectCard';

interface Props {
  selected: string;
  scope: 'nearby' | 'all';
  onScopeChange: (scope: 'nearby' | 'all') => void;
  onNodeSelect: (id: string) => void;
}

const families = ['threat-actor', 'file', 'sighting', 'report'].map(objectFamily);
const animation = { reduced_motion: true, halo: { enabled: false } };
const simulation = { link_distance: 180, charge_strength: -900 };

export default function BundleGraph({ selected, scope, onScopeChange, onNodeSelect }: Props) {
  const [client, setClient] = useState<GraphClient | null>(null);
  const canvasHost = useRef<HTMLDivElement>(null);
  const graph = useMemo(() => graphForSelection(selected, scope), [selected, scope]);
  const nodeIds = useMemo(() => graph.nodes.map(node => node.id), [graph]);
  const card = useGraphObjectCard(client, canvasHost, nodeIds);
  const contextOnly = !graph.edges.length && scope === 'nearby';
  const style = useMemo<StyleSpec>(() => ({
    node_base: { color: '#9babb9', radius: scope === 'all' ? 24 : 9, shape: 'circle', label_visible: true },
    node_rules: [
      ...typeShapeRules,
      ...families.map(family => ({ when: { attr: 'family', equals: family.label }, set: { color: family.color } })),
      { when: { attr: 'stix_id', equals: selected }, set: { radius: scope === 'all' ? 32 : 13, color: '#ffdc91' } },
    ],
    edge_base: { color: '#617788', width: 1.5, label_attr: 'label', label_visible: scope === 'nearby' },
    edge_rules: ['source', 'target', 'relationshipId'].map(attr => ({
      when: { attr, equals: selected },
      set: { color: '#b8d7e8', width: 2.5, label_visible: true },
    })),
    labels: { min_screen_radius_px: 2, max_labels: 50, edge_min_screen_length_px: 45, max_edge_labels: 24 },
  }), [selected, scope]);

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
      <div><p className="case-eyebrow">FOLLOW THE CONNECTIONS</p><h2>{scope === 'nearby' ? 'Object neighborhood' : 'Whole case'}</h2></div>
      <div className="case-segment" aria-label="Graph scope">
        <button aria-pressed={scope === 'nearby'} onClick={() => onScopeChange('nearby')}>Nearby</button>
        <button aria-pressed={scope === 'all'} onClick={() => onScopeChange('all')}>All objects</button>
      </div>
    </div>
    <p className="case-help">{graph.nodes.length} nodes · {graph.edges.length} {graph.edges.length === 1 ? 'connection' : 'connections'}. Select a node to inspect it.</p>
    <div ref={canvasHost} className="case-graph-canvas" role="group" aria-label="Interactive case graph" tabIndex={0}
      aria-description="Hover over a node for details, or use arrow keys to preview objects. Escape closes the card.">
      <GraphExplorer
        graph={graph}
        styleSpec={style}
        animationSpec={animation}
        simulationSpec={simulation}
        background="#121b24"
        focusOnClick={false}
        onReady={setClient}
        onNodeClick={details => { if (details) onNodeSelect(details.id); }}
      />
      {contextOnly && <div className="case-graph-empty">
        <span className="case-empty-icon" aria-hidden="true">◎</span>
        <h3>This object provides context</h3>
        <p>Container references appear in its References tab. The graph shows structural connections.</p>
        <button className="case-button" onClick={() => onScopeChange('all')}>Explore the whole case</button>
      </div>}
    </div>
    <GraphObjectCard {...card} onSelect={onNodeSelect} />
    <div className="case-graph-footer">
      <span className="case-help">Hover for details; arrow keys preview objects. Drag to arrange or pan; scroll to zoom.</span>
      <div className="case-segment" aria-label="Graph zoom">
        <button aria-label="Zoom out" disabled={!client || contextOnly} onClick={() => client?.zoomOut()}>−</button>
        <button disabled={!client || contextOnly} onClick={() => client?.fitView()}>Fit</button>
        <button aria-label="Zoom in" disabled={!client || contextOnly} onClick={() => client?.zoomIn()}>+</button>
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
