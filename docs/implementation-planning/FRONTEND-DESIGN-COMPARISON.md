# 前端方向选项比较

**来源：** `frontend-design` 分支，Task 4 提案提交 `465d335`。
**状态：** 只读比较；没有合并、实现或改变主分支。

## 先看原型

分支提供了独立静态原型：

`docs/implementation-planning/frontend-design/index.html`

它模拟 Library、Studio、Play、Return、中文/英文切换、底部悬浮导航、当前
情况、Action Composer、World response、Story 和 Recovery。它不连接真实 API，
也不证明任何冻结行为。

## 三个选项

| 选项                                     | 视觉和交互                                                                                                                                                                                                          | 改变什么                                                                                   | 粗略工作量                                                                       |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------- |
| **A：聚焦的 presentation pass（推荐）**  | “Ink, paper, ember” 的暖纸张、深色文字和 ember 操作色；Library 先显示 Continue，Studio 显示 Draft → Check → Playable Revision，Play 使用主内容/侧栏，底部悬浮栏承载 Library、Studio、Play、Return，并提供中英文切换 | 只重排现有页面层级、文案、等待反馈和响应归因；路由、payload、确认、Restore、authority 不变 | **中等**：一个有界 PX-3 前端 track，需 desktop/390×844、axe 和现有浏览器回归     |
| **B：现在拆分 Director / Player 工作区** | 持久的身份/模式切换，两套导航和工作区；创作者看到 Studio，参与者看到 Play/Return                                                                                                                                    | 引入模式状态和 authority framing；可能影响 session、权限提示和导航记忆                     | **高**：先写 successor ADR，再做完整路由、权限文案和浏览器矩阵                   |
| **C：Conversation-first Play**           | 隐藏 target、requestedEffect 和多数结果控制，只保留类似对话输入                                                                                                                                                     | 让模型解释意图并依赖服务端默认，弱化 requestedEffect、exact confirmation 和 L2/L3 可见边界 | **中等实现量，高语义风险**：容易重现 Health Check 的 agency 混淆，提案明确不推荐 |

## 推荐

选择 **A** 作为 PX-3 的起点。它直接处理 Health Check 中的阅读负担和等待
反馈，同时保持现有 authority/confirmation 契约。中英文只切换客户端 UI 标签和
辅助文案；World 作者内容与生成文本保持存储语言，不新增自动翻译语义。

B 只有在产品决定需要持久的 Director/Player 模式后才值得做。C 应保持拒绝，
因为更少的控件会让用户更难知道一次 Action 是否会改变世界，以及何时需要确认。

## 预览边界

- 桌面：8/4 主辅栏，Composer 和最新结果在主栏，当前路径/线程/Recovery 在侧栏。
- 390×844：单列顺序，底部栏变成两行，避免横向辅助滚动条和遮挡键盘。
- 页面底部固定浮栏：Library、Studio、Play、Return；EN/中文在同一浮栏。
- Play 内 Context、Continuity、Recovery 是普通换行链接，不再使用独立横向导航条。

本地只读截图已核对桌面和 390×844：桌面浮栏清楚，手机浮栏确实变成两行；
当前原型在手机 Library 的 Continue 卡片底部仍会被固定浮栏遮住一次按钮。这是
原型层的布局问题，不能带入 PX-3；实现时必须用安全区和内容底部间距测试覆盖，
而不是把按钮藏到浮栏后面。

这仍是设计预览，不是 PX-3 授权，也没有做真实 API、数据库、确认或产品代码
修改。具体视觉方向和选项由产品负责人选择后，再交给另一个 Agent 写 PX-3
contract、实现和独立 Review。
