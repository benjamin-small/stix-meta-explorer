import { useCallback, useEffect, useRef, useState } from 'react';

// Speech recognition (including the prefixed API) is not in TypeScript's DOM types.
type RecognitionResult = { readonly 0: { transcript: string } };
export type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onresult: ((event: { results: ArrayLike<RecognitionResult> }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
};
type RecognitionConstructor = new () => Recognition;
type Session = { recognition: Recognition; started: boolean; stopping: boolean; timer?: ReturnType<typeof setTimeout> };
type VoicePhase = 'idle' | 'starting' | 'listening' | 'stopping';
export const MAX_QUESTION_LENGTH = 16000;

function recognitionConstructor(): RecognitionConstructor | undefined {
  if (typeof window === 'undefined' || !window.isSecureContext) return;
  const browser = window as Window & { SpeechRecognition?: RecognitionConstructor; webkitSpeechRecognition?: RecognitionConstructor };
  return browser.SpeechRecognition ?? browser.webkitSpeechRecognition;
}

function errorMessage(error: string): string {
  switch (error) {
    case 'not-allowed':
    case 'service-not-allowed': return 'Microphone access or speech recognition was blocked. Check site permissions, or type your question.';
    case 'audio-capture': return 'No microphone is available. Check your microphone connection and permissions.';
    case 'no-speech': return 'No speech was detected. Try the microphone again, or type your question.';
    case 'network': return 'Voice input could not connect. Check your connection, or type your question.';
    case 'language-not-supported': return 'The browser cannot recognize this language. You can still type your question.';
    case 'aborted': return '';
    default: return 'Voice input stopped unexpectedly. Try the microphone again, or type your question.';
  }
}

export function useVoiceInput() {
  const [Recognition] = useState(() => recognitionConstructor());
  const [phase, setPhase] = useState<VoicePhase>('idle');
  const [error, setError] = useState('');
  const active = useRef<Session | null>(null);

  const release = useCallback((abort = true) => {
    const session = active.current;
    active.current = null;
    if (!session) return;
    clearTimeout(session.timer);
    const recognition = session.recognition;
    recognition.onstart = recognition.onend = recognition.onresult = recognition.onerror = null;
    if (abort) {
      // Some engines throw when aborting a session that has already ended.
      try { recognition.abort(); } catch { /* The session is already detached. */ }
    }
  }, []);

  const cancel = useCallback(() => {
    release();
    setPhase('idle');
    setError('');
  }, [release]);

  useEffect(() => () => release(), [release]);

  function start(draft: string, onTranscript: (text: string) => void) {
    if (!Recognition || active.current || draft.length >= MAX_QUESTION_LENGTH) return;
    setError('');
    try {
      const recognition = new Recognition();
      const session: Session = { recognition, started: false, stopping: false };
      active.current = session;
      recognition.lang = document.documentElement.lang || 'en-US';
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      let receivedText = false;
      recognition.onstart = () => {
        if (active.current !== session) return;
        session.started = true;
        setPhase('listening');
      };
      recognition.onresult = event => {
        if (active.current !== session) return;
        // Results include earlier final phrases and replaceable interim phrases.
        // Rebuild from the initial draft so revisions never duplicate words.
        const transcript = Array.from(event.results, result => result[0].transcript.trim()).filter(Boolean).join(' ');
        receivedText ||= Boolean(transcript);
        const separator = draft && transcript && !/\s$/.test(draft) ? ' ' : '';
        const text = draft + separator + transcript;
        onTranscript(text.slice(0, MAX_QUESTION_LENGTH));
        if (text.length >= MAX_QUESTION_LENGTH) {
          release();
          setPhase('idle');
          setError('The message reached its length limit. Review or shorten it before continuing.');
        }
      };
      recognition.onerror = event => {
        if (active.current !== session) return;
        release();
        setPhase('idle');
        setError(errorMessage(event.error));
      };
      recognition.onend = () => {
        if (active.current !== session) return;
        release(false);
        setPhase('idle');
        if (!receivedText) setError(errorMessage('no-speech'));
      };
      setPhase('starting');
      recognition.start();
    } catch (error) {
      release();
      setPhase('idle');
      setError(errorMessage(error instanceof DOMException && error.name === 'NotAllowedError' ? 'not-allowed' : 'unknown'));
    }
  }

  function stop() {
    const session = active.current;
    if (!session || session.stopping) return;
    if (!session.started) { cancel(); return; }
    session.stopping = true;
    setPhase('stopping');
    // Allow the engine to finalize its last phrase, but don't leave the UI stuck
    // if a browser never emits end after stop().
    session.timer = setTimeout(() => {
      if (active.current !== session) return;
      release();
      setPhase('idle');
    }, 4000);
    try { session.recognition.stop(); }
    catch { cancel(); }
  }

  return { supported: Boolean(Recognition), phase, active: phase !== 'idle', error, start, stop, cancel };
}
