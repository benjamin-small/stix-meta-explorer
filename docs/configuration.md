# Configuration

The application requires no secrets or environment variables. Its STIX metadata, examples, and relationship definitions are versioned TypeScript data under `src/data/`.

Local development uses Vite's default development settings:

```sh
npm ci
npm run dev
```

The production build writes static assets to `dist/`. GitHub Actions deploys that directory to the repository's public GitHub Pages site. No `.env` file is required for development, tests, builds, or deployment.
