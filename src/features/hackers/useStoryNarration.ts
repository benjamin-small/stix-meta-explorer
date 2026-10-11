import { useCallback, useEffect, useRef } from 'react';
import { useNarrationVoice } from './useNarrationVoice';

interface NarrationOptions {
  text: string;
  sceneVisit: number;
  enabled: boolean;
  playing: boolean;
  onEnd: () => void;
  onProgress: (fraction: number) => void;
  onError: () => void;
}

export function useStoryNarration({ text, sceneVisit, enabled, playing, onEnd, onProgress, onError }: NarrationOptions) {
  const supported = typeof window.speechSynthesis?.speak === 'function' && typeof window.SpeechSynthesisUtterance === 'function';
  const { voice, ready } = useNarrationVoice(supported);
  const current = useRef<SpeechSynthesisUtterance | null>(null);
  const paused = useRef(false);
  const endedWhilePaused = useRef(false);
  const callbacks = useRef({ onEnd, onProgress, onError });
  useEffect(() => { callbacks.current = { onEnd, onProgress, onError }; }, [onEnd, onProgress, onError]);

  const stop = useCallback(() => {
    const utterance = current.current;
    if (!utterance) return;
    current.current = null;
    utterance.onend = utterance.onerror = utterance.onboundary = null;
    // Detach before cancel: some engines dispatch interrupted/canceled events.
    window.speechSynthesis.cancel();
    paused.current = false;
    endedWhilePaused.current = false;
  }, []);

  // A new scene, disabling narration, or leaving the view discards old speech.
  useEffect(() => stop, [text, sceneVisit, enabled, stop]);
  useEffect(() => {
    if (!supported || !enabled) return;
    const synth = window.speechSynthesis;
    if (!playing) {
      if (current.current && !paused.current) {
        paused.current = true;
        synth.pause();
      }
      return;
    }
    try {
      if (current.current) {
        if (endedWhilePaused.current) {
          stop();
          callbacks.current.onEnd();
        } else if (paused.current) {
          paused.current = false;
          synth.resume();
        }
        return;
      }
      if (!ready) return;
      const speak = (chosen: SpeechSynthesisVoice | null) => {
        const utterance = new SpeechSynthesisUtterance(text);
        if (chosen) utterance.voice = chosen;
        utterance.lang = chosen?.lang ?? 'en-US';
        utterance.rate = 1;
        current.current = utterance;
        utterance.onboundary = event => {
          if (current.current === utterance && !paused.current) callbacks.current.onProgress(Math.min(.99, event.charIndex / text.length));
        };
        utterance.onend = () => {
          if (current.current !== utterance) return;
          // A late end event must not advance a story the reader just paused.
          if (paused.current) { endedWhilePaused.current = true; return; }
          current.current = null;
          callbacks.current.onEnd();
        };
        utterance.onerror = event => {
          if (current.current !== utterance) return;
          const retryDefault = chosen && !paused.current && ['voice-unavailable', 'language-unavailable', 'synthesis-unavailable', 'network'].includes(event?.error);
          stop();
          if (retryDefault) {
            // A listed voice can still be unavailable (for example, offline).
            // Retry once with the browser's English fallback, never in a loop.
            callbacks.current.onProgress(0);
            try { speak(null); } catch { stop(); callbacks.current.onError(); }
          } else callbacks.current.onError();
        };
        // Canceling a paused utterance does not unpause all browser engines.
        synth.resume();
        synth.speak(utterance);
      };
      speak(voice);
    } catch {
      stop();
      callbacks.current.onError();
    }
  }, [supported, enabled, playing, text, sceneVisit, voice, ready, stop]);

  return supported;
}
