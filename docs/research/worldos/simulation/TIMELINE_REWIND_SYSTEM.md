# Timeline / Rewind System

研究状态：`TESTED / SOCIAL BRANCH VERIFIED`  
主实验存档：`TEST Simulation 001`。已从 Turn 10 真正恢复到 Turn 2，并从恢复点继续生成新的 Turn 3。

## 入口与导航

- 顶栏“事件”打开 Timeline 面板。
- 视图模式：`按轮次` / `按时间` / `按主线`。
- 面板提供“导出”；EVD-0197 已实际触发，结果与 Settings 导出一致：在生成文件前打开会员墙，广告格式为 Markdown/HTML/TXT，免费账号没有格式选择或下载。
- 时间点按钮使用世界时间文本，例如 `1991年8月第4周`；多个 Turn 时间相同，因此按钮文本本身不能唯一识别 Turn。
- 选中时间点后显示该 Turn 的“你的行动”“世界回应”和可见 State Delta。
- 可点击“查看这一轮的世界状态”。

## 历史状态模式

进入后顶栏显示：

`正在查看历史状态 · 回合 N · 世界时间`

并提供：

- `从这一轮创建存档点`
- `恢复到此状态`
- `回到现在`

### 输入锁定

- 主输入框、语音输入、发送全部 disabled。
- 提示：`查看历史状态时不可操作——回到现在后才能继续游戏`。
- Story 的上一轮/下一轮导航仍可使用。

### Turn 2 历史状态实测

| Surface | Turn 10 current | Turn 2 historical view | Result |
|---|---|---|---|
| Story | 行李整理/备忘录 | 奥利凡德购杖 | switched |
| Wallet | 38 | 43 | switched |
| Transactions | 杖 -7、袍 -5 | 杖 -7 | switched |
| Inventory | 通知、清单、魔杖、校袍、备忘录 | 通知、清单、魔杖 | switched |
| World State: wand | 紫衫木魔杖 | 紫衫木魔杖 | switched/consistent |
| Chat | 赫敏 Turn 4 回复可见 | 赫敏无消息 | switched |
| Memory | Turn 10 自动摘要 | 同一 Turn 10 摘要仍显示 | **not switched** |
| Extra Shop App | Turn 4 后安装 | Dock `🛍️` 仍显示 | **current client projection; not proof of persisted config** |
| Time | 1991年8月第4周 | 同文本 | inconclusive |

由此推断只读历史状态不是全对象的统一快照。至少 Memory 和 App Dock 会继续使用当前客户端投影。EVD-0204 证明 Dock 可在真实 Rewind 后短暂残留但不再对应有效安装/计费，因此不能仅凭 Dock 推断 App 配置层。该结论不等同于真实 Rewind 行为。

## Events 的 Delta 语义

已观察 Delta 示例：

- `Trunk · + 紫衫木魔杖`
- `wallet · balance -7`
- `wallet · + transactions`
- `魔杖 = 紫衫木魔杖`
- Character 的好感/关系初始化；
- Newspaper 的 lead reset；
- Story/电影 prompt 和自然语言响应。

Events 是用户审计每轮跨 App 状态传播的主要表面，不只是剧情日志。

## 真实 Rewind 实测

Social 分支补充：美国高中样本的 11 节点历史中，从 Turn 6 创建 `TEST Social Rewind T6 Branch 001` 会生成新 UUID `/zh-cn/sim/05c4acfa-4d02-4f29-857a-30928bca8dcd`。分支初始只保留 Memory 1、Turn 6 Story/stats/relations/social 状态，Memory 2 与 Turn 10/11 内容不存在。继续运行四个明确不使用手机/群聊/社交媒体且不与人交谈的回合后，Chat/Instagram 没有新增内容；分支在 Turn 10 仍只有 Memory 1，到 Turn 11 自动生成了新的 Memory 2。该摘要概括分支的断联学习经历和自身属性变化，并非复制源存档 Memory 2，说明 fork 会从自己的后续事件流重新开始生成长期摘要。

主存档直接 `恢复到此状态` 的早期自动化尝试曾在 Turn11→6 边界挂起。随后由用户在浏览器原生确认框中完成确认，并通过同一 UUID 的刷新与后置状态对照完成验证：源存档从 Turn15 回到 Turn6，Story/Stats/Relations/Memory/Chat/Instagram 和历史节点均截断到 Turn6，主线可继续操作。该结果将 Social in-place restore 从 `UNKNOWN` 升级为 `VERIFIED`；早期挂起保留为浏览器自动化边界证据，不再代表产品失败。

