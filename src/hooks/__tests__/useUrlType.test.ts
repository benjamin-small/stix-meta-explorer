import { renderHook, act } from '@testing-library/react';
import { vi } from 'vitest';
import { useUrlType } from '../useUrlType';
import { stixObjects } from '../../data';

// Helper to set URL before rendering
function setUrl(params: string) {
  window.history.replaceState({}, '', params ? `?${params}` : '/');
}

afterEach(() => {
  window.history.replaceState({}, '', '/');
});

test('returns null when no ?type param', () => {
  setUrl('');
  const { result } = renderHook(() => useUrlType());
  expect(result.current.selectedObject).toBeNull();
});

test('returns matching object when ?type is valid', () => {
  setUrl('type=attack-pattern');
  const { result } = renderHook(() => useUrlType());
  expect(result.current.selectedObject).not.toBeNull();
  expect(result.current.selectedObject!.type).toBe('attack-pattern');
});

test('returns null when ?type is invalid', () => {
  setUrl('type=not-a-real-type');
  const { result } = renderHook(() => useUrlType());
  expect(result.current.selectedObject).toBeNull();
});

test('case-insensitive match for ?type', () => {
  setUrl('type=Attack-Pattern');
  const { result } = renderHook(() => useUrlType());
  expect(result.current.selectedObject).not.toBeNull();
  expect(result.current.selectedObject!.type).toBe('attack-pattern');
});

test('uses first value when multiple ?type params present', () => {
  setUrl('type=malware&type=attack-pattern');
  const { result } = renderHook(() => useUrlType());
  expect(result.current.selectedObject).not.toBeNull();
  expect(result.current.selectedObject!.type).toBe('malware');
});

test('setSelectedObject updates URL', () => {
  setUrl('');
  const { result } = renderHook(() => useUrlType());
  const malware = stixObjects.find((o) => o.type === 'malware')!;

  act(() => {
    result.current.setSelectedObject(malware);
  });

  const params = new URLSearchParams(window.location.search);
  expect(params.get('type')).toBe('malware');
});

test('setSelectedObject(null) removes ?type from URL', () => {
  setUrl('type=malware');
  const { result } = renderHook(() => useUrlType());

  act(() => {
    result.current.setSelectedObject(null);
  });

  expect(window.location.search).toBe('');
});

test('does not push history entry on initial load', () => {
  setUrl('type=attack-pattern');
  const pushStateSpy = vi.spyOn(window.history, 'pushState');
  renderHook(() => useUrlType());
  expect(pushStateSpy).not.toHaveBeenCalled();
  pushStateSpy.mockRestore();
});

test('popstate event updates selectedObject', () => {
  setUrl('');
  const { result } = renderHook(() => useUrlType());
  const malware = stixObjects.find((o) => o.type === 'malware')!;

  // Select an object (pushes state)
  act(() => {
    result.current.setSelectedObject(malware);
  });
  expect(result.current.selectedObject!.type).toBe('malware');

  // Simulate browser back: change URL and fire popstate
  act(() => {
    window.history.replaceState({}, '', '/');
    window.dispatchEvent(new PopStateEvent('popstate'));
  });
  expect(result.current.selectedObject).toBeNull();
});
