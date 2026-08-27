# Manus Additional Package Dedup Manifest

Date: 2026-08-25 (Asia/Shanghai)

The original `Additional` package, now archived at `docs/archive/manus/additional-timeline-variants/`, was compared against the canonical `docs/research/external/manus/` package with SHA-256 and file length. Files were removed only when their bytes were identical to a retained canonical copy. The package did not contain the missing Phase 1/2 browser screenshots or saved HTML evidence; its only image assets were the existing upload-test fixtures.

## Retained unique source variants

| Retained path | Reason |
|---|---|
| `docs/archive/manus/additional-timeline-variants/p1/EXT_APP_INDEX_TIMELINE.md` | Earlier source variant. The archived top-level copy adds later archive-status, cancelled-long-wait and time-label caution notes; no observation rows are added by this variant. |
| `docs/archive/manus/additional-timeline-variants/worldos_p2_evidence/MANUS_P2_NONAPP_INDEX_TIMELINE.md` | Earlier source variant. The archived copy adds only the final time-label and coverage-boundary interpretation notes. |

The renamed `Additional/worldos_p2_evidence/MANUS-P2 非 App 公开发现短窗口时间线.md` was byte-identical to the retained Additional timeline and was removed. Paths beginning with `Additional/` below are historical pre-cleanup alias names, not current live links.

## Removed exact duplicates

| Removed alias | Retained canonical copy |
|---|---|
| `Additional/p1/WorldOS 外部测试：账号可用性验证.md` | `EXT_WORLDOS_ACCOUNT_VERIFICATION.md` |
| `Additional/p1/WorldOS 外部受控验证报告.md` | `WORLDOS_EXTERNAL_VALIDATION_REPORT.md` |
| `Additional/p1/WorldOS EXT-GIFT 交易隔离实验日志.md` | `EXT_GIFT_TRANSACTION_LOG.md` |
| `Additional/worldos_p2_evidence/app_creator_inventory.md` | `worldos_p2_evidence/app_creator_inventory.md` |
| `Additional/worldos_p2_evidence/character_creator_inventory.md` | `worldos_p2_evidence/character_creator_inventory.md` |
| `Additional/worldos_p2_evidence/collection_creator_inventory.md` | `worldos_p2_evidence/collection_creator_inventory.md` |
| `Additional/worldos_p2_evidence/MANUS_P2_CLEANUP_MANIFEST.md` | `worldos_p2_evidence/MANUS_P2_CLEANUP_MANIFEST.md` |
| `Additional/worldos_p2_evidence/MANUS_P2_CREATOR_FIELD_RESULTS.csv` | `worldos_p2_evidence/MANUS_P2_CREATOR_FIELD_RESULTS.csv` |
| `Additional/worldos_p2_evidence/MANUS_P2_CREATOR_VALIDATION_MATRIX.md` | `worldos_p2_evidence/MANUS_P2_CREATOR_VALIDATION_MATRIX.md` |
| `Additional/worldos_p2_evidence/MANUS_P2_LOCALE_ROUTING_MATRIX.md` | `worldos_p2_evidence/MANUS_P2_LOCALE_ROUTING_MATRIX.md` |
| `Additional/worldos_p2_evidence/MANUS_P2_RESPONSIVE_MATRIX.md` | `worldos_p2_evidence/MANUS_P2_RESPONSIVE_MATRIX.md` |
| `Additional/worldos_p2_evidence/MANUS-P2 响应式交互矩阵.md` | `worldos_p2_evidence/MANUS_P2_RESPONSIVE_MATRIX.md` |
| `Additional/worldos_p2_evidence/MANUS-P2 Cleanup Manifest.md` | `worldos_p2_evidence/MANUS_P2_CLEANUP_MANIFEST.md` |
| `Additional/worldos_p2_evidence/MANUS-P2 Creator Field, Validation and Recovery Matrix.md` | `worldos_p2_evidence/MANUS_P2_CREATOR_VALIDATION_MATRIX.md` |
| `Additional/worldos_p2_evidence/MANUS-P2 Locale、Deep-Link 与 Browser-History Routing Matrix.md` | `worldos_p2_evidence/MANUS_P2_LOCALE_ROUTING_MATRIX.md` |
| `Additional/worldos_p2_evidence/map_creator_inventory.md` | `worldos_p2_evidence/map_creator_inventory.md` |
| `Additional/worldos_p2_evidence/phase2_started_at.txt` | `worldos_p2_evidence/phase2_started_at.txt` |
| `Additional/worldos_p2_evidence/README.md` | `worldos_p2_evidence/README.md` |
| `Additional/worldos_p2_evidence/world_creator_inventory.md` | `worldos_p2_evidence/world_creator_inventory.md` |
| `Additional/worldos_p2_evidence/WorldOS Phase 2 Executive Summary.md` | `worldos_p2_evidence/WORLDOS_PHASE2_EXECUTIVE_SUMMARY.md` |
| `Additional/worldos_p2_evidence/WORLDOS_PHASE2_EXECUTIVE_SUMMARY.md` | `worldos_p2_evidence/WORLDOS_PHASE2_EXECUTIVE_SUMMARY.md` |
| `Additional/worldos_p2_evidence/assets/MANUS-P2-upload-test.png` | `worldos_p2_evidence/assets/MANUS-P2-upload-test.png` |
| `Additional/worldos_p2_evidence/assets/MANUS-P2-upload-test.svg` | `worldos_p2_evidence/assets/MANUS-P2-upload-test.svg` |
| `Additional/worldos_p2_evidence/assets/MANUS-P2-upload-test.txt` | `worldos_p2_evidence/assets/MANUS-P2-upload-test.txt` |

