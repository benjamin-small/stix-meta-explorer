import { StrictMode } from 'react';
import { act, fireEvent, render, screen, cleanup } from '@testing-library/react';
import StoryWalkthrough from '../StoryWalkthrough';
import { storyScenes } from '../story-scenes';
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
const read = () => fireEvent.click(screen.getByRole('button', { name: 'Read scene aloud' }));
const resume = () => fireEvent.click(screen.getByRole('button', { name: 'Resume narration' }));

test('narration is opt-in, reads the displayed prose, and completion stays on the same scene', () => {
  render(<StrictMode><StoryWalkthrough onExplore={() => {}} /></StrictMode>);
  expect(synth.speak).not.toHaveBeenCalled();
  read();
  expect(spoken).toHaveLength(1);
  expect(spoken[0].text).toBe(`${storyScenes[0].title} ${storyScenes[0].text} Reading the graph. ${storyScenes[0].takeaway}`);
  act(() => { vi.advanceTimersByTime(300000); });
  expect(screen.getByRole('heading', { name: storyScenes[0].title })).toBeInTheDocument();
  act(() => { spoken[0].onboundary?.({ charIndex: Math.floor(spoken[0].text.length / 2) }); });
  expect(Number(screen.getByRole('progressbar', { name: 'Scene narration' }).getAttribute('aria-valuenow'))).toBeCloseTo(50, 0);
  const sceneUrl = window.location.href;
  act(() => { spoken[0].onend?.(); vi.advanceTimersByTime(300000); });
  expect(screen.getByRole('heading', { name: storyScenes[0].title })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Read scene again' })).toBeInTheDocument();
  expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
  expect(window.location.href).toBe(sceneUrl);
  expect(spoken).toHaveLength(1);
  fireEvent.click(screen.getByRole('button', { name: 'Next scene' }));
  expect(screen.getByRole('heading', { name: storyScenes[1].title })).toBeInTheDocument();
  expect(spoken).toHaveLength(1);
  expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
});

test('Pause resumes the same speech and a late end cannot change the scene', () => {
  render(<StoryWalkthrough onExplore={() => {}} />);
  read();
  fireEvent.click(screen.getByRole('button', { name: 'Pause narration' }));
  expect(synth.pause).toHaveBeenCalledOnce();
  resume();
  expect(spoken).toHaveLength(1);
  expect(synth.resume).toHaveBeenCalledTimes(2);
  fireEvent.click(screen.getByRole('button', { name: 'Pause narration' }));
  act(() => { spoken[0].onend?.(); });
  expect(screen.getByRole('heading', { name: storyScenes[0].title })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Resume narration' })).toBeInTheDocument();
  resume();
  expect(screen.getByRole('heading', { name: storyScenes[0].title })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Read scene again' })).toBeInTheDocument();
});

test('scene changes, including the current chapter, cancel old speech and ignore its late callbacks', () => {
  render(<StoryWalkthrough onExplore={() => {}} />);
  read();
  const staleEnd = spoken[0].onend;
  const staleError = spoken[0].onerror;
  fireEvent.click(screen.getByRole('button', { name: 'Next scene' }));
  expect(synth.cancel).toHaveBeenCalledOnce();
  expect(screen.getByRole('button', { name: 'Read scene aloud' })).toBeInTheDocument();
  act(() => { staleEnd?.(); staleError?.(); });
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  expect(screen.getByRole('heading', { name: storyScenes[1].title })).toBeInTheDocument();
  read();
  expect(spoken[1].text).toContain(storyScenes[1].text);
  fireEvent.click(screen.getByRole('button', { name: 'Scene 2: Back online' }));
  read();
  expect(spoken).toHaveLength(3);
  window.history.replaceState({}, '', '?view=hackers&panel=walkthrough&scene=the-worm');
  fireEvent.popState(window);
  expect(synth.cancel).toHaveBeenCalledTimes(3);
  expect(screen.getByRole('button', { name: 'Read scene aloud' })).toBeInTheDocument();
});

test('graph interaction and inspection leave speech running; hiding the tab pauses and unmount stops it', () => {
  const { unmount } = render(<StoryWalkthrough onExplore={() => {}} />);
  read();
  fireEvent.click(screen.getByRole('button', { name: 'Zero Cool threat-actor' }));
  const graph = screen.getByRole('group', { name: 'Story graph' });
  fireEvent.pointerDown(graph);
  fireEvent.wheel(graph, { deltaY: 100 });
  expect(synth.pause).not.toHaveBeenCalled();
  expect(synth.cancel).not.toHaveBeenCalled();
  expect(spoken).toHaveLength(1);
  expect(screen.getByRole('button', { name: 'Pause narration' })).toBeInTheDocument();
  vi.spyOn(document, 'hidden', 'get').mockReturnValue(true);
  fireEvent(document, new Event('visibilitychange'));
  expect(synth.pause).toHaveBeenCalledOnce();
  expect(screen.getByRole('button', { name: 'Resume narration' })).toBeInTheDocument();
  act(() => { vi.advanceTimersByTime(300000); });
  expect(screen.getByRole('heading', { name: storyScenes[0].title })).toBeInTheDocument();
  resume();
  unmount();
  expect(synth.cancel).toHaveBeenCalledOnce();
  expect(vi.getTimerCount()).toBe(0);
});

test('the last spoken scene completes and Read scene again repeats only that scene', () => {
  window.history.replaceState({}, '', '?scene=the-aftermath');
  render(<StoryWalkthrough onExplore={() => {}} />);
  read();
  act(() => { spoken[0].onend?.(); });
  expect(screen.getByRole('button', { name: 'Read scene again' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Next scene' })).toBeDisabled();
  expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
  fireEvent.click(screen.getByRole('button', { name: 'Read scene again' }));
  expect(spoken).toHaveLength(2);
  expect(spoken[1].text).toBe(spoken[0].text);
  expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
  expect(screen.getByRole('heading', { name: storyScenes[8].title })).toBeInTheDocument();
});

test('speech errors allow a retry and manual navigation; absent APIs disable only narration', () => {
  const view = render(<StoryWalkthrough onExplore={() => {}} />);
  read();
  act(() => { spoken[0].onerror?.(); });
  expect(screen.getByRole('alert')).toHaveTextContent('Read aloud could not play');
  expect(screen.getByRole('button', { name: 'Read scene aloud' })).toBeEnabled();
  expect(screen.getByRole('heading', { name: storyScenes[0].title })).toBeInTheDocument();
  read();
  expect(spoken).toHaveLength(2);
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Next scene' }));
  expect(screen.getByRole('heading', { name: storyScenes[1].title })).toBeInTheDocument();
  view.unmount();
  vi.stubGlobal('speechSynthesis', undefined);
  render(<StoryWalkthrough onExplore={() => {}} />);
  expect(screen.getByRole('button', { name: 'Read scene aloud' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Next scene' })).toBeEnabled();
  fireEvent.click(screen.getByRole('button', { name: 'Next scene' }));
  expect(screen.getByRole('heading', { name: storyScenes[2].title })).toBeInTheDocument();
});

test('waits for an asynchronously populated catalog and uses the preferred voice on the first scene', () => {
  voices = [];
  const { unmount } = render(<StoryWalkthrough onExplore={() => {}} />);
  read();
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
  read();
  expect(spoken[0].voice).toBe(basicVoice);
  fireEvent.click(screen.getByRole('button', { name: 'Pause narration' }));
  const resumes = synth.resume.mock.calls.length;
  act(() => { voices = [naturalVoice, basicVoice]; voiceEvents.dispatchEvent(new Event('voiceschanged')); });
  expect(spoken).toHaveLength(1);
  expect(spoken[0].voice).toBe(basicVoice);
  expect(synth.resume).toHaveBeenCalledTimes(resumes);
  resume();
  act(() => { spoken[0].onend?.(); });
  expect(spoken).toHaveLength(1);
  fireEvent.click(screen.getByRole('button', { name: 'Next scene' }));
  read();
  expect(spoken[1].voice).toBe(naturalVoice);
});

test('an empty voice catalog cannot block narration indefinitely, and pausing cancels pending speech', () => {
  voices = [];
  render(<StoryWalkthrough onExplore={() => {}} />);
  read();
  fireEvent.click(screen.getByRole('button', { name: 'Pause narration' }));
  act(() => { vi.advanceTimersByTime(VOICE_LOAD_WAIT_MS); });
  expect(spoken).toHaveLength(0);
  resume();
  expect(spoken).toHaveLength(1);
  expect(spoken[0].voice).toBeNull();
  expect(spoken[0].lang).toBe('en-US');
});

test('an unavailable preferred voice retries the browser fallback once, then reports a recoverable failure', () => {
  voices = [naturalVoice];
  render(<StoryWalkthrough onExplore={() => {}} />);
  read();
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
