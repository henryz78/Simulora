# Character Lifecycle

研究状态：`PARTIAL / VERIFIED`  
测试对象：`TEST Character 001`（页面展示为本地化后的“测试角色 001”）。

## 创建

- 入口：`/zh-cn/characters` → `新建角色`。
- 字段：头像、名字、角色设定、公开简介、性别、最多 3 个类别、可见性。
- 角色设定明确标注为 AI 扮演依据；公开简介留空时会直接展示详细设定，可能泄露设定。
- 支持从 Komiko 角色链接导入。
- 私有可见性为会员功能；点击会打开订阅弹窗，免费账号无法选择。
- 创建成功后没有独立导航跳转，而是在角色库内出现公开卡片。

## 公开详情页

- 角色卡点击后在同页打开详情 Drawer。
- 展示：头像/首字母、名字、性别、标签、收藏数、作者、关注、公开简介、每回合电量范围、评论、排行榜、支持者。
- 作者本人可见：聊天、编辑、从角色库删除、改编、添加到世界。
- 本测试角色成本显示 `4–8 电量 / 回合`。

## 编辑

- 编辑复用创建表单；支持修改名字、设定、公开简介、性别、类别、可见性。
- 保存按钮提交后异步持久化；刷新并重新打开详情可见修改后的公开简介。
- 卡片列表曾短暂显示旧简介，说明列表缓存/刷新存在延迟，详情 Drawer 是较强的持久化证据。

## 改编

- 点击 `改编` 打开复制面板，预填名字与完整角色设定。
- 文案明确：保存后会在自己的角色库新建角色；各 App 中的配置（立绘、属性、开局数值等）会一并带走；原角色不受影响。
- 提供 `保存为我的角色` 与 `添加到世界` 两条出口。

### 多层改编实测

- 原角色 → `TEST Character Remix L1`：修改名字和角色设定后点击 `保存为我的角色`，toast `已复制到你的角色库`；Mine → 角色 → 我创建的中立即出现 L1。
- L1 → `TEST Character Remix L2`：L1 的详情仍提供 `改编`，同样可再次保存；Mine 列表中 L2 与 L1 同时存在，证明多层 Remix 没有被禁止或强制压平。
- Remix 详情继承原角色的公开简介、标签和每回合成本；作者仍显示当前账户。
- L1/L2 详情中未发现“改编自/来源/Original”可见 attribution，也未发现原角色链接。此处与 World Remix 自动 attribution 不同。
- Remix 详情样本没有作者原角色详情中的 `编辑` 与“从角色库删除”按钮；Mine 卡片也只有聊天/添加。EVD-0205 与同页普通 owned Character 对照后确认：普通 Edit 是不改 URL 的完整 in-card 编辑器，L1/L2/003 卡片和 Drawer 均不提供 Edit/Delete/More/href，因此 clone 在当前 UI 中是可运行、可再次改编但不可发现编辑/删除的 owned library object。

## 待补

- L1/L2 Remix Chat 与 World-local Character 的新 Simulation/Character State 运行态均已验证；Remix 对象无 normal-UI Delete，故中间父级删除实验为 `UNREACHABLE_IN_NORMAL_UI`；仍缺精确字段合并；
- 添加到 World 后与原角色更新/删除的关系均已验证为不传播；member-only 可见性与 republish 不适用/仍待独立账号补；
- Remix 对象为何没有编辑/删除入口；EVD-0225 再次确认 clone Mine card 是 button 而非稳定 href，Drawer 仅提供聊天/改编/添加到世界与社交控件，产品 UI 中仍 `NOT DISCOVERABLE` 为 edit/delete/parent attribution；仅内部原因/未公开 API 仍 UNKNOWN；
- History 中 tombstoned Chat 链接的保留周期与恢复/删除行为。

## Confidence

- 创建、公开页、编辑、会员可见性边界、改编面板：`TESTED`。
- 两层改编创建与公开 attribution 缺失：`TESTED`。
- Source update/delete → World-local/Remix copy isolation：`VERIFIED`。
- Source Chat 404 + History tombstone：`VERIFIED`。
- L1 descendant Chat after source delete：`VERIFIED`。
- L1/L2 Chat 与 fresh World runtime Character Chat/State：`VERIFIED`。

## 生命周期补样：测试角色生命周期 003

