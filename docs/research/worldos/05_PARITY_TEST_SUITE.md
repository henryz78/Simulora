# Product Experience Parity Test Suite

## 基线 E2E（WorldOS evidence-backed）

- `E2E-01` 新用户注册 → 找 World → 开始 Simulation → 10 Turn → 退出 → 恢复。
- `E2E-02` 创建 World → Character → Apps → Publish → Simulation。
- `E2E-03` 别人 World → Remix → 修改 → Publish。
- `E2E-04` Character Library → 添加 Character → World → Simulation。
- `E2E-05` App Market → 安装 → 配置 → Simulation → App 响应。
- `E2E-06` Map → 创建/使用 World → Simulation → 地图变化。
- `E2E-07` Simulation → 多 Turn → Rewind → 新时间线。
- `E2E-08` World 更新 → Version → 已有 Simulation 行为。

## 已定义的 Parity Tests

### P-001 Turn / Locking

Precondition: Simulation at Turn N with at least Story, Chat, Wallet and one App.
Steps on WorldOS: submit main action, Chat message, Map action and Shop purchase separately.
Expected WorldOS behavior: each action creates one global Turn; while generating, main input and App controls lock; completion yields Story plus only the relevant Event Delta.
Parity criteria: clone must preserve full-Turn semantics, lock scope and Delta boundaries.
Evidence: EVD-0030, EVD-0042, EVD-0043.

### P-002 World Draft/Publish/Version

Precondition: owner World v1.
Steps: edit field → observe auto-save/draft → publish v2 and v3 → reopen public detail.
Expected: previous published versions remain in log; new starts use latest; existing saves receive latest-version prompt.
Parity criteria: draft/published separation, version numbering, changelog and latest-target policy.
Evidence: EVD-0029, EVD-0031.

### P-003 World Remix

Steps: public World → 改编 → inspect new slug/v1/Creator fields/attribution.
Expected: independent copy, source attribution and copied configuration.
Evidence: EVD-0022.

### P-004 Character lifecycle

Steps: create → edit → refresh/detail → filter/search → inspect visibility wall.
Expected: async persistence, 3-tag cap, member-only private visibility.
Evidence: EVD-0021, OQ-0004 resolution.

### P-005 Character multi-level Remix

Steps: original → L1 Remix → L2 Remix → Mine.
Expected: independent copies, copied App configuration, no original mutation; attribution behavior must match observed missing attribution.
Evidence: EVD-0033.

### P-006 Cross-App Delta

Steps: Map patrol/custom action, Chat, Shop purchase; inspect Events/Story/Wallet/Inventory/Stats/Relations.
Expected: shared state propagation and per-action Delta.
Evidence: EVD-0030, EVD-0042, EVD-0043, EVD-0044.

### P-007 Rewind

Steps: Turn 10 checkpoint → rewind Turn 2 → continue new Turn 3.
Expected: timeline fork; Story/Chat/Wallet/Inventory/Memory/World State roll back; installed App configuration may remain; Credits are not refunded.
Evidence: EVD-0020.

### P-008 Version apply add/remove

Steps: v1 save → World v2 add App → apply update → World v3 remove App → apply update.
Expected: same Simulation retains progress while App runtime is added/removed.
Evidence: EVD-0031.

### P-009 App Creator

Steps: HTML edit → iframe preview → config JSON/instructions/events → save/publish → public version log.
Expected: iframe scripts work; App versions and runtime preview update.
Evidence: EVD-0023, EVD-0032.

### P-010 App install lifecycle

Steps: App detail install → World draft → publish → existing Simulation apply update → runtime → World uninstall/version → apply update.
Expected: draft-only until World publish; add/remove at version apply.
Evidence: EVD-0031.

### P-011 Map action

Steps: Map drawer → neighboring region → custom action/shortcut → Events.
Expected: region threat, movement, Story, Wallet, Inventory, Quest and relationships follow Delta.
Evidence: EVD-0030.

### P-012 Unified Search

Steps: query text; wait debounce; switch type tabs; test no-match.
Expected: `?q=` deep link, cross-object result sections, empty state.
Evidence: EVD-0035.

### P-013 Account/Credits/BYOK

Steps: inspect all five Account tabs; enumerate Profile/Preference controls; compare member-gated versus current promotion BYOK states; switch DeepSeek/GLM/OpenRouter/Custom; open/search/select from `更多模型` without entering a real key; create blank, name-only and minimal valid Persona/Style/Lore presets and reload; test lowercase/whitespace/exact `DELETE` enablement without clicking the destructive CTA; inspect pricing walls but do not pay.
Expected: current sample shows `自备 API 限免`, four provider schemas and a searchable async OpenRouter directory; no-key `使用` stays disabled. Blank and incomplete presets show inline `请填写必填项。`; Persona requires name + player name but permits empty description, Style/Lore require name + body; saved minimal records persist. Only exact uppercase unpadded `DELETE` enables account deletion.
Parity criteria: model entitlement/promotion must be explicit and temporal, provider fields/catalog/validation deterministic, presets private and type-validated, and the irreversible account gate exact. Never transmit a real credential or complete payment/account deletion during parity QA.
Evidence: EVD-0024, EVD-0039, EVD-0092, EVD-0208, EVD-0237.

### P-014 Responsive Creator and Simulation

Steps: set `360×844`; open Creator and inspect mobile header/bottom nav, side menu, full long form and Preview selector; compare desktop/mobile/setup Preview modes and internal dimensions. Open a persistent Simulation, inspect Settings and Character Chat, focus/fill/send one narrow-screen action, navigate away/back, then rotate to `844×360`; reset viewport afterward.
Expected WorldOS behavior: portrait pages have no page-level horizontal overflow; Settings becomes full viewport; Chat completes a normal charged Turn and survives route return; Creator Preview models 1280×800 desktop, 390×780 mobile and a separate setup form; landscape switches to a multi-panel runtime without losing Turn state.
Parity criteria: responsive shell, breakpoint switch and persistence match. Real touch/IME/safe-area/background behavior stays a separate device test, not inferred from desktop emulation.
Evidence: EVD-0040, EVD-0119, EVD-0226, EVD-0228.

### P-015 World-version initial JSON merge

Steps: establish a prior seed; mutate one nested leaf and an object array in an existing save; publish a new seed that conflicts with dirty leaves/IDs, updates clean siblings, adds fields, supplies explicit nulls and omits an old field; apply to the existing save and create a fresh save from the same version; inspect exact hydrated JSON before/after reload.
Expected WorldOS behavior: update application costs zero Turn/energy and preserves the UUID/Story/Turn. Dirty nested leaves survive, clean siblings update, new siblings appear; object-array entries with an existing stable `id` preserve runtime value, omitted existing IDs remain, and new IDs append. Clean fields adopt explicit null, dirty fields survive a conflicting null, omission alone does not delete, and runtime-only fields remain. The fresh save receives the new seed literally without migration residue.
Parity criteria: implement an explicit deep three-way merge against the previous seed, including path-level dirtiness, stable-ID object-array union and distinct null/omission semantics. Do not model update as shallow overwrite or Simulation restart. Keep no-ID/duplicate-ID arrays and deletion tombstones separately testable.
Evidence: EVD-0110, EVD-0155, EVD-0235.

