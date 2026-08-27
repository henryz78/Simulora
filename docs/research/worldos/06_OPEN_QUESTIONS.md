# Open Questions / UNKNOWN Register

## OQ-0001 — 首页推荐是否个性化

- Question: “猜你想玩”是否依赖账户浏览/模拟历史？
- Why it matters: 决定推荐系统是否需要用户画像与匿名回退。
- What we observed: 登录态首页/Worlds 出现“猜你想玩”。EVD-0240 now provides a reproducible owner-session baseline: 12-card Guess row inside a 35-genre Recommendation architecture, current Following=4 and a total 451 materialized recommendation cards/278 unique World URLs after deliberate row hydration. This proves the delivery structure but not the ranking cause.
- What remains unknown: 是账户历史、地区/语言、全站趋势还是其他信号导致。
- Experiment required: 记录当前列表；切换匿名/新账户（如合法可用）、产生不同类型模拟历史后复测并对比。
- Current confidence: delivery/control structure `VERIFIED`; personalization cause `UNKNOWN`

## OQ-0002 — World 卡片数字语义（已解决）

- Question: 卡片上的一个或多个数字分别代表什么（回合、模拟数、评分、评论/改编数等）？
- Why it matters: 影响 World schema、排序与卡片信息架构。
- What we observed: 不同区块可见如 `1M`、`4.2`，部分新内容显示两个整数；地图 World 有 🗺️ 标记。
- Follow-up: target World detail visual shows play-triangle `1`, Turn/message icon `1`, branch/Remix icon `1`; Simulation Settings independently labels the first two as `模拟次数` and `回合数`. The branch count equals the one known Remix. Heart favorite `0` is a separate button. Rated discovery cards replace/append the secondary card statistic with accessible rating such as `4.7 / 5 · 83`.
- Conclusion: primary detail stats are Simulation starts, total Turns and Remix count; favorite and rating are separate surfaces.
- Current confidence: `TESTED`

## OQ-0003 — 首页“历史”世界/角色按钮行为（已解决）

- Question: 是最近访问记录、搜索记录还是快捷过滤？
- Why it matters: 影响导航与持久化模型。
- What we observed: 左栏“历史”下有“世界”“角色”按钮。
- Follow-up: `世界` lists saved World Simulations with save name, source World and Turn; `角色` shows `还没有存档——开始一局模拟就会出现在这里。` for this account. No URL navigation occurs.
- Conclusion: buttons filter recent Simulation saves by World/Character type; they are not World/Character browsing histories.
- Current confidence: `TESTED`

## OQ-0004 — 角色库搜索触发机制（已解决）

- Question: 搜索框是否即时筛选，还是需要 Enter/失焦/服务端提交？
- Why it matters: 决定搜索交互、URL 状态和结果加载模型。
- What we observed: 关闭已打开的角色详情后，填入不存在的 `ZZZ-NO-MATCH-CHAR-001`，约 1 秒 debounce 后卡片列表清空并出现 `还没有角色`；按 Enter 不改变 URL 或结果。输入真实名称则恢复对应卡片。
- Conclusion: 搜索为同页 debounce 筛选/服务端加载，不要求 Enter，URL 不承载 query。此前 DOM 中仍含角色是已打开详情 Drawer，不是列表搜索失败。
- Current confidence: `TESTED`

## OQ-0005 — World 版本更新的 `应用更新` 为何 no-op

- Question: 既有 v1 Simulation 点击 `应用更新` 到 v3 时，为何没有推进版本或产生反馈？
- Observed: World v2、v3 均已成功发布；旧 Simulation 能显示最新 v3 更新块。鼠标点击与键盘 Enter 均未成功，重新打开仍显示当前 v1 和相同提示，无 success/error toast。
- Confirmed adjacent behavior: `暂不更新` 会隐藏当前版本；后续新版本发布后会重新提示，并直接指向最新版本。
- Follow-up: 第二个 Turn 1 样本以 v2 新增 App、v3 移除 App。两次点击 `应用更新` 均成功，Simulation 版本推进且 App Dock/iframe 分别出现与消失，Story/Turn 保留。
- Remaining experiment: 对仅标题/简介变化、初始化字段、角色配置、App 配置升级分别构造最小版本差异，以定位 Hogwarts 样本 no-op 的触发条件。
- Current confidence: success path `TESTED`; original sample root cause `UNKNOWN`.

## OQ-0006 — 免费 World App 数量限制冲突（已解决）

- EVD-0203 used a clean new World with six default Apps and sequentially installed Apps 7, 8, 9 and 10 successfully. Final installation of App 11 was blocked; installed count remained 10.
- The blocking dialog says `每个世界安装超过 10 个 App 是会员功能。`, while the same dialog's plan benefits still say `免费版最多 8 个`.
- Conclusion: actual tested enforcement is 10; `8` is stale/inaccurate same-screen marketing copy. Paid unlimited behavior remains untested because no purchase was made.
- Current confidence: free limit `VERIFIED`; paid entitlement `NOT TESTED`.

## OQ-0007 — Rewind 后 extra App 的成本是否仍计入（已解决）

- Earlier signal: Shop Dock 在一次 Rewind 后仍可见，但账户 `522 → 514`，只扣了 Deepseek 基础 8，而安装 Shop 前后正常规则应为 `8 + 2 = 10`。
- Controlled follow-up EVD-0204: 同一 Hogwarts 存档在 Turn 3 动态安装 Shop 后，模型菜单从基础 `Deepseek 8/回合` 增为 `10/回合`；Turn 3→4 使账户 `303 → 293`。恢复到安装发生前的 Turn 3 后，Credits 不退款且当前页面一度仍显示 Shop Dock，`已安装` 甚至暂时把 Shop 标为 `世界自带`，但模型菜单立即回到 `8/回合`。从恢复点再次执行 Turn 3→4 只扣 `293 → 285`；reload 后 Shop Dock 消失，基础 8 成本保持。
- Conclusion: Rewind 会移除目标 Turn 之后/快照之外的动态 App 安装及其 +2 计费；立即残留的 Dock/`已安装` 行是未刷新的前端投影，不是有效保留的配置。Rewind 不返还已经消耗的 Credits。
- Current confidence: `VERIFIED`

## OQ-0008 — 用户创建内容的自动本地化（主要行为已解决）

- Follow-up: Account Preferences 在 English / Español / 中文之间切换并持久化 locale 路由。相同 Profile UUID、World/Collection slug 和 Character records 在 English、Spanish、Chinese 下显示不同标题、简介和角色公开介绍；源 Character 的 `SOURCE UPDATE TEST 0104` 也有中文/西语 variant。
- Stable identity: locale route prefix changes，object ID/slug 不变，支持“稳定对象 + locale-specific field variants”的产品模型。
- Partial fallback: `TEST Map Install Audit 001` 在西语仍保持英文，说明缺少/未生成 variant 时会回退，而非在渲染时无条件机翻全部字符串。
- Remaining: variant 生成时机、用户能否手工编辑每种语言、更新 source 后各 locale 的异步完成状态和 anonymous cookie 行为。
- Current confidence: route/preference and displayed variants `VERIFIED`; generation/fallback internals `UNKNOWN`.

## OQ-0009 — Mine History 为什么不列出已有 Simulation（已解决）

- Observed: Mine → History initially looked empty only because the World/Character sub-filter was active. Opening main History lists five Simulation records with name, World, Turn and date; `更多` exposes `重命名` and `删除`. Character filter remains empty with a Character-specific empty copy because no Character-bound save exists. Sidebar History is a separate recent-navigation list.
- Conclusion: Mine History is Simulation management; its type filters are not recent-navigation history.
- Current confidence: `TESTED`

## OQ-0010 — World 改编权限的公开强制行为

