import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { useEffect } from 'react';
import type { GraphClient } from '@poietic-tech/graphing-library';
import type { GraphExplorerProps } from '@poietic-tech/graphing-library/react';
import { bundleToGraph, hackersById, hackersObjects } from '../../../data/hackers';
import { storyFrames, storyScenes } from '../story-scenes';
import { revealStoryGraph } from '../story-graph';
import StoryWalkthrough from '../StoryWalkthrough';
import HackersExplorer from '../HackersExplorer';
import { storyMedia } from '../story-media';

const renderer = vi.hoisted(() => ({
  props: null as GraphExplorerProps | null,
  client: { load: vi.fn(), previewNodes: vi.fn(() => true), commitPreview: vi.fn(), removeNode: vi.fn(), removeEdge: vi.fn(), fitView: vi.fn(), focus: vi.fn(), cameraPose: vi.fn(() => ({ target: [0, 0, 0], distance: 100, yaw: 0, pitch: 0 })), setCameraPose: vi.fn(), zoom: vi.fn(), on: vi.fn(() => vi.fn()), visibleNodes: vi.fn(() => []), project: vi.fn(() => ({ x: 0, y: 0 })), graphNodes: vi.fn(() => []), zoomIn: vi.fn(), zoomOut: vi.fn() },
}));
vi.mock('@poietic-tech/graphing-library/react', () => ({ GraphExplorer: (props: GraphExplorerProps) => {
  renderer.props = props;
  useEffect(() => {
    props.onReady?.(renderer.client as unknown as GraphClient);
    return () => props.onReady?.(null);
    // The library creates the client once per mount, not for every config update.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return <canvas aria-label="Graph renderer" />;
} }));

afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); window.history.replaceState({}, '', '/'); });

test('scenes reveal every dataset object exactly once, with no future nodes or dangling connections', () => {
  const introduced = storyScenes.flatMap(s => s.introduced);
  expect(new Set(introduced).size).toBe(introduced.length);
  expect(introduced.slice().sort()).toEqual(hackersObjects.filter(o => o.type !== 'relationship').map(o => o.id).sort());
  storyFrames.forEach((frame, index) => {
    const known = new Set(storyScenes.slice(0, index + 1).flatMap(s => s.introduced));
    expect(frame.graph.nodes.map(n => n.id).sort()).toEqual([...known].sort());
    for (const edge of frame.graph.edges) {
      expect(known.has(edge.source)).toBe(true);
      expect(known.has(edge.target)).toBe(true);
    }
    for (const id of storyScenes[index].introduced) expect(hackersById.has(id)).toBe(true);
  });
  expect(storyFrames[0].graph.edges).toHaveLength(0);
  expect(storyFrames.at(-1)!.graph.edges).toHaveLength(bundleToGraph(hackersObjects).edges.length);
});

test('the library receives incremental additions and removals, preserving the existing graph on scene changes', () => {
  const client = { load: vi.fn(), previewNodes: vi.fn(() => true), commitPreview: vi.fn(), removeNode: vi.fn(), removeEdge: vi.fn(), fitView: vi.fn() };
  const driver = client as unknown as GraphClient;
  revealStoryGraph(driver, null, storyFrames[0].graph);
  revealStoryGraph(driver, storyFrames[0].graph, storyFrames[5].graph);
  expect(client.load).toHaveBeenCalledTimes(1);
  expect(client.previewNodes).toHaveBeenCalledWith(storyFrames[0].graph.nodes[0].id, storyFrames[5].graph);
  expect(client.commitPreview).toHaveBeenCalledOnce();
  client.previewNodes.mockReturnValue(false);
  revealStoryGraph(driver, storyFrames[5].graph, storyFrames[0].graph);
  expect(client.removeNode).toHaveBeenCalledTimes(storyFrames[5].graph.nodes.length - 1);
  expect(client.removeEdge).toHaveBeenCalledTimes(storyFrames[5].graph.edges.length);
  expect(client.removeNode).not.toHaveBeenCalledWith(storyScenes[0].introduced[0]);
  expect(client.load).toHaveBeenCalledTimes(1);
  expect(client.commitPreview).toHaveBeenCalledOnce();
});

