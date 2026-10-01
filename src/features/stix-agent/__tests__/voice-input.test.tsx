import { useState } from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import AgentPanel from '../AgentPanel';
import { MAX_QUESTION_LENGTH, type Recognition } from '../useVoiceInput';
import type { Request, Response } from '../protocol';

class FakeRecognition implements Recognition {
  static instances: FakeRecognition[] = [];
  lang = '';
  continuous = false;
  interimResults = false;
  maxAlternatives = 0;
  onstart: Recognition['onstart'] = null;
  onend: Recognition['onend'] = null;
  onresult: Recognition['onresult'] = null;
  onerror: Recognition['onerror'] = null;
  start = vi.fn();
  stop = vi.fn();
  abort = vi.fn();
  constructor() { FakeRecognition.instances.push(this); }
  started() { act(() => this.onstart?.()); }
  result(...phrases: string[]) {
    act(() => this.onresult?.({ results: phrases.map(transcript => ({ 0: { transcript } })) }));
  }
  end() { act(() => this.onend?.()); }
  error(error: string) { act(() => this.onerror?.({ error })); }
}

class FakeWorker {
  static current: FakeWorker;
  onmessage?: (event: { data: Response }) => void;
  onerror?: (event: { message: string }) => void;
  postMessage = vi.fn<(message: Request) => void>();
  terminate = vi.fn();
  constructor() { FakeWorker.current = this; }
  ready() { act(() => this.onmessage?.({ data: { type: 'ready', id: 'init', backend: { backend: 'cpu' }, cached: true, manifest: {} as never } })); }
}

beforeEach(() => {
  FakeRecognition.instances = [];
  sessionStorage.clear();
  vi.stubGlobal('SpeechRecognition', FakeRecognition);
  vi.stubGlobal('webkitSpeechRecognition', undefined);
  vi.stubGlobal('Worker', FakeWorker);
  vi.stubGlobal('isSecureContext', true);
});
afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllGlobals(); sessionStorage.clear(); });

function Host() {
  const [open, setOpen] = useState(true);
  return open ? <AgentPanel onClose={() => setOpen(false)} /> : null;
}
function openPanel(ready = true) {
  const view = render(<Host />);
  if (ready) FakeWorker.current.ready();
  return view;
}
const input = () => screen.getByLabelText('Ask a STIX question');
function startVoice() {
  fireEvent.click(screen.getByRole('button', { name: 'Start voice input' }));
  return FakeRecognition.instances.at(-1)!;
}
function expectDraft(text: string) { expect(input()).toHaveValue(text); }
function generations() { return FakeWorker.current.postMessage.mock.calls.filter(([request]) => request.type === 'generate'); }

test('microphone is dormant until clicked; speech updates the draft and requires explicit sending', () => {
  openPanel();
  expect(FakeRecognition.instances).toHaveLength(0);
  expect(screen.queryByText(/Read aloud/)).toBeNull();
  expect(screen.getByText(/Voice input may send audio/)).toBeVisible();
  const recognition = startVoice();
  expect(recognition.start).toHaveBeenCalledOnce();
  expect(recognition).toMatchObject({ continuous: true, interimResults: true, maxAlternatives: 1 });
  expect(screen.getByText(/Starting microphone/)).toBeVisible();
  recognition.started();
  expect(screen.getByText(/Listening…/)).toBeVisible();
  recognition.result('What is an');
  expectDraft('What is an');
  recognition.result('What is an indicator?');
  expectDraft('What is an indicator?');
  expect(generations()).toHaveLength(0);
  fireEvent.click(screen.getByRole('button', { name: 'Stop voice input' }));
  expect(recognition.stop).toHaveBeenCalledOnce();
  expect(screen.getByText('Finishing dictation…')).toBeVisible();
  recognition.result('What is an indicator in STIX?');
  recognition.end();
  expectDraft('What is an indicator in STIX?');
  expect(screen.getByRole('button', { name: 'Start voice input' })).toBeEnabled();
  fireEvent.click(screen.getByRole('button', { name: 'Send ↑' }));
  expect(generations()[0][0]).toMatchObject({ text: 'What is an indicator in STIX?' });
  expectDraft('');
});

