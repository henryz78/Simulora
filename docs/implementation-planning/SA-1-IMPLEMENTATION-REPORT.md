# SA-1 Studio Authoring: Implementation Report

**Date:** 2026-09-25 · **Contract:**
[SA-1 Studio Authoring Contract](STUDIO-AUTHORING-CONTRACT.md) ·
**Behavior SHA:** `512ea3097a0e05b6185ae72fb3a88106fe1821e7` (first reviewed at `986a710`) ·
**Evidence:** exact-SHA CI `36218066242` `success` (earlier `36216503345`) ·
**Review:** first review `PASS WITH ISSUES` (0B/0I/4M); minors fixed in
`512ea30`; focused re-review `PASS` (0B/0I/2M, accepted). **SA-1 CLOSED** (§6).

## 1. Commits

| Commit | Kind | What |
|---|---|---|
| `9d8da44` | behavior | Studio controls for relationship states, story threads and world rules, and the tests |
| `66894fc` | test only | The stack journey checks that the authored rule reaches play, instead of moving a Character (see §4) |
| `986a710` | behavior | Studio fieldsets shrink and legends wrap at 320 px (WebKit); the relationship legend is shorter |
| `512ea30` | behavior | Review minors M1–M4 (§6) |

## 2. What changed

Only `apps/web/src/pages.tsx` (`StudioCoreFields`, `WorldStudioPage`) and
`apps/web/src/styles.css` changed. There is no schema, contract, migration,
API, worker, model or authority change.

### 2.1 Relationship ("Changes during play")

- **No** omits `scale` and `initialState`. It keeps any `protection` already
  on the Draft.
- **Yes** prefills the states `distant`, `neutral` and `close`, starting at
  `neutral`.
- **States:**
  - one input per state;
  - add and remove controls, bounded to 2–7;
  - at most 60 characters each.
- **Starting state:** a select limited to the states.
  - It follows its state by position: renaming or removing that state carries
    the starting state along.
  - The first version said a momentary duplicate name never moves it. That was
    true only for whole-value edits: typing a name keystroke by keystroke
    through a duplicate could still move it (review M1). `512ea30` stores the
    position, and a keystroke test fails on the earlier code.
- **Confirmation:**
  - `ROUTINE`: "one step is an ordinary confirmation";
  - `PROTECTED`: "any change needs a high-consequence confirmation".
  - When `protection` is unset, the select shows `PROTECTED`, which is what the
    World means.

### 2.2 Threads and rules

- **Story threads at the start:** add, rename and remove; titles of at most
  200 characters.
- **World rules:** add, edit and remove.
- **Empty lists:** removing the last thread or rule omits the field, so a
  World without threads stays byte-identical to one that never had them.

### 2.3 Save guard

The Draft save runs the full World schema, and it refuses the whole save on
these errors: empty or duplicate state names, an empty thread title, or an
empty rule.

Studio therefore shows an inline message, disables **Save Draft** and
**Create Draft**, and links the message with `aria-describedby`.

Corrected in the contract: its first draft said these errors come back as
playability findings.

## 3. Evidence (CI `36216503345` on `986a710`)

**Real PostgreSQL:** 171/171, and the IP-5 suite 295/295. The IP-5 suite
includes the new `ip7-world-studio` case:

- a Draft with a routine and a protected scaled relationship, a thread and a
  rule saves unchanged;
- it validates `VALID`;
- it becomes a Revision whose stored document equals the Draft;
- a scale whose starting state is not one of its states is refused at save,
  and the Draft is unchanged.

**Browser matrix:** 200 passed across five projects, including the new SA-1
Studio case on desktop Chromium, 390×844 Chromium, Firefox, WebKit 390×844 and
tablet. The case covers:

- the toggle, the 2–7 limits, and the starting state following renames and
  removals;
- the duplicate-name and empty-title guards (save disabled);
- an API-authored field surviving save;
- clearing back to a fixed relationship;
- axe and 320 px reflow; keyboard-only operation of the toggle, remove and
  save controls (added in `512ea30`; before that, only the first focus ring was
  checked, review M3).

**Real stack:** 8/8 on desktop and 390×844. They include "a World authored
only in Studio plays relationship states, a thread and a rule", with no
`POST /v1/worlds`:

1. Studio authors two added Characters, a protected and a routine scaled
   relationship, a thread and a rule.