- Question: 关闭改编权限发布后，公开详情是否真的移除/禁用 `改编`，以及旧 Remix/作者自己的改编是否例外。
- What we observed: Editor toggle `不允许` 触发自动保存；会员可见性明确弹墙。之后在目标公开页点击第一个 `改编` 仍生成了 `/worlds/test-map-world-001-gytp/edit`，但该按钮可能来自相关推荐，且未做独立刷新/按钮归属核对。
- Experiment required: 新建最小公开 World，切换不允许，等待保存状态完成，发布 v2；从精确目标详情 URL 刷新后只定位主详情区按钮，再用另一个合法 viewer 或未登录公开窗口复测。
- New evidence EVD-0161: the toggle is a real local control: `不允许` selects and changes helper copy to `其他人不能改编这个世界，你自己仍然可以。`; `允许` restores the prior state/copy. No Publish was submitted in this control probe, so persistence and external enforcement remain unverified.
- New evidence EVD-0169: selecting `不允许` on the template World Draft survived autosave and a full Creator reload (`发布 v4` remained with the same helper copy), proving Draft persistence. No Publish was submitted; public rendering and non-owner enforcement remain unverified.
- New evidence EVD-0176 published the persisted `不允许` state as public v4. EVD-0192 then verified external enforcement: Guest main detail omitted Remix, Guest Collection-card Remix silently did nothing, and Account B was rejected at final `复制并自己改编` without URL change/request/child creation. Existing descendants and undocumented direct Remix routes remain untested.
- Current confidence: Draft/publication and tested Guest/non-owner enforcement `VERIFIED`; existing-descendant/direct-route exceptions `UNKNOWN`

## OQ-0011 — Template application semantics on fresh World

- Question: selecting a genre template should presumably create initialization fields and/or rules; exact application is unclear.
- Observed: controlled clean Creator selection of `西幻冒险` immediately materialized four editable fields (`race/class/origin/creed`) with option sets and `{{variable}}` references. Default six Apps and blank system prompt did not visibly change. The chooser remained open.
- Experiment completed: disposable `TEST Template World 001` was created from a clean Creator, given `现代恋爱` + `修仙` fields, saved/reloaded, published as v2, opened at `/new`, and started as fresh Simulation `1440b4a4-2c7d-4bca-ac37-d0e98c91ac2c`. `/new` exposed all 11 fields/options and the opening Story incorporated submitted template values including Alice, cultivation facts and origin/sect details.
- Remaining: exact variable serialization, behavior when a required field's default is empty, template-specific rule/prompt injection and replacement/removal behavior. EVD-0157 verifies non-empty default + required marker and clearing behavior.
- Current confidence: field materialization, additive append, Draft/public `/new` persistence and fresh-runtime story propagation `VERIFIED`; rule/prompt internals `UNKNOWN`.

## OQ-0012 — App invalid JSON normalization

- Question: how does App Creator handle malformed initial JSON, and does the editor accept non-object JSON values?
- EVD-0196: disposable `TEST App Invalid JSON 001` accepted valid array `[1,2]` and preserved it (pretty-printed) after slug-route reload. Replacing it with malformed `{ invalid-json ` saved without visible error; reload normalized the field to `{}` while HTML/name/description/detail remained intact.
- Remaining experiment: install/run array and malformed samples and compare runtime state; determine whether server-side normalization differs from the editor's persisted value and whether nested/null/scalar edge cases follow the same rule.
- Current confidence: editor acceptance and malformed normalization `VERIFIED`; runtime coercion and broader JSON schema `UNKNOWN`.

## OQ-0013 — Character delete and World-bound copy propagation

- Question: deleting the owned Character from Library affects World Draft/runtime copies how?
- Completed evidence: EVD-0123 executed the final native-confirm delete. The source disappeared from Character Library and Unified Search, but the World-local Character, L0 published World, three tested World Remix descendants and Character Remix L1/L2 all remained. The L0 Creator retained the local name/prompt and did not acquire a source-deletion-specific version. The source's independent Character Chat save now returns 404 while sidebar History retains the tombstoned link.
- Follow-up: EVD-0124 and EVD-0127 verify that exact L1 and L2 Remix Chats each create a stable UUID, complete an AI Turn as the copied role and persist across reload. EVD-0128 verifies a fresh post-delete World Simulation initializes the preserved World-local Character in Chat, persists its charged Turn, and later exposes the same Character after a zero-Turn Character State App update.
- Remaining experiment: member/private visibility enforcement and stable direct URL/external discovery. EVD-0181/EVD-0185 confirm two owner Remix drawers omit edit/delete and the L2 exact unified-search query returned no result at observation time. EVD-0205 then compared the same Mine grid against an ordinary owned Character: normal Edit expands inline on `/zh-cn/sims`, while L1/L2/003 cards and Drawers have no Edit/Delete/More/href. User-discoverable alternate edit/delete is `NOT DISCOVERABLE`; intermediate-parent deletion is therefore `UNREACHABLE_IN_NORMAL_UI`, not an executable pending lifecycle. Undocumented backend routes remain `UNKNOWN` and were not guessed.

### EVD-0167/0168 follow-up

- `测试角色生命周期 003` now closes a fresh owner-side Chat Turn and reload persistence: quick suggestion fill and explicit Send are separate actions; Events exposes the new Turn; Memory remains empty at the early cadence; Detail/Card expose the edited public intro after reload.
- `添加到世界` now closes the owner-side selector and Draft copy path: selecting an owned World creates/updates the next unpublished World version and hydrates the copied Character into Creator Preview without navigation.
- A new Character Remix save returned a success toast and remained absent from exact-name Character search after immediate wait and full reload. Mine later confirmed durable clone cards for `TEST Character Remix 003`, L1 and L2; their drawers expose Chat/Remix/Add-to-World but no edit/delete. EVD-0215 performs a later fresh-navigation recheck: 003 still returns `还没有角色` in the global Character Library and `暂无匹配结果` under Unified Search's canonical `tab=chars`, despite its durable T20/T21 Chat. EVD-0225 rechecks the current owner Mine card and confirms it is a button with no stable href, Edit/Delete/More or parent attribution. Stable external access, backend publication/index cause and undocumented mutation routes remain `UNKNOWN`; no normal-UI experiment remains to execute.
- Current confidence: copy/source-delete isolation plus descendant and World-local runtime independence `VERIFIED`; clone Mine persistence/no discoverable edit-delete and normal-UI intermediate-delete unreachability `VERIFIED`; permission and stable public route `UNKNOWN`.

### EVD-0198/0199 follow-up

- `TEST Character Remix 003` Chat now has a verified stable Simulation UUID and appears in Mine → History → Character. Renaming the save persists after reload and changes the Simulation title while the Character identity remains unchanged.
- Share does expose a Character-shaped target, but this does not resolve the clone direct-route question: both the Remix sample and an ordinary Character sample generate `/worlds/char:<uuid>` links that return owner-side 404. Treat these as broken share outputs, not functioning public Character details.
- Remaining: actual public Character detail route (if any), external resolution and undocumented backend clone mutation (not part of discoverable parity). Intermediate-parent deletion cannot be initiated through normal product UI.

## OQ-0014 — App own-version upgrade

