# Repository Reorganization Manifest

Date: 2026-08-25 (Asia/Shanghai)

## Scope

This reorganization separates the main WorldOS research, external-Agent evidence, final deliverables, coordination material, source material, and historical archives. No existing file was deleted as part of this operation. Research findings, evidence status, confidence, and conclusions were not rewritten; edits to existing files were limited to paths and navigation text required by the move.

## Move Map

| Previous path | Current path |
|---|---|
| `docs/worldos-research/` | `docs/research/worldos/` |
| `docs/worldos-second-account-audit/` | `docs/research/external/marvis/second-account/` |
| `docs/worldos-anonymous-audit/` | `docs/research/external/anonymous/` |
| `docs/phase-3/` | `docs/research/external/marvis/phase-3/` |
| `docs/phase-4/` | `docs/research/external/marvis/phase-4/` |
| `docs/manus-incoming/` | `docs/research/external/manus/` |
| `pasted-text-1.txt` | `docs/source-materials/worldos/MASTER_SPECIFICATION_WORLDOS.txt` |
| `MARVIS_HANDOFF.md` | `docs/archive/coordination/MARVIS_HANDOFF_INITIAL.md` |
| `docs/MARVIS_HANDOFF.md` | `docs/archive/coordination/completed/handoffs/MARVIS_HANDOFF_FINAL.md` |
| `docs/EXTERNAL_AGENT_DELEGATION_RECOMMENDATIONS.md` | `docs/archive/coordination/completed/delegations/EXTERNAL_AGENT_DELEGATION_RECOMMENDATIONS.md` |
| `docs/MANUS_PHASE2_DELEGATION.md` | `docs/archive/coordination/completed/delegations/MANUS_PHASE2_DELEGATION.md` |
| `docs/MANUS_PHASE3_DELEGATION.md` | `docs/archive/coordination/completed/delegations/MANUS_PHASE3_DELEGATION.md` |
| `docs/worldos-research/FINAL_WORLDOS_RESEARCH_REPORT.md` | `docs/deliverables/worldos-research/FINAL_WORLDOS_RESEARCH_REPORT.md` |
| `docs/manus-incoming/Additional/` | `docs/archive/manus/additional-timeline-variants/` |
| `docs/phase-3/archive/` | `docs/archive/marvis/phase-3/` |

## Added Navigation

- `docs/README.md` is the human-readable documentation map.
- This manifest records the migration and validation boundary.
- `AGENTS.md` now points future agents to the current hierarchy and canonical sources.

## Intentional Historical Path Strings

Not every old-looking path is a live navigation link:

- `docs/source-materials/worldos/MASTER_SPECIFICATION_WORLDOS.txt` is the immutable task specification. Its prescribed original output paths remain historical instructions and were not rewritten.
- Manus Phase 3 `README.md` and `UNVERIFIED_CONTROLS.md` record that particular `docs/worldos-research/...` inputs were unavailable in Manus's separate `/home/ubuntu` environment. Those task-time observations remain unchanged.
- `docs/research/external/manus/ADDITIONAL_DEDUP_MANIFEST.md` lists deleted pre-reorganization aliases beginning with `Additional/`. They are historical names, not live links; the two retained unique variants now point to their current archive paths.
- Marvis's final second-account report retains its own task-time `output\\worldos-second-account-audit\\` provenance string. It does not describe a current repository path.
- `docs/research/external/manus/p3/worldos_p3_evidence/raw/p3_inventory_paths.txt` is a preserved pre-archive inventory. Its former Phase 3 raw-tooling/output paths intentionally describe the package at capture time and are not live navigation links.

## Archive-only cleanup — 2026-08-26

The owner selected a zero-delete policy after the file-retention audit. The following 23 files were reclassified into `docs/archive/`; no file content or research conclusion was removed.

