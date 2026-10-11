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
- **Type relationship graph** — Interactive D3 force-directed visualization showing how STIX object types relate to each other
- **Relationship table** — Tabular view of all incoming and outgoing relationships
- **Example JSON** — See representative JSON for each object type, alongside real instances from the fictional Hackers (1995) case
- **Hackers bundle explorer** — Browse all 75 objects with persistent search and type filters. Explore a focused neighborhood or the full graph with zoom/pan controls; inspect named relationships and references; read the linked narrative or indicator pattern fixtures in dedicated views. Object selection updates in place and supports browser Back/Forward. Deep links use `?view=hackers&object=<STIX ID>`. This repository owns the [full dataset](src/data/hackers-1995/README.md); no runtime fetch or upstream sync is required.
- **Story walkthrough** — “Watch the story” pairs nine plot scenes with sourced film stills and a graph that grows as people, systems, and evidence enter the story. Step forward/back, jump to a scene, or play automatically; optional **Read aloud** narrates the displayed story and graph note with the browser's voice and advances when speech finishes. Dragging, panning, zooming, and inspecting graph objects leave playback running. Leaving the tab pauses playback. Both graph views use circles, squares, and diamonds for related STIX types, with an expandable shape key. Share a scene with `?view=hackers&panel=walkthrough&scene=the-worm`. Motion follows the browser's reduced-motion preference. Stills load from their external host; captions, source links, and the object list remain usable if an image or WebGL is unavailable. See [story and media notes](docs/hackers-story.md).

## Tech Stack

React, TypeScript, Vite, Tailwind CSS, D3 (type reference), and [`@poietic-tech/graphing-library`](https://www.npmjs.com/package/@poietic-tech/graphing-library) (Hackers bundle graph).

The bundle graph uses the graphing library's React binding and Rust/WASM renderer. It supports node dragging, pan, zoom, and selection synchronized with the object inspector. Graph rendering requires WebGL2; an expandable **Graph objects** list provides keyboard navigation and remains available when rendering is unsupported. Vite serves the library directly during development so its WASM asset resolves correctly, and bundles that asset for production.

## Optional browser STIX assistant

An isolated, feature-flagged sidebar can answer STIX 2.1 questions using a locally fine-tuned SmolLM2 model, Rust/WASM retrieval, and WebGPU. Set `VITE_STIX_AGENT=true` in `.env.development.local` to enable **Ask STIX**. The model loads only when the sidebar opens; closing it releases the worker and model memory. A microphone button lets you dictate into the chat box, review the text, and send it. Browser speech recognition may process audio online. See [setup, training, and runtime documentation](docs/stix-agent.md) and [measured validation](docs/stix-agent-validation.md).

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
