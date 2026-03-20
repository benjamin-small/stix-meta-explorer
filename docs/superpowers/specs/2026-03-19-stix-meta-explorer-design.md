# STIX 2.1 Meta Explorer — Design Spec

## Overview

A React single-page application for exploring the STIX 2.1 specification. No backend required — all schema data is compiled into the app at build time. The app serves as a general-purpose reference tool for security analysts, developers building STIX tooling, and CTI professionals learning the standard.

**Core experience:** A filterable card grid of all 43 STIX 2.1 object types. Clicking a card opens a detail drawer with concise documentation, property tables, example JSON, and an interactive force-directed relationship graph showing incoming and outgoing relationships.

## Stack

- **Vite** — build tool and dev server
- **React 18** — functional components with hooks
- **TypeScript** — strict mode
- **D3.js** — force graph physics and layout (React owns DOM, D3 owns math)
- **Tailwind CSS** — utility-first styling with custom CTI theme
- **Deployment:** Static files (GitHub Pages / Netlify / Vercel)

No backend. No runtime data fetching. Zero external API dependencies.

## Data Layer

### Sources

1. **OASIS JSON schemas** from `oasis-open/cti-stix2-json-schemas` — structural backbone for property names, types, required/optional flags, enums
2. **Curated enrichment** compiled from the STIX 2.1 OASIS specification — human-readable descriptions, relationship maps, "interesting property" highlights, realistic example JSON

### Data Model

```typescript
interface StixObjectType {
  type: string;                // e.g. "attack-pattern"
  name: string;                // e.g. "Attack Pattern"
  category: 'sdo' | 'sro' | 'sco' | 'meta';
  description: string;         // concise what-it-is summary
  properties: Property[];
  relationships: {
    outgoing: RelationshipDef[];
    incoming: RelationshipDef[];
  };
  example: object;             // realistic JSON instance
  specUrl: string;             // link to OASIS spec section
}

interface Property {
  name: string;
  type: string;                // e.g. "string", "list of identifier"
  required: boolean;
  description: string;
  isCommon: boolean;           // inherited from base type
  isInteresting: boolean;      // key differentiating property
}

interface RelationshipDef {
  relationshipType: string;    // e.g. "targets", "uses"
  objectTypes: string[];       // target types (outgoing) or source types (incoming)
}
```

### Object Inventory

- **19 SDOs:** attack-pattern, campaign, course-of-action, grouping, identity, incident, indicator, infrastructure, intrusion-set, location, malware, malware-analysis, note, observed-data, opinion, report, threat-actor, tool, vulnerability
- **2 SROs:** relationship, sighting
- **18 SCOs:** artifact, autonomous-system, directory, domain-name, email-addr, email-message, file, ipv4-addr, ipv6-addr, mac-addr, mutex, network-traffic, process, software, url, user-account, windows-registry-key, x509-certificate
- **4 Meta Objects:** bundle, extension-definition, language-content, marking-definition
- **32 distinct relationship types** mapped across source/target pairs

## UI Architecture

### State 1 — Card Grid (Home View)

**Top bar:**
- App title: "STIX 2.1 Meta Explorer"
- Search input: filters cards by name and description as you type

**Filter bar:**
- Toggle chips for SDO / SRO / SCO / Meta
- All active by default; click to toggle visibility

**Card grid:**
- Responsive grid layout
- Each card shows:
  - Color-coded left border by category
  - Object type name
  - One-line description
  - Relationship count badge
- Cards grouped visually by category with subtle section dividers
- Single continuous filterable grid

### State 2 — Detail Drawer

Slides in from the right (~60% viewport width) when a card is clicked. Card grid dims behind it.

**Drawer sections (top to bottom):**

1. **Header** — object type name, category badge with accent color
2. **Description** — concise summary of what this object type is and when to use it
3. **Properties table** — columns: Name, Type, Required, Description
   - Common (inherited) properties collapsed by default
   - "Interesting" properties highlighted with a marker
   - Sortable and filterable
