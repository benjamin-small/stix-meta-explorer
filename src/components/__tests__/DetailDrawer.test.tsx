import { render, screen, fireEvent } from '@testing-library/react';
import DetailDrawer from '../DetailDrawer';
import type { StixObjectType } from '../../types/stix';

const mockObject: StixObjectType = {
  type: 'attack-pattern',
  name: 'Attack Pattern',
  category: 'sdo',
  description: 'Describes ways threat actors attempt to compromise targets.',
  properties: [
    { name: 'name', type: 'string', required: true, description: 'The name', isCommon: false, isInteresting: true },
  ],
  relationships: { outgoing: [], incoming: [] },
  example: { type: 'attack-pattern', id: 'attack-pattern--1234', name: 'Test' },
  specUrl: 'https://example.com',
};

test('renders when object is provided', () => {
  render(<DetailDrawer object={mockObject} onClose={() => {}} />);
  expect(screen.getByText('Attack Pattern')).toBeInTheDocument();
});

test('does not render when object is null', () => {
  const { container } = render(<DetailDrawer object={null} onClose={() => {}} />);
  expect(container.firstChild).toBeNull();
});

test('calls onClose when overlay clicked', () => {
  const onClose = vi.fn();
  render(<DetailDrawer object={mockObject} onClose={onClose} />);
  fireEvent.click(screen.getByTestId('drawer-overlay'));
  expect(onClose).toHaveBeenCalled();
});

test('calls onClose when close button clicked', () => {
  const onClose = vi.fn();
  render(<DetailDrawer object={mockObject} onClose={onClose} />);
  fireEvent.click(screen.getByLabelText('Close'));
  expect(onClose).toHaveBeenCalled();
});

test('shows spec link', () => {
  render(<DetailDrawer object={mockObject} onClose={() => {}} />);
  const link = screen.getByText(/View in STIX 2.1 Spec/i);
  expect(link).toHaveAttribute('href', 'https://example.com');
});
