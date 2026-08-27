# App Creator System

Status: `TESTED / PARTIAL`

Studio supports WorldOS AI generation, external-model prompt copy and direct HTML. It provides interactive iframe preview, test-world action box, slug/name/icon/color/description/tags, Market detail, update note, AI instructions, initial JSON, refresh controls and Event templates. Published detail has versions, rating/comments/install and online preview. `存草稿` on an existing published App was verified repeatedly through v8 to create/advance the public version and hot-update an already-running Simulation without a World version. Clicking explicit `发布` after the v8 save returned to public detail without producing v9.

New App validation: entering invalid JSON in `初始数据` did not block `存草稿`; save completed, and reload normalized the field back to `{}` while retaining HTML/name/description/detail metadata. A controlled disposable sample also proved valid top-level array JSON `[1,2]` is accepted and persists as pretty-printed JSON, so the Creator does not require an object at its editor boundary. Required validation only appeared when HTML was absent: `保存前需要先有名称和可用的 HTML。` Malformed input therefore follows silent normalization/discard behavior, not an explicit JSON validation error. Evidence: EVD-0050, EVD-0196.

Runtime Preview errors are likewise permissive: an inline script throwing `TEST_RUNTIME_ERROR_001` rendered surrounding HTML and produced only an iframe console error. Save/reload preserved the broken Preview with no user-facing warning; replacing the HTML and saving restored the same Draft. Evidence: EVD-0202.

Evidence: EVD-0023, EVD-0032, EVD-0050, EVD-0083–0086.
