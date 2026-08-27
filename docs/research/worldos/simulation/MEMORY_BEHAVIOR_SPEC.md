# Memory Behavior Specification

研究状态：`PARTIAL`  
最近更新：2026-08-25  
主实验存档：`TEST Simulation 001`  
URL：`https://worldos.cc/zh-cn/sim/d66ac97e-104f-463e-bf3c-9f35d3c6a496`

## 已验证结论

### 1. 自动生成阈值依赖内容/World，不是固定 Turn 10

- Turn 4、5、6、8 打开“记忆”均显示：`暂无记忆。每隔几轮会自动生成总结。`
- 完成 Turn 10 后自动出现第 1 条记忆，以 `✦ 1` 标识。
- 第二个 Map/strategy-heavy sample (`Demon Slayer`) at Turn 6 already has `✦ 1`. Its summary includes three Map battles, Wallet rewards, items, Chat with 富冈义勇, and two Shop purchases.
- Therefore Turn 10 is not a global fixed threshold. Generation likely depends on accumulated context/content length, World configuration, or a variable interval. Exact trigger remains UNKNOWN.
- Confidence：`TESTED`。

### 2. 摘要覆盖范围

Turn 10 的首条摘要覆盖：

- 主角外观/年龄；
- 奥利凡德购杖及价格；
- 摩金夫人购袍；
- 德拉科遭遇；
- 丽痕书店询价但未购；
- 当前行李整理和待购计划；
- 赫敏对“来自未来”秘密的回信；
- 钱包余额；
- NPC 关系/好感。

这证明 Memory 是跨多个 Turn、跨 Story/Chat/Wallet/Inventory/Character State 的压缩叙述，而不是仅复制最后一轮 Story。

### 3. 摘要可能包含概括偏差

- 摘要写“购得三套一年级校袍（5加隆）”，可见 Inventory 卡片只显示一个“霍格沃茨校袍（一年级）”对象；Turn 10 Story 又写“黑色校袍×3”。
- 摘要把地点概括为“九又四分之三站台前度过对角巷采购日”，而实际多数 Turn 发生在对角巷/破釜酒吧。
- 因此 Memory 不应暂时视为权威结构化状态；它更像供模型使用的有损压缩文本。
- Confidence：`TESTED`（偏差已观察）；内部生成算法：`UNKNOWN`。

### 4. Memory 可编辑

- 每条 Memory 右侧有“编辑”。
- 编辑态是一个文本框，显示当前摘要。
- UI 明示：`修改会同步给世界的 AI。`
- 有字符计数，当前样本显示 `251/351`。
- 操作有“取消”和“保存”。
- EVD-0214 将一条 World Memory 替换为唯一口令 `银槐-5521`；保存后立即显示、reload 后仍保留。下一 Turn 只询问长期记忆中的口令，世界 AI 精确只回答 `银槐-5521。`，Turn 10→11 且按所选模型扣费 `63→53`；再次 reload 后 Memory 和回答同时保留。
- 因此 Memory 不只是可编辑的显示文本，而是用户可直接干预并持久化的 World AI 上下文对象；提示 `修改会同步给世界的 AI。` 已由实际下一 Turn 行为验证。
- Confidence：保存/持久化/下一 Turn 注入 `VERIFIED`；多条优先级、长度边界、不同模型和取消 dirty edit `UNKNOWN`。

### 5. 历史查看与当前 Memory 混合

- 在 Turn 10 已生成 Memory 后，从 Events 进入 Turn 2 的“查看这一轮的世界状态”。
- Story、Wallet、Inventory、World State 显示 Turn 2 值；但 Turn 10 才生成的 Memory 仍显示在 Turn 2 历史视图。
- 因此只读历史视图至少对 Memory 使用当前态，而不是该 Turn 的完整历史快照。
- 真实 Rewind 已由 Social Turn15→6 样本验证：Memory 2/3 随后续 Story/Stats/Relations/Chat/Instagram 一起删除，只保留目标 Turn 已存在的 Memory 1。Character Chat 则没有历史 Restore 控件。
- Confidence：`TESTED`。

