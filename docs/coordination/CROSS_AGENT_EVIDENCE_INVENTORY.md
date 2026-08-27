# Cross-Agent Evidence Inventory

Status: `INTEGRATED RESEARCH V1 — FROZEN / PRODUCT DEFINITION NOT STARTED`

This is the lightweight registry for external research packages that arrive after the frozen WorldOS research. It records what is known, where it came from, how strong the evidence is, what has already been merged, and which gaps are intentionally deferred. It is an evidence index, not a product requirements document.

## Operating boundary

- Preserve each original ZIP, report, screenshot, dataset and manifest as an evidence-layer artifact. Do not overwrite, silently rename, or “clean up” the source package.
- Keep `docs/research/worldos/` frozen. New cross-agent package summaries and merge decisions belong in `docs/coordination/` and, when appropriate, a package-specific directory under `docs/research/external/`.
- Do not turn a source's feature list, reference library or WorldOS parity row into a product requirement.
- `UNKNOWN`, `BLOCKED`, `REPORT_ONLY`, `NOT_COMPARABLE` and observed defects remain bounded states. They do not automatically trigger new research.
- Product relevance is not decided until the evidence corpus is integrated and the user approves Original Product Principles / Requirements.

## Integration stages

`Existing Evidence Inventory` → `Cross-Agent Evidence Merge` → `Conflict Check` → `Product-Relevant Gap Audit` → `Integrated Research Freeze`

All five stages are complete for Integrated Research v1. A package is marked `FROZEN` only after its Source of Truth, provenance, scope, cross-source relations, repeat boundary and gap disposition have been recorded.

## Status vocabulary

| Status | Meaning |
|---|---|
| `NOT_RECEIVED` | Expected category or package has not arrived; no claim is made about its contents. |
| `RECEIVED` | Original package is present and preserved; intake has not been completed. |
| `IN_INTAKE` | Source of Truth, scope, artifacts and provenance are being catalogued. |
| `MERGED` | Findings have been related to the existing corpus and conflicts have been classified. |
| `GAP_REVIEW` | Remaining gaps have been assessed for product relevance; no automatic research follows. |
| `FROZEN` | Package and merge disposition are stable for the current integration version. |
| `BLOCKED` | A stated entitlement, credential, device, artifact or access limit prevents a conclusion. |

## Evidence / provenance vocabulary

Use the narrowest applicable label and retain the original agent/account/time boundary:

- `PRIMARY_DIRECT` — direct controlled observation in the primary research environment.
- `EXTERNAL_RAW` — external agent result with retained raw artifacts that support the claim.
- `EXTERNAL_REPORT_ONLY` — report or transcript is present but cited raw evidence is missing or mismatched.
- `CORROBORATING` — independently agrees with an existing finding at the tested scope.
- `NEW_EXTERNAL` — adds a bounded finding not present in the existing corpus.
- `CONTRADICTORY_SNAPSHOT` — observations differ; time/account/session/object differences are retained rather than averaged away.
- `NOT_COMPARABLE` — identity, object, prompt, model, state or tooling prevents a like-for-like comparison.
- `TOOLING_BLOCKED` — the prescribed action did not reach the behavioral assertion.
- `DEFECT_BASELINE` — reproducible observed quirk; no root cause is inferred and no compatibility decision is implied.

## Package registry

Append one row per received package. Use the intake template for the detailed record.

