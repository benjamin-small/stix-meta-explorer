import { render, screen, fireEvent } from '@testing-library/react';
import FilterBar from '../FilterBar';

const defaultCounts = { sdo: 19, sro: 2, sco: 18, meta: 4 };

test('renders all four category chips', () => {
  render(
    <FilterBar
      activeCategories={new Set(['sdo', 'sro', 'sco', 'meta'])}
      onToggleCategory={() => {}}
      counts={defaultCounts}
    />
  );
  expect(screen.getByText('SDO (19)')).toBeInTheDocument();
  expect(screen.getByText('SRO (2)')).toBeInTheDocument();
  expect(screen.getByText('SCO (18)')).toBeInTheDocument();
  expect(screen.getByText('Meta (4)')).toBeInTheDocument();
});

test('calls onToggleCategory when chip clicked', () => {
  const onToggle = vi.fn();
  render(
    <FilterBar
      activeCategories={new Set(['sdo', 'sro', 'sco', 'meta'])}
      onToggleCategory={onToggle}
      counts={defaultCounts}
    />
  );
  fireEvent.click(screen.getByText('SRO (2)'));
  expect(onToggle).toHaveBeenCalledWith('sro');
});

test('inactive chip has reduced opacity styling', () => {
  render(
    <FilterBar
      activeCategories={new Set(['sdo', 'sco', 'meta'])}
      onToggleCategory={() => {}}
      counts={defaultCounts}
    />
  );
  const sroChip = screen.getByText('SRO (2)').closest('button');
  expect(sroChip).toHaveClass('opacity-40');
});
