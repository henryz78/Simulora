# MANUS P3 — Unverified Controls Register

**Purpose.** This register accompanies `MANUS_P3_PAGE_CONTROL_LEDGER.csv`. It explains why a control was not triggered or why an entire page’s requested delta could not be resolved. It is deliberately conservative: **`NOT_VERIFIED` does not mean absent, broken, or permission-denied.**

> The task-required prior files—especially `docs/worldos-research/ux/PAGE_CONTROL_AUDIT.md`—were unavailable in the local workspace. A page-level *delta* cannot be distinguished reliably from a pre-existing control inventory without that baseline. The register therefore preserves the requested coverage list, records actual safe UI observations where made, and avoids rebuilding a full audit that the task expressly forbids.

## Global blocking and non-duplication rules

| Condition | Effect on controls | Classification |
|---|---|---|
| Required prior Page Control Audit / site-map files unavailable locally | Delta status for any control not present in locally available P1/P2 reports cannot be calculated. | `NOT_VERIFIED` — reason: `INPUT_UNAVAILABLE` |
| P1 App discovery / Gift | Must not be run again. | `PREVIOUSLY_COVERED` or not re-triggered |
| P2 Creator generic field validation, responsive, non-App discovery, locale/routing, App Market census | Must not be run again. | `PREVIOUSLY_COVERED` or not re-triggered |
| Third-party Comment, Gift, Follow, Favorite, Rating, Remix | Visible but not triggered. | `BLOCKED` — task safety boundary |
| Payment, membership, Credits or API keys | Visible entry may exist but not used. | `BLOCKED` — task safety boundary |
| P3 World creation required-cover upload | The browser’s available upload target did not identify a usable file-input element. No P3 World/Simulation exists. | `TOOLING_BLOCKED` for dependent controls |

## Page-level residuals

| # | Page | Current residual / unverified area | Status and reason |
|---:|---|---|---|
| 1 | Home | Carousel transition, every category, terminal scroll, empty/error UI, reload comparison. | `NOT_VERIFIED — INPUT_UNAVAILABLE`; full Home audit would be a prohibited reconstruction. |
| 2 | Global navigation | Every dropdown state, Account / Rewards / Notifications drawers, Escape/back/reload outcomes. | `NOT_VERIFIED — INPUT_UNAVAILABLE`; only baseline visible controls were recorded. |
| 3 | World detail | Share outcome, character expansion, leaderboard sort changes, comments, rating; third-party writes. | Safe reads `DISCOVERED_ONLY`; third-party writes `BLOCKED`. |
| 4 | World Search | Clear, query results, tag filters, empty state. | Query/discovery work `PREVIOUSLY_COVERED`; clear would mutate P1/P2 retained search history; remaining delta `NOT_VERIFIED — INPUT_UNAVAILABLE`. |
| 5 | Character library | Search, all filters/sorts, pagination/terminal behavior. | `NOT_VERIFIED — INPUT_UNAVAILABLE`; no census or third-party write. |
| 6 | Character detail | Full tabs/comments/rating-like state if any beyond the observed modal. | `NOT_VERIFIED — INPUT_UNAVAILABLE`; third-party writes `BLOCKED`. |
| 7 | Character drawer | The observed normal UI was a centered detail modal; it was not labeled as the requested drawer. | `NOT_VERIFIED` — modal is not silently equated to a drawer. |
| 8 | App detail | Favorite, Install, rating, comments, preview reset. | Install P1/Task3-dependent; no unrelated writes; statuses in CSV. |
| 9 | Maps | Catalog filters, scope switch, terminal scroll and sets. | Deferred to **Task 4**; do not conflate task outputs. |
| 10 | Community | Leaderboard dimensions, external links, World card actions. | `NOT_VERIFIED — INPUT_UNAVAILABLE`; third-party Remix `BLOCKED`. |
| 11 | Collections | Route and normal controls are not attributable from unavailable Page Control Audit. | `NOT_VERIFIED — INPUT_UNAVAILABLE`; no new Collection created. |
| 12 | Mine | Tab/menu, empty/error states, reload, save controls. | `NOT_VERIFIED — INPUT_UNAVAILABLE`; task avoids re-auditing generic Simulation behavior. |
| 13 | Creator Profile | Generic creator form/field tests. | `PREVIOUSLY_COVERED` by Phase 2; no re-run. |
| 14 | Account | Account menu settings, close/back/reload. | `NOT_VERIFIED — INPUT_UNAVAILABLE`; deletion/payment actions excluded. |
| 15 | Pricing | Plan selection and checkout-related controls. | `BLOCKED` — payment/membership prohibited. |
| 16 | Rewards | Share/reward flow and redemption outcomes. | `NOT_VERIFIED — INPUT_UNAVAILABLE`; no reward redemption or purchase. |
| 17 | Notifications | Drawer content, mark-read side effects, close/reload. | `NOT_VERIFIED — INPUT_UNAVAILABLE`; no effects inferred. |
| 18 | Simulation | Generic settings/drawers/turn UI. | Task 2 covers own P3 Sample B Settings and Memory; additional generic page audit intentionally not rerun. |

## Re-entry condition

To convert these statuses into a true delta ledger, provide the missing prior audit bundle or attach the current `PAGE_CONTROL_AUDIT.md` and its coverage/site-map inputs. The correct next operation would be **comparison against that baseline**, not a new whole-site sweep.
