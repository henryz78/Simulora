# IP-4 / Gate G4 Evidence — Return, Continuity and Correction

Status: `IMPLEMENTATION / VERIFICATION IN PROGRESS — G4 NOT YET APPROVED`.

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
| Real PostgreSQL, migration upgrade and concurrency | Pending new CI; local skips are not evidence |
| API/worker production build/runtime/container smoke | Full build and built-worker runtime PASS locally; real containers remain pending new CI |
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

## Explicit limits / non-claims

- Fact correction/removal is implemented here; generalized relationship, note, knowledge or permission editing is not claimed.
- The deterministic adapter updates an existing eligible shared active fact. No eligible fact produces a named pre-ACK rejection with no Action/job; it does not fabricate new canon. An already accepted unsupported job requires an explicit recoverable outcome. This is an adapter limitation, not a new general product rule.
- No live model provider, character autonomy, participation-contract editing, Branch/Restore/Delete recovery, World Studio/revision adoption, formal deployment or production-scale readiness claim.
- No durable/offline browser-storage guarantee; acknowledgement and confirmed state belong to PostgreSQL.
- Automated accessibility and keyboard checks do not substitute for a complete manual assistive-technology/platform matrix. Any unperformed manual screen-reader check must remain explicitly unverified.
- G4 is not self-approved by the implementation agents or by this report. Independent review and actual new CI evidence are required before any next phase.
