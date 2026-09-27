# WD-1a Shared World: Implementation Report

**Date:** 2026-09-27 · **Contract:** [WD-1a contract](WD-1A-SHARED-WORLD-CONTRACT.md)
· **Decision:** [WD-1](WD-1-PROPOSED-DECISIONS.md) W1 A and W2 A · **Approved
SHA:** `838b36f` · **Evidence:** exact-SHA CI `36345541672` success (verified by
the owner) · **Review:** independent Reviewer (Sonnet 5) `PASS WITH ISSUES`
(0B/2I/1M), then `PASS` (0/0/0) on the repair. **WD-1a CLOSED.**

## 1. Commits

| Commit | Kind | What | CI |
|---|---|---|---|
| `9aba5d6` | docs | Decisions and contract | success |
| `70f5ea0` | behavior | Migration 0055, app parity, `ADD_FACT`, prompt v9, UI, tests | `36344369121` success |
| `64b68c9` | behavior (prompt) and tests | Review repair: upgrade case, no-effect case, unbiased rewrite example | `36345296565` failure (fixture, §4) |
| `838b36f` | test | Fixture repair for the upgrade case | `36345541672` success |

## 2. What changed

For Actions created after migration `0055`, read from its immutable ledger row:

- **The model sees the whole shared world.**
  - Every ACTIVE SHARED fact is in the generation context, the manifest and the
    evidence, identically in the application and in SQL: the RE-2 context,
    the generation evidence and the no-effect evidence.
  - A Character still adds only the private facts it knows.
  - A World response sees no private fact.
- **A rewrite may target any shared fact.** It is still L3.
- **`ADD_FACT`.** A fact change may instead record one new SHARED fact at
  **L2**. Its id is server-derived and its provenance is fixed. Its causes must
  be in the context, and its text passes the agency and disclosure guards.
  SQL binds:
  - the proposal;
  - the resulting state;
  - exactly one `FACT_ADDED` Event.

  Quick play applies it, and Undo removes it again through Restore. The play
  page shows it as "New in the world".
- **Prompt version 9.**
  - Every shared fact is listed.
  - `ADD_FACT` is preferred over a rewrite.
  - Unnamed people in the scene may speak in a World response.

Earlier Actions and pending proposals keep their evidence.

## 3. Evidence

CI `36345541672` at `838b36f`: every job passed, including:

- the real-PG `wd1a-shared-world` suite (5 cases):
  - context contents for World and Character Actions;
  - response-only evidence;
  - `ADD_FACT` commit, Event and Restore;
  - a non-lead L3 rewrite;
  - forged raw proposals refused beside a control that seals;
- the migration-upgrade case: a proposal sealed before 0055 confirms after it,
  and Actions submitted before 0055 keep the lead-fact manifest while new ones
  see both shared facts;
- domain and prompt unit tests;
- the browser case.

## 4. Independent Review

**First round on `70f5ea0`, `PASS WITH ISSUES` (0B/2I/1M).** The Reviewer
diffed every copied SQL function against its live predecessor and found only
the marked edits. It confirmed app and SQL parity, the epoch, `ADD_FACT`'s L2
safety, knowledge containment, and ADR-018's L3 list intact.

| # | Finding | Resolution |
|---|---|---|
| I1 | No upgrade case with more than one shared fact, so the epoch was not discriminated. | `64b68c9`: 0054→0055 case on a two-fact world. |
| I2 | The no-effect path's new branch was not exercised with several shared facts. | `64b68c9`: World and Character response-only cases. |
| M1 | Prompt v9's rewrite example named the lead fact. | `64b68c9`: placeholders name "the chosen SHARED fact". |

**Re-review of `64b68c9`: `PASS` (0/0/0).** The Reviewer traced
COMPLETED_NO_EFFECT to the dialogue-integrity trigger that runs the SQL
no-effect evidence check.

**CI repair.** The new upgrade case failed at `64b68c9` before the upgrade.
Its second shared fact repeated the seed's starting situation. Before 0055
that fact is excluded from a World response, and a context that quotes an
excluded fact fails closed (`AUTHORIZED_CONTEXT_UNAVAILABLE`). This was
reproduced on a local 0054-only database. `838b36f` uses a fact the World text
does not quote (test only).

**Found on the way (pre-existing, fixed for new Actions).** Before 0055, an
unaddressed Action failed closed whenever the World's premise or starting
situation quoted a non-lead shared fact. Actions after 0055 include every
shared fact, so this no longer happens for them.

## 5. Not claimed

- Human enjoyment of `ADD_FACT`. An Agent-operated live check with `grok-4.7` passed
  ([Track B §3.8](TRACK-B-LOCAL-LIVE-PLAY-REPORT.md)).
- Human enjoyment; beta, launch or production live model use.
- WD-1b (secrets and "Let the story decide"), which is not started.
