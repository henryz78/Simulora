# PX-1 Play Experience Contract

**Date:** 2026-09-26 · **Status:** `APPROVED 2026-09-26 — IN IMPLEMENTATION`.
The owner asked the Agent to do what it judged necessary after the
[Play Weight Health Check](PLAY-WEIGHT-HEALTH-CHECK.md). This track takes only
the findings that touch no frozen semantics. It closes on an independent Review
of an exact SHA with green CI.

## Scope

1. **Story on the play page.** The recorded list shows each finished Action,
   committed or response-only, with the player's words and the reply. The
   latest outcome keeps its reply after confirmation. The data already exists
   in the branch history.
2. **Lighter Composer.** "Ask for a response only" is the default and first
   choice; the choices read as player intentions. The submitted contract is
   unchanged, and every world change still needs exact confirmation.
3. **Player language on the play page.** Status and review text without
   Branch head, Commit or L2/L3 codes. The confirmation still shows exactly
   what changes, from what, to what.
4. **Player home.** The home page is a player's entry: "Continue playing" and
   "Your worlds", from a new owner-scoped read `GET /v1/me/library`. It lists
   only the account's ACTIVE Continuities and undeleted Worlds.
5. **Studio.** The back link says "Home". A finding names its area ("Character
   2") instead of an internal path. The knowledge warning quotes the fact
   without doubled punctuation.
6. **SA-2 follow-ups.**
   - M1: the knowledge message matches the RE-2 refusal message, not the
     generic code.
   - M2: the start-continuity response carries `routineMoverIds`.
   - M3: the route option says it is one way.

## Out of scope (need a successor ADR and the owner's decision)

- People in the scene who are not pre-authored Characters.
- How the player's own action is narrated.
- Applying small changes without confirmation.
- Streaming, provider choice, retry counts.

## Acceptance

- Real PostgreSQL: the library lists only the caller's ACTIVE Continuities and
  undeleted Worlds, newest activity first; another account sees none of them.
  A started Continuity with movers returns them.
- Browser: the story list shows replies; a confirmed reply stays visible; the
  Composer defaults to a response; the home lists; the Studio finding labels.
- The existing suites stay green, with test text updated only where the copy
  changed.
