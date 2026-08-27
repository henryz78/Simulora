# WorldOS Phase 2 Executive Summary

**Scope.** This independent Phase 2 validation used only the authorized free Owner account and ordinary browser UI. It created and handled only `MANUS-P2-*` assets. It does **not** re-state Phase 1 App Gift or App Index conclusions, does not claim any long-term indexing SLA, and does not include private, membership, payment, security, API, or real-device testing.

## New confirmed mechanisms

| Area | Confirmed observation | Product-design implication |
|---|---|---|
| World drafts | World uses visible automatic draft feedback (`Saving draft…` / `Draft saved`) and direct edit-route reopen showed `Draft restored` with Unicode, emoji, multiline content and cover retained. | A draft architecture should expose explicit save state and support idempotent route-level recovery. |
| Character saves | Character requires explicit `Save character`; after save, card/detail/edit reopening retained Name, Profile and public intro. | Character editing follows an explicit-save model, not the observed World autosave model. |
| App recovery | A valid static HTML App draft visibly reported `Draft saved`, yet generic `/apps/create` reopened blank. A published slug-specific editor route restored its full configuration. | Draft identity / recovery route must be unambiguous; generic create and resource-specific edit recovery have materially different behavior. |
| Non-App projection | Published/renamed World and Collection projected to Owner direct routes, directory/search or profile surfaces within the observed short window. World title search and full-slug search diverged at publication. | Separate direct availability from discoverability/index behavior; visible title and generated slug are not interchangeable search keys. |
| Rename routing | World and Collection renamed public titles while retaining their original generated slug routes. Character renamed in Profile card flow; no canonical direct Character detail route was exposed. | Stable identifiers may be durable while display names mutate. Test plans should not assume slug regeneration. |
| Locale deep links | The same World detail resolved with localized UI under `/zh-cn/...` and `/es/...`; `/en/...` returned an English 404 while the non-prefixed route had previously been usable. | Locale-prefix routing needs route-by-route canonicalization and fallback testing; avoid assuming all supported locales share equivalent prefixed deep-link coverage. |

## Important contradictions and boundaries

The public World’s exact title query returned a result at publication while its full visible slug query returned `No results yet`; this is a UI-level query divergence, not a statement about object availability. The Collection’s displayed title converted the original Chinese suffix to `Public` in English UI, while the generated URL retained a transliterated `gong-kai` token. These outcomes reinforce the distinction between display-layer localization and stable identifiers.

The Map Directory exposed map use/consumption but no normal free Map Creator entry. This is recorded as **`CREATOR_ENTRY_NOT_EXPOSED_IN_FREE_UI`**, not as `MEMBERSHIP_BLOCKED`, because no membership wall was actually displayed. The responsive matrix cannot verify the requested four CSS viewports: the browser exposed 1280×1100 CSS viewport dimensions and `window.resizeTo` changed outer dimensions only. Consequently, every unsupported viewport cell is explicitly marked `VIEWPORT_SIMULATION_NOT_VERIFIED` and mobile-specific capability is **`DEVICE_BOUND_UNKNOWN`**.

## Important UNKNOWN and execution limitations

The Locale matrix confirmed three direct World-link outcomes and one query/hash preservation case, but cannot credibly claim the requested 18-route-by-3-locale full grid. Browser `Alt+Left` did not yield an observable history transition in this environment, and safe new-tab automation was unavailable. These are documented as tooling-limited `UNKNOWN` rather than product failures.

Collection deletion was attempted twice through ordinary visible UI and timed out; direct reopen showed the Collection was still public. A published App delete click produced no confirmation, error, or removal. To avoid repeated destructive operations and any non-P2 impact, remaining assets are explicitly `CLEANUP_BLOCKED` in the cleanup manifest rather than falsely reported as cleaned.

## Short-window language

The Phase 2 discovery evidence only uses **IMMEDIATE** or **CONVERGED_WITHIN_3M** where the specified observed entry points remained consistent across the recorded samples. No result is an estimate of a long-term SLA. Any unobserved route, identity, query semantics, directory placement, or deletion result remains `UNKNOWN`.

## Evidence package

The primary matrices are `MANUS_P2_CREATOR_VALIDATION_MATRIX.md`, `MANUS_P2_NONAPP_INDEX_TIMELINE.md`, `MANUS_P2_RESPONSIVE_MATRIX.md`, `MANUS_P2_LOCALE_ROUTING_MATRIX.md`, `MANUS_P2_CREATOR_FIELD_RESULTS.csv`, and `MANUS_P2_CLEANUP_MANIFEST.md`. Their supporting Creator inventories, screenshots, HTML/page-text captures and console outputs remain in the evidence directory.
