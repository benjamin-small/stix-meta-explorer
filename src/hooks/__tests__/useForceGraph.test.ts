import { renderHook, act } from '@testing-library/react';
import { useForceGraph } from '../useForceGraph';
import type { StixObjectType } from '../../types/stix';

const mockObject: StixObjectType = {
  type: 'attack-pattern',
  name: 'Attack Pattern',
  category: 'sdo',
  description: 'Test',
  properties: [],
  relationships: {
    outgoing: [
      { relationshipType: 'targets', objectTypes: ['identity', 'vulnerability'] },
      { relationshipType: 'uses', objectTypes: ['malware', 'tool'] },
    ],
    incoming: [
      { relationshipType: 'uses', objectTypes: ['threat-actor', 'intrusion-set'] },
    ],
  },
  example: {},
  specUrl: '',
};

test('initializes with center node and direct relationships', () => {
  const { result } = renderHook(() => useForceGraph(mockObject));
  const { nodes, edges } = result.current;

  // Center + 4 outgoing targets + 2 incoming sources = 7 nodes
  expect(nodes.length).toBe(7);
  // Should have edges for all relationships
  expect(edges.length).toBeGreaterThan(0);
});

test('center node is the selected object', () => {
  const { result } = renderHook(() => useForceGraph(mockObject));
  const center = result.current.nodes.find((n) => n.isCenter);
  expect(center).toBeDefined();
  expect(center!.type).toBe('attack-pattern');
});

test('incoming nodes have side=left, outgoing have side=right', () => {
  const { result } = renderHook(() => useForceGraph(mockObject));
  const { nodes } = result.current;
  const incoming = nodes.filter((n) => n.side === 'left');
  const outgoing = nodes.filter((n) => n.side === 'right');
  expect(incoming.length).toBe(2); // threat-actor, intrusion-set
  expect(outgoing.length).toBe(4); // identity, vulnerability, malware, tool
});

test('expandNode adds second-degree relationships', () => {
  const { result } = renderHook(() => useForceGraph(mockObject));
  const identityNode = result.current.nodes.find((n) => n.type === 'identity');
  act(() => result.current.expandNode(identityNode!.id));
  // Should have more nodes now (identity's own relationships)
  expect(result.current.nodes.length).toBeGreaterThan(7);
  expect(result.current.expandedNodes).toContain(identityNode!.id);
});

test('reset collapses to initial state', () => {
  const { result } = renderHook(() => useForceGraph(mockObject));
  const identityNode = result.current.nodes.find((n) => n.type === 'identity');
  act(() => result.current.expandNode(identityNode!.id));
  act(() => result.current.reset());
  expect(result.current.nodes.length).toBe(7);
  expect(result.current.expandedNodes).toHaveLength(0);
});

test('focusNode collapses to just that node and its direct relationships', () => {
  const { result } = renderHook(() => useForceGraph(mockObject));
  const identityNode = result.current.nodes.find((n) => n.type === 'identity');
  act(() => result.current.expandNode(identityNode!.id));
  act(() => result.current.focusNode(identityNode!.id));
  // Now identity is center with its own relationships
  const center = result.current.nodes.find((n) => n.isCenter);
  expect(center!.type).toBe('identity');
});