test('dictation appends to an existing draft, revises interim phrases, and resumes without duplicates', () => {
  openPanel();
  fireEvent.change(input(), { target: { value: 'Please explain' } });
  const first = startVoice(); first.started();
  first.result('the indicator.', 'And');
  expectDraft('Please explain the indicator. And');
  first.result('the indicator.', 'And its properties.');
  expectDraft('Please explain the indicator. And its properties.');
  first.end();
  const second = startVoice(); second.started(); second.result('Include examples.'); second.end();
  expectDraft('Please explain the indicator. And its properties. Include examples.');
  expect(generations()).toHaveLength(0);
});

test('editing the draft stops recognition and stale results cannot overwrite the edit', () => {
  openPanel();
  const recognition = startVoice(); recognition.started(); recognition.result('Initial dictation');
  const lateResult = recognition.onresult!;
  fireEvent.change(input(), { target: { value: 'My correction' } });
  expect(recognition.abort).toHaveBeenCalledOnce();
  act(() => lateResult({ results: [{ 0: { transcript: 'Late dictation' } }] }));
  expectDraft('My correction');
  expect(screen.getByRole('button', { name: 'Start voice input' })).toBeEnabled();
});

test.each(['send', 'new chat', 'backend', 'close', 'escape', 'unmount', 'worker error'])('%s ends microphone use and ignores late callbacks', action => {
  const view = openPanel();
  const recognition = startVoice(); recognition.started(); recognition.result('What is malware?');
  const lateResult = recognition.onresult!, lateError = recognition.onerror!, lateEnd = recognition.onend!;
  if (action === 'send') fireEvent.click(screen.getByRole('button', { name: 'Send ↑' }));
  if (action === 'new chat') fireEvent.click(screen.getByRole('button', { name: 'New chat' }));
  if (action === 'backend') fireEvent.change(screen.getByRole('combobox', { name: 'Inference backend' }), { target: { value: 'cpu' } });
  if (action === 'close') fireEvent.click(screen.getByRole('button', { name: 'Close STIX assistant' }));
  if (action === 'escape') fireEvent.keyDown(document, { key: 'Escape' });
  if (action === 'unmount') view.unmount();
  if (action === 'worker error') act(() => FakeWorker.current.onerror?.({ message: 'Worker stopped' }));
  expect(recognition.abort).toHaveBeenCalledOnce();
  act(() => {
    lateResult({ results: [{ 0: { transcript: 'Should not appear' } }] });
    lateError({ error: 'not-allowed' }); lateEnd();
  });
  expect(screen.queryByRole('button', { name: 'Stop voice input' })).toBeNull();
  expect(screen.queryByText(/Microphone access or speech recognition was blocked/)).toBeNull();
  if (action === 'send') expectDraft('');
  if (action === 'new chat' || action === 'backend' || action === 'worker error') expectDraft('What is malware?');
});

test('stopping during startup cancels a pending microphone request', () => {
  openPanel();
  const recognition = startVoice();
  const lateStart = recognition.onstart!;
  fireEvent.click(screen.getByRole('button', { name: 'Stop voice input' }));
  expect(recognition.abort).toHaveBeenCalledOnce();
  act(() => lateStart());
  expect(screen.queryByText(/Listening…/)).toBeNull();
  expect(screen.getByRole('button', { name: 'Start voice input' })).toBeEnabled();
});

test('stop recovers even if the engine never emits end', () => {
  vi.useFakeTimers();
  openPanel();
  const recognition = startVoice(); recognition.started(); recognition.result('A question');
  fireEvent.click(screen.getByRole('button', { name: 'Stop voice input' }));
  act(() => vi.advanceTimersByTime(4000));
  expect(recognition.abort).toHaveBeenCalledOnce();
  expectDraft('A question');
  expect(screen.getByRole('button', { name: 'Start voice input' })).toBeEnabled();
});