| Previous path | Archive path |
|---|---|
| `docs/coordination/delegations/EXTERNAL_AGENT_DELEGATION_RECOMMENDATIONS.md` | `docs/archive/coordination/completed/delegations/EXTERNAL_AGENT_DELEGATION_RECOMMENDATIONS.md` |
| `docs/coordination/delegations/MANUS_PHASE2_DELEGATION.md` | `docs/archive/coordination/completed/delegations/MANUS_PHASE2_DELEGATION.md` |
| `docs/coordination/delegations/MANUS_PHASE3_DELEGATION.md` | `docs/archive/coordination/completed/delegations/MANUS_PHASE3_DELEGATION.md` |
| `docs/coordination/handoffs/MARVIS_HANDOFF_FINAL.md` | `docs/archive/coordination/completed/handoffs/MARVIS_HANDOFF_FINAL.md` |
| `docs/research/external/marvis/phase-4/00_PROVENANCE_ERRATUM.md` | `docs/archive/marvis/phase-4/local-preflight-and-corrections/00_PROVENANCE_ERRATUM.md` |
| `docs/research/external/marvis/phase-4/01_APP_B_GUEST_RECHECK.md` | `docs/archive/marvis/phase-4/local-preflight-and-corrections/01_APP_B_GUEST_RECHECK.md` |
| `docs/research/external/marvis/phase-4/02_COLLECTION_LINK_VISIBLE_RECHECK.md` | `docs/archive/marvis/phase-4/local-preflight-and-corrections/02_COLLECTION_LINK_VISIBLE_RECHECK.md` |
| `docs/research/external/marvis/phase-4/03_REMIX_DISABLED_RECHECK.md` | `docs/archive/marvis/phase-4/local-preflight-and-corrections/03_REMIX_DISABLED_RECHECK.md` |
| `docs/research/external/marvis/phase-4/04_PHASE4_REPORT.md` | `docs/archive/marvis/phase-4/local-preflight-and-corrections/04_PHASE4_REPORT.md` |
| `docs/research/external/manus/p3/worldos_p3_evidence/raw/build_p3_bundle.py` | `docs/archive/manus/p3-obsolete-build-tooling/build_p3_bundle.py` |
| `docs/research/external/manus/p3/worldos_p3_evidence/raw/build_p3_summary_index.py` | `docs/archive/manus/p3-obsolete-build-tooling/build_p3_summary_index.py` |
| `docs/research/external/manus/p3/worldos_p3_evidence/raw/build_maps_task4_deliverables.py` | `docs/archive/manus/p3-reproduction-tooling/build_maps_task4_deliverables.py` |
| `docs/research/external/manus/p3/worldos_p3_evidence/raw/compare_maps_sets.py` | `docs/archive/manus/p3-reproduction-tooling/compare_maps_sets.py` |
| `docs/research/external/manus/p3/worldos_p3_evidence/raw/diagnose_all_cards.py` | `docs/archive/manus/p3-reproduction-tooling/diagnose_all_cards.py` |
| `docs/research/external/manus/p3/worldos_p3_evidence/raw/extract_maps_cards.py` | `docs/archive/manus/p3-reproduction-tooling/extract_maps_cards.py` |
| `docs/research/external/manus/p3/worldos_p3_evidence/raw/extract_maps_cards_generic.py` | `docs/archive/manus/p3-reproduction-tooling/extract_maps_cards_generic.py` |
| `docs/research/external/manus/p3/worldos_p3_evidence/raw/inspect_maps_html.py` | `docs/archive/manus/p3-reproduction-tooling/inspect_maps_html.py` |
| `docs/research/external/manus/p3/worldos_p3_evidence/raw/select_only_all_samples.py` | `docs/archive/manus/p3-reproduction-tooling/select_only_all_samples.py` |
| `docs/research/external/manus/p3/worldos_p3_evidence/raw/diagnose_all_cards_output.txt` | `docs/archive/manus/p3-intermediate-outputs/diagnose_all_cards_output.txt` |
| `docs/research/external/manus/p3/worldos_p3_evidence/raw/inspect_maps_html_output.txt` | `docs/archive/manus/p3-intermediate-outputs/inspect_maps_html_output.txt` |
| `docs/research/external/manus/p3/worldos_p3_evidence/raw/maps_sample_selection_output.txt` | `docs/archive/manus/p3-intermediate-outputs/maps_sample_selection_output.txt` |
| `docs/research/external/manus/p3/worldos_p3_evidence/raw/maps_set_compare_output.txt` | `docs/archive/manus/p3-intermediate-outputs/maps_set_compare_output.txt` |
| `docs/research/external/manus/p3/worldos_p3_evidence/raw/maps_task4_build_output.json` | `docs/archive/manus/p3-intermediate-outputs/maps_task4_build_output.json` |

## Verification

### Initial reorganization — 2026-08-25

- Pre-move manifest: 596 files, each recorded with relative path, byte length, and SHA-256.
- Post-move tree: all 596 baseline files map to exactly one current path; no baseline file is missing and no path collision occurred.
- 576 baseline files remain byte-for-byte identical. The remaining 20 are the audited set whose path/navigation references were updated after relocation.
- Two new navigation files were added (`docs/README.md` and this manifest), producing 598 files in total.
- Post-move SHA-256 scan found zero byte-identical duplicate groups.
- Markdown-link validation checked 47 local links and found zero broken targets.
- Stale-path scan found only the intentional historical strings documented above and the old-path side of this move table.

### Archive-only cleanup — 2026-08-26

- Pre-archive manifest: 599 files, 141,077,090 bytes, each recorded with relative path, byte length, and SHA-256.
- Post-archive tree: 599 files. Every baseline file maps to exactly one current path; no file is missing, duplicated by migration, or present at an unexpected extra path.
- All 23 intended moves completed without overwrite. Twenty-two moved files remain byte-for-byte identical; the archived `01_APP_B_GUEST_RECHECK.md` changed only to replace two now-invalid sibling references with explicit current repository paths.
- Hash changes are restricted to five audited files: `AGENTS.md`, `docs/README.md`, this manifest, `docs/FILE_RETENTION_AUDIT.md`, and the archived Marvis path-correction file above.
- Post-archive SHA-256 scan found zero byte-identical duplicate groups.
- Markdown-link validation checked 47 local links and found zero broken targets.
- Actionable stale-path scan found none. Remaining old paths are limited to the old-path side of the move tables and the intentional historical `p3_inventory_paths.txt` inventory documented above.
- No file was deleted. The byte-total change after the pass comes only from the five audited navigation/path-reference edits.
