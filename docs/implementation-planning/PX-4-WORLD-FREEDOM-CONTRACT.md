# PX-4 World Freedom Contract

**Date:** 2026-09-29 · **Status:** `IN PROGRESS`. PX-4a is `CLOSED`: Review `PASS` after fixes, approved behavior
SHA `b253308` (see the [PX-4a report](PX-4A-IMPLEMENTATION-REPORT.md)). PX-4b has not started.
Owner decisions were given in chat on 2026-09-29, after the Lantern Inn play-test. The track
closes on an independent Review of an exact SHA with green CI.

## Why

The owner played The Lantern Inn and felt they could not move the story. In their words, it
felt like trading lines with one AI rather than acting in a world.

The data for that Continuity shows why. Six turns produced one reveal and one confirmed
refusal. Every other turn ended with no change. There were three causes:

1. **"Let the story decide" could only add facts.** WD-1b ruled out L3 under this effect. So
   "the ledger is missing" could never become false, and the model had to narrate every
   attempt to recover it as failing.
2. **What the player did was not recorded.** "I bring the coat to the counter" ended as
   dialogue. The next turn found the coat back on the peg, because the fact still said so.
3. **Only one change per turn, and only from one speaker.** The other people present and the
   room itself never reacted.

A Character refusing the player (Marta would not cut the coat) is **wanted**. The owner
reads it as personality, not obedience.

## Owner decisions

- **D1.** Loosen play; it must not be rigid.
- **D2.** Changes apply without a confirmation click by default. A "Strict mode" restores
  confirming each change. Restore and Undo are the safety net.
- **D3.** What the player does succeeds when it is possible **in that world**. It fails when
  the world makes it impossible (heavy snow means no walking to the burger shop), unless the
  player names a plausible means that fits the world (a sled). A world's own rules decide
  what is possible: in a world of magic, flying on a broom succeeds. Ordinary common sense
  applies only where the world says nothing.
- **D4.** The model answers in the player's language.
- **D5.** A turn may make several changes, capped at 4.
- **D6.** Characters may still refuse what the player asks of them.

## Successor decisions

- **ADR-PX4-1: direct play by default.** This supersedes PX-2a on two points: quick play is
  now on by default, and it now covers L3 as well as L2.
  - The player's standing choice of direct play is the confirmation. As soon as a valid
    proposal arrives, the client sends the same exact confirmation request (proposal digest
    included) that the button sends.
  - Strict mode is one setting per browser, for every Continuity. With it on, every proposal
    waits for the button, as before. A browser with no stored setting starts in direct play.
  - Direct play confirms only play Actions. A correction or removal always waits for the
    player's own click.
  - The server's Commit rule and the L2/L3 table (ADR-005, ADR-018) do not change. L3 still
    needs an exact confirmation; direct play only changes who sends it.
  - Each turn shows what it changed, and offers "Undo this turn" while that turn is still the
    head. Undo is the existing Restore of the previous head.
  - Direct corrections, removals, Restore and deletion remain the player's own explicit acts.
- **ADR-PX4-2: the story may choose any closed operation.** This supersedes ADR-WD1-4's rule
  that L3 never happens under "Let the story decide". Under `STORY_DECIDES`, for Actions
  created after migration 0057, the model returns exactly one of the following:

  | Operation | What it may do |
  |---|---|
  | `NO_WORLD_EFFECT`, `ADD_FACT`, `REVEAL_FACT`, `TRANSFORM_FAILURE` | As in WD-1b |
  | `UPDATE_CANONICAL_FACT` | Rewrite any ACTIVE SHARED fact in the context |
  | `MOVE_CHARACTER` | Only the selected Character, along a route the World authorizes |
  | `SHIFT_RELATIONSHIP` | Only a scaled relationship of the selected Character |
  | `OPEN_THREAD` | Open a new story thread |
  | `RESOLVE_THREAD` | Resolve any thread that is open at the head |

  - The server derives the impact level from the closed table, as it does today.
  - The effect context (relationships, open threads, constraints) is compiled for every
    such Action.
  - A story move is checked against the pinned routine policy by both
    validators. The manifest binds no extra policy digest, and the model is
    offered routes only for a Character that the policy lets move.
  - The explicit effects stay available unchanged.