- Question: when an App itself publishes v4 after an installed World has configured v3, does World auto-prompt, pin App version, or silently use latest?
- Observed: v4 HTML saved through `存草稿` immediately replaced the public App detail iframe before separate Publish; v4 had inconsistent/no visible log. World v3 published afterward and a new Turn-1 Simulation rendered v4 successfully. After that Simulation existed, saving v5 immediately changed its iframe to v5 without World v4, a Turn, or a prompt; reload kept v5. World public version stayed v3.
- Experiment required: isolate Initial JSON from AI instruction in a later version; separately test App delete/downlist.
- EVD-0147 isolates a later-version App-definition boundary: v2 hot-updated HTML/instruction while an existing Simulation retained runtime state. EVD-0154 then verified complete primitive/nested/array seed for a newly installed namespace in old/fresh saves.
- EVD-0155 established the first World-version three-way result: runtime-dirty `clicks/status` and runtime-only `upgradeSeen` survived v5→v6; untouched `arr/nested/newField` adopted the new seed and `missingOnly` was added. At that point the narrow sample only supported a top-level interpretation; EVD-0235 below supersedes that interpretation with path-level evidence.
- EVD-0235 resolves the World-version deep merge boundary for one installed App. A runtime-dirty nested path survives while an unchanged sibling updates and a new sibling is inserted; arrays of objects are merged by stable `id` (`a` retained, omitted `b` retained, new `c` appended); clean fields accept explicit `null`, dirty fields reject the conflicting `null`; omitted seeded fields and runtime-only fields survive. A fresh v7 save receives the new JSON literally instead of the migrated union.
- Revised confidence: definition/HTML/AI hot update, literal fresh seed, deep path-level three-way merge, ID-keyed object-array merge, null precedence and omission-preserves-old behavior `VERIFIED` for this sample. Arrays without IDs, duplicate-ID ordering, type changes, explicit deletion/tombstones and cross-owner installation remain `UNKNOWN`.
- EVD-0162 narrows the downlist question: the published owner detail and slug editor expose Edit/Delete/Install/Save Draft/Publish but no visible App visibility, downlist or unpublish action. Treat reversible downlist as `NOT DISCOVERABLE / UNKNOWN`, not as a confirmed product capability.
- EVD-0174 owner-side reconciliation: `/zh-cn/apps/test-app-first-publish-001` currently loads as public v2 with Edit/Delete/Install, v1/v2 log entries and `4 个世界在用`; its editor slug route is live. This rules out current permanent deletion, but does not explain Account-B's earlier 404, which remains a historical/time/index/session discrepancy UNKNOWN.
- EVD-0179 external Marvis recheck strengthens the discrepancy: Guest and Account B both saw persistent direct 404 after refresh, and B saw no App Market or Unified Search result; a known deleted App showed the same generic 404 shape. The report is accepted as `EXTERNAL_BLACKBOX_REPORTED` at tested-sample scope; original screenshots/document are not archived, and root cause remains `UNKNOWN`.
- EVD-0180 owner Creator `删除` check exposed the usage-gated branch; EVD-0186 confirms the submitted downlist marks the owner Market card `未公开`, preserves owner detail/edit and installed Simulation runtime, and hides the App from the normal public discovery state. EVD-0187 confirms clicking `发布` restores the owner Market card without creating v3. EVD-0190 closes the external direct-access delta: after republish, Guest and Account B direct URL/hard reload recovered while App Market and Unified Search remained empty. The historical 404 is therefore associated with the tested publication transition, but exact backend flag/cache and discovery convergence SLA remain `UNKNOWN`.
- EVD-0218 closes the owner-side projection comparison: exact visible title now finds the relisted v2 card in Owner App Market, exact slug does not; Owner Unified Search's App tab still returns no match, while the official `主输入框` control query succeeds. Thus direct access, dedicated Market and Unified Search are separate projections, and Market visibility differs by identity in the combined B/Guest/Owner sample. Remaining UNKNOWN is the eligibility/cache/moderation rule and convergence SLA—not whether the surfaces can disagree.

## OQ-0035 — New App first-publication transition

- Question: What exact validation and state transition occurs when a brand-new App moves from empty creator, to HTML/config draft, to first Publish? Does first Publish create v1 immediately, require all fields, and which owner controls appear afterward?
- Observed: empty `/zh-cn/apps/create` keeps `存草稿` and `发布` visible while AI submit and preview test input are disabled. Tutorial says Draft is owner-only and Publish puts the App in App Market; configuration exposes slug/name/icon/color/description/tags/detail/update notes/instruction/Initial JSON/refresh/Event templates. No empty-state publish was submitted.
- Required experiment: create one disposable `TEST App First Publish`, fill minimal valid HTML/config, save Draft, reload, publish v1, inspect public detail/version log/owner controls, then update and downlist before any destructive delete confirmation.
- Current confidence: empty controls/tutorial/config schema, first-publication transition, first post-publication v2 hot-upgrade and exact v2 seed copied into a newly installed World Draft `VERIFIED`; published-runtime hydration/merge, usage-counter eligibility, downlist and independent-viewer timing remain `UNKNOWN`.
- EVD-0136 confirmed the Draft could be reopened through `?slug=...`, owner detail exposed v1 and `未公开`, and unified Search returned no result.
- Resolution EVD-0145: the single first-Publish click used no confirmation modal, redirected to public detail and kept the resource at v1. App Market exact search immediately returned it; unified Search still did not. Installation used a two-stage World/configuration flow, a >10-App target raised a membership wall, a lower-count World Draft succeeded and usage changed 0→1. Publishing that World as v9 exposed the App publicly.
- Resolution EVD-0147: editing the public App and clicking `存草稿` created public v2 immediately. Existing Simulations hot-loaded v2 without a World prompt, retained old `clicks/status`, accepted v2 Event deltas and hydrated the merged state after reload.
- Resolution EVD-0150 at the World-Draft boundary: a second World installation copied the complete v2 Initial JSON, including new primitive, nested-object and array fields, into its durable v5 Draft. Remaining experiment: publish/apply that Draft and distinguish fresh-runtime hydration from existing-save missing-field merge. The App usage counter remaining at 1 is a separate unresolved eligibility/indexing question.
- EVD-0141 adds the zero-use owner delete branch: `删除` first shows `正在检查使用情况…`, then `删除这个 App? / 此操作不可恢复。`; cancelling leaves the Draft intact. Used-App cascade and downlist/unpublish remain separate open branches.

## OQ-0036 — New App Draft persistence route

- Question: Does `存草稿` for a brand-new App create a durable owner Draft, and where can it be reopened?
- Observed: after entering a valid-looking HTML/config and clicking `存草稿`, the UI showed `草稿已保存。` but stayed on `/zh-cn/apps/create`; a bare reload returned the blank `未命名 App` state. Mine → App then exposed a `未公开` card, owner drawer `详情/编辑/删除/安装`, detail v1 and an edit URL `/zh-cn/apps/create?slug=test-app-first-publish-001`; that slug route restored all fields. Owner-side App Market search also showed the card with `未公开`.
- Required experiment: publish the same new App without losing the slug route, inspect the visibility/version transition, and compare with a genuinely independent viewer/anonymous session.
- Current confidence: durable owner Draft/v1, slug-route restoration and subsequent public Publish `VERIFIED`; bare-route hydration, unified Search convergence and independent-viewer timing `UNKNOWN`.

## OQ-0015 — Template field materialization

- Question: genre template selection persists which fields, prompt fragments and App defaults in fresh World publish/runtime?
- Observed: Western Fantasy created four full fields with option sets and variables; default App set still includes Main Input, Story, Chat, Time, CG and Achievements.
- Experiment completed by EVD-0156. `/new` displayed the persisted field schema and a fresh Turn-1 Simulation used submitted template-derived values in the opening Story.
- Remaining: whether variable references are exposed to App configuration exactly as `{{variable}}` at runtime, behavior when default is empty, and replacement/removal semantics. Non-empty required/default behavior is covered by EVD-0157.
- Current confidence: Creator materialization, append, publication and fresh setup/runtime propagation `VERIFIED`; prompt serialization and edge semantics `UNKNOWN`.

## OQ-0016 — Time advancement contract

- Question: what actions advance World time, and how are labels/calendar/transactions aligned?
- Observed: ordinary Map/Chat/Shop Turns can preserve a coarse World time label, so one Turn does not imply a fixed time increment. EVD-0074 then installed and configured the official Time App, and EVD-0088–0089 published it and executed four controlled runtime jumps. `下一事件` advanced Day 1 08:00→08:20; `下一天` advanced to Day 2 06:30; `+1月` advanced to Day 32 08:00; `+1年` advanced to Day 398 07:30. Every jump consumed exactly one Turn and generated Story/Event state. The semantic day/event controls therefore choose narrative target times rather than applying a fixed duration.
- Rewind follow-up: EVD-0144 restored a Time-bearing save to an earlier Turn and verified Turn, time label, Story and future-node truncation. Elapsed 397 days alone did not create Memory.
- Invalid free-text follow-up EVD-0250: `跳转到指定时间…` enabled for literal `not-a-time-0249`; `前往` emitted no validation error and committed it as an ordinary Turn-6 action, advancing Day 1 08:35→Day 2 10:00 with AI narration. The field is therefore not a strict client-side parser in this sample.
- Remaining experiment: valid free-text grammar, the extra custom `+` operation, past/bound targets, locale/timezone formatting and exact intermediate-event density.
- Current confidence: standard next-event/day/month/year plus Turn/Event/Rewind contract and invalid-text generic-action fallback `VERIFIED`; valid/custom parser and edge formatting `UNKNOWN`.

## OQ-0017 — Social Simulation autonomous behavior

- Question: do Characters generate autonomous social events/messages without player Chat, and what thresholds alter bonds/mood?
- Observed: the American High School sample ran through Turn 15 with multiple Characters, Chat, Instagram, Stats and Relations. Turn 2 generated an autonomous Tyler group message plus Quinn rapport/Stress/Clout deltas; Turn 4 generated autonomous Leo/Maya replies and notification buttons. Story incorporated the social activity while Events exposed the structured messages and state deltas. Deliberately non-social Turns did not force a message every Turn, while Memory continued to summarize the branch-specific event stream.
- Rewind follow-up: EVD-0144 restored Turn 15→6 and truncated later Chat/Instagram, Relations, Stats, Memory and timeline nodes together; the same Simulation remained runnable.
- Remaining experiment: exact trigger/cadence formula, probability/model dependence, read-state effects and how explicit Chat-heavy prompts compare with non-social play. These are scheduling-policy questions, not an unknown autonomous-social architecture.
- Current confidence: autonomous social generation, cross-App deltas and Rewind participation `VERIFIED` in the tested World; cadence/generalization `UNKNOWN`.

