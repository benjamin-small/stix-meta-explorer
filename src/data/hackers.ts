import bundle from './hackers-1995/bundle.json';
import idMigrations from './hackers-id-migrations.json';

// Preserve shared explorer URLs when a modeling correction requires a new STIX ID.
const migratedIds = new Map(Object.entries(idMigrations));
export const resolveHackersId = (id: string | null) => id === null ? null : migratedIds.get(id) ?? id;

export interface BundleObject extends Record<string, unknown> { id: string; type: string }
export const hackersObjects: BundleObject[] = bundle.objects;
export const hackersById = new Map(hackersObjects.map(o => [o.id, o]));
export const report = hackersObjects.find(o => o.type === 'report')!;
const basicLabel = (o: BundleObject): string => String(o.name ?? o.value ?? o.abstract ?? o.type);
export function labelOf(o: BundleObject): string {
  if (o.type === 'relationship') {
    const source = hackersById.get(String(o.source_ref));
    const target = hackersById.get(String(o.target_ref));
    return `${source ? basicLabel(source) : 'Unknown source'} → ${String(o.relationship_type).replaceAll('-', ' ')} → ${target ? basicLabel(target) : 'Unknown target'}`;
  }
  if (o.type === 'observed-data') return `Observation · ${String(o.first_observed).slice(0, 10)} · ${o.id.slice(-4)}`;
  if (o.type === 'sighting') {
    const indicator = hackersById.get(String(o.sighting_of_ref));
    return `Sighting · ${indicator ? basicLabel(indicator) : o.id.slice(-4)}`;
  }
  if (o.type === 'artifact') return `Garbage file contents (${String(o.mime_type ?? 'artifact')})`;
  if (o.type === 'opinion') return `${String(o.opinion).replaceAll('-', ' ')} · crew framed`;
  return basicLabel(o);
}

export function objectFamily(type: string): { label: string; color: string } {
  if (['domain-name', 'ipv4-addr', 'url', 'file', 'artifact'].includes(type)) return { label: 'Observables', color: '#69c5ed' };
  if (['relationship', 'sighting'].includes(type)) return { label: 'Relationships', color: '#c5a0f5' };
  if (['report', 'note', 'opinion', 'grouping'].includes(type)) return { label: 'Context', color: '#7dcba6' };
  return { label: 'Domain objects', color: '#f1b86a' };
}
export function refsOf(value: unknown): [string, string][] {
  if (Array.isArray(value)) return value.flatMap(refsOf);
  if (!value || typeof value !== 'object') return [];
  return Object.entries(value).flatMap(([key, v]): [string, string][] => [
    ...(key.endsWith('_ref') && typeof v === 'string' ? [[key, v] as [string, string]] : []),
    ...(key.endsWith('_refs') && Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string').map(x => [key, x] as [string, string]) : []),
    ...refsOf(v),
  ]);
}
export function isContainerRef(type: string, property: string) {
  return property === 'created_by_ref' || property === 'object_marking_refs' ||
    (property === 'object_refs' && ['report', 'grouping', 'note', 'opinion'].includes(type));
}
export interface BundleEdge { id: string; source: string; target: string; label: string; relationshipId?: string }
export function bundleToGraph(objects: BundleObject[]) {
  const nodes = objects.filter(o => o.type !== 'relationship');
  const ids = new Set(nodes.map(o => o.id));
  const edges: BundleEdge[] = [];
  for (const o of objects) {
    const candidates = o.type === 'relationship'
      ? [{ source: String(o.source_ref), target: String(o.target_ref), label: String(o.relationship_type), relationshipId: o.id }]
      : refsOf(o).filter(([p]) => !isContainerRef(o.type, p)).map(([label, target]) => ({ source: o.id, target, label }));
    for (const edge of candidates) {
      const id = `${edge.source}|${edge.target}|${edge.label}`;
      if (edge.source !== edge.target && ids.has(edge.source) && ids.has(edge.target) && !edges.some(e => e.id === id)) edges.push({ ...edge, id });
    }
  }
  return { nodes, edges };
}
export function objectHref(id: string) {
  const url = new URL(window.location.href);
  url.searchParams.delete('type');
  url.searchParams.set('view', 'hackers');
  url.searchParams.set('object', id);
  return `${url.pathname}${url.search}#instance`;
}
