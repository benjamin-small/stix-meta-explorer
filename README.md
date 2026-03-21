# STIX Meta Explorer

An interactive reference tool for exploring the [STIX 2.1](https://oasis-open.github.io/cti-documentation/stix/intro.html) specification. Browse, search, and visualize the structure, properties, and relationships of all STIX object types.

**Live demo:** https://benjamin-small.github.io/stix-meta-explorer/

## What is STIX?

STIX (Structured Threat Information Expression) is an open standard for representing cyber threat intelligence. It defines a common language for describing threats, attacks, vulnerabilities, and defensive measures so that organizations can share and analyze threat data consistently.

## Features

- **Browse all STIX 2.1 object types** — 43 objects across SDOs, SROs, SCOs, and Meta Objects
- **Filter by category** — Quickly narrow down to Domain Objects, Relationship Objects, Cyber Observables, or Meta Objects
- **Search** — Find objects by name or description
- **Property reference** — View every property for each object type, including data types, requirement status, and descriptions linked to the official OASIS spec
- **Relationship graph** — Interactive D3 force-directed visualization showing how objects relate to each other
- **Relationship table** — Tabular view of all incoming and outgoing relationships
- **Example JSON** — See representative JSON for each object type

## Tech Stack

React, TypeScript, Vite, Tailwind CSS, D3

## Development

```bash
npm install
npm run dev
```

Build for production:

```bash
npm run build
```

Run tests:

```bash
npx vitest run
```
