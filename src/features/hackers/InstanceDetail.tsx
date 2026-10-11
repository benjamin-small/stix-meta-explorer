import { useState } from 'react';
import type { BundleObject } from '../../data/hackers';
import { hackersObjects, hackersById, labelOf, refsOf, objectFamily, objectHref } from '../../data/hackers';
import JsonExample from '../../components/JsonExample';
import Narrative from './Narrative';

function ObjectLink({ id }: { id: string }) {
  const object = hackersById.get(id);
  return object ? <a href={objectHref(id)}>{labelOf(object)}</a> : <span>{id} (not in this case)</span>;
}

export default function InstanceDetail({ object, onReadStory }: { object: BundleObject; onReadStory: () => void }) {
  const [tab, setTab] = useState('details');
  const [copyState, setCopyState] = useState('Copy link');
  const outgoing = refsOf(object);
  const incoming = hackersObjects.flatMap(o => refsOf(o).filter(([, id]) => id === object.id).map(([property]) => ({ object: o, property })));
  const relationships = hackersObjects.filter(o => o.type === 'relationship' && (o.source_ref === object.id || o.target_ref === object.id));
  const family = objectFamily(object.type);
  const facts = ['aliases', 'labels', 'value', 'pattern', 'first_observed', 'last_observed', 'first_seen', 'last_seen', 'count', 'opinion', 'content', 'mime_type', 'hashes']
    .filter(key => object[key] !== undefined);

  return <section id="instance" className="case-inspector case-panel" aria-label="Selected instance">
    <header className="case-detail-heading">
      <p className="case-eyebrow">SELECTED OBJECT</p>
      <span className="case-type" style={{ color: family.color }}>{object.type}</span>
      <h2 id="instance-title" tabIndex={-1}>{labelOf(object)}</h2>
      <div className="case-detail-actions"><a href={`?type=${encodeURIComponent(object.type)}`}>Type reference ↗</a><button onClick={async () => {
        try {
          await navigator.clipboard.writeText(new URL(objectHref(object.id), window.location.href).href);
          setCopyState('Link copied');
        } catch { setCopyState('Copy the URL from your address bar'); }
      }}>{copyState}</button></div>
    </header>
    <div className="case-detail-tabs case-segment" aria-label="Object detail view">
      <button aria-pressed={tab === 'details'} onClick={() => setTab('details')}>Details</button>
      <button aria-pressed={tab === 'references'} onClick={() => setTab('references')}>References ({outgoing.length + incoming.length})</button>
      <button aria-pressed={tab === 'json'} onClick={() => setTab('json')}>JSON</button>
    </div>
    <div className="case-detail-body">
      {tab === 'details' && <>
        {object.type === 'relationship' && <div className="case-relation-summary" aria-label="Relationship endpoints">
          <span className="case-eyebrow">SOURCE</span><ObjectLink id={String(object.source_ref)} />
          <span className="case-relation-verb">↓ {String(object.relationship_type).replaceAll('-', ' ')}</span>
          <span className="case-eyebrow">TARGET</span><ObjectLink id={String(object.target_ref)} />
        </div>}
        {object.type === 'report' ? <div className="case-reading-prompt"><p>The complete case narrative connects the people, systems, and evidence in the film.</p><button className="case-button" onClick={onReadStory}>Read the case narrative →</button></div>
          : typeof object.description === 'string' && <Narrative text={object.description} />}
        {!!facts.length && <dl className="case-facts">{facts.map(key => <div key={key}><dt>{key.replaceAll('_', ' ')}</dt><dd>{typeof object[key] === 'object' && !Array.isArray(object[key]) ? <pre>{JSON.stringify(object[key], null, 2)}</pre> : String(Array.isArray(object[key]) ? object[key].join(' · ') : object[key])}</dd></div>)}</dl>}
        {!!relationships.length && <section className="case-connections"><h3>Relationships <span>{relationships.length}</span></h3><ul>{relationships.map(r => <li key={r.id}>
          <a href={objectHref(r.id)} className="case-connection"><span>{r.source_ref === object.id ? 'OUTGOING' : 'INCOMING'}</span><strong>{labelOf(r)}</strong></a>
        </li>)}</ul></section>}
        {!relationships.length && object.type !== 'relationship' && <p className="case-help">{outgoing.length + incoming.length ? 'Follow embedded links in the References tab.' : 'No connections recorded for this object.'}</p>}
      </>}
      {tab === 'references' && <div className="case-reference-groups">
        <section><h3>Outgoing references <span>{outgoing.length}</span></h3><ul>{outgoing.map(([property, id], i) => <li key={`${property}-${id}-${i}`}><span>{property}</span><ObjectLink id={id} /></li>)}</ul>{!outgoing.length && <p className="case-help">No outgoing references.</p>}</section>
        <section><h3>Incoming references <span>{incoming.length}</span></h3><ul>{incoming.map(({ object: source, property }, i) => <li key={`${source.id}-${property}-${i}`}><span>{property}</span><ObjectLink id={source.id} /></li>)}</ul>{!incoming.length && <p className="case-help">No incoming references.</p>}</section>
      </div>}
      {tab === 'json' && <JsonExample data={object} />}
      <details className="case-id"><summary>STIX identifier</summary><code>{object.id}</code></details>
    </div>
  </section>;
}