test('scene links survive reload and Back; invalid scenes start at the beginning', () => {
  window.history.replaceState({}, '', '?view=hackers&panel=walkthrough&scene=the-worm');
  render(<StoryWalkthrough onExplore={() => {}} />);
  expect(screen.getByRole('heading', { name: 'The garbage is not garbage.' })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Previous scene' }));
  expect(new URLSearchParams(window.location.search).get('scene')).toBe('the-garbage-file');
  window.history.replaceState({}, '', '?view=hackers&panel=walkthrough&scene=unknown');
  fireEvent.popState(window);
  expect(screen.getByRole('heading', { name: 'A legend goes quiet.' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Previous scene' })).toBeDisabled();
});

test('scenes advance only through manual navigation, with no playback or presentation setting', () => {
  vi.useFakeTimers();
  render(<StoryWalkthrough onExplore={() => {}} />);
  expect(screen.queryByRole('button', { name: /play story|play next scene|replay story/i })).not.toBeInTheDocument();
  expect(screen.queryByRole('checkbox', { name: 'Pause after each scene' })).not.toBeInTheDocument();
  expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Previous scene' })).toBeDisabled();
  act(() => { vi.advanceTimersByTime(300000); });
  expect(screen.getByRole('heading', { name: storyScenes[0].title })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Next scene' }));
  expect(screen.getByRole('heading', { name: storyScenes[1].title })).toBeInTheDocument();
  act(() => { vi.advanceTimersByTime(300000); });
  expect(screen.getByRole('heading', { name: storyScenes[1].title })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Previous scene' }));
  expect(screen.getByRole('heading', { name: storyScenes[0].title })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Scene 9: Aftermath' }));
  expect(screen.getByRole('button', { name: 'Next scene' })).toBeDisabled();
  act(() => { vi.advanceTimersByTime(300000); });
  expect(screen.getByRole('heading', { name: storyScenes[8].title })).toBeInTheDocument();
});

test('graph interactions and inspection keep the current scene; manual navigation clears its preview', () => {
  vi.useFakeTimers();
  const onExplore = vi.fn();
  const { unmount } = render(<StoryWalkthrough onExplore={onExplore} />);
  const graph = screen.getByRole('group', { name: 'Story graph' });
  fireEvent.keyDown(graph, { key: 'ArrowRight' });
  act(() => { vi.advanceTimersByTime(1); });
  expect(screen.getByRole('dialog', { name: 'Zero Cool' })).toBeInTheDocument();
  fireEvent.pointerDown(graph);
  fireEvent.pointerMove(graph);
  fireEvent.pointerUp(graph);
  fireEvent.wheel(graph, { deltaY: 100 });
  for (const name of ['Zoom in', 'Zoom out', 'Fit']) {
    const control = screen.getByRole('button', { name, exact: true });
    expect(control).toBeEnabled();
    fireEvent.click(control);
  }
  const id = storyScenes[0].introduced[0];
  act(() => { renderer.props!.onNodeClick!({ id, label: 'Zero Cool', attrs: {}, provisional: false }, { kind: 'node', id }); });
  fireEvent.click(screen.getByRole('button', { name: 'Zero Cool threat-actor' }));
  fireEvent.click(screen.getByRole('button', { name: 'Explore object ↗' }));
  expect(onExplore).toHaveBeenCalledWith(storyScenes[0].introduced[0]);
  act(() => { vi.advanceTimersByTime(300000); });
  expect(screen.getByRole('heading', { name: storyScenes[0].title })).toBeInTheDocument();
  fireEvent.keyDown(graph, { key: 'ArrowRight' });
  act(() => { vi.advanceTimersByTime(1); });
  expect(screen.getByRole('dialog', { name: 'Zero Cool' })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Next scene' }));
  expect(screen.getByRole('heading', { name: storyScenes[1].title })).toBeInTheDocument();
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  unmount();
  expect(vi.getTimerCount()).toBe(0);
});

test('the new view stays separate from the reader and opens selected objects in the explorer', () => {
  window.history.replaceState({}, '', '?view=hackers&panel=walkthrough');
  render(<HackersExplorer />);
  expect(screen.getByRole('button', { name: 'Watch the story' })).toHaveAttribute('aria-pressed', 'true');
  expect(screen.queryByRole('complementary', { name: 'Object browser' })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Zero Cool threat-actor' }));
  fireEvent.click(screen.getByRole('button', { name: 'Explore object ↗' }));
  expect(screen.getByRole('button', { name: 'Explore connections' })).toHaveAttribute('aria-pressed', 'true');
  expect(within(screen.getByRole('region', { name: 'Selected instance' })).getByRole('heading', { name: 'Zero Cool' })).toBeInTheDocument();
});

test('each scene has one locally served, sourced still with a recoverable image fallback', () => {
  render(<StoryWalkthrough onExplore={() => {}} />);
  for (let step = 0; step < storyScenes.length; step++) {
    fireEvent.click(screen.getByRole('button', { name: `Scene ${step + 1}: ${storyScenes[step].shortTitle}` }));
    expect(screen.getAllByRole('img')).toHaveLength(1);
    expect(new URL(screen.getByRole('img').getAttribute('src')!, window.location.href).origin).toBe(window.location.origin);
    expect(screen.getByRole('img')).toHaveAttribute('alt', storyMedia[storyScenes[step].id].alt);
    expect(screen.getByRole('link', { name: 'Film still · source ↗' })).toHaveAttribute('href', storyMedia[storyScenes[step].id].source);
  }
  fireEvent.error(screen.getByRole('img'));
  expect(screen.getByText('Film still unavailable')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Previous scene' }));
  expect(screen.queryByText('Film still unavailable')).not.toBeInTheDocument();
});