- 新建后直接进入角色库卡片/Drawer 模型；Card 与 Detail 没有独立 URL 跳转。
- 编辑公开简介并提交后出现 `角色已保存`；reload 后 Card 与 Detail 同时显示本地化后的 `编辑后的生命周期摘要 v2。`，证明编辑传播不是仅本地表单状态。
- 从 Card `聊天` 创建稳定 Character Simulation `/zh-cn/sim/b08c2af0-8ad3-473b-b2f1-6ca6d54a8e40`。快捷建议的第一次点击只把建议写入主输入框，仍需再次点击 `发送` 才真正产生 Turn。
- 实际发送后 Events 从开局的回合 1 增加到回合 2，并把 `你的行动` 与 `世界回应` 分区展示；reload 恢复完整对话。Memory 在回合 2 仍为空，明确提示每隔几轮自动生成总结。
- Detail 卡显示 `4–8 电量 / 回合`，Settings 显示当前账户/Simulation 电量 107；由于未先记录精确余额，本样本不用于证明扣费数值。
- 对该 source 执行新的 Character Remix，填写 `TEST Character Remix 003` 并点击 `保存为我的角色`，toast 确认 `已复制到你的角色库`。全局 Character Library 精确搜索在即时、短等待及 full reload 后仍未返回副本，但 Mine → 角色立即列出并可打开该 clone 的 Detail Drawer；详情复制公开简介并提供 `聊天/改编/添加到世界`，没有 `编辑/删除`。因此 clone 已持久化，缺口缩小为全局 Library 索引/直链和 edit/delete 边界。
- Evidence: EVD-0167, EVD-0225。

## Add-to-World 补样：测试角色生命周期 003

- Detail 的 `添加到世界` 打开同页选择器，列出当前账号的六个 World，并提供输入框创建新 World；选择目标后所有 World 按钮短暂 disabled，弹层关闭，不发生路由跳转。
- 选择 `TEST Template World 001` 后，目标 Creator reload 显示 `已恢复上次草稿`、`发布 v4` 和“有尚未发布的修改”。World-local Character 区出现 `测试角色生命周期 003`，包含源角色设定、性别、公示身份输入和 `允许玩家自定义这个角色`，Live Preview 的 Chat 列表也出现该角色。
- 目标 World 原公开版本为 v3，因此添加角色创建了待发布的 v4 Draft，而不是直接修改公开 v3。新增角色的 Publish、source 后续更新/删除传播和重复添加行为仍需单独验证。
- Evidence: EVD-0168。

## 添加到 World 实测

- Character detail `添加到世界` opens a selector of owned Worlds plus a textbox to create a new World.
- Selecting `TEST App Upgrade World 001` closed the selector; after refreshing the World editor, the Character appears in the Draft with copied name, full role prompt, gender choices, public identity field and `允许玩家自定义这个角色`.
- The World copy is editable independently in Creator. Editing its prompt to `World-local copy edited for propagation test.` auto-saved in Draft; reopening the source Character still showed the original public description and did not contain the override. Thus World-local edits do not mutate the source. Source→copy future-update and deletion propagation remain UNKNOWN.

### Source update propagation experiment

- Updating the reusable source role prompt and public intro changed only the source record. On owner Profile, the source card localized the new intro to `来源更新测试 0104`, while the World-local card retained `产品调查测试角色 · 已编辑`.
- The target World Creator still held `World-local copy edited for propagation test.` and did not contain the source marker. Existing World copies are therefore snapshots/owned local definitions, not live references to the global Character source.
- Source deletion was subsequently executed and did not alter the existing World-local definition; see the deletion section below. Fresh World-Simulation Character-state proof remains `UNKNOWN`.

## Visibility and detail-action boundary

- Editing the global source and selecting `私有 会员` opens a plan/entitlement modal (`把角色设为私有是会员功能`) rather than saving the change. Closing the modal and editor leaves the source public/searchable. The non-member test account therefore cannot establish the post-payment state; do not infer that a member-only visibility option is absent.
- The Character detail page's bottom `聊天` control was disabled in the source-owner run, while library cards still exposed a `聊天` action. The difference is recorded as an unresolved route/ownership state rather than assuming Chat is universally unavailable.

## 删除确认

- Owner detail has a trash control exposed as `从你的角色库中删除这个角色?` in both the card and detail footer.
- Clicking the detail control triggers a native browser `confirm` dialog. An earlier pass dismissed it; the final lifecycle pass accepted it. Message text is not exposed by the Browser API, so exact wording remains `UNKNOWN`.

## 最终删除与级联实测

