# File Retention Audit

Date: 2026-08-26 (Asia/Shanghai)

## Scope and safety rule

This audit was followed by an archive-only cleanup approved on 2026-08-26. The governing policy is **ZERO DELETE**: 23 clearly classified files were moved into `docs/archive/`, while uncertain evidence and every primary research file remained in place. Research conclusions were not edited. Existing text was changed only where navigation or a moved-file path had to be corrected.

## Repository-wide findings

- Pre-archive tree: 599 files, 141,077,090 bytes (approximately 134.54 MiB). Final tree: 599 files; the byte-total difference comes only from audited navigation/path-reference edits.
- SHA-256 duplicate groups: **0**. There are no byte-identical duplicate files to delete.
- The largest files are Manus Phase 3 rendered Maps HTML and screenshots. They are source evidence, not temporary cache by default.
- `docs/research/worldos/` remains the frozen primary research corpus. No primary research file is proposed for deletion.
- Remote test-object cleanup status is not a file-retention decision. `CLEANUP_BLOCKED`, `UNCONFIRMED_CLEANUP`, and `RETAINED_FOR_EVIDENCE` records must remain available for provenance.

## Previous deletion candidates — archive-only disposition executed

These items met a high-confidence “generated intermediate with a retained canonical result” threshold. The owner selected the safer policy: **delete nothing**. The placeholder stayed in place and the other seven items were archived.

| Candidate | Why it appears removable | Current references / evidence-chain status | Disposition |
|---|---|---|---|
| `docs/research/worldos/evidence/screenshots/.gitkeep` | One-byte legacy directory placeholder that is no longer needed because the directory now contains retained EVD screenshots. It contains no evidence itself. | No repository reference. Not referenced by `AGENTS.md`, any evidence document, or the final report. | **Retain in place; do not delete.** Moving a one-byte placeholder provides no practical benefit under the zero-delete policy. |
| `docs/archive/manus/p3-intermediate-outputs/diagnose_all_cards_output.txt` | Diagnostic stdout from the corrected Maps extractor; the canonical `MAP_ALL_CARDS.csv`, `MAP_SET_DIFFERENCE.csv`, `MAP_DUPLICATES.csv`, metadata, and final report contain the resulting facts. | No live document/report reference outside the intentionally historical `p3_inventory_paths.txt` inventory. Not referenced by `AGENTS.md` or the final report. | **ARCHIVED; retained, not deleted.** |
| `docs/archive/manus/p3-intermediate-outputs/inspect_maps_html_output.txt` | One-off parser inspection output; final Maps report and retained HTML/CSVs contain the used observations. | No live reference outside historical `p3_inventory_paths.txt`; not in `AGENTS.md` or final report. | **ARCHIVED; retained, not deleted.** |
| `docs/archive/manus/p3-intermediate-outputs/maps_sample_selection_output.txt` | Console output duplicating the deterministic sample-selection summary. The selected sample CSV and final interaction table are retained. | No live reference outside historical `p3_inventory_paths.txt`; not in `AGENTS.md` or final report. | **ARCHIVED; retained, not deleted.** |
| `docs/archive/manus/p3-intermediate-outputs/maps_set_compare_output.txt` | Console summary duplicating `maps_set_summary.json`, `MAP_SET_DIFFERENCE.csv`, `MAP_DUPLICATES.csv`, and the final report. | No live reference outside historical `p3_inventory_paths.txt`; not in `AGENTS.md` or final report. | **ARCHIVED; retained, not deleted.** |
| `docs/archive/manus/p3-intermediate-outputs/maps_task4_build_output.json` | Small build-return payload listing generated output paths and row counts; those outputs are retained and independently indexed. | No live reference outside historical `p3_inventory_paths.txt`; not in `AGENTS.md` or final report. | **ARCHIVED; retained, not deleted.** |
| `docs/archive/manus/p3-obsolete-build-tooling/build_p3_bundle.py` | Historical `/home/ubuntu` packaging script; the final evidence package is already unpacked, the expected staging/archive environment is absent, and the script has no live consumer. | No repository reference. Not in `AGENTS.md`, evidence indexes, or final report. | **ARCHIVED; do not execute or delete.** |
| `docs/archive/manus/p3-obsolete-build-tooling/build_p3_summary_index.py` | Obsolete generator containing pre-cleanup summary/index templates. Running it would overwrite the later canonical Phase 3 summary/index with an older state. | No repository reference. Not in `AGENTS.md`, evidence indexes, or final report. | **ARCHIVED; do not execute or delete.** |

