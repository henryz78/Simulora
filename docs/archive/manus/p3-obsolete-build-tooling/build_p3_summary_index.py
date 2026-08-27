from pathlib import Path

ROOT = Path('/home/ubuntu/worldos_p3_evidence')
summary_path = ROOT / 'MANUS_P3_EXECUTIVE_SUMMARY.md'
index_path = ROOT / 'MANUS_P3_EVIDENCE_INDEX.md'

summary = '''# MANUS P3 — Executive Summary

**Run date:** 2026-08-25 (Asia/Shanghai)  
**Owner session:** `idakellams159`  
**Scope:** Exactly four bounded Phase 3 tasks. All findings are normal, visible-UI observations. No direct API, browser-storage inspection or mutation, payment, membership, Credits, real API key, stress/concurrency test, or third-party write was used.

> **Interpretation rule.** Status labels are evidence labels, not product-wide claims. `CONFIRMED` means the listed visible result was observed for the named object and moment; `NOT_VERIFIED`, `TOOLING_BLOCKED`, and `UNKNOWN` must not be converted into negative product claims.

## Overall task register

| Task | Completion disposition | Core confirmed result | Principal boundary | Primary report |
|---|---|---|---|---|
| 1. Page-Level Control Delta Ledger | Completed to input-availability boundary | 18 required page rows and safe visible controls were recorded; two normal visible trigger/recovery records were confirmed. | Required historic audit/site-map inputs were locally unavailable; broad re-audit was deliberately not reconstructed. | [MANUS_P3_PAGE_CONTROL_LEDGER.md](MANUS_P3_PAGE_CONTROL_LEDGER.md) |
| 2. Character Memory Long-Run Generalization | Complete / bounded stop | In B, the first visible editable Memory appeared after T15 and by T20; manual `MANUAL_CONFLICT_B` persistence survived one reload and remained visible through T35. | A stopped after T20 under a three-failed-normal-UI input condition; model-variation and several generalizations remain unavailable. | [MANUS_P3_CHARACTER_MEMORY_LONGRUN.md](MANUS_P3_CHARACTER_MEMORY_LONGRUN.md) |
| 3. App Runtime State Migration Edge Matrix | TOOLING_BLOCKED before runtime prerequisite | P3 App v1 was saved, published, and visibly showed its inspector on the public App page. | Required World cover upload could not complete through the surfaced normal file-upload UI, so no World, install, Simulation, Apply, reload, or v2–v5 runtime transition occurred. | [MANUS_P3_APP_MERGE_EDGE_MATRIX.md](MANUS_P3_APP_MERGE_EDGE_MATRIX.md) |
| 4. Maps `有底图` vs `全部` set difference | Complete | Terminal visible href catalogues: 1,085 in `有底图`, 1,181 in `全部`; intersection 1,085; only-`全部` 96; only-`有底图` 0. | Href membership is a rendered UI result, not a Map ID or hidden-state inference. | [MANUS_P3_MAP_CATALOG_DIFF.md](MANUS_P3_MAP_CATALOG_DIFF.md) |

## Key findings by task

### Task 1 — control delta ledger

The ledger classifies all 18 requested page rows, preserves P1/P2 work as **PREVIOUSLY_COVERED**, and explicitly records safe visible baseline controls, third-party-write blocks, and the missing-input limitation. It does not represent a reconstructed site-wide control audit. The high-confidence visible trigger/recovery evidence is limited to opening and closing the Mingyu Character detail modal and opening the owner P3 App editor route.

### Task 2 — Character Memory

Both fresh simulations began with the visible empty Memory state. Sample A (Paul Banks, source `NYC`) remained empty at T0/T5/T10/T15/T20, then was **TOOLING_BLOCKED** from a controlled T22 onward; its own T20 pre-auto-Memory checkpoint branch `MANUS-P3-A-T20-Memory-Baseline` was visibly created. Sample B (Mingyu, source `偶像团体`) first displayed one editable Memory card at T20. Replacing the card fact `folded train ticket` with `MANUAL_CONFLICT_B` persisted across one normal reload and remained on the single visible card through T35. A later explicit recall answer still referred to “a folded ticket,” so only that one wording/result is confirmed; causal retrieval semantics and general behavior are **NOT_VERIFIED**.

### Task 3 — App runtime migration

The owned published App is [MANUS-P3-MERGE-RUNTIME-EDGE](https://worldos.cc/apps/manus-p3-merge-runtime-edge). Its v1 seed visibly includes primitive and object no-ID arrays, duplicate IDs, scalar, object, null, nested fields, and audit fields, plus Dirty A/Clean B controls. Because no P3 World could be created past the required-cover upload, runtime migration outcomes are intentionally not inferred. This App is the only Task 3 remote asset requiring final cleanup consideration.

### Task 4 — Maps catalogue difference

Both main scopes started with 16 cards and were taken to their no-growth terminal criteria. The terminal set result is directional: all observed `有底图` hrefs were also observed in `全部`; 96 observed hrefs were only in `全部`. There were no repeated href occurrences in either export, but there were same-title/different-href groups, so title alone is not a stable identity. Ten deterministic only-`全部` sample cards completed preview/close, exact detail-link trigger, and first-layer `用此地图` open/Escape-cancel without any World selection or map write. Genre results were: DnD 0/0; 动漫 272/334; 科幻 54/57; 恋爱 92/140 (`有底图`/`全部`).

## Remote P3 asset register at transition to cleanup

| Asset | URL / identity | Creation/observation result | Pre-cleanup state |
|---|---|---|---|
| Task 3 App v1 | `MANUS-P3-MERGE-RUNTIME-EDGE`; [public page](https://worldos.cc/apps/manus-p3-merge-runtime-edge) | Published v1 **CONFIRMED**; public page showed Owner and 0 worlds use it. | Pending final normal-UI cleanup attempt. |
| Task 3 World | Intended `MANUS-P3-MERGE-WORLD-*` | Not created; cover upload prerequisite **TOOLING_BLOCKED**. | `ALREADY_ABSENT` expected pending manifest verification. |
| Task 3 Simulations A/B | Intended runtime test fixtures | Not created, because no World/App install. | `ALREADY_ABSENT` expected pending manifest verification. |
| Task 2 A checkpoint | `MANUS-P3-A-T20-Memory-Baseline`; [branch](https://worldos.cc/sim/f9302cfd-9c74-44d7-bb5c-c28a22430a24) | Visible branch creation **CONFIRMED**. | Pending final normal-UI cleanup assessment. |
| Task 2 chats | Paul Banks and Mingyu public-Character simulations | Used for bounded Task 2 evidence. | Pending final normal-UI cleanup assessment; no third-party Character was edited. |
| Task 4 Maps | Third-party catalogues only | No remote P3 Map asset was created or modified. | `ALREADY_ABSENT` for P3 Map asset class. |

## Final evidence boundary

The final cleanup manifest will replace the pre-cleanup states above with only one of the allowed dispositions: **CLEANED**, **ALREADY_ABSENT**, **CLEANUP_BLOCKED**, or **RETAINED_FOR_EVIDENCE + reason**. A route change, timeout, or lack of visible feedback never counts as cleanup confirmation.
'''
summary_path.write_text(summary, encoding='utf-8')