- 删除全局 source `测试角色 001` 后，页面留在 `/zh-cn/characters`，没有 toast、redirect 或 undo。
- 刷新后 source 卡片、source intro `来源更新测试 0104` 和 source 删除控件消失；Character Library 与 Unified Search 只剩 World-local 同名记录。
- L0 published World、三个 World Remix 后代以及 L0 Creator 的 World-local name/prompt 全部保留；没有观察到由 Character source 删除触发的新 World 版本。
- `TEST Character Remix L1` 与 `TEST Character Remix L2` 继续存在，证明 Character Remix 也不是对 source 的 live reference。
- Source 自身独立 Chat save `/zh-cn/sim/33c8dcf4-5581-4a0e-8f52-fa9aefdcd4a5` 变成 404；但侧栏 History 仍保留 `测试角色 001 · char:5825c6db-0e49-4e87-ab42-c4473e713e7d · 回合 1` 链接。
- 因此 source 生命周期与复制对象生命周期分离，而 source Chat Simulation 与 source 的删除绑定；索引清理与资源解析不是事务性同步。
- Evidence: EVD-0123.

## Source 删除后的 Remix Chat

- 在 Mine → Works → Character → Created 中精确定位 `TEST Character Remix L1`，点击其卡片内 `聊天`，创建/打开稳定 Chat UUID `/zh-cn/sim/9cb26802-ff99-4c4a-b565-538184a2e728`。
- 实际提交一轮后，角色以 `TEST Character Remix L1` 身份回复；直接重新导航到同一 UUID 后对话仍完整保留。
- 因此 L1 不是 source 删除后仅残留的展示卡，而是拥有独立 runtime/persistence 的可运行 Character 副本。
- Evidence: EVD-0124.

- 对 `TEST Character Remix L2` 重复精确卡片 Chat，得到稳定 UUID `/zh-cn/sim/e53f58ad-f97f-430f-87a3-f06e343ce1dd`；提交实际 Turn 后明确以 `TEST Character Remix L2` 身份回复，reload 后完整保留。
- 因此两层 descendant 都已证明为可独立运行和持久化的副本，而不是 source 删除后的展示残影。
- Evidence: EVD-0127.

## Source 删除后的 World-local runtime

- World `/zh-cn/worlds/test-map-world-001-gytp` v7 安装 Chat 后创建全新 Simulation `/zh-cn/sim/fd370969-d790-4035-a581-b46b88a9cd15`；新局自动出现 `测试角色 001` 私聊，实际 Chat Turn 1→2 后角色正常回复，reload 保留。
- v8 再安装 Character State；已有 v7 save 显示更新 modal，零 Turn Apply 后保留 Turn 2/Story/Chat/Map，同时 Character State 出现 `测试角色 001` 条目。
- 连续快速安装两个 App 时出现 `草稿已在其他页面更新,点击刷新后继续`；刷新保留服务器已稳定的 Chat、丢失尚未稳定保存的 Character State，因此分 v7/v8 发布。这是 Creator autosave 并发冲突，不是 Character source 级联。
- Evidence: EVD-0128.

## Character Chat save identity and broken share route

- A `TEST Character Remix 003` Drawer Chat resolves to stable Simulation UUID `/zh-cn/sim/909c07cf-58bb-43d6-9211-aaf423c99a34`, survives reload and appears under Mine → History → Character alongside L1/L2 Character saves.
- Save rename changes the Mine row heading and Simulation document title, but the row subtitle and Settings heading keep the Character name. Save identity and Character identity are therefore separate.
- Settings → Share for both the Remix sample and a non-Remix lifecycle Character emits `/zh-cn/worlds/char:<uuid>` links. Both exact links return owner-side 404, and the Remix composer reports poster generation failure. Treat the visible share workflow as a reproducible broken output, not a verified public Character detail route.
- Normal owned Character Edit expands complete fields inside its Mine card without changing `/zh-cn/sims`; L1/L2/003 lack the corresponding card control and their Drawers lack Edit/Delete/More/stable href. No discoverable alternate lifecycle route exists.
- EVD-0215 rechecks 003 after its long T20/T21 runtime experiment: exact `/characters` search still shows `还没有角色`, and Unified Search's explicit Character tab (`tab=chars`) shows `暂无匹配结果`. The earlier omission is therefore reproducible across separate discovery surfaces and later fresh navigation, while Mine/Chat remain durable.
- Evidence: EVD-0198, EVD-0199, EVD-0205.
