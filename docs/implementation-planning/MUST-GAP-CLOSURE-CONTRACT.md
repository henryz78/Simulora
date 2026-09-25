# MUST-Gap Closure — Successor Implementation Contract (MGC-1)

**Status:** `CONTRACT — AUTHORIZED, NOT YET IMPLEMENTED` (2026-09-24).

**Why this exists.** The [IP-10 Requirement → Evidence Matrix](IP-10-REQUIREMENT-EVIDENCE-MATRIX.md)
found that two frozen `MUST` requirements have no implementation behind them:

- **PR-005:** there is no transformed failure.
- **NFR-006:** `LONG-01` cannot pass. There is no causal relationship change,
  and there is no open/resolved thread lifecycle.

The user chose to close these in a **separate, bounded track**, keeping the
frozen requirements as they are. IP-10 continues as validation only and adds
no features.

**Process.** This track runs on its own, in this order:

1. implementation;
2. real PostgreSQL, browser and migration regression;
3. independent review;
4. repair and re-review;
5. an IP-10 matrix update and a `LONG-01` run.

**Authority.** Nothing here changes a frozen Product, System or Experience
contract, and there is no new ADR. This contract applies the existing rules to
three missing operations:

- [Domain](../system-design/DOMAIN_STATE_AND_DATA_MODEL.md) §3, §4.5, §5.1–§5.5;
- [Runtime](../system-design/RUNTIME_MODEL_AND_PERSISTENCE.md) §6.3–§7 and §8 Restore membership;
- [Validation](../system-design/VALIDATION_STRATEGY.md) §3 (INV-05) and §5 (`LONG-01`);
- [PR-005](../product/PRODUCT_REQUIREMENTS.md) and NFR-006.

It follows the RE-3 successor pattern
([Routine Effect Contract](RE-3-ROUTINE-EFFECT-CONTRACT.md)):

- one closed operation per candidate;
- application and SQL validator parity;
- exact confirmation;
- one atomic ledger.

## 1. Decisions taken

The frozen documents did not settle two semantics, so the user decided them on
2026-09-24.

| Question | Frozen text | Decision |
|---|---|---|
| What are the "declared non-protected bounds" of an L2 relationship shift? | Domain §5.5: "an earned relationship shift within declared non-protected bounds" is L2; "high-consequence relationship redefinition that changes a declared protected … state" is L3 | **Closed scale plus protection class.** The World Revision declares each relationship's protection class (`PROTECTED` or `ROUTINE`; an undeclared class is `PROTECTED`, which fails closed) and an ordered scale of qualitative states. L2 is one adjacent step on a `ROUTINE` relationship. A step on a `PROTECTED` relationship, or a jump of more than one step, is L3. The model picks only a value from the declared scale and never writes the relationship's qualitative state as free text. A relationship with no declared scale cannot change. |
| Who decides that an attempt failed (PR-005)? | Runtime §7: "Failure may emit a transformed state and new thread rather than a terminal marker"; Validation §5.1: "at least one constraint that can produce transformed failure" | **The model proposes and the user confirms.** The World Revision declares causal constraints. The model may propose a transformed failure that cites a declared constraint. It then goes through the existing proposal → validation → exact confirmation → Commit path, and the user may reject it. |

Everything below follows from the frozen text and these two decisions.

## 2. What the World Revision may declare

All three sections are **optional**, so existing Worlds, the production seed and
Studio-authored Worlds remain valid and unchanged. They are structured product
fields (Domain §3: "causal constraints", "initial scoped facts/relationships").
The immutable World Revision is the authority for them, and nothing in play can
edit them.

| Field | Shape | Rules |
|---|---|---|
| `relationships[].protection` | `"PROTECTED" \| "ROUTINE"` | Optional. When omitted, the relationship is treated as `PROTECTED`. |
| `relationships[].scale` | 2–7 distinct short labels, ordered | Optional. Without a scale the relationship has no mutable state. |
| `relationships[].initialState` | one member of `scale` | Required exactly when `scale` is present. |
| `threads[]` | `{ id, title }` | Optional initial story threads. Stable IDs must be unique across the World. |
| `constraints[]` | `{ id, statement }` | Optional causal constraints. They are World rules with shared visibility (Runtime §6.3 item 2). |

In this track, protection classes, scales, threads and constraints are declared
through the World document API and test fixtures. World Studio authoring
controls for them are **not included**. They would be a separate authoring
decision. Relationships created in Studio today have no scale, so they stay
fixed. The UI must not imply otherwise.

## 3. State changes

State documents stay `schemaVersion: 1`. Existing State Revisions are never
rewritten (Domain §7). New fields are optional, so a parent document that lacks
them stays valid.

- **Relationship state.** A state relationship whose World relationship
  declares a scale carries `state`, its current scale value. Initialization
  copies `initialState` into it. Nothing else in a relationship changes in play.