### P-016 App reinstall and draft conflict

Steps: uninstall a World-local App, reinstall from App Market, immediately open configuration, then repeat after waiting for automatic save and reloading the Creator.
Expected WorldOS behavior: latest App definition hydrates; a race can show `草稿已在其他页面更新` and rollback an unstable install; after `草稿已自动保存`, reload preserves exactly one installed card.
Parity criteria: draft conflict state is visible, recoverable and does not silently publish or mutate existing Simulations.
Evidence: EVD-0107.

### P-017 Per-Simulation model tier and entitlement

Steps: open Simulation Settings → World Model; select official 10/Turn then 13/Turn tiers, execute one controlled action each, reload and execute another; attempt OpenRouter Free without BYOK entitlement.
Expected WorldOS behavior: selection itself costs no Turn; next action charges selected tier exactly; same Simulation retains selection across reload; gated OpenRouter action emits Freedom Pass error and does not switch.
Parity criteria: model selection is per-save, billing is linked to selected model tier, and entitlement errors are recoverable with an official fallback.
Evidence: EVD-0109.

### P-018 First App publication and public hot upgrade

Steps: create owner-only App v1 Draft → first Publish → check App Market/unified Search → install into a World → edit HTML/instruction/Initial JSON → click `存草稿` → reopen public detail and an existing Simulation.
Expected WorldOS behavior: first Publish has no confirmation modal and keeps v1; App Market may index before unified Search. A later `存草稿` can immediately create public v2 and hot-update existing runtime HTML without a World version or Simulation prompt, while retaining existing namespaced state.
Parity criteria: first-publication state, discovery lag, version numbering and definition/state separation match independently.
Evidence: EVD-0145–0147.

### P-019 Map faction roleization and Character alias migration

Steps: enable Map-App faction roleization only, then World-level roleization; inspect Preview with no binding; bind one faction to an ordinary World Character; save; compare Preview; publish; open public World; apply version to an old Simulation.
Expected WorldOS behavior: switches are independent. Both-on/no-binding exposes faction identities plus the ordinary Character. Binding `Demons → 测试角色 001` aliases/deduplicates to `👹 测试角色 001` plus the remaining faction. Public World and zero-Turn old-save migration reproduce the same inventory while preserving Turn/Time/Story.
Parity criteria: roleization flags, identity dedup and version migration must be deterministic and must not create duplicate conversational entities.
Evidence: EVD-0137, EVD-0148–0149.

### P-020 Current-version App seed into a second World Draft

Steps: install public App v2 into a second existing World; inspect second-stage Initial JSON; submit; reload target Creator; open the installed App configuration; compare public usage count before/after.
Expected WorldOS behavior: target gets a durable next-version Draft and exact primitive/nested/array v2 seed. Public usage count may not advance transactionally and must be treated as a separately indexed/eligible projection until its rule is resolved.
Parity criteria: installation seed is lossless and Draft-persistent; usage counters must expose a documented eligibility/indexing contract rather than silently contradict installation state.
Evidence: EVD-0150.

### P-021 Published Remix-permission enforcement

Precondition: public World v4 with Creator `改编权限=不允许`; owner detail still has an enabled Remix control.
Steps on WorldOS: open the same World URL as Guest and Account B; record direct detail, Remix control, click result, any error/login wall, existing child-World behavior, Search/Profile exposure and reload result.
Expected WorldOS behavior: owner exception remains usable. Guest main World detail omits Remix; Guest Collection-card Remix may silently no-op. Logged-in non-owner may see the create modal, but final `复制并自己改编` is rejected without URL change, request, error or child creation.
Parity criteria: permission is enforced consistently across direct detail, Remix action, existing descendants and discovery projections.
Evidence: EVD-0169, EVD-0176, EVD-0192.

### P-022 Link-visible Collection enforcement

Precondition: owner Collection `TEST Collection 001` reload-confirmed as `链接可见`.
Steps on WorldOS: open direct URL as owner, Guest and Account B; compare `/collections` directory, unified Search, Share, favorite/collection actions, item World access, and adding the item to another Collection.
Expected WorldOS behavior: Guest and Account B can direct-open and hard-reload the Collection, open both member Worlds and share the unchanged canonical URL. The Collection is absent from `/collections` discovery and Unified Search, and external viewers receive no Edit/Delete/Favorite/Save/management controls.
Parity criteria: access state, discovery omission and membership writes are consistent after reload and across identities.
Evidence: EVD-0175, EVD-0183, EVD-0191.

### P-023 Only-me Collection owner lifecycle

Precondition: authenticated owner creates `TEST Collection Only Me 001`, selects `仅自己`, adds one World and saves.
Steps on WorldOS: observe helper copy, Save enabled state, saving indicator, redirect URL, detail controls, edit reload, directory/Search and independent Guest/B direct access.
Expected WorldOS behavior: owner detail/edit/delete remain available at a stable slug and owner Profile includes the card; public Collection browse/Search omit it. Helper says only the owner can view/edit. External visibility must be measured separately and not inferred from owner state.
Parity criteria: owner-only state survives save/reload; external direct URL/discovery/management behavior is consistent with the selected visibility.
Evidence: EVD-0193, EVD-0195; external enforcement pending a separate viewer.

### P-024 Character Remix owner-library/index boundary

Precondition: a saved Character Remix clone exists in Mine → Works → Character.
Steps on WorldOS: compare an ordinary owned Character card with L1/L2/003 clone cards; open normal Edit and record URL/editor schema; open a clone Drawer, inspect URL/Chat/Remix/Add-to-World/Edit/Delete/More controls; exact-search the clone in the global Character Library and Unified Search `角色` tab in a later fresh navigation; reload Mine.
Expected WorldOS behavior: ordinary Edit expands a complete in-card editor without leaving `/sims`. Clone remains owner-Mine reachable and copy-forward works, but current UI exposes no stable href/Edit/Delete/More. In the tested clone, both public discovery surfaces remain empty while its independent Chat remains runnable. Any undocumented backend route remains UNKNOWN rather than being guessed.
Parity criteria: clone persistence, control visibility, source isolation and index convergence are separately represented.
Evidence: EVD-0181, EVD-0185, EVD-0194, EVD-0205, EVD-0215.

### P-025 App Creator malformed/array Initial JSON boundary

Precondition: authenticated owner and disposable App Creator slug.
Steps on WorldOS: enter valid top-level array JSON and save/reload; then replace it with malformed JSON, save/reload the slug route, and compare all non-JSON fields.
Expected WorldOS behavior: valid arrays persist as formatted JSON; malformed input does not block Draft save but normalizes to `{}` while preserving HTML/name/description/detail.
Parity criteria: editor validation/normalization is explicit and must not silently discard unrelated App metadata.
Evidence: EVD-0196.

### P-026 Character Chat save identity

Precondition: an owner Character Remix clone with a Chat entry.
Steps on WorldOS: open Chat from Mine, record the Simulation UUID and reload; inspect Mine → History → Character; rename the save; reload Mine and the Simulation.
Expected WorldOS behavior: Chat resolves to a stable UUID and persists; Character History exposes rename/delete; rename changes the save title/document title but leaves the Character label and Settings identity unchanged.
Parity criteria: Character identity and save identity are separate persisted entities with consistent History projection.
Evidence: EVD-0198.

