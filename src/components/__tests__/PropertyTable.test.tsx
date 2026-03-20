import { render, screen, fireEvent } from '@testing-library/react';
import PropertyTable from '../PropertyTable';
import type { Property } from '../../types/stix';

const mockProperties: Property[] = [
  { name: 'type', type: 'string', required: true, description: 'The type', isCommon: true, isInteresting: false },
  { name: 'id', type: 'identifier', required: true, description: 'The ID', isCommon: true, isInteresting: false },
  { name: 'name', type: 'string', required: true, description: 'The name', isCommon: false, isInteresting: true },
  { name: 'description', type: 'string', required: false, description: 'A description', isCommon: false, isInteresting: false },
];

test('renders unique properties by default, common collapsed', () => {
  render(<PropertyTable properties={mockProperties} />);
  expect(screen.getByText('name')).toBeInTheDocument();
  expect(screen.getByText('description')).toBeInTheDocument();
  // Common properties should be in collapsed section
  expect(screen.queryByText(/^type$/)).not.toBeInTheDocument();
});

test('expanding common properties shows them', () => {
  render(<PropertyTable properties={mockProperties} />);
  fireEvent.click(screen.getByText(/common properties/i));
  expect(screen.getByText(/^type$/)).toBeInTheDocument();
  expect(screen.getByText(/^id$/)).toBeInTheDocument();
});

test('interesting properties have highlight marker', () => {
  render(<PropertyTable properties={mockProperties} />);
  const nameRow = screen.getByText('name').closest('tr');
  expect(nameRow?.textContent).toContain('\u2605');
});

test('required properties show required badge', () => {
  render(<PropertyTable properties={mockProperties} />);
  const badges = screen.getAllByText('required');
  expect(badges.length).toBeGreaterThan(0);
});
