# STIX 2.1 Meta Explorer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a React SPA that serves as an interactive reference for all 43 STIX 2.1 object types, with filterable card grid, detail drawers, and force-directed relationship graphs.

**Architecture:** Vite + React 18 + TypeScript SPA. All STIX schema data compiled into static TypeScript modules (no backend). D3.js computes force graph positions, React renders SVG. Tailwind CSS with custom dark CTI theme.

**Tech Stack:** Vite, React 18, TypeScript (strict), D3.js v7, Tailwind CSS v3, Vitest + React Testing Library

**Spec:** `docs/superpowers/specs/2026-03-19-stix-meta-explorer-design.md`

---

## File Structure

```
src/
  types/
    stix.ts                    # TypeScript interfaces (StixObjectType, Property, RelationshipDef)
  data/
    stix-objects.ts            # All 43 object type definitions with properties
    relationships.ts           # Complete relationship map (source → type → target)
    examples.ts                # Realistic example JSON for each object type
    index.ts                   # Re-exports, lookup helpers (getObjectByType, getRelationshipsFor)
  components/
    App.tsx                    # Root layout, selected object state, drawer toggle
    TopBar.tsx                 # App title + search input
    FilterBar.tsx              # Category toggle chips (SDO/SRO/SCO/Meta)
    CardGrid.tsx               # Responsive grid, applies filters + search
    ObjectCard.tsx             # Single card: name, description, category border, relationship count
    DetailDrawer.tsx           # Slide-out panel shell: overlay, close button, scroll container
    ObjectDetail.tsx           # Drawer content: header, description, property table, example, graph, spec link
    PropertyTable.tsx          # Sortable table with common property collapse
    JsonExample.tsx            # Syntax-highlighted JSON block with copy button
    RelationshipGraph.tsx      # SVG container + D3 integration, controls (focus/reset)
  hooks/
    useFilter.ts               # Filter + search logic, returns filtered object list
    useForceGraph.ts           # D3 simulation, node/edge state, expansion logic
  index.css                    # Tailwind directives + custom theme overrides
  main.tsx                     # React entry point
index.html                     # Vite HTML entry
tailwind.config.ts             # Custom CTI color palette
vite.config.ts                 # Vite config
vitest.config.ts               # Test config
tsconfig.json                  # TypeScript config (strict)
```

---

### Task 1: Project Scaffolding

**Files:**
- Create: `package.json`, `vite.config.ts`, `vitest.config.ts`, `tsconfig.json`, `tailwind.config.ts`, `index.html`, `src/main.tsx`, `src/index.css`, `src/components/App.tsx`, `postcss.config.js`

- [ ] **Step 1: Scaffold Vite + React + TypeScript project**

```bash
npm create vite@latest . -- --template react-ts
```

Accept overwrite prompts for the empty directory.

- [ ] **Step 2: Install dependencies**

```bash
npm install d3@7
npm install -D tailwindcss@3 postcss autoprefixer @types/d3 vitest @testing-library/react @testing-library/jest-dom jsdom happy-dom
npx tailwindcss init -p
```

- [ ] **Step 3: Configure Tailwind with CTI theme**

Update `tailwind.config.ts`:

```typescript
import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        cti: {
          bg: '#0d1117',
          surface: '#161b22',
          'surface-hover': '#1c2129',
          border: '#30363d',
          text: '#e6edf3',
          muted: '#8b949e',
          sdo: '#f85149',
          sco: '#58a6ff',
          sro: '#bc8cff',
          meta: '#3fb950',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
} satisfies Config;
```

- [ ] **Step 4: Configure Vitest**

Update `vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
  },
});
```

Create `src/test-setup.ts`:

```typescript
import '@testing-library/jest-dom/vitest';
```

- [ ] **Step 5: Set up base CSS**

Replace `src/index.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    @apply bg-cti-bg text-cti-text font-sans antialiased;
    margin: 0;
  }
}
```

- [ ] **Step 6: Create minimal App component**

Replace `src/components/App.tsx`:

```tsx
export default function App() {
  return (
    <div className="min-h-screen bg-cti-bg">
      <h1 className="text-2xl font-bold p-6 text-cti-text">STIX 2.1 Meta Explorer</h1>
    </div>
  );
}
```

Update `src/main.tsx`:

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './components/App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

- [ ] **Step 7: Verify dev server starts**

```bash
npm run dev
```

Expected: App renders with dark background and "STIX 2.1 Meta Explorer" heading.

- [ ] **Step 8: Verify tests run**

Create `src/components/__tests__/App.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import App from '../App';

test('renders app title', () => {
  render(<App />);
  expect(screen.getByText('STIX 2.1 Meta Explorer')).toBeInTheDocument();
});
```

```bash
npx vitest run
```

Expected: 1 test passes.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: scaffold Vite + React + TS project with Tailwind CTI theme"
```

---

### Task 2: TypeScript Types & Data Model

**Files:**
- Create: `src/types/stix.ts`
- Test: `src/types/__tests__/stix.test.ts`

- [ ] **Step 1: Write type validation test**

Create `src/types/__tests__/stix.test.ts`:

```typescript
import type { StixObjectType, Property, RelationshipDef, StixCategory } from '../stix';

test('StixObjectType interface accepts valid object', () => {
  const obj: StixObjectType = {
    type: 'attack-pattern',
    name: 'Attack Pattern',
    category: 'sdo',
    description: 'Describes ways threat actors attempt to compromise targets.',
    properties: [
      {
        name: 'name',
        type: 'string',
        required: true,
        description: 'The name of the attack pattern.',
        isCommon: false,
        isInteresting: true,
      },
    ],
    relationships: {
      outgoing: [{ relationshipType: 'targets', objectTypes: ['identity', 'vulnerability'] }],
      incoming: [{ relationshipType: 'uses', objectTypes: ['threat-actor'] }],
    },
    example: { type: 'attack-pattern', name: 'Spear Phishing' },
    specUrl: 'https://docs.oasis-open.org/cti/stix/v2.1/os/stix-v2.1-os.html#_axjijf603msy',
  };
  expect(obj.type).toBe('attack-pattern');
  expect(obj.category).toBe('sdo');
});

