---
AIGC:
    Label: "1"
    ContentProducer: 001191440300708461136T1XGW3
    ProduceID: c155b059b691a65648c3dfcfa330b8a2_dd12e14b9ed511f1a54f525400f8a581
    ReservedCode1: TScTO8/vwwl1toOIi84m9/waDI29B6by4yOBE6nIG4TwjbTc08GYs7o7b9Vt73w2N3Y/YN4+p2qBdVlfXRX5YsRRUp1h+64kiyNyzmAwhzni/2w18ldl92FkOO4ZaS9xBzW4pqdLstGOVaf1HXuBAomIqqdO2d6PRZCUfxvl1fh165qJcMJaLR7gD6I=
    ContentPropagator: 001191440300708461136T1XGW3
    PropagateID: c155b059b691a65648c3dfcfa330b8a2_dd12e14b9ed511f1a54f525400f8a581
    ReservedCode2: TScTO8/vwwl1toOIi84m9/waDI29B6by4yOBE6nIG4TwjbTc08GYs7o7b9Vt73w2N3Y/YN4+p2qBdVlfXRX5YsRRUp1h+64kiyNyzmAwhzni/2w18ldl92FkOO4ZaS9xBzW4pqdLstGOVaf1HXuBAomIqqdO2d6PRZCUfxvl1fh165qJcMJaLR7gD6I=
---

# 01 · WorldOS Auth / Permission / Visibility Matrix（Guest vs Account B）

> 阶段: Phase-2（Guest 完全未登录 vs Account B 已登录非内容拥有者）
> 日期: 2026-08-23 ｜ 平台: https://worldos.cc（zh-cn 界面）
> 身份: Guest = 未登录匿名访客；Account B = mehraxbobaid78@gmail.com（免费用户，非内容 Owner）
> 证据来源标记: [G1]=ANONYMOUS_GUEST_AUDIT.md ｜ [G2]=ANONYMOUS_PUBLIC_UI_COMPLETENESS.md ｜ [B]=Phase-1 Account B 报告（E# 为证据索引） ｜ [B2]=Phase-2 最小补测
> 差异分类: A=Authentication Difference（仅登录差异）｜ B=Ownership/Permission Difference（登录后仍受限）｜ C=Product Inconsistency（UX 不一致）

---

## 1. World（世界）

| Object | Action | Guest | Logged-in non-owner | Difference | Evidence | Confidence |
|---|---|---|---|---|---|---|
| World | View / Detail | Allowed | Allowed | 无 | [G1]§2, [B]E2 | HIGH |
| World | Start Simulation（立即开始/新模拟） | Login wall（`login?next=/worlds/[slug]/new`） | Allowed（账户产生开局记录） | A | [G1]§2, [B]玩家统计 | HIGH |
| World | Search discoverability | Allowed（搜索完全开放） | Allowed（含跨账号 Remix 副本） | 无 | [G1]§8, [B]E3/E4 | HIGH |
| World | Share | Allowed（Modal 复制链接/海报） | Allowed | 无 | [G1]§2, [B]E8 | HIGH |
| World | Favorite / Save | Silent fail（♡ 点击无任何反馈，数字不变） | Allowed（"加入世界合集"，持久化） | **A+C** | [G1]§3, [B]E9/6.1 | HIGH |
| World | Remix（改编） | Login wall（`login?next=/worlds/[slug]`） | Allowed（生成公开副本，归执行者） | A | [G2]§2.2, [B]E4/E5 | HIGH |
| World | Rating | 登录墙（App 侧文案"登录后即可评分"；World 侧按钮未在 Guest 下直接触发，推断同墙） | Login required **且** 需游玩记录（"玩过这个世界后才能评分"） | **A+B** | [B]E14, [B2]-4 | HIGH |
| World | Comment | Login wall（"登录后评论"输入框不可输入） | Allowed（发布成功并持久化，计数 0→1） | A | [G1]§3, [B]E13 | HIGH |
| World | View 存档 | 空态（"还没有存档"） | 自己的存档可见（账户数据隔离） | A（数据隔离） | [G1]§2 | HIGH |
| World | Version / 成就 / 预览面板 | Allowed（可完整查看版本记录、成就列表、折叠预览面板） | Allowed（v6–v8 区间可见） | 无 | [G2]§2.2, [B]E12 | HIGH |

## 2. Character（角色）

