# Documentation Map

This directory separates the frozen WorldOS research record from external-Agent evidence, final deliverables, coordination material, original inputs, and historical archives.

## Start Here

- [Repository agent rules](../AGENTS.md)
- [Final main-Agent handoff](coordination/FINAL_MAIN_AGENT_HANDOFF.md)
- [Integrated Research v1 handoff](research/integration/FINAL_INTEGRATION_HANDOFF.md)
- [Integrated Research index](research/integration/INTEGRATED_RESEARCH_INDEX.md)
- [Cross-Agent evidence merge](research/integration/CROSS_AGENT_EVIDENCE_MERGE.md)
- [Conflict register](research/integration/CONFLICT_REGISTER.md)
- [Product-relevant gap audit](research/integration/PRODUCT_RELEVANT_GAP_AUDIT.md)
- [Research freeze manifest](research/integration/RESEARCH_FREEZE_MANIFEST.md)
- [Original Product Principles](product/PRODUCT_PRINCIPLES.md)
- [Product Principles Decision Log](product/PRODUCT_PRINCIPLES_DECISION_LOG.md)
- [Product Positioning](product/PRODUCT_POSITIONING.md)
- [Target Users / JTBD](product/TARGET_USERS_AND_JTBD.md)
- [MVP Scope Boundaries](product/MVP_SCOPE_BOUNDARIES.md)
- [Product Requirements V1](product/PRODUCT_REQUIREMENTS.md)
- [Product Definition Consistency Audit](product/PRODUCT_DEFINITION_CONSISTENCY_AUDIT.md)
- [Product Definition Handoff](product/PRODUCT_DEFINITION_HANDOFF.md)
- [System Design V1](system-design/SYSTEM_DESIGN_V1.md)
- [Domain, State and Data Model](system-design/DOMAIN_STATE_AND_DATA_MODEL.md)
- [Runtime, Model and Persistence](system-design/RUNTIME_MODEL_AND_PERSISTENCE.md)
- [API, Security and Operations](system-design/API_SECURITY_AND_OPERATIONS.md)
- [Architecture Decisions](system-design/ARCHITECTURE_DECISIONS.md)
- [System Design Validation Strategy](system-design/VALIDATION_STRATEGY.md)
- [Architecture Consistency Audit](system-design/ARCHITECTURE_CONSISTENCY_AUDIT.md)
- [System Design Handoff](system-design/SYSTEM_DESIGN_HANDOFF.md)
- [Experience Structure Handoff](deliverables/experience-structure/EXPERIENCE_STRUCTURE_HANDOFF.md)
- [Overall Experience Audit](deliverables/experience-structure/OVERALL_EXPERIENCE_AUDIT.md)
- [Overall Experience Integration Repair](deliverables/experience-structure/OVERALL_EXPERIENCE_INTEGRATION_REPAIR_REPORT.md)
- [Independent Overall Experience Re-Audit](deliverables/experience-structure/OVERALL_EXPERIENCE_RE_AUDIT.md)
- [Experience Freeze Handoff](deliverables/experience-structure/EXPERIENCE_FREEZE_HANDOFF.md)
- [Implementation Plan V1](implementation-planning/IMPLEMENTATION_PLAN.md)
- [Implementation Roadmap and Work Breakdown](implementation-planning/ROADMAP_AND_WORK_BREAKDOWN.md)
- [Implementation Planning Consistency Audit](implementation-planning/IMPLEMENTATION_PLANNING_CONSISTENCY_AUDIT.md)
- [Implementation Planning Handoff](implementation-planning/IMPLEMENTATION_PLANNING_HANDOFF.md)
- [Current Implementation Status Handoff](implementation-planning/IMPLEMENTATION_STATUS_HANDOFF.md)
- [Final AI World Goal and Direction Guardrails](implementation-planning/PRODUCT_DIRECTION_GUARDRAILS.md)
- [G1–G6 Final Independent / Integrated Review](implementation-planning/G1-G6-FINAL-INTEGRATED-REVIEW.md)
- [G1–G6 Consolidated Repair Report](implementation-planning/G1-G6-CONSOLIDATED-REPAIR-REPORT.md)
- [Bounded Product Reality Spike Plan](implementation-planning/PRODUCT_REALITY_SPIKE_PLAN.md)
- [Product Reality Spike — Actual Results](implementation-planning/PRODUCT_REALITY_SPIKE_REPORT.md)
- [Return Current Situation — RE-1 Repair](implementation-planning/RETURN_CURRENT_SITUATION_REPAIR_REPORT.md)
- [RE-1 Independent Review and Closure](implementation-planning/RE-1-INDEPENDENT-REVIEW.md)
- [RE-2 Authorized Context / Character Selection — Implementation Evidence](implementation-planning/RE-2-AUTHORIZED-CONTEXT-IMPLEMENTATION-REPORT.md)
- [Bounded Runtime Enablement — Proposed Follow-up](implementation-planning/BOUNDED_RUNTIME_ENABLEMENT_PLAN.md)
- [Final WorldOS research report](deliverables/worldos-research/FINAL_WORLDOS_RESEARCH_REPORT.md)
- [Main research index](research/worldos/00_RESEARCH_INDEX.md)
- [Parity matrix](research/worldos/04_WORLDOS_PARITY_MATRIX.md)
- [Parity test suite](research/worldos/05_PARITY_TEST_SUITE.md)
- [Open questions](research/worldos/06_OPEN_QUESTIONS.md)
- [Evidence index](research/worldos/07_EVIDENCE_INDEX.md)
- [Final completeness audit](research/worldos/10_FINAL_COMPLETENESS_AUDIT.md)