## OQ-0018 — Export file schema

- Question: exact Markdown/HTML/TXT transcript layout and included state/metadata.
- Observed: free account reaches membership wall; plan copy names formats only.
- Experiment required: use permitted free trial/entitlement if available, stop before payment otherwise.
- Current confidence: `BLOCKED` by current membership boundary.
- New evidence EVD-0138 confirms the wall advertises Markdown/HTML/TXT as membership benefits and presents one-time/subscription/self-provided-API purchase tabs. No payment was selected; file schema remains `BLOCKED`.

## OQ-0019 — Populated notifications and activity

- Question: follow/comment/version/remix/install events create which notifications, read states and deep links?
- Observed: Account B following Account A and remixing Account A's World produced two durable Account-A notification records and unread badge `2`. The Remix record deep-linked the new L1 World; the Follow record deep-linked Account B's Profile. Opening the notification center cleared the numeric unread badge while retaining both records.
- Experiment required: inspect the recipient/parent side for Account-A L2, then generate unlike/unfollow, comment, version, install and gift events in disposable test assets; compare badge increment, per-item read state, retention and whether undo operations create or retract records.
- Current confidence: Follow/Remix delivery, deep links and open-to-clear badge `VERIFIED`; remaining event taxonomy/retention `UNKNOWN`.

## OQ-0020 — Mobile touch/keyboard edge behavior

- Question: keyboard focus, Dock gestures, 360px and horizontal orientation behavior.
- Observed: 390×844 and 360px Creator/Simulation core layouts work without page-level horizontal overflow. EVD-0228 explicitly verifies 360×844 Character Chat focus/fill/send and real Turn, full-screen Settings, Creator long-form/side-menu/desktop-mobile-setup Preview modes, same-tab leave/return persistence, and 844×360 orientation switching to the multi-panel runtime.
- Remaining experiment: real touch Dock/phone-icon long-press and drag, OS software-keyboard occlusion/IME composition, safe-area/notch, app background/suspend/resume and device rotation during an in-flight generation.
- Current confidence: responsive portrait/landscape layout and semantic input path `VERIFIED`; touch/IME/safe-area/background behavior `UNKNOWN / DEVICE-BOUND`.
## OQ-0032 — Global Character source-to-World-local propagation

- Question: When the reusable global Character is edited, unpublished, made private or deleted, does an existing World-local copy change, become inaccessible, or remain independent?
- Why it matters: Determines Character copy semantics, versioning and whether World publication must snapshot Character data.
- What we observed: source edits did not propagate to the World-local definition. EVD-0123 then verified that final source deletion also leaves the World-local copy, published L0 World, three World Remix descendants and Character Remix L1/L2 intact. The source Chat save becomes 404 while History retains its link.
- Follow-up: EVD-0124/EVD-0127 prove L1/L2 Chat runtime independence after source deletion. EVD-0128 proves fresh World-local Chat and later Character State initialization across v7→v8 while preserving Turn/Story/Chat/Map.
- What remains unknown: member-only/private visibility behavior, exact Character State field semantics and behavior after deleting an intermediate Remix parent.
- Experiment required: use an independent entitled viewer for private visibility without payment or access-control bypass; test a disposable Remix parent lifecycle.
- Current confidence: update/delete/runtime isolation `VERIFIED`; remaining permission/intermediate-parent edges `UNKNOWN`.

## OQ-0021 — Independent-viewer permission enforcement

- Question: Which visibility and remix settings are enforced for a viewer who is not the owner, and do direct links differ from Search/Explore visibility?
- Why it matters: Required to reproduce Public/Unlisted/Private behavior and Remix access control.
- What we observed: Editor exposes `公开`, `不公开列出 会员`, `私有 会员`. EVD-0231 clicked both non-public controls on a free owner: each opened the same `把世界设为非公开是会员功能` pricing dialog and cancellation left Public selected. The entitlement interception occurs before visible state mutation. External Marvis/Guest audits already cover Public, link-visible Collection and remix-disabled World behavior; they do not supply entitled non-public samples.
- What remains unknown: Direct URL, Search/Explore/Profile, existing Simulation, Start, Share and Remix behavior after an entitled owner publishes Unlisted/Private or restores Public; Character/App non-public behavior; only-me Collection external access.
- Experiment required: use an already-entitled disposable owner plus genuinely logged-out and separate-account viewers. Never buy membership or bypass access. Run Public→Unlisted→Private→Public and test direct/discovery/actions/existing saves with timestamped propagation.
- Current confidence: owner control/entitlement boundary `VERIFIED`; external non-public enforcement `UNKNOWN / ENTITLEMENT-BLOCKED`.

## OQ-0022 — Time App runtime delta and propagation

- Question: In an installed Simulation, how do +hour/day/month/year, arbitrary-date and next-major-event operations advance time, consume Turns/Credits, and update NPCs, Social, Economy, Quest, Story and Memory?
- Why it matters: Time is a cross-system engine rather than a display widget; parity requires its state transition and rewind semantics.
- What we observed: EVD-0074 enumerated and persisted runtime configuration fields (display name, start time, format, repeatable jump rows, custom AI instruction, reminder, guide, theme and background). EVD-0087–0089 published the App, initialized a fresh save and executed next-event/day/month/year. Each operation cost one Turn, changed the Time label and produced Story/Events; the one-year jump simulated intervening history. EVD-0144 additionally proves Time participates in in-place Rewind. Existing saves can defer a World update and remain on the old App set.
- What remains unknown: valid arbitrary-date/custom `+` grammar, past/bound targets, exact intermediate-event granularity and exhaustive NPC/Social/Economy/Quest/Wallet propagation for every jump type. EVD-0250 directly proves that clearly invalid text can fall through to a generic charged action instead of an error.
- Experiment required: one controlled arbitrary-target/invalid-target matrix if browser stability permits; otherwise retain these parser/coverage edges as explicit UNKNOWN rather than repeating the already verified standard controls.
- Current confidence: configuration, publication, fresh initialization, standard runtime jumps, one-Turn cost, Story/Event projection, Rewind and invalid-text fallback `VERIFIED`; valid custom parser and exhaustive cross-App propagation `UNKNOWN`.

## OQ-0023 — Social World UI mode persistence and runtime differences

- Question: Does `自由沙盒` versus `文游小手机` persist into the Simulation and change only layout, or does it change available App interactions/turn flow?
- Why it matters: Social Worlds advertise two distinct shells and a parity implementation needs both.
- What we observed: `/zh-cn/worlds/american-high-school/new` exposes `自由沙盒` and `文游小手机`, but semantic/keyboard/coordinate attempts did not change the setup `aria-pressed` state in the tested session. A responsive setup nevertheless initialized the phone shell, and the same Simulation's Settings control `切换界面模式` successfully converted phone→free-sandbox→phone without spending a Turn, resetting Story or losing state. The phone shell has persistent bottom navigation/home icons/widgets and internal App back/refresh behavior; free sandbox exposes independent App windows.
- What remains unknown: the setup-selector no-op's scope/cause, whether a manual setup choice ever overrides the responsive default, and any mode-specific behavior beyond the tested Apps/widgets.
- Experiment required: repeat the setup selector on another Social World/account/device only if a normal independent environment is available. Do not repeat runtime switching; that boundary is already verified.
- Current confidence: distinct shells and same-save runtime switching/persistence `VERIFIED`; setup selector `TESTED / DEFECT-CANDIDATE`, cause/generality `UNKNOWN`.

## OQ-0024 — App reinstall seed and draft-conflict arbitration

