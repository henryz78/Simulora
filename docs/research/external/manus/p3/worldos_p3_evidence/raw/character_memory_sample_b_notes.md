# Character Memory Sample B run notes

## Identity and baseline

Sample B is the public Character Library entry **Mingyu (SEVENTEEN)**. The observed card source was `偶像团体`, which differs from Sample A’s visible `NYC` source. The public card did not expose the author identity or an explicit Remix/non-Remix label, so both attributes remain **UNKNOWN**. The Owner `idakellams159` opened an independent fresh chat at `https://worldos.cc/sim/6062b6fa-f28c-4406-ac79-3092e05f8f29`.

Before any controlled B input, `Settings > Memory` visibly stated: `No memories recorded yet. Summaries appear every few turns.` The baseline screenshot is `/home/ubuntu/screenshots/worldos_cc_2026-08-25_09-11-27_5790.webp`. The visible balance label at the baseline Settings view was `Zaps 666`; this is only a UI observation and is not interpreted as price or billing semantics.

## Model-variation availability check

At the fresh B Settings view, the visible **World Model** section listed official alternatives `Civilization 1` (8/turn), `Civilization 1 Small` (4/turn), and `Deepseek` (4/turn). It also showed `Freedom Pass · no Zaps` but no selectable zero-cost model, and `No BYOK models yet`; the only related link was `Add / get more models`. No model setting was changed because no clearly free second official option was shown, and no paid, membership, or BYOK path was opened. The model-variation branch is therefore **MODEL_VARIATION_NOT_AVAILABLE** for the currently visible free-account UI. Evidence: `/home/ubuntu/screenshots/worldos_cc_2026-08-25_09-34-56_3693.webp`.

## T20 首条自动 Memory 与人工冲突编辑（2026-08-25）

- T15 检查仍为 `No memories recorded yet. Summaries appear every few turns.`；T20（含三段相连的长文本）检查出现 **1** 条可见自动 Memory。因此首条可见 Memory 的观察范围仅能界定为 T15 与 T20 两个检查点之间（含 T20），不能推导精确固定阈值。
- T20 Memory 摘要覆盖早期练习、橙色笔记本、雨街、折叠车票、晚餐、木炭铅笔和后来相处场景；可见 Edit 入口。截图：`/home/ubuntu/screenshots/worldos_cc_2026-08-25_09-46-42_8418.webp`。
- 经正常 Edit UI，将该 Memory 的单一事实短语 `folded train ticket` 替换为显式冲突 token `MANUAL_CONFLICT_B`，点击可见 Save 后 Memory 卡恢复只读显示且含该 token；截图：`/home/ubuntu/screenshots/worldos_cc_2026-08-25_09-48-07_4765.webp`。
- 随后通过正常浏览器重载，仍见同一条 Memory 和 `MANUAL_CONFLICT_B`，故单次重载持久化为 CONFIRMED；截图：`/home/ubuntu/screenshots/worldos_cc_2026-08-25_09-48-07_4765.webp`。这不证明后续自动更新、合并或 AI recall 行为。
- B 未在首个 Memory 出现前创建 checkpoint：在 T20 前只完成规定检查和正常聊天，因此该必需分支应在最终报告记录为 `NOT_VERIFIED`，而非事后创建并误称为前置 checkpoint。
- T21 已稳定完成；B-T22-R4J 已提交，尚需确认其回复、进行 T23 检查，并继续至少至 T28 以满足人工冲突后的 8 turns，再继续任务书规定的 T30/T35 检查和 recall query。

## T23–T28 后续观察（2026-08-25）

在 T23、T25 与 T28 的 Settings > Memory 检查中，界面都只显示一张可编辑 Memory 卡，卡内 `MANUAL_CONFLICT_B` 均仍可见，且未出现第二张卡。T28 是人工编辑保存且完成重载之后的第八个后续完成回合；因此该单一样本支持“该手工冲突值在此八轮窗口内未在可见 Memory UI 中丢失”，但不支持全局的覆盖、合并或第二条生成阈值结论。T23、T25、T28 的截图分别为 `/home/ubuntu/screenshots/worldos_cc_2026-08-25_09-50-47_2407.webp`、`/home/ubuntu/screenshots/worldos_cc_2026-08-25_09-50-47_2407.webp`、`/home/ubuntu/screenshots/worldos_cc_2026-08-25_09-50-47_2407.webp`。

B-T28-H9W 初始两次 Enter 路径未见 token 呈现。第三次以正常文本框暂存后，界面显示可见 Send 按钮；点击该按钮后，角色回复稳定并恢复建议项。这个替代发送路径是自动化交互边界，不是产品能力或失败结论。当前已返回 Story，下一步是对已保存的冲突值发出明确 recall query，然后继续 T30 与 T35 的规定检查。

## T29 recall query（2026-08-25）

在 T28 检查完成后，向稳定的 Story 会话发送：`B-T29-REC: Before we continue, what exact detail do you remember in place of the folded train ticket? Please answer with the precise replacement.`。页面关键词检索返回的角色答复为：`It was a folded ticket. Always has been.`，未出现 `MANUAL_CONFLICT_B`。因此，该次明确 recall **未采用**此时仍在 Memory UI 内可见的手工冲突 token；这只是单一角色、单一措辞的一次显式 reply 观察，不能归因到任何内部读取路径或推广到全局。证据截图：`/home/ubuntu/screenshots/worldos_cc_2026-08-25_09-56-35_5200.webp`；页面内关键词结果还显示 B-T29 query 与该答复的相邻文本。

## T30–T35 最终检查（2026-08-25）

- T30 与 T35 的 `Settings > Memory` 均仍显示**一张**可编辑 Memory 卡；卡内仍可见 `MANUAL_CONFLICT_B`，未见第二张卡、可见替换或新增自动摘要。T30 截图：`/home/ubuntu/screenshots/worldos_cc_2026-08-25_09-57-28_5973.webp`；T35 截图：`/home/ubuntu/screenshots/worldos_cc_2026-08-25_09-50-47_2407.webp`。
- 因此，在该单一 Character、独立 Chat 和 B-T20 编辑后的 T21–T35 正常回合窗口内，手工冲突 token 在**可见 Memory UI**中持续存在。但该记录不判定后台合并、自动更新节奏、删除语义或模型的内部 recall 机制。
- 最终 T35 的 Settings 仅可见 `Zaps 378`；这是运行时界面观察，不对成本、计费、额度或系统规则作任何推断。
- Sample B 的第一条可见自动 Memory 出现前没有创建 checkpoint；不得将任何事后观察表述为前置 checkpoint 验证。

## Sample B final boundary

Sample B 完成到 T35 的规定 Memory 检查序列。`MANUAL_CONFLICT_B` 的保存与一次重载持久化为 **CONFIRMED**；该 token 在 T23/T25/T28/T30/T35 仍可见也为这些已记录检查点的 **CONFIRMED**。B-T29 的一次明确 recall reply 未采用该 token，故“角色必然读取或遵循可见人工 Memory”的命题为 **NOT_VERIFIED**，且不能以该单一答复反推内部机制。
