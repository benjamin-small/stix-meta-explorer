import { useEffect } from 'react';
import type { GraphExplorerProps } from '@poietic-tech/graphing-library/react';
import { fireEvent, render, screen } from '@testing-library/react';
import { hackersObjects, hackersById } from '../../../data/hackers';
import { graphForSelection } from '../graph-model';
import BundleGraph from '../BundleGraph';

const driver = vi.hoisted(() => ({
  props: null as GraphExplorerProps | null,
  mounts: 0,
  client: { zoomIn: vi.fn(), zoomOut: vi.fn(), fitView: vi.fn() },
}));

vi.mock('@poietic-tech/graphing-library/react', () => ({
  GraphExplorer: (props: GraphExplorerProps) => {
    driver.props = props;
    useEffect(() => {
      driver.mounts++;
      props.onReady?.(driver.client as unknown as Parameters<NonNullable<GraphExplorerProps['onReady']>>[0]);
      return () => props.onReady?.(null);
      // Mirror the library mount lifecycle; configuration updates do not remount.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    return <canvas aria-label="Library renderer" />;
  },
}));

test('library graph preserves STIX references and relationship identity', () => {
  const relationship = hackersObjects.find(o => o.type === 'relationship')!;
  const graph = graphForSelection(relationship.id, 'nearby');
  expect(graph.nodes.map(n => n.id).sort()).toEqual([relationship.source_ref, relationship.target_ref].sort());
  expect(graph.edges[0].attrs.relationshipId).toBe(relationship.id);
  expect(graph.edges[0].attrs.label).toBe(relationship.relationship_type);
  for (const node of graph.nodes) expect(node.attrs.stix_type).toBe(hackersById.get(node.id)?.type);
  expect(graphForSelection(relationship.id, 'all')).toBe(graphForSelection(hackersObjects[0].id, 'all'));
});

test('uses library controls and selection callbacks without remounting on selection', () => {
  const onNodeSelect = vi.fn();
  const initial = hackersObjects[0].id;
  const { rerender, unmount } = render(<BundleGraph selected={initial} scope="all" onScopeChange={() => {}} onNodeSelect={onNodeSelect} />);
  const loadedGraph = driver.props!.graph;
  const mounts = driver.mounts;
  fireEvent.click(screen.getByRole('button', { name: 'Zoom in' }));
  fireEvent.click(screen.getByRole('button', { name: 'Zoom out' }));
  fireEvent.click(screen.getByRole('button', { name: 'Fit' }));
  expect(driver.client.zoomIn).toHaveBeenCalledOnce();
  expect(driver.client.zoomOut).toHaveBeenCalledOnce();
  expect(driver.client.fitView).toHaveBeenCalledOnce();
  const target = hackersObjects[1].id;
  driver.props!.onNodeClick!({ id: target, label: null, attrs: {}, provisional: false }, { kind: 'node', id: target });
  expect(onNodeSelect).toHaveBeenCalledWith(target);
  rerender(<BundleGraph selected={target} scope="all" onScopeChange={() => {}} onNodeSelect={onNodeSelect} />);
  expect(driver.props!.graph).toBe(loadedGraph);
  expect(driver.mounts).toBe(mounts);
  expect(driver.props!.styleSpec?.node_rules?.at(-1)?.when?.equals).toBe(target);
  expect(screen.getByText('Graph objects (40)')).toBeInTheDocument();
  unmount();
});
