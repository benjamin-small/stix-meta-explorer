import { useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';
import { bundleToGraph, hackersObjects, hackersById, labelOf, objectFamily, objectHref } from '../../data/hackers';

interface Props {
  selected: string;
  scope: 'nearby' | 'all';
  onScopeChange: (scope: 'nearby' | 'all') => void;
}

function wrapLabel(text: string) {
  const words = text.split(' ');
  const lines = [''];
  for (const word of words) {
    if ((lines[lines.length - 1] + word).length > 22 && lines[lines.length - 1]) lines.push('');
    lines[lines.length - 1] += `${word} `;
  }
  return lines.slice(0, 2).map((line, i) => (i === 1 && lines.length > 2) || line.trim().length > 24 ? `${line.trim().slice(0, 22)}…` : line.trim());
}

export default function BundleGraph({ selected, scope, onScopeChange }: Props) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement>(null);
  const drag = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);
  const graph = useMemo(() => {
    const all = bundleToGraph(hackersObjects);
    const object = hackersById.get(selected)!;
    const nearby = all.edges.filter(e => e.source === selected || e.target === selected || e.relationshipId === selected);
    const ids = new Set([selected, ...nearby.flatMap(e => [e.source, e.target])]);
    const objects = scope === 'all' ? all.nodes : all.nodes.filter(o => ids.has(o.id));
    const edges = scope === 'all' ? all.edges : nearby;
    const nodes = objects.map((o, i) => ({ id: o.id, object: o, x: 200 * Math.cos(i * 2.4), y: 200 * Math.sin(i * 2.4) }));
    const links = edges.map(e => ({ ...e }));
    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id(n => (n as typeof nodes[number]).id).distance(320))
      .force('charge', d3.forceManyBody().strength(-600))
      .force('center', d3.forceCenter(0, 0))
      .force('x', d3.forceX(0).strength(0.03))
      .force('y', d3.forceY(0).strength(0.03))
      .force('collide', d3.forceCollide(104)).stop();
    simulation.tick(240);
    const positions = new Map(nodes.map(n => [n.id, n]));
    const minX = Math.min(...nodes.map(n => n.x), 0) - 110;
    const minY = Math.min(...nodes.map(n => n.y), 0) - 65;
    return { object, nodes, edges, positions, minX, minY,
      width: Math.max(...nodes.map(n => n.x), 0) - minX + 110,
      height: Math.max(...nodes.map(n => n.y), 0) - minY + 65 };
  }, [selected, scope]);
  const width = graph.width / zoom, height = graph.height / zoom;
  const viewX = graph.minX + (graph.width - width) / 2 + pan.x;
  const viewY = graph.minY + (graph.height - height) / 2 + pan.y;

  return <section className="case-graph case-panel" aria-label="Dataset graph">
    <div className="case-panel-heading">
      <div><p className="case-eyebrow">FOLLOW THE CONNECTIONS</p><h2>{scope === 'nearby' ? 'Object neighborhood' : 'Whole case'}</h2></div>
      <div className="case-segment" aria-label="Graph scope">
        <button aria-pressed={scope === 'nearby'} onClick={() => onScopeChange('nearby')}>Nearby</button>
        <button aria-pressed={scope === 'all'} onClick={() => onScopeChange('all')}>All objects</button>
      </div>
    </div>
    <p className="case-help">{graph.nodes.length} nodes · {graph.edges.length} {graph.edges.length === 1 ? 'connection' : 'connections'}. Select a node to inspect it.</p>
    {!graph.edges.length && scope === 'nearby' ? <div className="case-graph-empty">
      <span className="case-empty-icon" aria-hidden="true">◎</span>
      <h3>This object provides context</h3>
      <p>Container references appear in its References tab. The graph shows structural connections.</p>
      <button className="case-button" onClick={() => onScopeChange('all')}>Explore the whole case</button>
    </div> : <svg ref={svgRef} role="group" aria-label="Hackers dataset graph" viewBox={`${viewX} ${viewY} ${width} ${height}`} className="case-graph-canvas"
      onPointerDown={e => {
        if ((e.target as Element).closest('a') || e.button !== 0) return;
        drag.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
        e.currentTarget.setPointerCapture(e.pointerId);
      }}
      onPointerMove={e => {
        if (!drag.current || !svgRef.current) return;
        const bounds = svgRef.current.getBoundingClientRect();
        const scale = Math.max(width / bounds.width, height / bounds.height);
        setPan({ x: drag.current.panX - (e.clientX - drag.current.x) * scale, y: drag.current.panY - (e.clientY - drag.current.y) * scale });
      }}
      onPointerUp={() => { drag.current = null; }} onPointerCancel={() => { drag.current = null; }}>
      <defs><marker id="case-arrow" viewBox="0 -5 10 10" refX="9" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,-5L10,0L0,5" fill="#748899" /></marker></defs>
      {graph.edges.map(e => {
        const a = graph.positions.get(e.source)!, b = graph.positions.get(e.target)!;
        const active = e.source === selected || e.target === selected || e.relationshipId === selected;
        const dx = b.x - a.x, dy = b.y - a.y;
        const factor = Math.max(Math.abs(dx) / 92, Math.abs(dy) / 35, 1);
        return <g key={e.id} className={active ? 'case-edge-active' : 'case-edge'}>
          <line x1={a.x} y1={a.y} x2={b.x - dx / factor} y2={b.y - dy / factor} markerEnd="url(#case-arrow)"><title>{`${labelOf(a.object)} → ${e.label} → ${labelOf(b.object)}`}</title></line>
          {scope === 'nearby' && <text x={(a.x + b.x) / 2} y={(a.y + b.y) / 2 - 7} textAnchor="middle">{e.label.replaceAll('_', ' ')}</text>}
        </g>;
      })}
      {graph.nodes.map(n => <a href={objectHref(n.id)} key={n.id} aria-label={`Inspect ${labelOf(n.object)}`} className="case-graph-node" aria-current={n.id === selected ? 'true' : undefined}>
        <rect x={n.x - 92} y={n.y - 35} width="184" height="70" rx="10" fill={n.id === selected ? '#302719' : '#17222c'} stroke={n.id === selected ? '#f1b86a' : '#3a4b5b'} strokeWidth="2" />
        <circle cx={n.x - 77} cy={n.y - 21} r="3" fill={objectFamily(n.object.type).color} />
        <text x={n.x} y={n.y - 9} textAnchor="middle" fill="#f0f3f6" fontSize="12" fontWeight="600">
          {wrapLabel(labelOf(n.object)).map((line, i) => <tspan key={i} x={n.x} dy={i === 0 ? 0 : 15}>{line}</tspan>)}
        </text>
        <text x={n.x} y={n.y + 24} textAnchor="middle" fill="#9aafbd" fontSize="10">{n.object.type}</text>
        <title>{labelOf(n.object)}</title>
      </a>)}
    </svg>}
    <div className="case-graph-footer">
      <span className="case-help">Drag the background to pan. Arrows show direction.</span>
      <div className="case-segment" aria-label="Graph zoom">
        <button aria-label="Zoom out" disabled={zoom <= 0.5} onClick={() => setZoom(z => Math.max(0.5, z / 1.4))}>−</button>
        <button onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}>Fit</button>
        <button aria-label="Zoom in" disabled={zoom >= 5} onClick={() => setZoom(z => Math.min(5, z * 1.4))}>+</button>
      </div>
    </div>
    <div className="case-legend">{['threat-actor', 'file', 'sighting', 'report'].map(type => <span key={type}><i style={{ background: objectFamily(type).color }} />{objectFamily(type).label}</span>)}</div>
  </section>;
}
