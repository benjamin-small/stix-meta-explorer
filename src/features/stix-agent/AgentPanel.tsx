import { useEffect, useRef, useState } from 'react';
import type { Evidence, Metrics, Request, Response } from './protocol';
import type { Message } from './prompt';
import { startRuntimeSession } from './availability';
import './agent.css';

type Turn = { id: string; question: string; answer: string; evidence: Evidence[]; metrics?: Metrics; complete: boolean };
type Phase = 'loading' | 'ready' | 'generating' | 'stopped' | 'error';
const presets = ['Which properties are required for an indicator?', 'How does an indicator relate to malware?', 'Is name required for a malware family?', 'How are open vocabularies different from enums?'];

export default function AgentPanel({ onClose, selectedType }: { onClose: () => void; selectedType?: string }) {
  const [phase, setPhase] = useState<Phase>('loading');
  const [status, setStatus] = useState('Starting local STIX assistant…');
  const [percent, setPercent] = useState<number>();
  const [backend, setBackend] = useState('Loading');
  const [preference, setPreference] = useState<'auto' | 'cpu'>('auto');
  const [epoch, setEpoch] = useState(0);
  const [draft, setDraft] = useState('');
  const [turns, setTurns] = useState<Turn[]>([]);
  const [warning, setWarning] = useState('');
  const [fatal, setFatal] = useState(false);
  const worker = useRef<Worker | null>(null);
  const releaseWorker = useRef<(() => void) | null>(null);
  const active = useRef('');
  const end = useRef<HTMLDivElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const questionInput = useRef<HTMLTextAreaElement>(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);
  useEffect(() => {
    closeButton.current?.focus();
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.stopImmediatePropagation(); event.preventDefault(); onCloseRef.current(); }
    };
    document.addEventListener('keydown', escape, true);
    return () => document.removeEventListener('keydown', escape, true);
  }, []);
  useEffect(() => { end.current?.scrollIntoView?.({ block: 'nearest' }); }, [turns]);
  useEffect(() => {
    if (!window.isSecureContext) {
      // No worker is created on HTTP LAN origins where required browser APIs are blocked.
      queueMicrotask(() => { setPhase('error'); setFatal(true); setStatus('Open this site through HTTPS or a localhost SSH tunnel to enable browser inference.'); });
      return;
    }
    const clearSession = startRuntimeSession();
    let instance: Worker;
    try { instance = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module', name: 'stix-agent' }); }
    catch (error) {
      clearSession();
      queueMicrotask(() => { setPhase('error'); setFatal(true); setStatus(`Could not start the local runtime: ${String(error)}. Close other tabs or use another computer.`); });
      return;
    }
    worker.current = instance;
    let released = false;
    const release = () => {
      if (released) return;
      released = true;
      instance.terminate(); clearSession();
      if (worker.current === instance) worker.current = null;
      if (releaseWorker.current === release) releaseWorker.current = null;
    };
    releaseWorker.current = release;
    instance.onmessage = ({ data: message }: MessageEvent<Response>) => {
      if (worker.current !== instance) return;
      if (message.type === 'progress') { setStatus(message.message); setPercent(message.percent); }
      if (message.type === 'ready') {
        setPhase('ready'); setPercent(undefined); setFatal(false);
        setBackend(message.backend.backend === 'webgpu' ? 'WebGPU' : 'CPU / WASM');
        setStatus(message.cached ? 'STIX model ready · cached on this device' : 'STIX model ready · local inference');
        setWarning(message.warning || '');
      }
      if (message.type === 'evidence') setTurns(t => t.map(turn => turn.id === message.id ? { ...turn, evidence: message.retrieval.facts } : turn));
      if (message.type === 'chunk') setTurns(t => t.map(turn => turn.id === message.id ? { ...turn, answer: message.text } : turn));
      if (message.type === 'complete') {
        setTurns(t => t.map(turn => turn.id === message.id ? { ...turn, answer: message.text, metrics: message.metrics, complete: message.metrics.stopReason !== 'cancelled' } : turn));
        setPhase('ready'); setStatus('Ready for your next STIX question.'); active.current = '';
      }
      if (message.type === 'error') { if (message.fatal) { release(); setBackend('Unloaded'); } setPhase(message.fatal ? 'error' : 'ready'); setStatus(message.message); setFatal(message.fatal); active.current = ''; }
    };
    instance.onerror = event => { if (worker.current === instance) { release(); setBackend('Unloaded'); setPhase('error'); setFatal(true); setStatus(`The local runtime stopped: ${event.message || 'worker unavailable'}. Close other tabs or use another computer before retrying. CPU mode still needs substantial memory.`); } };
    instance.postMessage({ type: 'init', id: 'init', manifestUrl: new URL(import.meta.env.BASE_URL + 'stix-agent/model/manifest.json', location.origin).href, backend: preference } satisfies Request);
    return release;
  }, [epoch, preference]);
  function send(text = draft) {
    if (phase !== 'ready' || !text.trim() || !worker.current) return;
    const id = crypto.randomUUID(); active.current = id;
    const history: Message[] = turns.filter(t => t.complete).slice(-8).flatMap(t => [{ role: 'user' as const, content: t.question }, { role: 'assistant' as const, content: t.answer }]);
    worker.current.postMessage({ type: 'generate', id, text: text.trim(), history, selectedType } satisfies Request);
    setTurns(t => [...t, { id, question: text.trim(), answer: '', evidence: [], complete: false }]);
    setDraft(''); setPhase('generating'); setStatus('Reading STIX references and generating locally…');
  }
  function stop() {
    // CPU prefill cannot process a cancel message until it yields. Termination also
    // stops a stalled GPU driver call and releases the entire worker-owned model.
    releaseWorker.current?.(); active.current = '';
    setPhase('stopped'); setStatus('Stopped. Resume to reload the cached model and continue.'); setBackend('Unloaded');
  }
  function retry() { setPhase('loading'); setFatal(false); setStatus('Loading cached STIX model…'); setEpoch(e => e + 1); }
  return <aside id="stix-agent-panel" role="dialog" aria-modal="false" aria-labelledby="stix-agent-title" className="stix-agent">
    <header className="agent-header">
      <div><div className="agent-eyebrow">EXPERIMENTAL · ON THIS DEVICE</div><h2 id="stix-agent-title">STIX assistant <span>2.1</span></h2></div>
      <button ref={closeButton} onClick={onClose} aria-label="Close STIX assistant" title="Close and unload model">✕</button>
    </header>
    <div className="agent-controls">
      <span className="agent-badge">{backend}</span>
      <label>Inference <select aria-label="Inference backend" value={preference} onChange={e => { setPhase('loading'); setStatus('Loading local runtime…'); setPreference(e.target.value as 'auto' | 'cpu'); }} disabled={phase === 'loading' || phase === 'generating'}><option value="auto">Auto / WebGPU</option><option value="cpu">CPU / WASM</option></select></label>
      <button disabled={phase === 'generating' || phase === 'loading'} onClick={() => { setTurns([]); worker.current?.postMessage({ type: 'reset', id: 'reset' } satisfies Request); questionInput.current?.focus(); }}>New chat</button>
    </div>
    <div className="agent-status" role={fatal ? 'alert' : 'status'}>{status}{phase === 'loading' && <progress aria-label="Model loading progress" max={100} value={percent} />}
      {(phase === 'error' || phase === 'stopped') && <button className="agent-primary" onClick={retry}>{phase === 'stopped' ? 'Resume chat' : 'Retry loading'}</button>}
    </div>
    {warning && <p className="agent-warning">{warning}</p>}
    <div className="agent-conversation" aria-label="STIX conversation">
      {turns.length === 0 && <div className="agent-welcome"><div className="agent-star" aria-hidden="true">✦</div><h3>Your STIX reference, in conversation.</h3><p>Ask about object properties, relationships, and modeling rules. Answers include the OASIS references supplied to the local model.</p><p className="agent-note">First opening downloads about 233 MB. Running the model has used about 1.9 GB of WASM memory, plus GPU and browser memory. Closing releases the model.</p><div className="agent-presets">{presets.map(q => <button key={q} disabled={phase !== 'ready'} onClick={() => send(q)}>{q}<span aria-hidden="true">↗</span></button>)}</div></div>}
      {turns.map((turn, index) => <article key={turn.id} className="agent-turn"><p className="agent-question">{turn.question}</p><div className="agent-answer">{turn.answer || (phase === 'generating' && index === turns.length - 1 ? 'Thinking…' : 'No response generated.')}</div>
        {(turn.evidence.length > 0 || turn.metrics) && <details><summary>References & performance</summary>{turn.evidence.map(f => <div className="agent-reference" key={f.id}><a href={f.source} target="_blank" rel="noreferrer">[{f.id}] {f.title} ↗</a><p>{f.text}</p></div>)}{turn.metrics && <p className="agent-metrics">{turn.metrics.inputTokens} input · {turn.metrics.outputTokens} output tokens · {((turn.metrics.firstTokenMs || 0) / 1000).toFixed(2)}s first token · {turn.metrics.tokensPerSecond.toFixed(1)} tokens/s · {(turn.metrics.wasmMemoryBytes / 1e6).toFixed(0)} MB WASM heap{turn.metrics.gpuDecodeVerified ? ' · GPU decoding verified' : ''}{turn.metrics.droppedTurns + turn.metrics.droppedFacts > 0 ? ` · Context trimmed (${turn.metrics.droppedTurns} turns, ${turn.metrics.droppedFacts} references)` : ''}</p>}</details>}
      </article>)}<div ref={end} />
    </div>
    <form className="agent-composer" onSubmit={e => { e.preventDefault(); send(); }}>
      {selectedType && <button className="agent-context" type="button" disabled={phase !== 'ready'} onClick={() => send(`Explain the ${selectedType} object.`)}>Selected object: {selectedType} ↗</button>}
      <label className="sr-only" htmlFor="stix-agent-question">Ask a STIX question</label>
      <textarea ref={questionInput} id="stix-agent-question" value={draft} onChange={e => setDraft(e.target.value)} maxLength={16000} placeholder="Ask a STIX 2.1 question…" rows={3} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); send(); } }} />
      <div className="agent-compose-footer"><small>Local AI · Check cited rules against the specification.</small>{phase === 'generating' || phase === 'loading' ? <button type="button" onClick={stop}>Stop</button> : <button className="agent-primary" type="submit" disabled={phase !== 'ready' || !draft.trim()}>Send ↑</button>}</div>
    </form>
  </aside>;
}
