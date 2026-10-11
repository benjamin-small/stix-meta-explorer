import { render, screen, fireEvent, within } from '@testing-library/react';
import { createHash } from 'node:crypto';
import { hackersObjects, hackersById, refsOf, bundleToGraph, report } from '../../../data/hackers';
import patterns from '../../../data/hackers-1995/patterns.json';
import Narrative from '../Narrative';
import HackersExamples from '../HackersExamples';
import HackersExplorer from '../HackersExplorer';

test('owned dataset has unique STIX IDs, resolved references, and valid pattern fixtures', () => {
  expect(hackersObjects).toHaveLength(75);
  expect(hackersById.size).toBe(75);
  for (const o of hackersObjects) {
    expect(o.id).toMatch(new RegExp(`^${o.type}--[a-f0-9-]{36}$`));
    for (const [,id] of refsOf(o)) expect(hackersById.has(id), id).toBe(true);
  }
  for (const p of patterns) for (const id of p.expect.observed_data) expect(hackersById.get(id)?.type).toBe('observed-data');
  const file = hackersObjects.find(o => o.type === 'file')!;
  const artifact = hackersById.get(String(file.content_ref))!;
  expect(createHash('sha256').update(Buffer.from(String(artifact.payload_bin), 'base64')).digest('hex')).toBe((file.hashes as Record<string,string>)['SHA-256']);
});

test('graph excludes container edges, keeps observable refs, and collapses relationships', () => {
  const { nodes, edges } = bundleToGraph(hackersObjects);
  expect(nodes).toHaveLength(40);
  expect(edges.some(e => e.source === report.id)).toBe(false);
  expect(edges.some(e => e.label === 'object_refs' && e.source.startsWith('observed-data--'))).toBe(true);
  expect(edges.filter(e => e.relationshipId)).toHaveLength(35);
  for (const e of edges) { expect(nodes.some(n => n.id === e.source)).toBe(true); expect(nodes.some(n => n.id === e.target)).toBe(true); }
});

test('graph walks nested refs and drops dangling, duplicate, and self edges', () => {
  const objects = [{id:'a', type:'file', nested: { foo_ref:'b', bar_refs:['missing','a'] }, foo_ref:'b'}, {id:'b',type:'artifact'}];
  expect(bundleToGraph(objects).edges).toEqual([{id:'a|b|foo_ref',source:'a',target:'b',label:'foo_ref'}]);
});

test('narrative links known citations and never renders raw HTML or unsafe links', () => {
  const id = hackersObjects[0].id;
  const {container} = render(<Narrative text={'## Plot\n\n`'+id+'`\n\n<script>alert(1)</script>\n\n[bad](javascript:alert) ![tracking](https://example.com/image)\n\n[good](https://example.com)'} />);
  expect(screen.getByRole('heading', {name:'Plot'})).toBeInTheDocument();
  expect(container.querySelector(`a[href*="${id}"]`)).not.toBeNull();
  expect(container.querySelector('script, img, a[href^="javascript:"]')).toBeNull();
  expect(screen.getByText('good')).toHaveAttribute('href','https://example.com');
});

test('per-type examples include actual instances and explain missing coverage', () => {
  const {rerender} = render(<HackersExamples type="threat-actor" />);
  expect(screen.getByText('Zero Cool')).toBeInTheDocument();
  rerender(<HackersExamples type="email-message" />);
  expect(screen.getByText(/no email-message instances/)).toBeInTheDocument();
});

test('deep links select an instance with incoming and outgoing references', () => {
  const file = hackersObjects.find(o => o.type === 'file')!;
  window.history.replaceState({}, '', `?view=hackers&object=${file.id}`);
  render(<HackersExplorer />);
  expect(screen.getByRole('heading', {name:'garbage'})).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', {name:/References/}));
  expect(screen.getByRole('heading', {name:/Incoming references/})).toBeInTheDocument();
  expect(screen.getByText('content_ref')).toBeInTheDocument();
  window.history.replaceState({}, '', '/');
});


test('relationships explain source, verb, and target instead of an ID fragment', () => {
  const relation = hackersObjects.find(o => o.type === 'relationship' && o.relationship_type === 'targets')!;
  window.history.replaceState({}, '', `?view=hackers&object=${relation.id}`);
  render(<HackersExplorer />);
  const detail = screen.getByRole('region', { name: 'Selected instance' });
  expect(within(detail).getByRole('heading', { name: /→ targets →/ })).toBeInTheDocument();
  expect(within(detail).getByLabelText('Relationship endpoints')).toHaveTextContent('↓ targets');
  expect(within(detail).queryByText('None')).not.toBeInTheDocument();
  window.history.replaceState({}, '', '/');
});

test('selecting objects preserves filters and supports Back/Forward without reloading', () => {
  window.history.replaceState({}, '', '?view=hackers');
  render(<HackersExplorer />);
  fireEvent.change(screen.getByRole('textbox', { name: 'Search case objects' }), { target: { value: 'malware' } });
  fireEvent.change(screen.getByRole('combobox'), { target: { value: 'malware' } });
  const browser = screen.getByRole('complementary', { name: 'Object browser' });
  fireEvent.click(within(browser).getByRole('link', { name: /Da Vinci/ }));
  const selectedUrl = window.location.href;
  expect(screen.getByRole('textbox')).toHaveValue('malware');
  expect(screen.getByRole('combobox')).toHaveValue('malware');
  expect(within(screen.getByRole('region', { name: 'Selected instance' })).getByRole('heading', { name: 'Da Vinci' })).toBeInTheDocument();
  window.history.replaceState({}, '', '?view=hackers');
  fireEvent.popState(window);
  expect(within(screen.getByRole('region', { name: 'Selected instance' })).getByRole('heading', { name: 'Zero Cool' })).toBeInTheDocument();
  window.history.replaceState({}, '', selectedUrl);
  fireEvent.popState(window);
  expect(within(screen.getByRole('region', { name: 'Selected instance' })).getByRole('heading', { name: 'Da Vinci' })).toBeInTheDocument();
  expect(screen.getByRole('textbox')).toHaveValue('malware');
  window.history.replaceState({}, '', '/');
});

test('narrative citations update the inspector while the story stays open', () => {
  window.history.replaceState({}, '', '?view=hackers&panel=story');
  render(<HackersExplorer />);
  fireEvent.click(within(screen.getByRole('article')).getByRole('link', { name: 'Gibson', exact: true }));
  expect(screen.getByRole('button', { name: 'Read the case' })).toHaveAttribute('aria-pressed', 'true');
  expect(within(screen.getByRole('region', { name: 'Selected instance' })).getByRole('heading', { name: 'Gibson' })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Hack the planet.' })).toBeInTheDocument();
  window.history.replaceState({}, '', '/');
});

test('search recovery and context objects provide useful next actions', () => {
  window.history.replaceState({}, '', `?view=hackers&object=${report.id}`);
  render(<HackersExplorer />);
  fireEvent.change(screen.getByRole('textbox'), { target: { value: 'no-such-person' } });
  expect(screen.getByText('No objects match these filters.')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Clear filters' }));
  expect(screen.getByRole('textbox')).toHaveValue('');
  expect(screen.getByText('This object provides context')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Explore the whole case' }));
  expect(screen.getByRole('button', { name: 'All objects' })).toHaveAttribute('aria-pressed', 'true');
  window.history.replaceState({}, '', '/');
});
