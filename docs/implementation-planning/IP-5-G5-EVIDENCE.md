# IP-5 / Gate G5 Evidence — Non-destructive Recovery

Status: `IP-5 IMPLEMENTATION COMPLETE / GATE G5 RE-REVIEW CANDIDATE / INDEPENDENT RE-REVIEW REQUIRED`.

The original production candidate was `a988051637fc15ab8cc29ad67c1e9ee0db55f967`. Independent review returned `PASS WITH ISSUES` (`0 BLOCKER / 3 IMPORTANT / 1 MINOR`) and did not approve G5. The focused repair candidate is `f1ae65e2bae457afeba8544b4dae345dd3089ce5`. This record does not approve G5 or authorize IP-6. The frozen Product, System and Experience documents and `prototypes/simulora-experience/` were not modified.

## 1. Implemented contract

- A Safe Point is an idempotent, owner-scoped label referencing an existing Commit. Deleting it soft-deletes the label only.
- A Branch fork atomically creates a separate Branch, `BRANCH_FORK` Commit, immutable copied State Revision, `BRANCH_FORKED` Event and lineage. Its source may be any accessible Commit in the same Continuity, including a preserved non-current Branch. It neither selects nor writes the source Branch.
- Selecting the current path updates the Continuity pointer only. It is serialized against new Action acknowledgement and is rejected while the current Branch has unresolved Actions, so pending work cannot disappear behind a path change.
- A Restore review is durable, owner-scoped and immutable. It binds source Commit, exact included/excluded sections, actual section-level before/after values, source/current hashes, digest, expiry and expected current head.
- Exact confirmation binds actor, proposal, digest and expected head. It serializes against current-path selection on the Continuity row. A changed active Branch or stale head marks only the proposal stale and creates no Commit, State Revision, Event or head mutation.
- Restore-proposal status is owner-readable by proposal ID, including the resulting Commit ID after confirmation. A client that loses the confirmation response reconciles this durable result instead of claiming that truth stayed unchanged.
- A successful Restore atomically appends one `RESTORE_COMMITTED` Commit, one immutable State Revision, one `STATE_RESTORED` Event, one Branch-head advance, projection invalidation and outbox entry. Existing history remains.
- Restore uses the frozen allow-list for world clock, locations, entities, character runtime state, facts, relationships, threads, objectives and resources. Current participation, interaction boundaries and custom/account-owned state are preserved.
- Correction remains a record-bound IP-4 command. Delete remains a separate protected lifecycle handoff, not an undo control and not an operation exposed by Recovery. V1 has no destructive rewind or Branch merge.
- Recovery is a contextual secondary surface. The existing server-owned pending Action ribbon remains available through Recovery navigation on desktop and 390×844 mobile.

## 2. Persistence and implementation map

| Layer | IP-5 addition |
|---|---|
| PostgreSQL | `0008_ip5_recovery.sql`: Branch lineage/idempotency, Recovery Points, immutable Restore proposals, exact confirmations and Restore Commit constraints/triggers; `0009_ip5_gate_g5_repairs.sql`: active-path Restore invariant |
| Domain | Explicit restorable-section allow-list and protected-state-preserving application |
| Contracts/application | Typed Recovery read and Safe Point, fork, path-selection, Restore-review and exact-confirmation commands |
| API | Owner-scoped Recovery routes composed through the existing World/Continuity service |
| Web | Contextual Recovery entry, Safe Point, separate Branch, exact Restore review, stale/unknown outcome language and operation boundaries |
| Tests | Domain, API, real PostgreSQL concurrency/authorization and desktop/mobile browser coverage |

PostgreSQL remains the only transactional truth store. Recovery does not introduce a second current-state representation.

## 3. Original candidate verification record

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

### Focused repair candidate

