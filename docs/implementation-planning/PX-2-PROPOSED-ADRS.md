# PX-2 Proposed Decisions: Lighter Play Beyond Presentation

**Date:** 2026-09-26 · **Status:** `PROPOSED — awaiting the owner's decision`.
Nothing here is approved or implemented.

The [Play Weight Health Check](PLAY-WEIGHT-HEALTH-CHECK.md) found that the
heaviest problems are not presentation. PX-1 fixed what touches no frozen
semantics. These two decisions would change frozen semantics, so each needs the
owner's choice and then a successor ADR, contract, implementation and
independent Review.

## D1. People in the scene, and the player's own actions

**Problem.**

- Only pre-authored Characters can speak. In the health check a wool merchant
  in the scene could not answer, so Marta answered everything, repeated one line
  four times, and the story stalled.
- "I search behind the counter" was narrated as Marta searching. The agency
  guard forbids the model to author the player's speech or commitments, so the
  model moved the player's action onto a Character.

**Frozen rules touched:** the output agency guard (RE-2, ADR-008 validators)
and the response source (`CHARACTER` or `WORLD`, ADR-019).

**Options.**

| | What it means | Cost |
|---|---|---|
| A (recommended) | A `WORLD` response may voice unnamed people in the scene. They know only SHARED facts, cannot change facts or relationships, and do not persist as Characters. The narrative may describe the result of the attempt the player declared, in the second person ("You search…; nothing is there"), but still never the player's speech, decisions or commitments. | Guard change with application and SQL parity; prompt rule; tests |
| B | Also let play create new Characters, with owner confirmation | A and a new canonical effect (L3) |
| C | Keep as is | The story stalls whenever the player turns to anyone unauthored |

## D2. Small changes apply at once, with undo

**Problem.** Every world change waits for "Confirm this exact change". A null
result ("still not found") needed a protected L3 confirmation, because a fact
rewrite is L3 by the closed table (ADR-018). ADR-018 also says routine L2 world
evolution "does not become confirmation-heavy", which the current UI does not
honor.

**Frozen rules touched:** ADR-005 (Commit only on confirmation), ADR-018 (the
L2 path), and the participation contract (ADR-007), if this is a mode the
player chooses.

**Options.**

| | What it means | Cost |
|---|---|---|
| A (recommended) | An opt-in "quick play" setting, changed only by a direct user command like the participation contract. In it an L2 proposal that passes every validator commits at once, and the outcome offers one-click Undo, which is an appended Restore to the previous head (ADR-011: history is kept). L3 still needs exact confirmation. | Setting plus a successor contract; auto-commit path; Undo through the existing Restore; tests |
| B | Same, as the default for everyone | A, and the owner accepts model-proposed L2 changes without a click |
| C | Keep confirmation for everything | Current weight |

A related, smaller point: "still not found" should not be a fact change at all.
Prompting the model to answer a null outcome as a response (no effect) would
cut many L3 confirmations without any semantic change. It can be done with D1.

## What the owner is asked

1. D1: A, B or C?
2. D2: A, B or C?