### P-027 Character Chat share-route defect baseline

Precondition: one ordinary Character Chat and one Character Remix Chat.
Steps on WorldOS: Settings → Share; record X-intent/copy-link target; open the exact target as owner; inspect poster state.
Expected WorldOS behavior in the observed build: both samples generate `/worlds/char:<uuid>` links, but owner direct navigation returns generic 404; the tested Remix composer also reports poster generation failure.
Parity criteria: decide explicitly whether to reproduce the defect for strict parity or repair it while retaining equivalent Character sharing. Do not treat the generated URL as a verified public detail route.
Evidence: EVD-0199.

### P-028 App Preview runtime-error recovery

Precondition: disposable owner-only App Draft.
Steps on WorldOS: enter HTML with visible content before/after a throwing script; render Preview; save and reload; replace with valid HTML; save/reload again.
Expected WorldOS behavior: surrounding HTML remains visible, the exception is console-only, save/reload preserves it without a user warning, and ordinary edit/save repairs the same Draft.
Parity criteria: decide whether strict parity keeps console-only failures or adds a visible creator error while preserving editable recovery and Draft integrity.
Evidence: EVD-0202.

### P-029 Free World App-count enforcement

Precondition: free account and clean new World with six default Apps.
Steps on WorldOS: install Apps 7, 8, 9 and 10 through full configuration; attempt final install of App 11; compare installed-card count and entitlement copy.
Expected WorldOS behavior: Apps through 10 install; App 11 is rejected and count stays 10. The current wall contradicts itself by saying `超过 10` in the heading and `免费版最多 8 个` in plan benefits.
Parity criteria: enforce the observed boundary of 10 unless product policy intentionally changes, and avoid reproducing the contradictory entitlement copy.
Evidence: EVD-0203.

### P-030 Dynamic App billing across Rewind

Precondition: an existing Simulation at Turn N with no extra App and a known official-model base price.
Steps on WorldOS: install one dynamic App between Turns; verify all model prices increase by 2; execute one charged Turn and record energy; restore to the pre-install Turn; compare immediate Dock/Installed-list state with model prices; execute another Turn; reload.
Expected WorldOS behavior: the active App charges +2 before restore. Rewind does not refund that Turn, but removes the post-snapshot installation and surcharge. The current client may temporarily retain the App Dock and even label the row `世界自带`; the model price and next charge already use the base value, and reload removes the ghost Dock.
Parity criteria: authoritative install/billing state must be snapshot-consistent. For strict observed parity, model billing must never follow stale Dock UI; a deliberate product improvement should invalidate the Dock immediately rather than reproduce the ghost state.
Evidence: EVD-0204.

### P-031 Collection member removal commit

Precondition: owner Collection with at least two Worlds and a stable detail/edit URL.
Steps on WorldOS: open edit; identify the drag and trash controls; remove one World; inspect the unsaved count/candidate list; save; inspect redirect/toast/notifications; reload detail; reopen and reload edit.
Expected WorldOS behavior: trash removal has no per-item confirmation and affects only the current editor until Save. The count decreases immediately and the removed World returns as an add candidate. Save shows `正在保存…`, redirects to the canonical detail URL, and the lower membership/count survives detail and edit reload. The tested action did not add a notification.
Parity criteria: membership mutation must use the same explicit commit boundary as add/reorder, avoid deleting the underlying World and preserve a clear path to re-add it.
Evidence: EVD-0206.

### P-032 Historical World version discoverability

Precondition: a published World with at least four visible version-log entries.
Steps on WorldOS: load detail; inventory links/buttons inside `版本记录`; trigger `展开全部`; inspect newly exposed old versions and URL; trigger `收起`; open page Share and inspect its target.
Expected WorldOS behavior: default history shows the latest three entries; expand reveals older v1 and becomes `收起`. Version entries remain static text with no version-specific link, selector, menu, Share or Remix. The page URL does not change and Share targets the current canonical World URL without a version identifier.
Parity criteria: implement a readable append-only changelog and its expand/collapse state. Do not imply that historical snapshots are navigable unless intentionally adding a documented product improvement.
Evidence: EVD-0188, EVD-0207.

### P-033 BYOK invalid-key recovery

Precondition: authenticated account with a visible provider credential form; use a synthetic non-secret key.
Steps on WorldOS: select DeepSeek, GLM, OpenRouter and custom gateway panels; inspect labels/placeholders; enter an invalid test key; reveal/hide it; submit; reload; inspect saved models.
Expected WorldOS behavior: invalid submission returns `key 无效，请检查后重试。`; reveal/hide changes masking; reload clears the failed key/error, disables submission and creates no model. DeepSeek and GLM currently mislabel the field `OpenRouter API key` despite provider-specific content.
Parity criteria: failures must not persist credentials or pollute model inventory; decide whether to reproduce or repair the provider-label defect.
Evidence: EVD-0208.

### P-034 Creator gift settlement and failure gates

Precondition: sender has at least 100 energy; two public creator Profiles, one public World and official/community App gift surfaces.
Steps on WorldOS: submit a 100-energy Profile gift; record sender balance, toast, recipient income and donor leaderboard after reload; attempt official/community App gifts and a second/lower-tier gift to the same recipient; after quota/session change, submit a 20-energy gift to a different Profile and a 20-energy World gift. For every failure, capture the immediate and delayed sender balance plus App/World/Profile supporter projections.
Expected WorldOS behavior: tested Profile and World gifts debit face value, credit visible creator income by exactly 70% (`+70`, `+14`) and add linked donor rows. Tested official/community Apps return `礼物发送失败，请稍后重试。`; one community-App sequence showed an unexplained delayed `-5` with no recipient record while a second App failure had no observable net debit. The tested same-recipient repeat opens `购买电量` without debit even when displayed balance covers the lower tier; gifting different creators/World later succeeds.
Parity criteria: wallet debit, content-recipient settlement, creator ledger/donor projections and recipient/App-specific failure states must be modeled separately and transactionally. Do not collapse the observed repeat gate into ordinary insufficient balance or a global one-gift ban; treat the failed-App `-5` as a defect baseline until reproduced and explained.
Evidence: EVD-0163, EVD-0210, EVD-0227, EVD-0229, EVD-0230.

### P-035 Consecutive paid save-slot expansion

Precondition: a World whose current Simulation slots are full and at least 160 test energy.
Steps on WorldOS: record capacity/purchased count and balance; click `增加存档位 · 80`; record redirect/new UUID; fill the new capacity and repeat once.
Expected WorldOS behavior: each action deducts exactly 80, increments capacity and purchased count by one, and immediately creates a distinct Simulation without a second Start action.
Parity criteria: capacity, billing and Simulation creation commit atomically and remain scoped to the World.
Evidence: EVD-0211.

### P-036 Positive-but-underfunded Turn versus exhausted-balance block

