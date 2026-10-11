import { bundleToGraph, hackersObjects, labelOf, objectFamily } from '../../data/hackers';
import type { BundleObject, BundleEdge } from '../../data/hackers';

export function toWireGraph(nodes: BundleObject[], edges: BundleEdge[]) {
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
      attrs: { edge_id: edge.id, label: edge.label.replaceAll('_', ' '), source: edge.source, target: edge.target, relationshipId: edge.relationshipId ?? '' },
    })),
  };
}

const structural = bundleToGraph(hackersObjects);
// Keep one graph identity so selection never reloads the renderer or its layout.
export const wholeCaseGraph = toWireGraph(structural.nodes, structural.edges);

export function graphSelection(selected: string) {
  // Relationships are drawn as edges, so navigate to their endpoints instead.
  const relationship = structural.edges.find(edge => edge.relationshipId === selected);
  const focusIds = relationship ? [relationship.source, relationship.target] : [selected];
  const edges = structural.edges.filter(edge => focusIds.includes(edge.source) || focusIds.includes(edge.target));
  return {
    focusIds,
    nearbyIds: [...new Set([...focusIds, ...edges.flatMap(edge => [edge.source, edge.target])])],
    edgeIds: edges.map(edge => edge.id),
  };
}
