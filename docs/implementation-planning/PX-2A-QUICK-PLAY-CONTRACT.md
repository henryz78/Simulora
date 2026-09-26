# PX-2a Quick Play and Player-Owned Actions Contract

**Date:** 2026-09-26 · **Status:** `CLOSED` at `275805a` ([report](PX-2A-IMPLEMENTATION-REPORT.md)).
Decision: [PX-2](PX-2-PROPOSED-ADRS.md) D1 A and D2 A. This contract covers D2
and the prompt half of D1. The world voice for untargeted Actions (D1's other
half) is PX-2b, in the [parallel handoff](PARALLEL-AGENT-HANDOFF.md). The track
closes on an independent Review of an exact SHA with green CI.

## Scope

1. **Quick play (D2 A).** A setting on the play page, off by default, changed
   only by the player. While it is on:
   - the player's client confirms an L2 proposal as soon as it arrives, with the
     same exact request (proposal id, digest, expected head) as the button;
   - L3 proposals still wait for the button;
   - the outcome says the change was applied automatically.
   The setting is kept per Continuity in the browser; a new device starts off.
2. **Undo.** The latest committed change offers "Undo" while it is still the
   head. Undo prepares and confirms a Restore of the previous head through the
   existing Restore endpoints: an appended Commit, so history is kept
   (ADR-011). It is available for any committed Action, quick play or not.
3. **Player-owned actions (D1 A, prompt).** The live prompt tells the model to
   narrate the result of the player's own declared attempt in the second person
   and not to move it onto a Character. The agency guard is unchanged: it
   already allows "you" with ordinary verbs and still refuses speech, decisions
   and commitments. Prompt version 8.

## Unchanged

The server's Commit rule (ADR-005), the L2/L3 table (ADR-018), the agency
guard, knowledge scope, and the Restore semantics.

## Acceptance

- Browser: with quick play on, an L2 proposal is confirmed without a click
  (one confirm request with the exact proposal); an L3 proposal still shows the
  button; with it off, nothing is confirmed automatically; the setting survives
  a reload.
- Browser: Undo sends a Restore proposal for the previous head and confirms it;
  it is not offered once the head has moved.
- Model gateway: the compiled prompt carries the new rule and version 8.
