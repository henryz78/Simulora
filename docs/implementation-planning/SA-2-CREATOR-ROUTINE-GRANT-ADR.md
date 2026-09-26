# ADR-SA2: Creator-granted routine movement

**Status:** accepted by the product owner on 2026-09-25 (direction). It is
implemented under the
[SA-2 contract](SA-2-STUDIO-MOVEMENT-AND-KNOWLEDGE-CONTRACT.md), and it is
subject to independent Review.

**Supersedes in part:** [ADR-RE3](RE-3-ROUTINE-POLICY-ADR.md), which says
"There is no creator/user policy-writing API". ADR-008, ADR-010 and ADR-012
keep their authority.

## Context

ADR-RE3 made routine movement an immutable administrative policy bound to a
pinned World Revision. The reason was that the World schema neither identified
avatars nor declared which places are safe to move through. An authored route
was description only.

As a result, a World built in the formal UI could never move a Character, and
Studio-authored rules could not fire.

## Decision

The **World owner** may grant routine movement explicitly, inside the World
document of the Revision they create. The grant has two parts:

- `routineMovers` names the Characters allowed to move on their own;
- `routineRoutes[].permitsRoutineMovement` marks the routes they may use.

The owner thereby certifies two things:

- **These Characters are world Characters, not the user.** `userRole` is
  never a Character, so it can never be a mover.
- **The endpoints of the permitted routes are public places.**

The database derives that Revision's `re3_routine_policies` row from the
document when the Revision is inserted. The row has the same shape, validation,
digest and immutability as an administrative policy.

What does **not** grant movement:

- an authored route alone;
- prose;
- a model;
- a participant.

The policy stays bound to the Revision: changing it takes a new Revision. The
enforcement path is unchanged:

- worker allow-list;
- digest-sealed evidence;
- SQL proposal binding;
- exact confirmation.

## Consequences

- Studio Worlds can move Characters that their creator names, along routes
  their creator marks.
- Administrative policies remain for Revisions that declare no movers.
- This is still not a general avatar or permission system. A future shared
  or participant-authored World needs its own decision.
