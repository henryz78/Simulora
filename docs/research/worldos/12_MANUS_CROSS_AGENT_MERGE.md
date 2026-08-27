# Manus Cross-Agent Evidence Merge / Conflict Check

Status: `COMPLETE — SOURCE AUDIT + CONFLICT CHECK + MAIN-DOC MERGE + FINAL GAP DECISION`  
Audit date: 2026-08-25 (Asia/Shanghai)

## 1. Purpose and provenance

This document audits the externally executed Manus Phase 1/2/3 package before any result is promoted into the main WorldOS research corpus. The package is independent of the primary authenticated account `x161880` and is useful for cross-account reproduction, long mechanical runs and catalogue sampling. It is not treated as automatically authoritative.

Provenance namespaces remain separate:

- `EVD-*`: primary-agent direct observation and controlled experiments.
- `MANUS-P1-*`: Manus Phase 1 external report evidence.
- `MANUS-P2-*`: Manus Phase 2 external report evidence.
- `MANUS-P3-*`: Manus Phase 3 evidence, including locally retained screenshots, rendered HTML, CSVs and raw notes.

The following merge labels are used:

| Label | Meaning |
|---|---|
| `NEW_EXTERNAL` | Adds a useful tested boundary not present in the main corpus. |
| `CORROBORATING` | Independently agrees with an existing main result. |
| `CONTRADICTORY_SNAPSHOT` | Direct observations differ, but the difference may be time/account/session dependent rather than a stable product contradiction. |
| `NOT_COMPARABLE` | Different identity, model, object, prompt, state or tooling prevents a like-for-like conclusion. |
| `REPORT_ONLY` | A written report exists, but the referenced raw artifact is not retained locally or does not match the claim. |
| `TOOLING_BLOCKED` | The prescribed action sequence did not reach its behavioral assertion. |

## 2. Source package and integrity audit

### 2.1 Canonical source locations

- Phase 1: `docs/research/external/manus/*.md`
- Phase 2: `docs/research/external/manus/worldos_p2_evidence/*`
- Phase 3: `docs/research/external/manus/p3/worldos_p3_evidence/*`
- Phase 3 screenshots: `docs/research/external/manus/p3/screenshots/*`
- Phase 3 rendered Maps HTML: `docs/research/external/manus/p3/browser_html/*`
- Earlier unique timeline variants: `docs/archive/manus/additional-timeline-variants/*`

### 2.2 Exact-file deduplication

- Phase 3 originally contained 454 screenshot files. SHA-256 deduplication removed 90 byte-identical aliases and retained 364 unique screenshots, reclaiming approximately 27.61 MiB.
- Similar-looking but byte-different screenshots were not deleted.
- Screenshot references in live Phase 3 Markdown, CSV, text, JSON and helper code resolve to retained files. `raw/p3_inventory_paths.txt` intentionally remains a historical pre-dedup inventory; deleted-name mappings are preserved in `docs/research/external/manus/p3/MANUS_P3_SCREENSHOT_DEDUP_MANIFEST.md`.
- The later `Additional` package contained 27 files. Twenty-five exact duplicate copies were removed; two earlier source variants were retained. Its mapping is in `docs/research/external/manus/ADDITIONAL_DEDUP_MANIFEST.md`.
- Remaining renamed byte-identical Manus document aliases were removed. The full `docs/research/external/manus` tree now has zero SHA-256 duplicate groups.

### 2.3 Phase 1/2 raw-artifact boundary

Phase 1/2 reports cite approximately 148 screenshots plus browser HTML/page-text/console artifacts, but those artifacts are not present in the supplied archive. The `Additional` package contains the same reports, two earlier timeline variants and upload-test fixtures; it does not restore the missing browser evidence.

Consequences:

- Phase 1/2 reports remain useful for workflow discovery, URLs, identity labels, time ordering, test-data names and gap avoidance.
- A Phase 1/2 claim that agrees with a direct main result may be `CORROBORATING`.
- A Manus-only Phase 1/2 claim cannot be promoted to main-agent `VERIFIED`; it remains `EXTERNAL_REPORT_ONLY` until its cited artifact is supplied or the result is independently reproduced.

### 2.4 Tabular-data quality

