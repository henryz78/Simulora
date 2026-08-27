---
AIGC:
    Label: "1"
    ContentProducer: 001191440300708461136T1XGW3
    ProduceID: c155b059b691a65648c3dfcfa330b8a2_cac5bc039ec111f1a413525400287e28
    ReservedCode1: IFlxfEuy0OTXrO8X7FXecR3wUmRkyd87FB22QxlemKrvi9K43qpvGBg4flcb4KZhmRrooLdoR1U+Ba4POt9nOgJQHq64CfhOTeH13M9mMiloVYuK5xMgzIC6a8sY2wzxm2NnpVBnp+qA6F0oUcWgKdO6qNplB1ErUBXZlT75GZcDLiiIOgtydZcflGo=
    ContentPropagator: 001191440300708461136T1XGW3
    PropagateID: c155b059b691a65648c3dfcfa330b8a2_cac5bc039ec111f1a413525400287e28
    ReservedCode2: IFlxfEuy0OTXrO8X7FXecR3wUmRkyd87FB22QxlemKrvi9K43qpvGBg4flcb4KZhmRrooLdoR1U+Ba4POt9nOgJQHq64CfhOTeH13M9mMiloVYuK5xMgzIC6a8sY2wzxm2NnpVBnp+qA6F0oUcWgKdO6qNplB1ErUBXZlT75GZcDLiiIOgtydZcflGo=
---

# 02 · 跨账号 Remix（Account B → Account A 内容）
## 2.1 已验证链条（HANDOFF 资产，Account B 复验）
| 对象 | slug | 观察到的 owner/creator | attribution |
|---|---|---|---|
| L0 | test-map-world-001-gytp | x161880（Account A username） | —（原创） |
| L1 | test-map-world-001-ft9r | nixonelton9954 | "改编自 x161880 的公开 World" |
| L2 | test-map-world-001-ouue | nixonelton9954（v2） | attribution 仅指向直接父级 nixonelton9954 |
| L2 | test-map-world-001-k4do | x161880（public v1，直接父级同为 ft9r） | 同上，仅直接父级 |

关键观察:
- attribution 文案为「改编自 {直接父级 creator} 的公开 World」，只指向直接父级；祖先通过逐层来源链接追踪（与 HANDOFF 一致）。
- Account B 可从搜索结果/详情页对 Account A 公开 World 执行「改编」，生成自己的公开副本（ukb1/mehraxbobaid78，出现在"我的世界"，带"改编"标记）。

## 2.2 跨账号 Remix 行为矩阵
| 维度 | 结果 | Confidence |
|---|---|---|
| 哪些对象可 Remix | 公开 World 可"改编"；Character 搜索有"聊天/添加"；App/Map 入口存在 | HIGH |
| Remix 按钮何时出现 | 公开详情页/搜索结果卡片均有"改编" | HIGH |
| Remix 后复制哪些内容 | 公开 World 的完整内容（副本出现在 B 的"我的世界"，0 回合） | HIGH |
| 原 Creator 是否显示 | 是，详情页 creator 保留原 creator | HIGH |
| attribution 如何显示 | "改编自 {直接父级} 的公开 World" | HIGH |
| 原对象链接是否保留 | 逐层来源链接保留（HANDOFF） | MEDIUM |
| Remix 后新对象归谁 | 归执行 Remix 的账号（ukb1 归 mehraxbobaid78） | HIGH |
| Remix 后默认 Visibility | 立即为 Public（ukb1 可被搜索到） | HIGH |
| Remix 是否立即产生公开 v1 | 是（HANDOFF + k4do public v1） | MEDIUM |
| 修改后是否进入 Draft | 未在本次复验；主 Agent 已 VERIFIED | HIGH（引用 HANDOFF） |
| 多层 Remix 是否存在 | 是（ft9r→ouue / ft9r→k4do） | HIGH |

## 2.3 跨账号 Remix 触发跨账号通知
- HANDOFF 已 VERIFIED：Remix 会给父 World 所有者生成带子 World 深链的通知。
- 本次 Account B 未登录 Account A 验证通知本体 → 标 CROSS_ACCOUNT_VERIFICATION_REQUIRED（见 10）。

## 2.4 结论
- 跨账号 Remix 对陌生公开 World 完全开放，无需许可；attribution 为单层直接父链 + 逐层来源追踪。
- Remix 副本归属执行者，立即公开可搜。
- 来源删除/关闭改编权限后的独立 viewer 强制行为仍 UNKNOWN（见 08/10）。
*（内容由AI生成，仅供参考）*
