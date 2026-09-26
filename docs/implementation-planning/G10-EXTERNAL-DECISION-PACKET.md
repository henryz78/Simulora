# G10 External Decision Packet

**Date:** 2026-09-25 · **Status:** `AWAITING PRODUCT-OWNER DECISIONS`.
This is a proposal. It approves no provider, vendor or policy, and it starts
no phase.

IP-10 engineering is complete
([IP-10 Final Engineering Review](IP-10-FINAL-ENGINEERING-REVIEW.md)).

**What this packet does:**

- lists what only the product owner can decide ([Plan §20](IMPLEMENTATION_PLAN.md));
- states what the code already requires of each answer;
- states what each answer unblocks;
- proposes an order.

## 1. Recommended order

| # | Decision | Why first | Unblocks |
|---|---|---|---|
| 1 | **Real model provider** and its retention/training terms | Every piece of evidence so far runs on the deterministic adapter. Whether the product is a playable AI World is still unproven with a real model. | Live-model staging; track B below |
| 2 | **Cloud vendor and launch region** | Most operational items wait on it | Staging, monitoring and paging, production backup and PITR, deploying the IP-10.7 alerts, compatibility row C6 |
| 3 | **Retention, deletion purge, DR SLO, rollback window** | Firms up alerts A2, A6 and A15, and the rollback window | The PostgreSQL retention purge (a release obligation) |
| 4 | **OIDC/session and adult-eligibility provider and policy** | Needed before any external user | External staging users |
| 5 | **Safety taxonomy, appeal path, operator policy** | Needed before beta | External beta |
| 6 | **Pricing and allowance** | Needed before paid or limited Actions | Paid production Action |
| 7 | **Brand, asset provenance, launch content emphasis** | Needed before a public UI | Public production UI and seed content |
| 8 | **People and reviews** | Needed before launch | Named operations owners and tested escalation; specialist security, privacy and legal review; human screen-reader review |

Decisions 2–8 do not block a small internal track B, as long as it runs in
local or test.

## 2. What the code already requires of a model provider

These come from `packages/model-gateway` and `packages/config`:

- **API:** an OpenAI-compatible chat-completions endpoint that honours
  `response_format: { type: "json_object" }` (`SIMULORA_MODEL_ADAPTER=openai-compatible`).
- **Configuration:**
  - `SIMULORA_MODEL_ENDPOINT`
  - `SIMULORA_MODEL_NAME`
  - `SIMULORA_MODEL_API_KEY`
  - profile ID and version
  - timeout: 1–120 s, default 30 s
  - maximum output tokens: 256–16,384, default 2,048
- **Fallback:** `none` or `deterministic`, for outages only.
- **Retention gate:** outside `local` and `test`, the service refuses to start
  a live profile without `SIMULORA_MODEL_RETENTION_APPROVAL_REF`. That reference
  should point to a recorded decision stating:
  - the provider and model;
  - retention period;
  - whether data is used for training;
  - the processing region;
  - the sub-processors;
  - the deletion path.
- **Earlier experiments:** they used user-provided compatible endpoints in
  isolated runs only
  ([RE-3 Post-Guard Live Corpus Handoff](RE-3-POST-GUARD-LIVE-CORPUS-HANDOFF.md)).
  They are not an approval.

**The product owner provides:**

1. the provider and model;
2. the recorded retention and training terms, with a reference ID;
3. the approved profile limits;
4. whether deterministic fallback is allowed.

## 3. Proposed next engineering tracks

Neither track is authorized. Each needs its own contract and independent
Review.

**A. Studio authoring for relationship scales, threads and constraints.**

- **Why:** MGC-1 §8 left Studio authoring out of scope, so today only the API
  can create a World with these fields. E2E-CONTINUITY-IMPACT had to create its
  World through `POST /v1/worlds`. A creator using the formal UI cannot build a
  World with rich change, and that narrows the long-term AI World direction
  ([Product Direction Guardrails](PRODUCT_DIRECTION_GUARDRAILS.md)).
- **Scope:** editing controls only, using the existing schema. No new effect
  kinds and no contract change.
- **Dependencies:** none external; it can start on authorization.

**B. Bounded human play validation, in the style of RE-4.**

- **Why:** human enjoyment has never been validated, and no multi-session play
  with a real model has been run through the formal UI.
- **Scope:** a few real people and long multi-session play on one World with
  multiple characters, relationship change and threads. Observe:
  - causal continuity;
  - natural character response;
  - whether a person can pick the World up again after days away;
  - the reading burden.
- **Where it runs:** local or test only. Findings become bounded repairs; no
  rule is relaxed.
- **Dependencies:**
  - decision 1;
  - participant consent;
  - A is preferred first, so the Worlds can be authored in the UI.

**Small follow-ups** (each optional, each needs authorization):

- a duration field on `request.complete` (the alert signal gap);
- readable RE-3 `CHARACTER_MOVED` Trace summaries;
- handling a stale browser tab across a deploy (compatibility row C11).

## 4. What stays unchanged

- Beta, launch and production live model use are not authorized.
- The SHOULD selection stays: PR-012, PR-015, PR-016 and PR-017 are not
  selected.
- Frozen Action, authority, confirmation, Recovery and ownership semantics
  are unchanged.
