# Manus Phase 1–2 Evidence Quality Audit

**审计范围。** 本文件只审阅 Manus 自己生成的 Phase 1 / Phase 2 本地 Markdown、CSV、截图路径、页面文本与控制台记录；未读取、引用、修改或合并 Main Agent、Marvis、Anonymous 的材料。审计不重新访问 WorldOS，不补测任何 `UNKNOWN`。

> **总原则：** 单次 UI 可见性支持“在该身份、该 URL、该时点的观察”，不能外推为后端机制、长期 SLA、跨身份权限、服务器数据丢失或普遍产品行为。证据路径缺失或时区标签矛盾时，应降低结论粒度，而非补造确定性。

## 质量结论概览

| Area | Quality assessment | Main risk | Required archival treatment |
|---|---|---|---|
| Phase 1 account baseline | Strong | No durable credential-independent identity marker beyond rendered username/email/visible balance. | Keep as high-confidence login/UI-baseline observation only. |
| Phase 1 App discovery | Strong for observed surfaces and query forms; moderate for timing synthesis. | Raw timeline has incompatible time-zone labels and obsolete long-window plan text. | Use relative ordering; do not quote an exact indexing SLA or current monitoring status. |
| Phase 1 Gift | Strong for the single observed 48-hour gate; intentionally blocked for transaction economics. | “70%” is visible UI disclosure, not verified settlement. | Keep `BLOCKED — account gating`; no economic assertion. |
| Phase 2 Creator | Strong for World direct-reopen, Character in-app reopen, and published App slug-editor reopen. | Generic App Creator non-restore does not prove permanent data loss; certain button-state fields include automation binding limitations. | Preserve canonical-route and automation caveats in every derived QA case. |
| Phase 2 discovery | Strong for named Owner samples; incomplete for all required identities/entrypoints and Delete lifecycle. | Some `IMMEDIATE` labels use only Owner, one query or a partial matrix; time origin labels are not uniformly trustworthy. | Phrase as “immediate in the recorded Owner observation / exact query,” not global convergence. |
| Phase 2 responsive | Strong environmental limitation record; not a product responsive verdict. | Required 4-viewport grid was not technically verified. | Retain `VIEWPORT_SIMULATION_NOT_VERIFIED` / `DEVICE_BOUND_UNKNOWN`; no responsive PASS/FAIL. |
| Phase 2 locale | Strong for three direct-link samples and one query/hash sample; incomplete against requested grid. | `/en` failure sampled one World token only; History/new-tab unavailable. | State route-specific divergence, not language-wide outage. |
| Cleanup | Strongly documented UI attempts; no confirmed deletion for remaining objects. | `CLEANUP_BLOCKED` is not equivalent to removed, nor proof of platform deletion defect. | Keep explicit blocked status with last-visible route and reason. |

## Findings and wording corrections

