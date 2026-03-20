import { render, screen, fireEvent } from '@testing-library/react';
import CardGrid from '../CardGrid';
import type { StixObjectType } from '../../types/stix';

const mockObjects: StixObjectType[] = [
  {
    type: 'attack-pattern',
    name: 'Attack Pattern',
    category: 'sdo',
    description: 'Test description',
    properties: [],
    relationships: { outgoing: [], incoming: [] },
    example: {},
    specUrl: 'https://example.com',
  },
  {
    type: 'ipv4-addr',
    name: 'IPv4 Address',
    category: 'sco',
    description: 'An IPv4 address',
    properties: [],
    relationships: { outgoing: [], incoming: [] },
    example: {},
    specUrl: 'https://example.com',
  },
];

test('renders all provided objects as cards', () => {
  render(<CardGrid objects={mockObjects} onSelectObject={() => {}} />);
  expect(screen.getByText('Attack Pattern')).toBeInTheDocument();
  expect(screen.getByText('IPv4 Address')).toBeInTheDocument();
});

test('calls onSelectObject with correct object when card clicked', () => {
  const onSelect = vi.fn();
  render(<CardGrid objects={mockObjects} onSelectObject={onSelect} />);
  fireEvent.click(screen.getByText('Attack Pattern'));
  expect(onSelect).toHaveBeenCalledWith(mockObjects[0]);
});

test('shows category section headers', () => {
  render(<CardGrid objects={mockObjects} onSelectObject={() => {}} />);
  expect(screen.getByText('Domain Objects')).toBeInTheDocument();
  expect(screen.getByText('Cyber Observables')).toBeInTheDocument();
});
