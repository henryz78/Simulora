---
AIGC:
    Label: "1"
    ContentProducer: 001191440300708461136T1XGW3
    ProduceID: c155b059b691a65648c3dfcfa330b8a2_ccfd26369ec111f1a413525400287e28
    ReservedCode1: 0J9a7F+nVLGmKz87P2ffR2MEWSQe4ew1b8BbVJfb0hTkdtDat9lrrMHtUdXG/3jRjJ7y+Gtj6xdXya1CeGZePa2ue2ohhNAwpXwGobIuhAPkaxw1fMek1bClumVz30+IQRjHryQ1rrXItWy+X3Kal5yXkLTBGnTAh2l1F3hwyGG+NBLrDCIEkJdqOZw=
    ContentPropagator: 001191440300708461136T1XGW3
    PropagateID: c155b059b691a65648c3dfcfa330b8a2_ccfd26369ec111f1a413525400287e28
    ReservedCode2: 0J9a7F+nVLGmKz87P2ffR2MEWSQe4ew1b8BbVJfb0hTkdtDat9lrrMHtUdXG/3jRjJ7y+Gtj6xdXya1CeGZePa2ue2ohhNAwpXwGobIuhAPkaxw1fMek1bClumVz30+IQRjHryQ1rrXItWy+X3Kal5yXkLTBGnTAh2l1F3hwyGG+NBLrDCIEkJdqOZw=
---

# 05 · Share Link / 分享访问（Account B 视角）
## 5.1 分享入口（VERIFIED）
- 公开 World 详情页有「分享」入口，点击弹出分享面板，含「复制链接 / 生成海报」两类动作。
- 可分享对象: World / Character / App / Map / Creator / 合集（入口存在）。

## 5.2 公开对象 Share URL 在陌生账号下的表现（VERIFIED）
- 直接打开（已登录 Account B）: 直接进入详情页，无登录门槛、无 referrer 拦截、无需额外权限。
- 匿名（登出）态未做完整测试 → 匿名态行为 PARTIAL。

## 5.3 私有/已删除对象 Share URL（PARTIAL）
- 已删除 App 直接 URL → 404（VERIFIED，见 08）。
- Private 内容 Share URL: 无私有对象样本 → UNKNOWN（会员墙外不可创建）。

## 5.4 跨账号打开行为小结
| 对象 | 已登录 B 打开 | 备注 |
|---|---|---|
| Public World 分享链接 | 直接进入 | 无权限门槛 |
| 已删除对象链接 | 404 | 无泄露 |
| Private 对象链接 | UNKNOWN | 无样本 |

## 5.5 结论
- 公开内容的 Share Link 对陌生账号零门槛直达。
- 删除后 Share URL 变 404，无缓存泄露。
*（内容由AI生成，仅供参考）*