- `MANUS_P2_CREATOR_FIELD_RESULTS.csv` contains unquoted commas that shift columns in several rows. Markdown reports and raw text lines are the controlling Phase 2 sources; naïve CSV import is unsafe.
- `MANUS_P3_CHARACTER_MEMORY_TURNS.csv` has a 29-field header but only 4 of 18 data rows contain exactly 29 parsed fields. The other 14 rows parse to 27, 28, 30 or 31 fields because prose commas are not consistently quoted. The Markdown long-run report and raw run notes are controlling; the CSV is a human-readable chronology, not a schema-safe dataset.
- Phase 3 Maps CSVs parse consistently and were independently recomputed below.

## 3. Phase 1 / Phase 2 disposition

| Provenance | Observation | Main overlap | Decision |
|---|---|---|---|
| `MANUS-P1-001` | One published App was directly resolvable and visible through observed Market/Search surfaces at different times and identities. | EVD-0179/0190/0218/0238 already prove direct, Market and Unified Search are separate projections for another App. | `CORROBORATING / REPORT_ONLY`; do not infer internal index architecture or a precise SLA. |
| `MANUS-P1-002` | Account B's App gift attempt displayed a 48-hour account-age gate; no balance debit, history row or settlement occurred. | Main agent has successful Profile/World gifts and failed App gifts. | `NEW_EXTERNAL / REPORT_ONLY` for the age gate; not a successful gift and not evidence for 70% settlement. |
| `MANUS-P1-003` | Guest saw Edit/Delete text on an App detail surface but did not trigger the controls. | Guest/permission surfaces were already covered by Marvis and anonymous audits. | `REPORT_ONLY`; presentation-risk evidence only, never unauthorized-write evidence. |
| `MANUS-P1-004` | An Install submit produced no success feedback and usage stayed zero. | Main agent has completed install/runtime/uninstall flows. | `NOT_COMPARABLE`; classify as `INSTALL_NOT_OBSERVED`, not installation failure. |
| `MANUS-P1-005` | Phase 1 test Apps were reported deleted; Phase 1 Worlds were not confirmed cleaned. | Main lifecycle evidence is stronger. | Preserve cleanup status only; unconfirmed is not deleted and not a product defect. |
| `MANUS-P2-001` | World Creator autosave/restoration, cover/name validation and publish-modal field boundaries. | Main World lifecycle and Creator controls are deeper. | `CORROBORATING / REPORT_ONLY`. The whitespace-name test was not isolated from missing-cover validation. |
| `MANUS-P2-002` | Character uses explicit Save and restores its Profile in the observed editor; no canonical detail URL was exposed by that flow. | Main Character library/detail/edit lifecycle is stronger. | `CORROBORATING`; “not exposed” must not become “no URL exists.” |
| `MANUS-P2-003` | Generic `/apps/create` did not restore an unpublished draft; a published slug-specific create route restored configuration. | Main App lifecycle/version behavior is stronger. | `NEW_EXTERNAL / REPORT_ONLY` at the tested route/state only. |
| `MANUS-P2-004` | World and Collection rename retained the original slug route. | Main Collection/World rename and stable URLs agree. | `CORROBORATING`. |
| `MANUS-P2-005` | One World exact-title Search and full-slug Search differed. | Main direct/Market/Unified Search projection splits agree. | `CORROBORATING`; query- and sample-scoped only. |
| `MANUS-P2-006` | `/zh-cn` and `/es` World routes worked; one tested `/en/worlds/{token}` path returned English 404. | Main locale audit has broader routes. | `REPORT_ONLY`; one path cannot define all English routing. |
| `MANUS-P2-007` | No top-level Map Creator entry was exposed in the ordinary free-account UI. | Main evidence shows Maps are World-backed and Map editing lives inside World Creator. | `CORROBORATING`; correct label is `CREATOR_ENTRY_NOT_EXPOSED_IN_FREE_UI`, not membership wall or absence of Map creation. |
| `MANUS-P2-008` | Responsive verification was limited by Manus viewport tooling. | Main agent already completed real 390px/mobile flows. | `TOOLING_BLOCKED / REDUNDANT`; no WorldOS pass/fail conclusion. |
| `MANUS-P2-009` | Collection/App cleanup was blocked or unconfirmed. | Main lifecycle samples are stronger. | Preserve `CLEANUP_BLOCKED`; never rewrite as `CLEANED`, deletion failure or platform bug. |

