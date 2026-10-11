import { useEffect, useState } from 'react';
import { preferredNarrationVoice } from './narration-voices';

export const VOICE_LOAD_WAIT_MS = 1200;

function readVoices(): SpeechSynthesisVoice[] {
  try { return window.speechSynthesis.getVoices(); } catch { return []; }
}

export function useNarrationVoice(supported: boolean) {
  const [voices, setVoices] = useState(() => supported ? readVoices() : []);
  const [waitExpired, setWaitExpired] = useState(false);
  useEffect(() => {
    if (!supported) return;
    const synth = window.speechSynthesis;
    const refresh = () => setVoices(readVoices());
    synth.addEventListener('voiceschanged', refresh);
    // Synchronize the external catalog after subscribing, including voices that
    // arrived between render and subscription.
    refresh();
    const timer = window.setTimeout(() => { refresh(); setWaitExpired(true); }, VOICE_LOAD_WAIT_MS);
    return () => { synth.removeEventListener('voiceschanged', refresh); window.clearTimeout(timer); };
  }, [supported]);
  return {
    voice: preferredNarrationVoice(voices, navigator.languages),
    ready: voices.length > 0 || waitExpired,
  };
}
