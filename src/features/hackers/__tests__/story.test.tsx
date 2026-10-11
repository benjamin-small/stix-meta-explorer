import { act, fireEvent, render, screen, within } from '@testing-library/react';
import type { GraphClient } from '@poietic-tech/graphing-library';
import { bundleToGraph, hackersById, hackersObjects } from '../../../data/hackers';
import { storyFrames, storyScenes, sceneDuration } from '../story-scenes';
import { revealStoryGraph } from '../story-graph';
import StoryWalkthrough from '../StoryWalkthrough';
import HackersExplorer from '../HackersExplorer';
import { storyMedia } from '../story-media';

vi.mock('@poietic-tech/graphing-library/react', () => ({ GraphExplorer: () => <canvas aria-label="Graph renderer" /> }));

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

test('playback starts on request, pauses and resumes, and stops on the last scene', () => {
  vi.useFakeTimers();
  render(<StoryWalkthrough onExplore={() => {}} />);
  act(() => { vi.advanceTimersByTime(60000); });
  expect(screen.getByRole('heading', { name: 'A legend goes quiet.' })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Play story' }));
  act(() => { vi.advanceTimersByTime(5000); });
  fireEvent.click(screen.getByRole('button', { name: 'Pause' }));
  const progress = screen.getByRole('progressbar').getAttribute('aria-valuenow');
  act(() => { vi.advanceTimersByTime(60000); });
  expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', progress);
  fireEvent.click(screen.getByRole('button', { name: 'Play story' }));
  act(() => { vi.advanceTimersByTime(sceneDuration(0) - 5000 + 100); });
  expect(screen.getByRole('heading', { name: 'A new city. A new handle.' })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Scene 9: Aftermath' }));
  expect(screen.getByRole('button', { name: 'Play story' })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Play story' }));
  act(() => { vi.advanceTimersByTime(sceneDuration(8) + 100); });
  expect(screen.getByRole('button', { name: 'Replay story' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Next scene' })).toBeDisabled();
  fireEvent.click(screen.getByRole('button', { name: 'Replay story' }));
  expect(screen.getByRole('heading', { name: 'A legend goes quiet.' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Pause' })).toBeInTheDocument();
});

test('background tabs and inspection pause playback, and unmount cleans up its timer', () => {
  vi.useFakeTimers();
  const onExplore = vi.fn();
  const { unmount } = render(<StoryWalkthrough onExplore={onExplore} />);
  fireEvent.click(screen.getByRole('button', { name: 'Play story' }));
  fireEvent.click(screen.getByRole('button', { name: 'Zero Cool threat-actor' }));
  expect(screen.getByRole('button', { name: 'Play story' })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Explore object ↗' }));
  expect(onExplore).toHaveBeenCalledWith(storyScenes[0].introduced[0]);
  fireEvent.click(screen.getByRole('button', { name: 'Play story' }));
  vi.spyOn(document, 'hidden', 'get').mockReturnValue(true);
  fireEvent(document, new Event('visibilitychange'));
  expect(screen.getByRole('button', { name: 'Play story' })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Play story' }));
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

test('each scene has one sourced still, with a recoverable fallback when remote media fails', () => {
  render(<StoryWalkthrough onExplore={() => {}} />);
  for (let step = 0; step < storyScenes.length; step++) {
    fireEvent.click(screen.getByRole('button', { name: `Scene ${step + 1}: ${storyScenes[step].shortTitle}` }));
    expect(screen.getAllByRole('img')).toHaveLength(1);
    expect(screen.getByRole('img')).toHaveAttribute('alt', storyMedia[storyScenes[step].id].alt);
    expect(screen.getByRole('link', { name: 'Film still · source ↗' })).toHaveAttribute('href', storyMedia[storyScenes[step].id].source);
  }
  fireEvent.error(screen.getByRole('img'));
  expect(screen.getByText('Film still unavailable')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Previous scene' }));
  expect(screen.queryByText('Film still unavailable')).not.toBeInTheDocument();
});
