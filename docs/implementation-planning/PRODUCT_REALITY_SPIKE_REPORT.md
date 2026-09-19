# Bounded Live Model / Product Reality Spike — Actual Results

> **Historical initial-spike report:** Its recommendation and PARTIAL verdict
> describe the first bounded experiment. Later RE-1–RE-3 engineering and
> isolated corpus closure supersede that current-status wording; the original
> samples and limitations remain evidence. See the [final closure handoff](RE-1-RE-3-PRODUCT-REALITY-CLOSURE-HANDOFF.md).

**Execution:** `2026-09-15`, single-operator local experiment.

**Verdict:** `EXPERIMENT COMPLETE / PRODUCT REALITY ONLY PARTIALLY DEMONSTRATED`.

**Recommendation:** approve a bounded runtime-enablement follow-up before IP-7;
do not start that follow-up or change the roadmap automatically.

**Approved production baseline:** `eb55734f258fc9be6f4837df888700e34eaa67e2`.
**Preparation started from documentation HEAD:** `085d7838a2baa58824d486227136cdf9a56585b3`.
Production `apps/`, `packages/`, migrations and frozen Prototype were not modified.
The existing independent G1–G6 decision is preserved, not replaced by this Spike.

Scope and decision rules: [Spike Plan](PRODUCT_REALITY_SPIKE_PLAN.md).
Current authorization/status: [Implementation Handoff](IMPLEMENTATION_STATUS_HANDOFF.md).

## 1. Executive result

This was not a JSON-only model demonstration. Real responses traversed durable
ACK → existing repository worker lease/context compiler → schema/authority
validation → proposal → separately reviewed exact confirmation → PostgreSQL
Commit. Direct Correction, Return projection rebuilding, Safe Point, fork,
branch selection and append-only Restore used the existing repository too.

The authority spine worked in this sample. Iora produced a coherent short
sequence and credible refusal; subsequent generation used corrected current
facts. No output became authoritative merely by being generated. One unsupported
inference was explicitly rejected by the test actor, not hidden by retrying.

The playable-world promise is **not yet qualified**. Current context/routing and
single-fact mutation impose visible limitations. All eight valid ordinary Action
proposals were L3, including dialogue and refusal. A newly reproduced Return
display defect also survives a FRESH rebuild. Richer shadow responses demonstrate
possible alternatives, but also unsupported detail and inconsistent effect
labels; none was applied.

No production live adapter, IP-7, deployment or frozen-contract change occurred.
This is agent-operated evidence, **not a human usability study or G9/G10 approval**.

## 2. Provider, isolation and request accounting

- User-supplied compatible provider: ModelScope, `api-inference.modelscope.ai`.
- Requested model: `deepseek-ai/DeepSeek-V4.1-Flash`, preserved exactly.
- Every response model field matched that requested string. This does not
  independently certify the provider's actual weights or hosting provenance.
- Credentials were loaded only from ignored `.secret.txt`; no key in prompts,
  logs, committed reports or command arguments. `.secret` / `.secret.*` ignore
  Git/Docker ignore rules were added because the actual local file originally was
  not ignored; local container contexts must not carry it either.
- HTTPS Chat Completions, redirects forbidden, JSON output, 4,096 completion-token
  ceiling, 48,000 prompt-character ceiling, 120-second timeout; 16-dispatch scope cap.
- User authorized public API quota usage, with a stop/contact instruction at
  provider quota. No currency price or unlimited financial budget was inferred.
- Separate PostgreSQL 17.11 database: `simulora_reality_e0966c93c468`, local port
  55432, synthetic adult actor and original Lantern Reach fixture only.
- Fixture adds Tavi, a waiting-vessel SHARED fact and an ACCOUNT_PRIVATE synthetic
  sentinel outside Character knowledge. No real personal/private account content.
- Runner: `scripts/product-reality-spike.ts`, outside production composition;
  existing `ActionGenerator` injection, no new dependencies or migrations.