index = '''# MANUS P3 — Evidence Index

**Purpose.** This index maps the four bounded Phase 3 tasks to their readable reports, structured data, evidence logs, terminal screenshots, test URLs, and cleanup record. It does not merge or modify other agents’ materials.

## Start here

| Reading priority | Artifact | Why it is primary |
|---:|---|---|
| 1 | [MANUS_P3_EXECUTIVE_SUMMARY.md](MANUS_P3_EXECUTIVE_SUMMARY.md) | Cross-task status, confirmed findings, boundaries, and remote P3 asset register. |
| 2 | [MANUS_P3_CLEANUP_MANIFEST.md](MANUS_P3_CLEANUP_MANIFEST.md) | Final asset-by-asset disposition. Read together with the executive summary. |
| 3 | [MANUS_P3_PAGE_CONTROL_LEDGER.md](MANUS_P3_PAGE_CONTROL_LEDGER.md) | Task 1 readable delta result and missing-input limitation. |
| 4 | [MANUS_P3_CHARACTER_MEMORY_LONGRUN.md](MANUS_P3_CHARACTER_MEMORY_LONGRUN.md) | Task 2 turns, checkpoint, conflict edit/reload, and recall boundary. |
| 5 | [MANUS_P3_APP_MERGE_EDGE_MATRIX.md](MANUS_P3_APP_MERGE_EDGE_MATRIX.md) | Task 3 App v1 evidence and World-upload prerequisite blocker. |
| 6 | [MANUS_P3_MAP_CATALOG_DIFF.md](MANUS_P3_MAP_CATALOG_DIFF.md) | Task 4 terminal scope counts, set difference, samples, and genre comparisons. |

## Task 1 — Page-Level Control Delta Ledger

| Artifact | Type | Content / evidence role |
|---|---|---|
| `MANUS_P3_PAGE_CONTROL_LEDGER.md` | Readable report | 18 page rows, status vocabulary, safe visible controls, trigger/recovery record, input limitation. |
| `MANUS_P3_PAGE_CONTROL_LEDGER.csv` | Structured ledger | Per-control URL, object/identity, status, visible feedback, recovery and boundary. |
| `UNVERIFIED_CONTROLS.md` | Boundary report | Explicit reasons for `NOT_VERIFIED`, `BLOCKED`, and `TOOLING_BLOCKED` residuals. |
| `README.md` | Scope record | Four-task limit, visible-UI-only constraints, missing historic inputs, approved cleanup statuses. |
| `/home/ubuntu/screenshots/worldos_cc_2026-08-25_10-15-03_9123.webp` through `...10-17-41_8427.webp` | Screenshots | Home/nav, World detail/search, Character Library/modal/recovery, owner P3 App, Community baselines. Exact files are named in the Task 1 report. |

## Task 2 — Character Memory Long-Run Generalization

| Artifact | Type | Content / evidence role |
|---|---|---|
| `MANUS_P3_CHARACTER_MEMORY_LONGRUN.md` | Readable report | Sample register, checkpoints, A branch, B edit/reload, recall and model availability boundaries. |
| `MANUS_P3_CHARACTER_MEMORY_TURNS.csv` | Structured turns | Checkpoint/turn-level evidence for A and B. |
| `raw/character_memory_run_notes.md` | Chronology | Sample A timeline, T20 branch, and three-failure stop. |
| `raw/character_memory_sample_b_notes.md` | Chronology | Sample B model availability, T20 first Memory, edit/reload and T29 recall. |
| `https://worldos.cc/sim/fa53cd75-4e45-4812-993f-d83c08423626` | Test URL | Sample A original simulation. |
| `https://worldos.cc/sim/f9302cfd-9c74-44d7-bb5c-c28a22430a24` | Test URL | Confirmed A T20 checkpoint branch. |
| `https://worldos.cc/sim/6062b6fa-f28c-4406-ac79-3092e05f8f29` | Test URL | Sample B simulation. |
| `/home/ubuntu/screenshots/worldos_cc_2026-08-25_09-11-27_5790.webp` through `...10-00-31_6099.webp` | Screenshots | A empty checkpoints and B first Memory/edit/reload/later persistence; exact selection in Task 2 report. |

## Task 3 — App Runtime State Migration Edge Matrix

| Artifact | Type | Content / evidence role |
|---|---|---|
| `MANUS_P3_APP_MERGE_EDGE_MATRIX.md` | Readable report | Published v1, planned shapes, unexecuted migration matrix, cover-upload blocker. |
| `MANUS_P3_APP_MERGE_PATHS.csv` | Structured paths | v1 publish/timeline and v2–v5 non-execution statuses. |
| `raw/app_merge_planning.md` | Chronology | Normal App Studio flow, world creation and upload failure boundary. |
| `manus_p3_merge_world_cover.jpg` | Local harmless fixture | Original 16:9 cover prepared but never uploaded. |
| `https://worldos.cc/apps/manus-p3-merge-runtime-edge` | Test URL | Published P3 App v1 public page. |
| `/home/ubuntu/screenshots/worldos_cc_2026-08-25_10-03-44_7258.webp` through `...10-11-28_7377.webp` | Screenshots | Studio, publish, public app page, World cover requirement, and upload target errors. |

## Task 4 — Maps `有底图` versus `全部`

| Artifact | Type | Content / evidence role |
|---|---|---|
| `MANUS_P3_MAP_CATALOG_DIFF.md` | Readable report | Scope terminal conditions, href difference, sample interaction boundary, genre comparisons. |
| `MAP_BASE_CARDS.csv` | Terminal card export | 1,085 observed `有底图` card rows. |
| `MAP_ALL_CARDS.csv` | Terminal card export | 1,181 observed `全部` card rows. |
| `MAP_SET_DIFFERENCE.csv` | Structured comparison | Intersection and directional href membership. |
| `MAP_DUPLICATES.csv` | Structured duplicates | Repeated-href and same-title/different-href records. |
| `MAP_ONLY_ALL_SAMPLE_SELECTION.csv` | Selection input | Fixed seed and exact ten only-all members. |
| `MAP_ONLY_ALL_SAMPLE_INTERACTIONS.csv` / `.md` | Interaction evidence | All ten limited preview/detail-trigger/use-first-layer/cancel outcomes and screenshot paths. |
| `MAP_GENRE_COMPARISON.csv` | Filter comparison | DnD, 动漫, 科幻, 恋爱 terminal counts in both scopes. |
| `raw/maps_catalog_run_log.md` | Timeline | Initial 16, append counts, no-growth terminal checks, scope switch, genre runs. |
| `raw/maps_only_all_sample_interactions.md` | Detailed chronology | Exact card disambiguation and per-sample interaction outcomes. |
| `/home/ubuntu/screenshots/worldos_cc_2026-08-25_10-26-31_4258.webp` | Terminal screenshot | `有底图` completion boundary. |
| `/home/ubuntu/screenshots/worldos_cc_2026-08-25_10-31-31_3115.webp` | Terminal screenshot | `全部` completion boundary. |

## Cleanup and limitations

The final cleanup disposition must be read from `MANUS_P3_CLEANUP_MANIFEST.md`. Task 1’s required historical control-audit inputs were unavailable; Task 2 has A branch and model-availability bounds; Task 3 runtime work is stopped at the required cover-upload prerequisite; Task 4 observes terminal visible World-href collections only. In every case, these are evidence boundaries, not inferred product behavior.
'''
index_path.write_text(index, encoding='utf-8')

print(str(summary_path))
print(str(index_path))
