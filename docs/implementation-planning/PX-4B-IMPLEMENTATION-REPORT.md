# PX-4b Implementation Report

**Date:** 2026-10-03 · **Status:** `CLOSED`. The design, owner decisions and successor ADRs
are in the [PX-4 World Freedom Contract](PX-4-WORLD-FREEDOM-CONTRACT.md), section
"PX-4b design".

## What it does

Owner decision D5: one story turn may make up to 4 changes.

- **v2 candidate.** Under "Let the story decide", after migration 0058, the model may return
  `schemaVersion: 2` with 2–4 closed operations. One change is still returned as v1.
- **Combination rules**, the same in TypeScript and SQL:
  - each operation has its own target (fact, relationship, thread, Character);
  - no operation cites a fact that another operation rewrites or reveals;
  - at most one `TRANSFORM_FAILURE`, and only beside `ADD_FACT`;
  - at most one move;
  - no `NO_WORLD_EFFECT`.
- **Meaning.** Each operation is validated as the v1 operation it is, and the turn's
  impact is the highest of its parts. New facts and threads get derived ids
  (`fact.<action>.<n>`, `thread.<action>.<n>`). The deltas apply in order, then the clock
  advances once.
- **Events.** `domain_events` gains an `ordinal`, so a Commit holds one typed Event per
  change, in order. Successor 0059 orders the committed outcomes the model sees by ordinal.
- **Prompt v12** asks for each lasting change, up to 4, in the v2 shape.
- **Web.** Strict-mode review and the committed turn line list every change. Direct play
  and Undo are unchanged.

## Unchanged

- The v1 validators, the L2/L3 table, the agency guard and knowledge boundaries.
- Actions created before 0058, and every v1 proposal.
- Expected-head fencing, idempotency, Restore, correction and removal.

## Commits

**Behavior commits:**

- `7233013`: migration 0058, application parity, prompt v12 and the web list.
- `59a6b8a`: review fixes, successor 0059 and the SQL-gate tests.
- `ee33742`: test only. It types one variable in the forgery helper so the tools typecheck
  passes. It changes no assertion.

**Documentation commits:** `2b13b0c`, `53a1dc5`, `94c7cbf`, `3dafed2`, `9bc04f3` (design);
`35afc85`, `84ed509` and this closure.

## Review

The Reviewer was Sonnet 5.5, read-only.

1. **Design Review:** `DESIGN PASS` after two rounds of changes. The contract records them.
2. **Code Review of `7233013`: `PASS WITH ISSUES` (0B/1I/5M).**
   - **I-1.** The SQL combination gates and the Commit's Event check had no negative tests.
     `59a6b8a` adds real-PostgreSQL forgeries, each beside a passing control:
     - stored v2 turns that break each combination rule;
     - Commits whose Event inserts are rewritten: a missing Event, a wrong ordinal, a base
       thread id.
   - **M-1.** The TB-1 committed outcomes were not ordered by ordinal. Successor 0059
     orders them. Earlier Commits all have ordinal 1, so their order and digests are
     unchanged.
   - **M-2 to M-5** are accepted and recorded in the contract: rollout order, the cap set in
     two places, the validation cost, and the inner functions accepting virtual parts.
3. **Focused re-review of `59a6b8a`: `PASS` (0B/0I/0M).**

`ee33742` came after the re-review. It is a one-line type annotation in a test file, and
it was not reviewed.

## Evidence

- **Approved behavior SHA:** `59a6b8a`.
- **CI:** run `37183431146` on `ee33742` succeeded, with real PostgreSQL and the full
  browser suite. The runs on `35afc85` and `84ed509` failed only at the tools typecheck of
  the new test file. `ee33742` fixes that.
- **Local runs (not CI evidence):**
  - PGlite `px4b-multi-change` 7/7, and the earlier suites 45/45 and 31/31;
  - domain and gateway 76/76;
  - desktop and mobile e2e 112/112;
  - tsc (both configs), eslint and the migration check are clean.

## Not claimed

- There is no upgrade test that queues an Action before 0058 and processes it after.
- No human play-test of PX-4a or PX-4b yet. Whether 4 changes is the right cap is a
  play-test question.
- No provider approval, beta, launch or production live model.
