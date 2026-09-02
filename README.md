# Simulora

Simulora's frozen Research, Product, System Design and Experience evidence lives under [`docs/`](docs/README.md). Production implementation begins as a separate pnpm workspace; the approved clickable Prototype remains frozen under `prototypes/simulora-experience/` and is not part of the production dependency graph.

## IP-2 authoritative World and Continuity spine

Requirements:

- Node.js 24 or later;
- pnpm 11.19.0 (the version declared by `packageManager`);
- Docker Compose only when running local PostgreSQL and MinIO.

From a clean clone:

```text
corepack enable
pnpm install --frozen-lockfile
pnpm check
pnpm exec playwright install chromium
pnpm test:e2e
```

For the optional local dependency environment:

```text
copy .env.example .env.local
pnpm local:up
pnpm db:migrate
pnpm dev
```

The API, worker and migration CLI load `.env.local` explicitly for local development. Explicit process environment variables take precedence. IP-2 exposes the authoritative World/Draft/Revision/Continuity read spine while Action Truth, Recovery, World Studio and live model behavior remain deferred.

The local dependency instructions are detailed in [`deploy/local/README.md`](deploy/local/README.md). Production deployment is not yet started; use the CI container smoke job to verify the bundled runtime artifacts.