Precondition: select a model priced above the current positive balance; preserve enough test quota to restore the account afterward.
Steps on WorldOS: submit at balance 1 with an 8/Turn model; wait for completion and reload; attempt another action at the resulting negative balance; dismiss/reload; add test quota and reopen the same UUID.
Expected WorldOS behavior in the observed build: the first Turn fully commits and persists a negative balance. The next attempt creates no Turn and opens `电量用完了`; its action is absent after recovery. Added quota restores normal access without rolling back the committed Turn.
Parity criteria: treat this as a defect baseline. A deliberate fix may reject before generation, but must preserve atomic Turn/charge semantics and an explicit recovery route.
Evidence: EVD-0212.

### P-037 Profile avatar file boundary

Precondition: authenticated disposable/test Profile and a benign valid image plus invalid type/oversize fixtures.
Steps on WorldOS: inspect the hidden file input and visible CTAs; select benign valid SVG, PNG and JPEG fixtures in sequence; record modal/toast/explicit-save state, resource URL/extension, reload and public Profile after each; replace with a second valid image; then select a benign invalid `.txt`, reload Account/Profile and finally recover with a valid image.
Expected WorldOS behavior in the observed build: chooser is single-file with `accept=image/*`. SVG/PNG/JPEG auto-save immediately with no crop/preview/Save/toast; the public per-user object uses the current format's `.svg`/`.png`/`.jpg` extension and a new `v` query on replacement; Account/Profile reload retain it. Invalid `.txt` produces no error but silently removes the current image and publicly falls back to the generic avatar. A later valid upload restores it.
Parity criteria: preserve immediate auto-save/public propagation and cache invalidation. Treat invalid-file clearing as a defect baseline; a safer implementation should reject and preserve the prior avatar while emitting explicit validation feedback.
Evidence: EVD-0209, EVD-0217, EVD-0222, EVD-0224; upper-size/network/reset and binary animation/EXIF normalization remain pending.

### P-038 Long Character Chat recall, persistence and branch isolation

Precondition: a stable Character Chat at opening Turn 1 and a 4/Turn model.
Steps on WorldOS: introduce a unique secret at T2; run eight unrelated Turns; inspect Memory at multiple boundaries; ask for recall at T11; continue to T20 with longer responses; reload; create a named current-state checkpoint; continue only the checkpoint and compare the source; inspect a historical Turn's controls.
Expected WorldOS behavior: the secret is recalled exactly at T11 and again in the checkpoint at T21 even though visible Memory remains empty through T20. Every generated Turn charges 4. Reload preserves the long transcript. The checkpoint has its own UUID and diverges without changing source T20. Historical Character state is read-only but exposes no World-style Restore/Historical-fork/Back-to-now controls; selecting latest Turn exits.
Parity criteria: separate transcript/context recall from visible Memory summaries; make checkpoint identity independent; do not assume Character Chat inherits the full World Rewind capability.
Evidence: EVD-0213.

### P-039 Editable World Memory persistence and AI injection

Precondition: a World Simulation with at least one visible automatic Memory summary and enough energy for one Turn.
Steps on WorldOS: record the original Memory/count; edit it to contain a unique secret whose value will not appear in the later question; save; reload; ask the World AI to return only that remembered value; record Turn, energy and response; reload again.
Expected WorldOS behavior: the replacement appears immediately and survives reload. The next charged Turn can return the exact secret from the edited Memory, and both the Memory and generated response survive the final reload.
Parity criteria: treat editable Memory as durable AI context, not cosmetic transcript metadata. Persist edits before generation and inject the committed value into subsequent World Turns without requiring a new checkpoint.
Evidence: EVD-0214.

### P-040 Non-empty Collection final deletion and non-cascade

Precondition: disposable owner Collection with exactly one known World member and a stable detail/edit URL.
Steps on WorldOS: record Collection detail, owner Profile projection and member World's reverse-Collection section; trigger delete and cancel once; reload to prove preservation; trigger again and accept; inspect post-action redirect, detail/edit URLs, exact Collection search, Profile and the member World/version/save.
Expected WorldOS behavior: cancel preserves the Collection. Final acceptance redirects away; detail and edit become generic 404, exact browse search returns zero, Profile and World reverse projections omit the Collection. The member World, its versions and saves remain intact and runnable.
Parity criteria: delete the Collection object and membership edges atomically without cascading into referenced Worlds or Simulations; offer an explicit irreversible confirmation and no false recovery affordance.
Evidence: EVD-0182, EVD-0184, EVD-0216.

### P-041 App direct/Market/Unified-Search projection split

Precondition: a creator App that has been published, downlisted because dependent Worlds exist, then republished without a new version; retain at least one official App as a search control.
Steps on WorldOS: inventory the current Market category controls and first-batch card count; scroll All until card count and document height remain stable at bottom; switch Community→Social and confirm only one peer remains active, then independently scroll Community to its terminal; search the owner App under a nonmatching category and then All by exact visible title and exact slug; verify URL state; search Unified Search's explicit App tab by the same title; run an official-App control query; compare with Guest/non-owner direct and discovery observations.
Expected WorldOS behavior in the observed sample: the current Market exposes 18 single-select categories and 24 first-batch cards. Scrolling silently appends 24-card pages: All terminates at 341 and Community at 291, both with a final partial page and no explicit end label. Switching category resets scroll/result pagination to its own 24-card first page. Query and category intersect but remain client-local at `/apps`. The republished v2 detail remains live with four dependent Worlds. Owner Market finds the card by visible title under All but not under a nonmatching category and never by slug. Owner Unified Search returns no match for the same title, while an official control App is returned. Guest/non-owner direct access can work while their Market and Unified Search still omit the App.
Parity criteria: model direct resolvability, dedicated catalog inclusion and global-search inclusion as separate projections. Search-by-title and search-by-slug need not be equivalent. Preserve explicit empty states and do not infer object deletion from discovery omission alone.
Evidence: EVD-0145, EVD-0179, EVD-0186–0187, EVD-0190, EVD-0218, EVD-0238–0239.

### P-042 Permanent Simulation deletion versus recoverable dependency failure

Precondition: one disposable resolvable Simulation and one control save whose App dependency can be removed then repaired by a later World version.
Steps on WorldOS: permanently delete the disposable save through the product modal; inspect the source World save list/Continue target, Mine History, global sidebar History and former direct UUID after refresh and again later. Compare with the dependency-broken control before and after publishing a clean World version.
Expected WorldOS behavior: true deletion removes the record from every observed owner index, retargets Continue, and leaves a bare 404 with no product recovery controls. Dependency failure can produce the same direct 404 while retaining indexed links; publishing a dependency-clean World restores the same UUID.
Parity criteria: distinguish resource deletion from temporarily unresolvable dependencies. List retention is meaningful state, not merely stale UI; true delete must clean owner projections without cascading to other saves.
Evidence: EVD-0111–0113, EVD-0126, EVD-0129, EVD-0219.

### P-043 Competitor/intention landing-page composition