## Confirmation-handling audit

该异常不是所有二次确认操作的全局失败。已有样本可分为三类：

- 浏览器原生 `confirm` 且成功：Time App 源存档 Turn 6→2 的恢复已接受确认，并由 Turn、时间、Story、Memory、未来节点截断和 reload 共同复核；Global Character source 的最终删除也已接受确认，并由 Library/Search 消失、source Chat 404 和副本继续存在复核。
- 网站内 Modal 且成功：App 最终删除和 Simulation 永久删除都已点击最终按钮，并由详情/列表消失、直接 URL 404、依赖 World cleanup/recovery 等后置状态复核。取消路径也分别验证会保留对象。
- 浏览器原生 `confirm` 的早期自动化挂起：Social main save Turn11→6 共三次、Important-Facts checkpoint Turn3→2 共两次。之后用户分别完成确认，后置验证证明两个恢复都提交成功；Important Facts 保留 `88888`，Social 的 Turn/Story/Memory/Stats/Relations/Chat/Instagram/时间线则回到 Turn6。EVD-0204 使用当前 Browser dialog API 已能直接识别并 accept 同类 Rewind confirm，说明该限制属于早期工具能力/会话边界，不是长期必然阻断。

结论：早期确认框控制问题不应反向污染已经通过后置状态验证的删除或 Rewind 结论。当前优先使用 dialog API 识别/处理并继续做同一 UUID、刷新、列表和状态对照；只有 dialog API 再次不可达时才需要用户接管。

## User-mediated Social Rewind postconditions

在 `TEST Social Mode Phone 001` 上，用户确认 Turn15→Turn6 后：

- 顶栏和直链刷新均为 `回合 6`，主输入重新启用；
- Story 回到 Turn6 的派对穿搭讨论，Stats 回到 `Popularity 28 / Grades 70 / Mood 80 / Style 50 / Money 60 / Stress 44`；
- Relations 恢复 Turn6 快照（Riley 91、Sienna 15、Quinn 21、Dre 10、Jax 5）；
- Memory 只剩 `✦ 1`，`✦ 2`/`✦ 3` 消失；
- Chat/Instagram 回到 Turn6 可见内容，Turn7–15 产生的后续消息和 Week2 内容消失；
- Events 时间线只剩六个 Week1 节点，Week2 节点不再出现；
- 没有返还已消耗 Credits，确认与刷新本身不消耗 Turn。

Important Facts checkpoint 同步验证：Turn3→2 回退后事实 `EVD-FACT-REWIND-003: 江夏基线改为 88888。` 仍存在，说明该字段不属于可回退的 Turn snapshot。

保护性 checkpoint：`TEST checkpoint T10 before rewind`，独立 URL `/zh-cn/sim/b3bc5be9-fb87-425a-b7ef-90d53f711501`。

主存档从 Turn 10 恢复到 Turn 2 后：

- 顶栏立即显示 `回合 2`；
- Story 回到奥利凡德购杖；
- Wallet 回到 43，交易只保留 `+50` 与魔杖 `-7`；
- Inventory 只保留通知书、装备清单与魔杖；
- 校袍与 Turn 10 备忘录消失；
- Character/World State 回到 Turn 2；
- 赫敏的后期 Chat 回复从当前分支消失；
- Events 只显示 Turn 1–2，旧 Turn 3–10 不再出现在主时间线；
- Memory 显示 `暂无记忆`，即 Turn 10 自动摘要被清除；
- Turn 4 后安装的 Shop App 在恢复后的当前渲染中仍短暂出现在 Dock；EVD-0204 后续受控复现推翻了“配置永久保留”的解释：模型成本先恢复为基础价、下一 Turn 不计 +2，reload 后 Dock 消失。它是 Rewind 后未即时失效的前端投影；
- 账户 Credits 仍为 522，没有返还已消耗回合费用。

从该恢复点提交新行动后：

- 生成新的 `回合 3`，不是 Turn 11；
- Events 只有 Turn 1、2 和新的 Turn 3；
- 新 Turn 3 的 Story、Wallet、Inventory、属性 Delta 均来自新行动；
- UI 没有显示分支树、旧分支标签或可返回旧 Turn 3–10 的入口；
- 因此真实 Rewind 的用户可见语义是截断当前主线并覆盖式续写，而不是显示多分支时间树。

Turn 10 checkpoint 在 Rewind 与新 Turn 3 之后仍可独立打开，保持 Turn 10 Story、Wallet 38、校袍、Chat 和记忆前状态，证明 checkpoint 不受源 Simulation 后续 Rewind/续写影响。

