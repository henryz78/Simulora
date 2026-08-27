---
AIGC:
    Label: "1"
    ContentProducer: 001191440300708461136T1XGW3
    ProduceID: c155b059b691a65648c3dfcfa330b8a2_cc3458b49ec111f1a54f525400f8a581
    ReservedCode1: kxcnVqqSeNEBuHeMnC6KBF9OO0k9sifYMRfEsUpS4ylqi0wnNMYIA7lVBuZ3R5zkImdB9Q/m63ssc8Mr/oCQtiAZYVGi5tqfjQRpINhspt5znJCWGJ7VgoOWOEYNDZgxUSNIxiSg8FCLV/ByP+g33qBeZ5w22BgHMSEBgFbB+QJraZgfUE+0hoLL7Fs=
    ContentPropagator: 001191440300708461136T1XGW3
    PropagateID: c155b059b691a65648c3dfcfa330b8a2_cc3458b49ec111f1a54f525400f8a581
    ReservedCode2: kxcnVqqSeNEBuHeMnC6KBF9OO0k9sifYMRfEsUpS4ylqi0wnNMYIA7lVBuZ3R5zkImdB9Q/m63ssc8Mr/oCQtiAZYVGi5tqfjQRpINhspt5znJCWGJ7VgoOWOEYNDZgxUSNIxiSg8FCLV/ByP+g33qBeZ5w22BgHMSEBgFbB+QJraZgfUE+0hoLL7Fs=
---

# 04 · Creator Profile（Account B 外部视角）
URL 结构: /zh-cn/profile/{uuid}（Account A 公开 username x161880；Account B 自己: 5c1fb660-9e53-45a0-8caf-791f73cd8afc）

## 4.1 陌生 Creator Profile（x161880，Account A）可见内容（VERIFIED）
- 创建世界列表（"5 创建世界"类统计）
- 角色条目（"测试角色 001" 在列）
- 关注者计数（测试中 0 → 1 → 0）
- 关注按钮、分享主页入口
- 创作者/玩家统计区块（创建世界数、被启动数、累计回合、关注者）
- Profile 不显示邮箱（只显示显示名），邮箱不泄露

## 4.2 Follow / Unfollow 外部行为（VERIFIED）
| 步骤 | 表现 |
|---|---|
| 点击关注 | 按钮变关注态，关注者计数 +1 |
| 刷新 | "1 关注者" 持久化（服务端持久） |
| 点击取消关注 | 关注者计数归 0 |
| 刷新 | "0 关注者" 持久化 |

- Follow 状态跨刷新持久化；计数实时更新。
- 是否触发对方 Notification: 未能在 Account B 侧确认 → CROSS_ACCOUNT_VERIFICATION_REQUIRED（见 10）。

## 4.3 自己的 Profile（Account B 视角）
- 显示: 加入日期（2026年8月23日）、关注者 0、分享主页、编辑资料、"还没有简介"
- 创作者统计: 创建世界 1、我的世界被启动 0、累计回合 0、关注者 0
- 玩家统计: 开局数 1、游玩回合 1
- 收藏的世界: 1（Account A 的"测试应用升级世界 001"，带"改编/立即开始"入口）
- 我的世界: 自己改编的副本（"测试应用升级世界 001"，mehraxbobaid78，带"改编"标记）
- 我的合集: 第二账号测试合集 001（1 个世界）

## 4.4 结论
- Profile 对陌生账号完整可见（统计 + 内容列表 + Follow 入口），无邮箱泄露。
- Follow 是持久化关系，刷新保持；计数实时更新。
- 注意: 同一对象在不同渲染路径出现不同 creator 显示（x161880 vs nixonelton9954），推测 username 与账号标识混合展示，建议主 Agent 复核（见 10）。
*（内容由AI生成，仅供参考）*