## Directory Layout

```text
docs/
├─ research/
│  ├─ worldos/                  Frozen main black-box research
│  ├─ integration/              Frozen Integrated Research v1 navigation, merge, conflicts, gaps and handoff
│  └─ external/
│     ├─ marvis/                Second-account and targeted follow-up evidence
│     ├─ anonymous/             Guest/anonymous evidence
│     ├─ manus/                 Manus Phase 1–3 reports and evidence package
│     ├─ user-research/         Extracted user-evidence package
│     ├─ creator-templates/     Extracted creator mechanism-reference package
│     ├─ visual-assets/         Extracted production-resource package
│     ├─ immersion/             Extracted immersion/reference-tooling package
│     ├─ brand/                 Extracted frozen brand exploration
│     └─ world-character/       Extracted original content/visual reference package
├─ deliverables/
│  ├─ worldos-research/         Final research handoff report
│  └─ experience-structure/     Frozen Experience structure, audit chain and Freeze handoff
├─ product/                      Frozen original Product Definition V1
├─ system-design/                Frozen original System Design V1, ADRs, contracts, validation and handoff
├─ implementation-planning/      Production implementation plan, roadmap, WBS and review handoff
├─ coordination/                Package intake records and future active coordination
├─ source-materials/
│  └─ worldos/                  Original Master Specification
└─ archive/
   ├─ source-packages/          Immutable external ZIP snapshots and hash manifest
   ├─ coordination/completed/   Completed handoffs and task briefs
   ├─ manus/                     Obsolete/reproduction tooling and historical variants
   └─ marvis/                    Superseded or corrected Marvis material
```

## Main Research

The canonical investigation record is [research/worldos](research/worldos/). Its subsystem directories cover Worlds, Characters, Simulation, Apps, Maps, platform behavior, UX controls, and architecture. Cross-Agent provenance and conflict decisions are recorded in:

- [Parallel audit merge](research/worldos/11_PARALLEL_AUDIT_MERGE.md)
- [Manus cross-Agent merge](research/worldos/12_MANUS_CROSS_AGENT_MERGE.md)

Do not silently revise frozen observations for implementation convenience. New product requirements and architecture must live outside the research tree.

## External Research

