# Play Weight Health Check

**Date:** 2026-09-26 · **Asked by:** the product owner, who worries the product
is "too heavy" · **Operated by:** the Agent, through the formal UI. This is not
human enjoyment validation.

**Setup:** local web, API and worker at `95a23c5` (TB-1 closed), local PGlite,
the owner's aggregator with `grok-4.7`.

## 1. What was measured

A new World authored from an empty Studio, then five Actions.

**Authoring:** 3 required fields (title, premise, starting situation); the
rest have defaults. Five button presses from an empty Studio to play: create
Draft, save, check playability, create Revision, begin play. The default
Place and Character are generic ("The starting place", "A local guide"); the
Agent replaced them with a common room and Marta the innkeeper, who knows her
ledger is missing.

| # | Action | Wait | Result |
|---|---|---|---|
| 1 | Ask Marta when she last saw the ledger (response only) | 17 s | In-character reply; no confirmation needed |
| 2 | "I search behind the counter and under the benches" (fact change, world responds) | 28 s | Narrated as **Marta** searching. "Still missing" proposed as an L3 fact change needing exact confirmation |
| 3 | Notice a wool merchant with a hand under his coat (open thread) | 23 s | Consistent with step 2 (TB-1 working). L2 thread, confirmed |
| 4 | Ask the wool merchant what he holds (response only) | 19 s | The merchant cannot answer; Marta answers instead |
| 5 | Ask Marta to come and have the merchant open his coat (fact change) | 62 s | First attempt refused by output validation; retry succeeded. Marta refuses again; the fact grows by another clause. Cancelled |

Each Action took 4 inputs (Character, desired outcome, text, send), plus one
confirmation for a world change.

## 2. Findings, most harmful to play first

1. **Only pre-authored Characters can speak.** Other people in the scene are
   mute, so every reply comes from Marta. She repeated one line ("a quarrel I
   then have to stop") in four replies, and the story stalled.
2. **The player's own action is given to a Character.** "I search" became
   Marta searching.
3. **Two choices before every Action,** with engineering names. The default
   desired outcome is the heaviest one, "Change a current world fact".
4. **Trivial outcomes need exact confirmation.** "Still not found" was L3
   ("protected or high-consequence"). The fact grows by appended clauses.
5. **Waiting:** about 20 s per Action, about a minute with a retry.
6. **After confirmation, the Character's reply disappears** from the play page;
   "Recorded Actions" shows only the player's words (seen in track B too).
7. **Engineering copy:** Branch head, Commit, Provisional, L3; the home page
   reads as implementation status.
8. **No list of Worlds or Continuities.** A player returns only by a saved URL.
   Studio's "← Back to Worlds" leads to the home page.

Also seen: one transient HTTP 500 from local PGlite's single connection (not
product evidence).

**Positive:** no empty replies with `grok-4.7` (7 generations, 1 validation
refusal retried); good prose; continuity across turns held.

## 3. What each finding would touch

| Findings | Frozen semantics touched | Path |
|---|---|---|
| 1, 2 | Characters and authority (who may act and speak) | Successor ADR; owner decision |
| 4 (confirmation) | Exact confirmation before a Commit | Successor ADR; owner decision |
| 3, 6, 7, 8 and the L3 wording of 4 | None (presentation and defaults) | A bounded play-experience track |
| 5 | None (provider and profile) | Provider choice, streaming later |

## 4. Not claimed

- Human enjoyment.
- Any provider approval.
