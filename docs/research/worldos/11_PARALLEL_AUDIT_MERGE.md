# Parallel Audit Merge / Conflict Check — Complete

## Sources read

- `docs/research/external/marvis/second-account/00–12`
- `docs/research/external/marvis/second-account/phase-2/01–07`
- `docs/research/external/anonymous/54950e4f8e8a473f94337f9cb289c57b.md`
- `docs/research/external/anonymous/f5d8a5d3a7ea48f8be2f2250be0832a5.md`
- `docs/research/external/marvis/phase-3/01_COLLECTION_PUBLIC_VISIBILITY.md`
- `docs/research/external/marvis/phase-3/02_PRIVATE_UNLISTED_MATRIX.md`
- `docs/research/external/marvis/phase-3/03_REMIX_PERMISSION_ENFORCEMENT.md`
- `docs/research/external/marvis/phase-3/04_VERSION_REMIX_BASELINE_ATTRIBUTION.md`
- `docs/research/external/marvis/phase-3/05_GUEST_CONTROLS_AUDIT_REMAINING.md`
- `docs/research/external/marvis/phase-3/06_ACCOUNT_A_ACTION_REQUIRED.md`
- `docs/research/external/marvis/phase-3/07_PHASE3_SUMMARY.md`
- `docs/research/external/marvis/phase-3/raw/BATCH1_COLLECTION_PRIVATE_REMIXPERM.md`
- `docs/research/external/marvis/phase-3/raw/BATCH2_VERSION_REMIX_ATTRIBUTION_CONTROLS.md`
- `docs/research/external/marvis/phase-3/raw/FINAL_RECHECK_001.md`

These are independent evidence sources. Their results are merged at the tested-sample scope, not promoted automatically to global rules.

## Accepted new evidence

| Finding | Source | Merge decision |
|---|---|---|
| Guest public browse/search/share is open; most writes enter login | Anonymous + Phase-2 | Accepted as cross-checked guest baseline |
| Guest favorite silently fails while logged-in favorite persists | Anonymous + Account B | Accepted as a reproducible UX inconsistency |
| Logged-in rating still requires prior World play; comment does not | Account B + Phase-2 | Accepted for tested World/sample |
| Follow/unfollow persists after refresh and changes count | Account B | Accepted for tested profiles |
| Public Remix is independently owned, public, searchable and direct-parent attributed | Account B | Accepted; agrees with main EVD-0118/0120 |
| Deleted App direct URL 404 and Search omission | Account B | Accepted for deleted sample |
| Deleted Character source leaves externally searchable/runnable World-local copy | Account B | Accepted; strengthens main snapshot evidence |
| Creator Profile does not expose email | Account B | Accepted for external profile view |
| Anonymous page-control inventory: 324 discovered / 315 triggered / 9 unknown | Anonymous controls audit | Accepted as the guest control-audit baseline |
| Public Collection direct access, directory inclusion but title omission from unified Search, non-owner World membership write, and no Collection-level favorite control | Phase-3 Account B | Accepted at tested-sample scope; private/link-visible enforcement remains UNKNOWN |
| Intermediate World Remix parent deletion makes the direct parent 404 and silently removes descendant attribution while descendant direct URL/Search/Edit/Remix survive | Phase-3 Account B | Accepted at tested-chain scope; this is stronger than the earlier session-preflight result |
| Non-owner Version History is read-only with no old-version selector/link | Phase-3 Account B | Accepted; owner old-version URL/Share behavior remains UNKNOWN |
| Guest Character leaderboard/supporter states, App gift login wall, and Map preview/detail-route controls | Phase-3 Guest | Accepted; final gift side effects and map/World equivalence remain UNKNOWN |
| App `test-app-first-publish-001` returned generic 404 to Account B | Phase-3 Account B | Accepted only as an observation; delete/unpublish/downlist/private root cause remains UNKNOWN |
| Guest + Account B repeated direct 404, refresh persistence, App Market/Search omission; same shape as known deleted App | Detailed external Marvis witness report relayed by user; archival copy `docs/research/external/marvis/phase-4/06_APP_RECHECK_001_EXTERNAL_MARVIS.md` | Accepted at reported sample scope with `EXTERNAL_BLACKBOX_REPORTED` provenance; original screenshots are not archived; strengthens cross-account discrepancy but does not identify root cause (EVD-0179) |
| After owner republish, Guest + Account B direct URL/hard reload recovered while App Market and Unified Search stayed empty | External Marvis final delta `docs/research/external/marvis/phase-3/raw/FINAL_RECHECK_001.md` | Accepted as the later tested state; supersedes EVD-0179 for current direct access and closes the external republish delta (EVD-0190). Exact backend flag/index cause remains UNKNOWN |
| Link-visible Collection is direct-readable by Guest/B, absent from discovery/Search and strips owner management controls | External Marvis final delta | Accepted at tested-sample scope; closes link-visible external enforcement, not only-me access (EVD-0191) |
| Published remix-disabled World blocks Guest/B with surface-dependent feedback and creates no Remix | External Marvis final delta | Accepted at tested-sample scope; closes the known external enforcement experiment while leaving existing-descendant/direct-route exceptions open (EVD-0192) |

