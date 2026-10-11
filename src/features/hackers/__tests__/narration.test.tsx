import { StrictMode } from 'react';
import { act, fireEvent, render, screen, cleanup } from '@testing-library/react';
import StoryWalkthrough from '../StoryWalkthrough';
import { sceneDuration, storyScenes } from '../story-scenes';
import { VOICE_LOAD_WAIT_MS } from '../useNarrationVoice';

vi.mock('@poietic-tech/graphing-library/react', () => ({ GraphExplorer: () => <canvas /> }));

class Utterance {
  text: string;
  voice: SpeechSynthesisVoice | null = null;
  lang = '';
  onend: (() => void) | null = null;
  onerror: ((event?: { error: string }) => void) | null = null;
  onboundary: ((event: { charIndex: number }) => void) | null = null;
  constructor(text: string) { this.text = text; }
}
let spoken: Utterance[];
let voices: SpeechSynthesisVoice[];
let voiceEvents: EventTarget;
const basicVoice = { name: 'System English', lang: 'en-US', voiceURI: 'system-english', default: true, localService: true };
const naturalVoice = { ...basicVoice, name: 'Microsoft Ava Online (Natural)', voiceURI: 'ava', default: false, localService: false };
const synth = {
  speak: vi.fn((utterance: Utterance) => { spoken.push(utterance); }), cancel: vi.fn(), pause: vi.fn(), resume: vi.fn(),
  getVoices: vi.fn(() => voices),
  addEventListener: vi.fn((type: string, handler: EventListener) => voiceEvents.addEventListener(type, handler)),
  removeEventListener: vi.fn((type: string, handler: EventListener) => voiceEvents.removeEventListener(type, handler)),
};
beforeEach(() => {
  spoken = [];
  voices = [basicVoice];
  voiceEvents = new EventTarget();
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

test('graph interaction and inspection leave speech running; hiding the tab pauses and unmount stops it', () => {
  const { unmount } = render(<StoryWalkthrough onExplore={() => {}} />);
  enable(); play();
  fireEvent.click(screen.getByRole('button', { name: 'Zero Cool threat-actor' }));
  const graph = screen.getByRole('group', { name: 'Story graph' });
  fireEvent.pointerDown(graph);
  fireEvent.wheel(graph, { deltaY: 100 });
  expect(synth.pause).not.toHaveBeenCalled();
  expect(synth.cancel).not.toHaveBeenCalled();
  expect(spoken).toHaveLength(1);
  expect(screen.getByRole('button', { name: 'Pause' })).toBeInTheDocument();
  vi.spyOn(document, 'hidden', 'get').mockReturnValue(true);
  fireEvent(document, new Event('visibilitychange'));
  expect(synth.pause).toHaveBeenCalledOnce();
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

test('pause after each scene waits for all speech, holds for discussion, and plays the next scene once', () => {
  render(<StoryWalkthrough onExplore={() => {}} />);
  enable(); play();
  const setting = screen.getByRole('checkbox', { name: 'Pause after each scene' });
  fireEvent.click(setting);
  expect(spoken).toHaveLength(1);
  expect(synth.pause).not.toHaveBeenCalled();
  act(() => { spoken[0].onend?.(); });
  expect(screen.getByRole('heading', { name: storyScenes[0].title })).toBeInTheDocument();
  expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
  act(() => { vi.advanceTimersByTime(60000); });
  expect(spoken).toHaveLength(1);
  fireEvent.click(setting);
  expect(screen.getByRole('button', { name: 'Play next scene' })).toBeInTheDocument();
  expect(spoken).toHaveLength(1);
  fireEvent.click(screen.getByRole('button', { name: 'Play next scene' }));
  expect(spoken).toHaveLength(2);
  expect(spoken[1].text).toContain(storyScenes[1].text);
  act(() => { spoken[1].onend?.(); });
  expect(screen.getByRole('heading', { name: storyScenes[2].title })).toBeInTheDocument();
  fireEvent.click(setting);
  fireEvent.click(screen.getByRole('button', { name: 'Scene 9: Aftermath' }));
  play();
  act(() => { spoken.at(-1)?.onend?.(); });
  expect(screen.getByRole('button', { name: 'Replay story' })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Play next scene' })).not.toBeInTheDocument();
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

test('waits for an asynchronously populated catalog and uses the preferred voice on the first scene', () => {
  voices = [];
  const { unmount } = render(<StoryWalkthrough onExplore={() => {}} />);
  enable(); play();
  expect(spoken).toHaveLength(0);
  act(() => { voices = [basicVoice, naturalVoice]; voiceEvents.dispatchEvent(new Event('voiceschanged')); });
  expect(spoken).toHaveLength(1);
  expect(spoken[0].voice).toBe(naturalVoice);
  expect(spoken[0].lang).toBe('en-US');
  unmount();
  expect(synth.removeEventListener).toHaveBeenCalledWith('voiceschanged', expect.any(Function));
  expect(vi.getTimerCount()).toBe(0);
});

test('a late better voice applies to the next scene without restarting or resuming current speech', () => {
  render(<StoryWalkthrough onExplore={() => {}} />);
  enable(); play();
  expect(spoken[0].voice).toBe(basicVoice);
  fireEvent.click(screen.getByRole('button', { name: 'Pause' }));
  const resumes = synth.resume.mock.calls.length;
  act(() => { voices = [naturalVoice, basicVoice]; voiceEvents.dispatchEvent(new Event('voiceschanged')); });
  expect(spoken).toHaveLength(1);
  expect(spoken[0].voice).toBe(basicVoice);
  expect(synth.resume).toHaveBeenCalledTimes(resumes);
  play();
  act(() => { spoken[0].onend?.(); });
  expect(spoken[1].voice).toBe(naturalVoice);
});

test('an empty voice catalog cannot block Play indefinitely, and pausing cancels pending playback', () => {
  voices = [];
  render(<StoryWalkthrough onExplore={() => {}} />);
  enable(); play();
  fireEvent.click(screen.getByRole('button', { name: 'Pause' }));
  act(() => { vi.advanceTimersByTime(VOICE_LOAD_WAIT_MS); });
  expect(spoken).toHaveLength(0);
  play();
  expect(spoken).toHaveLength(1);
  expect(spoken[0].voice).toBeNull();
  expect(spoken[0].lang).toBe('en-US');
});

test('an unavailable preferred voice retries the browser fallback once, then reports a recoverable failure', () => {
  voices = [naturalVoice];
  render(<StoryWalkthrough onExplore={() => {}} />);
  enable(); play();
  expect(spoken[0].voice).toBe(naturalVoice);
  act(() => { spoken[0].onerror?.({ error: 'network' }); });
  expect(spoken).toHaveLength(2);
  expect(spoken[1].voice).toBeNull();
  expect(spoken[1].lang).toBe('en-US');
  expect(spoken[1].text).toBe(spoken[0].text);
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  act(() => { spoken[1].onerror?.({ error: 'network' }); });
  expect(spoken).toHaveLength(2);
  expect(screen.getByRole('alert')).toHaveTextContent('Read aloud could not play');
});
