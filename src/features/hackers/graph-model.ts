import { bundleToGraph, hackersObjects, labelOf, objectFamily } from '../../data/hackers';
import type { BundleObject, BundleEdge } from '../../data/hackers';

function toWireGraph(nodes: BundleObject[], edges: BundleEdge[]) {
  return {
    nodes: nodes.map(object => ({
      id: object.id,
      label: labelOf(object),
      attrs: { stix_id: object.id, stix_type: object.type, family: objectFamily(object.type).label },
    })),
    edges: edges.map(edge => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      attrs: { label: edge.label.replaceAll('_', ' '), source: edge.source, target: edge.target, relationshipId: edge.relationshipId ?? '' },
    })),
  };
}

const structural = bundleToGraph(hackersObjects);
const wholeCase = toWireGraph(structural.nodes, structural.edges);

export function graphForSelection(selected: string, scope: 'nearby' | 'all') {
  // Stable identity matters: the React binding reloads graph data when it changes.
  // In the overview, selection updates styling without resetting the camera/layout.
  if (scope === 'all') return wholeCase;
  const edges = structural.edges.filter(edge => edge.source === selected || edge.target === selected || edge.relationshipId === selected);
  const ids = new Set([selected, ...edges.flatMap(edge => [edge.source, edge.target])]);
  return toWireGraph(structural.nodes.filter(object => ids.has(object.id)), edges);
}
