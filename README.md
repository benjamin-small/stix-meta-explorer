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

## Optional browser STIX assistant

An isolated, feature-flagged sidebar can answer STIX 2.1 questions using a locally fine-tuned SmolLM2 model, Rust/WASM retrieval, and WebGPU. Set `VITE_STIX_AGENT=true` in `.env.development.local` to enable **Ask STIX**. The model loads only when the sidebar opens; closing it releases the worker and model memory. See [setup, training, and runtime documentation](docs/stix-agent.md) and [measured validation](docs/stix-agent-validation.md).

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
npm test
npm run coverage
```

The application requires no environment variables. See [docs/configuration.md](docs/configuration.md) for build and deployment configuration, [docs/testing.md](docs/testing.md) for measured coverage and test scope, and [docs/licensing.md](docs/licensing.md) for the current licensing status.
