import type { Retrieval } from './protocol';
export type Message = { role: 'system' | 'user' | 'assistant'; content: string };
// Exact SmolLM2 chat template, with an explicit system turn and no extra BOS.
export function chatTemplate(messages: Message[]): string {
  return messages.map(m => `<|im_start|>${m.role}\n${safeContent(m.content)}<|im_end|>\n`).join('') + '<|im_start|>assistant\n';
}
export function safeContent(s: string): string { return s.replaceAll('<|', '‹|').replaceAll('|>', '|›'); }
export function renderRequest(question: string, result: Retrieval): string {
  let context = result.facts.map(f => `[${f.id}] ${f.text}`).join('\n') || '(No matching facts.)';
  if (result.ambiguity.length) context += '\nAmbiguous name. Candidates: ' + result.ambiguity.join(', ') + '. Ask which one.';
  if (result.notice) context += '\n' + result.notice;
  return `Evidence:\n${safeContent(context)}\n\nRequest: ${safeContent(question)}`;
}
export function boundPrompt(system: string, question: string, retrieval: Retrieval, encode: (s: string)=>Uint32Array) {
  const result = structuredClone(retrieval);
  let droppedFacts = 0;
  const build = () => chatTemplate([{role:'system',content:system}, {role:'user',content:renderRequest(question,result)}]);
  let ids = encode(build());
  while (ids.length > 1792 && result.facts.length) { result.facts.pop(); droppedFacts++; ids=encode(build()); }
  if (ids.length > 1792) throw new Error('This request is too long for the 2,048-token context. Shorten it and retry.');
  return { ids, retrieval: result, droppedTurns: 0, droppedFacts };
}

export function preparePrompt(
  system: string, history: Message[], question: string, selectedType: string | undefined,
  retrieve: (question: string, previous: string[]) => Retrieval, encode: (s: string) => Uint32Array,
) {
  // The tiny model copies or mutates previous assistant answers when they are
  // replayed in ChatML, even when the current references describe another topic.
  // History resolves subjects only; each generation uses fresh reference evidence.
  // Rebuilding this from completed user turns also makes Resume and New chat
  // independent of stale worker state. Generated answers never enter retrieval.
  let context: string[] = [];
  for (const message of history) if (message.role === 'user') {
    context = retrieve(message.content, context).entityIds;
  }
  if (!context.length && selectedType) context = [selectedType];
  return boundPrompt(system, question, retrieve(question, context), encode);
}