4. **Example JSON** — syntax-highlighted with copy-to-clipboard button
5. **Relationship graph** — interactive D3 force-directed visualization
6. **Spec link** — direct link to the relevant OASIS spec section

Close via X button or clicking the dimmed background.

## Relationship Force Graph

### Layout

Left/Center/Right topology:

- **Center:** Selected object type (larger node, anchored, color-coded)
- **Left:** Incoming relationships — other types that point TO this object. Edge labels show relationship_type.
- **Right:** Outgoing relationships — types this object points TO. Edge labels show relationship_type.

Custom D3 x-force pulls incoming nodes left, outgoing nodes right.

### Interactions

- **Hover node:** Highlights connected edges, shows tooltip with relationship detail
- **Click node:** Expands in-place — reveals that node's own incoming/outgoing relationships. Graph grows organically.
- **Expansion limit:** Soft cap at 2 degrees. Oldest expanded nodes auto-collapse when new ones expand.
- **Focus button:** Collapses to just the selected node and its direct relationships
- **Reset button:** Returns to the original object's graph state
- **Zoom/pan:** D3 zoom — scroll to zoom, drag to pan

### Visual Encoding

- Nodes colored by category (same accent colors as cards)
- Node size scales with relationship count
- Edge thickness varies by number of relationship types between two nodes
- Edges labeled with relationship_type
- Animated force simulation

### Edge Cases

- Objects with no spec-defined relationships (e.g., `incident`): show center node with message "No spec-defined relationships. Custom relationships may be defined via extensions."
- Bidirectional relationships: shown as two distinct directed edges with arrows

## Theme & Visual Style

### Dark CTI Aesthetic

- **Background:** #0d1117 (base), #161b22 (card/drawer surfaces)
- **Text:** #e6edf3 (primary), #8b949e (secondary/muted)
- **Category accents:**
  - SDO: Red-orange (#f85149)
  - SCO: Blue (#58a6ff)
  - SRO: Purple (#bc8cff)
  - Meta: Teal (#3fb950)
- **Graph edges:** Muted gray default, highlight to source node's accent on hover
- **Interactive elements:** Subtle glow/border on hover, smooth transitions
- **Typography:** Inter / system sans-serif for UI; JetBrains Mono / Fira Code for JSON and type annotations
- **Cards:** Left border with category color, slight elevation on hover

**Design tone:** Purpose-built security tooling — between a Splunk dashboard and the MITRE ATT&CK Navigator. Not a generic docs site.

## Project Structure

```
src/
  data/
    stix-objects.ts        # compiled object type definitions
    relationships.ts       # full relationship map
    examples.ts            # example JSON instances
    schema/                # raw OASIS JSON schemas (build-time reference)
  components/
    App.tsx                # root layout, state management
    CardGrid.tsx           # filterable grid of object cards
    ObjectCard.tsx         # individual card component
    FilterBar.tsx          # category toggle chips + search
    DetailDrawer.tsx       # slide-out panel container
    ObjectDetail.tsx       # detail content (description, props, example)
    PropertyTable.tsx      # sortable/filterable property table
    JsonExample.tsx        # syntax-highlighted JSON with copy
    RelationshipGraph.tsx  # D3 force graph wrapper
  hooks/
    useForceGraph.ts       # D3 simulation logic, expansion state
    useFilter.ts           # card filtering/search logic
  theme/
    tailwind.config.ts     # custom CTI color palette
  types/
    stix.ts                # TypeScript interfaces for the data model
```

## State Management

React useState/useContext only. No external state library needed.

**Key state:**
- Active category filters (SDO/SRO/SCO/Meta toggles)
- Search query string
- Selected object type (controls drawer open/closed)
- Graph expansion state (managed via useReducer in the graph component — tracks which nodes are expanded and their depth)

## Technical Decisions

- **D3 calculates, React renders:** D3 runs the force simulation and computes positions. React renders SVG elements based on those positions. No D3 DOM manipulation.
- **Static data imports:** All STIX data compiled into TypeScript modules. Tree-shaking keeps the bundle lean.
- **Graph expansion state:** useReducer hook in RelationshipGraph tracks expanded nodes and enforces the soft depth limit.
