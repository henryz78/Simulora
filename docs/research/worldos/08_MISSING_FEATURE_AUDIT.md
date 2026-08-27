# Missing Feature Audit — Complete

This is the required second-round audit. It is complete at the product-research boundary: all 47 registered `OQ-*` items are exhaustively classified below, all unresolved behavior remains explicitly `UNKNOWN`/`BLOCKED` with a bounded verification path, and no uninvestigated core lifecycle or architecture mechanism remains hidden inside the former “missing” list.

## Revisited from home/global navigation

- `/zh-cn/worlds/search` revealed unified cross-object Search, URL query state and App/User result sections (EVD-0035).
- Notification modal has an explicit empty state (EVD-0038).
- Account button exposes full Settings IA including BYOK, presets and DELETE gate (EVD-0039).
- Creator revealed title-template chooser, mobile preview device control, layout designer and App onboarding copy.
- World detail revealed version history, saves, similar Worlds, share composer, collection action and World-level cost range.
- Simulation revealed Stats, Relationships, Chat message state, Shop purchase Turn semantics and export membership wall (EVD-0041–0044).
- Mine revealed Simulation History management and a full World Quality scoring/checker page (EVD-0051).
- App Creator revealed required-HTML validation, accepted top-level array JSON, and silently normalized malformed JSON to `{}` while preserving the rest of the Draft (EVD-0050, EVD-0196).
- Character Add-to-World revealed copied editable WorldCharacter configuration (EVD-0052).
- Map “Use this map” was rerun in both existing-World and new-World modes. New-World creation now has direct slug/version evidence (EVD-0078); existing-World target ambiguity remains a separate UNKNOWN.
- Character detail/add flow was rerun against a World already containing the source Character; the target button entered a disabled state and returned `出错了，请重试。` (EVD-0077).
- Template application was rerun on a fresh Creator. Multiple template selections merge additively; EVD-0156 closes Draft/reload, publication, public `/new` and fresh-Simulation story propagation. Remaining template gaps are variable serialization, required/default/empty behavior and template-specific prompt/rule injection.
- Existing App lifecycle was rerun through HTML edit → `存草稿` → public detail → existing Simulation → explicit `发布`. Save immediately created public v8 and hot-updated the existing Turn 2 Simulation without a World version; explicit Publish returned to detail without creating v9 (EVD-0083–0086).

## New surfaces added to inventory

- World detail share composer and rewards handoff.
- Unified Search `全部/世界/角色/用户/App`.
- Character runtime relationship state.
- Stats/progression state schema.
- App delete usage-check confirmation.
- Account presets empty state.
- One-time Simulation player identity, functional Persona preset picker and separate `playerSetup` runtime context.
- Configurable Achievement App, hidden/rarity schema, Account×World unlock ledger and Rewind-external ownership.
- Creator mobile shell and no-overflow measurement.

## Still missing after second pass

