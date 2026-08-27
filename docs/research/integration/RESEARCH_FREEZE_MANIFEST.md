# Research Freeze Manifest

Status: `INTEGRATED RESEARCH V1 — FROZEN`

Freeze date: `2026-08-26` (`Asia/Shanghai`)

This manifest freezes the integration layer. It does not replace or rewrite any source package, and it does not approve Product Requirements, architecture, UI, prototype, implementation, technology, brand or launch scope.

## 1. Frozen corpus

| Package | Frozen disposition | Permitted future use | Prohibited automatic continuation |
|---|---|---|---|
| WorldOS primary + external merges (`EPKG-001–003`) | `RESEARCH V1: FROZEN`; main agent remains retired | Evidence, comparison, mechanism/defect reference, and approved-decision-specific OQ lookup | Broad black-box investigation, parity-as-backlog, UI/layout/copy/brand replication |
| AI World User Research (`EPKG-004`) | Baseline of 52 Needs / 53 Sources / E01–E79 frozen | Problem framing, audience hypotheses, trade-off evidence and later decision-specific validation | Another broad public-source survey, “UNKNOWN = 0,” unsupported market sizing or universal preference claims |
| World / Character Final Package (`EPKG-005`) | `TEXT: FROZEN`; `VISUAL: COMPLETE`; `FINAL: READY` | Original scenario/reference/test corpus; candidate visuals after human review | Expanding worlds/characters/visual queue; converting third-party IP into product expression |
| Visual Asset Pool (`EPKG-006`) | 314-record catalogue baseline frozen | Later selection from approved needs; current per-item rights recheck at adoption | Expanding the pool, using availability to define features/brand, treating preview/contact sheets as licence proof |
| Immersion Asset Library (`EPKG-007`) | Research/reference library frozen | Later design options and selected-technology engineering validation | Expanding the library; treating React/Vite/webapp/reference code as Simulora product implementation |
| Creator Starter Template Library (`EPKG-008`) | T01–T37 and v0.2 pattern set frozen | Mechanism reference, scenario tests and creator-language input | Expanding templates; adopting its JSON/object model as approved schema or requirements |
| Brand / Naming Exploration (`EPKG-009`) | `BRAND EXPLORATION: FROZEN / REFERENCE ONLY` | Later capability-backed shortlist discussion | Declaring any candidate final; formal checks before a shortlist; propagating exploration copy as product truth |

## 2. Original archive integrity

All six input archives are preserved under `docs/archive/source-packages/` with their original filenames. No file inside them was overwritten, renamed or deleted. Their extracted copies under `docs/research/external/` are the daily readable corpus; the ZIPs are frozen provenance/recovery snapshots.

| Original archive | Bytes | Entries | SHA-256 |
|---|---:|---:|---|
| [AI_World_User_Research_Handoff.zip](../../archive/source-packages/AI_World_User_Research_Handoff.zip) | 5,928,650 | 91 | `504F9E0CC706CE6AA489954BBADB9961719BA19BFFB04685D6CCA63398171AEA` |
| [AI_World_Visual_Asset_Pool_Consolidated_Handoff.zip](../../archive/source-packages/AI_World_Visual_Asset_Pool_Consolidated_Handoff.zip) | 372,132,016 | 582 | `1F51F7F15A680B7C5445C6C817EC31190B9D97A7F93BA6A0BDA94B2A12A777EF` |
| [brand_naming_handoff.zip](../../archive/source-packages/brand_naming_handoff.zip) | 693,261 | 27 | `BBCE01A0FCD33E142C756D48D197BF2B9C29F4AB69CEC8C778DB02CE101DC155` |
| [creator_starter_template_library_handoff.zip](../../archive/source-packages/creator_starter_template_library_handoff.zip) | 44,117 | 7 | `CDCFB458E1AB55CF88B98BB2DD606547ACADF309BE5ED72304F60D5B07E2E54D` |
| [Immersion-Asset-Library-Handoff.zip](../../archive/source-packages/Immersion-Asset-Library-Handoff.zip) | 41,389,732 | 201 | `58468D95F316741C585021BABB017712515B84C07134D3AC1B5D251FD4D41DB0` |
| [world-character-final-package.zip](../../archive/source-packages/world-character-final-package.zip) | 276,785,493 | 107 | `DA2EE787A5B3418FB104E95C04667DBDB379C4F5E54C1BEAC3038F48C4AB70B7` |

Hashes identify the archives integrated in this freeze. A later file with the same name but a different hash is a new package revision and must receive a new intake decision; it must not silently replace this baseline.

Normalization verification: all 929 ZIP file entries were matched to the extracted corpus by relative path, byte length and SHA-256; all six packages passed. The packaging-only top-level wrapper was removed, while every nested current/final/data/source/evidence/asset/archive/manifest/tooling path was retained.

## 3. Integrated Research v1 invariants

The following rules are frozen with this integration:

1. User evidence explains why a problem matters; competitor observation cannot substitute for it.
2. WorldOS 70/70 parity is not, and cannot be converted into, a product development list.
3. WorldOS and third-party products are evidence/comparison/mechanism references only; their identifiable expression is excluded.
4. Templates, worlds, characters, assets, immersion references and brand directions do not establish requirements merely by existing.
5. `UNKNOWN`, `BLOCKED`, `NOT_DISCOVERABLE_IN_NORMAL_UI`, `REPORT_ONLY` and conflicting snapshots retain their original scope.
6. Real user conflicts remain explicit trade-offs; this integration does not manufacture a universal user.
7. Research tooling, viewers and reference implementations are not product code.
8. Original content and AI-generated visuals still require release-specific editorial, similarity, brand and rights review.
9. Formal trademark/domain/store/social clearance occurs only after a later approved shortlist.
10. `PRODUCT IMPLEMENTATION: NOT STARTED` remains true at this freeze.

## 4. Clean-room boundary

Future product work must be able to answer:

> Is this decision supported by our users and original product intent, or is it present only because WorldOS or another reference contains it?

If the only support is the reference product, the decision must not enter the product specification. Future work must not copy WorldOS UI, information architecture, page/control arrangement, onboarding, copy, naming, brand, icons, assets, visual language, code or full feature combination. Third-party IP references may inform abstract mechanism, pacing or relationship analysis only.

## 5. Reopen policy

- **Permanently closed to broad research:** WorldOS parity/site crawl, generic Memory progression, catalogue counting, broad public user-source collection, content/template/asset/immersion expansion and brand-candidate proliferation.
- **Allowed only through targeted reopen:** a specific approved product decision is blocked by a precise fact and passes the five-part gate in the [Gap Audit](PRODUCT_RELEVANT_GAP_AUDIT.md).
- **Not a research reopen:** checking the current licence of a selected asset, benchmarking a selected effect, performing legal/safety review, or clearing a final naming shortlist. Those are later adoption, engineering or governance due diligence.

## 6. Freeze acceptance

- Package intake: all six supplied packages catalogued with Source of Truth, provenance, scope and repeat boundary.
- Evidence merge: material support, complement, conflict, conditional and unknown relations recorded.
- Conflict check: all 12 required conflict classes recorded without premature resolution.
- Gap audit: P0/P1/P2/IGNORE complete; `P0 = 0`.
- Integration navigation and next-stage handoff: complete.

Any future modification to this integration layer must append a dated change record and preserve the original archives and their provenance.
