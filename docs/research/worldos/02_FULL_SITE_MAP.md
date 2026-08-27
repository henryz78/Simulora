# Full Site Map

> 同时记录 Route 与用户到达路径；动态路由参数以花括号表示。

## 已观察基线

```text
/zh-cn — 登录态首页
├─ 左侧全局栏
│  ├─ “创作”按钮 → World / Character / App / Collection 创建入口
│  ├─ 世界 → /zh-cn/worlds
│  ├─ 角色 → /zh-cn/characters
│  ├─ 我的 → /zh-cn/sims
│  ├─ 社区 → /zh-cn/community
│  ├─ App 市场 → /zh-cn/apps
│  ├─ 地图 → /zh-cn/maps
│  ├─ 升级 → /zh-cn/pricing
│  ├─ 分享领电量 → Rewards/邀请与社交分享弹层
│  └─ 历史
│     ├─ 世界（最近 World Simulation 存档）
│     └─ 角色（最近 Character Chat Simulation 存档）
├─ 顶栏
│  ├─ 通知（打开即清未读；typed deep links；静默分页）
│  ├─ QQ 群（QR / 复制 / 关闭）
│  └─ 账户按钮（Profile / Account / Credits / Rewards 等入口）
├─ 精选世界 Carousel
├─ 搜索世界 → /zh-cn/worlds/search
├─ 创建新世界 → /zh-cn/worlds/create
├─ 推荐 / 热门 / 日榜
├─ 35 个已观察标签按钮
├─ 猜你想玩（World Cards）
├─ 最多回合（World Cards）
├─ 最新更新（World Cards）
├─ 我的世界
├─ 模拟过的世界
├─ 热门合集
│  ├─ 查看全部 → /zh-cn/collections
│  └─ 合集详情 → /zh-cn/collections/{slug}
├─ 热门创作者
│  └─ Creator Profile → /zh-cn/profile/{uuid}
└─ Footer
   ├─ 世界 / App 市场 / 地图 / 角色 / 社区 / 定价
   ├─ WeChat / QQ / 小红书 / 抖音 / Bilibili
   └─ 语言按钮（中文 / English / Español；切换 locale 路由并持久化偏好）

/zh-cn/worlds/{slug} — World Detail
├─ title/description/creator/stats/tags/cost
├─ continue/new Simulation
├─ share / edit(owner) / delete(owner) / remix / favorite / collection
├─ Characters / Apps / Preview
├─ version history
├─ saves + rename/delete
└─ similar Worlds

/zh-cn/worlds/{slug}/new — Player Setup / new Simulation
/zh-cn/worlds/{slug}/edit — World Creator / Editor
/zh-cn/worlds/{slug}/preview — read-only Turn 0 preview
/zh-cn/sim/{uuid} — Simulation runtime
├─ Events / Memory / Advisor / Settings
│  ├─ `设定我的身份 仅一次` → name/persona/avatar + Account Persona picker
│  └─ committed identity hides after Save/reload; exposed to runtime as `playerSetup`
├─ Story / Chat / Map / official and community Apps
├─ Add App
└─ Save / Version update / Rewind / model controls

/zh-cn/characters — 角色库
├─ 搜索角色…
├─ 新建角色 → /zh-cn/characters?create=1
├─ 类别标签 / 性别筛选
├─ 排序菜单
│  ├─ 趋势
│  ├─ 近期上升最快
│  ├─ 累计被聊最多
│  ├─ 被收藏最多
│  ├─ 单局平均回合最多
│  ├─ 回头重开的玩家最多
│  ├─ 最近新增
│  └─ 随机
├─ 时间范围菜单 → 全部时间 / 每日 / 每周 / 每月
├─ 角色卡
│  ├─ 聊天
│  ├─ 添加
│  └─ 卡片主体 → 同页 Character Detail
└─ Character Detail
   ├─ 作者 Profile
   ├─ 关注
   ├─ 收藏计数
   ├─ 评论 / 排行榜 / 支持者
   ├─ 聊天
   └─ 添加到世界

/zh-cn/characters?create=1 — 新建角色
├─ 名字（必填）
├─ 人设（必填）
├─ 公开简介（选填）
├─ 头像选择器
│  ├─ Emoji
│  ├─ 头像库
│  ├─ 国旗
│  ├─ 壁纸
│  ├─ 场景
│  ├─ URL / 上传
│  └─ 捏脸（画风、性别、年龄、体型、发型、眼睛、面容、肤色、服装、材质、配饰；生成 30 电量）
├─ 性别：未设定 / 男性 / 女性 / 非二元
├─ 类别：最多 3 个
├─ 可见性：公开 / 私有（会员）
├─ Komiko 链接导入
└─ 取消 / 创建

/zh-cn/worlds — 世界广场
├─ 精选 Carousel
├─ 推荐 / 热门 / 日榜
├─ 标签筛选
├─ 搜索世界
├─ 创建新世界
└─ World Card：改编 / 立即开始

/zh-cn/worlds/search — 搜索世界
├─ 搜索世界、角色、用户…
├─ query deep link `?q=`
├─ 全部 / 世界 / 角色 / 用户 / App
├─ 最近搜索 / 清除
├─ 热门标签
├─ 跨对象结果区块 / 查看全部
├─ 空状态：暂无匹配结果
└─ World Card：改编 / 立即开始

/zh-cn/maps — 地图库
├─ 搜索地图…
├─ 有底图 / 全部 / 我的
├─ 分类标签
└─ Map Card
   ├─ 查看大图
   ├─ 用此地图
   └─ 相关 World / Creator

/zh-cn/apps — App 市场
├─ 搜索 App…
├─ 分类：全部 / 核心 / 社区 / 社交 / 角色 / 叙事 / 经济 / 系统 / 成长 / 资讯 / 任务 / 音频等
├─ 创建 App → /zh-cn/apps/create
└─ App Card
   ├─ creator / 使用世界数 / 评分 / 分类
   ├─ 收藏
   ├─ 安装
   ├─ 点击卡片 → 详情 Drawer
   └─ 详情链接 → /zh-cn/apps/{slug}

/zh-cn/apps/{slug} — App Detail
├─ creator / world usage / tags / favorite
├─ edit(owner) / delete(owner) / install
├─ version log / rating / comments
├─ interactive iframe preview
└─ `/zh-cn/apps/achievements` special configuration/runtime chain
   ├─ World selector → achievement rows / hidden / rarity / AI-only condition
   ├─ target World Draft → publish/apply version
   └─ Simulation + World detail Account×World unlock projection

/zh-cn/apps/create — App Studio
/zh-cn/apps/create?slug={slug} — edit existing App

/zh-cn/sims — 我的
├─ 历史 / 作品
├─ 世界 / 角色 / 合集 / App
├─ 我创建的 / 我收藏的
├─ Simulation Card → /zh-cn/sim/{uuid}
├─ History Simulation card → /zh-cn/sim/{uuid}
│  └─ 更多 → 重命名 / 删除
└─ 世界质量判定 → /zh-cn/worlds/quality-guide

/zh-cn/worlds/quality-guide — 世界质量判定
├─ 匠心硬门槛与 145 分模型
├─ 热门 110 分模型
├─ 地图/视觉小说/CG/音乐/骰子特色标记
└─ 选择自己的 World → 实时检测

/zh-cn/community — 社区
├─ QQ 群 / 微信群 / 复制微信号
├─ 创建世界
├─ 关注我们外链
├─ 排行榜指标切换
├─ 世界OS支持者
└─ 最多人模拟的世界

/zh-cn/profile/{uuid} — Public Profile
├─ gender / join date / follower count / follow / share
├─ creator stats / player stats
├─ most-played genres
├─ created Worlds
└─ most-played Worlds

/zh-cn/collections — 世界合集
├─ 搜索；排序：热门 / 最新
├─ 作者：全部 / 我的
├─ 创建合集
└─ 合集 Card → /zh-cn/collections/{slug}

/zh-cn/collections/new — Collection Creator
/zh-cn/collections/{slug}/edit — Collection Editor
├─ 名称 / 描述 / 逗号标签
├─ 公开 / 链接可见 / 仅自己
├─ Owner World 搜索、添加、移除、拖动排序（最多 100）
└─ 显式保存 → 详情页

/zh-cn/pricing — 定价 / 电量 / 赞助
├─ 一次性 / 订阅 / 自备 API
├─ 国内支付 / 国际卡支付切换
├─ 加量包购买（真实付款待止步确认）
├─ 赚取电量 → /zh-cn/rewards
├─ 赞助金额
└─ FAQ

/zh-cn/account — Settings
├─ 个人资料
├─ 偏好 / language
├─ 世界模型 / BYOK
├─ 我的预设
└─ 账户删除

/zh-cn/rewards — earn Credits / sharing rewards
├─ 邀请码 / 邀请链接 / 复制
├─ 24 小时邀请码绑定边界
├─ 社交发布 URL 审核入口
└─ 周上限 / 分层奖励规则

/zh-cn/pax-historia — competitor/intention landing page
├─ localized hero + `Pax Historia vs WorldOS` comparison table
├─ `#worlds` in-page CTA
├─ 22 observed curated war/grand-strategy World cards with Remix/Start
├─ browse-all/bottom CTAs → /zh-cn/worlds
└─ five static FAQ blocks

