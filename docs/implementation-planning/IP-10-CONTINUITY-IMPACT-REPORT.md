# IP-10 E2E-CONTINUITY-IMPACT and the Trace Presentation Repair

**Date:** 2026-09-25 · **Scope:** IP-10.2 `E2E-CONTINUITY-IMPACT`, plus one
bounded presentation repair that the product owner authorized ·
**Evidence:** CI `36207364368` on `b3c914d` (`success`).

## 1. The scenario

`tests/stack/first-action.spec.ts` › "a caused change, a protected refusal and
a correction agree across review, Trace, Explanation and Return".

It runs in a real browser (desktop and 390×844) against the API and worker
containers, PostgreSQL and the object store, with the deterministic adapter;
no real provider is called.

**Why the World comes from the API.** It is created through the formal
`POST /v1/worlds` API, because Studio does not author relationship scales or
threads (MGC-1 §8). Everything after that happens in the browser: Studio
validation, the Revision, "Begin play", the Actions, confirmation, the
Correction, Explanation, Change Trace and Return.

It covers the rows of [Validation §4.1](../system-design/VALIDATION_STRATEGY.md)
that the product implements:

| §4.1 requirement | What the scenario proves |
|---|---|
| A routine L2 world change commits with a causal explanation | Iora's relationship proposal shows "Relationship · Iora and Tavi", wary → cordial, "L2 — bounded routine change". Nothing changes before confirmation, then there is one `RELATIONSHIP_SHIFTED` Commit. Change Trace names the relationship, the before → after, and "From your Action: …". |
| Protected relationship redefinition is blocked unless the user authorizes it directly against the current head | Tavi's first scaled relationship is PROTECTED, so the proposal is labelled "L3 — protected or high-consequence change". Cancelling leaves it `unsworn`, with no Commit and no history entry. |
| A thread change from an Action | A thread-resolution Action gives one `THREAD_RESOLVED` Commit, and the thread shows "Resolved" in context and on Return. |
| Direct correction creates exactly one audited Commit/Event | A correction through the fact's Explanation gives exactly one `CONTINUITY_ITEM_CORRECTED`, and it is the head Commit. |
| Source, cause and impact agree across surfaces | Action statuses are exactly three `COMMITTED` and one `CANCELLED`. The Commit Explanation's source equals its Trace entry. The fact Explanation names the correction Commit, `SHARED`, "Current projection". The Continuity history links the Action to its own Commit. Return shows the corrected fact, "now cordial", "now unsworn" and the resolved thread, and passes the accessibility check. |

**Rows covered elsewhere or with no operation.** User-authored fact *removal*
uses the same direct-correction route. This scenario does not exercise it;
`ip4-adversarial` covers correction and removal on real PostgreSQL. Scope
widening and canonical Memory Candidate promotion
have no operation in the product, so they cannot be exercised; INV-05 records
this.

## 2. What the scenario found, and the repair

Truth was correct throughout. Three gaps in what a person could see after a
Commit went against PR-007 ("consequential change shows source, reason,
scope, impact handling and recovery"):

1. **Change Trace gave MGC-1 Events only a generic summary.** Relationship
   shifts, thread openings and resolutions, and transformed failures all read
   "A committed change was recorded on this path", with no target, no before
   → after and no cause.
2. **Change Trace printed a raw UUID as the reason.** The reason is an opaque
   Action token, and the page showed it as-is.
3. **Continuity "Meaningful changes" lost its links after a reload.** It
   labelled current Commits "Historical record retained." and gave them no
   link, because the branch history carries no Commit ID.

On 2026-09-25 the product owner authorized a minimal presentation repair.
It is `1629a2c`, a behavior commit:

- **Server** (`packages/database`):
  - `eventSummary` states the four MGC-1 Events in the payload's own words:
    before → after, the thread title or resolution, or the constraint
    outcome.
  - The trace sets the existing optional `targetId` from the Event's
    relationship, constraint or thread.
  - No contract shape, table, migration or authority rule changes. The reason
    token stays opaque on the API.
- **Web** (`apps/web`):
  - Change Trace shows "From your Action: <intent>" from the branch history,
    and names each Event's target through the existing `describeTarget`.
  - Continuity resolves each Action's Commit from the trace, so its link
    survives a reload.
  - The fallback label now says "Recorded on this path."

The real-stack scenario asserts each of these. The earlier cross-capability
journey needed one test-only selector scope, because the history entry is now
a link as well.

A pre-existing race in `ip9-model-provider`, a fixed 400 ms wait, failed
once in CI `36207082639`. `b3c914d` fixes it in the test only.

**Not changed (observation):** the RE-3 `CHARACTER_MOVED` summary still
lists raw Character, location and fact IDs. That text is approved RE-3
behavior outside this repair's authorization.

## 3. Review

The final IP-10 engineering review passed `1629a2c` as presentation only
(0 BLOCKER / 0 IMPORTANT); see [IP-10 Final Engineering Review](IP-10-FINAL-ENGINEERING-REVIEW.md).