## Boundary

This deduplication does not change evidence status. Phase 1/2 claims that cite screenshots or browser HTML not present in the archive remain `EXTERNAL_REPORT_ONLY` until those raw artifacts are supplied.

## Archive-wide exact duplicate aliases also removed

After the Additional cleanup, the whole `docs/research/external/manus` tree was scanned again by SHA-256. The following remaining renamed aliases were byte-identical and had no live references; the canonical copies shown here were retained:

| Removed alias | Retained canonical copy |
|---|---|
| `Manus Phase 1–2 Evidence Quality Audit.md` | `MANUS_EVIDENCE_QUALITY_AUDIT.md` |
| `MANUS Archive README — WorldOS Phase 1 + Phase 2.md` | `MANUS_ARCHIVE_README.md` |
| `MANUS Evidence Index — Phase 1 + Phase 2.md` | `MANUS_EVIDENCE_INDEX.md` |
| `Manus Future QA Test Cases — Derived from Phase 1–2 Evidence.md` | `MANUS_FUTURE_QA_TEST_CASES.md` |
| `Manus Unified Asset & Cleanup Manifest — Phase 1 + Phase 2.md` | `MANUS_UNIFIED_ASSET_CLEANUP_MANIFEST.md` |
| `p3/MANUS P3 — Evidence Index.md` | `p3/worldos_p3_evidence/MANUS_P3_EVIDENCE_INDEX.md` |
| `p3/MANUS P3 — Executive Summary.md` | `p3/worldos_p3_evidence/MANUS_P3_EXECUTIVE_SUMMARY.md` |
| `p3/MANUS P3 — Asset & Cleanup Manifest.md` | `p3/worldos_p3_evidence/MANUS_P3_CLEANUP_MANIFEST.md` |
| `p3/MANUS P3 — Maps Catalog Set Difference.md` | `p3/worldos_p3_evidence/MANUS_P3_MAP_CATALOG_DIFF.md` |
| `p3/WORLDOS_PHASE2_EXECUTIVE_SUMMARY.md` | `worldos_p2_evidence/WORLDOS_PHASE2_EXECUTIVE_SUMMARY.md` |
| `p3/WORLDOS_EXTERNAL_VALIDATION_REPORT.md` | `WORLDOS_EXTERNAL_VALIDATION_REPORT.md` |
