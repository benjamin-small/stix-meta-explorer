import { Component, lazy, Suspense, useRef, useState, type ReactNode } from 'react';

// The gate imports no model, worker, corpus, or WASM. Opening is the only load trigger.
const AgentLauncher = lazy(() => import('./AgentLauncher'));
class PanelBoundary extends Component<{ children: ReactNode; onClose: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (this.state.failed) return <aside className="fixed right-0 top-0 z-40 w-full max-w-lg bg-cti-surface p-6 text-cti-text" role="alert"><button onClick={this.props.onClose}>Close assistant</button><p>The assistant could not load. Reload the page and try again. The explorer is still available.</p></aside>;
    return this.props.children;
  }
}
export default function AgentGate({ selectedType }: { selectedType?: string }) {
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  if (import.meta.env.VITE_STIX_AGENT !== 'true') return null;
  const close = () => { setOpen(false); requestAnimationFrame(() => trigger.current?.focus()); };
  return <>
    <button ref={trigger} type="button" aria-expanded={open} aria-controls="stix-agent-panel"
      onClick={() => setOpen(true)} hidden={open}
      className="fixed right-0 top-1/2 z-40 rounded-l-xl border border-cti-border bg-cti-surface px-3 py-4 text-sm text-cti-text shadow-xl hover:border-cti-sco focus-visible:outline focus-visible:outline-cti-sco">
      <span aria-hidden="true">✦ </span>Ask STIX
    </button>
    {open && <PanelBoundary onClose={close}><Suspense fallback={<aside id="stix-agent-panel" aria-label="STIX assistant loading" className="fixed right-0 top-0 z-40 h-dvh w-full max-w-lg bg-cti-surface p-6 text-cti-text shadow-2xl"><button onClick={close} className="float-right">Close</button><p role="status">Opening STIX assistant…</p></aside>}>
      <AgentLauncher onClose={close} selectedType={selectedType} />
    </Suspense></PanelBoundary>}
  </>;
}
