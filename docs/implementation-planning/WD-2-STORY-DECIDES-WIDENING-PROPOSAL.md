# WD-2：扩展 “Let the story decide” 的提案

**状态：提案，未获实施授权**
**日期：2026-09-27**
**前置：** WD-1b 已关闭；当前 `STORY_DECIDES` 只允许响应、`ADD_FACT`、
`REVEAL_FACT` 和声明约束失败，永不产生 L3。

## 现有影响级别

| 操作                 | 当前允许方式                                         | 当前影响级别                                   | 当前确认                                      |
| -------------------- | ---------------------------------------------------- | ---------------------------------------------- | --------------------------------------------- |
| `OPEN_THREAD`        | 显式 `THREAD_EFFECT`                                 | L2                                             | exact review；Quick play 可按现有规则自动应用 |
| `RESOLVE_THREAD`     | 显式目标 open thread 的 `THREAD_EFFECT`              | L2                                             | exact review；Quick play 可按现有规则自动应用 |
| `SHIFT_RELATIONSHIP` | 显式 `RELATIONSHIP_EFFECT`                           | 相邻 `ROUTINE` scale step 为 L2；其他变化为 L3 | 都需要 exact confirmation                     |
| `MOVE_CHARACTER`     | 显式 `ROUTINE_EFFECT`，且必须命中 SA-2 creator grant | L2                                             | exact review；Quick play 可按现有规则自动应用 |

因此“让故事决定”不能简单把三个操作都映射成 L2。关系的非 routine 变化
仍是 L3；移动还要求角色、路线和作者授予的 policy，不能由叙事文字自行授权。

## 各操作需要的作者预授权

### 1. 开启故事线：第一阶段候选

Revision 需要声明故事可以在 `STORY_DECIDES` 下开启哪些类型的 thread，至少
包括标题边界、可引用的 causal facts、去重身份和是否允许 Quick play 自动应用。
没有声明时保持当前拒绝。

这仍是 L2，但它会增加一个持久共享对象，默认模式下要走 exact review；若
Quick play 已打开，自动应用只能复用已经批准的 L2 confirmation/Undo 路径。

### 2. 解决故事线：第二阶段候选

作者需要预授权哪些 open thread 可以由故事解决，以及允许的 resolution 形态。
至少要绑定当前 head 的 thread id、OPEN 状态、causal facts 和 author grant；
不能让模型凭标题创建一个“相似线程”再关闭它。

这是当前已有的 L2 关闭操作，但 `STORY_DECIDES` 需要新的 target binding，
否则会绕开显式 `targetThreadId`。

### 3. 推动关系：第三阶段候选

只考虑作者声明为 `ROUTINE` 的关系 scale，并只允许相邻一步。作者预授权应
绑定 relationship id、两端 Character、scale、允许的方向/步长和 causal facts。
这样可以沿用当前 L2 判定。

非 routine relationship 的任意变化仍是 L3；要开放它，必须新增玩家确认的
effect envelope，不能让 `STORY_DECIDES` 默认产生 L3。关系两端还必须满足当前
Character attribution guard。

### 4. 移动角色：最后阶段候选

只能复用 SA-2 的 creator-granted `routineMovers` 与 `routineRoutes`，并要求
模型回应来源就是被移动的 Character。World response 没有可绑定 Character，
所以“无人称目标的故事决定移动”需要一个额外的产品决定：是强制选择某个已
授权 Character，还是暂不支持。

用户角色永远不是 routine mover；路线、起点、终点和 expected head 仍由服务端
校验。作者 grant 不能从模型文本或参与者输入推导。

## 必须保持的 parity 工作

任何获批的后继 track 都必须同时更新并对照验证：

- domain candidate schema、impact/confirmation 判定和 effect context；
- application worker 的 allowed operation、prompt version 和生成 manifest；
- SQL proposal/evidence/terminal validators、policy digest 和 expected head；
- `STORY_DECIDES` 的 context disclosure 与私有事实边界；
- real PostgreSQL、desktop/390×844 browser、Quick play/Undo、Restore 和伪造
  proposal 的回归测试。

每一个新增操作都应有一个 successor contract、独立 Review 和 exact-SHA CI。
不要编辑已应用 migration，也不要把测试通过当作 Gate closure。

## 推荐顺序

1. `OPEN_THREAD`：边界最小，先证明 author allow-list 和 L2 review。
2. `RESOLVE_THREAD`：复用已存在的 thread identity 和状态守卫。
3. routine `SHIFT_RELATIONSHIP`：只做相邻 L2 step，保留非 routine L3。
4. `MOVE_CHARACTER`：最后做，因为它同时受 Character attribution、SA-2 policy
   和 World response 选择约束。

本文件只记录选择空间，不授权实现、迁移、提示词或 provider 调用。