Precondition: open a non-navigation acquisition route linked from a World-detail recommendation section.
Steps on WorldOS: inspect page title/global shell, hero, comparison table, curated card count and card controls; trigger the first CTA; inspect FAQ interaction roles; inspect browse-all and bottom CTA destinations.
Expected WorldOS behavior: `/zh-cn/pax-historia` stays inside the normal shell, presents a three-row comparison and five static FAQs, reuses standard Remix/Start World cards in a 22-card curated feed, updates the first CTA to `#worlds`, and routes the later CTAs to `/zh-cn/worlds`.
Parity criteria: acquisition pages should compose existing World-card functionality and canonical routes rather than invent a separate gameplay surface; competitor claims remain content, not behavioral guarantees.
Evidence: EVD-0220.

### P-044 Published World deletion with a dependent Simulation

Precondition: a disposable published World that appears in exact Search/Mine/Profile and has one named, resolvable Turn-1 Simulation with a known UUID.
Steps on WorldOS: record the World detail/save/Continue projections, child runtime and account energy; cancel the native World-delete confirmation once; accept it on the final run; inspect the redirect, World detail/edit/new routes, child UUID, exact World Search, Mine Works, owner Profile and Mine History; then rename the surviving History row and reload.
Expected WorldOS behavior in the observed build: final acceptance redirects to `/worlds`; World detail/edit/new and child runtime all become generic 404; Search, Mine Works and Profile omit the World; energy is unchanged. Mine History nevertheless retains the child row with its dead UUID and ordinary Rename/Delete controls. Renaming succeeds, may render stale until later refresh, and persists across reload without restoring the runtime.
Parity criteria: model authoritative World/runtime deletion separately from denormalized history metadata. Preserve the observed projection split as a defect baseline or deliberately clean it atomically, but never expose a history row as a runnable save when its UUID is tombstoned. Explicit Simulation deletion remains a separate cleanup path (P-042).
Evidence: EVD-0221.

### P-045 Manual cleanup of a History row orphaned by parent World deletion

Precondition: a published World deletion has left a Mine History row whose child Simulation UUID is already 404, as in P-044.

Steps on WorldOS: open the orphan row's `更多` menu, choose `删除`, observe the in-page permanent-delete confirmation, accept it, inspect Mine History/global History, reload `/sims`, and revisit the former child UUID.

Expected observed behavior: the in-page confirmation is distinct from the earlier browser-native World-delete confirm; acceptance removes the orphan History metadata row immediately, shows no product Undo/Restore affordance, persists after reload, and leaves the former child UUID as a bare 404.

Parity criteria: provide an explicit cleanup state for denormalized save-history metadata. Do not restore or silently recreate a deleted runtime; make confirmation modality and post-delete recovery behavior explicit.

Evidence: EVD-0223.

### P-046 World Preview versus World-local Character Chat

Precondition: public World detail with an existing owner Simulation and an installed Chat App; enough test energy for two Turns.

Steps on WorldOS: open World detail `预览` and inspect whether it navigates or mutates state; open the existing Simulation, submit one main-input action, open the Chat App, select a character thread, fill the separate message composer and submit; compare Turn, Story, Chat transcript, energy and save identity.

Expected WorldOS behavior in the observed sample: detail Preview expands an in-page read-only panel with opening/related content and no composer or Turn. Main input commits one World Turn; World-local Character Chat then commits another Turn in the same Simulation, appends contextual character output and consumes additional energy. The Chat interaction requires a separate explicit Send after filling the textbox.

Parity criteria: preserve the distinction between non-mutating public preview and charged runtime surfaces; route both runtime actions through the same save/Turn boundary while keeping the Chat composer and transcript semantics distinct.

Evidence: EVD-0226.

### P-047 World non-public entitlement boundary

Precondition: authenticated free owner with an editable public World; do not purchase membership.

Steps on WorldOS: record the selected visibility; click `不公开列出 会员`, inspect/cancel the resulting dialog; repeat with `私有 会员`; re-inspect selected visibility and Draft state.

Expected WorldOS behavior: both enabled-looking controls open the same in-page dialog `把世界设为非公开是会员功能`, exposing the pricing tabs/plans and copy that membership can make Worlds/Characters non-public. Cancelling returns to Creator with Public still selected; the gated click does not visibly mutate visibility.

Parity criteria: visibility choices and entitlement checks must be explicit and occur before persistence/publication. External enforcement for an actually entitled Unlisted/Private World is a separate test and must remain UNKNOWN until a legal entitled sample exists.

Evidence: EVD-0160, EVD-0231.

### P-048 Character visible-Memory generation, edit injection and branch isolation

Precondition: a Character Chat that is Memory-empty through at least Turn 20, an existing current-state checkpoint from T20, a 4/Turn model and enough energy for six Turns.

Steps on WorldOS: inspect source Memory at T21; continue with unrelated topics to T25 and inspect after each chosen boundary; compare summary coverage with the latest transcript; reload; append a unique conflicting fact that exists only in Memory; save/reload; ask the next Turn for the latest fact without revealing its value; reload again; open the older checkpoint and inspect its Memory.

Expected WorldOS behavior in the observed sample: Memory is still empty at T21 but one editable automatic summary exists by T25. It summarizes through T23 while omitting T24/T25. The appended conflict persists and controls the T26 answer over the older transcript fact; six Turns debit `24` at `4/Turn`. The T20 checkpoint/branch remains Memory-empty after source generation/edit. Five additional source Turns through T31 leave one unchanged entry, do not merge new topics, debit another `20`, and still recall the edited value after reload.

External generalization boundary: independent Manus samples report A empty through T20 and B empty at T15/one summary by T20; B's manual card remains visibly reported through T35 under `Civilization 1` 8/Turn. These are different Character/model/transcript samples, not the expected result for the 4/Turn main fixture. The Manus T29 recall reply is report-only because its cited screenshot does not show the exchange.

Parity criteria: distinguish pre-summary context recall from visible Memory, model automatic summaries as batched/tail-lagged durable objects, inject committed edits into later AI context and scope Memory to the Simulation/checkpoint branch. Do not assume a universal T20/T25 threshold or silently overwrite manual edits without an explicit merge policy. Cross-model precedence requires a matched fixture rather than comparing unrelated Characters.

Evidence: EVD-0213, EVD-0232–0233; MANUS-P3-MEM-001–004 (external, quality-bounded).

### P-049 Important Facts explicit commit and free-length boundary

Precondition: an owner-controlled Simulation with a non-empty committed Important Fact and no pending Turn generation.

Steps on WorldOS: open Settings → Important Facts; replace the text without saving and close/reopen Settings; enter more than 200 free-tier characters and inspect retained length/counter; enter a different non-empty marker, Save, reload and inspect; clear the field through normal keyboard input, Save and reload; then restore the original value, Save and reload again.

Expected WorldOS behavior: closing the parent Settings dialog discards the unsaved draft even though the panel has no separate Cancel button. The free textarea truncates input at 200 characters. Saving changes the CTA to `已保存`; replacements survive direct reload. Empty content is valid: Save commits a confirmation-free `0/200` clear with no dedicated Undo, and ordinary re-entry restores content. None of these metadata commits consumes a Turn or energy.

Parity criteria: model Important Facts as explicit-commit per-Simulation metadata with a visible saved acknowledgement, deterministic free-tier limit, discard-on-close behavior and confirmation-free empty clear. Do not include it in Turn rewind snapshots. A product improvement may add confirmation/Undo, but strict parity must recognize empty content as a committed value rather than validation failure.

