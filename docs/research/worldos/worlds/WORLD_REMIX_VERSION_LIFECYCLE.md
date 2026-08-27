# World Remix / Version Lifecycle

研究状态：`PARTIAL / TESTED`

## Remix 的创建语义

- 来源：`/zh-cn/worlds/hogwarts-movie` → `改编`。
- 点击后立刻创建一个新 World slug：`/zh-cn/worlds/hogwarts-3bmx`，并另开编辑页 `/edit`。
- 即使没有再次点击发布，公开详情 URL 已可访问，版本记录显示 `v1`。
- 详情页显示 `改编自 霍格沃茨模拟器（电影版） · World101`，来源 attribution 自动生成。

## 复制范围

Remix 编辑器中确认完整复制：

- 标题、封面、主题、简介、Markdown 介绍；
- 10 个角色及角色描述、展示身份、性别、自定义开关；
- 玩家初始化字段、变量名、默认值、快捷选项；
- 全部 10 个 Apps 及各 App 配置；
- 系统指令、输赢规则、游戏开场；
- 顾问预设问题、控制台开关；
- 实时布局预览。

这不是只复制公开门面，而是接近完整 Creator 配置副本。

## Preview

- `/preview` 是 Turn 0 的完整 Simulation 壳层，加载复制后的 Apps、角色、开场 Story、Wallet 等。
- 输入框不可用，因此 Preview 是只读/不可互动的运行态预览。
- 编辑器的实时预览同步显示修改后的标题，但直接打开 preview URL 曾短暂展示旧标题，存在异步保存/缓存延迟。

## Version

- Remix 创建后公开页已有 `v1`，日期为创建日。
- 编辑器发布按钮显示 `发布 v2`，说明每次发布预期创建下一版本，不覆盖版本号。
- 修改标题/简介后，Creator 显示 `草稿已自动保存`、`这个世界有尚未发布的修改`；公开页继续保持上一版本，确认存在 Draft/Published 双态。
- v2 已成功发布，版本标题 `TEST v2 update`；公开页版本记录同时保留 v2（最新版）与 v1，更新日志独立展示。
- 发布完成 toast：`已发布。其他语言版本正在生成，完成前将显示原始语言。`
- 发布弹窗明确：`新开局会使用此版本；现有存档可自行选择是否应用。`
- 后续再修改一句话简介并发布成功 v3，版本标题 `TEST v3 after skipped v2`；说明连续发布按 v1 → v2 → v3 递增。

## Version 与既有 Simulation

实验存档：`/zh-cn/sim/10824e9b-4467-42a6-861a-efc0c4ef137c`，在 World v1 时创建，Turn 0。

- v2 发布后，首次刷新并打开设置自动弹出更新块：当前 `v1`、`世界配置已更新至 v2`、版本标题、更新日志、`应用更新`、`暂不更新`。
- 提示说明：应用后会安装新增 App 并合并新版初始化配置；模拟进度和已修改内容会保留。
- 点击 `暂不更新` 后，当前面板移除提示；刷新与再次打开设置均不再显示 v2。界面没有发现手动恢复该次升级提示的入口。
- 当 World 后续发布 v3 后，同一仍为 v1 的存档再次收到更新块，但直接指向最新 v3，而不是重新提示 v2；因此“暂不更新”只抑制当前目标版本，不永久退出后续版本通知。
- 在 v3 更新块点击 `应用更新`，鼠标点击与键盘 Enter 都只关闭/保持面板，无 success toast；再次打开设置仍显示当前 `v1` 和同一 `世界配置已更新至 v3` 提示。此样本中应用没有落地，属于稳定可复现的 no-op / 潜在缺陷。
- 第二个独立样本已验证成功路径：`TEST Map World 001` v2 新增 `TEST App 001`，旧 v1/Turn 1 Simulation 点击 `应用更新` 后升级为 v2并新增可运行 App；v3 从 World 卸载该 App 后，同一 Simulation 接受更新并完整移除 App。
- 成功更新不会重建 Simulation：原 Story 与 Turn 1 保持，新增/移除仅作用于 World 配置层。纯 iframe 本地交互也不增加 Turn。
- 第三个 World 版本样本 `TEST App Upgrade World 001` 从 v2 发布到 v3：加入社区 App 与 World-local Character 后，公开页立即列出二者；新建 Turn-1 Simulation 直接运行 App v4。此样本作为后续 App 自身 v5 传播实验的既有存档基线。
- 因此原 Hogwarts 样本的 no-op 不是 `应用更新` 的普遍行为；更可能与该版本只有文案/标题变化、特定 World/配置组合或样本缺陷有关。角色/初始化字段冲突的具体合并仍为 `UNKNOWN`。

## 其他生命周期入口

- 公开详情页作者可见：`继续编辑`、`删除世界`、`改编`、合集、分享。
- 编辑器危险区域明确：删除世界会永久移除它和其中安装的 App。
- 不公开列出与私有均为会员功能。

## Confidence

- Remix 立即生成 slug、v1、attribution 与完整复制范围：`TESTED`。
- Draft/Published 双态、v2/v3 递增发布与版本日志：`TESTED`。
- 旧存档收到最新版本、`暂不更新` 抑制当前版本、后续版本再次提示：`TESTED`。
- `应用更新` 新增/移除 App 的真实成功路径：`TESTED`；Hogwarts 文案型更新 no-op 根因仍 `UNKNOWN`。
- 删除行为：尚未执行。
