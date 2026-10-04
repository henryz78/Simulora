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

## PX-4b design (DESIGN PASS)

ADR-PX4-4 lets one turn make up to 4 changes. This section is the design that ADR asked
for.
- **Round 1:** the design Review of `2b13b0c` returned `DESIGN PASS WITH CHANGES`, with
  9 required and 3 recommended changes. All of them are folded in below, tagged as `[Rn]`.
- **Round 2:** the re-review of `53a1dc5` also returned `DESIGN PASS WITH CHANGES`. It
  asked for six specification fixes, tagged as `[Sn]`, and said it would pass the design
  once they were in.
- **Design Review result:** `DESIGN PASS`, once three text corrections from the final
  check were made in the commit that adds this line.
- **Gate:** implementation may start. The track closes on an independent Review of the code.

### Scope

- **Epoch.** The rules apply only to `STORY_DECIDES` Actions created after a new ledger
  epoch: `px4b_multi_apply(created_at)` in successor `0058`, in the style of 0055–0057
  `[R10]`.
  - Explicit effects, corrections, removals and older Actions keep schema version 1
    exactly.
  - Actions queued before the epoch stay v1.
- **Schema version 2 is only for 2–4 operations `[R5]`.**
  - One change, or a response-only turn, stays a v1 candidate.
  - A v2 candidate carries `operations` (2–4 items, each an existing v1 operation shape)
    in place of `operation`. `narrative` and `responseSource` are unchanged.
  - The generator request gets a manifest-neutral `multiOperation` flag.
- **Combination rules `[R8]`.**
  - Target keys:
    - a fact id (the `UPDATE` target, the `REVEAL` factId);
    - a relationship id;
    - a thread id (the `RESOLVE` threadId, and the derived id of every thread opened);
    - a Character id (`MOVE`).
  - No two operations share a target key.
  - No operation names, as a cause, a fact that another operation rewrites or reveals.
  - `NO_WORLD_EFFECT` never appears in v2.
  - At most one `TRANSFORM_FAILURE`, combined only with `ADD_FACT` entries that record
    what followed. The failure already opens its own thread, so it is never paired with
    `OPEN_THREAD` `[S3]`.
  - At most one `MOVE_CHARACTER`.

### Meaning

- **Order.** Order is the candidate's order. Arrays (facts, threads), derived ids and
  Events follow it `[R4]`.
- **Validation.** With disjoint targets, each operation is valid against the expected
  head exactly when the same v1 operation would be. The Review checked every operation
  pair.
- **Derived ids, for v2 always by 1-based position `[R5]`:**
  - `fact.<actionId>.<pos>` and `thread.<actionId>.<pos>`;
  - each one is checked not to exist at the head.
- **Impact** is the highest of the per-operation impacts `[R6]`.
- **Display `[R7]`.**
  - v1 keeps `displayEffect` as an object.
  - v2 adds a separate ordered `displayEffects` array in contracts, in the database record
    and on progress events. Any reader handles both.
  - The Strict-mode review and the turn line list every change; `isRevealProposal` reads
    both shapes.
- **Commit.**
  - One Commit and one state revision per turn.
  - The world clock advances once, and the narrative is appended once `[R4]`.
  - There is one typed Event per operation, carrying its position as `ordinal`. Each
    payload is the v1 payload with the derived ids.
- **Undo** is unchanged: Restore of the previous head reverses the whole turn.

### Database changes in 0058

- **Events `[R1]`.**
  - `domain_events` gains `ordinal integer not null default 1`.
  - `unique (commit_id, event_type)` becomes `unique (commit_id, ordinal)`.
  - Every reader orders by `(created_at, ordinal, id)`: the repository's history,
    projection and export readers.
  - The history aggregate in the model context orders by `ordinal`, so the context digest
    is deterministic `[R9]`.
- **Proposals `[R2]`.** `action_proposals.schema_version` may be 1 or 2. Virtual proposals
  stay 1.

### SQL parity

What is reused, and what is new `[R12]`:
- **Reused unchanged:** the v1 *effect* validators (the 0057 → 0056 → 0048/0055 → 0032 →
  legacy chain).
- **Refactored:** the generation evidence, the state function, and the model-context
  history aggregate `[S4]`.
  - The aggregate lives in `re2_generation_context_pre_tb1` (0055) under the 0056 wrapper.
  - Its events are ordered by `ordinal`, and both the generator and the evidence check
    recompute the context digest with that ordering.

