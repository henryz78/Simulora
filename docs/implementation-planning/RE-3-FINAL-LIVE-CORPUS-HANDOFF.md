# RE-3 Final Live Corpus Handoff

> **Historical provider-failure checkpoint:** This report records the earlier
> 429/404/route-identity failures and intentionally remains unchanged as
> provenance. The later compatible-profile corpus and final bounded closure
> supersede its partial current-status wording; see the [closure handoff](RE-1-RE-3-PRODUCT-REALITY-CLOSURE-HANDOFF.md).

## Scope

This was a bounded Product Reality corpus against the already approved browser
path. It used the isolated PostgreSQL session and the existing non-production
live-model seam. No production live provider was enabled, no model output was
edited, and no retry loop was used.

## Baseline and independent review

- Behavior baseline: `348106f3ad567f61bb81f914c86f47d211be2e36`
- Exact-SHA CI: run `35405211953` — PASS (migration, PostgreSQL, quality,
  container smoke, desktop, and 390x844 browser checks)
- Independent reviewer: GPT-5.6 Luna max — `GATE PASS`, 0 BLOCKER, 0
  IMPORTANT, 0 MINOR, ready for the finite corpus

## Live dispatch result

The first corpus request was submitted through the formal browser/API path:

- selected Character: Tavi
- requested effect: `NO_WORLD_EFFECT`
- expected head: `1f37ae63-e64d-44d3-bc34-15a03c9b605f`
- provider/model: the configured isolated profile (`deepseek-ai/DeepSeek-V4.1-Flash`)
- result: provider HTTP `429`
- model output: none
- proposal: none
- Commit: none

The Action remained a durable, recoverable `GENERATING` record after the
provider rejection. It was then explicitly cancelled as `USER_CANCELLED`; this
was not treated as a successful response-only result. The isolated database
ended with one prior movement Commit, one cancelled Action, zero pending
Actions, and unchanged Branch head `1f37ae63-e64d-44d3-bc34-15a03c9b605f`.

The user later supplied a replacement OpenAI-compatible profile with the same
model and concurrency 1. One additional bounded request was made through the
same formal path. The provider returned HTTP `404` for the normalized
`/v1/chat/completions` route before producing output; there was again no
proposal or Commit. That Action was explicitly cancelled as `USER_CANCELLED`.
No alternate endpoint probing or automatic retry was attempted.

After the user clarified the provider's exact model identifier as
`deepseek-V4.1-flash`, one final bounded dispatch was made. The endpoint did
return a response, but its declared model identity differed from the requested
identity. The runner therefore issued a `MODEL_ROUTE_CHANGED` hard stop before
parsing the body. There was no proposal or Commit; the Action was explicitly
cancelled. The route-identity guard was not relaxed.

## What this proves

- The live seam reaches the formal browser submission path and records the
  selected Character/effect and expected head durably.
- A provider rate-limit failure does not create a proposal or mutate World
  truth; explicit cancellation restores a terminal, understandable state.
- The repository/domain/PostgreSQL and browser tests for successful
  `COMPLETED_NO_EFFECT`, movement continuation, exact L3 confirmation, and
  fail-closed malformed/protected output remain green in the exact-SHA CI and
  independent review.

## What remains unproven

This corpus did not obtain a usable, identity-stable real provider response, so it does not prove a
successful real-model `COMPLETED_NO_EFFECT` dialogue, a post-dialogue live
context continuation, or a second Character's live attribution. The Product
Reality Gate therefore remains **PARTIAL**, blocked by provider availability /
routing rather than a newly observed authority or persistence defect.

When the provider is available again, the shortest bounded follow-up is one
Tavi `NO_WORLD_EFFECT` request from the committed lookout state, followed by
one Iora response-only request and one L3 exact-confirmation request. Stop on
the first provider 429/route failure; do not silently retry or change the
provider/model.

IP-7, production live-model enablement, new effect types, and durable-memory
redesign remain out of scope.
