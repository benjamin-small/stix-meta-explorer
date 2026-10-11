import { useEffect } from 'react';
import type { GraphExplorerProps } from '@poietic-tech/graphing-library/react';
import { fireEvent, render, screen } from '@testing-library/react';
import { hackersObjects, hackersById } from '../../../data/hackers';
import { graphSelection, wholeCaseGraph } from '../graph-model';
import { focusCaseGraph } from '../case-camera';
import BundleGraph from '../BundleGraph';
import { shapeGroups, typeShapeRules } from '../graph-shapes';

const driver = vi.hoisted(() => ({
  props: null as GraphExplorerProps | null,
  mounts: 0,
  client: { zoomIn: vi.fn(), zoomOut: vi.fn(), fitView: vi.fn(), focus: vi.fn(), cameraPose: vi.fn(() => ({ target: [0, 0, 0], distance: 100, yaw: 0, pitch: 0 })), setCameraPose: vi.fn(), graphNodes: vi.fn(() => []), zoom: vi.fn() },
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
  const selection = graphSelection(relationship.id);
  expect(selection.focusIds.sort()).toEqual([relationship.source_ref, relationship.target_ref].sort());
  const edge = wholeCaseGraph.edges.find(edge => edge.attrs.relationshipId === relationship.id)!;
  expect(selection.edgeIds).toContain(edge.id);
  expect(edge.attrs.label).toBe(relationship.relationship_type);
  for (const node of wholeCaseGraph.nodes) expect(node.attrs.stix_type).toBe(hackersById.get(node.id)?.type);
  expect(wholeCaseGraph.nodes).toHaveLength(40);
  expect(wholeCaseGraph.edges).toHaveLength(51);
});

test('every rendered STIX type has exactly one supported shape', () => {
  const assigned = shapeGroups.flatMap(group => group.types);
  expect(new Set(assigned).size).toBe(assigned.length);
  for (const object of hackersObjects.filter(object => object.type !== 'relationship')) {
    expect(assigned).toContain(object.type);
  }
  expect(shapeGroups.map(group => group.shape)).toEqual(['circle', 'square', 'diamond']);
});

test('uses library controls and selection callbacks without remounting on selection', () => {
  const onNodeSelect = vi.fn();
  const initial = hackersObjects[0].id;
  const { rerender, unmount } = render(<BundleGraph selected={initial} onNodeSelect={onNodeSelect} />);
  const loadedGraph = driver.props!.graph;
  const mounts = driver.mounts;
  fireEvent.click(screen.getByRole('button', { name: 'Zoom in' }));
  fireEvent.click(screen.getByRole('button', { name: 'Zoom out' }));
  const fits = driver.client.fitView.mock.calls.length;
  fireEvent.click(screen.getByRole('button', { name: 'Fit all' }));
  expect(driver.client.zoomIn).toHaveBeenCalledOnce();
  expect(driver.client.zoomOut).toHaveBeenCalledOnce();
  expect(driver.client.fitView).toHaveBeenCalledTimes(fits + 1);
  const target = hackersObjects[1].id;
  driver.props!.onNodeClick!({ id: target, label: null, attrs: {}, provisional: false }, { kind: 'node', id: target });
  expect(onNodeSelect).toHaveBeenCalledWith(target);
  rerender(<BundleGraph selected={target} onNodeSelect={onNodeSelect} />);
  expect(driver.props!.graph).toBe(loadedGraph);
  expect(driver.mounts).toBe(mounts);
  expect(driver.client.focus).toHaveBeenLastCalledWith(target);
  expect(driver.props!.styleSpec?.node_rules?.at(-1)?.when?.one_of).toEqual([target]);
  expect(driver.props!.styleSpec?.node_rules).toEqual(expect.arrayContaining(typeShapeRules));
  expect(driver.props!.styleSpec?.node_rules?.at(-1)?.set?.shape).toBeUndefined();
  const navigations = driver.client.focus.mock.calls.length;
  rerender(<BundleGraph selected={target} focusRequest={1} onNodeSelect={onNodeSelect} />);
  expect(driver.client.focus).toHaveBeenCalledTimes(navigations + 1);
  expect(driver.props!.graph).toBe(loadedGraph);
  expect(screen.getByText('Graph objects (40)')).toBeInTheDocument();
  unmount();
});

test('only the selected node and its immediate neighbors are emphasized without removing distant nodes', () => {
  const selected = hackersObjects[0].id;
  const direct = wholeCaseGraph.edges.filter(edge => edge.source === selected || edge.target === selected);
  const selection = graphSelection(selected);
  expect(new Set(selection.nearbyIds)).toEqual(new Set([selected, ...direct.flatMap(edge => [edge.source, edge.target])]));
  expect(selection.nearbyIds.length).toBeLessThan(wholeCaseGraph.nodes.length);
  const report = hackersObjects.find(object => object.type === 'report')!;
  const { rerender } = render(<BundleGraph selected={selected} onNodeSelect={() => {}} />);
  expect(driver.props!.styleSpec?.node_base?.opacity).toBeLessThan(1);
  const loaded = driver.props!.graph;
  rerender(<BundleGraph selected={report.id} onNodeSelect={() => {}} />);
  expect(driver.props!.graph).toBe(loaded);
  expect(driver.props!.graph).toBe(wholeCaseGraph);
  expect(driver.client.focus).toHaveBeenLastCalledWith(report.id);
  expect(screen.getByText('Graph objects (40)')).toBeInTheDocument();
});

test('selection keeps overview context for isolated nodes and respects a wider manual zoom', () => {
  const previous = { target: [0, 0, 0], distance: 100, yaw: 0, pitch: 0 };
  const client = {
    cameraPose: vi.fn().mockReturnValueOnce(previous).mockReturnValueOnce({ ...previous, distance: 1000 }),
    fitView: vi.fn(), focus: vi.fn(), setCameraPose: vi.fn(),
  };
  const graphClient = client as unknown as Parameters<typeof focusCaseGraph>[0];
  focusCaseGraph(graphClient, 'report', false);
  expect(client.focus).toHaveBeenCalledWith('report');
  expect(client.setCameraPose).toHaveBeenLastCalledWith({ distance: 850 }, true);
  client.cameraPose.mockReturnValueOnce({ ...previous, distance: 2000 }).mockReturnValueOnce({ ...previous, distance: 1000 });
  focusCaseGraph(graphClient, 'node', true);
  expect(client.setCameraPose).toHaveBeenLastCalledWith({ distance: 2000 }, false);
});