- **Threads.** A new state section, `threads`, holds
  `{ id, title, status: "OPEN" | "RESOLVED", resolution? }`, where `resolution`
  is present exactly when the status is `RESOLVED`. This section is the
  authoritative open-thread state that Domain §4.5 calls `open_threads`.
  - Initialization seeds every declared World thread as `OPEN`.
  - A parent without `threads` means no structured threads.
  - Opening appends a thread, and resolving changes one thread's status. Both
    create a new State Revision. Earlier revisions keep the old value, and each
    change has its own Domain Event, so the history is append-only. No
    operation removes, retitles or reopens a thread.
- **Legacy `openThreads`.** The existing string array is not thread state. It
  starts as the starting situation and then receives each committed narrative.
  It keeps that exact behavior, because every existing materialization and
  Restore rule depends on it. It is reclassified as a **narrative trail**:
  - the UI stops presenting it as threads;
  - it never answers whether a thread is open or resolved.

  Renaming it would need a state schema version change, which this track
  does not make.

## 4. Closed operations

Each candidate still carries exactly **one** operation. The Action's
`requestedEffect` names the closed envelope the user asked for. The candidate
never carries an impact label; the validator derives the impact (Domain §5.5).

| Operation | Allowed under `requestedEffect` | Fields | Derived impact |
|---|---|---|---|
| `SHIFT_RELATIONSHIP` | `RELATIONSHIP_EFFECT` (requires `targetCharacterId`) | `relationshipId`, `beforeState`, `afterState`, `causalFactIds` (1–4) | L2 if the relationship is `ROUTINE` and the step is adjacent; otherwise L3 |
| `OPEN_THREAD` | `THREAD_EFFECT` without `targetThreadId` | `title`, `causalFactIds` | L2 |
| `RESOLVE_THREAD` | `THREAD_EFFECT` with `targetThreadId` | `threadId`, `resolution`, `causalFactIds` | L2 |
| `TRANSFORM_FAILURE` | any world-changing envelope (`FACT_REWRITE`, `ROUTINE_EFFECT`, `RELATIONSHIP_EFFECT`, `THREAD_EFFECT`); never `NO_WORLD_EFFECT` | `constraintId`, `outcome`, `newThreadTitle`, `causalFactIds` | L2 |

`targetThreadId` is a new optional Action payload field. It lets the user say
which thread the Action works toward. As with `targetCharacterId`, the user
chooses the target; the model cannot resolve a thread the user did not name.

### 4.1 Validation, identical in the application and in SQL

These rules add to the existing rules; they do not replace them. Existing
checks still apply to every operation:

- Action, head and response-source binding;
- the user-authority narrative guard;
- the excluded-fact leak guard, which now also covers every generated text
  field: `title`, `resolution`, `outcome` and `newThreadTitle`;
- causal fact IDs inside the compiled context.

**`SHIFT_RELATIONSHIP`**
- The response source is the selected Character.
- That Character is `fromCharacterId` or `toCharacterId` of the relationship.
  Runtime §6.3 includes the selected Character's own relationship state, and
  only that.
- The World relationship declares a scale.
- `beforeState` equals the current state at the expected head.
- `afterState` is a different member of the scale.
- Impact:
  - L2 if the relationship is `ROUTINE` and the scale index changes by exactly one;
  - L3 otherwise.
- A `PROTECTED` or undeclared relationship is never L2.

**`OPEN_THREAD`**
- The new thread's ID is derived by the server as `thread.<actionId>`. The model
  never names it.
- The title is 1–200 characters.

**`RESOLVE_THREAD`**
- `threadId` equals the Action's `targetThreadId`.
- That thread is `OPEN` at the expected head.
- `resolution` is 1–1,000 characters.

**`TRANSFORM_FAILURE`**
- `constraintId` names a constraint declared in the pinned World Revision.
- The only state effect is one new `OPEN` thread `thread.<actionId>` titled
  `newThreadTitle`.
- It makes no fact, relationship, location, participation, objective or
  resource change.
- `outcome` (1–1,000 characters) states the failure in world terms.
- At least one constraint must be declared. A World without constraints cannot
  produce it.

**Every operation** is rejected on:
- a stale head;
- an unknown ID;
- a mixed or extra field;
- a mismatched envelope;
- partial acceptance.

The server never repairs a candidate into validity.

### 4.2 What transformed failure is not

- A provider timeout, invalid output, safety refusal or validation failure
  stays exactly as Runtime §6.5 defines it: unresolved, `FAILED_RECOVERABLE`,
  `CONFLICT` or cancelled, with no state change. The server **never**
  synthesizes a `TRANSFORM_FAILURE` from a technical failure.
- It is a proposal. The model's claim that the attempt failed is not truth
  until the user confirms the exact effect. The user may reject it and try
  something else.
- It is available in Open-ended and Goal-framed Worlds alike. `LONG-01` runs in
  `GUIDED + OPEN_ENDED`. In V1 every declared constraint is recoverable, and no
  terminal failure marker exists (PR-015 is not selected).
- Direct, Guided and World-active rules are unchanged. The response happens
  inside the user's own Action, so it is never unattended initiative.

## 5. Commit, Events and recovery

Confirmation and Commit are unchanged:

- exact actor, digest and head confirmation;
- one terminal Action, Commit and State Revision;
- one Domain Event;
- attributed history;
- the Branch head advances;
- the existing successful-turn world-clock step;
- the narrative is appended to the legacy trail.