Phase 1/2 therefore reduce repeat work and add a few report-only edges, but they do not supersede the primary evidence corpus.

## 4. Character Memory cross-agent comparison

### 4.1 Sample identity matrix

| Field | Main `EVD-0213/0232/0233` | Manus Sample A | Manus Sample B |
|---|---|---|---|
| Account | `x161880` | `idakellams159` | `idakellams159` |
| Character | `TEST Character Remix 003 Save Audit` | Paul Banks / visible source `NYC` | Mingyu (SEVENTEEN) / visible source `偶像团体` |
| Simulation | `/zh-cn/sim/909c07cf-58bb-43d6-9211-aaf423c99a34` | `/sim/fa53cd75-4e45-4812-993f-d83c08423626` | `/sim/6062b6fa-f28c-4406-ac79-3092e05f8f29` |
| Model/cost | Deepseek, 4/Turn | Cost sequence reported as 8/Turn; exact selected-model screenshot not isolated in retained report | `Civilization 1` visibly selected, 8/Turn |
| Initial visible Memory | Empty | Empty | Empty |
| First visible summary | Empty at T21; one summary by T25 | Empty through reported T20; later run blocked | Empty at T15; one summary by T20 |
| Manual edit | `橙铜-8842` appended to summary | Not reached | Replaced `folded train ticket` with `MANUAL_CONFLICT_B` |
| Reload persistence | Verified | Not reached | Reported and surface screenshot retained |
| Later visible persistence | One card unchanged through T31 / five later Turns | Not reached | One card reported through T35 / fifteen later Turns |
| AI recall after edit | T26 and T31 returned `橙铜-8842` | Not reached | Report says T29 returned original folded-ticket fact, not manual token |
| Checkpoint/branch | T20 branch remains Memory-empty after source summary/edit; branch recall isolated | T20 checkpoint row/URL created only; Memory semantics not tested | No pre-Memory checkpoint |

The three runs are not matched experiments. They differ by account, Character, Simulation, model/cost and transcript/prompt. Manus cannot overwrite the main Memory result merely because Sample B ran to a larger Turn number.

### 4.2 Accepted additions

| Provenance | Finding | Decision |
|---|---|---|
| `MANUS-P3-MEM-001` | Two additional Character samples did not share one fixed visible-summary checkpoint: A remained empty at reported T20, while B was empty at T15 and had one card by T20. | `NEW_EXTERNAL`, with chronology primarily supported by report/raw notes. Strengthens the conclusion that visible summary timing is not a global fixed Turn. |
| `MANUS-P3-MEM-002` | B's manual edit remained visible after one reload and was reported as the only visible card through T35. | `NEW_EXTERNAL / CORROBORATING`; extends the visible persistence lower bound beyond main T31, but later Turn-to-image linkage depends on Manus chronology because several Memory screenshots are byte-identical. |
| `MANUS-P3-MEM-003` | A T20 checkpoint branch and stable URL were created. | `CORROBORATING` for checkpoint creation only; no branch Memory isolation or recall semantics were tested. Main EVD-0213/0232 remains controlling for branch behavior. |

### 4.3 Evidence defects and non-conflicts

- Sample A's T0/T5/T10/T15/T20 Memory screenshots were byte-identical. They prove the empty Memory surface but do not independently prove five distinct Turn checkpoints. The interval chronology is `REPORT_ONLY_WITH_SINGLE_SURFACE_IMAGE`.
- Multiple Sample B post-edit checkpoint screenshots were also byte-identical. They support the visible card content, while T23/T25/T28/T35 association relies on the structured chronology rather than distinguishable image state.
- The screenshot cited for the T29 recall result, `worldos_cc_2026-08-25_09-56-35_5200.webp`, does not show the T29 query or answer. It shows an earlier transcript segment around the folded ticket. Nearby retained screenshots also do not expose the claimed recall exchange. Therefore `MANUS-P3-MEM-004` is downgraded to `REPORT_ONLY / SCREENSHOT_MISMATCH`.
- The reported B reply favoring the original folded-ticket fact does not directly contradict main EVD-0232/0233. It is one different Character/model/transcript/prompt. The correct product conclusion is that a visible manual Memory edit is not proven to dominate every Character/model response; no hidden retrieval mechanism is inferred.
- Main EVD-0213/0232/0233 remains stronger for exact Turn/energy accounting, transcript-hidden recall, tail lag, next-Turn manual-memory injection and checkpoint isolation.

