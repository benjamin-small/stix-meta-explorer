import { useEffect, useRef, useState } from 'react';
import type { MouseEvent } from 'react';
import { hackersObjects, hackersById, labelOf, report, objectHref, objectFamily, resolveHackersId } from '../../data/hackers';
import patterns from '../../data/hackers-1995/patterns.json';
import Narrative from './Narrative';
import BundleGraph from './BundleGraph';
import InstanceDetail from './InstanceDetail';
import StoryWalkthrough from './StoryWalkthrough';
import './hackers.css';

type Panel = 'explore' | 'story' | 'patterns' | 'walkthrough';
const types = [...new Set(hackersObjects.map(o => o.type))].sort();
const readLocation = () => {
  const params = new URLSearchParams(window.location.search);
  const panel = params.get('panel');
  return { requested: resolveHackersId(params.get('object')), panel: (panel === 'story' || panel === 'patterns' || panel === 'walkthrough' ? panel : 'explore') as Panel };
};

export default function HackersExplorer() {
  const [location, setLocation] = useState(readLocation);
  const [search, setSearch] = useState('');
  const [type, setType] = useState('all');
  const [browserOpen, setBrowserOpen] = useState(false);
  const [scope, setScope] = useState<'nearby' | 'all'>('nearby');
  const moveFocus = useRef(false);
  const readingPosition = useRef(0);
  const readingLink = useRef<HTMLElement | null>(null);
  const objectList = useRef<HTMLDivElement>(null);
  const selected = hackersById.get(location.requested ?? '') ?? hackersObjects[0];
  const filtered = hackersObjects.filter(o => (type === 'all' || o.type === type) &&
    `${labelOf(o)} ${o.type} ${o.id} ${String(o.aliases ?? '')}`.toLowerCase().includes(search.toLowerCase()));

  useEffect(() => {
    if (window.location.hash === '#instance' && window.matchMedia('(max-width: 760px)').matches) {
      document.getElementById('instance-title')?.scrollIntoView({ block: 'start' });
    }
    const onPopState = () => setLocation(readLocation());
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);
  useEffect(() => {
    if (moveFocus.current) {
      const heading = document.getElementById('instance-title');
      heading?.focus({ preventScroll: true });
      if (window.matchMedia('(max-width: 760px)').matches) heading?.scrollIntoView({ block: 'start' });
      moveFocus.current = false;
    }
  }, [location.requested, location.panel]);

  useEffect(() => {
    const list = objectList.current;
    const current = list?.querySelector<HTMLElement>('[aria-current]');
    if (list && current) list.scrollTop = Math.max(0, current.offsetTop - (list.clientHeight - current.offsetHeight) / 2);
  }, [selected.id, search, type]);

  function changePanel(panel: Panel) {
    const url = new URL(window.location.href);
    if (panel === 'explore') url.searchParams.delete('panel');
    else url.searchParams.set('panel', panel);
    url.hash = '';
    window.history.pushState({}, '', url);
    setLocation(current => ({ ...current, panel }));
  }

  function navigateObject(event: MouseEvent<HTMLElement>) {
    if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    const anchor = (event.target as Element).closest('a');
    if (!anchor || anchor.getAttribute('target')) return;
    const url = new URL(anchor.getAttribute('href') ?? '', window.location.href);
    const id = url.searchParams.get('object');
    if (url.origin !== window.location.origin || url.pathname !== window.location.pathname || url.searchParams.get('view') !== 'hackers' || !id || !hackersById.has(id)) return;
    event.preventDefault();
    if (anchor.closest('.case-stage')) {
      readingPosition.current = window.scrollY;
      readingLink.current = anchor as HTMLElement;
    }
    selectObject(id);
  }

  function selectObject(id: string) {
    if (!hackersById.has(id)) return;
    if (id === selected.id) {
      const heading = document.getElementById('instance-title');
      heading?.focus({ preventScroll: true });
      if (window.matchMedia('(max-width: 760px)').matches) heading?.scrollIntoView({ block: 'start' });
      return;
    }
    window.history.pushState({}, '', objectHref(id));
    moveFocus.current = true;
    setLocation(current => ({ ...current, requested: id }));
    setBrowserOpen(false);
  }

  return <main className={`hackers-explorer${location.panel === 'walkthrough' ? ' is-walkthrough' : ''}`} onClick={navigateObject}>
    <header className="case-header">
      <a className="case-back" href={window.location.pathname}>← STIX reference</a>
      <div className="case-title-row"><div><p className="case-eyebrow">A STIX 2.1 CASE STUDY</p><h1>Hackers <span>(1995)</span></h1></div><span className="case-count">75 objects <span>·</span> One connected story</span></div>
      <p className="case-intro">Follow the people, the attack, and the evidence behind the Gibson intrusion.</p>
      <nav className="case-nav" aria-label="Case views">
        <button aria-pressed={location.panel === 'explore'} onClick={() => changePanel('explore')}>Explore connections</button>
        <button aria-pressed={location.panel === 'walkthrough'} onClick={() => changePanel('walkthrough')}>Watch the story</button>
        <button aria-pressed={location.panel === 'story'} onClick={() => changePanel('story')}>Read the case</button>
        <button aria-pressed={location.panel === 'patterns'} onClick={() => changePanel('patterns')}>Indicator patterns <span>{patterns.length}</span></button>
      </nav>
    </header>
    {location.requested && !hackersById.has(location.requested) && <p role="status" className="case-notice">That object is not in this case. Showing Zero Cool instead.</p>}
    {location.panel === 'walkthrough' ? <StoryWalkthrough onExplore={id => {
      const url = new URL(objectHref(id), window.location.href);
      url.searchParams.delete('panel');
      moveFocus.current = true;
      window.history.pushState({}, '', url);
      setLocation({ requested: id, panel: 'explore' });
    }} /> : <div className={`case-workspace panel-${location.panel}`}>
      <aside className="case-browser case-panel" aria-label="Object browser">
        <div className="case-browser-heading"><h2>Case objects</h2><span>{hackersObjects.length}</span></div>
        <label htmlFor="bundle-search" className="sr-only">Search case objects</label>
        <div className="case-search"><span aria-hidden="true">⌕</span><input id="bundle-search" value={search} onChange={e => { setSearch(e.target.value); setBrowserOpen(true); }} placeholder="Name, alias, or ID…" />{search && <button aria-label="Clear search" onClick={() => setSearch('')}>×</button>}</div>
        <label htmlFor="bundle-type" className="sr-only">Filter object type</label>
        <select id="bundle-type" value={type} onChange={e => { setType(e.target.value); setBrowserOpen(true); }}><option value="all">All object types</option>{types.map(t => <option key={t} value={t}>{t}</option>)}</select>
        <div className="case-list-status"><span role="status">{filtered.length} {filtered.length === 1 ? 'result' : 'results'}</span><button className="case-mobile-toggle" aria-expanded={browserOpen} aria-controls="case-object-list" onClick={() => setBrowserOpen(o => !o)}>{browserOpen ? 'Hide list ↑' : 'Browse objects ↓'}</button></div>
        <div ref={objectList} id="case-object-list" className={`case-object-list ${browserOpen ? 'is-open' : ''}`}>
          <ul>{filtered.map(o => <li key={o.id}><a href={objectHref(o.id)} aria-current={o.id === selected.id ? 'true' : undefined}>
            <i style={{ background: objectFamily(o.type).color }} /><span><strong>{labelOf(o)}</strong><small>{o.type}</small></span>{o.id === selected.id && <span className="case-selected-mark" aria-hidden="true">›</span>}
          </a></li>)}</ul>
          {!filtered.length && <div className="case-no-results"><p>No objects match these filters.</p><button onClick={() => { setSearch(''); setType('all'); }}>Clear filters</button></div>}
        </div>
      </aside>
      <div className="case-stage">
        {location.panel === 'explore' && <BundleGraph selected={selected.id} scope={scope} onScopeChange={setScope} onNodeSelect={selectObject} />}
        {location.panel === 'story' && <article className="case-story case-panel"><p className="case-eyebrow">THE ELLINGSON CASE FILE · PLOT SPOILERS</p><h2>Hack the planet.</h2><p className="case-help">Select a highlighted citation to inspect its object. Select citations to explore without leaving the narrative.</p><Narrative text={String(report.description)} /></article>}
        {location.panel === 'patterns' && <section className="case-patterns case-panel"><p className="case-eyebrow">FROM EVIDENCE TO DETECTION</p><h2>Indicator patterns</h2><p className="case-help">STIX expressions with expected results from the case fixtures. These are examples, not a live pattern evaluator.</p>{patterns.map(p => <article key={p.name}><h3>{p.name}</h3><pre>{p.pattern}</pre><span className={`case-match ${p.expect.matched ? 'positive' : ''}`}>{p.expect.matched ? 'Expected match' : 'Expected no match'}</span>{p.expect.observed_data.length > 0 && <ul>{p.expect.observed_data.map(id => <li key={id}><a href={objectHref(id)}>{labelOf(hackersById.get(id)!)}</a></li>)}</ul>}</article>)}</section>}
      </div>
      <div className="case-inspector-slot">
        {location.panel !== 'explore' && <button className="case-return-reading" onClick={() => {
          readingLink.current?.focus({ preventScroll: true });
          window.scrollTo({ top: readingPosition.current });
        }}>↑ Back to {location.panel === 'story' ? 'reading' : 'patterns'}</button>}
        <InstanceDetail key={selected.id} object={selected} onReadStory={() => changePanel('story')} />
      </div>
    </div>}
    <footer className="case-footer">A fan-made teaching model of the film. Dates, addresses, file bytes, hashes, and sightings are synthetic; ATT&CK mappings are approximations. Not affiliated with the film’s makers or studio.</footer>
  </main>;
}
