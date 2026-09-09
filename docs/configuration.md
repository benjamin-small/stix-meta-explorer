# Configuration

The application requires no secrets or environment variables. Its STIX metadata, examples, and relationship definitions are versioned TypeScript data under `src/data/`.

Local development uses Vite's default development settings:

```sh
npm ci
npm run dev
```

The production build writes static assets to `dist/`. GitHub Actions deploys that directory to the repository's public GitHub Pages site. No `.env` file is required for development, tests, builds, or deployment.

The optional browser assistant uses the build-time `VITE_STIX_AGENT` flag (default off). The Pages workflow sets it to `true` and installs a checksum-pinned model/WASM release first. Local development can enable it with `.env.development.local`; this file stays untracked. See [STIX assistant setup](stix-agent.md) for assets, model training and deployment details. The model loads only after the user opens **Ask STIX**.
