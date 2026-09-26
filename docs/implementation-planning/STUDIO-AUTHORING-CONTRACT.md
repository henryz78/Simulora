# SA-1 Studio Authoring Contract

**Date:** 2026-09-25 · **Status:** `APPROVED 2026-09-25 — IMPLEMENTED (behavior `512ea30`), RE-REVIEW PENDING`; see [SA-1 Implementation Report](SA-1-IMPLEMENTATION-REPORT.md).
The product owner agreed to track A in principle
([G10 External Decision Packet](G10-EXTERNAL-DECISION-PACKET.md) §5).
Implementation starts only after this contract is approved, and closes only
after an independent Review passes on an exact SHA with green CI.

## 1. Problem

MGC-1 added three optional World fields, but its §8 left Studio authoring out
of scope:

- **Relationship scale:** `protection`, `scale` and `initialState`.
- **Story threads:** `threads`.
- **World rules:** `constraints`.

A creator using the formal UI therefore cannot build a World in which
relationships change, threads resolve or rules shape outcomes. Only the API
can, and E2E-CONTINUITY-IMPACT had to create its World through
`POST /v1/worlds`. This narrows the long-term AI World direction
([Product Direction Guardrails](PRODUCT_DIRECTION_GUARDRAILS.md)).

## 2. What already exists (verified in code)

- **Draft contract:** `updateWorldDraftRequestSchema` →
  `worldDocumentInputSchema` (`packages/contracts`) already accepts every
  field.
- **Server validation:** the Draft save (`updateDraft`) already parses the
  full `worldDocumentSchema` (`packages/domain`). A save that breaks any of
  these rules is refused, and the saved Draft stays unchanged:
  - a scale has 2–7 distinct labels of at most 60 characters;
  - `initialState` must come from the scale;
  - a scale and `initialState` are present together or not at all;
  - all stable IDs are unique;
  - thread titles are at most 200 characters.

  This was corrected during implementation. The first draft of this contract
  said such errors come back as playability findings; they come back as a
  refused save.
- **Play:** Action Composer, the worker, confirmation, Change Trace and Return
  already handle these fields (MGC-1 and `1629a2c`).

This track is therefore **web only**. It has no schema, contract, migration,
worker, model or authority change.

## 3. Scope

All changes are inside `WorldStudioPage` / `StudioCoreFields`
(`apps/web/src/pages.tsx`) and `styles.css`.

### 3.1 Relationship: "Can this relationship change during play?"

(Shipped with the shorter legend "Changes during play" so it wraps at 320 px.)

For each relationship:

- **No (default):** the relationship is fixed. `scale` and `initialState` are
  omitted, as today.
- **Yes:** show these controls.
  - **States, in order:** one per line, from 2 to 7 lines. Turning it on
    prefills three editable labels, for example `distant`, `neutral` and
    `close`.
  - **Starting state:** a select limited to the listed states.
  - **How change is confirmed:**
    - `ROUTINE`: "a one-step change you confirm";
    - `PROTECTED`: "only with an explicit high-consequence confirmation".

    The label text follows the MGC-1 impact table. When the choice is left
    unset, `protection` is omitted and the World means `PROTECTED`.
- **Turning Yes back to No** removes `scale` and `initialState`. It never
  touches play already in progress: a Revision is immutable, and an existing
  Continuity keeps its pinned Revision.

### 3.2 Story threads at the start

- Add, rename and remove threads, with a title of at most 200 characters.
- New IDs follow the existing Studio pattern (`crypto.randomUUID()`).
- Threads start `OPEN` in play. Studio does not set status.

### 3.3 World rules

- Add, edit and remove `constraints` statements.
- Explanation copy states what a rule does: an Action that meets it is
  transformed, and a new thread opens (MGC-1).

### 3.4 Invariants of the change

- **Preserve unseen fields.** Studio keeps any field it does not display.
  Opening and saving a Draft authored by the API loses nothing.
- **Never send a rejected shape.** The Draft never sends a document that the
  input contract or the World schema would refuse for these fields. The count
  is bounded by the controls (2–7). An empty or duplicate state name, an empty
  thread title or an empty rule shows an inline message and disables save, so
  it never causes a failed request. The server stays the validation truth for
  everything else.
- **Remove dependents.** Removing a Character still removes its relationships
  (existing behaviour).
- **Only an existing Revision path.** A World reaches play only through the
  existing Draft → validation → Revision → "Begin play" path.

## 4. Out of scope

- Any new effect kind, relationship engine, numeric values, or creation or
  deletion of relationships during play.
- Reopening or retitling threads during play, and quest or completion state
  (PR-015 is not selected).
- A relationship or thread correction by the user.
- Revision adoption or merge into an existing Continuity.
- Production live model use, and any real provider call.

## 5. Acceptance

### Web mock-API e2e (desktop and 390×844)

- Toggling a scale on and off.
- The states limits: fewer than 2 and more than 7.
- The starting-state select follows edits to the states.
- A thread and a rule can each be added, edited and removed.
- An API-authored Draft round-trips with no field lost.
- axe, keyboard-only and 320 px reflow on the new controls.

### Real PostgreSQL

A Draft carrying all three field groups:

- saves;
- validates to `VALID`;
- becomes a Revision whose document equals the Draft.

A save with an invalid scale is refused, and the saved Draft is unchanged
(aligned with §2 after review M4).

### Real stack (container step, desktop and 390×844)

A World authored **entirely in Studio** in the browser, with no
`POST /v1/worlds`:

1. A routine scaled relationship, a protected one, a thread and a rule.
2. A Revision, then Begin play.
3. A routine relationship shift is confirmed; the protected one is refused.
4. The thread is resolved.
5. Return shows each outcome.

### Review

Exact-SHA CI green, then an independent Review with no BLOCKER or IMPORTANT
finding. The implementer does not approve its own work.