### 4.4 Memory merge decision

Do not repeat an undirected Character Memory run merely to reach T35. Manus already adds cross-sample timing variability and a longer visible-persistence report. Remaining high-value experiments must be controlled and non-duplicate:

1. A matched cross-model experiment using the same Character, transcript, Memory edit and recall prompt.
2. The first true second-summary/merge event after a manual edit, if it occurs beyond current lower bounds.
3. Multiple Memory cards, maximum length and explicit deletion/empty-save behavior.

These remain `UNKNOWN`; Manus does not close them.

## 5. App merge edge matrix disposition

Manus created and published a v1 seed App, but World creation was blocked at cover-file upload. It did not install the App, enter a Simulation, publish v2–v5 or observe runtime state migration. The App was later deleted and direct 404 was verified.

| Provenance | Claimed area | Decision |
|---|---|---|
| `MANUS-P3-APP-001` | Planned no-ID arrays, duplicate IDs, type conflicts and delete/tombstone cases | `TOOLING_BLOCKED`; plans and expected paths are not product evidence. |
| `MANUS-P3-APP-002` | v1 App seed/inspector publication | `CORROBORATING` for Creator surface only. |
| `MANUS-P3-APP-003` | Final App delete → direct 404 | `CORROBORATING` for that disposable asset. |

Main EVD-0149/0235 remains controlling for deep three-way merge, path dirtiness, stable-ID array union, null precedence, omission preservation and literal fresh-save seeds. Manus adds no runtime migration result and should not cause those flows to be rerun.

## 6. Maps catalogue structured-evidence audit

### 6.1 Independent recomputation

The retained terminal HTML files and Maps CSVs are internally consistent:

| Scope | Saved HTML | Extracted rows | Unique canonical World hrefs | Repeated href rows |
|---|---|---:|---:|---:|
| `有底图` | `worldos_cc_maps_1787653433922.html` | 1,085 | 1,085 | 0 |
| `全部` | `worldos_cc_maps_1787653893171.html` | 1,181 | 1,181 | 0 |

Independent checks against the saved HTML found 1,085 and 1,181 matching card containers and exactly two World href anchors per card. Recomputing the CSV href sets produced:

- intersection: 1,085
- `全部` only: 96
- `有底图` only: 0
- same-title/different-href groups: 91 in Base and 103 in All
- deterministic all-only sample: 10 rows, 10 unique hrefs, all members of the 96-row difference

The four genre snapshot pairs are also internally consistent:

| Genre | Base | All | All − Base |
|---|---:|---:|---:|
| DnD | 0 | 0 | 0 |
| 动漫 | 272 | 334 | 62 |
| 科幻 | 54 | 57 | 3 |
| 恋爱 | 92 | 140 | 48 |

This is `MANUS-P3-MAP-001 / NEW_EXTERNAL`: a strong, structured, time-stamped external catalogue snapshot showing that `全部` was a strict superset of `有底图` in that session. It supports rendered catalogue membership only, not hidden Map IDs, backend completeness, eligibility cause or ranking architecture.

### 6.2 Main-count discrepancy

Main EVD-0244 recorded 1,083 terminal Base cards for account `x161880` at a 671×722 viewport. Manus recorded 1,085 for account `idakellams159` at an approximately 1,100px-high viewport later in an independent session, with a stricter three-consecutive-no-growth terminal procedure and saved HTML.

Classification: `CONTRADICTORY_SNAPSHOT`, not a stable-rule contradiction.

Possible black-box explanations include catalogue mutation between observations, identity-dependent membership, session/cache state or the main run stopping before a late partial append. None is proven. The exact terminal count must be documented as a snapshot, not a product invariant. The architectural conclusion is stable: silent 16-card appends terminate without end copy, and current Base/All catalogue membership can diverge.