| Operation | Domain Event (`source_type` `USER`, visibility `SHARED`) | Payload |
|---|---|---|
| `SHIFT_RELATIONSHIP` | `RELATIONSHIP_SHIFTED` | `actionId`, `relationshipId`, `before`, `after`, `causalFactIds` |
| `OPEN_THREAD` | `THREAD_OPENED` | `actionId`, `threadId`, `title`, `causalFactIds` |
| `RESOLVE_THREAD` | `THREAD_RESOLVED` | `actionId`, `threadId`, `resolution`, `causalFactIds` |
| `TRANSFORM_FAILURE` | `ATTEMPT_TRANSFORMED` | `actionId`, `constraintId`, `outcome`, `threadId`, `causalFactIds` |

Every event carries its `cause_action_id`, so each relationship change and
thread keeps its cause link (`LONG-01`).

**Recovery (Runtime §8).**
- Relationships, including their `state`, are already restored.
- `threads` joins the Restore allow-list, so Restore brings back the thread
  statuses of the selected snapshot. As before, Restore appends a Commit and
  never truncates history.
- Fork copies the head state.
- Participation, boundaries and account-level data stay outside Restore.

**Correction.** Direct Correction and Removal remain fact-only, as they are
today. User correction of a relationship state (Domain §5.5, last row) is **not
added**: no MUST or `LONG-01` condition needs it. The UI must not suggest that
it exists.

## 6. Generation

**Deterministic adapter** (the default; no real provider):
- `RELATIONSHIP_EFFECT` shifts the first scaled relationship involving the
  selected Character by one step up, or down when it is already at the top.
- `THREAD_EFFECT` opens a thread titled from the intent, or resolves the
  targeted thread.
- `TRANSFORM_FAILURE` is produced only when the World declares a constraint and
  the requested effect cannot be carried out at the head:
  - no authorized route from the Character's location;
  - no scaled relationship for the Character.

  In that case it cites the first declared constraint. It never produces one
  for a failure of its own.

**Live adapter prompt.**
- It gains the same closed skeletons. `livePromptVersion` becomes 6.
- It may offer `TRANSFORM_FAILURE` as the alternative outcome of a
  world-changing envelope only when constraints are declared.
- No real provider is called in this track.

**Context.**
- The compiled context adds only what these operations need, and the SQL
  manifest re-derivation adds the same:
  - the selected Character's scaled relationships (their current state, scale
    and protection);
  - open threads;
  - declared constraints.
- Private facts are still filtered before generation.

## 7. User interface

**Action Composer.** New effect options appear only when they are usable:
- "Change a relationship of the selected Character", shown when that Character
  has a scaled relationship;
- "Open a story thread";
- "Work toward resolving: \<thread\>", one per open thread.

**Proposal review.** It shows the exact before and after for a relationship,
the thread title or resolution, or the constraint and new thread for a
transformed failure. The derived level is labelled L2 or L3.

**Current state and Return orientation.**
- Relationships show their current state and scale.
- Structured threads are shown as Open or Resolved.
- The legacy trail is labelled as recent developments.

**Accessibility.** The checks already in place apply at desktop and 390×844,
and every state is conveyed in text.

## 8. Out of scope

The following are not part of this track:

- an arbitrary effect DSL, or multiple operations per candidate;
- a general relationship engine, numeric relationship values, or creating or
  deleting relationships;
- a quest or objective system, completion states, or terminal failure
  (PR-015 is not selected);
- reopening, retitling or merging threads;
- long-term memory, summaries, retrieval changes;
- an autonomous scheduler, off-session change, or broad simulation;
- user correction of a relationship or thread;
- Studio authoring controls for the new fields;
- production live-model enablement or any real provider call.

## 9. Acceptance

The work is not complete until independent review passes on an exact SHA with
green CI.

- **Domain unit tests:**
  - schema round-trip, with old documents still valid;
  - the impact table for every protection/step combination, with model labels
    unable to lower it;
  - envelope mapping;
  - leak and authority guards on every new text field;
  - no transformed failure without a declared constraint.
- **Real PostgreSQL:**
  - application/SQL parity for every accept and reject case;
  - raw-SQL attacks: a forged impact, a forged thread ID, a resolve of a thread
    that is not open, a free-text relationship state, an undeclared constraint,
    a mixed effect, a wrong source, a stale head;
  - exact materialization and exactly one typed Event per Commit;
  - stale, duplicate, cancel and concurrency cases;
  - fork and Restore membership for threads and relationship state;
  - existing G3–G9 suites unchanged.
- **Migration:** successor `0048` only. The upgrade test covers a prior-schema
  database with in-flight Actions, and old documents remain valid.
- **Browser:** each new effect goes from compose through review, confirm and
  the visible result, and a transformed failure is rejected on another run.
  Desktop, 390×844 and the full five-project matrix in CI.
- **Evidence afterwards:** after review passes, the IP-10 matrix rows for
  PR-005, PR-004/007 `E2E-CONTINUITY-IMPACT`, INV-05 and NFR-006 are updated,
  and `LONG-01` is built and run.
