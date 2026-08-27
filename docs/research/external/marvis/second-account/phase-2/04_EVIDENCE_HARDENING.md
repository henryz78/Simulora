---
AIGC:
    Label: "1"
    ContentProducer: 001191440300708461136T1XGW3
    ProduceID: c155b059b691a65648c3dfcfa330b8a2_dfd179799ed511f1a413525400287e28
    ReservedCode1: 7VhMBo1uPLOswjJSBROEuI9ZchEEcBoQBb7Ew64Slziberv4wmBJ0ZCqrC+u/O+EMxzfEURQldPLuJ2VCQ/v3Z56Ci25KlLeLUQhrsOEbg0Dv6n+KXBiymY1+U+puqVDCOsW9zAERk2jumm4dCmXf20JoEHDlg8/REyBM4D57qvqiVpYdX4jVURLpy8=
    ContentPropagator: 001191440300708461136T1XGW3
    PropagateID: c155b059b691a65648c3dfcfa330b8a2_dfd179799ed511f1a413525400287e28
    ReservedCode2: 7VhMBo1uPLOswjJSBROEuI9ZchEEcBoQBb7Ew64Slziberv4wmBJ0ZCqrC+u/O+EMxzfEURQldPLuJ2VCQ/v3Z56Ci25KlLeLUQhrsOEbg0Dv6n+KXBiymY1+U+puqVDCOsW9zAERk2jumm4dCmXf20JoEHDlg8/REyBM4D57qvqiVpYdX4jVURLpy8=
---

# 04 · Evidence Hardening（Phase-1 高价值结论证据审查）

> 对 Phase-1（Account B 调查）7 项高价值结论逐项审查证据充分性。
> 结论：现有证据保留 or 收窄结论范围。原则——若只有单一样本，不推广为 WorldOS 绝对规律。

---

## H-1 · Search 按标题索引、slug 不可搜

| 维度 | 审查结果 |
|---|---|
| 现有证据 | [B]E3：`?q=test-map-world-001-gytp`（slug）→ 暂无匹配结果；[B]E4：`?q=测试应用升级世界 001`（完整标题）→ 4 个结果（gytp/x161880、ukb1/mehraxbobaid78、ouue/nixonelton9954、k4do/x161880） |
| 样本量 | 1 个 World 链（test-map-world-001 系），单组对照（slug vs 标题） |
| Guest 侧交叉验证 | 无（匿名报告仅确认"搜索完全开放"，未验证 slug 可搜性） |
| 判定 | **保留，但收窄范围**。在 test-map-world-001 链样本上验证成立；结论表述应为"在所测试的 World 样本中，搜索按标题/描述索引、slug 不可搜"，不建议直接推广为全站绝对规律 |
| 加固建议 | 未来可用 2-3 个不同 World 复核；如需绝对结论需多对象样本 |

## H-2 · 删除 Character 后 World-local 快照仍存在

| 维度 | 审查结果 |
|---|---|
| 现有证据 | [B]E16：已删 source 角色"测试角色 001"在 Search（角色 tab）仍可命中，挂靠 World「测试应用升级世界 001」；点"聊天"→ 进入新 Simulation onboarding，快照仍可启动会话；source Chat URL（/zh-cn/sim/33c8dcf4）→ 404 |
| 样本量 | 1 个已删角色 |
| Guest 侧交叉验证 | 无（匿名报告未测删除场景） |
| 判定 | **保留，但收窄范围**。"在已测试的该角色样本中"，source 删除后 World-local 快照仍可被检索并启动聊天；独立 Global 角色库中不再出现。单样本不支持推广为所有角色类型的绝对规律 |
| 加固建议 | 可再删 1 个不同类型角色复核 |

## H-3 · 删除对象 Search + Direct URL 同步消失

| 维度 | 审查结果 |
|---|---|
| 现有证据 | [B]E10：已删 App `test-app-delete-lifecycle-001` 直接 URL → 404；[B]E11：同名搜索 → 暂无匹配结果（从索引移除） |
| 样本量 | 1 个 App |
| Guest 侧交叉验证 | 无 |
| 判定 | **保留，但收窄范围**。"在已测试的 App 样本中"，删除后 Direct URL 与 Search 同步消失。单样本；且"同步/即时"依赖测试时刻的索引状态，需注意索引收敛存在异步（HANDOFF 已注明） |
| 加固建议 | 用第二个删除对象复核时效 |

