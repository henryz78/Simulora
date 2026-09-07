# IP-5 / Gate G5 Evidence — Non-destructive Recovery

Status: `IP-5 IMPLEMENTATION COMPLETE / GATE G5 CANDIDATE / INDEPENDENT REVIEW REQUIRED`.

This record describes the exact production-code candidate at `a988051637fc15ab8cc29ad67c1e9ee0db55f967`. It does not approve G5 or authorize IP-6. The frozen Product, System and Experience documents and `prototypes/simulora-experience/` were not modified.

## 1. Implemented contract

- A Safe Point is an idempotent, owner-scoped label referencing an existing Commit. Deleting it soft-deletes the label only.
- A Branch fork atomically creates a separate Branch, `BRANCH_FORK` Commit, immutable copied State Revision, `BRANCH_FORKED` Event and lineage. It neither selects nor writes the source Branch.
- Selecting the current path updates the Continuity pointer only. It is serialized against new Action acknowledgement and is rejected while the current Branch has unresolved Actions, so pending work cannot disappear behind a path change.
- A Restore review is durable, owner-scoped and immutable. It binds source Commit, exact included/excluded sections, actual section-level before/after values, source/current hashes, digest, expiry and expected current head.
- Exact confirmation binds actor, proposal, digest and expected head. A stale review marks only the proposal stale and creates no Commit, State Revision, Event or head mutation.
- A successful Restore atomically appends one `RESTORE_COMMITTED` Commit, one immutable State Revision, one `STATE_RESTORED` Event, one Branch-head advance, projection invalidation and outbox entry. Existing history remains.
- Restore uses the frozen allow-list for world clock, locations, entities, character runtime state, facts, relationships, threads, objectives and resources. Current participation, interaction boundaries and custom/account-owned state are preserved.
- Correction remains a record-bound IP-4 command. Delete remains a separate protected lifecycle handoff, not an undo control and not an operation exposed by Recovery. V1 has no destructive rewind or Branch merge.
- Recovery is a contextual secondary surface. The existing server-owned pending Action ribbon remains available through Recovery navigation on desktop and 390×844 mobile.

## 2. Persistence and implementation map

| Layer | IP-5 addition |
|---|---|
| PostgreSQL | `0008_ip5_recovery.sql`: Branch lineage/idempotency, Recovery Points, immutable Restore proposals, exact confirmations and Restore Commit constraints/triggers |
| Domain | Explicit restorable-section allow-list and protected-state-preserving application |
| Contracts/application | Typed Recovery read and Safe Point, fork, path-selection, Restore-review and exact-confirmation commands |
| API | Owner-scoped Recovery routes composed through the existing World/Continuity service |
| Web | Contextual Recovery entry, Safe Point, separate Branch, exact Restore review, stale/unknown outcome language and operation boundaries |
| Tests | Domain, API, real PostgreSQL concurrency/authorization and desktop/mobile browser coverage |

PostgreSQL remains the only transactional truth store. Recovery does not introduce a second current-state representation.

## 3. Verification record

### Local

- Format, lint, all TypeScript checks, architecture check, eight-migration replay and `git diff --check`: PASS.
- Unit/contract/migration-compatible tests: `38/38` passed. The `42` real PostgreSQL tests were explicitly skipped because this Windows host has no configured PostgreSQL service; they are not counted as local database evidence.
- Complete production workspace build: PASS, including web, API and worker artifacts.
- Focused Recovery Playwright: `4/4` passed across desktop Chromium and 390×844.
- Full browser regression: `34/34` passed across both viewports.

### Exact GitHub CI

[Run 34164728232](https://github.com/henryz78/Simulora/actions/runs/34164728232), job `101873411397`, completed successfully on exact SHA `a988051637fc15ab8cc29ad67c1e9ee0db55f967`.

- Empty/prior PostgreSQL migration application plus ledger/recovery rehearsal: PASS with eight migrations.
- Explicit real PostgreSQL integration step: `42/42` passed in six suites; no database test was skipped.
- Full `pnpm check`: `80/80` passed in nineteen files; format, lint, all typechecks, architecture, migrations, complete build and built-worker runtime smoke passed.
- API and worker production container builds, API health and worker-ready smoke: PASS.
- Desktop Chromium plus 390×844 Playwright: `34/34` passed.

## 4. G5 acceptance evidence

| Requirement | Evidence |
|---|---|
| Safe Point is reference-only and delete-label preserves Commit/state/history | PostgreSQL test compares State Revision count and verifies referenced Commit after deletion |
| Branch fork preserves source and creates valid independent lineage | Concurrent idempotency test compares source bytes/head/Commit count and inspects fork Commit, State Revision and Event |
| Current-path selection does not hide a pending Action | PostgreSQL selection/ACK race proves only one may win; unresolved Action blocks switching; browser journey keeps Action ribbon visible |
| Restore review shows exact source/diff/scope/digest/head | Repository assertions plus browser review/reload journey |
| Restore is append-only and effective-once | Concurrent exact-confirmation test proves one new Commit/State Revision/Event and unchanged prior rows |
| Stale Restore writes no world mutation | PostgreSQL test advances the head, verifies conflict and unchanged Commit/State Revision/Event counts |
| Protected state and other Branches are excluded | Domain allow-list test and PostgreSQL resulting-state/source-isolation assertions |
| Authorization is account-bound | Cross-account read, Safe Point and Restore attempts are denied |
| Branch/Restore/Correction/Delete remain distinct | Separate API commands and Recovery copy/entry boundaries; no Delete-as-undo or Branch merge command exists |
| G1–G4 authority remains intact | All existing PostgreSQL, unit and browser regression suites passed in the same exact CI run |

Detailed cases are indexed in [IP-5 G5 Test Matrix](IP-5-G5-TEST-MATRIX.md).

## 5. Explicit exclusions

Not implemented or claimed: destructive rewind, Branch merge, Restore of participation/consent/ownership/usage/grants/exports, a general deletion flow, IP-6 participation/character authority, live model access, IP-7 World Studio production behavior, formal deployment or release readiness.

```text
IP-5 IMPLEMENTATION: COMPLETE
GATE G5: PENDING INDEPENDENT REVIEW
G5 EVIDENCE CANDIDATE: a988051637fc15ab8cc29ad67c1e9ee0db55f967
GITHUB CI: PASS
READY FOR INDEPENDENT G5 REVIEW: YES
IP-6: NOT STARTED
```
