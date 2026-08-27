# Save Model

研究状态：`PARTIAL`

## 已验证规则

- 每个 World 默认提供 3 个存档位。
- 存档列表是 World 维度，而不是全账户统一列表。
- 用户可在任意当前 Turn 创建“存档点”，需要命名。
- 历史状态中也有“从这一轮创建存档点”。
- 存档点创建为独立 Simulation URL，而不是同 URL 内的轻量标签。
- 已验证 Turn 2 checkpoint 独立打开后保持：Wallet 43、魔杖存在、校袍不存在。
- 因此 checkpoint 至少复制该 Turn 的 Story/Wallet/Inventory/World State，并可独立继续。

## 已创建样本

| Name | Turn | URL | Verified state |
|---|---:|---|---|
| TEST Simulation 001 | 10 current | `/zh-cn/sim/d66ac97e-104f-463e-bf3c-9f35d3c6a496` | main experimental branch |
| TEST checkpoint T4 | 4 | `/zh-cn/sim/c7b97e3f-35ef-475c-a354-ffe2e665bfc0` | created; detailed re-open pending |
| TEST checkpoint T2 | 2 | `/zh-cn/sim/809ca2e8-933b-4814-b9fc-68b19a6a1e3b` | Wallet 43; wand yes; robes no |
| Existing old save | unknown | `/zh-cn/sim/fb53a871-6411-46d4-9826-fa3fa7c364b4` | pre-existing test-account data |
| TEST checkpoint T10 before rewind | 10 | `/zh-cn/sim/b3bc5be9-fb87-425a-b7ef-90d53f711501` | Rewind 后仍独立保持 Turn 10、Wallet 38、后期 Chat 与校袍 |
| TEST Time T5 Day398 Checkpoint | 5→6 independent | `/zh-cn/sim/18f9c456-6a9f-40b5-986e-97e0d77b0534` | cloned Day 398 07:30; independently continued to Turn 6 while source was rewound to Turn 2 / Day 1 08:20 |
| TEST Character Long Memory T20 Branch 001 | 20→21 independent | `/zh-cn/sim/4a7ab16e-90ee-4cda-a427-7334f69ece75` | copied Character transcript and secret recall; branch advanced to T21 while source stayed T20 |

## Slot expansion

- 第 4 个槽位可用 80 Credits 永久增加 1 个槽。
- 第一次扩容已执行，账户从 742 变为 662。
- 当前 4 个槽位再次全部占满，创建 Turn 10 checkpoint 时出现：
  - `这个世界的 4 个存档位（含已购 1 个）已全部用完。`
  - `花 80 增加一个存档位？删除旧存档也可以腾出位置。`
  - 按钮：`增加存档位 · 80`。
- 这表明扩容可以累积，已购槽位计入 World 的总槽数。
- 第二次扩容已经执行：第 5 槽再次花费 80 Credits，账户 `602 → 522`，随后成功创建 Turn 10 checkpoint。

## Checkpoint 与 Rewind 的隔离性

- 源 Simulation 从 Turn 10 Rewind 到 Turn 2 后，Turn 10 checkpoint 没有变化。
- 源 Simulation 从恢复点续写新的 Turn 3 后，Turn 10 checkpoint 仍保持旧时间线。
- 世界详情页把 checkpoint 标注为 `存档点`，并解释：`从某一局某一轮存下的存档点——只保留在世界页,不进「我的模拟」。`
- 普通 Simulation 与 checkpoint 都有独立 URL；checkpoint 是可继续操作的完整 Simulation 副本，但导航归属不同。
- Time-aware sample confirms world-time state is cloned: checkpoint retained Day 398 07:30 while the source was later rewound to Day 1 08:20. Advancing the checkpoint to its own Turn 6 did not alter the source.
- Character Chat uses the same named current-state checkpoint concept. EVD-0213 created a T20 checkpoint without leaving the source URL; the new link appeared under Character Settings → `存档`, copied all 20 Turns and independently advanced to T21 while the source remained T20. The UI labels the checkpoint as retained on the Character/World page rather than Mine.
- EVD-0232 later generated and manually edited visible Memory only in the source at T25/T26. Reopening that earlier T20 checkpoint at its independent T21 state still showed `暂无记忆`; future source Memory generation/edit did not propagate across the checkpoint boundary.
- EVD-0236 reaches a fresh three-slot World's full-capacity checkpoint gate from Turn 2. The naming step is shown first; only after entering a name does the product report all three free slots used and offer either `增加存档位 · 80` or deletion. After deleting a disposable v5 save through Mine's in-page permanent-delete modal, retrying created independent checkpoint `/sim/2b9a86c1-2925-4e60-9ea5-9f293e16d976` at zero energy. It copies exact `playerSetup`, the consumed one-time identity lock, Story/Turn and empty visible Memory.
- Unlike full World Simulation, the tested Character Chat historical view exposes no historical checkpoint/restore/back-to-now actions. Checkpointing is available only from the current state in normal UI.

## 删除路径不是同一种状态机

- 直接永久删除 Simulation：World save list/Continue、Mine History 和侧栏 History 最终都清理，UUID 保持裸 404且无恢复控件（EVD-0129, EVD-0219）。
- 删除引用它的 published World：World detail/edit/new、Search/Works/Profile 和 child runtime 立即失效，但 Mine History 元数据卡保留。该卡仍显示 Turn/date/World slug 和 dead UUID，并可 Rename；新名称 reload 后持久，runtime 仍 404（EVD-0221）。
- 因此 Save 的运行实体、World membership 和 History metadata 是至少三个可分离投影；不能把 404、列表保留或列表消失单独等同于同一 backend 状态。EVD-0223 验证孤立 History 的剩余 Delete 会清理 metadata 行且 reload 后保持，无 Undo/Restore；长期 retention、跨设备与后端 tombstone 仍 UNKNOWN。

## 待验证

- 槽位是否有上限；
- 删除 checkpoint 是否立即释放槽位、是否可恢复；
- checkpoint 创建当下已有非空可见 Memory 时的复制范围（当前 Character checkpoint 创建于 T20 空态；之后源 T25/T26 的 Memory 不反向传播已验证）；
- World 发布新 Version 后旧 checkpoint 绑定哪个 Version；
- checkpoint 名称是否可编辑；
- Save/Resume 跨刷新、登出、移动端的一致性；
- Credits 扩容是否仅对当前 World 生效（UI 文案强烈支持，但仍需跨 World 对照）。
- World 删除产生的 orphan History 卡在多久后自动收敛；其剩余 Delete 已验证能清理 History 元数据且 reload 后保持，不能恢复 runtime。