Evidence: EVD-0143–0144, EVD-0234, EVD-0251.

### P-050 One-time player identity and Persona-preset transfer

Precondition: an authenticated account with a saved Persona preset and a fresh World Simulation where `设定我的身份 仅一次` is still visible.

Steps on WorldOS: open the identity form and inventory fields/buttons/limits; enumerate the preset picker and avatar categories. Select minimal/full Persona presets, compare copied values, enter manual values before and after preset selection, and test the avatar both through a visible Emoji button and exact `🙂 / https://…` text entry. Cancel once and verify the Settings entry remains; reopen/reselect/Save; compare Turn/energy, toast, control visibility and visible Memory before/after reload. Inspect an App that exposes `playerSetup`; submit charged Main Input and Character Chat prompts asking for the identity without repeating it. Repeat once in a World whose `/new` setup also defines identity. Create a checkpoint after identity commit and compare the identity/lock. Then enter an earlier historical Turn, inspect runtime identity, accept native-confirm Restore, and compare current state immediately and after reload.

Expected observed behavior: name is required with declared max 40; persona is optional with declared max 600. Native keyboard enforcement is still an edge test rather than assumed from the attributes. The picker offers Account Persona records only, not Style/Lore. Preset selection copies exact stored fields and overwrites current manual draft; later manual edits win visibly. Avatar opens URL/upload plus My Characters/Emoji/avatar/flag/wallpaper/scene libraries, and exact `🧙‍♂️` text + Enter renders that same symbol on the form. Cancel does not consume the action. Save is zero-cost, toasts `已保存，世界会记住你的身份。`, removes the control across reload and can create exact runtime `playerSetup` while visible Memory stays empty. In a diagnostic Map World with no `/new` identity fields, the next Main Input Turn uses the manual identity verbatim. In a World initialized with `身份=Alice`, later manual values can be ignored by Main Input/Chat and Chat returns Alice; preserve this as a conflict baseline rather than assuming one universal precedence. Checkpoint/historical/Rewind behavior remains outside the Turn snapshot as in EVD-0236.

Parity criteria: represent player identity as durable per-Simulation context distinct from visible Memory and Turn events; make commit irreversible through normal Settings, keep Persona/manual/avatar copy semantics deterministic, and explicitly define checkpoint/Rewind plus World-setup-variable conflict precedence. Do not offer Style/Lore in a Persona-only picker unless intentionally extending the reference. Preserve the tested `/new` preset no-op and `Alice` precedence sample as defect/conflict baselines until the intended setup contract is verified.

Evidence: EVD-0092, EVD-0098, EVD-0236, EVD-0249.

### P-051 Worlds directory discovery modes and section-local ranking

Precondition: authenticated account with at least one followed creator and ordinary access to `/zh-cn/worlds`.

Steps on WorldOS: exercise featured Previous/Next/direct dots and wrap; switch Recommendation/Hot/Daily/Following and scroll each to terminal; in Recommendation bring every genre row into view instead of jumping past Intersection-driven loaders, count cards/unique URLs and switch one row Trend→Latest→Hot→Trend; select one genre, then audience and App filters; trigger one explicit empty result and deselect; enumerate and switch the global sort/time menus; select Random twice and after leaving/re-entering; compare URL throughout.

Expected observed behavior: the six-position carousel wraps without navigation. Recommendation is 35 independently lazy-loaded genre rows with local Trend/Hot/Latest, plus personalized/fixed rows; a fully materialized owner sample contained 451 World cards plus five featured World links, 456 links/278 unique URLs. Hot pages 24→47 and ends with `没有更多啦`; Daily has 24 and current Following has four. Selecting genre clears the top mode and reveals audience, four-App multi-select, nine sort and four time facets. Map+Following can render `没有结果`; deselection restores content. Filter state never enters the URL. Random hides time range and was deterministic within the tested session.

Parity criteria: implement the three observable directory architectures separately—row-based Recommendation, top-mode lists, and faceted result list. Lazy sections must not be treated as true empty states merely because they were skipped before hydration. Preserve row-local ranking, finite/end-copy differences, filter intersection, carousel wrapping and client-local state; personalization/ranking algorithms may remain implementation-defined until stronger evidence exists.

Evidence: EVD-0001, EVD-0035, EVD-0240.

### P-052 Collections directory query, ownership and visibility composition

Precondition: authenticated owner with one Public, one Link-visible and one Only-me Collection; at least one object has a unique description term, tag and creator identity.

Steps on WorldOS: open `/collections`; enumerate directory controls and cards; scroll repeatedly to the terminal; switch Popular/Latest and All/My Collections; search independently by title, description, tag and creator; combine search + Mine + Latest; reload the combined URL; enter a no-match query; use Clear; inspect whether cards contain nested controls or visibility badges.

Expected observed behavior: the current public baseline renders 56 entire-card links in one finite pass. Repeated bottom gestures do not append cards or show loader/end copy. Sort has exactly Popular/Latest and author has All/My Collections. Search covers title/description/tag/creator; `q`, `author=mine` and `sort=recent` compose in the URL and survive reload. Mine exposes the owner's Public, Link-visible and Only-me samples together, while All omits the two non-discoverable samples. A no-match query renders `0 个合集`, `没有找到合集`, helper copy and Clear. Clear restores `/collections`, Popular/All and 56 cards. Directory cards expose no nested favorite/menu control and no visibility badge.

Parity criteria: model Collection discovery as a URL-addressable finite query surface distinct from Unified Search. Preserve the discovery/visibility projection split and explicit empty/reset states; do not infer visibility from card appearance in the Mine scope. Keep popularity formula, index convergence and the second numeric display semantics implementation-defined until stronger evidence exists.

Evidence: EVD-0117, EVD-0191, EVD-0195, EVD-0241.

### P-053 Community fixed rankings, World rows and contact CTAs

Precondition: any account that can access `/community`; use a viewport narrow enough to require horizontal row gestures for the responsive branch.

Steps on WorldOS: inventory the top contact/social/Create controls; open and close QQ QR, trigger group-number and WeChat copy, open/Cancel Create World; click every one of the nine ranking tabs and count rows, links and unit labels; choose a nondefault tab then reload; scroll the page until all World ranking sections hydrate; count cards/actions per section and page total; horizontally scroll the first row to terminal and back.

Expected observed behavior: QQ shows a QR modal, copyable `970158335` and visible copy acknowledgement; WeChat copy has no visible feedback; Create uses the standard `创建新世界` modal. The first eight ranking tabs each show 20 unique Profile links; the current WorldOS Supporters tab shows one Profile with `10 美元`. Other units are 回合/个世界/次模拟/收藏/电量. Tab switching keeps `/community`; reload resets to `玩家 · 模拟回合`. Five World sections (Most Simulated/Turns/Favorited/Tipped/Remixed) each hydrate 12 unique cards, every card exposes Remix and Start, and total stays 60 at page bottom without loader/end copy. Narrow rows scroll horizontally; the forward control disappears at terminal and both directions return after backing up.

Parity criteria: treat Community as a finite metric dashboard and contact hub, not a feed. Reuse normal Profile/World navigation and World quick actions; preserve unit distinctions and responsive horizontal terminal behavior. Ranking algorithms/update cadence may remain implementation-defined until stronger evidence exists.

