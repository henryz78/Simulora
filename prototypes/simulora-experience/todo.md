# 发布前待办

- [ ] 确认用户希望为当前 Simulora P1/P2 原型创建发布快照。
- [ ] 创建不改变原型内容的发布快照。
- [ ] 指导用户在项目界面点击 Publish，并记录其公开入口。

## P1/P2 focused refinement

- [x] 弱化桌面常驻左右控制面板，令世界场景成为主视域并将支持能力转为按需 surface。
- [x] 改造移动一级导航，移除非持续需要的 Return / Restore 常驻入口。
- [x] 将 continuity technical metadata 下沉到二级 disclosure，并将 prototype 演示控制移出产品界面。
- [x] 验证 P1/P2 状态区分、Desktop/Mobile 响应式布局与既有安全边界未被削弱。

## P1/P2 Prototype Gate Repair

- [x] B1：建立统一 prototype-level current-world truth，并令 World now、scene、Maren、action、record、summary、Lens、correction 与 context 共同读取它。
- [x] B2：令 Return Orientation 与 Continue at the lamp room 投影并兑现同一 current path 的事实。
- [x] B3：按初始、provisional、recorded、corrected 和 Return 入口绑定具体存在的 record；无 record 时不显示虚构 beacon 或 C-118。
- [x] I1：统一 acknowledged / provisional / recorded / interrupted 用户状态语言。
- [x] I2：在 390×844 下复核所有 P1 操作和确认的底部安全空间。
- [x] I3：令 Return 的每条可解释变化均绑定自己的 explanation target。
- [x] 依照 A–D 场景完成桌面与移动端走查，并生成 Gate Repair 结论；不提交、不推送且不宣布 P3/P4 准入。

## I2 mobile fixed-nav re-review repair

- [x] 在真实约 390×844 viewport 复现 fixed bottom navigation 对 Reject、Review、Retry、Discard 的视觉遮挡和指针误命中。
- [x] 仅以最小 mobile CSS/布局改动为每个关键 action 提供可滚动到底的安全空间与不被导航覆盖的命中区域。
- [x] 对 Reject、Review、Confirm、Retry、Discard 分别执行滚动、rect 测量、坐标式真实指针点击及正确结果验证。
- [x] 记录 I2 复审修复结果；不提交、不推送，不改变其他 P1/P2 体验。

## Approved P1/P2 baseline closure

- [x] 审查当前 git diff，确认仅含 P1/P2 Prototype、focused refinement、Gate Repair 与必要说明文档。
- [x] 完成提交前类型检查并创建 approved P1/P2 baseline 提交。
- [x] 推送至 origin/main，并核验 local HEAD 与 origin/main 相等、工作树干净。

## P3 Recovery Lab — prototype exploration

- [x] 复核冻结体验与系统契约中有关 Branch、Restore、Correction、history 与 confirmation 的 P3 边界；不改动 approved P1/P2 baseline。
- [x] 设计 P3 的最小恢复意图状态模型和 Desktop/Mobile 主路径，明确当前路径、可安全尝试的 Branch、Restore preview 与 confirmation 的区别。
- [x] 以 Quiet Observatory 构建静态、可点击的 P3 Recovery Lab 原型；不扩展 P4，不接入 runtime、持久化或后端。
- [x] 验证 P3 的恢复、分支和取消路径，记录可理解性结论与仍待验证的问题。

## P3-B1 — P2 Return Continue mobile repair

- [x] 在 390×844 viewport 复现 Continue at the lamp room 与 fixed bottom navigation 的 rect 重叠和真实 pointer 误命中。
- [x] 仅为 P2 Return 的 Continue action 增加有效 scroll-end / hit-area clearance；不改变 World / Continuity / More IA 或 P2 current truth。
- [x] 以真实坐标式 pointer 复核 Continue 进入 C-119 corrected World，并回归检查 P1 与 P3 mobile controls。
- [x] 记录 focused self-test 结果；不提交、不推送且不宣布 P3 Freeze。

## P3 Approved Baseline Freeze

- [x] 审查当前 git diff/status，确认仅含 P3 Recovery Lab、P3-B1 mobile 修复、Gate/re-review evidence 与必要说明。
- [x] 完成提交前检查；待创建 approved P3 Recovery Lab baseline 提交。
- [ ] 推送至 origin/main，并核验 local HEAD 与 origin/main 相等、工作树干净。