- Question: Does uninstall→reinstall of an App seed a new World-local Initial JSON/config snapshot, and how does the Creator arbitrate concurrent auto-save/configuration hydration?
- Evidence: EVD-0107 shows the reinstall form resolves current App v8/v9 definitions; an immediate configuration interaction can surface `草稿已在其他页面更新` and roll back the just-installed card when the draft is refreshed. Waiting for `草稿已自动保存` then reloading preserves the install. Existing Simulations remain unchanged while the World is Draft-only.
- Required follow-up: publish a clean version after stable reinstall; create a fresh Simulation and inspect App state; compare a pre-existing Simulation after applying the World update; then uninstall/reinstall again and test whether state resets, merges, or remains independent. Repeat with a deliberately delayed/parallel Creator tab only if the normal UI exposes it.
- Current confidence: latest-definition hydration and draft conflict UI `TESTED`; seed/migration semantics and conflict arbitration policy `UNKNOWN`.

## OQ-0025 — Model cross-device scope and provider failure

- Question: Does the selected official/BYOK model persist across devices, and what happens when a provider/model fails mid-Turn?
- Evidence: EVD-0109 verifies per-Simulation model controls, official-tier costs (`10` vs `13` per Turn) and full-reload persistence. OpenRouter Free in Simulation is gated by `Freedom Pass`; selection itself is no-Turn, while the next action charges the selected tier. EVD-0237 separately finds Account BYOK in a stable `自备 API 限免` state with four real provider forms and a live searchable OpenRouter catalog. This promotion does not by itself prove the in-Simulation Freedom Pass gate is removed.
- Required follow-up: inspect the same save from a separate normal viewer/device if available; use only the site's own failure surfaces or an invalid non-secret model selection if exposed, never a real API key.
- Current confidence: official model inventory/cost/gate/Turn/reload and current Account BYOK promotion/catalog controls `VERIFIED`; promotion eligibility/expiry, cross-device persistence, valid-key success and provider-error recovery `UNKNOWN`.

## OQ-0026 — App cascade deletion postconditions

- Question: After owner-final-delete of an App that is installed in a published World, what survives in the World Draft, published version history and existing Simulations?
- Evidence: EVD-0111 verifies the exact cascade warning (`会先从你自己的 1 个世界卸载`) and final submission for `test-app-001`. A disposable zero-use App deletion redirects to market and makes its direct URL 404.
- Follow-up: EVD-0126 published the generated cleanup Draft as World v6. Public v6 contains only Main/Story/Map/Time and the preserved World-local Character. The previously 404 `2ba0...` v5 save immediately became resolvable again, showed a normal v5→v6 update modal and applied at zero Turn while preserving Turn 2/Story/Map/Time. The App URL remains 404.
- Answer: the save was retained but temporarily unresolvable while the latest public World version referenced the deleted App and only a private cleanup Draft removed it. Publishing the dependency-clean World version restores the same Simulation UUID; it does not restore the App.
- Remaining experiment: independent viewer/other-owner World dependencies and whether an App `unpublish/downlist` path differs from permanent delete. The current owner-v2 state is already reconciled; do not repeat the full first-publish lifecycle solely because of the historical B-side 404.
- Current confidence: owner-World cascade/delete/recovery lifecycle `VERIFIED`; cross-owner behavior `UNKNOWN`.

## OQ-0027 — Tombstoned Simulation links after App deletion

- Question: Why do Mine History and the World `你的存档` list retain a link to `TEST v5 Reinstall Seed Simulation 001` after direct navigation to that save returns 404?
- Observed: `/zh-cn/sims` and `/zh-cn/worlds/test-map-world-001-gytp` both render the save card and stable UUID link; direct URL previously returned `This page could not be found.` after the installed App was finally deleted. Published World v1–v5 remain visible; owner Creator has an unpublished v6 Draft without the App.
- Resolution experiment: after publishing cleanup World v6, the same retained link and UUID `2ba0...` resolved normally, displayed a v5→v6 update dialog and migrated successfully. App `/apps/test-app-001` remained 404.
- Answer: this was not a tombstoned/deleted Simulation record or merely a stale link. The list correctly retained a save that was temporarily unreadable due to the published World version's broken App dependency; a dependency-clean later World version recovered it.
- Remaining: retention/recovery behavior when no owner can publish a cleanup version, and other-account World dependencies.
- Current confidence: owner save retention and recovery `VERIFIED`; generalized backend rule `PARTIAL`.

### Normal final-delete control sample

- EVD-0129 distinguishes true Simulation deletion from the temporary App-dependency failure above: accepting `确认永久删除该存档？` removes the save from the World list, retargets Continue to another save and makes the former UUID return 404 with no undo/recovery control.
- EVD-0219 confirms the later converged state also omits the deleted title/UUID from Mine History and global sidebar History; the former direct route remains a bare 404 with no Back/Undo/Restore product control. Exact immediate cleanup latency is still not inferred.
- Current confidence: normal owner-driven final delete and eventual cross-index cleanup `VERIFIED`; cross-device cache and backend retention/admin recovery remain outside normal product access.

## OQ-0028 — Social setup phone-mode selector no-op

- Question: Why does `/worlds/american-high-school/new` expose `文游小手机` but refuse to change selection from `自由沙盒`?
- Observed: semantic, forced and coordinate clicks all left `aria-pressed=false` for phone and `true` for sandbox; no error appeared. The created save `c86047d5...` used the sandbox shell. In-Simulation `切换界面模式` worked in an earlier mobile sample, so setup selection and runtime shell-switching are distinct mechanisms.
- Experiment: repeat with a second account/browser and a different Social World; inspect whether required fields, sticky CTA state, viewport or existing default-mode preference affects it.
- Current confidence: failure `TESTED` in one setup session; scope/cause `UNKNOWN`.

## OQ-0029 — Social Memory cadence and autonomous-event threshold

- Question: What exact token/Turn/event threshold triggers Memory summaries and autonomous social messages?
- Observed: Memory empty through Turn 4, Memory 1 present at Turn 6, Memory 2 at Turn 10; Turn 7 recalled prior details accurately. Autonomous group messages appeared in Event Delta at Turn 2 and Turn 4, including named senders and notification buttons.
- Experiment: continue either branch past Turn 15 with a mix of social and non-social actions; compare summary boundaries, notification read state, relation threshold labels and whether autonomous messages resume. Rewind across Turn 10 in another Social save/account if available.
- Current confidence: summary/branch behavior `VERIFIED`; exact scheduling rule and Social restore terminal behavior `UNKNOWN`.
- New evidence EVD-0121/0122: the 11-node history viewer is read-only; a Turn-6 branch contains Memory 1 but not Memory 2 and truncates Story/stats/relations/social surfaces. After four post-fork non-social Turns, Memory 2 remained absent at branch Turn 10 but appeared at branch Turn 11 with branch-specific content, proving future summaries restart from the branch's own event stream. No new Chat/Instagram content appeared during those four Turns. Main-save Turn11→6 in-place restore hung in three bounded retries and a fresh page stayed at Turn 11; classify as `UNKNOWN / suspected defect`, not success/failure.
- EVD-0135 adds owner main-save Turns 12–15: Memory 3 appeared by Turn 15 after four ordinary actions; study/observation/social-preparation actions produced explicit Grades/Stress/Mood/Style/Clout deltas and calendar progression. No new autonomous Chat/Instagram card appeared in the final states, so autonomous social content is not every-Turn in this sample. Exact cadence/threshold remains UNKNOWN.

## OQ-0030 — Collection visibility persistence and viewer enforcement

- Question: Does `公开`/`链接可见`/`仅自己` persist only after `保存合集`, and how do Search, direct URL and non-owner sessions enforce each state?
- Observed: owner collection `测试系列 001` is link-visible in backend state and absent from `/zh-cn/collections` browse/search while direct owner URL works. Editor exposes all three choices, 100-item ordered membership and owner-world add/remove drafts; no visibility save was submitted during this pass.
- Experiment: with a disposable collection, save each visibility state, refresh, test public browse/search and direct URL in a separate account/anonymous session, then restore or delete the disposable collection at action-time confirmation.
- Current confidence: link-visible persistence, membership add/order/remove save and Guest/non-owner direct-link/discovery/control enforcement are `VERIFIED` for the tested Collection (EVD-0183, EVD-0191, EVD-0206); empty-private and non-empty-only-me final deletion, detail/edit invalidation, exact-search/Profile/reverse-projection removal and member-World non-cascade are `VERIFIED` (EVD-0184, EVD-0216). `仅自己` external access, cross-account cache timing, notification behavior and backend retention remain `UNKNOWN`.
- New evidence EVD-0142: a new Collection's Save becomes enabled with only a name (empty membership allowed). Public visibility blocks adding a non-public owner World with tooltip `公开合集只能收录公开世界...`; switching unsaved visibility to `链接可见` changes copy to `不会出现在发现页，但有链接的人可以打开。` and enables the remaining add controls. Save-time persistence and non-owner enforcement remain UNKNOWN.
- New evidence EVD-0159: disposable `TEST Collection Lifecycle 002` saved successfully as `仅自己`, generated stable slug `/zh-cn/collections/test-collection-lifecycle-002-2szc`, and reopened in edit with name/description/tags/one World plus the selected private state intact. It was then saved as `公开`; the direct detail remained immediately accessible, but `/collections` and exact English-title search still returned no card after reload and a short controlled wait. Save-time visibility persistence is therefore `VERIFIED`; public discovery-index convergence and independent Guest/non-owner enforcement remain `UNKNOWN`.
- Owner recheck: existing `TEST Collection 001` at `/zh-cn/collections/test-collection-001-g6wi/edit` has `链接可见` selected. EVD-0191 completes Account-B/Guest enforcement: direct link and hard reload work, member Worlds open, Share stays canonical, directory/Search omit it and non-owner management controls are absent. No repeat is required; only the separate `仅自己` state remains open.