1. Character source final delete is now executed (EVD-0123): World-local, World Remix and Character Remix snapshots survive; source Chat becomes 404 while History keeps a tombstoned link. L1/L2 descendant Chats are independently runnable and persistent, and a fresh World Simulation can initialize/use the preserved World-local Character in Chat plus later Character State (EVD-0124, EVD-0127–0128). EVD-0205 establishes that Remix edit/delete controls are not discoverable and intermediate-parent deletion is unreachable through normal UI. Still missing: member/private visibility enforcement and stable public clone resolution/indexing.
2. App persisted-state migration and permanent delete lifecycle are verified for the owner World: deletion creates a cleanup Draft and can temporarily break a save; publishing a dependency-clean version restores the same UUID without restoring the App. First Publish, two-stage install, old/fresh runtime and public hot-upgrade are closed. EVD-0150/0154 verify full primitive/nested/array seed in a second World; EVD-0155/0235 prove zero-Turn deep three-way migration with path dirtiness, stable-ID object-array union, null precedence, omission-preserves-old and a fresh literal-seed control. Remaining merge edges are arrays without IDs/duplicate IDs, type conflicts and a discoverable explicit deletion/tombstone representation. Usage-counter exact eligibility/SLA and cross-owner dependencies remain open.
3. Template application is no longer a missing lifecycle: EVD-0156–0157 verify fresh-Creator materialization, additive template composition, Draft/reload, publication, public `/new` and fresh-runtime use of submitted template fields. Remaining UNKNOWN is limited to prompt serialization, empty-default and replacement/removal edge semantics.
4. Permission enforcement from an independent viewer; Character/App visibility variants.
5. Onboarding from a truly fresh account/session.
6. Export file schema remains behind the membership wall: EVD-0138 confirms the modal advertises Markdown/HTML/TXT but no file can be downloaded on the current entitlement. Import behavior remains untested.
7. Network loss is closed by EVD-0201; invalid BYOK is closed by EVD-0208; insufficient Credits has a full boundary sequence in EVD-0212. EVD-0217/0222/0224 cover SVG/PNG/JPEG/WEBP/GIF upload, public propagation, format-preserving paths, wide-aspect and EXIF-JPEG acceptance, plus invalid-MIME silent clear/recovery. Still missing: valid-key provider failure, avatar oversize/tiny/transparency/malformed/network boundaries, animation/EXIF binary normalization, deliberate avatar reset, and remaining inaccessible/deleted recovery variants.
8. Time App basic next-event/day/month/year behavior is verified (EVD-0088–0089). Social in-place Rewind Turn 15→6 is verified across Story, Stats, Relations, Memory, Chat, Instagram and event nodes (EVD-0144). EVD-0213 adds Character Chat T2→T20/T21 secret recall, no visible Memory through T21 and a narrower no-Rewind historical UI. EVD-0232 then finds the first Character summary by T25, proves two-Turn tail lag, editable/reload-persistent Memory-only conflict injection at T26 and source/checkpoint isolation. EVD-0214 closes the equivalent World Memory edit→AI injection. Remaining gaps are arbitrary-date/custom jump, pre-summary retrieval source, later automatic Memory merge/overwrite, multiple-Memory precedence/length, non-empty Time-world Memory and autonomous-social trigger rules.
9. Full Mine History semantics, recommendation personalization and pagination/infinite scroll. A direct World-save final delete removes the World list and makes its UUID 404 with no undo; EVD-0219 confirms eventual Mine/sidebar cleanup. EVD-0221 exposed a distinct parent-World-delete path: child runtime 404s immediately, but a Mine History row survives with a dead UUID and can still be renamed/persisted. EVD-0223 closes the remaining in-session manual-delete path: the orphan row is removed from History and remains absent after reload, with no Undo/Restore. Long-term retention before cleanup, cross-device cache and pagination remain open.
10. EVD-0228 closes the emulated responsive core: deterministic 360×844 Simulation/Creator with no page-level overflow, full-screen Settings, real Character Chat Turn/charge, Creator desktop/mobile/setup Preview dimensions, route-return persistence, and 844×360 multi-panel orientation switch. Remaining gaps are real touch long-press/drag/App switching, OS keyboard/IME occlusion, safe-area/notch and background/suspend/resume behavior.
11. Existing-World Map publish/propagation is verified through mixed v4, including zero-Turn old-save migration, fresh-save initialization, same-region state/action parity and visible geographic base plus Three Kingdoms overlays (EVD-0125, EVD-0130). EVD-0137 verified one `Demons → 测试角色 001` Draft association. EVD-0148–0149 verify published v9 region drawers/region Turn, two independent roleization controls, before/after duplicate-binding Preview, v10 public Character alias and zero-Turn old-save migration to `👹 测试角色 001` + `⚔️ Demon Slayer Corps`. EVD-0151 now verifies marker create/edit/explicit-save/Preview/v11 publish/old-save import/fresh-save seed/runtime detail and coexistence with AI-generated markers. Still missing: fresh-v10/Character-State parity, relation-clear causality, marker runtime move/delete/Event Delta/Rewind, and `/maps` catalog omission cause.

12. The two previously pending action-time experiments are now submitted and postcondition-verified: Map v10 public alias/migration (EVD-0149) and App v2 second-World Draft installation/seed (EVD-0150). Remaining steps are narrower published-runtime/usage semantics, not repeated confirmation gaps.

13. EVD-0236 resolves the previously global “preset injection unknown” into two distinct surfaces: Simulation Settings can copy an Account Persona exactly into one-time `playerSetup` and use it on the next Turn, while World `/new` remains a repeated no-op. EVD-0249 adds Persona-only picker scope, manual 40/600 fields, rich avatar selection and exact override ordering, but exposes a World `/new 身份=Alice` precedence conflict where later manual identity is not reflected in Main Input/Chat. Remaining gap is the intended arbitration/storage contract and avatar model serialization, not the identity-form control set.

14. EVD-0246–0248 close the previously catalog-only Achievement lifecycle through configuration, publication, grants, duplicate idempotency, Rewind, definition removal, App uninstall/reinstall, same-name new identity, old/current/fresh version projections and a unique re-grant. Remaining gaps are concurrent Event ordering/payload, World-delete ledger lifetime and the currently absent ordinary-custom Profile/external projection.

