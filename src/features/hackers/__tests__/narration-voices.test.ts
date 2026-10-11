import { preferredNarrationVoice } from '../narration-voices';

const voice = (name: string, options: Partial<SpeechSynthesisVoice> = {}): SpeechSynthesisVoice => ({
  name, lang: 'en-US', voiceURI: name, default: false, localService: true, ...options,
});

test('prefers available natural Edge and Google Chrome voices over ordinary defaults', () => {
  const system = voice('Microsoft David', { default: true });
  const google = voice('Google US English', { localService: false });
  const natural = voice('Microsoft Aria Online (Natural)', { localService: false });
  expect(preferredNarrationVoice([system, natural])).toBe(natural);
  expect(preferredNarrationVoice([system, google])).toBe(google);
});

test('prefers premium/enhanced Apple voices, including quality markers in the URI', () => {
  const standard = voice('Samantha', { default: true });
  const enhanced = voice('Samantha (Enhanced)');
  const premium = voice('Ava', { voiceURI: 'com.apple.voice.premium.en-US.Ava' });
  expect(preferredNarrationVoice([standard, enhanced, premium])).toBe(premium);
  expect(preferredNarrationVoice([standard, enhanced])).toBe(enhanced);
  expect(preferredNarrationVoice([voice('Fred'), standard])).toBe(standard);
});

test('ranks quality before dialect and breaks equal-quality ties by English browser language, default, then local service', () => {
  const us = voice('Natural US');
  const uk = voice('Natural UK', { lang: 'en_GB' });
  expect(preferredNarrationVoice([us, uk], ['fr-FR', 'en-GB'])).toBe(uk);
  expect(preferredNarrationVoice([voice('Standard UK', { lang: 'en-GB', default: true }), us], ['en-GB'])).toBe(us);
  const preferred = voice('System B', { default: true });
  expect(preferredNarrationVoice([voice('System A'), preferred])).toBe(preferred);
  const local = voice('Neural Local');
  expect(preferredNarrationVoice([voice('Neural Cloud', { localService: false }), local])).toBe(local);
});

test('never explicitly selects another language, avoids novelty voices, and keeps tie-breaking stable', () => {
  const english = voice('English voice');
  expect(preferredNarrationVoice([voice('Premium French', { lang: 'fr-FR', default: true }), english])).toBe(english);
  expect(preferredNarrationVoice([voice('Bells', { default: true }), english])).toBe(english);
  expect(preferredNarrationVoice([voice('French', { lang: 'fr-FR' })])).toBeNull();
  expect(preferredNarrationVoice([])).toBeNull();
  const list = [voice('Voice Z'), voice('Voice A')];
  const order = [...list];
  expect(preferredNarrationVoice(list)).toBe(preferredNarrationVoice([...list].reverse()));
  expect(list).toEqual(order);
});
