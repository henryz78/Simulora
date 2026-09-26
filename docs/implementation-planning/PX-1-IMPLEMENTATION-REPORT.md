# PX-1 Play Experience: Implementation Report

**Date:** 2026-09-26 · **Contract:**
[PX-1 contract](PX-1-PLAY-EXPERIENCE-CONTRACT.md) · **Source:**
[Play Weight Health Check](PLAY-WEIGHT-HEALTH-CHECK.md) · **Behavior SHA:**
`2a860ec965429a3f287a2b2941de71dcea90d48f` · **Evidence:** exact-SHA CI
`36261851203` `success` · **Review:** new independent Reviewer (Sonnet 5)
`PASS WITH ISSUES` (0B/0I/3M, accepted). **PX-1 CLOSED.**

## 1. What changed

- **Play page:**
  - "Story so far" lists every finished turn, committed or response-only, with
    its reply, from the existing branch history.
  - A confirmed reply stays on the latest outcome.
  - Status and size-of-change text is in player language.
- **Composer:** "Just talk or look" is the default and first choice. The
  submitted contract is unchanged, and world changes still need exact
  confirmation.
- **Home:** a player's entry with "Continue playing" and "Your worlds", from a
  new owner-scoped `GET /v1/me/library`. It returns ACTIVE Continuities and
  undeleted Worlds, at most 50 each. The access sweep declares it self-scoped
  and checks that it leaks nothing.
- **Studio:** the back link reads "Home"; findings name their area; the
  knowledge warning has no doubled punctuation.
- **SA-2 follow-ups:**
  - M1: the knowledge message matches the RE-2 refusal message.
  - M2: the start response carries `routineMoverIds`.
  - M3: the route option says it is one way.

## 2. Evidence (CI `36261851203` on `2a860ec`, real `postgres:17`)

- `test:postgres` 181/181 (178 + 3 PX-1).
- IP-5 suite 310/310.
- Real stack 10/10, including the home page leading back into a Continuity
  and a recorded turn keeping its reply after reload.
- Browser matrix 215 passed across five projects, no retries or skips.

## 3. Independent Review

The Reviewer verified the CI run itself and found no frozen semantics
changed.

- **Library:** owner-scoped and eligibility-checked. Tombstoned Continuities
  and those of deleted Worlds are excluded. The joins cannot duplicate rows.
- **Composer default:** sending `NO_WORLD_EFFECT` explicitly is required,
  because the server defaults an omitted effect to a fact change.
- **Test edits:** no assertion was loosened.

| # | Finding | Disposition |
|---|---|---|
| M1 | `updateHistoryForAction` prefers the cached narrative over the action's, the reverse of `mergeBranchHistory`. No current path gives one Action two narratives. | Accepted; flip the precedence in the next change to that file. |
| M2 | The library is limited to 50 per list, with no pagination. | Accepted; paginate if players exceed it. |
| M3 | `findingArea` falls back to "World" for unmapped paths, untested. | Accepted. |

Test gaps noted, not claimed: no unit test for the narrative-merge
precedence, no 50-row boundary test, no unauthenticated-caller test for the
library (it uses the shared authentication helper).

## 4. Not claimed

- Human enjoyment.
- Any provider approval.
- Beta, launch or production live model use.