### Character Remix control update (EVD-0181)

- Mine → 角色 → `TEST Character Remix 003` confirms durable clone ownership and a detail drawer with `聊天/改编/添加到世界`, but no `编辑/删除`. `改编` is copy-forward: it pre-fills the clone's name/description and states that App-level configuration is copied; closing the panel creates nothing.
- EVD-0205 closes the discoverable edit/delete check: an ordinary Character on the same Mine grid expands a complete editor inline without a route change; L1/L2/003 have no corresponding card/Drawer Edit/Delete/More/href. Intermediate-parent deletion is therefore unreachable through the normal product surface. The remaining gap is hidden backend behavior (not guessed) and stable public URL/index convergence.

Each item remains in `06_OPEN_QUESTIONS.md` or must be added before the final audit.

## Parallel-audit merge update (2026-08-24)

- Two Account-B phases and two anonymous reports were read from `docs/`; accepted findings and conflict rules are registered in `11_PARALLEL_AUDIT_MERGE.md`.
- Do not repeat the full Guest/non-owner public audit. EVD-0191/0192 close link-visible Collection and remix-disabled World enforcement. EVD-0188/0207 establish that historical World snapshots are not discoverable through normal UI, so no guessed-route experiment remains. EVD-0231 directly triggers both World `不公开列出` and `私有`: a free owner is intercepted by the same membership dialog before selection changes. Remaining permission work is therefore narrowed to entitled Private/Unlisted/Public→Private external enforcement, only-me Collection external access and deletion propagation; it cannot be completed from this free account without payment and remains `ENTITLEMENT-BLOCKED`.
- Account-A Comment/Favorite/Follow/Remix notifications are closed for tested categories (EVD-0158).
- Collection explicit-save persistence, link-visible external enforcement, add/reorder/remove commit and empty/non-empty disposable deletion are closed (EVD-0159, EVD-0183–0184, EVD-0191, EVD-0206, EVD-0216). Non-empty delete clears detail/edit/Search/Profile/reverse-membership projections but preserves the member World/version/save. `仅自己` external access, eventual public-index SLA, notification behavior and backend retention remain open; tested member removal produced no new notification.
- EVD-0193 adds a persisted owner-only Collection sample; only-me external access, eventual public-index SLA, non-empty delete and notifications remain open.
- EVD-0195 confirms only-me owner Profile inclusion versus public directory/Search omission; no external viewer inference is made.
- Character Detail public-control gap is narrowed: `排行榜` exposes `开局数/总轮次` ranked Profile links; `支持者` exposes the donor empty state and enters a two-stage nine-denomination gift modal without submitting (EVD-0165).
- EVD-0210 upgrades gift research from modal-only to a real Profile settlement: 100 debited from sender, 70 credited to recipient income and donor leaderboard updated. Official-App gift and repeat Profile gift expose unresolved distinct failure gates.
- EVD-0227 independently verifies the minimum 20 tier against another creator: sender `175→155`, recipient income `14,140→14,154`, donor count `5→6` and linked donor row. This excludes a global permanent one-gift-per-account rule; same-recipient and App-recipient gates remain unresolved.
- EVD-0211 verifies two consecutive 80-energy per-World save-slot purchases, each atomically increasing capacity and creating a Simulation. EVD-0212 adds the negative-balance defect baseline and post-quota recovery.
- EVD-0194 rechecks Character Remix 003: Mine owner persistence remains available through a Drawer; no stable `href`, Edit or Delete control is exposed; exact global Character Search still returns the empty state while Mine retains the clone. Hidden alternate routes and index convergence remain UNKNOWN.
- EVD-0204 closes the old Rewind/extra-App billing UNKNOWN. A post-snapshot Shop install raises Deepseek 8→10 and charges 10; restoring before installation removes the active surcharge, the next Turn charges 8, and reload clears the temporarily stale Dock. The earlier “later App config remains” interpretation is superseded.
- EVD-0198 closes the clone Chat save boundary: a stable UUID appears in Mine Character History, can be renamed, and keeps Character identity separate from save title. EVD-0199 reveals a system-wide Character sharing defect candidate: ordinary and Remix Character composers emit `/worlds/char:<uuid>` links that owner-direct 404; the Remix poster also fails.
- Map "two preview entries" are not equivalent duplicates: `查看大图` opens an in-page pan/zoom map viewer, while `新标签页查看世界` targets the associated World detail with `_blank` (EVD-0166).
- The main-Agent preflight (EVD-0164/0178) found only Account-A sessions in that Agent's own browser context. This is `SESSION_ISOLATION_FOR_MAIN_AGENT/CODEX_LOCAL_SESSION_ISOLATION`, not a project-level Account-B block. External Tencent Marvis evidence now covers the App transition (EVD-0179/0190), link-visible Collection (EVD-0191) and published remix-disabled World (EVD-0192). World/Character/App Private/Unlisted, Public→Private and only-me Collection still lack independent-viewer samples.