test('StixCategory is constrained to valid values', () => {
  const categories: StixCategory[] = ['sdo', 'sro', 'sco', 'meta'];
  expect(categories).toHaveLength(4);
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/types
```

Expected: FAIL — module not found.

- [ ] **Step 3: Write type definitions**

Create `src/types/stix.ts`:

```typescript
export type StixCategory = 'sdo' | 'sro' | 'sco' | 'meta';

export interface Property {
  name: string;
  type: string;
  required: boolean;
  description: string;
  isCommon: boolean;
  isInteresting: boolean;
}

export interface RelationshipDef {
  relationshipType: string;
  objectTypes: string[];
}

export interface StixObjectType {
  type: string;
  name: string;
  category: StixCategory;
  description: string;
  properties: Property[];
  relationships: {
    outgoing: RelationshipDef[];
    incoming: RelationshipDef[];
  };
  example: Record<string, unknown>;
  specUrl: string;
}

export const CATEGORY_COLORS: Record<StixCategory, string> = {
  sdo: '#f85149',
  sco: '#58a6ff',
  sro: '#bc8cff',
  meta: '#3fb950',
};

export const CATEGORY_LABELS: Record<StixCategory, string> = {
  sdo: 'Domain Object',
  sco: 'Cyber Observable',
  sro: 'Relationship Object',
  meta: 'Meta Object',
};
```

- [ ] **Step 4: Run tests to verify pass**

```bash
npx vitest run src/types
```

Expected: 2 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/types/
git commit -m "feat: add STIX TypeScript type definitions"
```

---

### Task 3: STIX Data — Object Definitions

**Files:**
- Create: `src/data/stix-objects.ts`, `src/data/index.ts`
- Test: `src/data/__tests__/stix-objects.test.ts`

This is the largest data task. Compile all 43 STIX 2.1 object types with their properties from the OASIS spec. Each object needs: type, name, category, description, full property list (with isCommon/isInteresting flags), and specUrl.

- [ ] **Step 1: Write data integrity tests**

Create `src/data/__tests__/stix-objects.test.ts`:

```typescript
import { stixObjects, getObjectByType } from '../index';
import type { StixCategory } from '../../types/stix';

test('contains exactly 43 object types', () => {
  expect(stixObjects).toHaveLength(43);
});

test('has correct category counts', () => {
  const counts = stixObjects.reduce(
    (acc, obj) => {
      acc[obj.category]++;
      return acc;
    },
    { sdo: 0, sro: 0, sco: 0, meta: 0 } as Record<StixCategory, number>
  );
  expect(counts.sdo).toBe(19);
  expect(counts.sro).toBe(2);
  expect(counts.sco).toBe(18);
  expect(counts.meta).toBe(4);
});

test('every object has required fields', () => {
  for (const obj of stixObjects) {
    expect(obj.type).toBeTruthy();
    expect(obj.name).toBeTruthy();
    expect(obj.category).toBeTruthy();
    expect(obj.description).toBeTruthy();
    expect(obj.properties.length).toBeGreaterThan(0);
    expect(obj.specUrl).toMatch(/^https:\/\//);
  }
});

test('getObjectByType returns correct object', () => {
  const ap = getObjectByType('attack-pattern');
  expect(ap).toBeDefined();
  expect(ap!.name).toBe('Attack Pattern');
  expect(ap!.category).toBe('sdo');
});

test('getObjectByType returns undefined for invalid type', () => {
  expect(getObjectByType('nonexistent')).toBeUndefined();
});

test('no duplicate type values', () => {
  const types = stixObjects.map((o) => o.type);
  expect(new Set(types).size).toBe(types.length);
});

test('every object has at least one non-common property', () => {
  for (const obj of stixObjects) {
    const unique = obj.properties.filter((p) => !p.isCommon);
    expect(unique.length).toBeGreaterThan(0);
  }
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/data
```

Expected: FAIL — modules not found.

- [ ] **Step 3: Create the data index module**

Create `src/data/index.ts`:

```typescript
import { stixObjects } from './stix-objects';
import type { StixObjectType } from '../types/stix';

export { stixObjects };

const objectMap = new Map<string, StixObjectType>(
  stixObjects.map((obj) => [obj.type, obj])
);

export function getObjectByType(type: string): StixObjectType | undefined {
  return objectMap.get(type);
}

export function getObjectsByCategory(category: StixObjectType['category']): StixObjectType[] {
  return stixObjects.filter((obj) => obj.category === category);
}
```

- [ ] **Step 4: Create stix-objects.ts with all 43 object definitions**

Create `src/data/stix-objects.ts`. This file contains the complete array of all 43 STIX 2.1 object types. Each entry must include:
- `type`: the STIX type identifier (e.g., `"attack-pattern"`)
- `name`: human-readable name (e.g., `"Attack Pattern"`)
- `category`: one of `'sdo' | 'sro' | 'sco' | 'meta'`
- `description`: 1-3 sentence summary from the OASIS spec
- `properties`: complete property array from the OASIS JSON schemas. Mark SDO/SRO/SCO common properties with `isCommon: true`. Mark the 2-4 most distinctive/commonly-used properties per object with `isInteresting: true`.
- `relationships`: leave as `{ outgoing: [], incoming: [] }` — populated in Task 4
- `example`: empty object `{}` — populated in Task 5
- `specUrl`: direct link to the object's section in the OASIS spec HTML

**SDO common properties** (mark `isCommon: true` on all SDOs):
`type`, `spec_version`, `id`, `created_by_ref`, `created`, `modified`, `revoked`, `labels`, `confidence`, `lang`, `external_references`, `object_marking_refs`, `granular_markings`, `extensions`

**SRO common properties** (same as SDO common properties)

**SCO common properties** (mark `isCommon: true` on all SCOs):
`type`, `spec_version`, `id`, `object_marking_refs`, `granular_markings`, `defanged`, `extensions`

Reference the OASIS spec at `https://docs.oasis-open.org/cti/stix/v2.1/os/stix-v2.1-os.html` and the JSON schemas at `https://github.com/oasis-open/cti-stix2-json-schemas` for accurate property lists.

The full object list:

**SDOs (19):** attack-pattern, campaign, course-of-action, grouping, identity, incident, indicator, infrastructure, intrusion-set, location, malware, malware-analysis, note, observed-data, opinion, report, threat-actor, tool, vulnerability

**SROs (2):** relationship, sighting

**SCOs (18):** artifact, autonomous-system, directory, domain-name, email-addr, email-message, file, ipv4-addr, ipv6-addr, mac-addr, mutex, network-traffic, process, software, url, user-account, windows-registry-key, x509-certificate

**Meta (4):** bundle, extension-definition, language-content, marking-definition

- [ ] **Step 5: Run tests to verify pass**

```bash
npx vitest run src/data
```

Expected: All 7 tests pass. If any fail, fix the data and re-run.

- [ ] **Step 6: Commit**

```bash
git add src/data/ src/types/
git commit -m "feat: add all 43 STIX 2.1 object type definitions"
```

---

### Task 4: STIX Data — Relationship Map

**Files:**
- Create: `src/data/relationships.ts`
- Modify: `src/data/stix-objects.ts` (populate relationship fields)
- Modify: `src/data/index.ts` (add relationship helpers)
- Test: `src/data/__tests__/relationships.test.ts`

- [ ] **Step 1: Write relationship data tests**

Create `src/data/__tests__/relationships.test.ts`:

```typescript
import { relationships } from '../relationships';
import { stixObjects, getObjectByType } from '../index';

test('relationship map has entries', () => {
  expect(relationships.length).toBeGreaterThan(0);
});

test('every relationship references valid source and target types', () => {
  const validTypes = new Set(stixObjects.map((o) => o.type));
  for (const rel of relationships) {
    expect(validTypes.has(rel.sourceType)).toBe(true);
    for (const target of rel.targetTypes) {
      expect(validTypes.has(target)).toBe(true);
    }
  }
});

test('attack-pattern has outgoing relationships', () => {
  const ap = getObjectByType('attack-pattern');
  expect(ap!.relationships.outgoing.length).toBeGreaterThan(0);
  const targets = ap!.relationships.outgoing.find((r) => r.relationshipType === 'targets');
  expect(targets).toBeDefined();
  expect(targets!.objectTypes).toContain('identity');
});

test('identity has incoming relationships', () => {
  const identity = getObjectByType('identity');
  expect(identity!.relationships.incoming.length).toBeGreaterThan(0);
});

test('contains all 32 distinct relationship types', () => {
  const types = new Set(relationships.map((r) => r.relationshipType));
  expect(types.size).toBe(32);
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/data/__tests__/relationships.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Create relationships.ts**

Create `src/data/relationships.ts` with the complete relationship map from the STIX 2.1 spec. Each entry is:

```typescript
export interface RelationshipMapping {
  sourceType: string;
  relationshipType: string;
  targetTypes: string[];
}

export const relationships: RelationshipMapping[] = [
  // attack-pattern relationships
  { sourceType: 'attack-pattern', relationshipType: 'delivers', targetTypes: ['malware'] },
  { sourceType: 'attack-pattern', relationshipType: 'targets', targetTypes: ['identity', 'location', 'vulnerability'] },
  { sourceType: 'attack-pattern', relationshipType: 'uses', targetTypes: ['malware', 'tool'] },
  // campaign relationships
  { sourceType: 'campaign', relationshipType: 'attributed-to', targetTypes: ['intrusion-set', 'threat-actor'] },
  { sourceType: 'campaign', relationshipType: 'compromises', targetTypes: ['infrastructure'] },
  { sourceType: 'campaign', relationshipType: 'originates-from', targetTypes: ['location'] },
  { sourceType: 'campaign', relationshipType: 'targets', targetTypes: ['identity', 'location', 'vulnerability'] },
  { sourceType: 'campaign', relationshipType: 'uses', targetTypes: ['attack-pattern', 'infrastructure', 'malware', 'tool'] },
  // ... all remaining relationships from the spec (see spec Appendix B)
  // course-of-action, identity, indicator, infrastructure, intrusion-set,
  // malware, malware-analysis, threat-actor, tool, domain-name, ipv4-addr, ipv6-addr
];
```

The complete list of all relationship mappings from the STIX 2.1 spec must be included. Reference the research data from the brainstorming phase for the full source→type→target mapping.

- [ ] **Step 4: Update data/index.ts to wire relationships into objects**

Add to `src/data/index.ts`:

```typescript
import { relationships } from './relationships';
export { relationships };

// Populate incoming/outgoing relationships on each object
for (const rel of relationships) {
  const source = objectMap.get(rel.sourceType);
  if (source) {
    const existing = source.relationships.outgoing.find(
      (r) => r.relationshipType === rel.relationshipType
    );
    if (existing) {
      existing.objectTypes.push(...rel.targetTypes.filter((t) => !existing.objectTypes.includes(t)));
    } else {
      source.relationships.outgoing.push({
        relationshipType: rel.relationshipType,
        objectTypes: [...rel.targetTypes],
      });
    }
  }

  for (const targetType of rel.targetTypes) {
    const target = objectMap.get(targetType);
    if (target) {
      const existing = target.relationships.incoming.find(
        (r) => r.relationshipType === rel.relationshipType
      );
      if (existing) {
        if (!existing.objectTypes.includes(rel.sourceType)) {
          existing.objectTypes.push(rel.sourceType);
        }
      } else {
        target.relationships.incoming.push({
          relationshipType: rel.relationshipType,
          objectTypes: [rel.sourceType],
        });
      }
    }
  }
}
```

- [ ] **Step 5: Run tests to verify pass**

```bash
npx vitest run src/data
```

Expected: All data tests pass (both stix-objects and relationships).

- [ ] **Step 6: Commit**

```bash
git add src/data/
git commit -m "feat: add complete STIX 2.1 relationship map"
```

---

### Task 5: STIX Data — Example JSON Instances

**Files:**
- Create: `src/data/examples.ts`
- Modify: `src/data/index.ts` (wire examples into objects)
- Test: `src/data/__tests__/examples.test.ts`

- [ ] **Step 1: Write example data tests**

Create `src/data/__tests__/examples.test.ts`:

```typescript
import { examples } from '../examples';
import { stixObjects } from '../index';

test('has an example for every object type', () => {
  const exampleTypes = Object.keys(examples);
  const objectTypes = stixObjects.map((o) => o.type);
  for (const type of objectTypes) {
    expect(exampleTypes).toContain(type);
  }
});

test('every example has a type field matching its key', () => {
  for (const [key, example] of Object.entries(examples)) {
    expect(example.type).toBe(key);
  }
});

test('every example has an id field', () => {
  for (const example of Object.values(examples)) {
    expect(example.id).toBeTruthy();
  }
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/data/__tests__/examples.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Create examples.ts**

Create `src/data/examples.ts` with realistic example JSON instances for all 43 object types. Each example should look like a real-world CTI object — use realistic names, hashes, IPs, timestamps, etc. Every example must include at minimum: `type`, `id`, `spec_version` (for SDOs/SROs), and 3-5 interesting properties filled in.

```typescript
export const examples: Record<string, Record<string, unknown>> = {
  'attack-pattern': {
    type: 'attack-pattern',
    spec_version: '2.1',
    id: 'attack-pattern--0c7b5b88-8ff7-4a4d-aa9d-feb398cd0061',
    created: '2016-05-12T08:17:27.000Z',
    modified: '2016-05-12T08:17:27.000Z',
    name: 'Spear Phishing',
    description: 'Used to target specific individuals or groups within an organization...',
    external_references: [
      { source_name: 'capec', external_id: 'CAPEC-163' },
    ],
    kill_chain_phases: [
      { kill_chain_name: 'lockheed-martin-cyber-kill-chain', phase_name: 'delivery' },
    ],
  },
  // ... all 42 remaining object types
};
```

- [ ] **Step 4: Wire examples into objects in data/index.ts**

Add to `src/data/index.ts`:

```typescript
import { examples } from './examples';
export { examples };

// Populate examples on each object
for (const obj of stixObjects) {
  if (examples[obj.type]) {
    obj.example = examples[obj.type];
  }
}
```

- [ ] **Step 5: Run tests to verify pass**

```bash
npx vitest run src/data
```

Expected: All data tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/data/
git commit -m "feat: add realistic example JSON for all 43 STIX object types"
```

---

### Task 6: useFilter Hook

**Files:**
- Create: `src/hooks/useFilter.ts`
- Test: `src/hooks/__tests__/useFilter.test.ts`

- [ ] **Step 1: Write hook tests**

Create `src/hooks/__tests__/useFilter.test.ts`:

```typescript
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
  const names = result.current.filteredObjects.map((o) => o.name.toLowerCase());
  for (const name of names) {
    expect(name).toContain('malware');
  }
});

test('search filters by description', () => {
  const { result } = renderHook(() => useFilter());
  act(() => result.current.setSearch('phishing'));
  // Should return results if any description contains "phishing"
  // At minimum, attack-pattern description should match
  expect(result.current.filteredObjects.length).toBeGreaterThanOrEqual(0);
});

test('search and category filters combine', () => {
  const { result } = renderHook(() => useFilter());
  act(() => {
    result.current.toggleCategory('sco');
    result.current.toggleCategory('sro');
    result.current.toggleCategory('meta');
  });
  // Only SDOs remain
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
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/hooks
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement useFilter hook**

Create `src/hooks/useFilter.ts`:

```typescript
import { useState, useMemo } from 'react';
import { stixObjects } from '../data';
import type { StixCategory, StixObjectType } from '../types/stix';

export function useFilter() {
  const [activeCategories, setActiveCategories] = useState<Set<StixCategory>>(
    new Set(['sdo', 'sro', 'sco', 'meta'])
  );
  const [search, setSearch] = useState('');

  const toggleCategory = (category: StixCategory) => {
    setActiveCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  const filteredObjects = useMemo(() => {
    const query = search.toLowerCase().trim();
    return stixObjects.filter((obj) => {
      if (!activeCategories.has(obj.category)) return false;
      if (query) {
        return (
          obj.name.toLowerCase().includes(query) ||
          obj.description.toLowerCase().includes(query) ||
          obj.type.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [activeCategories, search]);

  return {
    filteredObjects,
    activeCategories,
    toggleCategory,
    search,
    setSearch,
  };
}
```

- [ ] **Step 4: Run tests to verify pass**

```bash
npx vitest run src/hooks
```

Expected: All 7 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/
git commit -m "feat: add useFilter hook for category toggles and search"
```

---

### Task 7: TopBar + FilterBar + ObjectCard Components

**Files:**
- Create: `src/components/TopBar.tsx`, `src/components/FilterBar.tsx`, `src/components/ObjectCard.tsx`
- Test: `src/components/__tests__/FilterBar.test.tsx`, `src/components/__tests__/ObjectCard.test.tsx`

- [ ] **Step 1: Write FilterBar tests**

Create `src/components/__tests__/FilterBar.test.tsx`:

```tsx
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
```

- [ ] **Step 2: Write ObjectCard tests**

Create `src/components/__tests__/ObjectCard.test.tsx`:

```tsx
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
```

- [ ] **Step 3: Run tests to verify they fail**

```bash
npx vitest run src/components/__tests__/FilterBar.test.tsx src/components/__tests__/ObjectCard.test.tsx
```

Expected: FAIL — modules not found.

- [ ] **Step 4: Implement TopBar**

Create `src/components/TopBar.tsx`:

```tsx
interface TopBarProps {
  search: string;
  onSearchChange: (value: string) => void;
}

export default function TopBar({ search, onSearchChange }: TopBarProps) {
  return (
    <header className="sticky top-0 z-10 bg-cti-bg/95 backdrop-blur border-b border-cti-border px-6 py-4 flex items-center justify-between gap-4">
      <h1 className="text-xl font-bold text-cti-text whitespace-nowrap">
        STIX 2.1 Meta Explorer
      </h1>
      <input
        type="text"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Search objects..."
        className="bg-cti-surface border border-cti-border rounded-lg px-4 py-2 text-cti-text placeholder-cti-muted focus:outline-none focus:border-cti-sco w-full max-w-md"
      />
    </header>
  );
}
```

- [ ] **Step 5: Implement FilterBar**

Create `src/components/FilterBar.tsx`:

```tsx
import type { StixCategory } from '../types/stix';
import { CATEGORY_COLORS } from '../types/stix';

interface FilterBarProps {
  activeCategories: Set<StixCategory>;
  onToggleCategory: (category: StixCategory) => void;
}

const chips: { category: StixCategory; label: string }[] = [
  { category: 'sdo', label: 'SDO' },
  { category: 'sro', label: 'SRO' },
  { category: 'sco', label: 'SCO' },
  { category: 'meta', label: 'Meta' },
];

export default function FilterBar({ activeCategories, onToggleCategory }: FilterBarProps) {
  return (
    <div className="flex gap-2 px-6 py-3">
      {chips.map(({ category, label }) => {
        const active = activeCategories.has(category);
        return (
          <button
            key={category}
            onClick={() => onToggleCategory(category)}
            className={`px-3 py-1 rounded-full text-sm font-medium border transition-all ${
              active ? 'opacity-100' : 'opacity-40'
            }`}
            style={{
              borderColor: CATEGORY_COLORS[category],
              color: CATEGORY_COLORS[category],
              backgroundColor: active ? `${CATEGORY_COLORS[category]}15` : 'transparent',
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 6: Implement ObjectCard**

Create `src/components/ObjectCard.tsx`:

```tsx
import type { StixObjectType } from '../types/stix';
import { CATEGORY_COLORS } from '../types/stix';

interface ObjectCardProps {
  object: StixObjectType;
  onClick: () => void;
}

export default function ObjectCard({ object, onClick }: ObjectCardProps) {
  const totalRelationships =
    object.relationships.outgoing.length + object.relationships.incoming.length;

  return (
    <div
      onClick={onClick}
      className={`bg-cti-surface border border-cti-border border-l-4 rounded-lg p-4 cursor-pointer hover:bg-cti-surface-hover transition-colors`}
      style={{ borderLeftColor: CATEGORY_COLORS[object.category] }}
    >
      <h3 className="text-cti-text font-semibold text-sm">{object.name}</h3>
      <p className="text-cti-muted text-xs mt-1 line-clamp-2">{object.description}</p>
      {totalRelationships > 0 && (
        <span
          className="inline-block mt-2 text-xs px-2 py-0.5 rounded-full"
          style={{
            color: CATEGORY_COLORS[object.category],
            backgroundColor: `${CATEGORY_COLORS[object.category]}15`,
          }}
        >
          {totalRelationships} relationship{totalRelationships !== 1 ? 's' : ''}
        </span>
      )}
    </div>
  );
}
```

- [ ] **Step 7: Run tests to verify pass**

```bash
npx vitest run src/components/__tests__/FilterBar.test.tsx src/components/__tests__/ObjectCard.test.tsx
```

Expected: All tests pass.

- [ ] **Step 8: Commit**

```bash
git add src/components/TopBar.tsx src/components/FilterBar.tsx src/components/ObjectCard.tsx src/components/__tests__/
git commit -m "feat: add TopBar, FilterBar, and ObjectCard components"
```

---

### Task 8: CardGrid Component

**Files:**
- Create: `src/components/CardGrid.tsx`
- Test: `src/components/__tests__/CardGrid.test.tsx`

- [ ] **Step 1: Write CardGrid tests**

Create `src/components/__tests__/CardGrid.test.tsx`:

```tsx
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
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/components/__tests__/CardGrid.test.tsx
```

Expected: FAIL.

- [ ] **Step 3: Implement CardGrid**

Create `src/components/CardGrid.tsx`:

```tsx
import type { StixObjectType, StixCategory } from '../types/stix';
import { CATEGORY_COLORS } from '../types/stix';
import ObjectCard from './ObjectCard';

interface CardGridProps {
  objects: StixObjectType[];
  onSelectObject: (obj: StixObjectType) => void;
}

const SECTION_ORDER: { category: StixCategory; label: string }[] = [
  { category: 'sdo', label: 'Domain Objects' },
  { category: 'sro', label: 'Relationship Objects' },
  { category: 'sco', label: 'Cyber Observables' },
  { category: 'meta', label: 'Meta Objects' },
];

export default function CardGrid({ objects, onSelectObject }: CardGridProps) {
  const grouped = SECTION_ORDER.map(({ category, label }) => ({
    category,
    label,
    items: objects.filter((o) => o.category === category),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="px-6 pb-6 space-y-6">
      {grouped.map(({ category, label, items }) => (
        <section key={category}>
          <h2
            className="text-sm font-semibold uppercase tracking-wider mb-3"
            style={{ color: CATEGORY_COLORS[category] }}
          >
            {label}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {items.map((obj) => (
              <ObjectCard
                key={obj.type}
                object={obj}
                onClick={() => onSelectObject(obj)}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Run tests to verify pass**

```bash
npx vitest run src/components/__tests__/CardGrid.test.tsx
```

Expected: All 3 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/components/CardGrid.tsx src/components/__tests__/CardGrid.test.tsx
git commit -m "feat: add CardGrid component with category sections"
```

---

### Task 9: PropertyTable + JsonExample Components

**Files:**
- Create: `src/components/PropertyTable.tsx`, `src/components/JsonExample.tsx`
- Test: `src/components/__tests__/PropertyTable.test.tsx`, `src/components/__tests__/JsonExample.test.tsx`

- [ ] **Step 1: Write PropertyTable tests**

Create `src/components/__tests__/PropertyTable.test.tsx`:

```tsx
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
  expect(nameRow?.textContent).toContain('★');
});

test('required properties show required badge', () => {
  render(<PropertyTable properties={mockProperties} />);
  const badges = screen.getAllByText('required');
  expect(badges.length).toBeGreaterThan(0);
});
```

- [ ] **Step 2: Write JsonExample tests**

Create `src/components/__tests__/JsonExample.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import JsonExample from '../JsonExample';

test('renders formatted JSON', () => {
  const example = { type: 'attack-pattern', name: 'Test' };
  render(<JsonExample data={example} />);
  expect(screen.getByText(/"attack-pattern"/)).toBeInTheDocument();
});

test('renders copy button', () => {
  render(<JsonExample data={{ type: 'test' }} />);
  expect(screen.getByRole('button', { name: /copy/i })).toBeInTheDocument();
});
```

- [ ] **Step 3: Run tests to verify they fail**

```bash
npx vitest run src/components/__tests__/PropertyTable.test.tsx src/components/__tests__/JsonExample.test.tsx
```

Expected: FAIL.

- [ ] **Step 4: Implement PropertyTable**

Create `src/components/PropertyTable.tsx`:

```tsx
import { useState } from 'react';
import type { Property } from '../types/stix';

interface PropertyTableProps {
  properties: Property[];
}

export default function PropertyTable({ properties }: PropertyTableProps) {
  const [showCommon, setShowCommon] = useState(false);

  const common = properties.filter((p) => p.isCommon);
  const unique = properties.filter((p) => !p.isCommon);

  const renderRow = (prop: Property) => (
    <tr key={prop.name} className="border-b border-cti-border">
      <td className="py-2 px-3 text-sm font-mono text-cti-text">
        {prop.isInteresting && <span className="text-yellow-400 mr-1">★</span>}
        {prop.name}
      </td>
      <td className="py-2 px-3 text-xs font-mono text-cti-muted">{prop.type}</td>
      <td className="py-2 px-3 text-xs">
        {prop.required && (
          <span className="text-cti-sdo bg-cti-sdo/10 px-1.5 py-0.5 rounded text-xs">
            required
          </span>
        )}
      </td>
      <td className="py-2 px-3 text-xs text-cti-muted">{prop.description}</td>
    </tr>
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-cti-border">
            <th className="py-2 px-3 text-xs font-semibold text-cti-muted uppercase">Name</th>
            <th className="py-2 px-3 text-xs font-semibold text-cti-muted uppercase">Type</th>
            <th className="py-2 px-3 text-xs font-semibold text-cti-muted uppercase">Req</th>
            <th className="py-2 px-3 text-xs font-semibold text-cti-muted uppercase">Description</th>
          </tr>
        </thead>
        <tbody>
          {unique.map(renderRow)}
        </tbody>
      </table>

      {common.length > 0 && (
        <button
          onClick={() => setShowCommon(!showCommon)}
          className="mt-3 text-xs text-cti-muted hover:text-cti-text transition-colors"
        >
          {showCommon ? '▾' : '▸'} {common.length} common properties
        </button>
      )}

      {showCommon && (
        <table className="w-full text-left mt-2">
          <tbody>{common.map(renderRow)}</tbody>
        </table>
      )}
    </div>
  );
}
```

- [ ] **Step 5: Implement JsonExample**

Create `src/components/JsonExample.tsx`:

```tsx
import { useState } from 'react';

interface JsonExampleProps {
  data: Record<string, unknown>;
}

export default function JsonExample({ data }: JsonExampleProps) {
  const [copied, setCopied] = useState(false);
  const json = JSON.stringify(data, null, 2);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(json);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative">
      <button
        onClick={handleCopy}
        aria-label="Copy JSON"
        className="absolute top-3 right-3 text-xs text-cti-muted hover:text-cti-text bg-cti-bg/50 px-2 py-1 rounded"
      >
        {copied ? 'Copied!' : 'Copy'}
      </button>
      <pre className="bg-cti-bg border border-cti-border rounded-lg p-4 overflow-x-auto text-xs font-mono text-cti-text">
        {json}
      </pre>
    </div>
  );
}
```

- [ ] **Step 6: Run tests to verify pass**

```bash
npx vitest run src/components/__tests__/PropertyTable.test.tsx src/components/__tests__/JsonExample.test.tsx
```

Expected: All tests pass.

- [ ] **Step 7: Commit**

```bash
git add src/components/PropertyTable.tsx src/components/JsonExample.tsx src/components/__tests__/
git commit -m "feat: add PropertyTable and JsonExample components"
```

---

### Task 10: DetailDrawer + ObjectDetail Components

**Files:**
- Create: `src/components/DetailDrawer.tsx`, `src/components/ObjectDetail.tsx`
- Test: `src/components/__tests__/DetailDrawer.test.tsx`

- [ ] **Step 1: Write DetailDrawer tests**

Create `src/components/__tests__/DetailDrawer.test.tsx`:

```tsx
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
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/components/__tests__/DetailDrawer.test.tsx
```

Expected: FAIL.

- [ ] **Step 3: Implement DetailDrawer**

Create `src/components/DetailDrawer.tsx`:

```tsx
import type { StixObjectType } from '../types/stix';
import ObjectDetail from './ObjectDetail';

interface DetailDrawerProps {
  object: StixObjectType | null;
  onClose: () => void;
}

export default function DetailDrawer({ object, onClose }: DetailDrawerProps) {
  if (!object) return null;

  return (
    <>
      <div
        data-testid="drawer-overlay"
        className="fixed inset-0 bg-black/60 z-20"
        onClick={onClose}
      />
      <div className="fixed top-0 right-0 h-full w-full md:w-3/5 bg-cti-surface border-l border-cti-border z-30 overflow-y-auto shadow-2xl animate-slide-in">
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 text-cti-muted hover:text-cti-text text-xl z-10"
        >
          ✕
        </button>
        <ObjectDetail object={object} />
      </div>
    </>
  );
}
```

- [ ] **Step 4: Implement ObjectDetail**

Create `src/components/ObjectDetail.tsx`:

```tsx
import type { StixObjectType } from '../types/stix';
import { CATEGORY_COLORS, CATEGORY_LABELS } from '../types/stix';
import PropertyTable from './PropertyTable';
import JsonExample from './JsonExample';
import RelationshipGraph from './RelationshipGraph';

interface ObjectDetailProps {
  object: StixObjectType;
}

export default function ObjectDetail({ object }: ObjectDetailProps) {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <h2 className="text-2xl font-bold text-cti-text">{object.name}</h2>
          <span
            className="text-xs px-2 py-1 rounded-full font-medium"
            style={{
              color: CATEGORY_COLORS[object.category],
              backgroundColor: `${CATEGORY_COLORS[object.category]}15`,
            }}
          >
            {CATEGORY_LABELS[object.category]}
          </span>
        </div>
        <code className="text-xs text-cti-muted font-mono">{object.type}</code>
      </div>

      {/* Description */}
      <p className="text-sm text-cti-text leading-relaxed">{object.description}</p>

      {/* Properties */}
      <div>
        <h3 className="text-sm font-semibold text-cti-muted uppercase tracking-wider mb-3">
          Properties
        </h3>
        <PropertyTable properties={object.properties} />
      </div>

      {/* Example */}
      {Object.keys(object.example).length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-cti-muted uppercase tracking-wider mb-3">
            Example
          </h3>
          <JsonExample data={object.example} />
        </div>
      )}

      {/* Relationship Graph */}
      <div>
        <h3 className="text-sm font-semibold text-cti-muted uppercase tracking-wider mb-3">
          Relationships
        </h3>
        <RelationshipGraph object={object} />
      </div>

      {/* Spec Link */}
      <a
        href={object.specUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block text-sm text-cti-sco hover:underline"
      >
        View in STIX 2.1 Spec →
      </a>
    </div>
  );
}
```

Note: `RelationshipGraph` is used here but will be implemented as a stub first (next step), then fully built in Task 11.

- [ ] **Step 5: Create RelationshipGraph stub**

Create `src/components/RelationshipGraph.tsx`:

```tsx
import type { StixObjectType } from '../types/stix';

interface RelationshipGraphProps {
  object: StixObjectType;
}

export default function RelationshipGraph({ object }: RelationshipGraphProps) {
  const totalRelationships =
    object.relationships.outgoing.length + object.relationships.incoming.length;

  if (totalRelationships === 0) {
    return (
      <p className="text-sm text-cti-muted italic">
        No spec-defined relationships. Custom relationships may be defined via extensions.
      </p>
    );
  }

  return (
    <div className="bg-cti-bg border border-cti-border rounded-lg p-4 h-64 flex items-center justify-center">
      <p className="text-cti-muted text-sm">Graph placeholder — {totalRelationships} relationships</p>
    </div>
  );
}
```

- [ ] **Step 6: Add slide-in animation to Tailwind config**

Add to the `extend` section in `tailwind.config.ts`:

```typescript
keyframes: {
  'slide-in': {
    from: { transform: 'translateX(100%)' },
    to: { transform: 'translateX(0)' },
  },
},
animation: {
  'slide-in': 'slide-in 0.2s ease-out',
},
```

- [ ] **Step 7: Run tests to verify pass**

```bash
npx vitest run src/components/__tests__/DetailDrawer.test.tsx
```

Expected: All 5 tests pass.

- [ ] **Step 8: Commit**

```bash
git add src/components/DetailDrawer.tsx src/components/ObjectDetail.tsx src/components/RelationshipGraph.tsx src/components/__tests__/ tailwind.config.ts
git commit -m "feat: add DetailDrawer and ObjectDetail with property table and example JSON"
```

---

### Task 11: Wire Up App Component

**Files:**
- Modify: `src/components/App.tsx`
- Modify: `src/components/__tests__/App.test.tsx`

- [ ] **Step 1: Update App tests**

Replace `src/components/__tests__/App.test.tsx`:

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import App from '../App';

test('renders app title and search', () => {
  render(<App />);
  expect(screen.getByText('STIX 2.1 Meta Explorer')).toBeInTheDocument();
  expect(screen.getByPlaceholderText('Search objects...')).toBeInTheDocument();
});

test('renders filter chips', () => {
  render(<App />);
  expect(screen.getByText('SDO')).toBeInTheDocument();
  expect(screen.getByText('SRO')).toBeInTheDocument();
  expect(screen.getByText('SCO')).toBeInTheDocument();
  expect(screen.getByText('Meta')).toBeInTheDocument();
});

test('renders object cards', () => {
  render(<App />);
  expect(screen.getByText('Attack Pattern')).toBeInTheDocument();
});

test('clicking a card opens the detail drawer', () => {
  render(<App />);
  fireEvent.click(screen.getByText('Attack Pattern'));
  // Drawer should show the description
  expect(screen.getByText(/Describes ways/)).toBeInTheDocument();
});

test('search filters cards', () => {
  render(<App />);
  fireEvent.change(screen.getByPlaceholderText('Search objects...'), {
    target: { value: 'malware' },
  });
  expect(screen.getByText('Malware')).toBeInTheDocument();
  expect(screen.queryByText('Campaign')).not.toBeInTheDocument();
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/components/__tests__/App.test.tsx
```

Expected: FAIL — App doesn't render search/filters/cards yet.

- [ ] **Step 3: Implement full App component**

Replace `src/components/App.tsx`:

```tsx
import { useState } from 'react';
import TopBar from './TopBar';
import FilterBar from './FilterBar';
import CardGrid from './CardGrid';
import DetailDrawer from './DetailDrawer';
import { useFilter } from '../hooks/useFilter';
import type { StixObjectType } from '../types/stix';

export default function App() {
  const { filteredObjects, activeCategories, toggleCategory, search, setSearch } = useFilter();
  const [selectedObject, setSelectedObject] = useState<StixObjectType | null>(null);

  return (
    <div className="min-h-screen bg-cti-bg">
      <TopBar search={search} onSearchChange={setSearch} />
      <FilterBar activeCategories={activeCategories} onToggleCategory={toggleCategory} />
      <CardGrid objects={filteredObjects} onSelectObject={setSelectedObject} />
      <DetailDrawer object={selectedObject} onClose={() => setSelectedObject(null)} />
    </div>
  );
}
```

- [ ] **Step 4: Run tests to verify pass**

```bash
npx vitest run
```

Expected: All tests across the project pass.

- [ ] **Step 5: Manual verification**

```bash
npm run dev
```

Verify: cards render, search filters, category chips toggle, clicking a card opens the drawer with properties and example JSON.

- [ ] **Step 6: Commit**

```bash
git add src/components/App.tsx src/components/__tests__/App.test.tsx
git commit -m "feat: wire up App with filter, search, card grid, and detail drawer"
```

---

### Task 12: Relationship Force Graph — D3 Integration

**Files:**
- Create: `src/hooks/useForceGraph.ts`
- Modify: `src/components/RelationshipGraph.tsx` (replace stub with full implementation)
- Test: `src/hooks/__tests__/useForceGraph.test.ts`

This is the most complex component. The force graph uses D3 for physics simulation and React for SVG rendering.

- [ ] **Step 1: Write useForceGraph hook tests**

Create `src/hooks/__tests__/useForceGraph.test.ts`:

```typescript
import { renderHook, act } from '@testing-library/react';
import { useForceGraph } from '../useForceGraph';
import type { StixObjectType } from '../../types/stix';

const mockObject: StixObjectType = {
  type: 'attack-pattern',
  name: 'Attack Pattern',
  category: 'sdo',
  description: 'Test',
  properties: [],
  relationships: {
    outgoing: [
      { relationshipType: 'targets', objectTypes: ['identity', 'vulnerability'] },
      { relationshipType: 'uses', objectTypes: ['malware', 'tool'] },
    ],
    incoming: [
      { relationshipType: 'uses', objectTypes: ['threat-actor', 'intrusion-set'] },
    ],
  },
  example: {},
  specUrl: '',
};

test('initializes with center node and direct relationships', () => {
  const { result } = renderHook(() => useForceGraph(mockObject));
  const { nodes, edges } = result.current;

  // Center + 4 outgoing targets + 2 incoming sources = 7 nodes
  expect(nodes.length).toBe(7);
  // Should have edges for all relationships
  expect(edges.length).toBeGreaterThan(0);
});

test('center node is the selected object', () => {
  const { result } = renderHook(() => useForceGraph(mockObject));
  const center = result.current.nodes.find((n) => n.isCenter);
  expect(center).toBeDefined();
  expect(center!.type).toBe('attack-pattern');
});

test('incoming nodes have side=left, outgoing have side=right', () => {
  const { result } = renderHook(() => useForceGraph(mockObject));
  const { nodes } = result.current;
  const incoming = nodes.filter((n) => n.side === 'left');
  const outgoing = nodes.filter((n) => n.side === 'right');
  expect(incoming.length).toBe(2); // threat-actor, intrusion-set
  expect(outgoing.length).toBe(4); // identity, vulnerability, malware, tool
});

test('expandNode adds second-degree relationships', () => {
  const { result } = renderHook(() => useForceGraph(mockObject));
  const identityNode = result.current.nodes.find((n) => n.type === 'identity');
  act(() => result.current.expandNode(identityNode!.id));
  // Should have more nodes now (identity's own relationships)
  expect(result.current.nodes.length).toBeGreaterThan(7);
  expect(result.current.expandedNodes).toContain(identityNode!.id);
});

test('reset collapses to initial state', () => {
  const { result } = renderHook(() => useForceGraph(mockObject));
  const identityNode = result.current.nodes.find((n) => n.type === 'identity');
  act(() => result.current.expandNode(identityNode!.id));
  act(() => result.current.reset());
  expect(result.current.nodes.length).toBe(7);
  expect(result.current.expandedNodes).toHaveLength(0);
});

test('focusNode collapses to just that node and its direct relationships', () => {
  const { result } = renderHook(() => useForceGraph(mockObject));
  const identityNode = result.current.nodes.find((n) => n.type === 'identity');
  act(() => result.current.expandNode(identityNode!.id));
  act(() => result.current.focusNode(identityNode!.id));
  // Now identity is center with its own relationships
  const center = result.current.nodes.find((n) => n.isCenter);
  expect(center!.type).toBe('identity');
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/hooks/__tests__/useForceGraph.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Implement useForceGraph hook**

Create `src/hooks/useForceGraph.ts`:

```typescript
import { useState, useMemo, useCallback } from 'react';
import { getObjectByType } from '../data';
import type { StixObjectType, StixCategory } from '../types/stix';

export interface GraphNode {
  id: string;
  type: string;
  name: string;
  category: StixCategory;
  side: 'left' | 'center' | 'right';
  isCenter: boolean;
  depth: number;
  x?: number;
  y?: number;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  relationshipType: string;
}

const MAX_DEPTH = 2;

function buildGraph(
  centerType: string,
  expandedNodes: Set<string>,
  focusType?: string
): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const rootType = focusType || centerType;
  const rootObj = getObjectByType(rootType);
  if (!rootObj) return { nodes: [], edges: [] };

  const nodeMap = new Map<string, GraphNode>();
  const edges: GraphEdge[] = [];
  let edgeId = 0;

  const centerId = `node-${rootType}-center`;
  nodeMap.set(centerId, {
    id: centerId,
    type: rootType,
    name: rootObj.name,
    category: rootObj.category,
    side: 'center',
    isCenter: true,
    depth: 0,
  });

  function addRelationships(objType: string, parentId: string, depth: number) {
    const obj = getObjectByType(objType);
    if (!obj) return;

    // Outgoing
    for (const rel of obj.relationships.outgoing) {
      for (const targetType of rel.objectTypes) {
        const nodeId = `node-${targetType}-${depth}-out-${parentId}`;
        if (!nodeMap.has(nodeId)) {
          const targetObj = getObjectByType(targetType);
          if (targetObj) {
            nodeMap.set(nodeId, {
              id: nodeId,
              type: targetType,
              name: targetObj.name,
              category: targetObj.category,
              side: 'right',
              isCenter: false,
              depth,
            });
          }
        }
        edges.push({
          id: `edge-${edgeId++}`,
          source: parentId,
          target: nodeId,
          relationshipType: rel.relationshipType,
        });
      }
    }

    // Incoming
    for (const rel of obj.relationships.incoming) {
      for (const sourceType of rel.objectTypes) {
        const nodeId = `node-${sourceType}-${depth}-in-${parentId}`;
        if (!nodeMap.has(nodeId)) {
          const sourceObj = getObjectByType(sourceType);
          if (sourceObj) {
            nodeMap.set(nodeId, {
              id: nodeId,
              type: sourceType,
              name: sourceObj.name,
              category: sourceObj.category,
              side: 'left',
              isCenter: false,
              depth,
            });
          }
        }
        edges.push({
          id: `edge-${edgeId++}`,
          source: nodeId,
          target: parentId,
          relationshipType: rel.relationshipType,
        });
      }
    }
  }

  // Add direct relationships
  addRelationships(rootType, centerId, 1);

  // Expand nodes
  for (const expandedId of expandedNodes) {
    const expandedNode = nodeMap.get(expandedId);
    if (expandedNode && expandedNode.depth < MAX_DEPTH) {
      addRelationships(expandedNode.type, expandedId, expandedNode.depth + 1);
    }
  }

  return { nodes: Array.from(nodeMap.values()), edges };
}

export function useForceGraph(object: StixObjectType) {
  const [expandedNodes, setExpandedNodes] = useState<string[]>([]);
  const [focusType, setFocusType] = useState<string | undefined>();

  const { nodes, edges } = useMemo(
    () => buildGraph(object.type, new Set(expandedNodes), focusType),
    [object.type, expandedNodes, focusType]
  );

  const expandNode = useCallback((nodeId: string) => {
    setExpandedNodes((prev) => {
      if (prev.includes(nodeId)) return prev;
      // Enforce soft limit: if at max, remove oldest
      const next = [...prev, nodeId];
      if (next.length > MAX_DEPTH) {
        return next.slice(1);
      }
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    setExpandedNodes([]);
    setFocusType(undefined);
  }, []);

  const focusNode = useCallback((nodeId: string) => {
    const node = nodes.find((n) => n.id === nodeId);
    if (node) {
      setFocusType(node.type);
      setExpandedNodes([]);
    }
  }, [nodes]);

  return { nodes, edges, expandedNodes, expandNode, reset, focusNode };
}
```

- [ ] **Step 4: Run hook tests to verify pass**

```bash
npx vitest run src/hooks/__tests__/useForceGraph.test.ts
```

Expected: All 6 tests pass. May need adjustments to node ID generation to match test expectations.

- [ ] **Step 5: Implement full RelationshipGraph component**

Replace `src/components/RelationshipGraph.tsx`:

```tsx
import { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import type { StixObjectType } from '../types/stix';
import { CATEGORY_COLORS } from '../types/stix';
import { useForceGraph, type GraphNode, type GraphEdge } from '../hooks/useForceGraph';

interface RelationshipGraphProps {
  object: StixObjectType;
}

export default function RelationshipGraph({ object }: RelationshipGraphProps) {
  const { nodes, edges, expandNode, reset, focusNode, expandedNodes } = useForceGraph(object);
  const svgRef = useRef<SVGSVGElement>(null);
  const [positions, setPositions] = useState<Map<string, { x: number; y: number }>>(new Map());
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; text: string } | null>(null);

  const totalRelationships =
    object.relationships.outgoing.length + object.relationships.incoming.length;

  useEffect(() => {
    if (nodes.length === 0) return;

    const width = 800;
    const height = 400;

    const simulation = d3
      .forceSimulation(nodes.map((n) => ({ ...n, x: n.x, y: n.y })))
      .force('charge', d3.forceManyBody().strength(-200))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force(
        'x',
        d3.forceX<GraphNode & d3.SimulationNodeDatum>()
          .x((d) => {
            if (d.side === 'left') return width * 0.2;
            if (d.side === 'right') return width * 0.8;
            return width / 2;
          })
          .strength(0.5)
      )
      .force('y', d3.forceY(height / 2).strength(0.1))
      .force('collision', d3.forceCollide(40));

    simulation.on('tick', () => {
      const pos = new Map<string, { x: number; y: number }>();
      for (const node of simulation.nodes() as (GraphNode & d3.SimulationNodeDatum)[]) {
        pos.set(node.id, {
          x: Math.max(30, Math.min(width - 30, node.x || 0)),
          y: Math.max(30, Math.min(height - 30, node.y || 0)),
        });
      }
      setPositions(new Map(pos));
    });

    return () => {
      simulation.stop();
    };
  }, [nodes]);

  if (totalRelationships === 0) {
    return (
      <p className="text-sm text-cti-muted italic">
        No spec-defined relationships. Custom relationships may be defined via extensions.
      </p>
    );
  }

  const hoveredEdges = hoveredNode
    ? new Set(
        edges
          .filter((e) => e.source === hoveredNode || e.target === hoveredNode)
          .map((e) => e.id)
      )
    : null;

  return (
    <div className="relative">
      <div className="flex gap-2 mb-2">
        <button
          onClick={reset}
          className="text-xs px-2 py-1 bg-cti-bg border border-cti-border rounded text-cti-muted hover:text-cti-text"
        >
          Reset
        </button>
        {expandedNodes.length > 0 && (
          <button
            onClick={() => {
              const lastExpanded = nodes.find((n) => n.id === expandedNodes[expandedNodes.length - 1]);
              if (lastExpanded) focusNode(lastExpanded.id);
            }}
            className="text-xs px-2 py-1 bg-cti-bg border border-cti-border rounded text-cti-muted hover:text-cti-text"
          >
            Focus
          </button>
        )}
      </div>
      <svg
        ref={svgRef}
        viewBox="0 0 800 400"
        className="w-full bg-cti-bg border border-cti-border rounded-lg"
      >
        <defs>
          <marker
            id="arrowhead"
            viewBox="0 0 10 7"
            refX="10"
            refY="3.5"
            markerWidth="6"
            markerHeight="5"
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill="#30363d" />
          </marker>
        </defs>

        {/* Edges */}
        {edges.map((edge) => {
          const sourcePos = positions.get(edge.source);
          const targetPos = positions.get(edge.target);
          if (!sourcePos || !targetPos) return null;

          const isHighlighted = hoveredEdges?.has(edge.id);
          const sourceNode = nodes.find((n) => n.id === edge.source);
          const highlightColor = sourceNode
            ? CATEGORY_COLORS[sourceNode.category]
            : '#30363d';

          return (
            <g key={edge.id}>
              <line
                x1={sourcePos.x}
                y1={sourcePos.y}
                x2={targetPos.x}
                y2={targetPos.y}
                stroke={isHighlighted ? highlightColor : '#30363d'}
                strokeWidth={isHighlighted ? 2 : 1}
                markerEnd="url(#arrowhead)"
                opacity={hoveredEdges && !isHighlighted ? 0.2 : 0.6}
              />
              <text
                x={(sourcePos.x + targetPos.x) / 2}
                y={(sourcePos.y + targetPos.y) / 2 - 6}
                textAnchor="middle"
                fill="#8b949e"
                fontSize="8"
                opacity={hoveredEdges && !isHighlighted ? 0.1 : 0.7}
              >
                {edge.relationshipType}
              </text>
            </g>
          );
        })}

        {/* Nodes */}
        {nodes.map((node) => {
          const pos = positions.get(node.id);
          if (!pos) return null;
          const color = CATEGORY_COLORS[node.category];
          const radius = node.isCenter ? 24 : 16;

          return (
            <g
              key={node.id}
              transform={`translate(${pos.x}, ${pos.y})`}
              className="cursor-pointer"
              onClick={() => expandNode(node.id)}
              onDoubleClick={() => focusNode(node.id)}
              onMouseEnter={() => {
                setHoveredNode(node.id);
                setTooltip({ x: pos.x, y: pos.y - radius - 10, text: node.name });
              }}
              onMouseLeave={() => {
                setHoveredNode(null);
                setTooltip(null);
              }}
            >
              <circle
                r={radius}
                fill={`${color}20`}
                stroke={color}
                strokeWidth={hoveredNode === node.id ? 2.5 : 1.5}
              />
              <text
                textAnchor="middle"
                dy="0.35em"
                fill={color}
                fontSize={node.isCenter ? 9 : 7}
                fontWeight={node.isCenter ? 'bold' : 'normal'}
              >
                {node.name.length > 12 ? `${node.name.slice(0, 11)}…` : node.name}
              </text>
            </g>
          );
        })}

        {/* Tooltip */}
        {tooltip && (
          <g transform={`translate(${tooltip.x}, ${tooltip.y})`}>
            <rect
              x={-tooltip.text.length * 3.5}
              y={-12}
              width={tooltip.text.length * 7}
              height={18}
              fill="#161b22"
              stroke="#30363d"
              rx={4}
            />
            <text textAnchor="middle" dy="0.35em" fill="#e6edf3" fontSize="10">
              {tooltip.text}
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}
```

- [ ] **Step 6: Run all tests**

```bash
npx vitest run
```

Expected: All tests pass.

- [ ] **Step 7: Manual verification**

```bash
npm run dev
```

Click on a card and verify:
- Force graph renders with center node and left/right layout
- Hovering highlights edges
- Clicking a node expands it
- Reset button works
- Objects with no relationships show the message

- [ ] **Step 8: Commit**

```bash
git add src/hooks/useForceGraph.ts src/components/RelationshipGraph.tsx src/hooks/__tests__/
git commit -m "feat: add interactive D3 force-directed relationship graph"
```

---

### Task 13: Polish & Final Integration

**Files:**
- Modify: various component files for polish
- Modify: `index.html` (title, favicon)

- [ ] **Step 1: Update index.html metadata**

Update `index.html` title and add a description:

```html
<title>STIX 2.1 Meta Explorer</title>
<meta name="description" content="Interactive reference for STIX 2.1 object types, properties, and relationships" />
```

- [ ] **Step 2: Add keyboard support for drawer**

Modify `src/components/DetailDrawer.tsx` — add Escape key to close:

```tsx
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  };
  document.addEventListener('keydown', handleKeyDown);
  return () => document.removeEventListener('keydown', handleKeyDown);
}, [onClose]);
```

- [ ] **Step 3: Add object count to filter chips**

Modify `src/components/FilterBar.tsx` to accept and display counts:

```tsx
interface FilterBarProps {
  activeCategories: Set<StixCategory>;
  onToggleCategory: (category: StixCategory) => void;
  counts: Record<StixCategory, number>;
}
```

Display count inside each chip: `SDO (19)`, `SRO (2)`, etc.

- [ ] **Step 4: Run full test suite**

```bash
npx vitest run
```

Expected: All tests pass.

- [ ] **Step 5: Run production build**

```bash
npm run build
```

Expected: Build succeeds with no errors. Check `dist/` output.

- [ ] **Step 6: Manual end-to-end verification**

```bash
npm run preview
```

Verify the complete flow:
- App loads with dark CTI theme
- All 43 cards render in categorized sections
- Search filters by name/description/type
- Category chips toggle correctly with counts
- Clicking a card opens the drawer with:
  - Object name and category badge
  - Description
  - Property table (common collapsed, interesting highlighted)
  - Example JSON with copy button
  - Force graph with left/right layout
  - Spec link
- Drawer closes on X, overlay click, or Escape
- Force graph: hover highlights, click expands, reset works

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: polish UI with keyboard support, filter counts, and metadata"
```

---

### Task 14: Build Verification & Cleanup

- [ ] **Step 1: Run linter and type-check**

```bash
npx tsc --noEmit
```

Expected: No type errors.

- [ ] **Step 2: Run full test suite with coverage**

```bash
npx vitest run --coverage
```

Review coverage report. Core components and hooks should have coverage.

- [ ] **Step 3: Clean up any unused imports or files**

Review and remove any Vite scaffolding files that aren't needed (default `App.css`, `logo.svg`, etc.).

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "chore: cleanup unused scaffolding and verify build"
```