## Main-account closure of auxiliary UNKNOWNs

- Account A notification body is now directly observed: comment, favorite, follow and Remix records are present, persistent and deep-link to the corresponding World, Profile or child World. This closes the auxiliary `AA-3 / Account A Notification` gap at the tested-sample scope (EVD-0158).
- Existing main EVD-0118 already established Remix notification/unread behavior; the newer observation expands the event categories.

## Conflicts / wording corrections

- The auxiliary report noted a possible `ft9r` owner-label mismatch. Do not use its chain ownership labels as canonical without direct URL inspection. The product rule remains direct-parent attribution; exact historical sample ownership is a data-label discrepancy.
- Auxiliary reports originally marked Account A notifications as unverified because they stopped before returning to Account A. Main evidence is later and therefore supersedes that stage-specific UNKNOWN.
- `slug completely unsearchable` is only proven for tested search samples; preserve sample-scoped wording.
- `delete propagation is immediate` is only proven for the deleted App/Character samples and observed intervals; exact indexing SLA remains UNKNOWN.

## Open questions closable without repeat testing

- Guest vs logged-in non-owner browsing/login-wall baseline.
- Cross-account favorite/follow/comment/rating behavior for tested objects.
- Public Remix external ownership/attribution/Search behavior.
- Creator Profile email non-disclosure.
- Account A notification categories: Follow, Favorite, Comment and Remix.

## Still requires owner or new-account testing

- Private / Unlisted direct-link and discovery enforcement.
- Public→Private propagation.
- Old Version URL / Share / Remix baseline.
- Character source/intermediate-parent deletion effects on Character Remix attribution and edit/delete lifecycle. World intermediate-parent deletion is now VERIFIED for one tested chain (EVD-0171), but broader object-type semantics remain open.
- Collection `仅自己` external enforcement.
- Character/App visibility variants and downlist/unpublish.
- Truly fresh-account onboarding and successful BYOK/provider behavior.
- Exact App Market/Unified Search convergence and backend publication/index cause after relist.

## Do-not-repeat list

- Do not rerun the full Guest public-page audit.
- Do not rerun the full Account B public Remix/follow/favorite/comment baseline.
- Do not rerun Account A notification checks unless testing a new event category or retention boundary.
- Do not rerun the main Simulation/App/Map/Memory experiments merely to obtain a second-account view.
- Do not treat EVD-0164's initial owner-session preflight as evidence that Account B was unavailable for the completed Phase-3 run. It records only the main Agent's own session isolation at that moment.

## Merge status

`COMPLETE`: all supplied Account-B, Guest/anonymous and external Marvis evidence is integrated with identity/time/provenance limits. EVD-0190 supersedes the earlier current-state App 404 with post-republish Guest/B direct recovery while preserving Market/Search omission; EVD-0191 closes link-visible Collection external enforcement; EVD-0192 closes the tested remix-disabled World enforcement. Later main evidence closes visible historical-version controls, Character Remix owner-surface boundaries and the emulated mobile core. Entitled Private/Unlisted/only-me enforcement, export artifacts and index-policy edges remain explicitly `BLOCKED/UNKNOWN` in `06_OPEN_QUESTIONS.md`; the external Marvis assignment is complete and must not be repeated.
