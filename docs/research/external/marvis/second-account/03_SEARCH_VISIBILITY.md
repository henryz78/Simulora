---
AIGC:
    Label: "1"
    ContentProducer: 001191440300708461136T1XGW3
    ProduceID: c155b059b691a65648c3dfcfa330b8a2_cb77b84b9ec111f1a54f525400f8a581
    ReservedCode1: /JfvFR8ZSVud+3NnZXI91E6In1YGIRypDNulzMAxLzZ/WmOSNQyCW4alXtuZNrH9JzvN47PVdDYhf3imqFLNrmvNmyyFj/jHk45QaY8LI3nj32JWflqw977+DlE6BZ7r5Fu0iRCFMVMDtifYoPDsvsdBaH8RJLPgN1RBzLGT4hb9j7ika9UzTrnTYEA=
    ContentPropagator: 001191440300708461136T1XGW3
    PropagateID: c155b059b691a65648c3dfcfa330b8a2_cb77b84b9ec111f1a54f525400f8a581
    ReservedCode2: /JfvFR8ZSVud+3NnZXI91E6In1YGIRypDNulzMAxLzZ/WmOSNQyCW4alXtuZNrH9JzvN47PVdDYhf3imqFLNrmvNmyyFj/jHk45QaY8LI3nj32JWflqw977+DlE6BZ7r5Fu0iRCFMVMDtifYoPDsvsdBaH8RJLPgN1RBzLGT4hb9j7ika9UzTrnTYEA=
---

# 03 · Search 可见性（Account B 视角）
统一搜索入口: /zh-cn/worlds/search?q=...（tabs: 全部 / 世界 / 角色 / 用户 / App）

## 3.1 已验证搜索实验
| 查询 | tab | 结果 | 结论 |
|---|---|---|---|
| test-map-world-001-gytp（slug） | 全部 | 暂无匹配结果 | slug 不可搜，搜索按标题/描述索引 |
| 测试应用升级世界 001（完整标题） | 全部 | 4 个结果: gytp/x161880、ukb1/mehraxbobaid78、ouue/nixonelton9954、k4do/x161880 | 完整标题可搜，含跨账号 Remix 副本 |
| test-app-delete-lifecycle-001（已删除 App） | 全部 | 暂无匹配结果 | 删除后从 Search 完全消失 |
| 测试角色（已删 source 角色） | 角色 | 命中「测试角色 001」（关联世界: 测试应用升级世界 001） | 删除的 Global source 以 World-local 快照形态仍可被检索，带"聊天/添加" |

## 3.2 索引行为
- 标题是主要索引键，slug/URL 不可搜（VERIFIED）。
- 索引异步收敛已被 HANDOFF 验证（新 public L2 k4do 初次精确标题未收录、稍后完整结果包含它）；本次未复现延迟窗口。
- 已删除对象从索引移除（VERIFIED，App 与 source Chat 均 404，搜索 0 命中）。

## 3.3 搜索结果卡片可执行操作（陌生账号）
- World 结果: 编辑 / 改编 / 立即开始（"编辑"仅 owner 可见，Account B 搜索自己的副本可见"编辑"）。
- Character 结果: 聊天 / 添加。
- 类型过滤 tabs: 全部 / 世界 / 角色 / 用户 / App。

## 3.4 结论
- Search 对陌生账号完全开放，Public 内容可被发现；Remix 副本立即进入索引。
- 删除传播到 Search 是即时的（App 案例）。
- 精确 SLA / 排序规则 UNKNOWN（HANDOFF 已注明）。
*（内容由AI生成，仅供参考）*
