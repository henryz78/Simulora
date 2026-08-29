# IP-1 Engineering Foundation Report

**Status:** `GATE G1: PASSED — READY FOR INDEPENDENT REVIEW`

**Validation date:** `2026-08-29` (`Asia/Shanghai`)

**Authorized scope:** IP-1 Engineering Foundation only

**Starting frozen baseline:** `d9ae20c8dead3b94a4b2afb095943c79badc7752`

## 1. Outcome

IP-1 establishes the smallest production engineering platform described by the approved Implementation Plan. It deliberately does not implement World, Continuity, Action Truth or any other product domain behavior.

The production workspace is separate from the frozen Prototype and contains three independent runtime composition roots:

- `apps/web` — responsive React/Vite shell;
- `apps/api` — Fastify health and foundation endpoints;
- `apps/worker` — idle Node worker using deterministic/no-op adapters.

Shared code lives in explicit `packages/*` boundaries. PostgreSQL remains the planned authoritative store, but IP-1 creates only migration metadata. S3-compatible storage, auth and model access are represented by ports and local/deterministic adapters rather than vendor choices.

## 2. Implemented topology

```text
apps/                  web, api and worker composition roots
packages/              contracts, domain, application and infrastructure seams
db/migrations/         ordered forward PostgreSQL migrations
db/checks/             foundation integrity query
deploy/local/          loopback-only PostgreSQL + MinIO Compose contract
scripts/               architecture and migration checks
tests/integration/     migration and Compose contracts
tests/e2e/             desktop and 390x844 accessible shell checks
.github/workflows/     secret-free deterministic foundation CI
```

`pnpm-workspace.yaml` includes only `apps/*` and `packages/*`. The Prototype is not a workspace member, production source may not reference it, and the architecture checker rejects such references.

## 3. Foundation contracts

### Configuration and secrets

- Server configuration is Zod-validated.
- Only development auth and deterministic model adapters are accepted in IP-1.
- Database URLs, object-store credentials and content-like log fields are redacted.
- Client code receives no server secret dependency.

### Database and migrations

- `db/migrations/0001_foundation.sql` creates only `app_meta.foundation_metadata`.
- The stored phase is `IP-1` with `productSemanticsStarted: false`.
- The PostgreSQL runner uses an advisory lock, ordered files, checksums, one transaction per migration and a migration ledger.
- PGlite validates the migration from an empty PostgreSQL-compatible database and repeated application against an existing schema.
- CI is configured to run the PostgreSQL migration command twice against PostgreSQL 17, proving empty-schema and already-applied behavior.

No World, Branch, Continuity, Commit, Event, Action, Character, Memory or Revision table exists.

### Runtime and provider boundaries

- API and worker build and run as separate Node processes.
- The API emits an `x-request-id` and structured redacted request-completion logs.
- The worker starts idle with a deterministic model gateway and no-op job repository.
- Object storage has an in-memory fake; local Compose provides MinIO without selecting a production vendor.
- Observability uses an OpenTelemetry-compatible context API and structured log redaction.

### Frontend and accessibility

- The production shell is original code and does not copy the Prototype component tree.
- It honestly identifies itself as IP-1 and states that product semantics have not started.
- Desktop and 390x844 projects exercise interaction, axe checks and keyboard focus/activation.
- Focus visibility, responsive layout and reduced-motion behavior are present from the foundation phase.

## 4. Gate G1 evidence

| G1 condition | Evidence | Result |
|---|---|---|
| Clean clone can bootstrap | Root `README.md`, exact package manager, frozen lockfile, `.env.example`, local dependency guide | PASS |
| API and worker are separate processes sharing packages | independent `apps/api` and `apps/worker` builds; runtime smoke below | PASS |
| Migration/check pipeline passes from zero | PGlite zero/prior-schema integration; checksum/sequence check; PostgreSQL CI double-run | PASS |
| CI has no production secret/provider dependency | deterministic model, development auth, synthetic local credentials, no repository secret reference | PASS |
| Prototype unchanged and excluded | workspace and architecture rules exclude `prototypes/`; final Prototype diff empty | PASS |
| Accessible shell on desktop and 390x844 | Playwright Chromium, axe and keyboard tests: 4/4 | PASS |

### Validation commands and observed results

- `pnpm check` — PASS
  - Prettier — PASS
  - ESLint — PASS
  - strict TypeScript across 15 production projects plus tooling — PASS
  - architecture boundary check — PASS
  - migration contract check — PASS (`1 migration`)
  - Vitest — PASS (`11 files`, `14 tests`)
  - all package/application builds — PASS
- `pnpm test:e2e` — PASS (`4 tests`)
  - desktop Chromium interaction + axe — PASS
  - desktop keyboard focus/activation — PASS
  - mobile 390x844 interaction + axe — PASS
  - mobile 390x844 keyboard focus/activation — PASS
- API process smoke — PASS
  - `GET /health` returned `200`
  - `x-request-id` present
  - `GET /v1/foundation` returned `productSemanticsStarted: false`
- worker process smoke — PASS
  - independent process started
  - startup log reported `product_semantics_started: false`
  - deterministic adapter composition verified by unit test
- `git diff --check` — PASS
- `git diff --name-only -- prototypes/simulora-experience` — empty

## 5. Local environment limitation

The current review host has no Docker, Podman, `psql` or local PostgreSQL service. Therefore local container startup and a local real-PostgreSQL execution could not be run on this machine.

This is not hidden as a successful container run. The following were validated instead:

- Compose YAML parses and is contract-tested for PostgreSQL 17 and MinIO loopback services;
- migration SQL executes from zero and against prior schema using PGlite;
- the real `pg` migration runner builds and its PostgreSQL 17 double-run is required by CI;
- no production or shared deployment was attempted.

An independent Reviewer with Docker may additionally run `pnpm local:up`, `pnpm db:migrate` twice and `pnpm local:down`. This environment-specific check does not change the IP-1 product boundary.

## 6. Explicit non-deliverables

The following have not started:

- IP-2 authoritative World or Continuity;
- Action received/provisional/confirmation/Commit behavior;
- live model provider integration;
- production identity provider or cloud storage selection;
- formal deployment, staging or production infrastructure;
- reuse or modification of approved Prototype behavior.

```text
IP-1 ENGINEERING FOUNDATION: COMPLETE
GATE G1: PASSED — READY FOR INDEPENDENT REVIEW
PRODUCT IMPLEMENTATION: IP-1 FOUNDATION ONLY
IP-2 WORLD / CONTINUITY: NOT STARTED
ACTION TRUTH: NOT STARTED
LIVE MODEL: NOT CONNECTED
FORMAL DEPLOYMENT: NOT STARTED
```