2. A Revision is created, and play begins.
3. The routine relationship shifts one step (L2).
4. The protected one asks for L3; cancelling leaves `unsworn`.
5. The played World carries the rule and thread exactly.
6. The thread resolves.
7. Return shows "now close", "now unsworn" and the resolved thread.

## 4. Findings outside SA-1 (not changed)

Both are pre-existing, found while building the stack journey:

1. **Movement cannot succeed on a Studio World.**
   - `ROUTINE_EFFECT` needs a revision-bound `simulora.re3_routine_policies`
     row. Only tests and operators insert it, and Studio never creates one.
   - On a Studio World the Composer still offers "Have this character move",
     and the Action ends `FAILED_RECOVERABLE` (CI `36214521468`).
   - Consequence: with the deterministic adapter, a Studio-authored rule can
     never fire, because transformed failure comes from impossible movement or
     a missing scaled relationship, and the Composer hides the latter.
   - A fix touches movement authorization, so it needs the product owner's
     approval.
2. **An added Character cannot be addressed until it knows a fact.**
   - RE-2 authorized context refuses the Action with `WORLD_NOT_PLAYABLE`
     ("cannot know this Action target").
   - The page shows only "The Action was not accepted".
   - The stack journey gives Character 3 knowledge of the opening fact.

Both would affect human play on Studio Worlds (track B). They are recorded
here and not repaired.

## 5. Not claimed

- No model provider was used by SA-1. A single connectivity call to the owner's
  new OpenAI-compatible endpoint confirmed that JSON mode works (HTTP 200,
  about 3 s). No play was run on it.
- Beta, launch and production live model use remain unauthorized.

## 6. Independent Review

A new independent Reviewer returned `PASS WITH ISSUES`: 0 BLOCKER,
0 IMPORTANT, 4 MINOR. SA-1 can close.

**Commit verdicts:**

- `9d8da44`: PASS, subject to the minors;
- `66894fc`: PASS, a legitimate harness correction. The movement claim was
  verified in code and in 0048 SQL;
- `986a710`: PASS.

The Reviewer verified CI `36216503345` and the two earlier failures itself.

| # | Finding | Resolution in `512ea30` |
|---|---|---|
| M1 | The starting state could move when a name was typed through a duplicate, and the report overstated the fix | Position stored; keystroke test added; report corrected (§2.1) |
| M2 | Rules had no 4000-character limit in the UI | `maxLength={4000}` |
| M3 | The keyboard evidence was overstated | Keyboard-only steps added; report corrected (§3) |
| M4 | Contract §5 still said an invalid scale "returns a blocking finding". The save-blocking message was tied only to a disabled button. | Contract §5 aligned with §2; the message is `aria-live="polite"` |

The Reviewer also flagged a product-direction point. Studio's rules copy
promises a transformed outcome. That cannot happen on a Studio World with the
deterministic adapter, because movement needs an RE-3 policy (§4). It is not an
SA-1 defect.

**CI for the fixes:** exact-SHA CI `36218066242` on `512ea30`, `success`.
**Next:** a focused re-review by the same Reviewer.

### Focused re-review of `512ea30`: `PASS`

The same Reviewer returned `PASS`: 0 BLOCKER, 0 IMPORTANT, 2 MINOR. SA-1
closes, and the approved behavior SHA is
`512ea3097a0e05b6185ae72fb3a88106fe1821e7`.

- **M1–M4:** confirmed fixed, with no scope creep. The ref-based tracking is
  safe under:
  - StrictMode;
  - a stale position after load, restore or a STALE_DRAFT reload;
  - relationship removal.
- **CI:** the Reviewer verified exact-SHA CI `36218066242`:
  - real PG 171/171 and 295/295;
  - migrations passed;
  - stack 8/8;
  - browser matrix 200, with no retries.

**Remaining minors, accepted as follow-ups:**

- **m1:** the save-blocking message is rendered only while a problem exists,
  so many screen readers will not announce it when it appears. The fix is to
  always render the live region and fill its text. This is not changed here,
  so the approved SHA stays stable.
- **m2:** the §1 commit table lacked `512ea30`. It is fixed in this
  documentation commit.

**Observation:** while two states share a name, the Starting state select
shows the first match. This is visual only, and save is blocked meanwhile.