### 6. Character Chat 的长期召回不依赖可见 Memory

- EVD-0213 在独立 Remix Character Chat 的 Turn 2 植入唯一秘密 `蓝钴-7319 / 最喜欢的月亮颜色`，之后运行八个无关主题回合。
- Turn 11 精确召回秘密；继续到 Turn 20、reload 和复制为 checkpoint 后，分支 Turn 21 仍能精确召回。
- 该 Character Chat 在 Turn 7、10、11、15、20 的 Memory 面板始终是 `暂无记忆。每隔几轮会自动生成总结。`。
- 因而“对话能长期召回”和“用户可见 Memory 摘要已生成”是两个独立机制/状态。黑盒无法区分它来自完整 transcript context、隐藏摘要或其他检索层，保持 `UNKNOWN`。

### 7. Character Chat 的首条可见摘要、编辑注入与分支隔离

- EVD-0232 继续同一源 Character Chat。Turn 21 仍显示 `暂无记忆`；到 Turn 25 时出现首条可编辑摘要。
- 该摘要覆盖最初秘密和大量话题至 Turn 23，但未纳入 Turn 24/25，证明自动 Memory 是批次生成并带有尾部滞后；仅凭此样本不能断言固定每四轮生成。
- 在摘要末尾追加 transcript 中从未出现的冲突标记 `橙铜-8842 / 最喜欢的太阳颜色`，保存后 reload 精确保留。Turn 26 只询问最新有效值，AI 采用了 Memory-only 标记，而不是 transcript 中的旧值 `蓝钴-7319`。
- Turn-20 checkpoint 分支在源存档生成并编辑 Memory 后仍显示空态，证明该 Memory 对象按 save/branch 隔离，而不是 Character 全局共享。
- EVD-0233 再继续五轮至 T31。T28/T30/T31+reload 始终只有原 `✦ 1`，手工尾部未被覆盖，新五轮话题未被并入；T31 仍准确召回 `橙铜-8842`。因此手工编辑至少可稳定跨五个后续生成 Turn，是否永久抑制/延迟下一批仍 UNKNOWN。
- Confidence：首条摘要窗口/覆盖滞后、编辑保存/reload、下一 Turn 注入和 checkpoint 隔离 `VERIFIED`；下一自动批次如何 merge/overwrite 手工文本、最大长度、多条优先级和跨模型一般性 `UNKNOWN`。

### 8. Manus 独立样本：阈值差异与更长可见持久化

- 外部账号 `idakellams159` 的 Manus Phase 3 运行了两个与主实验不同的公开 Character Chat。Paul Banks 样本在报告的 T20 检查点仍为空；Mingyu 样本在 T15 为空、到 T20 已出现一条可编辑摘要。主样本则是 T21 仍空、T25 已出现。因此可见摘要的首次出现不能写成固定 T20/T25 规则。
- Mingyu 样本使用界面明确选中的 `Civilization 1`（8/Turn），而主样本使用 Deepseek（4/Turn）；账号、Character、Simulation、模型、transcript 和 prompt 全部不同。该结果属于跨样本复现，不是对主样本的等价重复。
- Mingyu 的人工标记 `MANUAL_CONFLICT_B` 在一次 reload 后继续可见，并在 Manus 时间线中一直报告到 T35，期间仍只有一张 Memory 卡。这将“手工内容可长期保留”的外部观察下界推进到十五个后续 Turn，但若干检查点截图是字节级相同的同一 Memory 表面，Turn 关联主要依赖报告/原始日志，证据强度低于主实验的逐 Turn/电量链。
- Manus 报告称 T29 的一次召回仍回答原始 folded-ticket 事实而没有采用人工标记；其引用截图没有显示该 query/reply，因此只能标为 `REPORT_ONLY / SCREENSHOT_MISMATCH`。它不推翻主样本 T26/T31 的精确注入结果，只说明“可见人工 Memory 必然支配每个 Character/模型回答”尚未普遍验证。
- 外部证据：`MANUS-P3-MEM-001`–`004`；完整质量判定见 `12_MANUS_CROSS_AGENT_MERGE.md`。

