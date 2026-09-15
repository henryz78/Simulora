# RE-2 Context Reality Check

**State:** `AUTHORIZED / PAUSED — PROVIDER HTTP 429 / 1 OF 8 DISPATCHES`.
The user accepted the proposed maximum-eight-call experiment. This is not RE-3,
full RE-4 human play, IP-7 or production live enablement.

Behavior under test: `3d14dc6792e406ce4c054ee01f4b424b00c27053`.
Independent closure: [RE-2 Review](RE-2-INDEPENDENT-REVIEW.md).
Production code/migrations/schema/authority stay unchanged. The existing runner
has a `--re2` isolated session under ignored `.local-data/re2-context-reality/`;
old Spike evidence/session are preserved. Every dispatch, including errors, counts
toward eight. Same supplied ignored profile/model and existing provider settings;
no substitution, automatic retry, hidden reasoning or real account data.

## Fixed sequence

1. Iora, current enriched compiler input: response to an unsafe invitation.
2. Same source snapshot/actor/model/schema without the new `context` field:
   read-only predecessor-style contrast, not applied or accepted as current truth.
3–4. Tavi, same initial head, corresponding enriched/minimized comparison.
5–6. Iora, safe inspection then follow-up: inspect whether an actually confirmed
   first result enters eligible committed history and grounds the next response.
7–8. After a separately reviewed direct Correction to a green signal: Iora and
   Tavi, inspect current truth versus history-only starting background.

Both Characters know the supported first shared target; each has one distinct
CONTINUITY_PRIVATE synthetic fact, never shared with the other. ACCOUNT_PRIVATE
sentinel stays outside all prompts. Contrast only removes `context`: it retains
the same selected actor, motives/known facts, intent and output envelope. This is
not replaying old binary behavior or demonstrating model-level causal certainty.

Executable calls traverse durable ACK/proposal validation; the main Agent makes
and records explicit synthetic test-actor confirm/cancel decisions after inspecting
actual proposal text. Contrast never enters a writer. A rejected/unsupported
response remains a failure/outcome, not an invitation to repair model output or
weaken a validator. Quota/routing/privacy failure stops execution; no ninth call.

## Results to record

Total dispatches, model/profile identity without credentials, latency/reported
usage, selected source IDs/hash, actual excerpts, proposal/Commit decisions,
before/after heads, grounding/knowledge/refusal observations, unsupported effects
and guard false positives. A tiny non-randomized corpus cannot prove a statistical
improvement, long-lived AI World, semantic privacy or provider suitability.

## Actual attempt and pause

The first enriched Iora request was dispatched on `2026-09-15`. Requested model:
`deepseek-ai/DeepSeek-V4.1-Flash`, using the supplied profile and unchanged provider
settings (`enable_thinking: false`, JSON output, max 4096 completion tokens).
The provider returned **HTTP 429**, without a usable model output. No retry,
repair, contrast, model substitution or later scenario was dispatched. Requested
identity is known; returned model identity and token usage are unavailable.
HTTP 429 alone does not distinguish daily quota exhaustion from transient rate
limiting. No provider error body/credentials were printed or retained in reports.

Actual durable Action `3eaf1f74-9062-488c-a624-b38e9f0a842b` was ACKNOWLEDGED,
then remained GENERATING in the existing available-retry lifecycle after the
provider failure. The main Agent explicitly cancelled it as synthetic test actor;
final status **CANCELLED**, no proposal and no Commit. State read confirms initial
head `dee614ef-dd28-47b0-8ce3-9b8ea620a497` unchanged, signal still dim,
GUIDED/Open-ended unchanged, Return FRESH and no unresolved Actions.

Only the fresh synthetic database/session was written. Historical Spike evidence
was not overwritten. The experiment's ignored local evidence journal records one
dispatch, one provider error and explicit cancellation. No actual scene excerpt,
context-quality improvement, causal continuation or comparison outcome exists
yet; this is an external availability pause, not evidence that the product or
model grounding failed. **Remaining total budget: seven dispatches**; failed
requests are not refunded from the cap. On resume, narrow the sequence/report
coverage rather than exceed eight; if the model changes, label a new comparison
arm and do not compare samples as though profile/model were held fixed.

Runner changes are experiment-only: `--re2` chooses a separate session and cap,
requires explicit fixture Character, and `contrast` removes only the new context
for a read-only same-snapshot candidate. Broader-envelope shadow commands are
refused in RE-2 mode. The predecessor-style helper does not mutate original
requests. No production provider entrypoint, migration, writer or validation was
modified.

Preparation checks: format, lint, typecheck, architecture and 29-migration checks
PASS; runner tests **2/2 PASS**; default suite **56 PASS / 116 DB-dependent skips**;
fresh real PostgreSQL initialization, durable ACK, explicit cancel and unchanged-
head read PASS. Initial lint identified an unused destructured field (its local
formatter also errored); a JSON diagnostic confirmed the single unused-variable
finding, which was removed without changing dependency configuration. No full
production/PG/browser regression is claimed for this experiment-runner-only edit.

Next input: update the ignored local profile or confirm provider availability.
Do not retry automatically, send keys in chat, infer quota/pricing guarantees or
proceed into RE-3/IP-7 while waiting.
