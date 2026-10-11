// Web Speech exposes no quality score. These are preference heuristics, applied
// only to voices the current browser actually returns, without browser sniffing.
const normalizeLanguage = (language: string) => language.toLowerCase().replaceAll('_', '-');
const isEnglish = (language: string) => /^en(?:-|$)/.test(normalizeLanguage(language));

function quality(voice: SpeechSynthesisVoice) {
  const description = `${voice.name} ${voice.voiceURI}`.toLowerCase().replaceAll(/[_.-]/g, ' ');
  if (/\b(natural|neural|premium)\b/.test(description)) return 5;
  if (/\benhanced\b/.test(description)) return 4;
  if (/\bsiri\b/.test(description) || /^google\b/i.test(voice.name)) return 3;
  if (/\b(alex|samantha)\b/.test(description)) return 2;
  // Avoid the novelty voices some systems include in their English catalog.
  if (/^(albert|bad news|bahh|bells|boing|bubbles|cellos|deranged|good news|hysterical|jester|organ|trinoids|whisper|zarvox)$/i.test(voice.name)) return -1;
  return 1;
}

export function preferredNarrationVoice(voices: readonly SpeechSynthesisVoice[], languages: readonly string[] = ['en-US']): SpeechSynthesisVoice | null {
  const dialect = normalizeLanguage(languages.find(isEnglish) ?? 'en-US');
  const score = (voice: SpeechSynthesisVoice) => quality(voice) * 100
    + (normalizeLanguage(voice.lang) === dialect ? 20 : 0)
    + (voice.default ? 10 : 0)
    + (voice.localService ? 1 : 0);
  return voices.filter(voice => isEnglish(voice.lang)).sort((a, b) =>
    score(b) - score(a) || a.name.localeCompare(b.name) || a.voiceURI.localeCompare(b.voiceURI),
  )[0] ?? null;
}