These eight candidates total approximately 51.7 KiB. Archiving them improves classification but does not reduce repository size; that is now the intended tradeoff.

## Archive dispositions — executed

| Candidate | Why it is not a current navigation source | References / evidence status | Disposition |
|---|---|---|---|
| `docs/archive/coordination/completed/delegations/EXTERNAL_AGENT_DELEGATION_RECOMMENDATIONS.md` | The proposed external tasks have finished or been superseded by later phases. It is project history, not a product requirement or research conclusion. | Historical move recorded in the reorganization manifest; not referenced by `AGENTS.md`, the evidence chain, or final report. | **ARCHIVED; retained, not deleted.** |
| `docs/archive/coordination/completed/delegations/MANUS_PHASE2_DELEGATION.md` | Completed Phase 2 task brief. | Historical move recorded in the reorganization manifest; not referenced by current evidence or final report. | **ARCHIVED; retained, not deleted.** |
| `docs/archive/coordination/completed/delegations/MANUS_PHASE3_DELEGATION.md` | Completed Phase 3 task brief. | Historical move recorded in the reorganization manifest; not referenced by current evidence or final report. | **ARCHIVED; retained, not deleted.** |
| `docs/archive/coordination/completed/handoffs/MARVIS_HANDOFF_FINAL.md` | Completed handoff whose resulting evidence has already been merged. | README points to its archive path; not cited as product evidence. | **ARCHIVED; retained, not deleted.** |
| `docs/archive/marvis/phase-4/local-preflight-and-corrections/00_PROVENANCE_ERRATUM.md` | Important correction retained as historical local-preflight provenance. | README points to its archive path; current merge uses preserved external evidence. | **ARCHIVED; retained, not deleted.** |
| `docs/archive/marvis/phase-4/local-preflight-and-corrections/01_APP_B_GUEST_RECHECK.md` | Superseded by corrected external recheck, retained as a historical local-preflight narrative. | Its moved copy links to current transcript/report paths; the subject remains represented in the main evidence indexes. | **ARCHIVED; retained, not deleted.** |
| `docs/archive/marvis/phase-4/local-preflight-and-corrections/02_COLLECTION_LINK_VISIBLE_RECHECK.md` | Earlier local-preflight record; corrected final result remains in the external phase-4 raw/report package. | No live current-navigation role. | **ARCHIVED; retained, not deleted.** |
| `docs/archive/marvis/phase-4/local-preflight-and-corrections/03_REMIX_DISABLED_RECHECK.md` | Earlier local-preflight record; corrected final result remains in the external phase-4 raw/report package. | No live current-navigation role. | **ARCHIVED; retained, not deleted.** |
| `docs/archive/marvis/phase-4/local-preflight-and-corrections/04_PHASE4_REPORT.md` | Concise historical summary retained alongside the local-preflight corrections. | No current navigation role; final merge uses the preserved external evidence package. | **ARCHIVED; retained, not deleted.** |
| `docs/research/external/marvis/phase-4/05_APP_B_GUEST_RECHECK_USER_TRANSCRIPT.md` | User-supplied transcript, not a raw screenshot package; it preserves provenance for the original App discrepancy. | Referenced by phase-4 App report and second-account gap documentation. | **Keep current**; not a deletion candidate. |
| `docs/research/external/marvis/phase-4/06_APP_RECHECK_001_EXTERNAL_MARVIS.md` | Detailed external witness report; it is the archival source for EVD-0179 wording even though later state supersedes it for current direct access. | Referenced by `07_EVIDENCE_INDEX.md`, `08_MISSING_FEATURE_AUDIT.md`, `11_PARALLEL_AUDIT_MERGE.md`, and `phase-4/01_APP_B_GUEST_RECHECK.md`. | **Keep current**; not removable. |
| `docs/archive/manus/p3-reproduction-tooling/build_maps_task4_deliverables.py` | Completed generator for the readable Maps deliverables. It is not a product source, but it preserves derivation logic. | Historical inventory only; outputs remain in the active Manus evidence package. | **ARCHIVED; retained, not deleted.** |
| `docs/archive/manus/p3-reproduction-tooling/compare_maps_sets.py` | Recomputes set differences from retained exports. | Historical inventory only; no current navigation role. | **ARCHIVED; retained, not deleted.** |
| `docs/archive/manus/p3-reproduction-tooling/extract_maps_cards.py` | Original base-scope extractor; useful for provenance/reproduction but not current navigation. | Historical inventory only; retained for provenance. | **ARCHIVED; retained, not deleted.** |
| `docs/archive/manus/p3-reproduction-tooling/extract_maps_cards_generic.py` | Corrected property-tolerant extractor that produced the terminal all-scope export. | Historical inventory only; retained for provenance. | **ARCHIVED; retained, not deleted.** |
| `docs/archive/manus/p3-reproduction-tooling/diagnose_all_cards.py` | One-off diagnostic helper superseded by the corrected extractor. | Historical inventory only. | **ARCHIVED; retained, not deleted.** |
| `docs/archive/manus/p3-reproduction-tooling/inspect_maps_html.py` | One-off HTML structure inspection helper. | Historical inventory only. | **ARCHIVED; retained, not deleted.** |
| `docs/archive/manus/p3-reproduction-tooling/select_only_all_samples.py` | Encodes the deterministic seed-based sample selection. | Historical inventory only; selected CSV/report are retained. | **ARCHIVED; retained, not deleted.** |
| `docs/archive/marvis/phase-3/pre-final-recheck/*` | Earlier Marvis Phase 3 snapshot. Some files are superseded by final recheck, but the archive summary and merge docs still refer to the pre-final state. | Four files are referenced by historical/final summaries and `11_PARALLEL_AUDIT_MERGE.md`; they document state before the final correction. | **Keep in archive**; do not delete. |

