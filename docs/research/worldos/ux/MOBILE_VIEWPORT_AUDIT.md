# Mobile Viewport Audit

研究状态：`PARTIAL`

## Method

- Earlier runs used `390×844`, `360×740` and a narrow 518×546 shell. EVD-0228 used the browser's explicit viewport capability for deterministic `360×844` portrait and `844×360` landscape tests, then reset to `1280×720`.
- Core samples include public World detail, World Creator and a persistent World Simulation with main-input and Character Chat Turns.

## Observations

- World 详情在手机宽度仍保留完整内容与作者操作入口；公开信息、attribution、开始/编辑/删除/改编、角色与 App 列表均在 DOM 中。
- Simulation 在手机宽度保留顶栏 Events/Memory/Advisor/Settings、全部 App 窗口、建议、主输入、Story、Wallet、State 与 Inventory。
- Chat 角色按钮在手机宽度加入首字头像占位，例如 `罗 罗恩·韦斯莱`，与桌面只显示名字/摘要不同。
- 当前 DOM 暗示页面仍可纵向访问完整窗口集合；尚未完成视觉截图与每个 Dock/全屏/最小化按钮的触控路径审计。
- World Creator 在 390×844 下使用移动导航壳：顶部 `菜单`/Credits/通知/账户，底部 `探索 / 我的 / + / 社区 / App 市场`。
- Creator 的核心控件仍可达：`发布 v5`、题材模板、安装 App、可见性、App 卡片、预览设备与设计布局。
- 窄版 Live Preview 将地图、行动面板与 Dock 纵向堆叠；实测 `scrollWidth=382`、`innerWidth=390`，该样本没有水平溢出。
- 真正 360×740 Simulation 复测：`innerWidth=360`、`scrollWidth=360`；Events/Memory/Advisor/Settings、Map search、建议、主输入与 Dock 均可达。Settings 在该样本额外显示 `文字速度 100%`。
- 同一轮 Search 页面未接受 viewport override，仍报告 1280px；因此 Search 手机行为继续记为 UNKNOWN，不能用该样本推断。
- `390×844` 的 `/worlds/hogwarts-movie/new` setup 以响应式默认 `文游小手机` 模式创建：1280px 默认自由沙盒、390px 默认小手机，但两种宽度下点击/Space 切换另一个 setup 选项均未改变 `aria-pressed`，记为控件 no-op/UNKNOWN bug boundary。输入存档名/玩家名/风格后，先遇到 per-World 存档位满状态（5 位，含已购 2 位），页面内给出 `增加存档位 · 80` / `取消`。使用测试电量扩容后创建 `/zh-cn/sim/65b5d320-4413-4507-8194-972f64abdcac`。
- 文游模式底栏固定为 `剧情 / 手机 / 设置`。手机页呈现真实手机桌面 IA：时钟日期、App 图标、空位 `点击添加`、底部 Chat 图标和 `长按图标可整理位置`；设置页仍保留 Events/Memory/Advisor、checkpoint、模型、导出和显示设置。
- `切换界面模式` 可在同一个 Simulation 内双向切换 `自由沙盒` / `文游小手机`。切换没有消耗回合，也没有重置 Turn-1 Story；自由沙盒在 390px 下仍报告 `scrollWidth=390`，无水平溢出。
- 图片 Widget 可删除回空位并跨 reload 持久化；场景库与当前 World 角色头像都可作为 Widget 来源。`我的角色`在该组件中实际列出当前 World 的 10 个角色。
- 手机 App 的 `刷新`是 AI/App action：预言家日报刷新消耗 9 电量并产生回合 2、Event Delta 与下一期报纸，不是免费的 iframe reload；`back` 返回桌面。
- 最新窄屏复测（当前浏览器 `518×546` CSS viewport）补充了 World 详情 `预览` 展开：面板在原页展开，展示 opening/相关 World/改编入口，不导航、不创建回合；同一窄屏 Simulation 中主输入和 World-local 角色聊天均可聚焦并完成真实 AI Turn（EVD-0226）。
- EVD-0228 resolves the earlier environment-blocked 360px core-flow gap. At explicit `360×844`, Simulation reports `scrollWidth=360`; Settings is a full-viewport 360×844 dialog, Character list/thread/composer remain reachable, the textarea receives focus and a real Character Chat action completes `Turn 13→14` with `155→145` energy. Leave-to-Creator then Browser Back restores the same Turn/content without overflow.
- World Creator at explicit `360×844` reports `scrollWidth=352` and exposes its full long form, mobile header/bottom nav, a 256×844 side menu and the complete Preview/Publish/Danger sections. The live Preview selector has three modes: desktop iframe 1280×800 scaled into 318×198.75, mobile iframe 390×780 scaled into 318×636, and a distinct `开局设置` form Preview. Desktop mode was restored.
- At explicit `844×360`, the same Simulation switches to the multi-panel desktop-style runtime (main input/Story/Newspaper/Character State/Chat/Movie/Wallet/Shop) with `scrollWidth=844`, `scrollHeight=360` and unchanged Turn 14. This verifies the breakpoint/orientation transition for the emulated viewport.
- 1200 ms 鼠标长按仍打开 App，无法代表真实 touch long-press；重排继续保留为 `UNKNOWN` 输入边界。

## Remaining

- 首页、Search、Map、App Market 的手机导航；
- 手机桌面的真实 touch 长按重排、空位与 App 安装的差异、后台/多任务行为；自由沙盒 Dock 的完整横滑/折叠手势；
- 真实软件键盘弹起时的 visual viewport/控件遮挡；桌面仿真只能验证 focus/fill/send；
- 刘海/圆角设备的 safe-area；EVD-0228 已验证 844×360 布局切换，但不代表真实设备 cutout；
- Mobile Creator 的真实触控编辑/拖拽与 OS 后台/恢复。
# Environment Recheck (EVD-0200)

- Requested a browser viewport override of `390x844` **before** creating a fresh WorldOS tab. The fresh page still reported `1280x720` with desktop navigation.
- This rules out an already-open-tab-only limitation. True mobile breakpoint/touch conclusions remain `UNKNOWN / ENVIRONMENT_BLOCKED`; do not use the desktop render as evidence against WorldOS mobile support.

# Environment Resolution (EVD-0228)

- The later explicit viewport capability successfully produced and measured `360×844` and `844×360`; core responsive rendering is no longer environment-blocked.
- EVD-0200 remains valid evidence for that earlier failed override path, not the current environment. Touch events, OS keyboard, safe-area and background suspension remain device-bound UNKNOWNs.