- New evidence EVD-0193 creates a legal owner-only sample at `/zh-cn/collections/test-collection-only-me-001-c7x5`; owner save/redirect/detail/edit persistence is verified and the helper explicitly says `只有你可以查看和编辑。`. External enforcement is still unknown.
- EVD-0195 adds the owner discovery projection: the Collection appears in the owner's Profile `我的合集` but exact public directory/Search returns zero. This is not external permission evidence; Guest/non-owner direct access remains unknown.
- EVD-0206 closes member-removal commit behavior: trash mutates only the editor, has no confirmation, Save redirects to detail, the count/membership survive detail/edit reload, and the removed World returns as an add candidate. Notification unread count remained unchanged. Whole-Collection deletion with members is still a separate experiment.

## OQ-0038 — Historical World Version URL / Share / Remix

- Question: Can an owner or viewer navigate to, share or Remix a historical World version rather than the latest version?
- EVD-0171/EVD-0177 show owner and non-owner Version History as read-only text without old-version link/selector. EVD-0188 additionally verifies the owner Share composer and X intent use the current canonical World URL with no version identity.
- EVD-0207 explicitly triggered `展开全部` on a four-version owner World: v1 appeared, URL stayed canonical, the expanded history container had zero links and only the `收起` control. Collapsing restored the recent-three view.
- Resolution: historical version navigation/share/Remix is `NOT DISCOVERABLE_IN_NORMAL_UI`; the version feature is a readable append-only changelog. Undocumented backend route schemes and deleted-dependency resolution through hidden history remain `UNKNOWN`, but they are outside the discoverable product flow and must not be guessed.
- Current confidence: visible history controls and current canonical sharing `VERIFIED`; hidden backend historical snapshot access `UNKNOWN / NOT DISCOVERABLE`.

## OQ-0039 — Export Artifact and Import Compatibility

- Question: What exact Markdown/HTML/TXT schema, assets, filename/encoding and import compatibility does Simulation export provide?
- EVD-0189 verifies the Settings export entry and entitlement wall. EVD-0197 independently verifies the Timeline panel's `导出` button reaches the same wall and produces no download before entitlement. The wall advertises Markdown/HTML/TXT, but no format picker, preview or file is exposed before membership; no payment was submitted.
- What remains unknown: actual artifact schema, attachment handling, metadata/version fields and any corresponding Import route.
- Current confidence: entitlement boundary and advertised formats `VERIFIED`; export artifact/import behavior `UNKNOWN`.

## OQ-0037 — Important Facts edit/delete and Rewind semantics

- Question: Are Simulation Important Facts included in Save checkpoints and timeline branches, or are they per-Simulation metadata outside Rewind?
- Observed: EVD-0143 saved a 32-character fact, persisted it across reload, injected it into the next Turn, and showed the same fact while viewing Turn 1 history. Returning to now preserved it; the tested historical view did not roll it back.
- Experiment: edit or clear the fact, create a checkpoint, rewind/fork across the edit, and compare fact text and AI behavior in source/branch saves.
- New evidence EVD-0143: checkpoint `/zh-cn/sim/e37cb018-c79c-40a0-9e91-8c70c4b2cccd` copied the original fact; editing it to `77777` left the source at `55000`, and independent Turn 3 responses used `77777` vs `55000`. Save-copy and source/branch isolation are `VERIFIED`.
- EVD-0144 resolved the Rewind boundary with user-mediated confirmation: checkpoint Turn 3→2 succeeded, but the edited `88888` Important Fact remained unchanged after restore. This confirms Important Facts are per-Simulation metadata outside Turn rewind.
- EVD-0234 closes the ordinary non-empty edit boundary: an unsaved replacement is discarded by closing Settings, the free textarea hard-caps at 200 characters, Save changes to `已保存`, direct reload retains the replacement, and a second save restored the prior value. There is no separate Cancel control in the panel.
- EVD-0251 resolves empty clear/delete: ordinary keyboard clearing leaves Save enabled; Save commits `0/200` immediately with no modal/native confirmation/delete-specific warning or Undo. Reload returns the empty value. Re-entering the original fact, saving and reloading restores the exact `34/200` baseline; neither transaction consumes a Turn or energy.
- Remaining experiment: only the advertised member 2000-character enforcement and opaque backend retention remain. They are entitlement/internal boundaries, not missing ordinary clear behavior.
- Current confidence: create/edit/discard/save/reload/checkpoint isolation/Rewind exclusion/free cap/empty clear/no-confirm/no-Undo/recovery `VERIFIED`; member 2000-character enforcement `ENTITLEMENT-BLOCKED`.

## OQ-0031 — Public Remix discovery-index convergence

- Question: How long after immediate Remix publication do unified Search/Explore indexes include the new World, and are there ranking/deduplication rules for multiple Worlds with identical titles/descriptions?
- Observed: Account-A L2 `/zh-cn/worlds/test-map-world-001-k4do` was directly public and immediately listed in owner Profile/Mine, but exact-title Search—including `tab=worlds` with `没有更多啦`—returned only L0, Account-B L1 and Account-B L2. The same query therefore omitted one valid public direct URL.
- Experiment: repeat the exact query after controlled intervals and after an explicit v2 publish/title change; compare another account and Explore/latest sort; record whether the result is delayed, capped/deduplicated, or owner/session-specific.
- New evidence EVD-0120: after a later wait/reload, the same full result route contained L0, Account-B L1/L2 and Account-A L2, followed by `没有更多啦`. The omission was therefore an asynchronous indexing delay, not permanent privacy. Exact convergence SLA/queue trigger/ranking remain UNKNOWN.
- Current confidence: asynchronous convergence `VERIFIED`; exact SLA and ranking `UNKNOWN`.

## OQ-0033 — Map faction-to-Character binding and marker lifecycle

- Question: Does a Map Editor faction relation persist into the World Draft/Published Map App, and is the linked World Character an alias, a copied runtime role, or only a display association? What state does a Map marker carry and how does it move/rewind?
- Observed: `/zh-cn/worlds/hogwarts-3bmx/edit#app-map` exposes 13 faction-row native selects with ten World-local Character options, a Map App-level `把地图上的阵营作为角色` switch, a `地图棋子（marker）` switch and `添加棋子`. Selecting `Lü Bu -> 哈利·波特` changed the live select value to `harry`; after `保存并退出`, both the original and a fresh tab remained at `Loading world` for at least 7 seconds, so the saved value could not be re-read.
- Required experiment: after the Creator load issue clears, reload and inspect the relation value; publish a disposable version, create/apply a fresh Simulation, compare Character State/Chat names and IDs, test duplicate bindings and toggle interaction, then add/configure/move a marker and compare Map state, Events, Turn cost, Save and Rewind.
- Current confidence: controls and local selection `VERIFIED`; persistence, publish/runtime identity, conflicts and marker behavior were initially `UNKNOWN / load-blocked`.
- New evidence EVD-0137: after a recovered Creator load, `Demons → 测试角色 001` survived Map Editor Save/Exit and a wait/reopen cycle, upgrading Draft persistence to `VERIFIED`. `添加棋子` still showed no modal, fields or list entry; published role identity, marker placement/runtime and duplicate-binding behavior remain `UNKNOWN`.
- New evidence EVD-0148–0149: published v9 region drawers and a region Turn are verified. Creator has two independent roleization checkboxes (World layer and Map-App layer); enabling the Map-App control does not toggle the World control. Both-on with no binding produces three Preview Chat entries (`Demon Slayer Corps`, `Demons`, separate `测试角色 001`). Rebinding `Demons → 测试角色 001` reduces Preview to `👹 测试角色 001` plus `⚔️ Demon Slayer Corps`. World v10 publication exposes the same single public Character card; applying v9→v10 to an existing Turn-4 save at zero Turn produces the same two Chat identities while preserving Story/Time. Alias/dedup is therefore `VERIFIED`.
- New evidence EVD-0151: marker creation/edit/reload/explicit-save, Preview rendering, v11 publication, zero-Turn old-save import, fresh-save initialization and runtime detail card are `VERIFIED`. Configured and AI-generated markers coexist. No direct runtime move/delete affordance was exposed.
- New evidence EVD-0153: after energy replenishment, submitting the marker command with Enter advanced Turn 1→2 and changed the configured marker from `滋贺 / 18k` to `京都 / 21k`. Historical Turn 1 showed the old marker values; user-mediated `恢复到此状态` returned the same UUID to current Turn 1, removed the Turn-2 Event/Story and restored `滋贺 / 18k`. Natural-language marker mutation and marker-inclusive Rewind are therefore `VERIFIED`. Structured marker Event rows, runtime delete/direct edit, exact native warning copy and fresh-v10 Character-State parity remain `UNKNOWN`.