Evidence: EVD-0038, EVD-0100, EVD-0242.

### P-054 Mine finite projections, reload reset and App favorite cache

Precondition: authenticated account with multiple World/Character saves, created World/Character/Collection/App objects, at least one favorite Character and one reversible public App favorite target.

Steps on WorldOS: enumerate History World/Character and Works World/Character/Collection/App; for each applicable type switch Created/Favorited, count cards and inspect create/quality/actions; scroll the largest History and Works lists to terminal; open/close one History More menu and one owned-App Drawer; select a nondefault nested state and reload. From App Created, favorite an unfavorited App, immediately switch to App Favorited, reload/re-enter, then unfavorite from that list and repeat the immediate/reload comparison; restore baseline.

Expected observed behavior in the current account: History is finite World19/Character4; Works is World created5/favorited0, Character created18/favorited1, Collection3, App created3/favorited0. Lists are already fully rendered, stay constant at bottom and expose no loader/end text. History More contains Rename/Delete. App Drawer exposes Close, creator, Install, Detail, owner Edit/Delete, favorite, rating and comment. All tabs keep `/sims`; reload returns to History→World. App favorite count changes immediately and persists, but the already-selected Favorited projection is stale until reload in both add and remove directions; after reload it converges. Final baseline is unfavorited/empty.

Parity criteria: model Mine as a set of finite denormalized projections rather than a single authoritative object table. Preserve type-specific actions and reload reset. Either reproduce the current favorite cache lag as a defect baseline or invalidate the projection immediately, but do not lose durable membership or misreport the post-reload state.

Evidence: EVD-0069, EVD-0099, EVD-0219, EVD-0221, EVD-0223, EVD-0243.

### P-055 Maps catalog, preview and Map-to-World version boundary

Precondition: authenticated owner with at least one World without a Map, one with a Map, and permission to create a disposable World.

Steps on WorldOS: open `/maps`; enumerate Base-map/All/My, search and every genre; count first batch and silently scroll Base-map to a stable terminal using at least three consecutive no-growth bottom checks; preserve account/time and treat the total as a snapshot. Switch scopes/genre, search by title, creator and no-match, then reload. When validating Base versus All, compare terminal canonical World href sets rather than titles. Open one image preview; click `+` twice, `-` twice, drag, and Close. Open `用此地图`; inspect new/existing World rows and badges. Select an existing no-Map World, switch All/Base/Regions, Cancel, then repeat All and commit; verify URL/toast and inspect the target Creator. Finally create a uniquely named World from the same Map; compare the immediate public detail/version/apps with its Creator Draft before publishing the next version.

Expected observed behavior: Base-map begins at 16 and appends silent 16-card pages without loader/end copy. Do not require one fixed total: the main snapshot terminated at 1,083 while an external terminal HTML snapshot contained 1,085. In that external snapshot All contained 1,181 unique World hrefs and was a 96-href strict superset of Base. Search matches title/creator and combines with scope/genre; no-match is `暂无地图`; reload resets to Base-map/All and clears search. Preview zoom and drag visibly change the map. Existing-World import offers All/Base/Regions, Cancel is non-mutating, and commit writes one Map App to the unpublished Draft with a publish-required toast; the current build remains on `/maps` despite `装入并编辑`. New-World commit creates a public v1 containing only Main Input/Story while the selected Map exists in an unpublished v2 Draft; attempting v2 without an uploaded cover is rejected with `封面图为必填项。`.

Parity criteria: treat Map discovery as a World-backed silent catalog and Map reuse as a versioned World mutation. Preserve the scope/search/genre reset model, explicit empty state and functional preview gestures. Treat terminal counts as time/account snapshots while preserving Base/All membership semantics. Preserve or consciously fix the misleading no-navigation success behavior, but never claim the Map is public before its World v2 publication boundary.

Evidence: EVD-0011, EVD-0028, EVD-0090, EVD-0125, EVD-0244; MANUS-P3-MAP-001–002 (external structured evidence).

### P-056 Notification read commit, pagination and link behavior

Precondition: authenticated account with a nonzero unread badge and a history containing social, product/system and reward notifications.

Steps on WorldOS: record the unread badge; open Notifications and immediately recheck the badge; inventory exposed actions and event types; scroll the modal until the load helper disappears and perform three additional gestures; count rows per load; close and reload the underlying page; reopen and click one real object deep link and one literal-`#` broadcast.

Expected observed behavior in the current sample: opening changes badge 7→none without an explicit Mark Read action and the cleared state survives reload. Rows load 10→20→24, then `下滑加载更多` disappears with no end label while all records remain. The current ledger contains announcements, +150 referral settlements, rank, Remix, comment, Follow and Favorite. Actor links lead to Profile; object links can lead to App, Rewards, World or child World. A real App announcement navigates to its App detail; a `#` broadcast only closes the modal and keeps the current route. No delete/archive/filter/settings control is exposed.

Parity criteria: represent unread state separately from retained history and commit read-on-open. Preserve typed destination routing, silent terminal behavior and linkless broadcast behavior. Retention maximum, delivery SLA and cross-device sync may remain policy-defined until stronger evidence exists.

Evidence: EVD-0038, EVD-0118, EVD-0158, EVD-0245.

### P-057 Achievement configuration, hidden reveal, cross-save ownership and Rewind

Precondition: authenticated owner; a publishable World with the official Achievement App; two free Simulation slots; enough energy for one trigger Turn and one fresh opening Turn.

Steps on WorldOS: inspect `/apps/achievements` and its Online Preview. Install/configure one visible Copper and one hidden Gold achievement with the same unique AI-only trigger. Save the World Draft, publish the next World version and apply it to an older Simulation. Record pre-unlock Simulation/World-detail projections, submit the exact trigger as a real Turn, inspect Events and the open Achievement panel before/after reload, then inspect the World modal. Start a second Simulation of the same World without sending the trigger. Finally open historical state before the granting Turn, record the historical panel, restore that Turn through the native confirmation, and compare current Simulation, Events, World detail, balance and the second save.

Expected observed behavior in the current sample: installation is Draft/version gated; applying a World update is zero Turn/energy. Before unlock, runtime and World detail show the visible item plus only a hidden-count placeholder. The trigger Turn emits one `打开成就` Event per grant and consumes the normal World Turn price, but the open Dock can remain stale until reload. After reload both items are `已解锁`, the hidden name/Gold/description become visible and World detail shows `2/2 · 100%` with unlock date. A fresh independent save starts at `2/2`. Historical viewing of the pre-grant Turn shows `0/2`; real Restore truncates the granting action/Story/Events yet current/fresh/World projections remain `2/2` and energy is not refunded.

Parity criteria: model achievement definitions separately from per-player World unlock records. Treat unlock as Account×World monotonic state outside the rewindable Simulation event snapshot, while allowing historical views to render snapshot-era progress. Preserve hidden-before/revealed-after metadata rules, ordinary Turn billing, World-version installation and observable projection refresh behavior. Do not merge this ordinary configured-achievement ledger with Profile's separate scored World-completion showcase without further evidence.