## Retain — do not delete

The following categories were checked and should remain:

- All substantive `docs/research/worldos/**` primary evidence, specs, audits, and fixtures. The one-byte screenshot `.gitkeep` was reviewed separately and retained in place.
- Manus `p3/screenshots/*.webp`: the package explicitly retained 364 unique screenshots after byte-level deduplication. Only 61 are directly named outside the historical inventory, but the remaining files are still part of the retained long-run evidence set; lack of a direct text reference is not enough to delete them.
- Manus `p3/browser_html/worldos_cc_maps_1787653433922.html` and `worldos_cc_maps_1787653893171.html`: terminal 1,085/1,181-card sources used to regenerate and verify the Maps CSVs and cited by the merge audit.
- Manus `p3/browser_html/worldos_cc_maps_1787653180545.html`: initial 16-card snapshot cited by `maps_catalog_run_log.md`.
- Manus `p3/browser_html/worldos_cc_maps_1787653336833.html`, `1787654140385.html`, and `1787654377235.html`: not currently cited by live reports, but they are distinct time/state captures from the same Maps run and no high-confidence proof establishes them as disposable. **Uncertain—retain.**
- `MANUS_P3_SCREENSHOT_DEDUP_MANIFEST.md`, `ADDITIONAL_DEDUP_MANIFEST.md`, cleanup manifests, evidence indexes, and raw run notes: these are provenance and deletion-boundary records, not clutter.
- `phase2_started_at.txt`: cited by the Manus evidence index and Additional dedup manifest; retain as a timing anchor.
- Local upload fixtures under Manus and primary avatar fixtures: referenced by evidence indexes or explicitly marked `LOCAL_FIXTURE_RETAINED`; retain for reproducibility.
- The completed coordination/delegation/handoff documents were retained through archival relocation, not deletion.
- `outputs/` and `work/` empty directories: harmless placeholders for later implementation work; not files and not part of this deletion audit.

## Definite “no candidate” findings

- No duplicate files by SHA-256.
- No primary final report or `AGENTS.md` file is redundant.
- No file can be safely deleted solely because it is large, unreferenced by a Markdown link, named `raw`, or located under `archive`.
- No Manus cleanup manifest authorizes deleting local evidence; remote test-object cleanup status is separate from local-file retention.

## Decision summary

- **Deletion policy:** **ZERO DELETE**. The 8 former deletion candidates are now archive/retain-only items.
- **Archived in this pass:** 23 files moved to `docs/archive/`; all retained byte content was preserved. The `.gitkeep` and uncertain evidence stayed in place.
- **Uncertain items:** all unreferenced Manus HTML/screenshots and raw scripts not explicitly listed above; retain.
- **Files changed by this operation:** navigation/audit files (`AGENTS.md`, `docs/README.md`, this audit, and `docs/REORGANIZATION_MANIFEST.md`) plus one archived Marvis narrative whose internal paths were corrected. No research conclusion or raw evidence content was rewritten.
- **Verification:** 599 files accounted for exactly once, zero missing or extra paths, zero duplicate SHA-256 groups, and 47/47 local Markdown links resolved.
