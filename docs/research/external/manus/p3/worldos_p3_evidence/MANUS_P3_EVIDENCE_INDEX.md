# MANUS P3 — Evidence Index

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