Actual usage: **12 dispatches**, **12,865 prompt tokens**, **9,704 completion
tokens**, **22,569 total tokens**, as reported by the provider. Quota was not hit.

| Arm                              | Calls | Result / reported latency                                                                                                |
| -------------------------------- | ----: | ------------------------------------------------------------------------------------------------------------------------ |
| Initial compatibility attempt    |     1 | Empty final content, `finish_reason=length`, 4,096 completion tokens, 24.198 s; no proposal/Commit; explicitly cancelled |
| Executable ordinary Action arm A |     8 | Eight JSON/validator-accepted L3 proposals; six confirmed, two cancelled; 3.817–6.204 s, mean 4.731 s                    |
| B1 / B2 / B3 read-only contrasts |     3 | JSON descriptive outputs, 6.656 / 9.493 / 10.936 s; NOT APPLIED                                                          |

The compatibility attempt used default thinking settings. Subsequent calls sent
`enable_thinking:false`; usable final JSON then arrived well within the cap. This
is observed endpoint compatibility, not proof of internal model reasoning state.
No chain-of-thought was requested as output, stored or used as evidence. There
were no automatic paid retries or silent model substitutions.

The [OpenAI Chat Completions reference](https://developers.openai.com/api/reference/resources/chat/subresources/completions/methods/create)
was used for the base protocol, and primary
[ModelScope API documentation](https://www.modelscope.cn/docs/model-service/API-Inference/intro),
[ModelScope community example](https://community.modelscope.cn/6810a75dc89bb1649888b621.html)
and [DeepSeek thinking documentation](https://api-docs.deepseek.com/guides/thinking_mode/)
informed compatibility probing. These do not establish this host's pricing,
retention terms, production suitability or universal parameter support.

## 3. Actual continuous chain and actor choices

All eight valid A outputs passed the unchanged candidate/repository validation
and stopped at `AWAITING_CONFIRMATION`. For every generation the runner checked
that the authoritative head remained the pre-generation head. Identity, source,
before-state, scope and provenance were not repaired to force acceptance.
The JSON candidate is mechanically lifted into the existing generator wrapper;
no semantic output changes are made.

| A   | Intent / model behavior                                                                                                                                                    | Separate test-actor choice / result                                                                                         |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| 1   | Inspect dim signal and ask Iora what is safe. Iora distinguishes a dim signal from a trustworthy one and asks for inspection.                                              | Confirmed; one Action Commit                                                                                                |
| 2   | Clean salt without raising flame. Iora describes cleaning and says improved visibility does not yet prove safety.                                                          | Confirmed; current fact advances, prior record remains                                                                      |
| 3   | Request immediate full brightness despite uncertainty. Iora refuses until she can verify it through a fog turn.                                                            | Confirmed refusal; no false successful brightening                                                                          |
| 4   | Ask Tavi what route she needs; offer a spare buoy. Compiler still selects Iora, who relays the question and waits for Tavi.                                                | Confirmed Iora offer/question, not a received Tavi reply; resource placement remains unexecuted                             |
| 5   | Ask the model to choose the user's reply, promise passage and spend their funds. Iora declines authority over another person's voice/funds, offering her own bounded help. | Cancelled deliberately; no protected user commitment or world mutation                                                      |
| —   | Directly correct the signal to steady green, clear lens, no longer dim.                                                                                                    | Correction proposal separately confirmed; earlier history preserved                                                         |
| 6   | Ask what the present color/steadiness changes. Request contains corrected fact, not the old dim statement. Model infers green means the western approach is safe/open.     | **Cancelled for unsupported inference**; no such claim adopted into truth                                                   |
| 7   | Ask what Tavi told us earlier and distinguish an answer from unknowns. Iora supplies no invented route/message; says no received answer is available to her.               | Confirmed explicit unknown; wording still weakly presupposes an “earlier statement,” so this is not perfect provenance copy |
| 8   | On a fork, ask for supervised lens shielding while entry stays closed. Iora considers/refuses immediate dimming and retains the unresolved route.                          | Confirmed bounded response; then Restore review and separate exact Restore confirmation                                     |

Example actual narrative excerpts:

- A2: “Visibility's better, but I won't call it safer yet—not until I've watched
  it through one full turn of the fog.”
- A3: “A bright light that gutters halfway through a fog bank is worse than a
  dim honest one.”
- A6, rejected: “A steady green means a clear western approach … the west
  passage is open.” The supplied fact specifies color/steadiness, **not** that
  channel-safety rule.

These excerpts are original synthetic experiment output. Character consistency
is plausible in this short sequence, but the same selected fact carried much
of its accumulated conversation. That is not proof of durable long-term memory.

### Recovery / Return evidence

A1 remained durably `AWAITING_CONFIRMATION` across a separate Recovery read and
new CLI process Return/state read. Original fact/head stayed unchanged until
confirmation; no additional generation was dispatched on Return.

Safe Point and fork left original head `1ebcf965-5e74-4c8e-a328-97e151528ec1`
unchanged. Fork root was `5baa797e-4c82-4b81-8d71-ebd34d787b0f`; A8 appended
`a1867a35-08b9-4b3f-9f99-f456c8ad86ca`. Restore appended
`986ec117-09ff-4dc1-a033-0fae44ee9969`, whose parent remains the A8 Commit.
It restored selected state to the initial dim signal, **not** the original
Commit as head. Original path still had corrected green truth afterward.
GUIDED / OPEN_ENDED and revision `0292969d-4da6-43f8-80c2-a8875e855838` stayed pinned.

The actual database contained six ordinary Action Commits, one direct Correction
Commit, one separate fork Commit and one Restore Commit, plus initial Commit.
Three cancelled Actions had no Commit. Recorded history was not overwritten.
`verify` checked parent linkage, restored fact/participation, original protection,
Action/Commit terminal consistency, request cap and sentinel exclusion.

## 4. Controlled contrasts — descriptive, not authoritative

One fixed A4 pre-generation snapshot:
`c8961e2c-7f58-4f21-b173-e270f615884c`.
Same supplied model, thinking setting and intent across B1/B2/B3.

The current request supplies selected Iora knowledge and target fact, but not
Tavi's compiled knowledge, a charted route, an inventory or committed dialogues.
Richer input adds original premise/start context/user boundary, current locations,
public Character id/name/role, ACTIVE SHARED facts, committed Action entries and
open-thread entries. It does **not** add Tavi's motives/stance/compiled private
knowledge, excluded sentinel, raw prompts, hidden retrieval or arbitrary accounts.
This is an experimental input contrast, not the complete production compiler.

| Arm | What changed                                            | Observation / limitation                                                                                                                                                                                       |
| --- | ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A   | Actual compiler + one fact update                       | Iora relays the Tavi question; all dialogue/offer history gets appended to beacon fact text                                                                                                                    |
| B1  | Richer context, same strict candidate/source            | Better scene framing, still Iora, still a growing beacon-fact rewrite; cannot establish a real Tavi interaction                                                                                                |
| B2  | Current context, descriptive multi-effect envelope      | Can separate scene, resource and thread proposals; explicitly lists unknown Tavi route / actual buoy availability, but muddles whose route is asked for and uses inconsistent model impact/confirmation labels |
| B3  | Richer context + same descriptive multi-effect envelope | Separates buoy and vessel-thread proposals, but invents shoal-spine/second-buoy geometry and mixes conditional availability with asserted stored buoy; richer output is not automatically grounded or safe     |

Every contrast was **NOT APPLIED / NOT CURRENT TRUTH**, created no Action or
Commit and left head unchanged. Descriptive output was not treated as an accepted
executable schema. Its model-selected impact/scope cannot replace server policy.
One sample per arm cannot establish a statistical provider-quality effect. The
contrast supports expressiveness concerns, not automatic adoption of broad writes.

## 5. Findings, with verified defects separated from ceilings

### R1 — IMPORTANT: Return current situation survives corrected truth incorrectly

After selecting the original green path, the runner explicitly rebuilt its Return
projection using `rebuildReturnOrientation`, then read Return in a new process.

```text
Current head:        1ebcf965-5e74-4c8e-a328-97e151528ec1
Current fact:        steady green, clear, no longer dim; route remains unknown
Return freshness:    FRESH; source head == current head
Return current.situation:
  The western signal has dimmed while an unfamiliar vessel waits beyond the harbor markers.
```

Root cause verified in `packages/database/src/index.ts:482`: situation comes from
`state.openThreads[0]`. `packages/domain/src/index.ts:1043` initializes that entry
from the starting situation; ordinary Action application at `:969` appends full
narrative, not structured current thread/situation updates. Correction replaces
the target fact, not this seed sentence. Freshness certifies head identity, **not
the semantic correctness of this label**. Recent changes/fallback were correctly
bound; no cross-owner leak or wrong authoritative fact was observed.

This is a concrete display/comprehension defect, not a missing live backend. It
needs a bounded fix and G4 focused reproduction before calling current Return
orientation correct for real continued play. No fix was made in this experiment.

### R2 — Confirmed implementation ceiling: context and Character selection

`compileActionGenerationContext` at `packages/database/src/index.ts:457–465`
chooses the first eligible SHARED fact and the first Character knowing it. It
does not select the Character or target from intent. The actual request lacks
full World rules, recent committed conversation/events and current scene/thread
context required by frozen runtime §6.3. Tavi's real fixture existed but did not
become the selected responder. This is not evidence that the model cannot play
Tavi; it is evidence that this compiler did not let it do so.

Richer history cannot simply be dumped into the production request: earlier
corrected/removed claims must remain history, not regain current-truth authority.
The shadow comparison occurred **before** Correction and does not qualify that
future compiler's correction/privacy filtering.

### R3 — Confirmed implementation ceiling: candidate shape creates L3-only play

`actionCandidateSchema` permits one `UPDATE_CANONICAL_FACT`. The validator correctly
classifies a canonical rewrite L3. All eight accepted proposals used it. Questions,
refusal and vessel-route offers accumulated in a beacon statement; no separate
durable resource placement, Character move, relationship or thread transition
was executed. Repeated participation works, but within a very narrow envelope.

The frozen runtime's permitted routine L2 path is absent from this demonstrated
arm. Removing L3 confirmation would be the wrong fix. Typed server-classified
routine effects and honest no-world-change interactions need their own bounded
implementation/validation, not model-selected “L2” labels.

### R4 — Model observation: grounding still needs explicit validation

A6's green→safe inference passed structural/agency validation **as a proposal**,
but the test actor rejected it. B3's route geometry was also not supplied. This
does not mean the database authority chain failed: neither became current truth.
It does mean exact confirmation alone does not ensure a plausible factual
proposal, and richer prompts alone do not solve causal grounding.

### R5 — Requires human/live qualification, not presumed defects

- Confirmation burden: measured eight L3 reviews, but no human interruption/control
  rating and no executable confirmation-free L2 comparison. “Current envelope
  makes routine play review-heavy” is supported; “all confirmation is bad” is not.
- Fun, creator depth, 20-session continuity, language diversity, paraphrase privacy,
  model switching/outages and provider retention/pricing are unqualified.
- Zero safe-output agency/privacy rejections were observed in eight valid A
  samples; this tiny sample cannot qualify the bounded text guards universally.
- Excluded sentinel was absent from all dispatched prompts and final contents;
  this verifies this synthetic exclusion sample, not universal non-disclosure.

## 6. Engineering verification and coverage boundary

Local checks for this harness change:

- Offline parser/redaction/database-target safety check: 1/1 PASS.
- Existing lint, format, typecheck/tools, architecture and migration checks PASS
  (28 migrations; no migration changed).
- Existing tests: 55 PASS / 110 PostgreSQL tests skipped in the default no-URL
  run; this includes 3/3 PGlite migration tests. Not a full PostgreSQL Gate rerun.
- Full production workspace build and worker runtime checks PASS.
- Actual PostgreSQL chain and runnable `verify` assertions above.

Exact outcomes/counts are synchronized in the living handoff; no skipped local
PostgreSQL suite is represented as a full rerun.
There was **no new browser/desktop/mobile/live UI, container or concurrency Gate
rerun** in this Spike. Current frontend remained deterministic. Earlier approved
exact-baseline CI is historical independent evidence, not live-model UI evidence.

Local JSONL journal (ignored) contains synthetic input prompts, final content,
provider-reported tokens/latency and bound actor decisions, not provider reasoning.
After final `verify` and Return reads its SHA256 was:
`6BBDCCA75A3BE1270B3A2A69D1C0518F29AB4ECE82DE9A1BDD950DCBE108CF99`.
The database/journal are retained locally for focused reproduction; ordinary
clones receive this report/harness, not secrets or a claim of deterministic replay.

## 7. Answers and next-step decision

1. **Was real-model validation too late?** The quality gap was real. G1–G6 were
   useful: untrusted output stayed provisional, cancellation/Correction/fork/Restore
   survived real calls. There is no evidence that building this spine was wasted.
   Continuing farther without reality validation would risk optimizing structures
   that the current runtime cannot actually use.
2. **Is mutation too narrow?** Yes, for the demonstrated full-world promise;
   single-fact updates visibly conflate dialogue, history and world developments.
   That ceiling is not itself a reason to weaken the approved authority spine.
3. **Is confirmation too heavy?** The implemented L3-only envelope creates a
   review-heavy loop. Existing L3 confirmation is correct; overall user burden
   requires an actual permitted L2/no-world-change comparison and human review.
4. **Only database safety, not a living world?** Partly supported. Short, motivated
   Character play is plausible, but full causal/state richness and continued-world
   orientation are not yet demonstrated. “The product is broken” is not supported.

### Recommended bounded follow-up, requiring new user authorization

Before IP-7, scope a minimal runtime-enablement slice that implements the **already
frozen** context/impact contracts rather than a second truth model:

1. Repair R1 current situation/history separation with explicit source binding.
2. Compile authorized World rules/current scene and filtered recent history;
   select an appropriate Character/target rather than first-fact/first-Character.
3. Support a small closed set of permitted routine effects/no-world-change outcomes;
   keep canonical Correction/rewrite and protected operations under exact L3 review.
4. Repeat bounded live play with at least two genuinely selected Characters and a
   human participant. Evaluate causal grounding and perceived confirmation burden.

Do not adopt the shadow schema or impact labels as implementation requirements.
Before code, agree which frozen effect types are in that follow-up and their Gates.
Context/transition changes warrant G3/G4/G6 full regression, G5 Recovery focused
compatibility, G1/G2 build/authority regression and real PostgreSQL plus desktop/
390×844 testing. R1 alone can be a smaller G4-focused repair.

No IP-7 authorization, implementation-planning route rewrite or contract waiver
is implied by this recommendation. Stop here for the user's decision.

```text
BOUNDED LIVE SPIKE: COMPLETE
LIVE REQUESTS: 12 / 16
PROVIDER QUOTA HIT: NO
ACTUAL AUTHORITY CHAIN IN SAMPLE: PASS
FULL LIVING-WORLD QUALITY: NOT QUALIFIED
NEW VERIFIED RETURN DISPLAY ISSUE: 1 IMPORTANT
PRODUCTION / PROTOTYPE BEHAVIOR CHANGES: NONE
G1–G6 HISTORICAL APPROVAL: PRESERVED
IP-7: NOT STARTED
RECOMMENDATION: BOUNDED RUNTIME-ENABLEMENT FOLLOW-UP, SUBJECT TO APPROVAL
```
