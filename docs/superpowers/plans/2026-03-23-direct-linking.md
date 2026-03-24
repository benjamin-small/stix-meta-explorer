# Direct Linking to STIX Object Types — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enable URL query parameter deep linking (`?type=attack-pattern`) that syncs with the detail drawer and browser history.

**Architecture:** Extract URL ↔ state synchronization into a custom hook (`useUrlType`) that reads the initial `?type` param, updates the URL on selection changes via `pushState`, and listens for `popstate` for back/forward. App.tsx replaces its `useState` with this hook.

**Tech Stack:** React 19, TypeScript, Vitest + React Testing Library, happy-dom

**Spec:** `docs/superpowers/specs/2026-03-23-direct-linking-design.md`

---

### File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `src/hooks/useUrlType.ts` | Create | Custom hook: read `?type` on mount, sync URL on changes, handle `popstate` |
| `src/hooks/__tests__/useUrlType.test.ts` | Create | Tests for the hook |
| `src/components/App.tsx` | Modify | Replace `useState<StixObjectType \| null>` with `useUrlType()` |
| `src/components/__tests__/App.test.tsx` | Modify | Add integration tests for URL-driven behavior |

---

### Task 1: Create `useUrlType` hook with tests

**Files:**
- Create: `src/hooks/useUrlType.ts`
- Create: `src/hooks/__tests__/useUrlType.test.ts`

- [ ] **Step 1: Write failing tests for `useUrlType`**

Create `src/hooks/__tests__/useUrlType.test.ts`:

```typescript
import { renderHook, act } from '@testing-library/react';
import { useUrlType } from '../useUrlType';

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
  // Look up a real object from the data layer
  const { stixObjects } = require('../../data');
  const malware = stixObjects.find((o: any) => o.type === 'malware');

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
  const { stixObjects } = require('../../data');
  const malware = stixObjects.find((o: any) => o.type === 'malware');

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
```

Note: Add `import { vi } from 'vitest';` at the top of the test file.

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/hooks/__tests__/useUrlType.test.ts`
Expected: FAIL — module `../useUrlType` not found

- [ ] **Step 3: Implement `useUrlType` hook**

Create `src/hooks/useUrlType.ts`:

```typescript
import { useState, useEffect, useCallback } from 'react';
import { stixObjects } from '../data';
import type { StixObjectType } from '../types/stix';

function findObjectByType(type: string): StixObjectType | null {
  const lower = type.toLowerCase();
  return stixObjects.find((obj) => obj.type === lower) ?? null;
}

function getTypeFromUrl(): StixObjectType | null {
  const params = new URLSearchParams(window.location.search);
  const type = params.get('type');
  return type ? findObjectByType(type) : null;
}

export function useUrlType() {
  const [selectedObject, setSelectedObjectState] = useState<StixObjectType | null>(getTypeFromUrl);

  const setSelectedObject = useCallback((obj: StixObjectType | null) => {
    setSelectedObjectState(obj);
    const url = new URL(window.location.href);
    if (obj) {
      url.searchParams.set('type', obj.type);
    } else {
      url.searchParams.delete('type');
    }
    window.history.pushState({}, '', url.toString());
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      setSelectedObjectState(getTypeFromUrl());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  return { selectedObject, setSelectedObject };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/hooks/__tests__/useUrlType.test.ts`
Expected: All 10 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useUrlType.ts src/hooks/__tests__/useUrlType.test.ts
git commit -m "feat: add useUrlType hook for deep linking"
```

---

### Task 2: Wire `useUrlType` into App

**Files:**
- Modify: `src/components/App.tsx`
- Modify: `src/components/__tests__/App.test.tsx`

- [ ] **Step 1: Write failing integration tests**

Add to `src/components/__tests__/App.test.tsx`:

```typescript
test('opens drawer from ?type query param on load', () => {
  window.history.replaceState({}, '', '?type=malware');
  render(<App />);
  // Drawer should be open showing Malware detail
  expect(screen.getByText('Malware')).toBeInTheDocument();
  expect(screen.getByText('Domain Object')).toBeInTheDocument();
  window.history.replaceState({}, '', '/');
});

test('ignores invalid ?type param', () => {
  window.history.replaceState({}, '', '?type=not-real');
  render(<App />);
  // No drawer open, page renders normally
  expect(screen.getByText('STIX 2.1 Meta Explorer')).toBeInTheDocument();
  expect(screen.queryByText('Domain Object')).not.toBeInTheDocument();
  window.history.replaceState({}, '', '/');
});
```

- [ ] **Step 2: Run tests to verify the new tests fail**

Run: `npx vitest run src/components/__tests__/App.test.tsx`
Expected: The two new tests FAIL (App currently ignores URL params)

- [ ] **Step 3: Update App.tsx to use `useUrlType`**

Replace the `selectedObject` useState in `src/components/App.tsx`:

```typescript
import { useMemo } from 'react';
import TopBar from './TopBar';
import FilterBar from './FilterBar';
import CardGrid from './CardGrid';
import DetailDrawer from './DetailDrawer';
import { useFilter } from '../hooks/useFilter';
import { useUrlType } from '../hooks/useUrlType';
import { stixObjects } from '../data';
import type { StixCategory } from '../types/stix';

export default function App() {
  const { filteredObjects, activeCategories, toggleCategory, search, setSearch } = useFilter();
  const { selectedObject, setSelectedObject } = useUrlType();
  const counts = useMemo(() => {
    const c = { sdo: 0, sro: 0, sco: 0, meta: 0 } as Record<StixCategory, number>;
    for (const obj of stixObjects) c[obj.category]++;
    return c;
  }, []);

  return (
    <div className="min-h-screen bg-cti-bg">
      <TopBar search={search} onSearchChange={setSearch} />
      <FilterBar activeCategories={activeCategories} onToggleCategory={toggleCategory} counts={counts} />
      <CardGrid objects={filteredObjects} onSelectObject={setSelectedObject} />
      <DetailDrawer object={selectedObject} onClose={() => setSelectedObject(null)} />
    </div>
  );
}
```

- [ ] **Step 4: Run all tests to verify everything passes**

Run: `npx vitest run`
Expected: All tests PASS (existing + new)

- [ ] **Step 5: Commit**

```bash
git add src/components/App.tsx src/components/__tests__/App.test.tsx
git commit -m "feat: wire URL deep linking into App component"
```

---

### Task 3: Manual verification and build check

- [ ] **Step 1: Run the build**

Run: `npm run build`
Expected: Build succeeds with no errors

- [ ] **Step 2: Run the linter**

Run: `npm run lint`
Expected: No lint errors

- [ ] **Step 3: Manual smoke test**

Run: `npm run dev`
Verify:
- Load `http://localhost:5173/stix-meta-explorer/?type=attack-pattern` → drawer opens for Attack Pattern
- Click a different card → URL updates to `?type=<that-type>`
- Close the drawer → `?type` is removed from URL
- Browser back button → drawer reopens with previous object
- Load `?type=MALWARE` (uppercase) → drawer opens for Malware
- Load `?type=bogus` → no drawer, page loads normally

- [ ] **Step 4: Final commit if any fixes needed, then close issue**

```bash
gh issue close 1 --comment "Implemented in this branch. Deep linking via ?type= query param now works."
```
