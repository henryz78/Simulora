# Simulora Implementation Planning Handoff

This is the historical planning-approval handoff, not the live implementation
status. IP-1–IP-6 are now complete and independently approved on `eb55734`;
see [Current Implementation Handoff](IMPLEMENTATION_STATUS_HANDOFF.md) and
[Final Independent / Integrated Review](G1-G6-FINAL-INTEGRATED-REVIEW.md).
The original planning boundary below remains unchanged.

**Status:** `IMPLEMENTATION PLANNING: COMPLETE / APPROVED`

**Date:** `2026-08-29` (`Asia/Shanghai`)

**Product Implementation:** `NOT STARTED`

## 1. Planning package

| Artifact | Purpose |
|---|---|
| [Implementation Plan V1](IMPLEMENTATION_PLAN.md) | Production topology, Prototype boundary, data/runtime/API strategy, persistence, frontend, security, testing, observability and deployment plan. |
| [Roadmap and Work Breakdown V1](ROADMAP_AND_WORK_BREAKDOWN.md) | Dependency-ordered vertical slices, work packages and Gates G0–G10. |
| [Implementation Planning Consistency Audit](IMPLEMENTATION_PLANNING_CONSISTENCY_AUDIT.md) | Coverage of all MVP MUST, PR/NFR, ADR, invariant and frozen Experience contracts. |

These documents translate the frozen Product, System and Experience baselines. They do not modify those baselines or authorize implementation automatically.

## 2. Main decisions

- Keep the approved Prototype frozen under `prototypes/simulora-experience/`; build production as new `apps/` and `packages/` workspaces with no source dependency on the Prototype.
- Use the frozen modular-monolith shape: React web, Node API, Node worker, PostgreSQL authority, S3-compatible artifacts, JSON/HTTP + resumable SSE and PostgreSQL jobs/outbox.
- Begin with a deterministic model adapter and prove authoritative Action/Commit/recovery semantics before adding a live model.
- Use full immutable State Revision JSONB documents and append-only Commit/Event/history as frozen; avoid premature event sourcing or extra infrastructure.
- Make Action, expected head, proposal digest, confirmation, Commit, usage settlement and outbox dedupe the effective-once spine.
- Build slices in dependency order: authoritative World → Action Truth → Continuity/Correction → Recovery → Participation/Character → Studio → trust/lifecycle → hardening/release evidence.
- Treat accessibility, privacy, observability and migration as cross-cutting definition-of-done requirements.
- Keep World Revision creation separate from current Continuity adoption; no automatic merge/adoption path is planned.

## 3. Feasibility and consistency result

No frozen Product/System/Experience contradiction prevents implementation.

The implementation plan preserves:

- PostgreSQL as sole authoritative transactional state;
- acknowledged versus committed Action truth;
- model-proposal versus deterministic Commit authority;
- independent participation axes and user-only contract transition;
- canonical state, history, generated output and derived memory boundaries;
- non-destructive Branch/Restore and history-preserving Correction;
- Continuity pinning to immutable World Revision;
- desktop/mobile shared mental model;
- no mandatory sensory layer, marketplace, multiplayer or professional creator engine;
- clean-room separation from WorldOS and Prototype residue.

## 4. Decisions not silently invented

The following remain explicit later Gates, not current planning failures:

- cloud vendor, launch region and production DR/retention SLO;
- production identity/session and adult-eligibility provider/policy;
- approved live model provider and provider data terms;
- detailed safety taxonomy, appeal service and operator policy;
- commercial pricing/allowance;
- final brand, launch content and production visual-asset provenance.

Local, CI and deterministic vertical-slice implementation can proceed through ports/fakes after plan approval. Shared external staging or production release cannot pass its Gate until the relevant decision is made.

## 5. Review focus

The Reviewer should specifically confirm:

1. production must remain separate from the frozen Prototype;
2. selected implementation libraries fit the frozen architecture;
3. the first vertical slices prioritize authoritative truth over broad UI coverage;
4. phase dependencies and selected SHOULD deferrals are acceptable;
5. external decision Gates are assigned at the right point;
6. no planned item silently introduces revision adoption, destructive rewind, off-session autonomy or extra infrastructure;
7. G3–G10 evidence is sufficient to prevent disconnected slice implementation.

## 6. Phase boundary

This package passed review and authorized phased implementation beginning with IP-1. The statement below records the planning handoff boundary before production directories were created.

```text
IMPLEMENTATION PLANNING: COMPLETE
IMPLEMENTATION PLAN: APPROVED
ROADMAP / WORK BREAKDOWN: APPROVED
IMPLEMENTATION PLANNING AUDIT: PASSED
FROZEN CONTRACT CONFLICTS: 0
READY TO START IMPLEMENTATION BY PHASE GATE: YES
PRODUCT IMPLEMENTATION: IP-1 AUTHORIZED
```

Implementation beyond each authorized phase remains gated by its review outcome.
