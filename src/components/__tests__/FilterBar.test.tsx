import { render, screen, fireEvent } from '@testing-library/react';
import FilterBar from '../FilterBar';

test('renders all four category chips', () => {
  render(
    <FilterBar
      activeCategories={new Set(['sdo', 'sro', 'sco', 'meta'])}
      onToggleCategory={() => {}}
    />
  );
  expect(screen.getByText('SDO')).toBeInTheDocument();
  expect(screen.getByText('SRO')).toBeInTheDocument();
  expect(screen.getByText('SCO')).toBeInTheDocument();
  expect(screen.getByText('Meta')).toBeInTheDocument();
});

test('calls onToggleCategory when chip clicked', () => {
  const onToggle = vi.fn();
  render(
    <FilterBar
      activeCategories={new Set(['sdo', 'sro', 'sco', 'meta'])}
      onToggleCategory={onToggle}
    />
  );
  fireEvent.click(screen.getByText('SRO'));
  expect(onToggle).toHaveBeenCalledWith('sro');
});

test('inactive chip has reduced opacity styling', () => {
  render(
    <FilterBar
      activeCategories={new Set(['sdo', 'sco', 'meta'])}
      onToggleCategory={() => {}}
    />
  );
  const sroChip = screen.getByText('SRO').closest('button');
  expect(sroChip).toHaveClass('opacity-40');
});
