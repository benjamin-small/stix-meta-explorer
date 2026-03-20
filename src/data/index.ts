import { stixObjects } from './stix-objects';
import { relationships } from './relationships';
import { examples } from './examples';
import type { StixObjectType } from '../types/stix';

export { stixObjects };
export { relationships };
export { examples };

const objectMap = new Map<string, StixObjectType>(
  stixObjects.map((obj) => [obj.type, obj])
);

// Populate incoming/outgoing relationships on each object
for (const rel of relationships) {
  const source = objectMap.get(rel.sourceType);
  if (source) {
    const existing = source.relationships.outgoing.find(
      (r) => r.relationshipType === rel.relationshipType
    );
    if (existing) {
      existing.objectTypes.push(...rel.targetTypes.filter((t) => !existing.objectTypes.includes(t)));
    } else {
      source.relationships.outgoing.push({
        relationshipType: rel.relationshipType,
        objectTypes: [...rel.targetTypes],
      });
    }
  }

  for (const targetType of rel.targetTypes) {
    const target = objectMap.get(targetType);
    if (target) {
      const existing = target.relationships.incoming.find(
        (r) => r.relationshipType === rel.relationshipType
      );
      if (existing) {
        if (!existing.objectTypes.includes(rel.sourceType)) {
          existing.objectTypes.push(rel.sourceType);
        }
      } else {
        target.relationships.incoming.push({
          relationshipType: rel.relationshipType,
          objectTypes: [rel.sourceType],
        });
      }
    }
  }
}

export function getObjectByType(type: string): StixObjectType | undefined {
  return objectMap.get(type);
}

export function getObjectsByCategory(category: StixObjectType['category']): StixObjectType[] {
  return stixObjects.filter((obj) => obj.category === category);
}

// Populate examples on each object
for (const obj of stixObjects) {
  if (examples[obj.type]) {
    obj.example = examples[obj.type];
  }
}
