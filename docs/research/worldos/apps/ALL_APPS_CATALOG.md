# App Market Catalog (observed)

Status: `PARTIAL / snapshot`

## Official/core catalog observed

主输入框, 主线故事, 时间, 聊天, 过场CG, 成就, 世界状态, 角色状态, 任务, 列表/背包, 视觉小说, 骰子, 装备, 地图, RPG地图, Instagram, 社交媒体, 钱包, X (Twitter), WhatsApp, 浏览器, 邮箱, 论坛, 抖音, 音乐播放器, 家族树, 商店, 壁纸, 弹幕, 待决收件箱, 小剧场, 直播间, 发展树, 悬赏板, 日历, 树洞, 黑客终端, 系统, 股票行情, 证物白板, Tinder, Telegram, 幕后算计, 塔罗, 倒计时, 电影, 格子地图, 3D 场景, 微信, 四子棋.

## Community catalog snapshot

号外日报, 微博, 校园树洞, 热度榜单, 人际关系, Instagram 📷, 画廊, 现实日记, Miniso, 健康, 置物柜纸条, Pronto 闪送, 关系图谱, 支付宝, 诊疗通, 数字卡片, 灵境日记, 孕期日记, McSim's, 霍格沃茨咒语书, 霍格沃茨课表, AURA Boutique, 枢密内阁.

Market cards expose creator, worlds-in-use, rating, description, category tags, favorite/install actions. Full per-App runtime semantics are not assumed from catalog copy; only tested Apps (Shop, Map, Bounty Board, Stats, Relationships, custom TEST App) have behavior evidence.

Evidence: EVD-0016, EVD-0023, EVD-0047.

## Official Achievement App

- Slug: `/zh-cn/apps/achievements`; categories `核心`, `成长`; current sample `573 个世界在用`.
- Creator schema: icon, name, Copper/Silver/Gold rarity, player description, AI-only condition, Hidden toggle and delete; plus shared App presentation/instruction controls.
- Runtime: visible/hidden progress, structured grant Events, hidden reveal after unlock, World-detail projection.
- Persistence: Account×World, inherited by fresh saves and retained through Rewind even when the granting Turn/Event is removed; historical viewing can still show the old ratio.
- Detail: [ACHIEVEMENT_SYSTEM.md](ACHIEVEMENT_SYSTEM.md).
- Evidence: `EVD-0246`.
## Official Time App (时间)

- Slug: `/zh-cn/apps/time`
- Creator: WorldOS; categories `核心`, `系统`; public usage link reports ~37,016 worlds in current session.
- Purpose: floating world clock, arbitrary date jumps, next-major-event jump, fast-forward 1 day/month/year (and product copy says 1 hour–1 year), with historical rewind view.
- Public detail: favorite count, gift button, install button, rating/comment surface, online preview, popular-world carousel.
- Preview controls: `回溯时间（查看历史）`, `跳到下一个大事件`, `+1天`, `+1个月`, `+1年`, date input + `前往`, previous/current/next timeline controls.
- Runtime install/configuration and cross-App propagation: not yet verified; blocked at action-time install confirmation.
- Evidence: `EVD-0065`, `EVD-0066`.
