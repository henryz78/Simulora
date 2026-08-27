# External Research Corpus

Status: `DAILY READABLE SOURCE OF TRUTH / INTEGRATED RESEARCH V1 FROZEN`

This directory contains the extracted research corpus used for routine reading. Each package directory preserves every file beneath the original ZIP's packaging-only wrapper. Package-local README and FINAL_HANDOFF files remain unchanged evidence artifacts; this repository-level map controls how they may be interpreted in the current project phase.

Original ZIPs are immutable provenance/recovery snapshots in [docs/archive/source-packages](../../archive/source-packages/README.md). Do not open them for routine research navigation.

## Package map

| Domain | Role and frozen boundary | Start here | Canonical / structured data | Raw evidence / assets / archive |
|---|---|---|---|---|
| [user-research](user-research/README.md) | `USER EVIDENCE / FROZEN`; future Product Definition priority. Qualitative evidence, not market sizing or a requirements decision. | [FINAL_HANDOFF](user-research/FINAL_HANDOFF.md) | [Needs](user-research/01_CURRENT_DATA/needs_database.csv), [Sources](user-research/01_CURRENT_DATA/source_index.csv), [Research log](user-research/01_CURRENT_DATA/research_log.md), [reports](user-research/00_FINAL_REPORTS/) | [`archive/`](user-research/archive/), including raw page texts/screenshots; reproducibility scripts remain research tooling |
| [creator-templates](creator-templates/README.md) | `CREATOR PATTERN / MECHANISM REFERENCE / FROZEN`; not a requirement list, approved schema or architecture. | [FINAL_HANDOFF](creator-templates/FINAL_HANDOFF.md) | [T01–T37 current library](creator-templates/current/creator_starter_template_library.md) | [`archive/`](creator-templates/archive/) |
| [visual-assets](visual-assets/README.md) | `ASSET / PRODUCTION RESOURCE / FROZEN`; asset availability cannot create product requirements or brand direction. | [FINAL_HANDOFF](visual-assets/FINAL_HANDOFF.md) | [Active assets](visual-assets/01_START_HERE/ACTIVE_PRODUCTION_ASSETS_03.csv), [manifest](visual-assets/01_START_HERE/asset_manifest.csv), [review queue](visual-assets/01_START_HERE/MANIFEST_REVIEW_QUEUE_03.csv), [hygiene report](visual-assets/02_FINAL_REPORTS_AND_INDEXES/EXPANSION_03_生产型资产池与Hygiene报告.md) | Contact sheets, reference assets, logs, sources, scripts and [`archive/`](visual-assets/archive/) remain under the package branch |
| [immersion](immersion/README.md) | `RESEARCH TOOLING / LIBRARY VIEWER / REFERENCE IMPLEMENTATION / FROZEN`; React/Vite/webapp material is not product code. `PRODUCT IMPLEMENTATION: NOT STARTED`. | [FINAL_HANDOFF](immersion/FINAL_HANDOFF.md) | [Current report](immersion/current/reports/Immersion-Asset-Library-Rare-Scenarios.md), [current asset library](immersion/current/research/asset-library-current.md), [notes](immersion/current/research/research-notes-current.md) | [`evidence/`](immersion/evidence/), [`assets/`](immersion/assets/), [`webapp/`](immersion/webapp/) and [`archive/`](immersion/archive/) |
| [brand](brand/README.md) | `BRAND EXPLORATION: FROZEN / REFERENCE ONLY`; `Simulora` is a working title at most. `FINAL BRAND: NOT DECIDED`. | [FINAL_HANDOFF](brand/FINAL_HANDOFF.md) | [Final exploration board](brand/final/brand_naming_exploration_board.md) | [`raw_sources/`](brand/raw_sources/), [`assets/`](brand/assets/), [`logs/`](brand/logs/) and [`archive/`](brand/archive/) |
| [world-character](world-character/README.md) | `ORIGINAL CONTENT / SCENARIO / CHARACTER / VISUAL REFERENCE LIBRARY`; 48 Worlds, 193 Characters, 48 `ORIG-AI-VIS`; `TEXT: FROZEN`; `VISUAL: COMPLETE`; third-party IP is `REF-ONLY`. | [FINAL_HANDOFF](world-character/FINAL_HANDOFF.md) | [XLSX](world-character/final/current/World_Character_素材库_v0.5.1_视觉更新.xlsx), [JSON](world-character/data/current/world_character_library_data_v0.5.1_visual_update.json), [visual manifest](world-character/handoff/VISUAL_QUEUE_MANIFEST.md), [status](world-character/handoff/VISUAL_QUEUE_STATUS.csv) | [`assets/`](world-character/assets/), [`docs/`](world-character/docs/), historical data and [`archive/`](world-character/archive/) |

Existing WorldOS-related external evidence remains independently preserved under [marvis](marvis/), [anonymous](anonymous/) and [manus](manus/). It is not merged into any of the six package directories.

## Reading rule

Use this order: repository-level boundary → package README/FINAL_HANDOFF → current/canonical files → structured index/data → raw evidence or branch-local archive only when required. Do not modify frozen package files to make them easier to implement. Do not infer product requirements from competitor behavior, templates, content, assets, reference code or naming exploration.

