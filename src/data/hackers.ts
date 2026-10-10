import bundle from './hackers-1995/bundle.json';

export interface BundleObject extends Record<string, unknown> { id: string; type: string }
export const hackersObjects: BundleObject[] = bundle.objects;
export const hackersById = new Map(hackersObjects.map(o => [o.id, o]));
export const report = hackersObjects.find(o => o.type === 'report')!;
export const labelOf = (o: BundleObject): string => String(o.name ?? o.value ?? o.abstract ?? `${o.type} (${o.id.slice(-8)})`);
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