## App visibility/downlist audit update (EVD-0179–0180)

- The external Marvis report archived at `docs/research/external/marvis/phase-4/06_APP_RECHECK_001_EXTERNAL_MARVIS.md` reports persistent direct 404 after refresh and App Market/Unified Search omission for `test-app-first-publish-001`, with the same generic 404 shape as a known deleted App. This is accepted as external black-box evidence at the tested-sample scope; original image/document artifacts are not archived.
- Owner-side Creator inspection now directly exposes the usage-gated branch: two other Worlds in use cause `删除` to resolve to a `只能下架` modal. Its copy explicitly says the App is hidden from App Market while installed Worlds remain unaffected. Cancel preserved the App.
- Collection owner follow-up EVD-0183 verified that adding a World and keyboard drag-reordering are submitted by `保存合集` and persist after redirect/reload. EVD-0206 adds the matching removal path: no per-item confirmation, explicit Save, redirect, persistent lower count and re-add candidate. EVD-0184/0216 completed empty and non-empty deletion; non-empty delete removes the Collection/membership projections without cascading the member World/version/save. EVD-0241 closes directory paging/control behavior. Exact native whole-delete copy, cross-account cache timing, only-me external access, ranking formula and indexing SLA remain UNKNOWN.
- EVD-0186–0187 close the owner-side downlist/relist lifecycle. EVD-0190 adds the external post-republish state: B/Guest direct URL and hard reload recover, while Market/Search stay empty. Treat the 404→reachable transition as publication-state-associated at this sample, not proof of a specific internal downlist flag; discovery cause/SLA remain `UNKNOWN`.
- EVD-0218 adds a same-session control: the republished App is now found by exact visible title in Owner App Market, not by slug, but remains absent from Owner Unified Search; official `主输入框` is returned by that same Unified App tab. Discovery is therefore a verified identity/surface projection split rather than a generic search outage. Backend eligibility and convergence remain `UNKNOWN`.

## Newly discovered acquisition surface

- EVD-0220 follows the previously unrecorded `/zh-cn/pax-historia` link from World Similar content. It is a full localized competitor/intent landing page with a comparison table, 22 standard World cards, hash CTA, directory CTAs and five static FAQs. It is now added to the site map, feature inventory, page-control audit and parity suite.
- Remaining audit question: whether WorldOS exposes sibling SEO routes for other competitors/genres and whether their card feeds are fixed, personalized or generated. No route variants are guessed.

## Published World final-delete update

- EVD-0221 closes the previously in-progress published World + child-save deletion. World detail/edit/new, exact Search, Mine Works, owner Profile and the child runtime all invalidate; unrelated objects and energy remain unchanged.
- It also adds a projection-split defect baseline: Mine History retains a writable orphan record whose Rename persists while its UUID stays 404. EVD-0223 verifies the remaining `删除` control removes that metadata row and persists after reload without recovery UI; only long-term/cross-device retention and backend tombstone semantics remain open.

## Manus Phase 1/2/3 merge update (2026-08-25)

- All supplied Manus documents, logs, CSVs, rendered HTML and screenshots were read and quality-classified in `12_MANUS_CROSS_AGENT_MERGE.md`. Exact duplicate screenshots/documents were removed by SHA-256 with retained alias manifests; no live Phase 3 screenshot reference is broken.
- Phase 1/2 did not include the approximately 148 cited browser screenshots/HTML, so Manus-only conclusions from those phases remain `EXTERNAL_REPORT_ONLY`; matching main findings are useful corroboration but do not supersede direct EVD evidence.
- Manus Character Memory is not a matched repeat of EVD-0213/0232/0233. Different accounts, Characters, models/costs and transcripts show variable reported first-summary windows and a manual card reported visible to T35. Its claimed T29 recall screenshot does not contain the exchange, so that claim is report-only. A broad T35 rerun is removed from the missing-feature list; only a true second-summary/multi-card or matched cross-model experiment remains high value.
- Manus Maps terminal HTML/CSV evidence independently verifies one Base=1,085 / All=1,181 snapshot with a 96-href strict superset. This closes the missing exact Base-versus-All set relation for that captured session, while the main 1,083 versus external 1,085 difference becomes OQ-0047 rather than an assumed fixed total.
- Manus P3 App merge was blocked before World install/Simulation, and the Page Control ledger lacked the main baseline. Neither creates a missing core flow or justifies repeating the stronger main App merge/mobile/control work.