/zh-cn/login — Auth
├─ Google / email-password login
├─ Register（确认密码、可选邀请码）
└─ Forgot password → email verification code
```

## 页面级控件台账对账（2026-08-25）

- `ux/PAGE_CONTROL_AUDIT.md` 当前有 30 个页面或嵌套面板行，覆盖本 Site Map 的所有已发现一级 Route，以及 Notifications、Map Editor、Achievement 安装配置、Character Chat、World-local Chat 等无独立 Route 的重要嵌套表面。
- 每行均分离：`Discovered controls`、`Actually triggered`、`Unverified / failure reason`、`Evidence / confidence`；看见按钮不等于已触发。
- 当前没有发现“Site Map 已列出但控件台账完全没有对应行”的一级 Route。
- 仍明确保留的 Route/权限边界：付费 Private/Unlisted 外部访问、仅自己 Collection 外部访问、真实支付、有效 BYOK、真实设备 touch/IME/safe-area/background、Export 实际文件和新账号首次 onboarding。
- `/maps` 没有独立 Map detail Route；预览和 `用此地图` 都是目录页内叠层/弹层。Character Library 的 ordinary Character detail 也是同页 Drawer；Character Remix clone 没有发现稳定公开详情 Route。

## 首页已观察标签

同人、奇幻、校园、恋爱、抓马、病娇、暗黑恋爱、历史、战争、策略、政治、当代、搞笑、职场、耽美、百合、ABO、相爱相杀、韩娱、娱乐圈、冒险、异世界、穿越、修仙、悬疑、侦探、恐怖、生存、动漫、科幻、跑团、DnD、架空历史、商业、运动。