## OQ-0034 — App owner lifecycle controls and non-owner rating/social side effects

- Question: Which App lifecycle controls (`编辑`, `删除`, `下架/取消发布`, version history) are owner-only, and how do rating, gift, comment and install actions affect notifications, usage counts and dependent Worlds?
- Observed: official detail `/zh-cn/apps/map` as the current test account exposes Preview/Reset with `预览 · 操作不会生效`, rating inputs, gift, comments/image/send and install, but no Edit/Delete/Downlist/version-management controls. Empty rating/comment submission remained disabled; no representational action was submitted.
- Required experiment: inspect a test-owned App detail for the owner control set, exercise save/publish/downlist/unpublish before deletion, and use a second account to observe rating/gift/comment/install notifications and dependent World state. Stop before payment and do not submit sensitive data.
- Current confidence: non-owner control absence, owner public `编辑/删除/安装`, first Publish and World install `VERIFIED`; downlist/unpublish and social side effects `UNKNOWN`.
- EVD-0145 replaces the prior pending-Publish state: owner first Publish completed without a modal, public detail exposed v1 plus Edit/Delete/Install, and the App installed into/published with owner World v9. No separate Downlist/Unpublish control was visible on the tested owner detail; whether it appears only after a later version or is modeled solely as permanent Delete remains open.

## OQ-0040 — Profile avatar validation and lifecycle

- Question: What file formats/sizes are accepted, does upload enter crop/preview, and how are save, reload, replacement, reset and failure represented?
- Observed: EVD-0209 identified a hidden `input[type=file][accept="image/*"]`. EVD-0217 completes the first real lifecycle: visible CTA opens the single chooser; valid 512/640 SVG auto-saves without crop/toast/`保存资料`, uses fixed `avatar.svg` plus changing `v`, persists on reload and propagates to public Profile; replacement works.
- Defect baseline: choosing a benign `.txt` through the same chooser produces no validation error but removes the old image and publicly falls back to the generic icon. A later valid SVG restores it.
- EVD-0222 adds benign 640×640 PNG and JPEG: both auto-save with no crop/Save/toast, survive Account reload, propagate to all three public Profile projections and use format-preserving `avatar.png` / `avatar.jpg` object paths with new cache versions. The final SVG restore also persists.
- EVD-0224 completes the normal-format portion of the required experiment: WEBP, animated GIF, 1200×300 wide PNG and EXIF Orientation=6 JPEG were all accepted, auto-saved and stored with matching `.webp`/`.gif`/`.png`/`.jpg` object extensions; no crop or orientation warning appeared. SVG was restored afterward.
- Remaining experiment: oversize/tiny/transparency fixtures, network failure and any discoverable deliberate Remove/Reset path; binary animation preservation and EXIF normalization remain UNKNOWN.
- Current confidence: SVG/PNG/JPEG/WEBP/GIF upload/replacement/public propagation and wide/EXIF acceptance `VERIFIED`; broader size/transparency/network/reset validation `PARTIAL`.

## OQ-0041 — Gift recipient and repeat-transaction gates

- Question: Why do Profile/World gifts settle while official and community App gifts fail, and why did one failed community-App sequence show a `-5` sender delta while another showed no net debit?
- Observed: EVD-0210 verified one 100 Profile gift `285→185`, recipient income `700→770` and donor count `1→2`. Official App `main-input` returned `礼物发送失败，请稍后重试。` twice with no debit. A repeat 100 and a lower 20 gift to the same Profile both opened `购买电量`; 185 remained. EVD-0227 later verified a 20 Profile gift to a different creator: `175→155`, income `14,140→14,154`, donor count `5→6`.
- EVD-0229 adds a community App (`微博`): the 20 gift failed, App/creator projections did not change, but sender balance was observed `145→140` with no intervening charged action, yielding a `-5` defect candidate. Its owner `World101` had successfully received the earlier 20 Profile gift, excluding creator-account ineligibility. A user-run second App attempt also failed. EVD-0230 then verifies an immediate 20 World gift succeeded from the same wallet: aggregate balance `140→120`, World supporter total `20`, creator income `14`, and linked donor rows on both surfaces. The second App failure therefore caused no observable net debit, and global wallet/outage explanations are excluded.
- Narrowed question: determine App recipient eligibility/configuration and whether the first `-5` is a fee, partial debit, asynchronous adjustment or non-reproducible defect. Also test same-recipient repeat after a fresh day/session, above-balance selection, notification deltas and non-integer 70% rounding; never complete real payment.
- Current confidence: two Profile settlements plus one World settlement, 70% projections, minimum tier, official/community App failure and cross-surface wallet contrast `VERIFIED`; first failed-App `-5` cause, second App identity, recipient-scoped repeat/anti-abuse rule, notification and rounding `UNKNOWN`.

## OQ-0042 — Price-aware Turn preflight and negative balances

- Question: Is underfunded-positive overdraft consistent across models, App surcharges and concurrent tabs, and when is the balance gate evaluated?
- Observed: EVD-0212 shows Deepseek 8/Turn at balance 1 committed a full Turn and persisted -7; only the next submission was blocked and discarded. Test quota recovery restored access without changing Turn 4.
- Required experiment: repeat once with an extra-App surcharge and once with two tabs only if sufficient disposable quota remains; compare client preflight, server settlement, duplicate submission and exact failure ordering.
- Current confidence: one deterministic positive-underfunded/negative-next-attempt sequence `VERIFIED`; generality and implementation cause `UNKNOWN`.

## OQ-0043 — Character Chat visible-Memory threshold and retrieval source

- Question: Why can a Character recall a Turn-2 secret at Turn 11 and checkpoint Turn 21 while its visible Memory panel remains empty through Turn 20?
- Observed: EVD-0213 ran 19 paid Character Turns with short and multi-paragraph content, inspected Memory at T7/T10/T11/T15/T20, reloaded the 60-paragraph transcript and branched from a T20 checkpoint. Recall remained exact; no visible summary appeared.
- EVD-0232 pushes the source beyond T20. Turn 21 remains empty; by Turn 25 one editable automatic summary appears, covering content through Turn 23 but omitting Turn 24/25. Appending a unique conflicting marker `橙铜-8842` persists across reload and the Turn-26 response uses it exactly over the transcript's older `蓝钴-7319`. The pre-existing checkpoint branch remains Memory-empty after the source edit.
- EVD-0233 extends the edited source through five more unrelated Turns. At T28/T30/T31+reload it still has exactly one unchanged `✦ 1`; new topics are not merged, and T31 again recalls the edited value. Manual content therefore survives at least five subsequent Turns, but eventual behavior remains open.
- Manus Phase 3 adds two independent external samples (`MANUS-P3-MEM-001`–`004`). Sample A is reported empty through T20; Sample B is empty at T15 and has one summary by T20, then reports one manually edited card through T35. Because account/Character/model/transcript differ and several checkpoint screenshots are byte-identical, this is cross-sample timing/persistence evidence rather than a matched replication. Its cited T29 recall screenshot does not show the query/reply, so the claimed original-fact answer is `REPORT_ONLY / SCREENSHOT_MISMATCH` and does not contradict EVD-0232/0233.
- Remaining experiment: do not run another undirected progression merely to reach T35. Observe a true second automatic batch/merge event, test maximum length/multiple summaries, or run a matched cross-model experiment with the same Character, transcript, manual conflict and recall prompt. Do not infer a fixed cadence from any one T15/T20/T21/T25 interval.
- Current confidence: pre-summary recall, main first visible-summary window/tail lag, edit→reload→AI injection, five-Turn main edit durability and checkpoint isolation `VERIFIED`; cross-sample variable timing and longer external visible persistence `NEW_EXTERNAL`; transcript retrieval implementation, eventual cadence/merge policy, matched cross-model precedence and generality `UNKNOWN`.