| ID | Source(s) | Issue | Why evidence is insufficient or conflicting | Corrected wording for archive / future merge |
|---|---|---|---|---|
| QA-01 | `EXT_APP_INDEX_TIMELINE.md` line 8 | Status remains `进行中` although the Phase 1 main report is final and records asset deletion. | Internal document-state contradiction. | Change to **`ARCHIVED — sampling ended; see final report for scope and cleanup`**. |
| QA-02 | `EXT_APP_INDEX_TIMELINE.md` lines 41, 101–122 | Original plan says T+15/30/60/120 and later rows label `UTC` inconsistently with numeric values and initial `GMT+8`. | The user later cancelled long windows; absolute timestamps cannot safely be merged as a single timezone series. | Treat post-T+0 ordering and recorded relative labels as evidence; label absolute zone as `TIME_LABEL_INCONSISTENT`. Do not infer a fixed duration more precise than the adjacent recorded observations. |
| QA-03 | `WORLDOS_EXTERNAL_VALIDATION_REPORT.md` lines 13, 61, 132 | Discovery findings are correctly cautious but could be over-read as universal index architecture. | Only one dedicated App, specified title/slug exact queries, and three sessions were sampled. | Use **“the observed UI surfaces were not synchronized for this asset and query form”**, not “WorldOS indexes in separate systems.” |
| QA-04 | `EXT_GIFT_TRANSACTION_LOG.md` lines 37, 50–57 | UI disclosure says 70% goes to creators. | No successful Gift occurred, so settlement and ledger allocation were not measured. | Retain as **“UI-disclosed percentage”** and maintain `BLOCKED — account gating` for all actual accounting claims. |
| QA-05 | `WORLDOS_EXTERNAL_VALIDATION_REPORT.md` lines 74–78 | Guest saw Edit/Delete text. | No click/write attempt was made, so there is no authorization outcome. | Keep **“UI permission-presentation risk / potential experience defect”**; never call it a vulnerability or unauthorized-write proof. |
| QA-06 | `MANUS_P2_CREATOR_FIELD_RESULTS.csv`, World rows | Whitespace Name test also lacked a cover. | Disabled Create button does not isolate Name as the only mandatory factor. | Maintain **“whitespace did not yield a valid name; primary button remained disabled with cover also absent.”** |
| QA-07 | `MANUS_P2_CREATOR_FIELD_RESULTS.csv`, App draft rows | Generic `/apps/create` reopened blank after Draft saved. | There was no discovered canonical draft route or server-side retrieval. | Maintain **“generic create route did not restore the observed current draft”**; do not claim draft deletion/data loss. |
| QA-08 | `MANUS_P2_NONAPP_INDEX_TIMELINE.md` lines 16–33, 50–63 | “IMMEDIATE” can be misconstrued as complete public convergence. | Primarily Owner samples; directory placement, Guest and Account B were incomplete for several World states. | Qualify every result with **identity + entrypoint + exact query**. “IMMEDIATE” means first recorded success after visible state transition only. |
| QA-09 | `MANUS_P2_NONAPP_INDEX_TIMELINE.md` lines 60–63 | Screenshot names show `06:xx` while rows use `14:xx+08:00`; correction says an eight-hour difference. | Artifact naming and environment time bases are not independently reconciled. | Preserve original evidence locator and use **relative sequence only** in synthesis; mark precise absolute timezone `UNKNOWN` unless the source document independently verifies it. |
| QA-10 | `MANUS_P2_LOCALE_ROUTING_MATRIX.md` and summary | `/en` World detail gave 404 while `/zh-cn` and `/es` worked. | One World path was sampled; root/non-prefixed English behavior differs. | State **“this tested `/en/worlds/{token}` path returned English 404”**; do not generalize to all English routes or all assets. |
| QA-11 | `MANUS_P2_RESPONSIVE_MATRIX.md` | Viewport requirement was not met. | `resizeTo` changed outer dimensions but CSS `innerHeight` stayed 1100; no 360/768/844 dimensions were verified. | Do not report responsive product pass/fail or defects. All unverified cells remain `VIEWPORT_SIMULATION_NOT_VERIFIED`; mobile-specific outcomes are `DEVICE_BOUND_UNKNOWN`. |
| QA-12 | `MANUS_P2_CLEANUP_MANIFEST.md` | Some assets are `CLEANUP_BLOCKED` after uncompleted or no-delete-path observation. | A blocked UI action does not establish the resource is still present/absent beyond the rechecked route, nor a platform deletion bug. | Use `CLEANUP_BLOCKED` with last known visibility and exact reason; do not say “not cleaned” as an observed server fact where no later recheck exists. |
| QA-13 | P2 Creator/Timeline documents | Character lacks a canonical direct detail URL in observed normal flow. | Absence was based on observed UI, not full route enumeration. | Say **“no canonical direct detail URL was exposed in the observed normal UI”**, not “Character has no direct URL.” |
| QA-14 | P2 Map inventory / summary | No Map Creator appeared. | No paywall was observed and no hidden route search was permitted. | Use **`CREATOR_ENTRY_NOT_EXPOSED_IN_FREE_UI`**; do not relabel as `MEMBERSHIP_BLOCKED` or “Map creation unavailable.” |

## Documentation changes performed

The archive will retain raw evidence unchanged except where its **document state** or **interpretive label** would conflict with the final archived record. The following non-observation changes are warranted:

1. `EXT_APP_INDEX_TIMELINE.md` receives an archived-status banner and an explicit notice that its long-window sampling plan is historical/superseded.
2. `MANUS_P2_NONAPP_INDEX_TIMELINE.md` receives a synthesis caution that mixed time artifacts must not be turned into precise UTC/SLA statements.
3. No screenshot, CSV, raw timeline row, page text, cleanup outcome, or external report is rewritten to manufacture a missing observation.

## Priority issues for a future main-agent merge

The most important boundary flags are `QA-02`, `QA-04`, `QA-05`, `QA-07`, `QA-08`, `QA-10`, `QA-11`, and `QA-12`. A future merge should preserve their qualifiers rather than flatten them into an unconditional PASS/FAIL narrative.
