# IP-2 Gate G2 Evidence — Authoritative World and Continuity Spine

**Status:** `IP-2 IMPLEMENTATION: COMPLETE / GATE G2: READY FOR REVIEW`

**Evidence commit:** recorded with the implementation commit that accompanies this report.

**Scope:** This slice establishes the authoritative World, World Draft, immutable World Revision, Continuity, Branch, initial Commit and State Revision spine. It intentionally does not implement Action Truth, model generation, Recovery, Correction, Character behavior, World Studio, durable background jobs or formal deployment.

## 1. Implementation summary

- Added a pure domain package for the original `Lantern Reach` development seed, structured World validation, stable-ID reference checks, participation contracts and canonical SHA-256 content hashes.
- Added PostgreSQL migrations `0002_authoritative_world_continuity.sql`, `0003_ip2_active_branch_hardening.sql` and `0004_ip2_branch_reference_hardening.sql` for accounts, Worlds, drafts, validation runs, immutable revisions, Continuities, Branches, Commits, State Revisions and Domain Events.
- Added database invariants for immutable historical records, same-Branch Commit/State heads, active Branch/Continuity requirements and revision/hash uniqueness.
- Added `AuthoritativeWorldRepository` with adult eligibility checks, owner authorization, optimistic draft row versions, validation-before-revision, atomic Continuity initialization and authoritative current-state reads.
- Added application orchestration through `WorldContinuityService` and versioned contracts for World, Draft, Revision, Continuity creation and state reads.
- Added API routes for World creation, Draft update, Revision creation, Continuity start and current-state reads. No Action endpoints were added.
- Replaced the IP-1 placeholder web page with a read-only responsive World shell that reads state from the API; it has loading, not-found, failure and retry states and no client fixture authority.
- Kept `prototypes/simulora-experience/` untouched and outside the production package graph.
- Bundled workspace packages into the API and worker runtime entry points so production container artifacts do not depend on workspace package links; synchronized the lockfile and declared the external runtime dependencies required by the bundles.

## 2. G2 contract evidence

| G2 requirement | Evidence |
|---|---|
| Synthetic user can create a structured Draft | `AuthoritativeWorldRepository.createWorld`, `POST /v1/worlds`, domain schema and PostgreSQL integration test |
| Invalid or stale Draft is not silently published | `worldDocumentSchema`, validation run, optimistic `row_version`, `409` stale-draft and `422` not-playable responses |
| Playable immutable Revision is created after validation | `createRevision` transaction, `world_revisions_immutable` trigger, content hash and revision-number uniqueness |
| Continuity initialization is atomic | One transaction inserts Continuity, Branch, Commit, State Revision and Domain Event, then activates both heads |
| Initial Branch head is valid | Deferred foreign keys plus `branch_head_integrity` and `continuity_active_branch_integrity` constraint triggers |
| Existing Continuity remains pinned | Integration test creates Revision 2 and verifies an existing Continuity still reads Revision 1 |
| State survives repository/process re-instantiation | Integration test constructs a new repository instance and reloads the same Continuity head |
| Six participation combinations round-trip | Domain test and PostgreSQL integration test cover Direct/Guided/World-active × Open-ended/Goal-framed |
| Current state is PostgreSQL-authoritative | API reads through repository; web has no authoritative local fixture and refresh re-reads the route |
| Scope boundary is explicit | IP-2 reads are owner-authorized; code documents that future shared projections must filter account/private scopes at the authorization boundary |
| Prototype remains separate | No production package imports prototype source, routes or fixtures |

## 3. Verification run

The following checks passed on the final working tree:

- `pnpm format:check`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm architecture:check`
- `pnpm migrations:check` — migration sequence and IP-2 metadata contract passed
- `pnpm test` — **13 test files passed, 30 tests passed**; the four PostgreSQL repository tests are skipped when `SIMULORA_DATABASE_URL` is not available locally
- `pnpm build` — all production packages and the web/API/worker entry points built successfully
- `pnpm test:e2e` — **10 passed** across desktop Chromium and 390×844 mobile
- `git diff --check`

The post-G2 container packaging repair also runs a local `pnpm deploy --prod --legacy` reproduction for the API and worker artifacts. Both bundles pass `node --check`, contain no `@simulora/*` runtime imports, and include their external runtime dependencies. Docker itself is not installed on the local Windows host, so the GitHub Actions container smoke job remains the authoritative image-level verification.

The active-Branch invariant was hardened in migrations `0003_ip2_active_branch_hardening.sql` and `0004_ip2_branch_reference_hardening.sql` and is covered by the PostgreSQL repository integration test. An active Continuity now requires an owned Branch with `ACTIVE` status and non-null Commit/State Revision heads; Branch-side updates cannot demote or detach a referenced active Branch.

The PostgreSQL repository suite is configured to run when `SIMULORA_DATABASE_URL` is set and is exercised by CI against PostgreSQL 17. The local machine used for this evidence did not have a PostgreSQL server, so those four tests were not falsely reported as passed.

The E2E failure/retry fixture was made deterministic for React StrictMode: both possible initial mount reads return a 503, and the explicit retry returns the authoritative fixture. This changes test reliability only; it does not change product behavior.

## 4. API and state boundary

The IP-2 API exposes only these product-semantic operations:

- `POST /v1/worlds`
- `PUT /v1/worlds/:worldId/draft`
- `POST /v1/worlds/:worldId/revisions`
- `POST /v1/world-revisions/:worldRevisionId/continuities`
- `GET /v1/continuities/:continuityId/state`

The read contract includes the pinned World Revision, active Branch and current Commit/State Revision identifiers, state hash, participation contract, current World facts, characters and open threads. Generated prose, Action proposals, confirmation, Commit races and model output are intentionally absent until IP-3.

## 5. Known limitations / deferred work

- Local verification did not include a live PostgreSQL server; CI must run the configured PostgreSQL integration suite before merging.
- Validation findings currently roll back with an invalid `createRevision` transaction; durable authoring-validation history is deferred to later authoring hardening.
- The current IP-2 owner read returns the owner-authorized state. Shared/guest projections and their privacy filters are later work, not an unimplemented claim in this slice.
- The development auth adapter is synthetic and is not production identity verification.
- The web shell is deliberately read-only. It does not imply that Action, model, recovery or authoring behavior exists.

## 6. Explicit non-goals for G2

No Action Truth lifecycle, proposal/confirmation/Commit path, live model provider, worker job processing, SSE, Recovery, Restore, Branch fork UI, Correction, Character autonomy, World Studio, production persistence policy, database deployment or Prototype change was started by this slice.

## 7. Gate disposition

`IP-2 IMPLEMENTATION: COMPLETE`

`GATE G2: READY FOR INDEPENDENT REVIEW`

`IP-3 ACTION TRUTH: NOT STARTED`

`PRODUCT IMPLEMENTATION: IP-2 ONLY`
