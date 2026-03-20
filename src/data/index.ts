import { stixObjects } from './stix-objects';
import type { StixObjectType } from '../types/stix';

export { stixObjects };

const objectMap = new Map<string, StixObjectType>(
  stixObjects.map((obj) => [obj.type, obj])
);

export function getObjectByType(type: string): StixObjectType | undefined {
  return objectMap.get(type);
}

export function getObjectsByCategory(category: StixObjectType['category']): StixObjectType[] {
  return stixObjects.filter((obj) => obj.category === category);
}