Evidence: EVD-0246, EVD-0247.

### P-058 Achievement definition removal, App reinstall and version tombstones

Precondition: authenticated owner; one World whose two achievement definitions are already unlocked; one old Simulation on that schema; enough energy for one grant Turn, one extra save slot and one fresh opening.

Steps on WorldOS: delete one unlocked definition, save/reload its App config, publish and compare World detail, an updated old save and a native fresh save. Publish a version with the Achievement App uninstalled and compare an updated save with a save that declines the update. Reinstall the App and verify whether configuration returns; publish the blank instance and compare detail/runtime. Add a new definition with the old name/description/condition, publish, trigger it, then rename that current row and change to a unique token in another version. Apply each version to the old save, inspect counts before/after reload and Events, trigger the unique token, and finally create a native save on the latest version. Record every Turn/energy delta and any publish-concurrency error.

Expected observed behavior in the current sample: definition-row delete and App uninstall have no confirmation. Removed unlocked definitions remain in World detail and upgraded saves, but are absent from fresh schemas. Uninstall hides World/runtime surfaces only after a save accepts the update; reinstall starts with zero definitions and a blank instance is hidden in runtime. Same-name recreation is a new locked identity and the old token can emit a generic Event without unlocking it. A later current-definition edit is replacement on World detail but append/preserve in an updated save. The unique token grants the current ID; World becomes `3/3`, the old save reconciles after reload to `3/4` with one retired locked row, and a native latest save is `1/1`. Update application consumes zero Turn/energy; the grant costs the normal Turn price. A stale publish can be rejected by `World changed; refresh before publishing`, after which refresh restores the Draft.

Parity criteria: separate versioned definition snapshots from monotonic Account×World unlock records, and key identity independently of visible name/description/condition. Preserve opt-in save migration, current-World versus upgraded-save versus fresh-save projection rules, blank-instance hiding, target-version convergence, optimistic publish concurrency and observable refresh lag. Never infer a grant solely from a generic Event marker.

Evidence: EVD-0248.

### P-059 Global navigation reachability and state

Precondition: authenticated desktop session on `/zh-cn`; repeat at one nested product page and a tested mobile viewport.

Steps on WorldOS: trigger every visible primary navigation destination, History World/Character filters, Credits, Notifications and account menu; return through product navigation rather than browser history; reload one nested destination.

Expected WorldOS behavior: each primary destination is reachable without mutating product data; History filters list Simulation saves by type rather than browse history; nested pages retain the global navigation appropriate to the viewport.

Parity criteria: preserve the same top-level information architecture, destination semantics, History object type and responsive access—not merely matching labels.

Evidence: EVD-0001–EVD-0004, EVD-0038–EVD-0039, EVD-0055, EVD-0228.

### P-060 World-card quick actions

Precondition: a discoverable World card in Home, Worlds, Community or a Collection.

Steps on WorldOS: open the card body/source World, trigger `立即开始`, trigger `改编`, and compare owner, Guest and remix-disabled samples where available.

Expected WorldOS behavior: card body reaches current World detail; Start reaches setup/login boundary; Remix reaches the copy flow when allowed and is absent or rejected when the published World disables Remix. Collection/Community cards may expose the same actions with surface-specific failure feedback.

Parity criteria: quick actions must target the card's current object and enforce published remix/auth permissions consistently; do not treat a silent blocked card action as success.

Evidence: EVD-0022, EVD-0176, EVD-0191–EVD-0192, EVD-0240–EVD-0242.

### P-061 Authentication modes and return walls

Precondition: Guest session plus a known public World/Character/App/Profile action that requires authentication.

Steps on WorldOS: inspect Login, Register and Forgot-password modes; compare their fields and mode-return controls; trigger Guest Favorite/Follow/Remix/Chat/Create/Share-dependent actions and record URL/login-wall/`next=` behavior. Do not submit a new account or real verification code unless separately authorized.

Expected WorldOS behavior: Google and email/password login coexist; Register adds password confirmation and optional invite; Forgot-password requests email then verification code. Protected actions enter an authentication boundary, while public reading remains available.

Parity criteria: reproduce the three form modes, validation surface and action-specific return path; keep final registration, verification delivery and new-account onboarding as explicit separate tests.

Evidence: EVD-0048 and archived Anonymous/Guest permission audit.

### P-062 Transcript export entitlement boundary

Precondition: free authenticated Simulation with Events and Settings available.

Steps on WorldOS: trigger export from Settings and the Events/Timeline surface; inspect modal title, entitlement copy, advertised formats and dismissal; do not purchase membership.

Expected WorldOS behavior: both entries converge on the same membership boundary advertising Markdown/HTML/TXT; no artifact is produced on the free account.

Parity criteria: expose both entry points and the common gate; actual artifact schemas remain a separately blocked paid-entitlement test and must not be inferred.

Evidence: EVD-0041, EVD-0138.

### P-063 Global Create menu routing

Precondition: authenticated session with the global navigation visible.

Steps on WorldOS: open `创作`; trigger or inspect Create World, Create Character and Create App destinations; verify Map creation is absent and is instead reached from `/maps`; close/reopen the menu and repeat at a narrow viewport where available.

Expected WorldOS behavior: the menu routes to World Creator, Character create mode and App Studio without creating data merely by opening; Collection creation remains available from Collections and Profile surfaces, not this menu.

Parity criteria: preserve the product's creation-entry taxonomy and object-specific destinations rather than collapsing all creators into one generic route.

Evidence: EVD-0001, EVD-0004, EVD-0076, EVD-0116.

### P-064 Configurable Time Engine and free-text target boundary

Precondition: an owned World with the official Time App configured and published; retain one fresh/current save plus an independent checkpoint or rewindable history.

Steps on WorldOS: record start time and configuration; trigger `下一事件`, `下一天`, `+1个月` and `+1年` separately; compare Turn, displayed time, Story, Events, Memory and energy. Create a checkpoint, advance time, then restore an earlier node and inspect truncation. Finally enter a clearly invalid literal in `跳转到指定时间…`, submit it and inspect whether validation, error, generic action or deterministic jump behavior occurs.

Expected WorldOS behavior in the tested sample: each preset operation consumes one Turn and advances to a semantic/calendar target while producing Story/Events; elapsed 397 days alone does not create Memory. Rewind restores earlier Time/Story and truncates future nodes without refund. The free-text field enables on arbitrary text; invalid `not-a-time-0249` produced no parser error, committed a normal action Turn and advanced Day 1 08:35→Day 2 10:00 through AI narration.

Parity criteria: model preset jumps as explicit Time-engine operations, persist Time inside save/checkpoint/rewind snapshots, and keep free-text parsing/error behavior distinct. Do not silently treat arbitrary input as a validated date. Record valid grammar, custom `+`, past bounds and locale/timezone handling as separate edge tests until evidence exists.

Evidence: EVD-0065, EVD-0074, EVD-0087–EVD-0089, EVD-0144, EVD-0250.

## 测试模板

```text
TEST-PARITY-XXX
Precondition:
Steps on WorldOS:
Expected WorldOS behavior:
Steps on Our Product:
Expected Our Product behavior:
Parity criteria:
Evidence:
```
