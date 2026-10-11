import type { NodeRule, Shape } from '@poietic-tech/graphing-library';

// The renderer supports three shapes. Assign every dataset type explicitly so
// the same object retains its shape across selection and story highlights.
export const shapeGroups: { shape: Shape; label: string; types: string[] }[] = [
  { shape: 'circle', label: 'People & groups', types: ['threat-actor', 'identity', 'intrusion-set'] },
  { shape: 'square', label: 'Systems & artifacts', types: ['infrastructure', 'tool', 'malware', 'location', 'file', 'artifact', 'domain-name', 'ipv4-addr', 'url'] },
  { shape: 'diamond', label: 'Actions & evidence', types: ['attack-pattern', 'campaign', 'vulnerability', 'indicator', 'observed-data', 'sighting', 'course-of-action', 'report', 'note', 'opinion', 'grouping'] },
];

export const typeShapeRules: NodeRule[] = shapeGroups.map(group => ({
  when: { attr: 'stix_type', one_of: group.types }, set: { shape: group.shape },
}));