How it works:
- **Dispatcher.**
  - A stored `schema_version = 2` proposal is split into virtual v1 proposals, one per
    operation, each run through the unchanged effect chain.
  - In each virtual proposal, the derived id is replaced by the v1 base id
    (`fact.<actionId>`, `thread.<actionId>`). The envelope separately checks that the
    stored display entries and Event payloads carry the derived ids `[R5]`.
  - Each virtual proposal is tried at L2, then at L3; at most one passes. The envelope
    requires the stored impact to equal the maximum `[R6]`.
  - The envelope then checks:
    - the stored v2 candidate itself `[S1]`:
      - its exact key set is `{schemaVersion, actionId, expectedHeadCommitId, narrative,
        responseSource, operations}`;
      - `schemaVersion = 2`;
      - `actionId` and `expectedHeadCommitId` equal the Action row;
      - the responseSource equals the computed one;
      - `display_effects` has exactly one entry per operation;
    - the operation count (2–4);
    - the combination rules;
    - the epoch;
    - the v2 digest. Its payload is fixed in both TypeScript (`contentHash`) and SQL
      (`canonical_jsonb_text`) `[R10]`.
- **Generation evidence `[R3]`.**
  - The 0056 evidence function is factored into a core function that takes
    `expected_output` and the set of disclosed facts. The v1 function calls it with v1
    values.
  - A proposal counts as virtual exactly when its `schema_version` is 1 and the stored
    proposal for that Action has `schema_version` 2. This is safe because
    `unique(action_id)` means a stored v1 row cannot coexist, and virtual rows are never
    inserted.
  - For a virtual proposal, the core function receives:
    - `expected_output` built from the stored v2 candidate;
    - as disclosed, the union of every `REVEAL` in the turn.
  - The core refuses a virtual operation that is not equal to one of the stored
    operations `[S1]`.
  - The disclosed union applies to the narrative only. Operation texts stay strict, so a
    statement that mentions a fact revealed in the same turn is refused `[S2]`.
  - TypeScript mirrors both rules.
- **State `[R4]`.**
  - Pure per-operation delta functions, `(document, operation, actionId, position)`, in
    both SQL and TypeScript. They are applied in candidate order, followed by one clock
    bump and one narrative append.
  - Parity test: for every operation type, the delta plus one bump equals v1
    `expected_action_state` for the same v1 Action.
- **Materialization `[R9]`.**
  - The v2 branch expects N Events with ordinals 1..N.
  - Each Event's type, payload (with derived ids) and visibility come from its own
    display entry.

### Application, model and play

- **Domain.** `validateActionCandidate` validates v2 in three steps:
  1. the combination rules;
  2. each operation through the v1 path. The turn's disclosed union applies to the
     narrative only `[S2]`;
  3. the per-operation impact.
- **Domain schema.** A v2 candidate schema, as a discriminated union on `schemaVersion`.
  The gateway's output parser accepts it `[S5]`.
- **Database repository.** It writes the folded state and the ordered Events.
  `closureEventFor` and the confirm path's single-Event insert loop over operations and
  write `ordinal` `[S5]`.
- **Gateway.** Prompt v12 offers 1–4 changes under story freedom, together with the
  combination rules. One change is still returned as v1.
- **Web.** It lists every change. Direct play and Strict mode are unchanged.

### Tests before closure `[R11]`

- Domain combination rules.
- On real PostgreSQL, delta-plus-bump equivalence with v1 for every operation type.
- Mixed turns, with ordered Events and ordinals:
  - two `ADD_FACT`;
  - `REVEAL` plus `ADD`, with the narrative mentioning the revealed fact;
  - `OPEN` plus `RESOLVE`;
- An L3 impact from a PROTECTED shift inside a v2 turn.
- For each operation type, the virtual trial passes at exactly one level: `UPDATE` only at
  L3, `MOVE` only at L2. The dispatcher refuses if both levels pass `[S6]`.
- A `TRANSFORM_FAILURE` plus `ADD_FACT` turn, with distinct derived ids. A
  `TRANSFORM_FAILURE` plus `OPEN_THREAD` turn is refused.
- Forged v2 proposals refused, using the rolled-back forgery pattern of PX-4a, each with a
  positive control:
  - a v2 proposal before the epoch;
  - a v2 proposal with an underived id;
  - a v2 proposal with a wrong impact;
  - a hand-made virtual proposal;
  - a stored v2 candidate with an extra key, or with a mismatched `actionId` `[S1]`;
  - a narrative that mentions a fact revealed in the turn passes, while an `ADD_FACT`
    statement that mentions it is refused `[S2]`.
- The model-context digest is stable when a commit has several Events.
- Prompt compilation.
- Browser:
  - a multi-change turn and its Undo;
  - an old v1 Action page still renders.

### Risks

- **Size.** This is the largest SQL change since MGC-1.
  - It adds a column and a constraint swap on `domain_events`.
  - It refactors the evidence and the state function.
  - It copies and edits the roughly 100-line generation-context function `[S4]`.
  - The v1 effect validators stay untouched, but the evidence and state functions do not.
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
