# IP-1 Engineering Foundation Repair Report

**Status:** `G1 REPAIR COMPLETE — READY FOR INDEPENDENT REVIEW`

**Repair baseline:** `5463e47eb552972978071812c444045d01a15c12`

**Scope:** focused repair of the independent G1 review findings; no IP-2 product semantics.

## Findings addressed

| Review finding | Minimal repair | Evidence |
|---|---|---|
| B1 documented local bootstrap | `loadLocalEnvironment()` walks to repository root, loads `.env.local`, preserves explicit process values; API, worker and migration CLI call it | config unit test; README path now matches runtime behavior |
| I1 container dependency layout | API and worker Dockerfiles use `pnpm deploy --filter ... --prod --legacy /out` and copy the self-contained artifact | Compose contract test; both deploy artifacts independently started API and worker in the review host |
| I2 unsafe shared/production defaults | config rejects `preview`, `staging` and `production` until non-development adapters are authorized | config unit tests |
| I3 nested raw-content logging | recursive redaction covers objects, arrays, circular values, Error messages and sensitive keys | observability unit tests |
| I4 API/worker correlation gap | version-neutral correlation context and work envelope contracts; API validates/returns correlation header; worker preserves envelope context | API, worker and integration tests |
| I5 migration recovery evidence | migration runner is a package-owned build artifact; CI runs real PostgreSQL migration twice and explicit test-only checksum recovery rehearsal | migration verifier, CI workflow, PGlite zero/prior-schema tests |
| M1 threat/fault foundation | bounded threat notes plus deterministic one-shot `FaultInjector` alongside `FakeClock` | `IP1_SECURITY_AND_FAULT_NOTES.md`; testkit unit test |

## Validation after repair

- `pnpm install` — PASS; lockfile remains current.
- `pnpm format:check` — PASS.
- `pnpm lint` — PASS.
- `pnpm typecheck` — PASS across 15 workspace projects and root tooling.
- `pnpm architecture:check` — PASS.
- `pnpm migrations:check` — PASS.
- `pnpm test` — PASS (`12` files, `24` tests).
- `pnpm build` — PASS, including `packages/database` migration artifact.
- `pnpm test:e2e` — PASS (`4` desktop/mobile Chromium tests, axe and keyboard coverage).
- API deploy artifact smoke — PASS (`/health` 200, self-contained dependency layout).
- Worker deploy artifact smoke — PASS (independent process starts and stops).
- `git diff --check` — PASS.
- `git diff --name-only -- prototypes/simulora-experience` — empty.

## Environment boundary

This host still has no Docker, Podman, `psql` or local PostgreSQL service. Real PostgreSQL migration double-run, test-only recovery rehearsal and image execution are configured in CI and the deploy artifact layout was independently exercised through `pnpm deploy`; local container startup remains an environment check for a Docker-capable reviewer.

No production secret, live model provider, formal deployment, World, Continuity, Action Truth, database domain schema or Prototype behavior was introduced.

```text
G1 REPAIR: COMPLETE
READY FOR INDEPENDENT REVIEW: YES
IP-2: NOT STARTED
PRODUCT IMPLEMENTATION: IP-1 FOUNDATION ONLY
```