## Final gap triage (2026-08-25)

This is an exhaustive classification of all 47 `OQ-*` sections, not a claim that every residual policy is known. Each ID appears exactly once in the classification table below. The classification distinguishes missing product architecture from diminishing-return policy questions and genuine access/tooling boundaries.

| Class | Open-question IDs | Audit interpretation |
|---|---|---|
| Core mechanism closed; residual edge/policy/generalization remains | OQ-0001, OQ-0005, OQ-0008, OQ-0010, OQ-0011, OQ-0012, OQ-0014, OQ-0035, OQ-0036, OQ-0015, OQ-0016, OQ-0017, OQ-0019, OQ-0022, OQ-0024, OQ-0026, OQ-0027, OQ-0029, OQ-0030, OQ-0031, OQ-0033, OQ-0034, OQ-0040, OQ-0041, OQ-0042, OQ-0043, OQ-0044, OQ-0045, OQ-0046, OQ-0047 | The parity architecture and ordinary path are evidenced. Residuals concern ranking/SLA/cadence, extreme schema boundaries, concurrency, long-horizon retention or broader sampling. They stay `UNKNOWN` where appropriate and do not justify repeating whole lifecycles. |
| Resolved without a material product gap | OQ-0002, OQ-0003, OQ-0004, OQ-0007, OQ-0009 | Earlier ambiguity was directly reproduced and explained. |
| Hard-blocked by entitlement, credentials, real device or independent environment | OQ-0006, OQ-0018, OQ-0020, OQ-0021, OQ-0025, OQ-0037, OQ-0039 | Paid unlimited Apps, actual export/import artifact, entitled non-public visibility, successful real BYOK/provider recovery, the advertised 2000-character Important-Facts limit, cross-device state and true touch/IME/safe-area/background behavior must remain `BLOCKED/DEVICE-BOUND`. No payment, real key or fabricated device evidence is permitted. |
| Normal UI cannot reach the hypothesized operation | OQ-0013, OQ-0032, OQ-0038 | Character Remix has no stable public detail/edit/delete route; intermediate-parent deletion and historical World-version navigation/share/Remix are not discoverable. Hidden routes are not guessed and stay `UNKNOWN / NOT DISCOVERABLE`. |
| Defect baseline is verified; root cause/generalization remains unknown | OQ-0023, OQ-0028 | The Social setup mode selector no-op is reproducible in the tested setup, while distinct phone/free shells and in-Simulation switching work. Parity must preserve the successful runtime contract and record the setup defect separately. |

### Remaining main-account candidates

Post-Manus selection has been completed. The list below is deliberately narrow; these are optional final probes rather than missing core lifecycles:

1. A true second Character Memory automatic batch/multi-card event or matched cross-model fixture (`OQ-0043`) would be architecturally useful, but another unrelated T35 progression is explicitly rejected because Manus already covers that lower-value boundary. Retain the merge/cadence policy as `UNKNOWN` unless a controlled trigger becomes available.
2. No-ID/duplicate-ID object arrays, explicit tombstones and type conflicts in App Initial JSON remain separately testable edges after EVD-0235. They do not justify repeating the already verified install/version/zero-Turn deep-three-way-migration lifecycle.
3. Simulation identity avatar serialization/native keyboard enforcement (`OQ-0045`) remains an edge. EVD-0249 already closes the form, exact emoji text entry, Save/lock and no-identity-World model-use path; another broad identity run is not selected.

The former Time candidate is removed: EVD-0250 directly tested clearly invalid free text and established its generic charged-Turn fallback. Valid grammar, custom `+`, bounds and locale/timezone formatting remain explicit parser edges rather than a missing Time architecture.

The former Important-Facts candidate is also closed: EVD-0251 verifies confirmation-free empty Save, `0/200`, reload persistence, absence of dedicated Undo and exact re-entry recovery. Only the paid 2000-character limit remains blocked.

Everything else is either already architecture-sufficient, blocked by a forbidden/unavailable prerequisite, not reachable in normal UI, or a ranking/cadence/backend-policy question that should remain explicitly `UNKNOWN`.

## Final audit decision

`COMPLETE`. The second/third-pass gap search, independent-agent reconciliation and post-merge experiment selection are finished. The remaining optional edge probes do not represent missing product systems; they remain preserved in `06_OPEN_QUESTIONS.md` and must not be converted into assumed behavior.
