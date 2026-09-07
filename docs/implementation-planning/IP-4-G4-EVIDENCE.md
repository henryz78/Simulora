# IP-4 / Gate G4 Evidence — Return, Continuity and Correction

Status: `IP-4 IMPLEMENTATION: COMPLETE / GATE G4: PASSED`.

This document records the production IP-4 vertical slice. It does not modify the frozen Prototype or approve IP-5. The scope and acceptance map are in [Execution Plan](IP-4-EXECUTION-PLAN.md) and [Test Matrix](IP-4-G4-TEST-MATRIX.md).

## Starting baseline and authority

- Development branch: `main`.
- Starting approved G3 implementation: `7985471a9965ee8fea2f04354230d3fd9b5602aa`.
- First IP-4 candidate implementation: `72028315f05e69f21e660e70573cf7b983dbd166`.
- Its [G3 CI run](https://github.com/henryz78/Simulora/actions/runs/33647981503) and independent review established readiness for IP-4. They are not evidence that the new IP-4 code passes.
- Product, System Design, Experience Freeze and the approved Implementation Plan remain binding. WorldOS research is not a requirement source.
- Main Agent owns planning, integration decisions, evidence and Git/CI coordination. The user-requested `gpt-5.6-luna / max` agents implement backend, frontend and adversarial tests. A separate read-only Reviewer has not authored their code.

## Implemented path under verification

```text
Authoritative Branch head
  → Return orientation (derived, source-head labeled)
  → Continuity category → exact fact / recorded-change explanation
  → direct correction or removal proposal
  → exact user confirmation (actor + digest + expected head)
  → one atomic Commit / State Revision / Event / History / head advance
  → stale projections invalidated and rebuilt
  → next participation uses eligible current canon
```

### Authority and persistence

- Migration `0006_ip4_return_continuity.sql` adds direct correction/removal operation support, event provenance metadata and rebuildable Return projections. Earlier migrations and immutable World/State/Commit/history remain intact.
- Direct correction prepares a durable Action and exact proposal without pretending to call a model. A direct proposal has no Generation Attempt; ordinary participation still uses the G3 worker/generation path.
- Exact confirmation reuses the existing transactional Action path. Pending/proposed text cannot become current truth before a Commit. An older pending participation Action remains separate and cannot confirm against a head advanced by correction.
- A corrected fact retains its stable identity; earlier versions are identified through their immutable State Revision/Commit history. Removal retains a tombstone and history, while excluding the fact from active current use. No destructive rewind or history deletion is introduced.
- Correction is restricted to the selected fact statement in its existing scope. Removal changes that fact's current-use lifecycle. Neither operation changes World clock, unrelated facts, characters, participation axes or the pinned World Revision.

### Projections and scope

- Return contains a bounded recent-recorded-change view, not a cross-device last-seen/unread tracker. Source freshness is distinct from whether a user previously saw a change.
- Return/Trace/explanation read server-owned data and carry source/current head metadata. A stale projection is not authoritative. A missing summary is not evidence of no changes.
- Trace pages whole Commits with all associated events. Legacy event payloads and migration defaults cannot widen the actual fact scope or replace its real source Commit.
- Owner access to a private fact does not automatically grant a character or generation task that knowledge. The current deterministic gateway receives only its selected eligible shared active fact; its context manifest must describe the material actually supplied. Candidate validation enforces the same authorized target set.
- Explanation does not expose raw prompts, hidden context, provider reasoning or private content from another account. User explanation and model context are separate authorized projections.

### Frontend integration

- World, Return, global Continuity, fact explanation, Context and Action/correction review share one Continuity-scoped client layout and server Action recovery.
- Local route/form state is not truth or durable acknowledgement. Correction review and older unresolved participation have distinct Action identities.
- A confirmed Commit triggers an authoritative refresh. Network ambiguity must remain an unknown/recoverable outcome, not a false claim that the world changed or did not change.
- Desktop and 390×844 use the same global category → contextual fact model. Production routes do not import Prototype OBS/fixture navigation or Manus assets.

## Verification record

The Main Agent ran the integrated `pnpm check` to completion (exit 0): format, lint, all workspace/tools typechecks, architecture boundaries, six migrations, unit/contract tests, full workspace build and built-worker startup/shutdown. Result: **37 tests passed; 36 PostgreSQL tests explicitly skipped** because no local PostgreSQL server is configured. The skips comprise G2 (4), G3 Action (8), G3 lease/fencing (11), G4 repository/API (6) and G4 adversarial (7). These are not database passes.

Exact commit, new CI run and independent decision remain pending. No G4 PASS is claimed by the local result.

| Evidence layer | Current status |
|---|---|
| Targeted backend typecheck / architecture / migration smoke | Passed; also verified in integrated `pnpm check` |
| New adversarial test file lint/typecheck | Passed; PostgreSQL tests skipped locally because no configured server |
| Full `pnpm check` | PASS, exit 0; 37 tests passed / 36 PostgreSQL tests skipped locally |
| Desktop + 390×844 `pnpm test:e2e` | Frontend implementer: 24 passed, 37.4s, exit 0; separate test-agent rerun: 24 passed, 14.4s, exit 0 |
| Real PostgreSQL, migration upgrade and concurrency | PASS on `f521937` CI: 36/36 PostgreSQL tests, none skipped; migration ledger/recovery rehearsal PASS |
| API/worker production build/runtime/container smoke | PASS locally and in `f521937` CI, including both real smoke containers |
| Final diff/scope check | `git diff --check` PASS; no frozen Product/System/Experience/Prototype or lockfile changes |
| Independent exact-baseline G4 review | Pending |

Test sources:

- `tests/integration/ip4-return-continuity.test.ts`: real repository/API path, direct operations, state/history invariants, stale pending participation and no-eligible-fact handling.
- `tests/integration/ip4-adversarial.test.ts`: multi-event pagination, legacy provenance, cross-account denial, private/removed candidate attacks, truthful context manifest, recent changes and projection freshness.
- `tests/e2e/ip4-continuity.spec.ts`: responsive cross-surface flows and failure semantics using deterministic HTTP fixtures.
- Existing G2/G3 tests remain mandatory regressions. Browser fixtures do not prove database durability; PostgreSQL tests do not prove usable mobile interaction.

Frontend walkthrough evidence includes pointer paths on desktop/390×844, Tab focus, Escape, browser Back, refresh recovery and automated axe checks. The implementer also inspected the desktop application homepage through CUA: meaningful accessibility-tree content, no Vite error overlay and no console errors. The agent-browser CLI was unavailable; CUA and Playwright provided the fallback. **A real screen reader was not tested**; accessibility-tree/keyboard inspection is not described as screen-reader certification. Owned ports 4173/4174 were released after that walkthrough.

### First real PostgreSQL CI — failed test assertion

The [first IP-4 CI run](https://github.com/henryz78/Simulora/actions/runs/33712870949), job `100515882637`, tested `72028315f05e69f21e660e70573cf7b983dbd166`. Empty/prior migration verification passed. All 36 PostgreSQL tests actually ran: **35 passed, 1 failed** (none skipped).

The failure was `ip4-adversarial.test.ts`'s corrected-context assertion. It captured the entire generator target object but compared it with a two-field object using exact equality. The received ID and corrected statement matched; the object also contained the legitimate `SHARED` scope, `ACTIVE` lifecycle and direct-correction provenance. The original test author corrected the comparison to `toMatchObject`, explicitly retaining the current ID/text, `SHARED`, `ACTIVE` and direct-correction provenance assertions. No production code or test was removed. The repaired file passed format, lint and tools typecheck. Later assertions in that failed test still require actual PostgreSQL execution; they are not counted as proved by the matching fields.

G2's four tests, G3's eight Action and eleven lease/fencing tests, all six G4 repository/API tests and six of seven adversarial tests passed in this run. Full quality/build, container smoke and CI browser steps were **skipped after the failure**, not passed. A new complete CI run is required after the test repair. This failed run remains part of the evidence chain.

### Complete CI after assertion repair

The [subsequent CI run](https://github.com/henryz78/Simulora/actions/runs/33713340735), job `100517280172`, passed on `f521937bf8d411382a6090d77b14a1cb3884d950`. The production code tree is unchanged from `72028315`; the intervening commit changes only the test assertion and this evidence record.

The Main Agent inspected the job's actual logs, not only its green badge:

- PostgreSQL migration ledger and recovery rehearsal: PASS.
- Explicit `pnpm test:postgres`: **36 passed / 5 files**, no skipped tests.
- Full `pnpm check`: format, lint, all typechecks, architecture, six migrations, **73 passed / 18 files**, complete workspace build and worker runtime startup/shutdown: PASS.
- Built API and worker containers: PASS.
- Desktop Chromium and 390×844 Playwright: **24 passed (59.9s)**, no skipped tests.

This closes the failed assertion/CI item. It does not preempt the independent G4 review or a separately requested check of frontend SSE subscription stability. Any subsequent production fix requires its own validation; this CI result is scoped to `f521937`.

### Focused G3 regression repair — stable pending SSE subscriptions

The Main Agent's integration inspection raised a potential subscription loop in the new shared pending-Action provider. The frontend owner reproduced it with a controlled EventSource in a browser: identical `ACKNOWLEDGED` events caused new Action/array identities, which recreated the effect and opened **37 connections** in the observation window. The earlier fixture tests did not exercise this replay-driven lifecycle.

The minimal repair keys the subscription effect by stable Action ID/events URL primitives. Its callbacks read the latest pending objects through a ref. Repeated payload objects no longer recreate the subscription; pending membership/URL changes still do, and polling, cancellation, retry and terminal-state refresh remain in place. No backend or Action authority contract changed.

The new browser regression passed on desktop and 390×844 (**2 passed, 7.8s, exit 0**), asserting no reopen beyond the permitted React StrictMode baseline. Frontend typecheck, targeted lint/format and `git diff --check` passed. This controlled EventSource test proves subscription stability, not a new claim of native transport certification; existing PostgreSQL progress-cursor/SSE and browser polling regressions remain required. The repair requires a new complete CI run and independent review.

### Complete CI after SSE repair

The [SSE-repair CI run](https://github.com/henryz78/Simulora/actions/runs/33713970356), job `100519152227`, passed on **`031efb8faa9e5368025e2dead58e0f68560618a2`**. The Main Agent inspected the actual job log:

- Real PostgreSQL: **36/36 passed**, five suites, no skips.
- Full quality check: **73/73 passed**, eighteen files; format/lint/typecheck, architecture, six migrations, complete build and runtime smoke passed.
- PostgreSQL migration ledger/recovery rehearsal and both API/worker smoke containers passed.
- Desktop/390×844: **26/26 passed (1.1m)**, including the new same-status subscription test on both viewports.

This is the current validated production-code baseline. Independent G4 approval remains pending; green CI alone is not its substitute.

## Explicit limits / non-claims

- Fact correction/removal is implemented here; generalized relationship, note, knowledge or permission editing is not claimed.
- The deterministic adapter updates an existing eligible shared active fact. No eligible fact produces a named pre-ACK rejection with no Action/job; it does not fabricate new canon. An already accepted unsupported job requires an explicit recoverable outcome. This is an adapter limitation, not a new general product rule.
- No live model provider, character autonomy, participation-contract editing, Branch/Restore/Delete recovery, World Studio/revision adoption, formal deployment or production-scale readiness claim.
- No durable/offline browser-storage guarantee; acknowledgement and confirmed state belong to PostgreSQL.
- Automated accessibility and keyboard checks do not substitute for a complete manual assistive-technology/platform matrix. Any unperformed manual screen-reader check must remain explicitly unverified.
- The earlier statement that G4 was not self-approved remains historically accurate. Final independent review and actual CI evidence are recorded below; Gate G4 is now passed. This does not itself authorize IP-5.

## Final independent G4 review and disposition

The following chain is intentionally retained rather than rewriting earlier evidence as though the first candidate passed.

| Baseline | Result | Disposition |
|---|---|---|
| `031efb8faa9e5368025e2dead58e0f68560618a2` | Independent review: `FAIL` with `0 BLOCKER / 4 IMPORTANT / 1 MINOR` | IP-5 withheld. Findings covered Return honesty, legacy private-fact provenance, an Action-detail request loop, Context Manifest/gateway parity and projection Branch/head integrity. |
| `f15bc5676d0e391ca8bb098c9cf6706404c939d6` | Focused repairs and [CI run 34055212308](https://github.com/henryz78/Simulora/actions/runs/34055212308) passed | Independent re-review closed the original five findings but retained one IMPORTANT: a `STALE` projection with an empty recent-change list was shown as an honest empty state rather than unavailable history. |
| `75bda8ff37f4238fdc727fc9a325500dc8f26df5` | Final one-condition UI repair and [CI run 34058792679](https://github.com/henryz78/Simulora/actions/runs/34058792679) passed | The same independent reviewer verified the prior residual, inspected the exact CI run, found no new issue and returned `GATE G4: PASS`. |

### Final repair

The final repair makes every non-`FRESH` projection with an empty recent-change list render the honest unavailable-history state. A `FRESH` projection with no changes retains the genuine empty state. The regression covers the exact `STALE + recentChanges: [] + projectionUpdatedAt` path on desktop and 390x844 mobile. It changes no authoritative data, Commit, correction, Action or prototype behavior.

### Exact final CI evidence

[Run 34058792679](https://github.com/henryz78/Simulora/actions/runs/34058792679), job `101555462267`, completed successfully on exact SHA `75bda8ff37f4238fdc727fc9a325500dc8f26df5`.

- Empty/prior-schema migration checks and seven-migration ledger/recovery rehearsal: PASS.
- Real PostgreSQL suites: `37/37` tests in five files, with no PostgreSQL tests skipped.
- Full `pnpm check`: format, lint, all typechecks, architecture and migration checks, complete build and built-worker runtime smoke: `74/74` tests in eighteen files, PASS.
- API and worker production container builds plus API health and worker-ready smoke: PASS.
- Desktop Chromium and 390x844 Playwright: `30/30`, PASS, including stale/missing Return, SSE stability and Action-detail cadence regressions.

### Gate decision

```text
GATE G4: PASS
BLOCKERS: 0
IMPORTANT: 0
MINOR: 0
READY FOR IP-5 AUTHORIZATION: YES
IP-5 RECOVERY: NOT STARTED
```
