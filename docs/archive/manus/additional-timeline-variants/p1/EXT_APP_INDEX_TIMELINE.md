# EXT_APP_INDEX_TIMELINE

**任务：** App Discovery Convergence Monitor  
**目标站点：** https://worldos.cc  
**专用资产：** `EXT-INDEX-20260825-0445`  
**App slug：** `ext-index-20260825-0445`  
**Owner / Creator：** `idakellams159`（`IdaKellams159@outlook.com`）  
**状态：** 进行中

## 测试边界

本实验只追踪专用 `EXT-INDEX-*` App 的 Direct URL、App Market 与 Unified Search 三个投影的收敛情况。App 采用最小静态 HTML，不含外部链接、用户数据或付费功能。不会修改任何不属于 `EXT-*` 前缀的既有资产，不执行真实付款、充值、会员购买、访问控制绕过、隐藏 API 调用或高频请求。

## 资产与发布基线

| 项目 | 记录 |
|---|---|
| App 名称 | `EXT-INDEX-20260825-0445` |
| App URL | https://worldos.cc/apps/ext-index-20260825-0445 |
| 创建方式 | App Studio 手写最小静态 HTML |
| 可见类别 | Community（详情页可见） |
| 发布完成并首次确认 Direct URL 的时间 | 2026-08-25 04:49:22 GMT+8 |
| T+0 参考时间 | 2026-08-25 04:49:22 GMT+8 |
| 初始 usage | 0 worlds use this |
| 初始 Owner 可见余额 | 866 Zaps（发布前后未使用任何付费功能） |

## 时间序列

状态说明：`YES` 为在该入口直接观察到；`NO` 为正常 UI 检索不到；`PENDING` 为尚未到对应检查步骤；`UNKNOWN` 为页面/身份条件阻塞而无法得出结论。

| 绝对时间（GMT+8） | 相对时间 | 身份 | 状态 | Direct URL | Market—title | Market—slug | Unified—title | Unified—slug | Hard reload | 证据与备注 |
|---|---:|---|---|---|---|---|---|---|---|---|
| 2026-08-25 04:49:22 | T+0 | Owner | Published | YES | PENDING | PENDING | PENDING | PENDING | NO | Detail 页显示完整标题、Owner `idakellams159`、`0 worlds use this`、Edit/Delete/Install；证明 Direct public 已建立，但并不代表 Market/Search 已收敛。截图：`/home/ubuntu/screenshots/worldos_cc_2026-08-25_04-49-22_2629.webp`。 |

## 当前结论

> 已确认 **发布后 Direct URL 可访问**。Market 与 Unified Search 是否已建立索引尚未检查，因此当前不能将 Direct 可访问误判为发现入口已收敛。

## 后续采样计划

固定目标点为 T+1、T+5、T+15、T+30、T+60、T+120 分钟；之后每 2 小时一次，直至所有身份/入口连续两次结果一致或达到 12 小时上限。每一关键状态至少进行一次硬刷新；在不干扰索引监测的间隔中执行独立 `EXT-GIFT-*` 对照实验。

## References

[1]: https://worldos.cc/apps/ext-index-20260825-0445 "EXT-INDEX-20260825-0445 — WorldOS"
[2]: https://worldos.cc/apps "WorldOS App Market"

## Owner T+0 Market 检索补充

| 绝对时间（GMT+8） | 相对时间 | 身份 | 入口 | 查询 | 结果 | 证据 |
|---|---:|---|---|---|---|---|
| 2026-08-25 04:49:56 | T+0:34 | Owner | App Market | 完整 title：`EXT-INDEX-20260825-0445` | YES | 返回唯一的同名 Community App 卡片，显示 Owner `idakellams159` 与 `0 worlds use this`。截图：`/home/ubuntu/screenshots/worldos_cc_2026-08-25_04-49-56_8737.webp`。 |
| 2026-08-25 04:50:03 | T+0:41 | Owner | App Market | 完整 slug：`ext-index-20260825-0445` | YES | 返回同一唯一 App 卡片。截图：`/home/ubuntu/screenshots/worldos_cc_2026-08-25_04-50-03_8897.webp`。 |

> Owner 视角中，Market title 和 Market slug 均在首次采样时已可检索；这仅证明 Owner Market projection 的最短已观察收敛时间不超过 41 秒，并不证明 Guest 或非 Owner 入口已同步。


## Owner T+0 Unified Search / Apps 检索

