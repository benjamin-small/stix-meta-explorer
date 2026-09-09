import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { assessDevice, previousRuntimeSession } from './availability';
import './agent.css';

// Keep the inference panel (and its worker entry point) behind the preflight.
const AgentPanel = lazy(() => import('./AgentPanel'));
export default function AgentLauncher({ onClose, selectedType }: { onClose: () => void; selectedType?: string }) {
  const [check] = useState(() => ({
    device: assessDevice(navigator),
    session: previousRuntimeSession(),
    secure: window.isSecureContext,
    runtime: typeof Worker !== 'undefined' && typeof WebAssembly !== 'undefined',
  }));
  const [confirmed, setConfirmed] = useState(false);
  const closeButton = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);
  const blocked = !check.secure || !check.runtime || check.device.status === 'blocked';
  const ready = !blocked && (confirmed || (check.device.status === 'allowed' && !check.session));
  useEffect(() => {
    if (ready) return;
    closeButton.current?.focus();
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.stopImmediatePropagation(); event.preventDefault(); onCloseRef.current(); }
    };
    document.addEventListener('keydown', escape, true);
    return () => document.removeEventListener('keydown', escape, true);
  }, [ready]);
  if (ready) return <Suspense fallback={<aside className="stix-agent agent-preflight" aria-label="STIX assistant loading"><button onClick={onClose}>Close assistant</button><p role="status">Opening local assistant…</p></aside>}><AgentPanel onClose={onClose} selectedType={selectedType} /></Suspense>;
  let explanation = 'This browser does not report device RAM. Use a desktop with at least 8 GB RAM and close other memory-heavy tabs before loading.';
  if (!check.secure) explanation = 'Open this site through HTTPS or a localhost SSH tunnel to enable browser inference.';
  else if (!check.runtime) explanation = 'This browser does not provide the Web Worker and WebAssembly support required by the local model.';
  else if (check.device.reason === 'mobile') explanation = 'Local AI is disabled on phones and tablets for now. Their browser memory limits can terminate the page while loading this model, even on recent devices. Use the assistant on a desktop computer.';
  else if (check.device.reason === 'memory') explanation = `This browser reports approximately ${check.device.memoryGB} GB of device RAM. Local AI is disabled on devices reporting 4 GB or less. Use a desktop with at least 8 GB RAM.`;
  return <aside id="stix-agent-panel" className="stix-agent" role="dialog" aria-modal="false" aria-labelledby="stix-agent-title">
    <header className="agent-header"><div><div className="agent-eyebrow">EXPERIMENTAL · ON THIS DEVICE</div><h2 id="stix-agent-title">STIX assistant <span>2.1</span></h2></div><button ref={closeButton} onClick={onClose} aria-label="Close STIX assistant">✕</button></header>
    <div className="agent-preflight">
      <h3>{blocked ? 'Local AI unavailable on this device' : check.session === 'interrupted' ? 'Model reload paused' : 'Before loading local AI'}</h3>
      <p role={blocked ? 'alert' : 'status'}>{blocked || check.device.reason === 'unknown' ? explanation : 'Use a desktop with at least 8 GB RAM and close other memory-heavy tabs before loading.'}</p>
      {!blocked && check.session === 'interrupted' && <p>Your previous model session ended without unloading. That can happen after a refresh or a browser crash. Automatic loading is paused to avoid repeating it.</p>}
      {!blocked && check.session === 'unavailable' && <p>Browser storage is unavailable, so we cannot remember interrupted loads. Loading requires this confirmation each time.</p>}
      <p>The model downloads about 233 MB and has used about 1.9 GB of WASM memory on desktop, plus GPU and browser memory. Device RAM does not tell us how much memory a tab can safely use.</p>
      <p>The STIX explorer remains available. No model has been loaded.</p>
      <div className="agent-preflight-actions">{!blocked && <button className="agent-primary" onClick={() => setConfirmed(true)}>Load desktop model</button>}<button onClick={onClose}>Back to explorer</button></div>
    </div>
  </aside>;
}