[Run 34168464150](https://github.com/henryz78/Simulora/actions/runs/34168464150), job `101884063197`, completed successfully on exact SHA `f1ae65e2bae457afeba8544b4dae345dd3089ce5`.

- Empty/prior PostgreSQL migration and ledger/recovery rehearsal: PASS with nine migrations.
- Explicit real PostgreSQL integration step: `43/43` passed in six suites; no database test was skipped.
- Full `pnpm check`: `81/81` passed in nineteen files; format, lint, all typechecks, architecture, migrations, complete build and built-worker runtime smoke passed.
- API and worker production container builds, API health and worker-ready smoke: PASS.
- Desktop Chromium plus 390×844 Playwright: `36/36` passed, including durable lost-response Restore reconciliation.
- Local focused Recovery Playwright: `6/6` across desktop and 390×844. Local full browser rerun: `36/36`.

## 4. Independent review and repair chain

The first independent review of `a988051` found no blocker and preserved the IP-5 design, but required four focused repairs before IP-6 readiness:

1. Restore confirmation did not serialize with current-path selection.
2. A lost Restore confirmation response could be described as unchanged even after a durable Commit.
3. Branch fork incorrectly rejected a source Commit on a non-current Branch in the same Continuity.
4. Concurrent identical Restore review creation could expose a uniqueness race.

The repair at `1d27d51731673367a5c41eb0691ab4fba1dd3eee`, with its corrected direct-invariant test at `f1ae65e2bae457afeba8544b4dae345dd3089ce5`, addresses each at the shared boundary:

- Continuity-row locking and a database trigger serialize and enforce active-path Restore.
- Owner-scoped proposal-result lookup lets the UI distinguish confirmed, active/retryable, stale and unknown outcomes after interruption.
- Fork validates same-Continuity access while permitting a source from a preserved inactive Branch; source head/bytes remain unchanged.
- `ON CONFLICT` converges concurrent identical Restore reviews on one proposal.

The same independent Reviewer must re-review the repair and search for additional issues. Green CI is evidence, not G5 approval.

## 5. G5 acceptance evidence

| Requirement | Evidence |
|---|---|
| Safe Point is reference-only and delete-label preserves Commit/state/history | PostgreSQL test compares State Revision count and verifies referenced Commit after deletion |
| Branch fork preserves source and creates valid independent lineage | Concurrent idempotency test compares source bytes/head/Commit count and inspects fork Commit, State Revision and Event |
| Current-path selection does not hide a pending Action | PostgreSQL selection/ACK race proves only one may win; unresolved Action blocks switching; browser journey keeps Action ribbon visible |
| Restore review shows exact source/diff/scope/digest/head | Repository assertions plus browser review/reload journey |
| Restore is append-only and effective-once | Concurrent exact-confirmation test proves one new Commit/State Revision/Event and unchanged prior rows |
| Stale Restore writes no world mutation | PostgreSQL test advances the head, verifies conflict and unchanged Commit/State Revision/Event counts |
| Restore/current-path race is serialized | Deterministic PostgreSQL lock test selects another Branch while confirmation is blocked, then proves stale status and zero old-Branch mutation |
| Lost confirmation response is reconciled | Owner-scoped durable proposal/result API test plus desktop/mobile response-loss browser journey |
| Non-current source Branch remains forkable | PostgreSQL test forks from a Safe Point on the preserved original after selecting another current Branch and compares original head/hash |
| Concurrent identical Restore review converges | Real PostgreSQL concurrent prepare test proves both calls return one proposal ID |
| Protected state and other Branches are excluded | Domain allow-list test and PostgreSQL resulting-state/source-isolation assertions |
| Authorization is account-bound | Cross-account read, Safe Point and Restore attempts are denied |
| Branch/Restore/Correction/Delete remain distinct | Separate API commands and Recovery copy/entry boundaries; no Delete-as-undo or Branch merge command exists |
| G1–G4 authority remains intact | All existing PostgreSQL, unit and browser regression suites passed in the same exact CI run |

Detailed cases are indexed in [IP-5 G5 Test Matrix](IP-5-G5-TEST-MATRIX.md).

## 6. Explicit exclusions

Not implemented or claimed: destructive rewind, Branch merge, Restore of participation/consent/ownership/usage/grants/exports, a general deletion flow, IP-6 participation/character authority, live model access, IP-7 World Studio production behavior, formal deployment or release readiness.

```text
IP-5 IMPLEMENTATION: COMPLETE
GATE G5: PENDING INDEPENDENT RE-REVIEW
G5 REPAIR CANDIDATE: f1ae65e2bae457afeba8544b4dae345dd3089ce5
GITHUB CI: PASS
READY FOR INDEPENDENT G5 RE-REVIEW: YES
IP-6: NOT STARTED
```