| Object | Action | Guest | Logged-in non-owner | Difference | Evidence | Confidence |
|---|---|---|---|---|---|---|
| Character | View（Detail Modal） | Allowed | Allowed | 无 | [G1]§3 | HIGH |
| Character | Chat | Login wall | Allowed（启动新 Simulation，onboarding 设定身份） | A | [G1]§3, [B]E16/E22 | HIGH |
| Character | Add to World（添加） | Login wall（`login?next=/characters`） | Allowed（"添加"入口可用） | A | [G1]§3 | HIGH |
| Character | Favorite（♡） | Silent fail（与 World 收藏一致） | 未单独补测；App 侧已验证登录后收藏生效，推断 Allowed | A+C（推断） | [G1]§3, [B2]-1b | MEDIUM |
| Character | Comment | Login wall（"登录后评论"） | Allowed（补测 0→1，持久化） | A | [G1]§3, [B2]-2 | HIGH |
| Character | Follow | Login wall | Allowed（推断，同 Creator Follow 机制） | A（推断） | [G1]§3 | MEDIUM |
| Character | Rating | 不适用（Character 无评分区） | 不适用 | — | — | — |

## 3. App（应用）

| Object | Action | Guest | Logged-in non-owner | Difference | Evidence | Confidence |
|---|---|---|---|---|---|---|
| App | View（Modal + 独立页） | Allowed | Allowed | 无 | [G1]§4 | HIGH |
| App | Install（+安装） | Login wall（"登录后管理你的世界"，`next=/apps`） | Allowed（推断，安装为账户级写入；未直接补测） | A（推断） | [G1]§4 | MEDIUM |
| App | Online Try（在线试玩） | Preview only（"预览·操作不会生效"） | **Preview only（登录后仍不可交互，发送为无 onclick 的 span）** | 无差异（登录不解锁） | [G1]§4, [B2]-1c | HIGH |
| App | Favorite | 未触发测试（♡ 可见） | Allowed（补测 57→58 真实生效） | A+C | [B2]-1b | HIGH |
| App | Rating | Login wall（"登录后即可评分"） | Allowed 提交（"提交评分"按钮可选分后启用；未验证是否需先游玩该 App） | A（+B 待定） | [G1]§4, [B2]-1a | MEDIUM |
| App | Comment | Login wall（"登录后评论"） | Allowed（推断，同 World/Character 机制） | A（推断） | [G1]§4 | MEDIUM |
| App | Create（App Studio） | Guest 侧未记录创建入口（推断需登录） | Allowed 但仅「存草稿/发布」两态，无 Private/Unlisted（会员墙） | A+B（会员墙） | [B]E17 | MEDIUM |

## 4. Map（地图）

| Object | Action | Guest | Logged-in non-owner | Difference | Evidence | Confidence |
|---|---|---|---|---|---|---|
| Map | View / Preview（大图、拖拽、缩放） | Allowed | Allowed | 无 | [G1]§5 | HIGH |
| Map | Use this Map（用此地图→确认+） | 弹窗可开（可输世界名）→ 确认后 Login wall | Allowed（创建世界流程） | A | [G1]§5 | HIGH |

## 5. Creator Profile（创作者主页）

| Object | Action | Guest | Logged-in non-owner | Difference | Evidence | Confidence |
|---|---|---|---|---|---|---|
| Creator Profile | View | Allowed（统计面板/打赏榜/题材图/内容列表） | Allowed | 无 | [G1]§6, [B]E6 | HIGH |
| Creator Profile | Follow | Login wall | Allowed（持久化，计数 0→1→0 实时） | A | [G1]§6, [B]E7 | HIGH |
| Creator Profile | Share | Allowed（复制链接） | Allowed | 无 | [G1]§6 | HIGH |
| Creator Profile | Gift（送礼） | Login wall | 未验证成功路径（推断 Allowed） | A（推断） | [G1]§6 | MEDIUM |
| Creator Profile | 邮箱泄露 | 无（仅显示显示名） | 无（Profile 不泄露邮箱） | 无 | [B]4.1 | HIGH |

## 6. Search（搜索）

