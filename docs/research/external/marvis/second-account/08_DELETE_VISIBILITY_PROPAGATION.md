---
AIGC:
    Label: "1"
    ContentProducer: 001191440300708461136T1XGW3
    ProduceID: c155b059b691a65648c3dfcfa330b8a2_cf3919da9ec111f1a54f525400f8a581
    ReservedCode1: nvjaH9NV1mhurhf1m8EFwqGbqrmFevWz5Q0bETYOBA5ijLuaosdjdyR7h+0U/dUK78IpR9fUjo5+LWTgJ6z3YIBBAph9BaJgFT2WHuZX0w+ijjJARLEc9aDWI4FbY3zrFdE0J7W4jEducKOrdiLPJLN9RCfx5Nqy/CO9xbGyWJDppW0vF974eKscTR4=
    ContentPropagator: 001191440300708461136T1XGW3
    PropagateID: c155b059b691a65648c3dfcfa330b8a2_cf3919da9ec111f1a54f525400f8a581
    ReservedCode2: nvjaH9NV1mhurhf1m8EFwqGbqrmFevWz5Q0bETYOBA5ijLuaosdjdyR7h+0U/dUK78IpR9fUjo5+LWTgJ6z3YIBBAph9BaJgFT2WHuZX0w+ijjJARLEc9aDWI4FbY3zrFdE0J7W4jEducKOrdiLPJLN9RCfx5Nqy/CO9xbGyWJDppW0vF974eKscTR4=
---

# 08 · 删除 / 可见性改变后的传播（Account B 视角）
## 8.1 已删除 App（test-app-delete-lifecycle-001）（VERIFIED）
| 面 | 结果 |
|---|---|
| 直接 URL | /zh-cn/apps/test-app-delete-lifecycle-001 → 404 |
| Search | 搜索该名称 → 暂无匹配结果（从索引移除） |
| Creator Profile / App Market | 未再出现（依据 404 + 搜索 0 命中推断） |
| Favorite / Share URL | 无样本；Share URL 依 404 逻辑应失效 |

## 8.2 已删除 Character source（测试角色 001）（VERIFIED 部分）
| 面 | 结果 |
|---|---|
| source Chat 直接 URL | /zh-cn/sim/33c8dcf4... → 404（Account B 视角与 HANDOFF 一致） |
| Search（角色 tab） | 仍可搜到「测试角色 001」，挂靠在 World「测试应用升级世界 001」下（World-local 快照仍被索引） |
| 聊天可用性 | 点搜索结果「聊天」→ 进入新 Simulation 创建流程（onboarding 设定身份）→ World-local 快照仍可启动新会话 |
| 独立 Global Character 库 | 该角色不再作为独立 Global 角色出现（仅以 World-local 形式关联可搜） |

## 8.3 可见性改变（Public→Private）传播（UNKNOWN）
- 无 Account A 私有对象样本；未做 Public→Private 的已打开页面/刷新/Search/收藏行为实验 → 全部 UNKNOWN（见 10）。

## 8.4 结论
- 删除从「直接 URL」与「Search」两个面即时传播（App 案例 VERIFIED）。
- Character source 删除后: 独立 source 不可访问，但 World-local 快照与 Remix 后代继续存活且可启动（与 HANDOFF 的 snapshot/复制语义一致，Account B 独立复验）。
- 删除后 World 公开页版本历史保留等精确判定仍 UNKNOWN（引用 HANDOFF）。
*（内容由AI生成，仅供参考）*
