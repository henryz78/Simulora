# PX-4a Implementation Report

**Date:** 2026-10-03 · **Status:** `CLOSED`. The contract, owner decisions and successor ADRs
are in the [PX-4 World Freedom Contract](PX-4-WORLD-FREEDOM-CONTRACT.md).

## What it does

The owner played The Lantern Inn and could not move the story. PX-4a lifts the rules that
caused that.

- **The story can change anything closed.** Under "Let the story decide", after migration
  0057, the model may choose any of these operations:
  - rewrite a shared fact (L3);
  - move the selected Character along a route the World authorizes (L2);
  - shift one of the selected Character's relationships;
  - open a thread;
  - resolve any open thread.

  The WD-1b operations (add, reveal, transform a failure, no effect) are unchanged.
  Actions created before 0057 keep the WD-1b rules exactly.
- **Direct play by default.** Every valid play proposal is confirmed at once. The client
  sends the same exact confirmation (proposal digest included) as the button.
  - Each turn says what it changed.
  - "Undo this turn" restores the previous head while that turn is still the head.
  - Strict mode, one setting per browser, makes every change wait for the button.
  - Corrections and removals always wait for the player's own click.
- **Prompt v11.**
  - The player's attempts succeed when they are possible by the world's own rules: its
    premise, facts, places and declared constraints, such as magic. Common sense applies
    only where the world says nothing, and a failure names its real obstacle.
  - A request to a Character remains that Character's choice.
  - Other people present and the surroundings react.
  - The narrative follows the player's language.

## Unchanged

- The server's Commit rule and the L2/L3 table.
- The agency guard, knowledge boundaries, declared constraints and relationship
  protection.
- Expected-head fencing, idempotency, Restore, correction and removal.
- One change per turn. That limit is PX-4b.

## Commits

**Behavior commits:**
- `4dd4389`: migration 0057, application parity, prompt v11 and direct play.
- `3b863dd`: adds the new PostgreSQL suite to CI's `test:postgres`.
- `0017715`: possibility is judged by the world's own rules.
- `b253308`: review fixes.

**Documentation commits:** `db58c10`, `87f739a`, `32f7191`, `eb1241f`.

## Review

The Reviewer was Sonnet 5.5, read-only.

1. **First round: `PASS WITH ISSUES` (0B/2I/4M).**
   - **I-1.** Direct play also auto-confirmed pending corrections and removals, against
     ADR-PX4-1. `b253308` limits it to `PARTICIPATE` Actions. A direct-play e2e proves that a
     correction waits and sends no confirmation; it fails without the fix.
   - **I-2.** There were no SQL-level negative tests. `b253308` adds two real-PostgreSQL tests.
     Inside a rolled-back transaction they forge a proposal, rewriting its digest and
     generation output, so only the 0057 gate under test can refuse. Each case has a
     positive control. The cases are:
     - a move for a Character outside the policy;
     - a move before the epoch;
     - a resolve of a resolved thread;
     - a shift with no selected Character.
   - **M-1, M-3.** These are recorded as known limits in the contract: the script allow-list
     of the authority guard, and the manifest not recording which routes were offered.
   - **M-2.** The contract now says Strict mode is per browser.
   - **M-4.** "boundaries" was removed from the prompt.
2. **Focused re-review of `b253308` + `eb1241f`: `PASS` (0B/0I/0M).**

## Evidence

- **Approved behavior SHA:** `b253308`.
- **CI:** run `37180344015` on `eb1241f`, a docs-only commit on top of `b253308`. It succeeded. The owner had closed PX-4a before it finished.
  The earlier exact-SHA runs for `4dd4389`, `3b863dd`, `87f739a` and `32f7191` all succeeded.
- **Local runs (not CI evidence):**
  - PGlite `px4-story-freedom` 7/7;
  - domain 46/46 and gateway 25/25;
  - desktop and mobile e2e 106/106 before the fix;
  - the focused PX-4a and correction e2e on Chromium and WebKit after it;
  - tsc, eslint and the migration check are clean.

## Not claimed

- No human play-test of PX-4a yet. The owner's next session is the check.
- No provider approval, beta, launch or production live model.