- **ADR-PX4-3: prompt version 11.**
  - **The player's own attempts.** These succeed when they are possible by the world's own
    rules: its premise, facts, locations, boundaries and declared constraints. Common sense
    fills in only where the world says nothing. The outcome is recorded
    with the operation that best fits it. An impossible attempt fails because of its real
    obstacle, using `TRANSFORM_FAILURE` when a declared constraint applies.
  - **Means the player names.** A means must not contradict established facts, and the
    world judges whether it is plausible.
  - **Requests.** A request to a Character is that Character's choice, made by its motives,
    and refusal stays legitimate.
  - **The scene.** Other people present, including unnamed bystanders, and the environment
    react visibly, even when a Character is addressed. They act only on shared facts and on
    what they witness.
  - **Words spoken in public** can have consequences.
  - **Language.** Narrative and new statements use the language of the player's Action.
    Names are kept as written.
- **ADR-PX4-4 (PX-4b): up to four changes per turn.** A candidate `schemaVersion: 2` carries
  1–4 operations.
  - They are validated in order against the head. No two operations may target the same
    fact, relationship, thread or Character.
  - The impact is the highest of the operations.
  - They commit as one Commit with one typed Event per operation.
  - Undo reverses the whole turn.
  - This needs its own contract section, application and SQL parity, and review before it
    starts.

## Unchanged

- The agency guard: generated text may never write the player's speech, decisions, consent,
  payments or promises.
- Knowledge boundaries. A Character knows its facts and what it witnessed. Author secrets
  surface only through a declared reveal.
- Declared constraints and relationship protection levels.
- Server validation of every proposal, idempotency, and expected-head fencing.
- Restore, correction and removal.

## PX-4a scope

1. **SQL successor `0057_px4_story_freedom.sql`**, with an immutable ledger epoch as in
   0055/0056:
   - `STORY_DECIDES` accepts the operations above;
   - `RESOLVE_THREAD` may name any open thread;
   - the effect context applies.
   Actions created before the epoch keep their exact WD-1b evidence.
2. **Application parity:**
   - `compileEffectContext`;
   - `validateActionCandidate`;
   - the manifest;
   - the generator request.
3. **Model gateway prompt v11**, with the skeleton and rules above.
4. **Play (web):**
   - direct play is on by default, and Strict mode is available;
   - confirmation is automatic for L2 and L3 unless Strict mode is on;
   - every turn shows a "this turn changed" line and "Undo this turn".
5. **Tests:**
   - domain validation;
   - real PostgreSQL parity for each newly allowed operation under `STORY_DECIDES`,
     including pre-epoch rejection;
   - prompt compilation;
   - browser tests for the default, Strict mode and Undo.

## PX-4b design (proposed, awaiting design Review)

ADR-PX4-4 lets one turn make up to 4 changes. This section is the design that ADR asked
for. Implementation starts only after an independent design Review.

### Scope

- **Where it applies:** only `STORY_DECIDES` Actions created after a new ledger epoch, in a
  successor migration `0058`. Explicit effects, corrections, removals and older Actions keep
  schema version 1 exactly.
- **What the model returns:** a candidate `schemaVersion: 2` with `operations` (1–4 items)
  in place of `operation`. Each item uses an existing v1 operation shape.
  `narrative` and `responseSource` are unchanged.
- **What may be combined:**
  - `NO_WORLD_EFFECT` may only stand alone.
  - At most one `TRANSFORM_FAILURE`.
  - At most one `MOVE_CHARACTER`, because a move needs the selected Character.
  - No two operations may target the same fact, relationship, thread or Character.
  - An operation may not name, as a cause, a fact that another operation in the turn
    rewrites or reveals.

### Meaning