| Package ID | Source / agent | Original artifact path or filename | Domain(s) | Source of Truth | Provenance | Status | Repeat boundary | Notes |
|---|---|---|---|---|---|---|---|---|
| `EPKG-001` | WorldOS primary research | `docs/research/worldos/` and `docs/deliverables/worldos-research/` | WorldOS product-level black-box behavior | `FINAL_WORLDOS_RESEARCH_REPORT.md`, Parity Matrix/Test Suite, Open Questions, Evidence Index, Final Completeness Audit | `PRIMARY_DIRECT` | `FROZEN` | Do not repeat the completed lifecycle, page-control or broad black-box research | 70 Feature IDs; 64 tests; 47 OQ; 251 main evidence; implementation not started |
| `EPKG-002` | Marvis / Anonymous / Guest | `docs/research/external/marvis/`, `docs/research/external/anonymous/`, `docs/research/worldos/11_PARALLEL_AUDIT_MERGE.md` | Guest/non-owner access, visibility, Remix, social, Collections, Profiles, notifications | `11_PARALLEL_AUDIT_MERGE.md` plus linked external reports | `EXTERNAL_RAW` + `EXTERNAL_REPORT_ONLY` by artifact | `FROZEN` | Do not rerun completed Guest, Account-B, social or public Remix baselines | Tested-sample scope only; private/only-me and index-policy edges remain bounded |
| `EPKG-003` | Manus Phases 1–3 | `docs/research/external/manus/`, `docs/research/worldos/12_MANUS_CROSS_AGENT_MERGE.md` | External corroboration, Character Memory variability, Maps catalogue snapshots, creator/control spot checks | `12_MANUS_CROSS_AGENT_MERGE.md` and retained Phase 3 raw artifacts | `EXTERNAL_RAW` / `EXTERNAL_REPORT_ONLY` / `CONTRADICTORY_SNAPSHOT` as classified | `FROZEN` | Do not repeat generic Memory progression, full Maps crawl, planned App merge matrix or redundant control audit | Phase 1/2 raw-artifact limits and Maps 1,083 vs 1,085 snapshot conflict are preserved |
| `EPKG-004` | AI World User Research | `docs/archive/source-packages/AI_World_User_Research_Handoff.zip` | User needs, pain points, continuity, agency, creation, economics, governance and model trade-offs | [extracted README](../research/external/user-research/README.md), needs database, source index, research log and five reports | Structured qualitative public-source evidence | `FROZEN` | Do not repeat broad public-source research or infer market size | 52 Needs; 53 Sources; E01–E79; [intake](intake/2026-08-26_EPKG-004_INTAKE.md) |
| `EPKG-005` | World / Character Final Package | `docs/archive/source-packages/world-character-final-package.zip` | Original scenarios, characters, relationship patterns and candidate visuals | [extracted README](../research/external/world-character/README.md), v0.5.1 XLSX/JSON and visual queue manifest/status | Original authored/reference corpus; third-party entries `REF-ONLY` | `FROZEN` | Do not expand content/visual queue or convert third-party expression | 48 worlds; 193 characters; 28 patterns; [intake](intake/2026-08-26_EPKG-005_INTAKE.md) |
| `EPKG-006` | AI World Visual Asset Pool | `docs/archive/source-packages/AI_World_Visual_Asset_Pool_Consolidated_Handoff.zip` | Production resources, rights metadata and hygiene status | [extracted README](../research/external/visual-assets/README.md), active assets, manifest, review queue and hygiene report | Source/licence catalogue; adoption remains item-conditional | `FROZEN` | Do not infer product/brand needs or expand the pool | 314 total; 239 A-class; [intake](intake/2026-08-26_EPKG-006_INTAKE.md) |
| `EPKG-007` | Immersion Asset Library | `docs/archive/source-packages/Immersion-Asset-Library-Handoff.zip` | Audio, motion, weather/time, maps, timelines, spatial and WebGL/WebGPU references | [extracted README](../research/external/immersion/README.md), current rare-scenarios report, research files and handoff | Secondary/official-source feasibility research | `FROZEN` | Do not expand library or treat viewer/reference code as product code | Selected-tech checks only after requirements; [intake](intake/2026-08-26_EPKG-007_INTAKE.md) |
| `EPKG-008` | Creator Starter Template Library | `docs/archive/source-packages/creator_starter_template_library_handoff.zip` | Creator and simulation mechanism patterns | [extracted README](../research/external/creator-templates/README.md) and current template library | 37 authored pattern templates | `FROZEN` | Do not expand or convert example model/JSON into architecture | T01–T37; [intake](intake/2026-08-26_EPKG-008_INTAKE.md) |
| `EPKG-009` | Brand / Naming Exploration | `docs/archive/source-packages/brand_naming_handoff.zip` | Naming, positioning and promise-space alternatives | [extracted README](../research/external/brand/README.md) and final exploration board | Exploration only; preliminary availability clues | `FROZEN` | Do not finalize a candidate or run blanket clearance | `Simulora` remains working title; [intake](intake/2026-08-26_EPKG-009_INTAKE.md) |
| `EPKG-010` | Future package — Other Manus / Marvis / Anonymous material | To be recorded on receipt | Package-specific | To be identified during intake | Pending | `NOT_RECEIVED` | Package-specific; compare before any new study | Preserve original provenance and limitations |

## Coverage and repeat boundary matrix

| Domain | Existing evidence state | Current disposition | Repeat research? | What would justify targeted validation? |
|---|---|---|---|---|
| WorldOS product behavior | Frozen main corpus plus completed external merges | `FROZEN` | No | Only an approved original design is blocked by a specific OQ |
| User needs | 52 Needs / 53 Sources / E01–E79 integrated | `FROZEN` | No broad repeat | Only an approved decision passes the P0 targeted-reopen gate |
| World / Character content and visual | 48 worlds, 193 characters, 28 patterns, 40 `REF-ONLY` references and complete visual queue | `FROZEN` | No expansion | A selected candidate asset needs release review; this is adoption due diligence |
| Visual Asset Pool | 314 records with active/review/rights dispositions | `FROZEN` | No expansion or blanket cleanup | Verify the current rights of a selected asset only |
| Immersion / Living World | Current reports and reference implementation boundaries integrated | `FROZEN` | No library expansion | Benchmark only a selected effect against an approved requirement |
| Creator Starter Templates | T01–T37 mechanism library integrated | `FROZEN` | No expansion | Reopen only if an approved creator decision lacks a discriminating scenario |
| Brand exploration | Candidate directions and capability risks integrated | `FROZEN / REFERENCE ONLY` | No candidate proliferation or decision | Formal checks only after an approved shortlist |
| Cross-source synthesis | Support, complement, conflict, conditional and unknown findings merged | `FROZEN` | No broad re-study | All five P0 gate conditions must be met |

