import { useMemo } from 'react';
import * as d3 from 'd3';
import { bundleToGraph, hackersObjects, labelOf, objectHref } from '../../data/hackers';

export default function BundleGraph({ selected }: { selected: string }) {
  const graph = useMemo(() => {
    const { nodes: objects, edges } = bundleToGraph(hackersObjects);
    const nodes = objects.map((o, i) => ({ id: o.id, object: o, x: 550 + 200 * Math.cos(i * 2.4), y: 360 + 200 * Math.sin(i * 2.4) }));
    const links = edges.map(e => ({ ...e }));
    // A stopped simulation gives a stable, readable initial layout without a background timer.
    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id(n => (n as typeof nodes[number]).id).distance(100))
      .force('charge', d3.forceManyBody().strength(-260))
      .force('center', d3.forceCenter(550, 360))
      .force('x', d3.forceX(550).strength(0.03))
      .force('y', d3.forceY(360).strength(0.03))
      .force('collide', d3.forceCollide(38)).stop();
    simulation.tick(250);
    const positions = new Map(nodes.map(n => [n.id, n]));
    return { nodes, edges, positions };
  }, []);
  const xs = graph.nodes.map(n => n.x), ys = graph.nodes.map(n => n.y);
  const x = Math.min(...xs) - 100, y = Math.min(...ys) - 50;
  return <div className="bundle-graph overflow-auto border border-cti-border rounded-lg">
    <svg role="group" aria-label="Hackers dataset graph; select a node to inspect it" viewBox={`${x} ${y} ${Math.max(...xs) - x + 100} ${Math.max(...ys) - y + 50}`} className="w-full min-w-[800px]">
      <defs><marker id="bundle-arrow" viewBox="0 -5 10 10" refX="18" markerWidth="5" markerHeight="5" orient="auto"><path d="M0,-5L10,0L0,5" fill="#94a3b8" /></marker></defs>
      {graph.edges.map(e => {
        const a = graph.positions.get(e.source)!, b = graph.positions.get(e.target)!;
        const active = e.source === selected || e.target === selected || e.relationshipId === selected;
        return <g key={e.id}><line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={active ? '#38bdf8' : '#475569'} strokeWidth={active ? 2.5 : 1} markerEnd="url(#bundle-arrow)"><title>{`${labelOf(a.object)} → ${e.label} → ${labelOf(b.object)}`}</title></line>{active && <text x={(a.x+b.x)/2} y={(a.y+b.y)/2} fill="#7dd3fc" fontSize="9">{e.label}</text>}</g>;
      })}
      {graph.nodes.map(n => <a href={objectHref(n.id)} key={n.id} aria-label={`Inspect ${labelOf(n.object)}`}><rect x={n.x-60} y={n.y-12} width="120" height="40" fill="transparent" /><circle cx={n.x} cy={n.y} r={n.id === selected ? 10 : 7} fill={n.id === selected ? '#fbbf24' : '#38bdf8'} /><text x={n.x} y={n.y+22} textAnchor="middle" fill="#e2e8f0" fontSize="10">{labelOf(n.object).slice(0, 30)}</text><title>{`${n.object.type}: ${labelOf(n.object)}`}</title></a>)}
    </svg>
  </div>;
}