## H-4 · Remix 副本立即公开并进入 Search

| 维度 | 审查结果 |
|---|---|
| 现有证据 | [B]E4：Account B 刚生成的 Remix 副本 ukb1/mehraxbobaid78 已出现在标题搜索结果中；[B]2.1：副本出现在"我的世界"带"改编"标记，0 回合，为 Public |
| 样本量 | 1 个 Remix 副本（ukb1） |
| Guest 侧交叉验证 | 无（匿名侧未做 Remix） |
| 判定 | **保留，但收窄范围 + 注明时效**。"在该 Remix 副本样本上，改编后即 Public 且可被完整标题搜索命中"。索引收敛存在异步窗口（HANDOFF：新 L2 k4do 初次精确标题未收录、稍后收录），"立即"应理解为分钟级而非严格实时 |
| 加固建议 | 如需要严格 SLA，需多副本 + 计时实验 |

## H-5 · Rating 与 Comment 权限不对称

| 维度 | 审查结果 |
|---|---|
| 现有证据 | [B]E13：跨账号评论发布成功并持久化（评论·1）；[B]E14：评分被"玩过这个世界后才能评分"拦截——同一对象 test-map-world-001-gytp 上两个动作门槛不同 |
| 样本量 | 1 个 World，但两个动作在同一对象上互为对照，证据对称性好 |
| Guest 侧交叉验证 | 部分：匿名侧确认 Guest 下评论、评分均需登录（[G1]§3/§4），因此"不对称"发生在登录后层——评论登录即可、评分需游玩；[B2]-4 又复核了评分文案 |
| 判定 | **保留，HIGH**。证据链完整（同对象双动作 + 补测复核），无需重测。结论范围："在已测试的公开 World 上，评论无额外门槛、评分需账户级游玩记录" |
| 加固建议 | 无必需 |

## H-6 · Follow 持久化及计数变化

| 维度 | 审查结果 |
|---|---|
| 现有证据 | [B]E7：关注→"1 关注者"→刷新保持；取关→"0 关注者"→刷新保持 |
| 样本量 | 1 个对象（Account A x161880 Profile），但正反两方向（关注+取关）各复验刷新 |
| Guest 侧交叉验证 | 无（匿名侧未登录，无法验证关系写入；匿名侧仅确认 Follow 按钮跳登录） |
| 判定 | **保留，HIGH**。正反方向 + 刷新持久化构成完整闭环；结论范围"在已测试的创作者 Profile 上" |
| 加固建议 | 无必需 |

## H-7 · creator 显示名不一致（x161880 vs nixonelton9954）

| 维度 | 审查结果 |
|---|---|
| 现有证据 | [B]4.4：同一 World 链（test-map-world-001）在不同渲染路径显示 creator 不同——x161880（Account A username）vs nixonelton9954（账号标识）；[B]2.1 表中亦可见 L1/L2 owner 为 nixonelton9954 |
| 样本量 | 1 个 World 链的跨路径观察 |
| Guest 侧交叉验证 | 无 |
| 判定 | **保留，但收窄为观察性发现**。"在 test-map-world-001 链上观察到 username 与账号名混合展示"。这是低风险展示不一致，非权限问题；如需确认是 bug 或设计，需产品确认 |
| 加固建议 | 观察即可，无需重测 |

---

## 加固后结论汇总

| # | 结论 | 加固判定 | 推荐表述 |
|---|---|---|---|
| H-1 | Search title 可搜 / slug 不可搜 | 保留，收窄 | "在已测试的 World 样本中……" |
| H-2 | 删除角色后 World-local 快照仍在 | 保留，收窄 | "在已测试的角色样本中……" |
| H-3 | 删除对象 URL+Search 同步消失 | 保留，收窄 | "在已测试的 App 样本中……" |
| H-4 | Remix 立即公开进 Search | 保留，收窄+时效 | "在该副本上……分钟级收敛" |
| H-5 | Rating/Comment 不对称 | 保留，HIGH | 同对象双动作，无需收窄 |
| H-6 | Follow 持久化/计数 | 保留，HIGH | 正反双验 |
| H-7 | creator 显示名不一致 | 保留，观察项 | "在 test-map-world-001 链上观察到" |

> 总体：H-1~H-4、H-7 单样本，一律用范围限定表述；H-5、H-6 证据闭环充分。全部保留，无需重测。
*（内容由AI生成，仅供参考）*
