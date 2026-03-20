import { render, screen, fireEvent } from '@testing-library/react';
import ObjectCard from '../ObjectCard';
import type { StixObjectType } from '../../types/stix';
import { CATEGORY_COLORS } from '../../types/stix';

const mockObject: StixObjectType = {
  type: 'attack-pattern',
  name: 'Attack Pattern',
  category: 'sdo',
  description: 'Describes ways threat actors attempt to compromise targets.',
  properties: [],
  relationships: {
    outgoing: [{ relationshipType: 'targets', objectTypes: ['identity'] }],
    incoming: [{ relationshipType: 'uses', objectTypes: ['threat-actor'] }],
  },
  example: {},
  specUrl: 'https://example.com',
};

test('renders object name and description', () => {
  render(<ObjectCard object={mockObject} onClick={() => {}} />);
  expect(screen.getByText('Attack Pattern')).toBeInTheDocument();
  expect(screen.getByText(/Describes ways/)).toBeInTheDocument();
});

test('shows relationship count badge', () => {
  render(<ObjectCard object={mockObject} onClick={() => {}} />);
  expect(screen.getByText('2 relationships')).toBeInTheDocument();
});

test('calls onClick when clicked', () => {
  const onClick = vi.fn();
  render(<ObjectCard object={mockObject} onClick={onClick} />);
  fireEvent.click(screen.getByText('Attack Pattern'));
  expect(onClick).toHaveBeenCalled();
});

test('has category-colored left border', () => {
  const { container } = render(<ObjectCard object={mockObject} onClick={() => {}} />);
  const card = container.firstChild as HTMLElement;
  expect(card.style.borderLeftColor).toBe(CATEGORY_COLORS.sdo);
});
