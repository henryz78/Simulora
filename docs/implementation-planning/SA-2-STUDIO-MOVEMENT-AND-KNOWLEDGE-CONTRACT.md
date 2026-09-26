# SA-2 Studio Movement Grant and Knowledge Guidance

**Date:** 2026-09-25 · **Status:** `APPROVED DIRECTION 2026-09-25 — IMPLEMENTED,
REVIEW PENDING` (behavior `9e06d52`, CI `36220835359`; see the
[implementation report](SA-2-IMPLEMENTATION-REPORT.md)).

The product owner chose both options (in chat, 2026-09-25):

- the **creator grants movement explicitly in Studio**;
- **warn early and explain** when a Character knows nothing addressable.

This track closes only after an independent Review on an exact SHA with green
CI.

It changes RE-3 authority, so it carries a successor decision:
[ADR-SA2](SA-2-CREATOR-ROUTINE-GRANT-ADR.md).

## 1. Problems (SA-1 §4)

1. **Movement.**
   - `ROUTINE_EFFECT` needs a revision-bound `simulora.re3_routine_policies`
     row. ADR-RE3 allows only administrators to provision it, and Studio
     Worlds never have one.
   - The Composer still offers "Have this character move", and the Action
     always ends `FAILED_RECOVERABLE`.
   - A Studio rule therefore cannot fire with the deterministic adapter.
2. **Knowledge.**
   - A selected Character must know the Action's target fact; this is RE-2
     authorized context.
   - A Character added in Studio knows nothing.
   - Addressing it is refused with `WORLD_NOT_PLAYABLE`, and the page shows
     only "The Action was not accepted".

## 2. Decision

### 2.1 Creator movement grant

**The World document gains two optional fields:**

- `routineMovers: stableId[]`: the Characters the creator lets move on their
  own. Each one must be a World Character, with no duplicates.
- `routineRoutes[].permitsRoutineMovement: boolean`: whether a drawn route may
  be used by those Characters.

**The two are consistent:** `routineMovers` is non-empty exactly when at least
one route has `permitsRoutineMovement: true`.

**The grant is created with the Revision.** A successor migration adds an
AFTER INSERT trigger on `world_revisions`. When the new Revision declares
movers, the trigger inserts that Revision's `re3_routine_policies` row, derived
only from the document:

| Policy field | Derived from |
|---|---|
| `npcIds` | `routineMovers` |
| `routes` | the permitted routes, with their labels |
| `publicLocationIds` | the distinct endpoints of those routes |

- The existing policy shape trigger validates the row and computes its
  digest.
- The policy stays immutable. A different grant means a new Revision.

**Everything downstream is unchanged:**

- the worker's policy load;
- digest evidence and SQL proposal binding;
- NPC and route allow-list validation;
- `MOVE_CHARACTER` materialization;
- exact confirmation.

**Administrative policies** for Revisions without movers stay possible, as
before, for experiments and tests.

**The Composer follows the grant.** The continuity state response gains an
optional `routineMoverIds`, read from the Revision's policy row, or `[]` when
there is none. "Have this character move" is enabled only for those
Characters. When the field is absent (an older response), the Composer
behaves as before.

**Studio** (in "Facts, routes, relationships and boundaries"):

- *Characters who may move on their own*: one checkbox per Character.
- On each route: *Characters above may use this route on their own*.
- A save guard reports a mismatch (movers without a permitted route, or the
  reverse) inline.
- Removing a Character removes it from `routineMovers`.
- Removing a place removes its routes, as today.

### 2.2 Knowledge guidance

- **Playability check (server).** A `WARNING` finding appears for each
  Character that the Composer could not address at the start. It uses the
  same `compileActionGenerationContext` rule on the initial state, so the
  finding and the play rule cannot disagree. It names the fact the Character
  would need. It never blocks a Revision.
- **Composer.** When the API refuses an addressed Action as not playable, the
  page says the Character does not yet know anything this Action can be about,
  and that knowledge is set in World Studio.
- **The knowledge rule is unchanged.**

## 3. Out of scope

- Avatars.
- A general permission system.
- Movement for the user's role: `userRole` is not a Character, so it cannot
  be a mover.
- Movement off drawn routes, or autonomous movement.
- Changing an existing Revision's policy.
- Default knowledge for new Characters.
- Relaxing RE-2 context.

## 4. Acceptance

**Domain unit tests:** the schema accepts the new fields and rejects:

- an unknown mover;
- a duplicate mover;
- movers without a permitted route;
- a permitted route without movers.

Old documents still validate.

**Real PostgreSQL:**

- the SQL validator agrees with the domain on every case above;
- a Revision with movers gets exactly the derived policy, which is immutable;
- a Revision without movers gets none;
- a mover moves along a permitted route, confirmed exactly;
- a non-mover is refused;
- a mover at a place with no permitted route, in a World with a rule, gets a
  transformed failure;
- `routineMoverIds` matches the policy;
- the knowledge warning appears for an uninformed Character and not for an
  informed one.

**Web e2e:**

- the Studio mover and route controls, the save guard and cleanup on removal;
- the Composer enables movement only for movers;
- the clear knowledge message;
- axe, keyboard and 320 px on the new controls.

**Real stack, desktop and 390×844:** a World authored only in Studio, where:

1. a mover moves along a permitted route;
2. a rule turns an impossible movement into a transformed failure;
3. a non-mover is not offered movement;
4. an uninformed Character shows the knowledge warning in Studio.