## Known gaps that do not automatically warrant research

These are carried forward as bounded gaps, not tasks:

- WorldOS entitlement-, credential-, device-, export/import-, indexing-policy-, concurrency- and long-horizon unknowns listed in `06_OPEN_QUESTIONS.md`.
- External packages with missing raw artifacts or report/screenshot mismatch.
- Contradictory dynamic snapshots such as Maps catalogue counts.
- Areas not yet covered by a received package. “Not received” is not evidence that the domain is absent or deficient.
- Product relevance of any research finding before Original Product Principles and Requirements are approved.

## Cross-source relation ledger

Append one row per material relationship. Do not collapse different scopes into one global claim.

| Relation ID | Sources | Domain | Relation type | Bounded statement | Disposition | Follow-up |
|---|---|---|---|---|---|---|
| `REL-001` | `EPKG-001` ↔ `EPKG-002` | Access / visibility / Remix | `SUPPORTING` + `COMPLEMENTARY` | External Guest/non-owner observations reinforce selected WorldOS permission and projection findings while retaining identity and sample limits. | Accepted in existing `11_PARALLEL_AUDIT_MERGE.md` | No repeat; revisit only if a future package directly conflicts. |
| `REL-002` | `EPKG-001` ↔ `EPKG-003` | Memory / Maps / external validation | `SUPPORTING` + `CONFLICT` | Manus adds cross-sample Memory timing and a Maps strict-superset snapshot; exact Maps counts differ by snapshot and remain `CONTRADICTORY_SNAPSHOT`. | Accepted in existing `12_MANUS_CROSS_AGENT_MERGE.md` | No repeat broad crawl; preserve provenance. |
| `REL-003` | `EPKG-004` ↔ `EPKG-001/003` | Continuity / Memory / state / migration | `SUPPORTING` + `COMPLEMENTARY` | User evidence establishes why continuity and control matter; WorldOS evidence supplies bounded mechanisms, boundaries and defects, not desired requirements. | Accepted | No parity-to-backlog conversion; retain user-evidence priority. |
| `REL-004` | `EPKG-004` ↔ `EPKG-008` | Participation / game loop / creator workflow | `SUPPORTING` + `CONDITIONAL` + `CONFLICT` | Templates operationalize goals, constraints, motives and causal consequences, while user evidence shows these fit some modes and conflict with companion/sandbox simplicity. | Accepted | Product Principles must choose mode/segment; no template expansion. |
| `REL-005` | `EPKG-004/001` ↔ `EPKG-007` | UI and sensory continuity | `COMPLEMENTARY` | Immersion references can express causal state, but user evidence and WorldOS defects require performance, accessibility and authoritative-state coherence. | Accepted | No viewer/UI/code adoption; selected effects only after requirements. |
| `REL-006` | `EPKG-005` ↔ `EPKG-008` | Content and mechanism coverage | `COMPLEMENTARY` | Original scenarios provide diverse test contexts for template mechanisms without proving demand or launch scope. | Accepted | No content/template expansion; third-party IP stays `REF-ONLY`. |
| `REL-007` | `EPKG-005/006/007` ↔ `EPKG-004` | Visual/immersion feasibility vs user need | `COMPLEMENTARY` + `CONDITIONAL` | Resources and technologies can support living-world presentation, but availability cannot create a requirement and must yield to accessibility, performance, cost and rights. | Accepted | Select only after original product/design decisions. |
| `REL-008` | `EPKG-009` ↔ all evidence layers | Brand promise / capability | `CONFLICT` + `CONDITIONAL` | Naming directions promise different capabilities that have not been chosen or implemented. | Accepted as open conflict | No final brand or clearance in this phase. |

## Product-relevant gap audit

The final audit is [PRODUCT_RELEVANT_GAP_AUDIT.md](../research/integration/PRODUCT_RELEVANT_GAP_AUDIT.md): `P0 = 0`, `P1 = 8`, `P2 = 6`, `IGNORE = 9`. No targeted research is proposed or authorized. Original Product Principles may begin when the user explicitly instructs it.

## Versioning and append rules

- Keep this file append-oriented. Do not rewrite historical package rows to make later conclusions look original.
- Add a dated change note for every material merge or conflict decision.
- If a package is superseded, preserve the old row and add a new row with the superseding relation.
- Never promote `EXTERNAL_REPORT_ONLY` or `CONTRADICTORY_SNAPSHOT` to `VERIFIED` without new direct evidence and explicit provenance.

### Change log

| Date | Change | Author / source |
|---|---|---|
| 2026-08-26 | Created integration inventory; registered frozen WorldOS primary, Marvis/Anonymous, and Manus merges; reserved rows for future package categories. | Research Integration Agent |
| 2026-08-26 | Completed intake for EPKG-004–009, recorded cross-source relations, completed the gap audit and froze Integrated Research v1. | Research Integration Agent |
| 2026-08-26 | Normalized EPKG-004–009 into daily readable extracted corpora under `docs/research/external/`; moved unchanged ZIP snapshots to `docs/archive/source-packages/`; updated canonical navigation without changing conclusions. | Research Repository Normalization |