| 绝对时间（GMT+8） | 相对时间 | 身份 | 入口 | 查询 | 结果 | 证据 |
|---|---:|---|---|---|---|---|
| 2026-08-25 04:50:55 | T+1:33 | Owner | Unified Search → Apps | 完整 title：`EXT-INDEX-20260825-0445` | NO | Apps 标签明确显示 `No results yet.`。截图：`/home/ubuntu/screenshots/worldos_cc_2026-08-25_04-50-55_3747.webp`。 |
| 2026-08-25 04:51:17 | T+1:55 | Owner | Unified Search → Apps | 完整 slug：`ext-index-20260825-0445` | NO | Apps 标签明确显示 `No results yet.`。截图：`/home/ubuntu/screenshots/worldos_cc_2026-08-25_04-51-17_8028.webp`。 |

> 截至约 T+2，Owner 视角已呈现显著投影差异：**Direct URL = YES；App Market（title/slug）= YES；Unified Search → Apps（title/slug）= NO**。


## Non-owner 延迟采样：Direct URL 与 App Market

| 绝对时间（GMT+8） | 相对时间 | 身份 | 表面 / 查询 | 结果 | 证据 |
|---|---:|---|---|---|---|
| 2026-08-25 05:05:37 | T+16:15 | Non-owner (`2518wllalpor`) | Direct URL：`/apps/ext-index-20260825-0445` | YES | 详情页成功显示 title、Creator 与公开描述。截图：`/home/ubuntu/screenshots/worldos_cc_2026-08-25_05-05-37_2338.webp`。 |
| 2026-08-25 05:06:13 | T+16:51 | Non-owner | App Market 完整 title：`EXT-INDEX-20260825-0445` | YES | 仅返回专用 App 卡片。截图：`/home/ubuntu/screenshots/worldos_cc_2026-08-25_05-06-13_2486.webp`。 |
| 2026-08-25 05:06:21 | T+16:59 | Non-owner | App Market slug：`ext-index-20260825-0445` | YES | 仅返回专用 App 卡片。截图：`/home/ubuntu/screenshots/worldos_cc_2026-08-25_05-06-21_1281.webp`。 |

| 2026-08-25 05:07:07 | T+17:45 | Non-owner (`2518wllalpor`) | Unified Search 完整 title：`EXT-INDEX-20260825-0445`，Apps 分类 | YES | 搜索结果明确显示 Apps 分组下的专用 App。截图：`/home/ubuntu/screenshots/worldos_cc_2026-08-25_05-07-07_4142.webp`。 |
| 2026-08-25 05:07:29 | T+18:07 | Non-owner (`2518wllalpor`) | Unified Search slug：`ext-index-20260825-0445`，Apps 分类 | YES | 搜索结果明确显示 Apps 分组下的专用 App。截图：`/home/ubuntu/screenshots/worldos_cc_2026-08-25_05-07-29_7654.webp`。 |

> Non-owner 延迟采样已在 2026-08-25 05:07:29（GMT+8）完成。05:07:48 已退出 `2518wllalpor`，准备切换至 Owner 采样；账号切换本身不改变索引资产状态。

| 2026-08-25 05:08:13 | T+18:51 | Owner (`idakellams159`) | 登录与基线确认 | 已登录 | Creator 账户正常登录；可见余额 866 Zaps。该切换未修改 EXT-INDEX 资产。 |

## Owner 延迟采样：Direct URL 与 App Market

| 绝对时间（GMT+8） | 相对时间 | 身份 | 表面 / 查询 | 结果 | 证据 |
|---|---:|---|---|---|---|
| 2026-08-25 05:08:34 | T+19:12 | Owner (`idakellams159`) | Direct URL：`/apps/ext-index-20260825-0445` | YES | 详情页显示专用 App 与 Owner 专用 Edit / Delete 控件。截图：`/home/ubuntu/screenshots/worldos_cc_2026-08-25_05-08-34_6028.webp`。 |
| 2026-08-25 05:08:50 | T+19:28 | Owner | App Market 完整 title：`EXT-INDEX-20260825-0445` | YES | 仅返回专用 App 卡片。截图：`/home/ubuntu/screenshots/worldos_cc_2026-08-25_05-08-50_6446.webp`。 |
| 2026-08-25 05:08:59 | T+19:37 | Owner | App Market slug：`ext-index-20260825-0445` | YES | 仅返回专用 App 卡片。截图：`/home/ubuntu/screenshots/worldos_cc_2026-08-25_05-08-59_9168.webp`。 |