- **Validation.** With disjoint targets, every operation is validated against the
  expected head exactly as the same v1 operation would be. Disjointness makes the order
  irrelevant, so there is no sequential state to reason about.
- **Server-derived ids.**
  - The first `ADD_FACT` is `fact.<actionId>`; later ones are `fact.<actionId>.<n>`.
  - A thread opened by `OPEN_THREAD` or `TRANSFORM_FAILURE` follows the same rule, as
    `thread.<actionId>`, then `thread.<actionId>.<n>`.
  - The suffix `n` is the operation's 1-based position.
- **Impact.** The proposal's impact is the highest of its operations' impacts.
- **Display.** `displayEffect` becomes an ordered list with one entry per operation, and the
  turn line lists them all.
- **Commit.**
  - One Commit and one state revision per turn.
  - The world clock advances once, and the narrative is recorded once.
  - There is one typed Event per operation, in order. Each Event payload is the v1 payload,
    with the derived ids above.
- **Undo.** Undo is unchanged: Restore of the previous head reverses the whole turn.

### SQL parity, without rewriting the v1 validators

- **Dispatcher.** A `schema_version = 2` proposal is split into virtual v1 proposals, one
  per operation.
  - Each virtual proposal carries that operation and its display entry, with a digest
    recomputed by the v1 formula.
  - Each runs through the existing `action_proposal_effect_is_valid` chain unchanged.
  - The v2 envelope adds its own checks: the operation list, the combination rules, the
    impact being the maximum, and the v2 digest.
- **Generation evidence.** A wrapper accepts a virtual proposal only when the stored v2
  proposal for the same Action contains exactly that operation at that position. That
  stored proposal's own evidence must also be valid against the v2 output. A forged
  virtual proposal therefore cannot pass on its own.
- **State.** A new `expected_action_state` branch for v2 folds the operations over the
  parent document. Each step is the v1 state change of that operation.
  - The parity test is one equivalence check. For every operation type, a one-operation
    v2 turn must produce the same state revision and the same Event as the v1 Action.
  - Mixed turns are then tested against the application.
- **Materialization.** For v2, the check expects one Event per operation, with matching
  type and payload, in order.

### Application, model and play

- **Domain.** `validateActionCandidate` validates v2 by checking the combination rules,
  then each operation through the v1 path.
- **Database.** The repository writes the folded state and the Events.
- **Gateway.** Prompt v12 offers "1–4 operations" under story freedom, with the
  combination rules.
- **Web.** The turn line lists every change. Direct play and Strict mode are unchanged.

### Tests before closure

- Domain combination rules.
- v2-vs-v1 equivalence on real PostgreSQL for every operation type.
- Mixed-turn Commits with ordered Events.
- Forged v2 and forged virtual proposals refused, with positive controls.
- Pre-epoch Actions rejected as v2.
- Prompt compilation.
- Browser: a multi-change turn and its Undo.

### Risks

- **Size.** This is the largest SQL change since MGC-1. The virtual-proposal design keeps
  every v1 validator untouched, so the risk sits in the new dispatcher, the evidence
  wrapper and the fold.
- **Model quality.** More operations per turn give the model more room to be wrong. Each
  operation is still validated individually. Whether the owner wants 4 or fewer is a
  play-test question, and the cap is one constant.

## Known limits

- **The excluded-fact disclosure guard is lexical.** A narrative in another language is not
  compared phrase by phrase. The primary protection is unchanged: excluded facts never reach
  the model.
- **The dialogue-attribution normalisation recognises only Latin names.** A Chinese narrative
  quoting a Character can still be refused by the agency guard. The live check records this.
- **Only Latin and Chinese narratives pass the authority guard.** It refuses any other script
  (kana, Hangul, Cyrillic, Arabic), so a player writing in those languages gets retries, not
  replies. Chinese Character speech that pairs 你 with an authority word can also be refused.
  Both fail safe.
- **The manifest does not record which routes the model was offered.** The pinned policy is
  immutable and both validators re-check every move against it, so this is traceability only.
- **PX-4a is still one change per turn.** PX-4b lifts that.
