# Mine / Collections

研究状态：`PARTIAL / TESTED`

## Mine IA

入口 `/zh-cn/sims`，一级 Tab：

- `作品`
- `历史`

作品二级：World / Character / Collection / App；World 与 App 还有 `我创建的 / 我收藏的`。

历史二级：World / Character。早期样本曾出现空态，但后续已加载出完整列表，因此不能继续把空态当作稳定语义；它更可能是异步加载/旧页面 bug。新建的移动 Simulation 在 Mine 中立即显示 Turn 1。EVD-0243 当前快照为 World History 19、Character History 4，均一次性渲染、滚底不追加。

移动端 History 卡片 `更多` → `重命名` 会打开预填名称的 modal。提交后同一 render 未更新卡片且无 toast，但 reload 后新名称持久化，并同步到直接 Simulation 页面标题；URL 和 Turn 不变。

## World author state

- 创建的 Remix World 在 Mine 卡片上显示 `有未发布修改 · N分钟前`。
- 卡片动作：继续编辑、改编、删除、立即开始。
- 这解释了公开详情仍显示旧 v1：编辑器修改已自动保存为 draft，但没有成功发布到公开版本。

## App

- 创建的 `TEST App 001` 出现在 Mine → App → 我创建的。
- 卡片展示作者、使用 World 数、简介、tags、收藏与安装。
- App 列表有明显异步加载延迟；切换后需要等待才出现卡片。

## Collection creation

入口：Mine → Collection → `创建合集` → `/zh-cn/collections/new`。

字段与行为：

- 名称、介绍、逗号分隔 tags；
- 可见性：Public / Link-visible / Only me，均未显示会员限制；
- 最多 100 Worlds；
- 可添加自己的 Worlds，也可搜索公开 Worlds；
- 文案支持拖动排序；
- 保存时按钮进入 `正在保存…`，完成后跳转生成 slug。

测试 Collection：`/zh-cn/collections/test-collection-001-g6wi`。

公开页展示：world count、creator、tags、Markdown/文章介绍、edit、save/favorite count、share、delete，以及内部 Worlds。

## Collection membership removal

在 `TEST Collection 001` 的编辑页中，成员行的两个无文字图标分别是拖拽手柄和垃圾桶。点击垃圾桶只修改当前编辑态，不弹确认框，也不会立即离开页面；计数从 `2/100` 变为 `1/100`，被移除的 `TEST Template World 001` 同时回到右侧“我的世界”列表并出现 `添加`。

点击 `保存合集` 后按钮进入 `正在保存…`，完成后自动跳回稳定详情 URL。详情页从 `2 个世界` 变为 `1 个世界`；直接 reload 仍为 1，重新打开 edit 仍只保留 `TEST World 001`，被移除 World 仍作为可添加候选出现。保存前后通知未读计数均为 2，没有新增 Collection 通知。成员移除因此是显式保存提交，不是即时写入；没有单项撤销或二次确认。Evidence: `EVD-0206`。

非空合集整体删除使用浏览器原生确认，与成员垃圾桶完全不同。一次性 `TEST Collection Nonempty Delete 001` 先以 `仅自己` + 1 个 World 保存；第一次确认框取消后对象保留，第二次接受后跳到首页。详情和 edit 均 404，精确合集搜索为 0，Owner Profile 和成员 World 的反向合集区都移除该记录；成员 `TEST Template World 001`、v4 版本记录及存档保持正常。整体删除因此只删除 Collection 和 membership edge，不级联 World/Simulation。Evidence: `EVD-0216`。

## Localization finding

- 输入英文 `TEST Collection 001`，公开页展示为 `测试系列 001`；
- 输入英文 `TEST Character 001`，详情展示为 `测试角色 001`。
- WorldOS 似乎对部分用户创建名称执行自动本地化/翻译；slug 仍从原始英文产生。具体触发规则 `UNKNOWN`。
