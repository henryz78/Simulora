# WorldOS EXT-GIFT 交易隔离实验日志

> 本日志仅记录两个经用户授权的独立测试账号之间的最小化、非付费验证。所有资产均以 `EXT-GIFT-*` 命名；不使用真实支付、不充值、不购买会员。

## 测试身份与资产

| 角色 | 测试账号 | 资产 / 地址 | 状态 |
|---|---|---|---|
| Creator / 接收方 | `idakellams159` | Profile: `https://worldos.cc/profile/66a1422d-1583-4334-87d6-7389816ee278` | 已验证可登录 |
| Sender / 非 Owner 对照 | `2518wllalpor` | N/A | 已验证可登录 |
| 专用公开 World | Creator 所有 | `EXT-GIFT-20260825-0455` — `https://worldos.cc/worlds/ext-gift-20260825-0455-llwv` | 已于 2026-08-25 04:57（GMT+8）发布 v2 |
| 专用公开 App | Creator 所有 | `EXT-GIFT-APP-20260825-0458` — `https://worldos.cc/apps/ext-gift-app-20260825-0458` | 已于 2026-08-25 05:00（GMT+8）发布 |
| 索引测试 App | Creator 所有 | `EXT-INDEX-20260825-0445` | 与 Gift 测试隔离，不复用 |

## Sender 基线快照

| 绝对时间（GMT+8） | 账户 | 当前总额 | Daily | Permanent | Creator earnings | 可见历史摘要 |
|---|---|---:|---:|---:|---:|---|
| 2026-08-25 05:01 | `2518wllalpor` | 926 Zaps | 176 | 750 | 0 | 历史中仅有 Welcome bonus +600、Daily Zaps +200、Referral bonus +150，以及 3 笔 Simulation turn −8；未见 Gift 条目。 |

来源：Sender 正常界面的 Zap history（`https://worldos.cc/zaps`）。截图：`/home/ubuntu/screenshots/worldos_cc_zaps_2026-08-25_05-01-50_8227.webp`。

## 操作约束

| 控制项 | 约束 |
|---|---|
| 金额 | 仅尝试 UI 提供的最低档 Gift；不作任何充值或真实支付。 |
| 接收方 | 仅 Creator 测试账号，不涉及第三方用户。 |
| 资产 | 禁止修改既有非 `EXT-*` 资产；官方/社区对象仅用于界面可用性验证，不对第三方执行实际转赠。 |
| 证据 | 每个尝试记录入口、目标、金额选项、确认状态、Sender/Creator 前后余额与 Zap history 结果。 |


## 受控尝试 1：官方 App Gift（Story）

| 时间（GMT+8） | Sender | 目标 | Gift 入口 | 最低档 | UI 披露 | 提交结果 | Sender 余额变化 |
|---|---|---|---|---:|---|---|---:|
| 2026-08-25 05:02 | `2518wllalpor` | 官方 App `Story`（Owner：WorldOS，`https://worldos.cc/apps/story`） | App 详情页 `Gift` | Spark 20 | `70% of every gift goes straight to the creator's Zap balance.` | **BLOCKED**：标准 UI 在点击 `Send · 20⚡` 后返回 `Gifting unlocks 48 hours after signing up.` | 未变化（仍为 926） |

### 证据

- Gift 面板显示档位：Spark 20、Star 100、Crystal 400、Fireworks 1,000、Moon 3,000、Aurora 6,000、Starry Night 12,000、Sun 20,000、Milky Way 100,000。
- 该交易未落账，因此没有成功 Gift、无接收方余额变更、也没有新的 Zap history 条目可核验。
- 截图：面板与分成披露：`/home/ubuntu/screenshots/worldos_cc_2026-08-25_05-02-37_6490.webp`；门控反馈：`/home/ubuntu/screenshots/worldos_cc_2026-08-25_05-02-52_7117.webp`。


## 入口覆盖与可执行性结论

| 入口 / 对象 | 观察到的状态 | 最低档 / 分成披露 | 是否实际提交 | 结论 |
|---|---|---|---|---|
| 官方 App：`Story`（WorldOS） | `Gift` 按钮和 Gift 面板可用 | Spark 20；`70% of every gift goes straight to the creator's Zap balance.` | 是；被 UI 拦截 | Sender 账户级 48 小时门控阻断交易。 |
| 自有专用 App：`EXT-GIFT-APP-20260825-0458`（Creator 测试账号） | 详情页仅显示 Favorite / Install；**未显示 Gift** | 不适用 | 否 | 该新发布自有 Community App 目前没有 Gift 入口；不以推测替代验证。 |
| 既有第三方 Community App：`The Broadsheet`（World101） | `Gift` 按钮和 Gift 面板可用 | Spark 20；同样披露 70% 给 creator | 否 | 已由官方 App 的同一 Sender 账户提交动作确认 48 小时门控；为避免对第三方进行无效重复尝试，仅验证入口与面板。 |
| 既有创作者 Profile：`World101` | `Gift` 按钮和 Gift 面板可用；页面展示 `From gifts (Zaps) 14,154` 与 6 个支持者 | Spark 20；同样披露 70% 给 creator | 否 | Gift 在合资格 Profile 上存在；未对第三方发送。 |
| 专用测试 Creator Profile：`idakellams159` | 公开页仅显示 Share profile / Follow；**未显示 Gift** | 不适用 | 否 | 新测试 Creator Profile 未出现 Gift 入口。 |
| 专用测试 World：`EXT-GIFT-20260825-0455` | 公开详情页未显示 Gift；仅有 Follow / Share / Remix | 不适用 | 否 | 当前测试中 Gift 未投影到 World 详情页。 |

> 因为 Sender 账号的 Gift 解锁时间为注册后 48 小时，**没有发生任何成功 Gift 转账**。因此，不能据此得出余额隔离、creator 70% 实际入账、Zap history 成对可见性或 UI/账本一致性的“通过”结论；它们均应标注为 `BLOCKED — account gating`，而非 `PASS` 或 `FAIL`。

### 附加证据

| 项目 | 截图 |
|---|---|
| 自有 App 无 Gift 入口 | `/home/ubuntu/screenshots/worldos_cc_2026-08-25_05-03-19_2114.webp` |
| 既有 Community App Gift 面板（收款方 World101） | `/home/ubuntu/screenshots/worldos_cc_2026-08-25_05-04-23_1614.webp` |
| 合资格 Profile Gift 面板（收款方 World101） | `/home/ubuntu/screenshots/worldos_cc_2026-08-25_05-04-56_7231.webp` |
| 专用 World 详情无 Gift 入口 | `/home/ubuntu/screenshots/worldos_cc_2026-08-25_05-01-08_8432.webp` |

