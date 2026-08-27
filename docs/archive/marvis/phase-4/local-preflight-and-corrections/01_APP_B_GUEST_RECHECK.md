# Phase-4 · App `test-app-first-publish-001` non-owner/Guest recheck (corrected)

Date: 2026-08-24 (Asia/Shanghai)  
Target: `https://worldos.cc/zh-cn/apps/test-app-first-publish-001`

## Provenance correction

The original file described a Codex-local browser-session limitation: the main Agent's IAB/Chrome contexts exposed only Account A. That did not mean the project's independent Account B or Guest environments were unavailable. The actual Account B session belonged to the user's external Tencent Marvis Agent and was not visible from Codex.

The old project-level `BLOCKED` conclusion is withdrawn. The local preflight remains only session-isolation evidence (EVD-0178), not product behavior.

## External Marvis result supplied by the user

| Time | Identity | Action | Result |
|---|---|---|---|
| 14:21:35 | Guest | Direct URL | Generic 404, `This page could not be found.` |
| 14:23:44 | Guest | Hard refresh | Still 404 |
| 14:26:18 | Account B | Direct URL | 404 |
| 14:27:08 | Account B | Hard refresh | Still 404 |
| 14:27–14:29 | Account B | App Market search by title/slug | No result |
| 14:30–14:31 | Account B | Unified Search, including App tab | No matching result |
| 14:32 | Account B | Known deleted App control URL | Same generic 404 shape |

The report was supplied by the user from the external witness Agent; the detailed archival copy is `docs/research/external/marvis/phase-4/06_APP_RECHECK_001_EXTERNAL_MARVIS.md`. Original images/document are not yet archived. See `docs/research/external/marvis/phase-4/05_APP_B_GUEST_RECHECK_USER_TRANSCRIPT.md` and EVD-0179.

## Later external final recheck

After the owner completed the real downlist→republish lifecycle, `docs/research/external/marvis/phase-3/raw/FINAL_RECHECK_001.md` reports that Guest and Account B could again open and hard-reload the direct App URL. Both identities still received no App Market or Unified Search result by exact title/slug. This later state is EVD-0190 and supersedes the earlier 404 as the current direct-access result.

## Correct conclusion

The tested App was consistently invisible to Guest and Account B by direct URL and discovery/search in the reported run, while owner EVD-0174 sees public v2 and an editable slug route. This is a real cross-account discrepancy. Exact cause remains `UNKNOWN`: downlist/unpublish state, stale visibility projection, private lifecycle state or permission defect cannot yet be distinguished. EVD-0180 confirms a real usage-gated `下架` branch exists, but no downlist was submitted in the owner run.

The complete observed transition is: external direct 404 during the earlier state → owner downlist/relist lifecycle → external direct access restored, while discovery remained absent. This supports a publication-state association but does not reveal the precise backend flag or discovery-index rule.

Confidence: external observations `EXTERNAL_BLACKBOX_REPORTED / HIGH` at the tested-sample scope; exact flag/index cause `UNKNOWN`.