## Time App Rewind Confirmation

A second independent sample used the published Time App:

- Source advanced through Day 1 08:00 → Day 1 08:20 → Day 2 06:30 → Day 32 08:00 → Day 398 07:30 → Day 398 08:15 across Turns 1–6.
- Timeline displayed every time node and exact Turn mapping.
- `恢复到此状态` uses a native browser `confirm` dialog. Accepting restore to Turn 2 reset current time to Day 1 08:20 and removed later Turn 3–6 from the source timeline.
- Memory returned/remained empty, Story returned to Turn 2, and the source was interactive again.
- Current App v8 HTML remained installed after rewind, reinforcing that App definition/configuration is not part of the Turn snapshot.
- A Turn 5 / Day 398 checkpoint remained independent and continued to its own Turn 6 after the source rewind.

Evidence: `EVD-0089`.

## Marker-inclusive Rewind sample

Fresh World v11 Simulation `/zh-cn/sim/b64fd305-dd79-4a49-9aff-eab62b212051` provided an independent Map-state sample:

- Turn 1 configured marker: `测试标记 001`, Shiga, badge `18k`.
- A natural-language action advanced to Turn 2 and changed the marker to Kyoto, badge `21k`; World time stayed Day 1 08:00.
- Historical Turn 1 displayed Shiga/`18k` and locked main input.
- After user-mediated native confirmation, `恢复到此状态` made Turn 1 current again, removed the Turn-2 action/response from Events, returned Story to opening content, re-enabled input and restored Shiga/`18k`.
- This verifies Map marker location and badge are included in the in-place Rewind snapshot. Exact confirmation copy remains unavailable to browser automation.

Evidence: `EVD-0153`.

## Dynamic App installation boundary after Rewind

EVD-0204 used the same Hogwarts save to isolate the earlier `522 → 514` discrepancy:

- At Turn 3 with no Shop, installing Shop increased all displayed model prices by 2; Deepseek became `10/回合`.
- The next Turn charged exactly 10 (`303 → 293`).
- Restoring to the pre-install Turn 3 did not refund energy. The current render temporarily retained `🛍️`, and the Installed list temporarily labeled Shop `世界自带`, but the model menu immediately returned to the base `Deepseek 8/回合`.
- Continuing from the restored point charged exactly 8 (`293 → 285`). A direct reload then removed the Shop Dock while preserving the new Turn and 285 balance.

Therefore the active dynamic-App installation and surcharge participate in the rewind boundary when the target snapshot precedes installation. A visible Dock immediately after restore is not authoritative until reload/config-cost reconciliation completes. This closes OQ-0007 and classifies the transient retained Dock as a UI consistency defect candidate.

## Achievement ownership boundary

EVD-0246 separates historical rendering from durable achievement ownership:

- a charged Turn moved a configured World from `0/2` to `2/2` after reload and emitted two grant Events;
- an independent fresh Simulation of the same World inherited `2/2` before re-triggering;
- historical viewing of the source's prior Turn displayed snapshot-era `0/2`;
- accepting Restore changed the source from Turn 2 back to current Turn 1 and removed the granting action, Story and grant Events;
- current source, fresh save and World detail nevertheless remained `2/2`;
- energy was not refunded.

Achievement definitions remain part of the applied World version, but Account×World unlock records sit outside the rewindable Turn snapshot. A historical panel is therefore not authoritative for current unlock ownership.

## Character Chat historical-view boundary

EVD-0213 establishes a narrower Timeline contract for independent Character Chat:

- Events lists every Turn and `查看这一轮的世界状态` switches the transcript to the selected historical prefix.
- Composer, voice and Send are disabled with the normal historical-state placeholder.
- Unlike full World Simulation, no `恢复到此状态`, `从这一轮创建存档点` or `回到现在` control/text is present; the current-state `创建存档点` control is disabled while viewing history.
- Selecting the current latest Turn exits historical state and restores current controls.
- A current-state T20 checkpoint can still be named and created; it gets a distinct UUID, copies all transcript/recall state and continues independently.

Therefore Timeline viewing, current-state checkpointing and in-place Rewind are separate capabilities. Character Chat has the first two in the tested build, but historical Rewind/fork is `NOT DISCOVERABLE_IN_NORMAL_UI`.

## Confidence

- Timeline 浏览、历史查看和跨 Surface 对照：`TESTED`。
- 真实 Rewind 与续写：`TESTED`。
- 内部快照/事件存储实现：`UNKNOWN`。
