import { useEffect, useState } from 'react';
import { hackersObjects, hackersById, labelOf, refsOf, report, objectHref } from '../../data/hackers';
import patterns from '../../data/hackers-1995/patterns.json';
import JsonExample from '../../components/JsonExample';
import Narrative from './Narrative';
import BundleGraph from './BundleGraph';

export default function HackersExplorer() {
  const [search, setSearch] = useState('');
  useEffect(() => {
    if (window.location.hash === '#instance') document.getElementById('instance')?.scrollIntoView();
  }, []);
  const requested = new URLSearchParams(window.location.search).get('object');
  const selected = hackersById.get(requested ?? '') ?? report;
  const filtered = hackersObjects.filter(o => `${labelOf(o)} ${o.type} ${o.id}`.toLowerCase().includes(search.toLowerCase()));
  const outgoing = refsOf(selected);
  const incoming = hackersObjects.flatMap(o => refsOf(o).filter(([, id]) => id === selected.id).map(([property]) => ({ object: o, property })));
  const relationships = hackersObjects.filter(o => o.type === 'relationship' && (o.source_ref === selected.id || o.target_ref === selected.id));
  const link = (id: string) => {
    const o = hackersById.get(id);
    return o ? <a href={objectHref(id)}>{labelOf(o)}</a> : <span>{id} (not in bundle)</span>;
  };
  return <main className="hackers-explorer max-w-screen-2xl mx-auto p-4 md:p-6 space-y-6">
    <header className="space-y-2"><a href={window.location.pathname}>← STIX type reference</a><h1 className="text-2xl font-bold">Hackers (1995): the case file</h1>
      <p className="text-cti-muted">Explore {hackersObjects.length} connected STIX objects from a fictional case. Fan-made educational data; not affiliated with the film’s makers or studio. Plot spoilers follow.</p>
      <p className="text-sm text-cti-muted">Maintained here. Originally contributed in <a href="https://github.com/poietic-tech/stix-rust/tree/06e3f72918321ab3e48397a428f44d6927bc7cf2/datasets/hackers-1995">stix-rust</a>, © 2026 Benjamin Small, MIT licensed.</p>
    </header>
    <section aria-label="Dataset graph"><h2 className="text-lg font-semibold">Connected objects</h2><p className="text-sm text-cti-muted mb-3">Arrows point from source to target. Select a node to inspect it. Container, creator, and marking references are omitted here; full references appear below.</p><BundleGraph selected={selected.id} /></section>
    <div className="grid lg:grid-cols-[18rem_minmax(0,1fr)] gap-6">
      <aside className="min-w-0"><label htmlFor="bundle-search">Find an instance</label><input id="bundle-search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Name, type, or ID" className="w-full my-2 p-2 rounded bg-cti-surface border border-cti-border" /><p className="text-sm text-cti-muted">{filtered.length} objects</p><ul className="max-h-96 overflow-auto space-y-2 mt-2">{filtered.map(o => <li key={o.id}><a aria-current={o.id === selected.id ? 'true' : undefined} href={objectHref(o.id)} className="block p-2 rounded bg-cti-surface"><span className="block">{labelOf(o)}</span><small className="text-cti-muted">{o.type}</small></a></li>)}</ul></aside>
      <section id="instance" aria-label="Selected instance" className="min-w-0 space-y-4">
        {requested && !hackersById.has(requested) && <p role="status">Unknown object ID. Showing the report.</p>}
        <h2 className="text-xl font-semibold">{labelOf(selected)}</h2><p className="break-all text-xs text-cti-muted">{selected.id}</p><a href={`?type=${encodeURIComponent(selected.type)}`}>View {selected.type} specification reference →</a>
        {typeof selected.description === 'string' && <Narrative text={selected.description} />}
        <div className="grid md:grid-cols-2 gap-4">
          <section><h3 className="font-semibold">Outgoing references</h3><ul>{outgoing.map(([p,id], i) => <li key={`${p}-${id}-${i}`}><span className="text-cti-muted">{p} → </span>{link(id)}</li>)}</ul>{!outgoing.length && <p className="text-cti-muted">None</p>}</section>
          <section><h3 className="font-semibold">Incoming references</h3><ul>{incoming.map(({object:o,property}, i) => <li key={`${o.id}-${property}-${i}`}>{link(o.id)}<span className="text-cti-muted"> → {property}</span></li>)}</ul>{!incoming.length && <p className="text-cti-muted">None</p>}</section>
        </div>
        <section><h3 className="font-semibold">Relationships</h3><ul>{relationships.map(o => <li key={o.id}>{link(String(o.source_ref))} → <a href={objectHref(o.id)}>{String(o.relationship_type)}</a> → {link(String(o.target_ref))}</li>)}</ul>{!relationships.length && <p className="text-cti-muted">None</p>}</section>
        <details><summary>Instance JSON</summary><JsonExample data={selected} /></details>
      </section>
    </div>
    {selected.id !== report.id && <details><summary>Read the report narrative</summary><Narrative text={String(report.description)} /></details>}
    <details><summary>Example indicator patterns</summary><JsonExample data={{ patterns }} /></details>
  </main>;
}
