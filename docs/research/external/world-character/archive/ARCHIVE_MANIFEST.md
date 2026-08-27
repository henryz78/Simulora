# 历史归档清单

本目录保存当前素材库形成过程中的有效历史版本与构建材料。它们**不替代** `final/current/` 中的当前真源，但不得因版本较早而被删除。

| 类别 | 保存内容 | 用途 |
| --- | --- | --- |
| `spreadsheets/` | v0.1 至 v0.5 的 Excel 工作簿 | 回溯字段演化、筛选结构、阶段统计与人工批注。 |
| `data/` | v0.1 至 v0.5 的 JSON 快照 | 回溯 ID、状态、标签与自动化数据结构。 |
| `readmes/` | v0.1 至 v0.5 的 README | 回溯每轮策展意图、筛选建议和旧版边界说明。 |
| `scripts/` | 构建与视觉状态更新脚本 | 追溯工作簿和 JSON 的生成逻辑；仅作为历史技术资料，下一位 Agent 不得用它们扩写内容。 |
| `legacy-package-manifests/` | 原有完整包 ZIP 的文件名索引 | 原 ZIP 已被当前手持包的原始资料、历史快照和资产覆盖；保留索引用于回溯。 |

## 当前真源

当前可执行真源位于 `final/current/` 与 `data/current/`，版本为 **v0.5.1 视觉状态更新**。该真源冻结 World / Character / Relationship / 第三方 IP 文本，只允许下一位 Agent 根据 `handoff/FINAL_VISUAL_HANDOFF.md` 完成仍为 `PENDING-QUOTA` 的视觉。

## 归档规则

历史文件可读取、比较和审计，但不得被下一位视觉补全代理用作新增内容、重命名、重编号或重构整个库的理由。

*状态：PRE-FINAL / VISUAL HANDOFF / NOT FINAL。*
