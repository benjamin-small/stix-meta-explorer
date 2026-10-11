import { StrictMode } from 'react';
import { act, fireEvent, render, screen, cleanup } from '@testing-library/react';
import StoryWalkthrough from '../StoryWalkthrough';
import { sceneDuration, storyScenes } from '../story-scenes';

vi.mock('@poietic-tech/graphing-library/react', () => ({ GraphExplorer: () => <canvas /> }));

class Utterance {
  text: string;
  onend: (() => void) | null = null;
  onerror: (() => void) | null = null;
  onboundary: ((event: { charIndex: number }) => void) | null = null;
  constructor(text: string) { this.text = text; }
}
let spoken: Utterance[];
const synth = { speak: vi.fn((utterance: Utterance) => { spoken.push(utterance); }), cancel: vi.fn(), pause: vi.fn(), resume: vi.fn() };
beforeEach(() => {
  spoken = [];
  vi.useFakeTimers();
  vi.stubGlobal('speechSynthesis', synth);
  vi.stubGlobal('SpeechSynthesisUtterance', Utterance);
});
afterEach(() => {
  cleanup(); vi.useRealTimers(); vi.unstubAllGlobals(); vi.restoreAllMocks(); vi.clearAllMocks();
  window.history.replaceState({}, '', '/');
});
const play = () => fireEvent.click(screen.getByRole('button', { name: 'Play story' }));
const enable = () => fireEvent.click(screen.getByRole('checkbox', { name: 'Read aloud' }));

test('narration is opt-in, reads the displayed prose, and waits for speech instead of the reading timer', () => {
  render(<StrictMode><StoryWalkthrough onExplore={() => {}} /></StrictMode>);
  expect(synth.speak).not.toHaveBeenCalled();
  enable();
  expect(synth.speak).not.toHaveBeenCalled();
  play();
  expect(spoken).toHaveLength(1);
  expect(spoken[0].text).toBe(`${storyScenes[0].title} ${storyScenes[0].text} Reading the graph. ${storyScenes[0].takeaway}`);
  act(() => { vi.advanceTimersByTime(sceneDuration(0) * 3); });
  expect(screen.getByRole('heading', { name: storyScenes[0].title })).toBeInTheDocument();
  act(() => { spoken[0].onboundary?.({ charIndex: Math.floor(spoken[0].text.length / 2) }); });
  expect(Number(screen.getByRole('progressbar').getAttribute('aria-valuenow'))).toBeCloseTo(50, 0);
  act(() => { spoken[0].onend?.(); });
  expect(screen.getByRole('heading', { name: storyScenes[1].title })).toBeInTheDocument();
  expect(spoken).toHaveLength(2);
});

test('Pause resumes the same speech and a late end cannot skip a paused scene', () => {
  render(<StoryWalkthrough onExplore={() => {}} />);
  enable(); play();
  fireEvent.click(screen.getByRole('button', { name: 'Pause' }));
  expect(synth.pause).toHaveBeenCalledOnce();
  play();
  expect(spoken).toHaveLength(1);
  expect(synth.resume).toHaveBeenCalledTimes(2);
  fireEvent.click(screen.getByRole('button', { name: 'Pause' }));
  act(() => { spoken[0].onend?.(); });
  expect(screen.getByRole('heading', { name: storyScenes[0].title })).toBeInTheDocument();
  play();
  expect(screen.getByRole('heading', { name: storyScenes[1].title })).toBeInTheDocument();
});

test('scene changes, including the current chapter, cancel old speech and ignore its late callbacks', () => {
  render(<StoryWalkthrough onExplore={() => {}} />);
  enable(); play();
  const staleEnd = spoken[0].onend;
  const staleError = spoken[0].onerror;
  fireEvent.click(screen.getByRole('button', { name: 'Next scene' }));
  expect(synth.cancel).toHaveBeenCalledOnce();
  expect(screen.getByRole('button', { name: 'Play story' })).toBeInTheDocument();
  act(() => { staleEnd?.(); staleError?.(); });
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  expect(screen.getByRole('heading', { name: storyScenes[1].title })).toBeInTheDocument();
  play();
  expect(spoken[1].text).toContain(storyScenes[1].text);
  fireEvent.click(screen.getByRole('button', { name: 'Scene 2: Back online' }));
  play();
  expect(spoken).toHaveLength(3);
  window.history.replaceState({}, '', '?view=hackers&panel=walkthrough&scene=the-worm');
  fireEvent.popState(window);
  expect(synth.cancel).toHaveBeenCalledTimes(3);
  expect(screen.getByRole('button', { name: 'Play story' })).toBeInTheDocument();
});

test('inspection and hiding the tab pause speech; toggling off and unmount stop it', () => {
  const { unmount } = render(<StoryWalkthrough onExplore={() => {}} />);
  enable(); play();
  fireEvent.click(screen.getByRole('button', { name: 'Zero Cool threat-actor' }));
  expect(synth.pause).toHaveBeenCalledOnce();
  play();
  vi.spyOn(document, 'hidden', 'get').mockReturnValue(true);
  fireEvent(document, new Event('visibilitychange'));
  expect(synth.pause).toHaveBeenCalledTimes(2);
  enable();
  expect(synth.cancel).toHaveBeenCalledOnce();
  play();
  act(() => { vi.advanceTimersByTime(sceneDuration(0) + 100); });
  expect(screen.getByRole('heading', { name: storyScenes[1].title })).toBeInTheDocument();
  enable(); play();
  unmount();
  expect(synth.cancel).toHaveBeenCalledTimes(2);
  expect(vi.getTimerCount()).toBe(0);
});

test('the last spoken scene completes and Replay starts fresh', () => {
  window.history.replaceState({}, '', '?scene=the-aftermath');
  render(<StoryWalkthrough onExplore={() => {}} />);
  enable(); play();
  act(() => { spoken[0].onend?.(); });
  expect(screen.getByRole('button', { name: 'Replay story' })).toBeInTheDocument();
  expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
  fireEvent.click(screen.getByRole('button', { name: 'Replay story' }));
  expect(spoken[1].text).toContain(storyScenes[0].text);
});

test('speech errors pause with a recoverable text fallback; absent APIs disable only narration', () => {
  const view = render(<StoryWalkthrough onExplore={() => {}} />);
  enable(); play();
  act(() => { spoken[0].onerror?.(); });
  expect(screen.getByRole('alert')).toHaveTextContent('Read aloud could not play');
  expect(screen.getByRole('checkbox', { name: 'Read aloud' })).not.toBeChecked();
  play();
  act(() => { vi.advanceTimersByTime(sceneDuration(0) + 100); });
  expect(screen.getByRole('heading', { name: storyScenes[1].title })).toBeInTheDocument();
  view.unmount();
  vi.stubGlobal('speechSynthesis', undefined);
  render(<StoryWalkthrough onExplore={() => {}} />);
  expect(screen.getByRole('checkbox', { name: 'Read aloud' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Play story' })).toBeEnabled();
});