## OQ-0044 — Orphan History metadata after parent World deletion

- Question: How long does the owner-history record for a child Simulation survive after its published World and runtime are deleted, and can its remaining `删除` control fully clean the orphan?
- Observed: EVD-0221 verifies immediate World detail/edit/new and child UUID 404 plus Search/Works/Profile cleanup. Mine History still exposes the child UUID row with Rename/Delete. Renaming to `TEST Orphaned Child After World Delete 001` succeeds and persists across reload while the UUID remains dead.
- Required experiment: preserve the row for at least one later-session observation, then trigger its remaining Delete control with user-mediated confirmation and compare Mine History, any global recent-history projection and the former UUID. Also check another device/session only if normally available.
- Update: EVD-0223 completed the user-mediated orphan-row Delete. The row and same-shell History projection disappeared immediately and after reload; the former UUID remained bare 404 with no recovery UI.
- Current confidence: authoritative runtime deletion, mutable orphan-history split, and manual cleanup transaction `VERIFIED`; pre-cleanup retention duration, cross-device behavior, backend tombstone structure and administrative recovery remain `UNKNOWN`.

## OQ-0045 — One-time player identity snapshot, rewind and preset composition

- Question: Is committed `playerSetup` copied into checkpoints, restored/cleared by Rewind, and how do avatar, manual input, Persona/Style/Lore presets and World `/new` setup resolve conflicts?
- Observed: EVD-0236 verifies a real Simulation Settings control `设定我的身份 仅一次`. Account Persona selection copies exact name/persona values, Cancel preserves the opportunity, Save costs no Turn/energy, emits a success toast, hides the control across reload and exposes exact `playerSetup` to the runtime App while visible Memory remains empty. The next Turn semantically uses the identity.
- Contrast: the Account presets are durable and the Simulation-level Persona picker works, but the two World `/new` preset buttons still produce no visible selector or field mutation in repeated desktop/mobile checks. Treat this as a surface-specific no-op/defect candidate rather than globally unknown preset transfer.
- Update: a disposable v5 save was deleted to free the third slot. Turn-2 checkpoint `/sim/2b9a86c1-2925-4e60-9ea5-9f293e16d976` copies exact `playerSetup`, the consumed one-time lock and empty visible Memory at zero energy. Historical Turn-1 world-state viewing also exposes the current exact `playerSetup`, narrowing identity to metadata overlaid outside the historical snapshot. Native-confirm Restore Turn 2→1 then preserved exact identity/consumed lock and empty Memory while removing the Turn-2 Story; direct reload preserved all postconditions and energy 41.
- Update EVD-0249: manual form controls declare 40/600 name/persona maxima; the picker lists Persona only, not Account Style/Lore. Minimal/full preset copy, preset-over-manual replacement, later manual field override and Emoji avatar selection were executed. Manual Save was zero-cost, toasted success and consumed the lock across reload. In a World initialized with `身份=Alice`, Main Input and Character Chat did not surface the committed manual values; in a separate Map diagnostic World with no `/new` identity fields, the next Main Input Turn returned the exact manual name and identity text. This is a reproducible precedence conflict, not proof of backend data loss.
- Text-entry follow-up: the avatar `🙂 / https://…` textbox accepted exact `🧙‍♂️` + Enter and rendered that same symbol on the form, closing the coordinate-mismatch ambiguity for the input path. A synthetic sequential-key probe displayed 45 characters despite declared name `maxlength=40`; because browser automation can differ from native OS typing, this is retained as a boundary signal rather than a product defect verdict.
- Remaining experiment: verify native keyboard enforcement at 40/600 and avatar serialization through saved runtime/model behavior or upload; Style/Lore are `NOT OFFERED` on this picker rather than an unknown option.
- Current confidence: one-time Persona/manual/avatar form and exact emoji text-entry, zero-cost lock, next-Turn use in the EVD-0236 control, checkpoint/Rewind survival and the EVD-0249 precedence conflict `VERIFIED`; exact conflict arbitration, manual object storage in the conflicting sample, native keyboard limit enforcement, avatar model serialization and broader generality `UNKNOWN`.

## OQ-0046 — Achievement idempotency, removal and Profile propagation

- Question: after an Account×World achievement unlock is granted, what happens on duplicate triggers, App/definition removal, World deletion and Profile projection?
- Observed: EVD-0246 verifies one visible Copper plus one hidden Gold definition, a real two-grant charged Turn, reload synchronization, World-detail `2/2`, fresh-save inheritance, historical-view `0/2` and real Rewind retaining current/fresh/World `2/2` after the grant Events disappear. The owner Profile shows no ordinary custom-achievement section despite official App copy promising personal-Profile propagation.
- Update EVD-0247: re-triggering the exact condition consumed a normal 9-energy Turn (`371→362`) but source and World remained exactly `2/2`, with no duplicate row, overflow or visible toast after reload. Events retained one generic `打开成就` marker instead of the original grant Turn's two. Count/list idempotency is therefore `VERIFIED`; the residual marker's target and concurrent ordering remain unknown.
- Update EVD-0248: removal, uninstall/reinstall and version tombstones are now executed through v6–v10. Removed unlocked definitions remain in the World ledger and upgraded saves, but fresh saves use only current definitions. Uninstall hides the surface without revoking ownership; reinstall starts with zero rows. Same-name recreation creates a distinct locked identity. Existing-save updates preserve retired locked definitions (`3/4` after the new unique ID unlock), while World detail is current-schema plus unlocked history (`3/3`) and a native-v10 save is literal current schema (`1/1`). A generic `打开成就` Event can exist without a matching grant, and successful grant projection can lag until reload.
- Required experiment: delete/unpublish a disposable World after unlock and observe ledger/index lifetime; run true simultaneous/concurrent grants; recheck Profile after a later session and from another logged-in viewer; inspect Event payload/target only through normal UI if a named surface becomes available. Do not infer that Profile's scored completion-achievement showcase is the same object type.
- Current confidence: Account×World identity, Rewind exclusion, duplicate idempotency, definition removal, App uninstall/reinstall, same-name non-equivalence and old/current/fresh version projection `VERIFIED`; concurrent ordering, generic Event target semantics, World-delete ledger lifetime, Profile eligibility/delay and external visibility `UNKNOWN`.

## OQ-0047 — Maps catalogue snapshot variability and Base/All eligibility

- Question: Why did two same-day authenticated terminal crawls observe Base totals of 1,083 and 1,085, and what exact rule makes a World appear in `全部` but not `有底图`?
- Observed: main EVD-0244 recorded Base=1,083 for owner `x161880`. Manus Phase 3 retained terminal HTML and CSVs for `idakellams159`; independent local recomputation gives Base=1,085, All=1,181, intersection=1,085, All-only=96 and Base-only=0. The Manus run used three consecutive zero-growth bottom checks and contains zero repeated href rows. Genre pairs also differ between scopes.
- Interpretation: the All-strict-superset result is strong for that rendered snapshot. The two-card Base difference is `CONTRADICTORY_SNAPSHOT`, not proof of a bug or fixed account rule; time, identity, session/cache and main terminal procedure are all plausible but unproven.
- Experiment required: only if exact discovery semantics become architecture-critical, run two accounts in the same narrow time window with identical scope/query/viewport-independent three-no-growth termination, preserve both rendered HTML files and diff the exact hrefs. Do not spend time merely chasing a stable global count.
- Current confidence: 16-card silent pagination, Base/All separate membership and the external 96-href strict superset `VERIFIED/NEW_EXTERNAL` at captured-snapshot scope; exact ranking, inclusion cause, account dependence and count stability `UNKNOWN`.