| 2026-08-25 05:09:43 | T+20:21 | Owner (`idakellams159`) | Unified Search 完整 title：`EXT-INDEX-20260825-0445`，Apps 分类 | YES | 搜索结果明确显示 Apps 分组下的专用 App。截图：`/home/ubuntu/screenshots/worldos_cc_2026-08-25_05-09-43_9820.webp`。 |
| 2026-08-25 05:10:10 | T+20:48 | Owner (`idakellams159`) | Unified Search slug：`ext-index-20260825-0445`，Apps 分类 | YES | 搜索结果明确显示 Apps 分组下的专用 App。截图：`/home/ubuntu/screenshots/worldos_cc_2026-08-25_05-10-10_6582.webp`。 |

### 当前收敛状态（T+20:48）

在 Owner 与 Non-owner 两个已验证会话中，Direct URL、App Market（title/slug）与 Unified Search Apps 分类（title/slug）均为 `YES`。首个可观察到的全表面、双身份可见证据目前为 Non-owner 的 Unified Search slug `YES`（T+18:07）；但根据任务要求，仍需继续完成至少三次 30 分钟间隔的稳定性采样，之后才可声明索引稳定。


## T+30 稳定性采样 — Owner

| 绝对时间（UTC；GMT+8 = +8h） | 身份 | Direct URL | Market title | Market slug | 结论 |
|---|---|---|---|---|---|
| 2026-08-25 05:19:59–05:20:26 | Owner (`idakellams159`) | YES | YES | YES | 三项均持续可见；尚待 Unified Search 与 Non-owner 对照。 |

证据截图：Direct URL `/home/ubuntu/screenshots/worldos_cc_2026-08-25_05-19-59_6423.webp`；Market title `/home/ubuntu/screenshots/worldos_cc_2026-08-25_05-20-18_6888.webp`；Market slug `/home/ubuntu/screenshots/worldos_cc_2026-08-25_05-20-26_7695.webp`。

| 2026-08-25 05:20:58 UTC | T+30:36 | Owner (`idakellams159`) | Unified Search 完整 title，Apps 分类 | YES | Apps 分组中持续返回专用 App。截图：`/home/ubuntu/screenshots/worldos_cc_2026-08-25_05-20-58_3190.webp`。 |
| 2026-08-25 05:21:21 UTC | T+30:59 | Owner (`idakellams159`) | Unified Search slug，Apps 分类 | YES | Apps 分组中持续返回专用 App。截图：`/home/ubuntu/screenshots/worldos_cc_2026-08-25_05-21-21_1882.webp`。 |

> Owner 的 T+30 窗口已完成：Direct URL、Market（title/slug）与 Unified Search（title/slug）均为 `YES`。


## T+30 稳定性采样 — Non-owner

| 绝对时间（UTC；GMT+8 = +8h） | 身份 | Direct URL | Market title | Market slug | 结论 |
|---|---|---|---|---|---|
| 2026-08-25 05:22:18–05:22:51 | Non-owner (`2518wllalpor`) | YES | YES | YES | 三项均持续可见；尚待 Unified Search 复核。 |

证据截图：Direct URL `/home/ubuntu/screenshots/worldos_cc_2026-08-25_05-22-18_6796.webp`；Market title `/home/ubuntu/screenshots/worldos_cc_2026-08-25_05-22-42_4184.webp`；Market slug `/home/ubuntu/screenshots/worldos_cc_2026-08-25_05-22-51_8490.webp`。

| 2026-08-25 05:23:40 UTC | T+33:18 | Non-owner (`2518wllalpor`) | Unified Search 完整 title，Apps 分类 | YES | Apps 分组中持续返回专用 App。截图：`/home/ubuntu/screenshots/worldos_cc_2026-08-25_05-23-40_8681.webp`。 |
| 2026-08-25 05:24:12 UTC | T+33:50 | Non-owner (`2518wllalpor`) | Unified Search slug，Apps 分类 | YES | Apps 分组中持续返回专用 App。截图：`/home/ubuntu/screenshots/worldos_cc_2026-08-25_05-24-12_3414.webp`。 |

> Non-owner 的 T+30 窗口已完成：Direct URL、Market（title/slug）与 Unified Search（title/slug）均为 `YES`。Owner 与 Non-owner 的跨表面结果一致。


## 监测规则变更与 Install 状态尝试

> 根据用户在 2026-08-25 05:50 UTC 的新指示，原先的 30 分钟及更长稳定性监测已取消。自此以后，每个**实际发生的**生命周期状态变更仅按 T+0、T+1、T+3、T+5 分钟采样，并以“连续两次矩阵一致或 T+5”为停止条件。

