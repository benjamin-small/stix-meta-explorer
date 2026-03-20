import { renderHook, act } from '@testing-library/react';
import { useFilter } from '../useFilter';

test('returns all objects with no filters', () => {
  const { result } = renderHook(() => useFilter());
  expect(result.current.filteredObjects).toHaveLength(43);
});

test('toggleCategory removes that category', () => {
  const { result } = renderHook(() => useFilter());
  act(() => result.current.toggleCategory('sro'));
  const types = result.current.filteredObjects.map((o) => o.category);
  expect(types).not.toContain('sro');
});

test('toggleCategory twice re-enables category', () => {
  const { result } = renderHook(() => useFilter());
  act(() => result.current.toggleCategory('sro'));
  act(() => result.current.toggleCategory('sro'));
  expect(result.current.filteredObjects).toHaveLength(43);
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
  act(() => {
    result.current.toggleCategory('sco');
    result.current.toggleCategory('sro');
    result.current.toggleCategory('meta');
  });
  act(() => result.current.setSearch('attack'));
  for (const obj of result.current.filteredObjects) {
    expect(obj.category).toBe('sdo');
  }
});

test('activeCategories reflects toggle state', () => {
  const { result } = renderHook(() => useFilter());
  expect(result.current.activeCategories).toEqual(new Set(['sdo', 'sro', 'sco', 'meta']));
  act(() => result.current.toggleCategory('sro'));
  expect(result.current.activeCategories).toEqual(new Set(['sdo', 'sco', 'meta']));
});