## 可复现步骤

1. 创建或打开一条新 Simulation。
2. 连续执行低扰动动作并在 Turn 4、5、6、8 打开“记忆”。
3. 完成 Turn 10，等待所有 App 响应结束。
4. 打开“记忆”，观察 `✦ 1` 与摘要文本。
5. 点击摘要右侧“编辑”，将文本替换为一个不在提问中泄露值的唯一标记；点击“保存”并 reload。
6. 下一 Turn 只询问该标记的值，记录回答、Turn 与电量差；再次 reload 检查 Memory 与回答。
7. 另一次运行中打开“事件”，选择 Turn 2，点击“查看这一轮的世界状态”。
8. 对照早期 Story/Wallet/Inventory 与当前 Memory。

## 待验证实验

| Experiment | Question | Required evidence | Status |
|---|---|---|---|
| MEM-02 | 后续摘要在第几 Turn 生成、如何合并手工编辑 | Turn 26+ 连续检查并比对文本 | PARTIAL；主样本首条在 T21–T25 窗口出现，手工编辑后五轮至 T31 未出现第二条/merge/overwrite；外部不同模型样本报告到 T35/十五个后续 Turn 仍一条，但时间线证据较弱 |
| MEM-03 | 编辑 Memory 后是否影响下一 Turn | 写入唯一标记，reload，再用不泄露值的问题询问 World AI | VERIFIED；EVD-0214 下一 Turn 精确召回 |
| MEM-04 | 真实 Rewind 是否回滚/删除当前 Memory | Turn 10 → Turn 2 restore 前后对照 | VERIFIED for World/Social; Character Chat 无历史 Restore 控件 |
| MEM-05 | 分支存档是否复制 Memory/recall | 打开 checkpoint、独立续写和召回 | TESTED；T20 checkpoint 复制 recall，源 T25 后生成/编辑 Memory 不反向传播，branch T21 仍空 |
| MEM-06 | 不同 World/Character 的阈值是否相同 | 社交、策略、地图、独立 Chat 对照 | PARTIAL；主 Character T21 空而 T25 出现首条；Manus A 报告 T20 仍空，B 为 T15 空/T20 已出现，进一步反证固定阈值 |
| MEM-07 | Memory 与 Character Chat 的长期召回关系 | unique secret → unrelated Turns → recall/checkpoint → conflicting Memory edit | VERIFIED through T26；visible Memory 直接影响回答，pre-summary retrieval source仍 UNKNOWN |

## 产品复现要求

- Memory 必须是独立可见面板，有“无记忆”空状态。
- 必须支持周期性自动摘要，并允许多条编号/序号显示。
- Memory 文本必须可编辑、可取消、可保存，并明确会影响 AI。
- 保存后的 Memory 必须持久化并进入后续 World AI 上下文；测试不能只验证控件或提示文案。
- 产品数据模型必须区分“用户可见长期摘要”与“模型仍可从当前对话上下文召回”；不能用空 Memory 面板推断角色已经遗忘。
- Character Memory 必须按 Simulation/checkpoint 分支隔离；源存档未来生成或编辑的 Memory 不应静默传播到旧 checkpoint。
- 自动摘要应允许尾部滞后；实现和测试不能假设每个 Turn 实时重写。手工编辑如何与后续自动批次合并必须显式定义。
- 不应把单一样本中“手工 Memory 控制下一回答”推广成每个模型/Character 的绝对优先级；Parity QA 需要相同 Character、transcript、人工冲突值和 recall prompt 的匹配跨模型实验。
- 历史查看与真实 Rewind 必须区分；当前 WorldOS 的历史查看呈现出“早期状态 + 当前 Memory”的混合语义，不能假设所有对象都随历史快照切换。