| 时间（UTC） | 操作 | 结果 | 证据 / 后续处置 |
|---|---|---|---|
| 05:51:00 | Account B 在 `EXT-INDEX-20260825-0445` 打开标准 Install 选择器 | 选择器列出两个既有非测试 World；未使用。 | `/home/ubuntu/screenshots/worldos_cc_2026-08-25_05-51-00_3783.webp` |
| 05:51:10–05:51:31 | 创建隔离目标 `EXT-INDEX-INSTALL-20260825-0551` 并提交配置页 Install | 配置页关闭，但未显示成功消息或跳转。 | `/home/ubuntu/screenshots/worldos_cc_2026-08-25_05-51-31_3346.webp` |
| 05:51:39 | 硬刷新（`Ctrl/Cmd+Shift+R`）专用 App 详情页 | 详情页仍显示 `0 worlds use this`。 | `/home/ubuntu/screenshots/worldos_cc_2026-08-25_05-51-54_4723.webp` |

**判定：`INSTALL_NOT_OBSERVED`。** 由于标准安装提交后没有可见成功确认，且硬刷新后的 App 使用数仍为 0，不能将其视为实际状态变化。因此不对“Install 后索引传播”虚构 T+0/T+1/T+3/T+5 结论；将先核验新建隔离 World 是否存在，若不存在或未含该 App，则记录为生命周期阻塞并继续可操作状态。


## 下架 / 重上架可用性检查

| 时间（UTC） | 身份 | 可见标准控件 / 说明 | 判定 |
|---|---|---|---|
| 2026-08-25 05:53:46 | Owner | 编辑配置仅有 Save draft、Publish 和 Delete；未提供独立的 Delist / Unpublish 控件。页面说明：`If other users' worlds run it, it can only be delisted (hidden from the market; installed worlds keep working).` | 当前 App 显示 `0 worlds use this`，且前述隔离安装未形成可观察使用数；因此没有可安全执行、可验证的下架状态。`DOWNLIST/RELIST = BLOCKED — control unavailable for current asset state`。 |

截图：`/home/ubuntu/screenshots/worldos_cc_2026-08-25_05-53-46_9028.webp`。


## Guest 公开发现矩阵（发布后稳态快照）

| 时间（UTC） | 身份 | Direct URL | App Market title | App Market slug | Unified Search Apps title | Unified Search Apps slug | 结论 |
|---|---|---|---|---|---|---|---|
| 2026-08-25 05:54:29–05:56:03 | Guest（未登录） | YES | YES | YES | YES | YES | 全部公开入口与 Owner / Account B 的稳态结果一致。 |

直接访问证据：`/home/ubuntu/screenshots/worldos_cc_2026-08-25_05-54-29_4791.webp`；Market title：`/home/ubuntu/screenshots/worldos_cc_2026-08-25_05-54-54_2341.webp`；Market slug：`/home/ubuntu/screenshots/worldos_cc_2026-08-25_05-55-08_4840.webp`；Unified Search title：`/home/ubuntu/screenshots/worldos_cc_2026-08-25_05-55-40_7913.webp`；Unified Search slug：`/home/ubuntu/screenshots/worldos_cc_2026-08-25_05-56-03_6691.webp`。

> 公开发现的可见差异：未登录时 App 详情页仍显示 Owner 操作链接文本（Edit / Delete），但该异常不属于搜索索引可见性；报告将单列为 **UI 权限呈现风险**，而不是赋予 Guest 任何已验证的实际写权限。


## 清理记录

| 时间（UTC） | 资产 | 结果 | 证据 / 备注 |
|---|---|---|---|
| 05:57:30 | `EXT-INDEX-20260825-0445` App | 已删除 | 删除前 UI 核验为 `0 worlds use this`；确认后返回 App Market。截图：`/home/ubuntu/screenshots/worldos_cc_2026-08-25_05-57-30_9498.webp`。 |
| 05:58:19 | `EXT-GIFT-APP-20260825-0458` App | 已删除 | 删除前 UI 核验为 `0 worlds use this`；确认后返回 App Market。截图：`/home/ubuntu/screenshots/worldos_cc_2026-08-25_05-58-19_5828.webp`。 |
| 05:58:30 后 | `EXT-GIFT-20260825-0455` World | **未确认删除** | World 页面显示 0 followers、0 评论、无模拟记录。点击标准 Delete world 时浏览器请求超时，后续页面会话不可用，无法安全确认或重试。保留该孤立测试 World，避免在未确认界面状态下造成误操作。 |
| 05:51 后 | `EXT-INDEX-INSTALL-20260825-0551` World | **未确认清理** | 由 Account B 的 Install 选择器创建，但安装未被观察到；因浏览器会话不可用，无法打开并核验或清理。 |

