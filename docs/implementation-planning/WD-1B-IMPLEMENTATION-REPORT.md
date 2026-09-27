# WD-1b Secrets and "Let the Story Decide": Implementation Report

**Date:** 2026-09-27 · **Contract:** [WD-1b contract](WD-1B-SECRETS-AND-STORY-CONTRACT.md)
· **Decision:** [WD-1](WD-1-PROPOSED-DECISIONS.md) W3 A and W4 A · **Approved
SHA:** `0a94e6a` · **Evidence:** exact-SHA CI `36348064153` success (verified by
the owner) · **Review:** independent Reviewer (Sonnet 5) `PASS` (0B/0I/2M,
accepted). **WD-1b CLOSED.**

## 1. Commits

| Commit | Kind | What | CI |
|---|---|---|---|
| `51cb71d` | docs | Contract | success |
| `0a94e6a` | behavior | Migration 0056, app parity, `REVEAL_FACT`, `STORY_DECIDES`, prompt v10, Studio and play UI, tests | `36348064153` success |

## 2. What changed

- **Author secrets.** A World Revision may declare `discoverableFacts`:
  `{ factId, howToFind }` entries naming a CONTINUITY_PRIVATE fact of that
  World. SQL and the domain schema both refuse a missing, non-private or
  duplicate entry.
  - The Studio shows "Can be discovered in play" under a private fact, with a
    "How it could be found" note.
  - Changing the fact's scope or removing the fact withdraws the secret.
- **`REVEAL_FACT` at L2.** It changes one declared secret's scope to SHARED
  and nothing else. It is valid only when all of these hold:
  - the fact is declared in the pinned Revision;
  - the fact is ACTIVE and still CONTINUITY_PRIVATE at the head;
  - the requested effect is `STORY_DECIDES`;
  - for a Character, the fact is one it knows.

  The narrative may state only the revealed secret. SQL binds the proposal,
  the resulting state and exactly one `FACT_REVEALED` Event. Quick play
  applies it, Undo restores it, and the play page shows it as "Discovered".
- **`STORY_DECIDES`, the new default ("Let the story decide").** The model may
  - respond only (L0);
  - add a fact (`ADD_FACT`, L2);
  - reveal a secret (`REVEAL_FACT`, L2);
  - transform a failure when the World declares constraints (L2).

  It never produces L3. Only under `STORY_DECIDES` does the context carry
  `discoverable`: every secret for a World response, and only known ones for a
  Character. That list is inside the 48 000-byte bound, which fails closed.
  The manifest carries prior dialogue and the effect context digest.
- **Prompt version 10.**
- **Narrowing, stated in the contract.** Threads, relationships and movement
  stay explicit choices; `STORY_DECIDES` cannot produce them yet.

`STORY_DECIDES`, `discoverableFacts` and `REVEAL_FACT` are new values. No row
before 0056 can hold them, so no epoch gate is needed.

## 3. Evidence

CI `36348064153` at `0a94e6a`: every job passed, including:

- the real-PG `wd1b-secrets-and-story` suite (4 cases):
  - malformed secret declarations refused by SQL;
  - the `discoverable` context for a World and for a Character;
  - reveal commit, `FACT_REVEALED` Event and Restore;
  - six forged reveals refused beside two sealing controls (World and
    Character);
- the WD-1a, PX-2b and earlier PostgreSQL suites, and the 20-Session run;
- domain and prompt unit tests;
- the browser cases on desktop and 390×844: the new default, "Discovered" and
  the Studio secret.

## 4. Independent Review

**Review of `0a94e6a`: `PASS` (0B/0I/2M).** The Reviewer diffed every copied
SQL function against its live predecessor and found only the marked edits. It
confirmed:

- `REVEAL_FACT` is L2, one fact, and gated in both SQL and the domain;
- `STORY_DECIDES` refuses every L3 operation before an impact is assigned;
- knowledge containment of `discoverable`;
- upgrade safety;
- the forged cases route through the real binding trigger;
- the narrowing is accurate.

| # | Finding | Resolution |
|---|---|---|
| M1 | The play page recognizes a reveal by the literal `"Hidden until now."` rather than the domain constant. | Accepted; fold into the next behavior change. |
| M2 | The "already SHARED" forged reveal uses a fact that was always shared, not one revealed earlier. | Accepted; the same guard refuses both, by inspection. Fold into the next test change. |

## 5. Not claimed

- A live check of reveals and `STORY_DECIDES` with `grok-4.7`. This is next;
  the result goes to [Track B](TRACK-B-LOCAL-LIVE-PLAY-REPORT.md).
- Human enjoyment; beta, launch or production live model use.
- `STORY_DECIDES` producing threads, relationships or movement.
