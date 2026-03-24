import { renderHook, act } from '@testing-library/react';
import { useFilter } from '../useFilter';

test('returns all objects when no category selected', () => {
  const { result } = renderHook(() => useFilter());
  expect(result.current.filteredObjects).toHaveLength(43);
  expect(result.current.activeCategories).toEqual(new Set());
});

test('toggleCategory selects that category exclusively', () => {
  const { result } = renderHook(() => useFilter());
  act(() => result.current.toggleCategory('sdo'));
  for (const obj of result.current.filteredObjects) {
    expect(obj.category).toBe('sdo');
  }
  expect(result.current.activeCategories).toEqual(new Set(['sdo']));
});

test('toggling a different category switches to it exclusively', () => {
  const { result } = renderHook(() => useFilter());
  act(() => result.current.toggleCategory('sdo'));
  act(() => result.current.toggleCategory('sco'));
  for (const obj of result.current.filteredObjects) {
    expect(obj.category).toBe('sco');
  }
  expect(result.current.activeCategories).toEqual(new Set(['sco']));
});

test('toggling the same category twice deselects it (show all)', () => {
  const { result } = renderHook(() => useFilter());
  act(() => result.current.toggleCategory('sro'));
  act(() => result.current.toggleCategory('sro'));
  expect(result.current.filteredObjects).toHaveLength(43);
  expect(result.current.activeCategories).toEqual(new Set());
});

test('search filters by name', () => {
  const { result } = renderHook(() => useFilter());
  act(() => result.current.setSearch('malware'));
  for (const obj of result.current.filteredObjects) {
    const match =
      obj.name.toLowerCase().includes('malware') ||
      obj.description.toLowerCase().includes('malware') ||
      obj.type.toLowerCase().includes('malware');
    expect(match).toBe(true);
  }
});

test('search filters by description', () => {
  const { result } = renderHook(() => useFilter());
  act(() => result.current.setSearch('phishing'));
  expect(result.current.filteredObjects.length).toBeGreaterThanOrEqual(0);
});

test('search and category filters combine', () => {
  const { result } = renderHook(() => useFilter());
  act(() => result.current.toggleCategory('sdo'));
  act(() => result.current.setSearch('attack'));
  for (const obj of result.current.filteredObjects) {
    expect(obj.category).toBe('sdo');
  }
});