- [External research corpus map](research/external/README.md)
- [Marvis second-account audit](research/external/marvis/second-account/00_SECOND_ACCOUNT_INDEX.md)
- [Marvis Phase 3 targeted audit](research/external/marvis/phase-3/07_PHASE3_SUMMARY.md)
- [Marvis Phase 4 provenance correction](archive/marvis/phase-4/local-preflight-and-corrections/00_PROVENANCE_ERRATUM.md)
- [Anonymous/Guest source material](research/external/anonymous/)
- [Manus archive guide](research/external/manus/MANUS_ARCHIVE_README.md)
- [Manus evidence-quality audit](research/external/manus/MANUS_EVIDENCE_QUALITY_AUDIT.md)
- [AI World User Research](research/external/user-research/README.md)
- [Creator Starter Templates](research/external/creator-templates/README.md)
- [AI World Visual Asset Pool](research/external/visual-assets/README.md)
- [Immersion Asset Library](research/external/immersion/README.md)
- [Brand / Naming Exploration](research/external/brand/README.md)
- [World / Character Final Package](research/external/world-character/README.md)

External evidence keeps its original provenance and limitations. It becomes part of the main conclusions only through the merge audits above.

## Integrated Research v1

The six completed external packages supplied on 2026-08-26 are integrated—not copied or replaced—through [research/integration](research/integration/). This layer distinguishes user evidence from competitor observation, mechanism/content references, production resources, feasibility research and frozen brand exploration.

Historical integration-freeze snapshot: `INTEGRATED RESEARCH V1: FROZEN`;
`PRODUCT IMPLEMENTATION AT THAT FREEZE: NOT STARTED`; `FINAL BRAND: NOT DECIDED`.
Current production scope is recorded in the implementation handoff, not changed
retroactively in the frozen research package.

Start with the [final integration handoff](research/integration/FINAL_INTEGRATION_HANDOFF.md). Routine reading should use the extracted package directories above. Original ZIPs remain unchanged in [archive/source-packages](archive/source-packages/README.md) and are identified by hash in the [freeze manifest](research/integration/RESEARCH_FREEZE_MANIFEST.md).

## Original Product and System Design

The original Product Definition is frozen in [product](product/), with the current gate recorded in the [Product Definition Handoff](product/PRODUCT_DEFINITION_HANDOFF.md). The approved original architecture is frozen separately in [system-design](system-design/); begin with the [System Design Handoff](system-design/SYSTEM_DESIGN_HANDOFF.md).

Historical System Design freeze snapshot: `SYSTEM DESIGN V1: FROZEN`;
`ARCHITECTURE AUDIT: PASSED`; `READY FOR EXPERIENCE DESIGN / PROTOTYPE: YES`;
`PRODUCT IMPLEMENTATION AT THAT FREEZE: NOT STARTED`.

The Product Definition handoff retains its historical “Architecture not started” phase-gate text. Current architecture status is authoritative in the System Design Handoff; the frozen Product Definition record is not rewritten retroactively.

## Frozen Experience

The approved end-to-end Experience is frozen at implementation baseline `877f4d532024009ba44d99580e12ce088136304a`. The full decision chain is preserved as the initial [Overall Experience Audit](deliverables/experience-structure/OVERALL_EXPERIENCE_AUDIT.md) `FAIL`, the subsequent [Integration Repair](deliverables/experience-structure/OVERALL_EXPERIENCE_INTEGRATION_REPAIR_REPORT.md), and the independent [Overall Experience Re-Audit](deliverables/experience-structure/OVERALL_EXPERIENCE_RE_AUDIT.md) `PASS WITH ISSUES` with `0 BLOCKER / 0 IMPORTANT / 0 MINOR`.

Begin the frozen handoff at [Experience Freeze Handoff](deliverables/experience-structure/EXPERIENCE_FREEZE_HANDOFF.md).

`EXPERIENCE: FROZEN`; `IMPLEMENTATION PLANNING: COMPLETE / APPROVED`;
`PRODUCT IMPLEMENTATION: IP-1–IP-6 COMPLETE / FINAL REVIEW APPROVED`.

## Implementation Planning

The first production implementation plan is in [implementation-planning](implementation-planning/). Start with the [Implementation Planning Handoff](implementation-planning/IMPLEMENTATION_PLANNING_HANDOFF.md), then read the [Implementation Plan](implementation-planning/IMPLEMENTATION_PLAN.md), [Roadmap / Work Breakdown](implementation-planning/ROADMAP_AND_WORK_BREAKDOWN.md) and [Consistency Audit](implementation-planning/IMPLEMENTATION_PLANNING_CONSISTENCY_AUDIT.md).

