# WD-1b Secrets and "Let the Story Decide" Contract

**Date:** 2026-09-27 · **Status:** `AUTHORIZED` (owner decision W3 A and W4 A,
[WD-1](WD-1-PROPOSED-DECISIONS.md)). Builds on [WD-1a](WD-1A-SHARED-WORLD-CONTRACT.md).
The track closes on an independent Review of an exact SHA with green CI.

## Successor decisions

- **ADR-WD1-3: author secrets.** A World Revision may declare
  `discoverableFacts`: entries of `{ factId, howToFind }` that name a
  CONTINUITY_PRIVATE fact of that World. This is the author's
  pre-authorization, like SA-2's routine grant.

  A new operation, `REVEAL_FACT { factId, causalFactIds }`, changes one such
  fact's scope to SHARED. This narrows ADR-018's "scope widening is L3" by one
  case: a reveal the author pre-authorized is **L2**. Every other scope
  widening stays L3. The reveal is valid only when all of these hold:
  - the fact is declared discoverable in the pinned Revision;
  - it is ACTIVE and still CONTINUITY_PRIVATE at the head;
  - a World response may reveal any such fact, but a Character only one it
    knows.

  It commits with one `FACT_REVEALED` Event. Undo reverses it through Restore.
- **ADR-WD1-4: "Let the story decide".** A new requested effect,
  `STORY_DECIDES`, becomes the Composer's default. The model returns exactly
  one of:
  - no change (L0, recorded as dialogue);
  - `ADD_FACT` (L2);
  - `REVEAL_FACT` (L2);
  - when the World declares constraints, `TRANSFORM_FAILURE` (L2, as today).

  The server classifies the level. An L3 change never happens under this
  effect; it needs the player's explicit "Change something in the world". All
  explicit choices remain.

## What the model sees

For a `STORY_DECIDES` Action, the generation context gains `discoverable`:
`{ factId, statement, howToFind }` for each fact that may be revealed.

- For a World response: every declared discoverable fact still private.
- For a Character: those it knows.

Only a reveal may bring that statement into generated text. Otherwise the
disclosure guard treats it as excluded, as today. The section is part of the
SQL-compiled context, so the evidence's source digest binds it. The
manifest also carries the prior dialogue, as a response-only Action does,
because the result may be dialogue.

## Scope

1. **World schema and SQL World validation.** Entries must name a
   CONTINUITY_PRIVATE fact, with no duplicates, and `howToFind` must be 1–1000
   characters.
2. **Studio.** A private fact can be marked "Can be discovered in play", with a
   "How it could be found" note. A secret stops being discoverable when its
   scope changes or the fact is removed.
3. **Application and SQL parity** for:
   - the new requested effect;
   - the context section;
   - the manifest;
   - the evidence (proposal and no-effect);
   - the operation, state and Event;
   - the dialogue terminal.
4. **Play.**
   - The Composer's first and default choice is "Let the story decide".
   - A reveal shows "Discovered" and the statement.
   - Quick play applies it, and Undo is offered.
5. **Prompt version 10** for the `STORY_DECIDES` skeleton and rules:
   - reveal only when the player's action meets the note;
   - otherwise respond, or add a small new fact.

## Narrowed (follow-up)

- Threads, relationship steps and movement stay on their explicit choices.
  Adding them to "Let the story decide" needs their effect-context and policy
  bindings to accept the new effect.
- No seeded sample world. The live check authors a secret in Studio.

## Unchanged

- Commit on confirmation (ADR-005); quick play is the player's own
  confirmation.
- Restore (ADR-011).
- The agency guard.
- Character knowledge, except the reveal defined above.
- Every existing operation and its level, and every other scope widening
  (L3).

## Acceptance

- **Real PostgreSQL:**
  - World validation accepts a valid declaration and refuses a SHARED,
    missing or duplicate target.
  - A `STORY_DECIDES` context carries the discoverable section: all secrets
    for the World, only the Character's own for a Character.
  - A World reveal seals at L2 and commits: the fact becomes SHARED with one
    `FACT_REVEALED` Event, and Restore makes it private again.
  - Response-only and `ADD_FACT` outcomes under `STORY_DECIDES` complete.
  - Forged variants are refused beside a sealing control:
    - an undeclared fact;
    - an already SHARED fact;
    - a Character revealing a secret it does not know;
    - L3;
    - a narrative that discloses a different secret;
    - a reveal under another requested effect.
- **Browser:** the default is "Let the story decide"; a reveal reads as
  "Discovered"; Studio marks a secret and records how it could be found.
- **Model gateway:** prompt version 10; the `STORY_DECIDES` skeleton offers
  only the allowed operations.