| Object | Action | Guest | Logged-in non-owner | Difference | Evidence | Confidence |
|---|---|---|---|---|---|---|
| Search | 搜索（全部/世界/角色/用户/App tabs） | Allowed 完全开放 | Allowed 完全开放 | 无 | [G1]§8, [B]E3/E4 | HIGH |
| Search | 索引规则（title 可搜 / slug 不可搜） | Guest 侧未独立验证（仅确认搜索开放） | Verified（slug 0 命中、title 4 命中） | — | [B]E3/E4 | HIGH（B 侧）；Guest 侧无证据 |
| Search | 结果卡片操作 | 点击进详情；聊天类跳登录 | 编辑（own 对象）/ 改编 / 立即开始 | A（owner 编辑入口隐藏，见 03） | [G2], [B]3.3 | HIGH |

## 7. Community（社区）

| Object | Action | Guest | Logged-in non-owner | Difference | Evidence | Confidence |
|---|---|---|---|---|---|---|
| Community | 查看排行榜（9 tabs） | Allowed | Allowed | 无 | [G1]§7 | HIGH |
| Community | 社群入口（QQ/微信扫码/复制） | Allowed | Allowed | 无 | [G1]§7 | HIGH |
| Community | Create World（表单） | 全表单可走（选模板/选 App/写描述），最后一步"生成世界"Login wall | Allowed（至少 Remix 创建；原创创建入口存在） | A | [G1]§7, [B]4.3 | HIGH |

## 8. Share（分享）

| Object | Action | Guest | Logged-in non-owner | Difference | Evidence | Confidence |
|---|---|---|---|---|---|---|
| Share | 分享 Modal（复制链接/海报/发布到 X） | Allowed（完全可用，发布到 X 无需 WorldOS 登录） | Allowed | 无 | [G1]§2, [G2]§2.9, [B]E8 | HIGH |
| Share | 去领取（分享奖励） | 跳转路径待验证（"去领取"提示） | Allowed（/rewards 登录后完全可访问，含邀请码） | A | [G1]§2, [B2]-3 | HIGH |

## 9. Remix / Follow / Favorite / Comment / Rating / Create / Simulation 汇总行

| Object | Action | Guest | Logged-in non-owner | Difference | Evidence | Confidence |
|---|---|---|---|---|---|---|
| World | Remix | Login wall | Allowed（副本立即 Public 可搜） | A | [B]2.1/E4 | HIGH |
| Creator | Follow | Login wall | Allowed（持久化） | A | [B]E7 | HIGH |
| World/App | Favorite | Silent fail | Allowed（持久化） | A+C | [B]E9, [B2]-1b | HIGH |
| World/Character/App | Comment | Login wall | Allowed（持久化） | A | [B]E13, [B2]-2 | HIGH |
| World/App | Rating | Login wall | 需游玩记录（World）；App 侧可提交（门槛待定） | A+B | [B]E14, [B2]-1a/4 | HIGH |
| World/App/Map | Create | 表单可走完，提交 Login wall | Allowed（Private/Unlisted 为会员墙除外） | A+B | [G1]§7, [B]E17 | HIGH |
| World | Start Simulation | Login wall | Allowed | A | [G1]§2, [B]玩家统计 | HIGH |

---

## 统计摘要

| 维度 | 无差异（浏览/搜索/分享类） | 纯 A（登录解锁） | A+B（登录+行为/会员门槛） | C（UX 不一致） |
|---|---|---|---|---|
| World | View / Search / Share / Version | Simulation / Remix / Comment / Favorite / 存档 | Rating（需游玩） | Favorite 静默失败 |
| Character | View | Chat / Add / Comment / Favorite(推断) / Follow(推断) | — | Favorite 静默失败 |
| App | View | Install(推断) / Favorite / Comment(推断) / Rating | Rating(门槛待定) / Create(会员墙) | 试玩登录不解锁；Favorite 静默失败 |
| Map | View | Use Map | — | — |
| Creator Profile | View / Share | Follow / Gift(推断) | — | — |
| Search | 搜索开放 | 结果卡片操作 | — | — |
| Community | 排行榜 / 社群入口 | Create（最后一步） | — | — |
| Share | 全功能 | 去领取 | — | — |

**核心结论**：WorldOS 对两种身份采取"浏览/搜索/分享完全开放，写入/创建/社交/付费统一登录墙"模式。登录解锁的是全部写路径与账户私有空间；登录后剩余的边界是（a）行为门槛（评分需游玩）、（b）owner 专属能力（编辑隐藏）、（c）数据隔离（存档/收藏私有）、（d）付费能力（Private/Unlisted 会员墙）。UX 不一致集中在收藏按钮静默失败与评分文案两段式误导。
*（内容由AI生成，仅供参考）*
