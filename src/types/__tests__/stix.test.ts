import type { StixObjectType, Property, RelationshipDef, StixCategory } from '../stix';

test('StixObjectType interface accepts valid object', () => {
  const obj: StixObjectType = {
    type: 'attack-pattern',
    name: 'Attack Pattern',
    category: 'sdo',
    description: 'Describes ways threat actors attempt to compromise targets.',
    properties: [
      {
        name: 'name',
        type: 'string',
        required: true,
        description: 'The name of the attack pattern.',
        isCommon: false,
        isInteresting: true,
      },
    ],
    relationships: {
      outgoing: [{ relationshipType: 'targets', objectTypes: ['identity', 'vulnerability'] }],
      incoming: [{ relationshipType: 'uses', objectTypes: ['threat-actor'] }],
    },
    example: { type: 'attack-pattern', name: 'Spear Phishing' },
    specUrl: 'https://docs.oasis-open.org/cti/stix/v2.1/os/stix-v2.1-os.html#_axjijf603msy',
  };
  expect(obj.type).toBe('attack-pattern');
  expect(obj.category).toBe('sdo');
});

test('StixCategory is constrained to valid values', () => {
  const categories: StixCategory[] = ['sdo', 'sro', 'sco', 'meta'];
  expect(categories).toHaveLength(4);
});