### 6.3 Interaction sample

Ten fixed-seed All-only cards were reported through preview open/close, World-detail trigger and first-layer `用此地图` open/cancel without write. This is `MANUS-P3-MAP-002 / CORROBORATING`; it broadens repetition across cards but adds no new Map write or runtime semantics beyond EVD-0244 and the main Map lifecycle experiments.

## 7. Page-control ledger disposition

Manus did not receive the main `PAGE_CONTROL_AUDIT.md` and therefore could not compute a true delta. Its ledger records 18 visible surfaces but mostly `DISCOVERED_ONLY`; only the Character modal open/close and its own App Edit route were materially triggered.

Decision: `MANUS-P3-CONTROL-001 / NOT_COMPARABLE / REDUNDANT`. Retain it as an external spot-check, but do not replace the 30-surface main page-control inventory and do not rerun the main control audit because of this ledger.

## 8. Cleanup disposition

| Asset | Manus state | Merge rule |
|---|---|---|
| Phase 3 seed App | Deleted; direct 404 observed | `CORROBORATING`; cleanup complete for that asset. |
| Sample A checkpoint branch | Cleanup blocked | Keep as `CLEANUP_BLOCKED`; do not call deleted or infer a product defect. |
| Character chat samples | Retained for evidence | Intentional retained test data. |
| Phase 1 test Apps | Reported deleted | `REPORT_ONLY` cleanup. |
| Phase 1 test Worlds | Unconfirmed | `UNKNOWN`, not cleaned. |
| Phase 2 Collection/App assets | Blocked/unconfirmed | Preserve exact manifest state. |

## 9. Accepted changes to the Source of Truth

The following can be merged into the main research corpus without repeating Manus work:

1. Character visible-summary timing varies across independent samples; Manus B appeared after T15 and by T20 while main appeared after T21 and by T25.
2. A manual Character Memory edit may remain visibly present for at least fifteen later reported Turns in another Character/model sample, but image chronology is weaker than main evidence.
3. The reported one-off failure to use that edit in recall is not visually evidenced and remains report-only; it narrows generalization rather than contradicting main controlled recall.
4. The Maps `全部` catalogue was a strict 96-World-href superset of `有底图` in the retained Manus snapshot, with reproducible CSV/HTML evidence.
5. Exact Maps terminal counts are dynamic snapshots, not parity invariants.
6. Manus App merge and responsive/control tasks do not close any main runtime or mobile gaps because their decisive steps were blocked or not comparable.
7. Phase 1/2 results remain useful corroboration/report evidence, but missing raw artifacts prevent promotion to direct `VERIFIED`.

## 10. Non-duplicate next-work boundary

Do not repeat:

- full Guest/non-owner permission audits already covered by Marvis/anonymous work;
- generic Character Memory progression merely to reach T35;
- P3 Maps full-catalogue scrolling and fixed-seed preview repetition;
- P3 planned App migration matrix, because no runtime result exists and the main agent already completed a stronger merge matrix;
- Phase 2 Creator/mobile baselines already covered by stronger main evidence.

Post-merge work has now been selected against the updated Open Questions and Final Completeness Audit. Important Facts empty-save semantics were subsequently completed as EVD-0251. Controlled second-summary/multi-card Memory and no-ID/duplicate-ID/type-change App merge cases remain optional architecture edges; entitled private/only-me enforcement stays unavailable, and Map catalogue/runtime work is not repeated. No broad crawl is warranted.

## 11. Current merge status

`COMPLETE — SOURCE AUDIT + CONFLICT CHECK + MAIN-DOC MERGE + FINAL GAP DECISION`.

All Manus materials supplied by the user have been read and classified. Exact duplicate files have been removed with manifests; live Phase 3 screenshot references resolve. Accepted external evidence and its limitations have been merged into the Memory and Map specifications, Evidence/Coverage/Open-Question records, Feature Inventory, Parity Matrix/Test Suite, Page Control Audit, Cross-System Audit and Final Completeness Audit. The post-merge gap selection and the narrowly chosen Important Facts clear/save probe are complete; all other residuals are explicitly accepted, blocked or deferred edge tests rather than reasons to repeat Manus/main lifecycles.
