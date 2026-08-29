# Simulora

Simulora's frozen Research, Product, System Design and Experience evidence lives under [`docs/`](docs/README.md). Production implementation begins as a separate pnpm workspace; the approved clickable Prototype remains frozen under `prototypes/simulora-experience/` and is not part of the production dependency graph.

## IP-1 engineering foundation

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

The local dependency instructions are detailed in [`deploy/local/README.md`](deploy/local/README.md). IP-1 contains no World, Continuity or Action product semantics, no live model provider and no production deployment.