test.each([
  ['not-allowed', /Microphone access or speech recognition was blocked/],
  ['service-not-allowed', /Microphone access or speech recognition was blocked/],
  ['audio-capture', /No microphone is available/],
  ['no-speech', /No speech was detected/],
  ['network', /Voice input could not connect/],
  ['language-not-supported', /cannot recognize this language/],
])('%s errors preserve the draft and allow retry', (error, message) => {
  openPanel();
  fireEvent.change(input(), { target: { value: 'Keep this draft' } });
  const recognition = startVoice(); recognition.error(error as string);
  expect(screen.getByRole('alert')).toHaveTextContent(message as RegExp);
  expectDraft('Keep this draft');
  const next = startVoice();
  expect(next).not.toBe(recognition);
  expect(screen.queryByRole('alert')).toBeNull();
});

test('constructor and startup failures recover without losing the draft', () => {
  vi.stubGlobal('SpeechRecognition', class extends FakeRecognition {
    start = vi.fn(() => { throw new DOMException('Denied', 'NotAllowedError'); });
  });
  openPanel(); startVoice();
  expect(screen.getByRole('alert')).toHaveTextContent('blocked');
  expect(screen.getByRole('button', { name: 'Start voice input' })).toBeEnabled();
  cleanup();
  vi.stubGlobal('SpeechRecognition', class { constructor() { throw new Error('Unavailable'); } });
  openPanel();
  fireEvent.change(input(), { target: { value: 'Keep me' } });
  fireEvent.click(screen.getByRole('button', { name: 'Start voice input' }));
  expectDraft('Keep me');
  expect(screen.getByRole('alert')).toHaveTextContent('stopped unexpectedly');
});

test('prefixed recognition is supported', () => {
  vi.stubGlobal('SpeechRecognition', undefined);
  vi.stubGlobal('webkitSpeechRecognition', FakeRecognition);
  openPanel();
  const recognition = startVoice(); recognition.started(); recognition.result('A spoken question'); recognition.end();
  expectDraft('A spoken question');
});

test('unsupported recognition leaves typed chat available', () => {
  vi.stubGlobal('SpeechRecognition', undefined);
  openPanel();
  expect(screen.getByRole('button', { name: 'Start voice input' })).toBeDisabled();
  expect(screen.getByText(/Voice input is unavailable/)).toBeVisible();
  fireEvent.change(input(), { target: { value: 'A typed question' } });
  fireEvent.click(screen.getByRole('button', { name: 'Send ↑' }));
  expect(generations()[0][0]).toMatchObject({ text: 'A typed question' });
});

test('microphone is disabled while the model loads or generates', () => {
  openPanel(false);
  expect(screen.getByRole('button', { name: 'Start voice input' })).toBeDisabled();
  FakeWorker.current.ready();
  fireEvent.change(input(), { target: { value: 'A question' } });
  fireEvent.click(screen.getByRole('button', { name: 'Send ↑' }));
  expect(screen.getByRole('button', { name: 'Start voice input' })).toBeDisabled();
});

test('dictation respects the input length limit and stops capture', () => {
  openPanel();
  const prefix = 'x'.repeat(MAX_QUESTION_LENGTH - 5);
  fireEvent.change(input(), { target: { value: prefix } });
  const recognition = startVoice(); recognition.started(); recognition.result('a long transcript');
  expectDraft((prefix + ' a long transcript').slice(0, MAX_QUESTION_LENGTH));
  expect(recognition.abort).toHaveBeenCalledOnce();
  expect(screen.getByRole('alert')).toHaveTextContent('length limit');
  expect(screen.getByRole('button', { name: 'Start voice input' })).toBeDisabled();
});

test('ending without speech offers a retry and never restarts automatically', () => {
  openPanel();
  const recognition = startVoice(); recognition.started(); recognition.end();
  expect(screen.getByRole('alert')).toHaveTextContent('No speech was detected');
  expect(FakeRecognition.instances).toHaveLength(1);
  expect(generations()).toHaveLength(0);
});
