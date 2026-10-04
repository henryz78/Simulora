# WD-2：Current Situation 保持新鲜的提案

**状态：提案，未获实施授权**（2026-10-04 更新：采用选项 B 并已实施，见 [WD-2 Current Situation Report](WD-2-CURRENT-SITUATION-REPORT.md)）
**日期：2026-09-27**
**背景：** WD-1b、Track B §3.9

## 问题

Track B §3.9 中，玩家通过 `REVEAL_FACT` 找到了羊毛商人的账本，但 Play
页面仍显示“账本不在柜台上”。`apps/web/src/pages.tsx` 当前的
`currentSituation` 会从当前 ACTIVE SHARED facts 取第一条共享事实，找不到时
才退回 World clock；它没有定义“最新情况”的选择规则。于是最近一次合法的
L2 变化可以已经提交，页面的主导语句却仍然像旧世界一样。

问题是显示投影与权威状态的关系没有被定义，不是允许 `STORY_DECIDES` 偷偷
生成 L3 状态的理由。WD-1b 已明确 `STORY_DECIDES` 永不产生 L3。

## 选项

### A：让玩家确认一个“更新当前情况”的 L3 Action

玩家明确选择“更新当前情况”，模型或玩家提出新的 canonical situation，页面
显示完整的 exact review，玩家确认后才提交。`STORY_DECIDES` 不得触发它。

- **触及的冻结规则：** L3 exact confirmation、canonical fact/provenance、
  expected-head、Restore 和 Undo 边界。
- **后继 ADR：** 需要。要定义 situation 是否是独立 canonical 对象、与 SHARED
  fact 的关系、Rewind/Correction/Export 行为及冲突处理。
- **优点：** 权威性最清楚。
- **代价：** 每次关键变化都增加一次玩家确认，不能解决“只想读当前情况”的
  负担。

### B：派生的 Current Situation 显示行（推荐）

把主导语句明确标成派生显示，不写回 World 或 Continuity truth。它只从当前
head 的已提交事实和事件生成，按一个固定且可审计的优先顺序选择最近相关变化；
没有安全候选时显示保守的 World clock / “当前状态见下方事实”，不猜测。L0
响应不改变这条线，L2 Commit 只在提交后让投影刷新。

- **触及的冻结规则：** 不改变 Action、Commit、L2/L3 或 authority；需要定义
  投影 freshness、fallback 和 Restore 后重算边界。
- **后继 ADR：** 需要一个小型 successor contract/ADR，记录输入事件类型、
  排序、去重、stale projection 和不可用时的保守文案。它不授权新的世界效果。
- **优点：** 不增加确认，不制造 canonical 事实，能覆盖 ADD_FACT、REVEAL_FACT
  和已有 routine effects。
- **代价：** 它仍是摘要；不能保证一句话解释整个世界，派生投影也需要测试。

### C：留给作者在新 Revision 中更新 starting situation

作者在 Studio 里修改 `startingSituation`，发布新 Revision 后再开始或迁移到新
路径；运行中的 Continuity 不自动变化。

- **触及的冻结规则：** 不改变运行时 truth、Action 或确认；World Version 与
  Continuity 分层必须保持。
- **后继 ADR：** 运行时不需要；如果未来要让 Revision 更新合并到已有
  Continuity，则需要单独的版本合并 ADR。
- **优点：** 最简单，作者拥有叙事 framing。
- **代价：** 运行中的当前路径仍可能过时，正是 §3.9 的问题。

## 建议

选择 **B**，先定义一个只读、可重算、可回退的派生显示投影；不要把它命名或
实现成新的 fact。先覆盖 `REVEAL_FACT`、`ADD_FACT`、已提交 routine effect、
Restore 和 stale projection，再考虑是否需要 A。C 保留为作者整理新 Revision
的正常工具。

## 验收边界

- L0 response-only 不改变 Current Situation 的权威输入。
- L2 提交后，刷新和 Return 都从同一个已提交 head 得到一致显示。
- 不显示尚未 reveal 的 CONTINUITY_PRIVATE secret。
- Restore 后显示来自恢复后的 head；投影不可用时不从客户端猜测。
- 不新增 API payload、数据库 truth、模型权限或确认绕过。

本文件不授权代码、迁移、提示词或生产 live 行为变更。
