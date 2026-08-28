# Simulora P1/P2 高保真原型：设计探索

**阶段边界：** 本文件仅指导可点击原型的视觉与交互表达，不冻结最终 UI、最终视觉设计、品牌或产品实现。

## 三个探索方向

### Quiet Observatory / 静谧观测台

**Very Brief Intro：** 以一座安静、可靠的夜间观测台承托持续运行的私人世界。深色环境提供世界感，明亮记录面承担所有需要信任、阅读与确认的内容。

**Probability：** 0.06

### Living Archive / 生长档案

**Very Brief Intro：** 把连续性、关系与回归理解为一份仍在书写的档案。更温暖、更编辑化，以章节、印记和低饱和的时间感建立珍视过去的情绪。

**Probability：** 0.03

### Signal Studio / 信号工作室

**Very Brief Intro：** 明亮、精确、克制的创作与观察空间。它强调状态可读性和控制感，适合 creator-capable 体验，但必须避免滑向企业控制台。

**Probability：** 0.08

## 已选方向：Quiet Observatory / 静谧观测台

### Design Movement

**Calm nocturne editorialism（静夜编辑主义）**：以深色空间、安静的环境图和高可读记录面形成“观察世界，而不是操控代理”的体验。它拒绝赛博终端、重玻璃和常驻高运动，也不把叙事页面做成复古书页拟物。

### Core Principles

1. **事实比氛围更清楚：** Commit、scope、confirmation、error 和 recovery 必须位于安静、强对比、可长读的表面。
2. **一个稳定主视域：** 当前世界和用户 Action 始终是中心；连续性、变化与恢复按意图被召回，不堆成仪表盘。
3. **深度来自层次，不来自特效：** 暗色景深、细微颗粒、环境光和纸质记录面提供世界感；不依赖 shader、流光或液态效果。
4. **运动只帮助定位：** 面板、状态与确认使用短距离、可中断的过渡；减少动态时以静态终态和 opacity 完整传达意义。

### Color Philosophy

背景使用近黑的 **midnight ink**，不是纯黑；它给环境图与排版留出呼吸。主要阅读面是偏暖的 **moon paper**，让 Commit、scope 和历史拥有可靠的“被记录”感。唯一品牌信号色为 **Signal Amber**：它只表示“值得注意但尚未构成危险”的世界信号，不用来单独表达成功、错误、权限或确认。状态永远同时使用文字、图标与结构。

### Layout Paradigm

采用**观测台式三段视域**，而不是传统 SaaS 卡片网格：左侧是小而稳定的世界坐标（世界、Branch、位置、参与合同）；中央是宽阔的当前场景/叙事与 Action；右侧是窄的“观测记录”带，只显示最近可解释的改变和下一条线索。详细的 Continuity Lens、Return Orientation 与 Recovery Lab 从这个稳定基线以 sheet/overlay 进入，关闭后回到原参与点。

### Signature Elements

1. **Signal thread：** 极细的琥珀点线连接“刚刚发生的变化”与“可继续的下一点”，只作为导航/关系提示，不作为事实唯一表达。
2. **Record surfaces：** 温暖、低光泽的文档式内层承载 confirmation、source/scope 与 correction，带有微弱纸纤维感而非玻璃模糊。
3. **Observatory frame：** 深色边缘、远景图与小型坐标符号组成稳定世界边界，不使用终端网格或霓虹 HUD。

### Interaction Philosophy

用户每次决定都应感到自己“看见了一个世界的状态，然后决定是否介入”。重要动作先解释影响，再请求准确确认；普通 Action 的确认明确写成“收到，但尚未改变世界”。所有 detail surface 都有清晰的返回世界路线，且保留当前 Branch/Action context。

### Animation

常规状态变化为 140–220ms 的 opacity + 轻微 translate；大面板为 220ms 的短位移并遵循 `prefers-reduced-motion`，降低动态时直接淡入或即时切换。Commit 可以出现一次琥珀 signal thread 的短暂推进与记录面文字渐显，但不允许粒子爆炸、无限循环光效或大面积缩放。keyboard 触发的操作不增加延迟动画。

### Typography System

叙事/世界标题采用 **Fraunces** 的少量高对比 display 使用，塑造观察与时间感；界面、状态、scope 和控制采用 **Manrope**，保证长时阅读、数字与中文混排时的清晰度。标题不滥用大写；meta 信息保持紧凑、定宽数字优先。严格区分：世界叙事、用户权限说明、系统状态和历史来源。

### Brand Essence

**定位：** 为长期返回同一私人世界的人提供一个可理解、可纠正、不会夺走其行动权的持续世界观测与参与空间。
**人格：** 沉静、可信、富有想象力。

### Brand Voice

语气是克制的、具体的、有世界感但不神秘化系统。避免“AI 正在思考”“魔法发生了”这类无法验证的说法；用用户能检查的事实、影响与下一步表达状态。

> “你的选择已收到。世界仍保持原状，正在核对这一步会影响什么。”

> “灰港的灯塔重新点亮了。它改变了航线，也让伊莲知道你回来了。”

### Wordmark & Logo

原型标记是一个**被一条细轨道穿过的半闭合圆环**：它暗示观测轨道、持续循环和一个仍可由用户介入的缺口。原型中只使用符号，不把默认字体的品牌名当作正式 logo。

### Signature Brand Color

**Signal Amber — `#D9A441`**。它以低频信号、非告警的注意力和世界持续脉动为目的，必须与清晰文字和图标共同出现。

## 原型范围提醒

本设计现覆盖 P1 Action Truth、P2 Return Orientation → Continuity Lens → Correction 与 P3 Recovery Lab。它不授权新的后端、真实模型、真实持久化、地图、市场、公开社交、成员体系、P4 World Studio 或完整产品页面。

## Style Decisions

1. **Signal thread 是关系语言，而非装饰。** 它持续连接当前位置、待处理 Action、最近 Change Trace 与可继续的下一点；事实仍由文字、记录与状态明确表达。
2. **原型导航是观测坐标而非 SaaS 标签。** P1/P2 用作探索切换，但其视觉更像正在观测的两个体验切片，而非管理后台的顶栏功能页。
3. **所有暖色记录面都是 field documents。** 输入、提案、确认与 Correction 均应表达记录编号、当前 scope 或后果边界，避免退化为通用表单卡。
4. **P3 的 Signal thread 必须连接可见关系。** 当 Recovery/Continuity 出现时，它至少连接 current record、用户所选 intent 与需要 review 的 boundary；孤立的琥珀点不足以构成状态表达。
5. **Recovery 的保全说明先于确认。** Recovery Lab 的文档面必须在任何后续操作前呈现 source、scope、preserved 与 not-affected 边界；它不使用普通设置卡的视觉逻辑。
6. **Prototype slices 是 observatory coordinates。** 原型顶栏以 Observation slice 的分段坐标呈现，不用常规 SaaS active-tab 填充样式定义当前 surface。
