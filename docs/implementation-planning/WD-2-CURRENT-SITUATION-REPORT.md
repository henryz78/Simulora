# WD-2 Current Situation Report

**Date:** 2026-10-04 · **Status:** `IMPLEMENTED`, awaiting independent Review and CI.
The options are in the [WD-2 Current Situation Proposal](WD-2-CURRENT-SITUATION-PROPOSAL.md).

## Decision

On 2026-10-04 the owner asked for the open fixes to be made. This applies the proposal's
recommended **option B**: the current-situation line is a derived display, never stored as
truth.

## Rule

The line is the current statement of the shared fact changed most recently on this path.

1. Read the newest commits of the head's path, newest first, up to 10. That is the window the
   Return projection already reads.
2. Within a commit, read its changes last first. In a multi-change turn, the last change
   leads.
3. The first change whose target is an `ACTIVE` `SHARED` fact gives the line. Changes to
   threads, relationships, constraints and Characters are skipped.
4. A Restore commit (`RESTORE_COMMITTED`) ends the search. It replaces sections of the
   state, so earlier changes no longer say what is current.
5. With no such fact, the line is the first current shared fact, as before, then the clock.

The statement always comes from the head's state, not from an Event. A hidden secret is
`CONTINUITY_PRIVATE` until revealed, so it never leads. A response-only turn makes no
commit, so it never changes the line.

## Where

- **Server:** `currentSituation` in `packages/database/src/index.ts` feeds the Return
  projection, from the same source head as its state.
- **Web:** `apps/web/src/pages.tsx` mirrors the rule for the World and Continuity pages. It
  reads the trace again when the head moves, and uses a trace only when its newest commit is
  the current head. Until then, or if the read fails, it shows the fallback.
- **Return fallback:** when the Return projection cannot be read, the page's local fallback
  shows the first current shared fact, as before. It does not read the trace.
- **Trace:** `FACT_ADDED` and `FACT_REVEALED` Events carry `factId`. The trace now reports it
  as the Event's `targetId`, which the field already allowed. As a side effect, the trace
  page now names the World fact for these Events, as it already did for rewrites.

## Unchanged

No API shape, SQL, migration, model prompt, Commit rule or authority changes. The proposal's
option A (a confirmed L3 situation) and option C (the author edits a new Revision) are not
built.

## Known limits

- **Only facts lead.** A turn that only moves a Character or shifts a relationship does not
  change the line.
- **The search covers 10 commits.** After 10 commits with no fact change, the line falls
  back.
- **After an Undo the line falls back** until a later turn changes a fact.

## Review

The Reviewer was Sonnet 5.5, read-only.

1. **Review of `5f2d704` + `44746dc`: `PASS WITH ISSUES` (0B/1I/3M).**
   - **I-1.** The web kept a trace across head changes, so after a Restore, a commit or a
     failed read it could pair the new state with an older head's trace. Fixed: a trace is
     used only when its newest commit is the current head. The e2e serves a trace for
     another head and expects the fallback.
   - **M-1.** The Return fallback reads no trace. Accepted and stated above.
   - **M-2.** Test gaps. The e2e now shows that a reveal leads and that a private fact
     changed last never does. Server and web parity is by review; the e2e and the
     integration test check the same rule.
   - **M-3.** The trace page now names the fact for added and revealed facts. Stated above.

## Commits and evidence

- **Behavior:** `5f2d704`, and the review fix after it.
- **Local runs (not CI evidence):**
  - PGlite `px4b-multi-change` 8/8, including the new WD-2 test, and `ip4-adversarial`;
  - `ip4-return-continuity`: 13 passed, plus 2 lock-order tests that also fail on PGlite
    without this change;
  - e2e `ip4-continuity`, `action-truth` and `mgc1-closure` 124/124 on Chromium, mobile and
    WebKit (Firefox is not installed locally);
  - typecheck for both configs and eslint are clean.
