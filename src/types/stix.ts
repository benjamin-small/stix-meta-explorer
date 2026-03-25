export type StixCategory = 'sdo' | 'sro' | 'sco' | 'meta';

export interface Property {
  name: string;
  type: string;
  required: boolean;
  description: string;
  isCommon: boolean;
  isInteresting: boolean;
}

export interface RelationshipDef {
  relationshipType: string;
  objectTypes: string[];
}

export interface StixObjectType {
  type: string;
  name: string;
  category: StixCategory;
  description: string;
  properties: Property[];
  relationships: {
    outgoing: RelationshipDef[];
    incoming: RelationshipDef[];
  };
  relationshipNote?: string;
  example: Record<string, unknown>;
  specUrl: string;
}

export const CATEGORY_COLORS: Record<StixCategory, string> = {
  sdo: '#f85149',
  sco: '#58a6ff',
  sro: '#bc8cff',
  meta: '#3fb950',
};

export const CATEGORY_LABELS: Record<StixCategory, string> = {
  sdo: 'Domain Object',
  sco: 'Cyber Observable',
  sro: 'Relationship Object',
  meta: 'Meta Object',
};
