# Simulora

Simulora's frozen Research, Product, System Design and Experience evidence lives under [`docs/`](docs/README.md). Production implementation begins as a separate pnpm workspace; the approved clickable Prototype remains frozen under `prototypes/simulora-experience/` and is not part of the production dependency graph.

## Current production status

IP-1–IP-6 are implemented and approved by the final independent G1–G6 / Integrated
Review at behavior baseline `eb55734f258fc9be6f4837df888700e34eaa67e2`.
The [current implementation handoff](docs/implementation-planning/IMPLEMENTATION_STATUS_HANDOFF.md)
records scope and next-phase authorization; the
[final independent report](docs/implementation-planning/G1-G6-FINAL-INTEGRATED-REVIEW.md)
retains the decision and exact-baseline CI evidence.

Production includes World/Continuity, durable Action Truth, Return/Correction,
non-destructive Recovery and direct Participation/Character authority. It still
uses deterministic generation and development authentication. IP-7 World Studio
and production deployment have not started. A
[bounded Product Reality Spike](docs/implementation-planning/PRODUCT_REALITY_SPIKE_PLAN.md)
has completed 12 isolated live calls using the user's local compatible API profile.
The [actual results](docs/implementation-planning/PRODUCT_REALITY_SPIKE_REPORT.md)
identify runtime limitations and one new Return display issue. The minimal
[RE-1 display repair](docs/implementation-planning/RETURN_CURRENT_SITUATION_REPAIR_REPORT.md)
is implemented, pending independent review; the remaining
[bounded runtime follow-up](docs/implementation-planning/BOUNDED_RUNTIME_ENABLEMENT_PLAN.md)
is proposed, not authorized. Production adapter/configuration remains unchanged.

## Development and verification

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

The API, worker and migration CLI load `.env.local` explicitly for local development. Explicit process environment variables take precedence.

With the isolated PostgreSQL dependency running and configured, run
`pnpm test:postgres` for the real database/concurrency/upgrade suites. Database
tests skipped without `SIMULORA_DATABASE_URL` are not database PASS evidence.

The local dependency instructions are detailed in [`deploy/local/README.md`](deploy/local/README.md). Production deployment is not yet started; use the CI container smoke job to verify the bundled runtime artifacts.