`IMPLEMENTATION PLANNING: COMPLETE / APPROVED`; implementation status is maintained
in the [current handoff](implementation-planning/IMPLEMENTATION_STATUS_HANDOFF.md).
The approved plan/roadmap and historical planning handoff are not live Gate ledgers.

## Product Implementation

IP-1–IP-6 are implemented. Final independent verification and Integrated G1–G6
Review approved behavior baseline `eb55734f258fc9be6f4837df888700e34eaa67e2`
with `0 BLOCKER / 0 IMPORTANT / 0 MINOR`. The production pnpm workspace remains
separate from the frozen Prototype and uses one PostgreSQL authoritative spine.

Start with the [current implementation handoff](implementation-planning/IMPLEMENTATION_STATUS_HANDOFF.md)
and [complete final independent report](implementation-planning/G1-G6-FINAL-INTEGRATED-REVIEW.md).
The [consolidated repair report](implementation-planning/G1-G6-CONSOLIDATED-REPAIR-REPORT.md)
retains the original failures, follow-up findings, repairs and final closure.

Original IP-1–IP-6 reports remain dated evidence; their earlier failed/pending
statuses are historical, not current Gate decisions. The approved behavior SHA
is distinct from later documentation-only commit hashes.

`G1–G6: PASS`; `INTEGRATED G1–G6: APPROVED`; `IP-7: NOT STARTED`;
`LIVE MODEL / PRODUCT REALITY SPIKE: EXECUTED / AWAITING RESULT REVIEW`;
`PRODUCTION DEPLOYMENT / RELEASE: NOT STARTED`.

IP-7 remains unauthorized/not started. The user has authorized bounded Spike
execution with a local compatible API profile; stop at provider quota. See the
[Spike Plan](implementation-planning/PRODUCT_REALITY_SPIKE_PLAN.md) and
[Actual Results](implementation-planning/PRODUCT_REALITY_SPIKE_REPORT.md). The
experiment recommends a bounded runtime-enablement follow-up. The user's next
instruction to continue is applied to the confirmed
[RE-1 display repair](implementation-planning/RETURN_CURRENT_SITUATION_REPAIR_REPORT.md)
and a [bounded follow-up plan](implementation-planning/BOUNDED_RUNTIME_ENABLEMENT_PLAN.md).
RE-1 passed [independent review](implementation-planning/RE-1-INDEPENDENT-REVIEW.md);
RE-2 is [implemented and locally verified](implementation-planning/RE-2-AUTHORIZED-CONTEXT-IMPLEMENTATION-REPORT.md),
pending independent review and exact-candidate CI. RE-3–RE-4 and IP-7 are not authorized.
No automatic roadmap change is authorized. G1–G6 approval
does not claim real-model quality, universal semantic-language safety or release readiness. Update the
living handoff and affected navigation at phase/repair/review/CI milestones;
preserve frozen and historical source records.

## Supporting Material

- [Final main-Agent handoff](coordination/FINAL_MAIN_AGENT_HANDOFF.md)
- [Cross-Agent evidence inventory](coordination/CROSS_AGENT_EVIDENCE_INVENTORY.md)
- [Cross-Agent package intake template](coordination/CROSS_AGENT_PACKAGE_INTAKE_TEMPLATE.md)
- [Cross-Agent integration protocol](coordination/CROSS_AGENT_INTEGRATION_PROTOCOL.md)
- [Final Marvis handoff](archive/coordination/completed/handoffs/MARVIS_HANDOFF_FINAL.md)
- [Completed External-Agent task briefs](archive/coordination/completed/delegations/)
- [Master Specification](source-materials/worldos/MASTER_SPECIFICATION_WORLDOS.txt)
- [Historical archive](archive/)
- [Reorganization manifest](REORGANIZATION_MANIFEST.md)

Archive files are retained for provenance and comparison. Prefer current research and deliverables unless a document explicitly asks for a completed handoff, reproduction tool, or historical variant.
