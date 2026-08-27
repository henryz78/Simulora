# WorldOS 外部测试：账号可用性验证

**验证时间：** 2026-08-25 04:41–04:43 GMT+8  
**目标站点：** https://worldos.cc  
**验证范围：** 仅验证登录；不创建、不编辑、不发布、不安装或删除任何测试资产。

| 账户角色（暂定） | 登录标识 | 结果 | 登录后可见初始 Zaps 余额 | 备注 |
|---|---|---|---:|---|
| Creator / 接收方（Account A） | `IdaKellams159@outlook.com` | SUCCESS | 866 | 登录后账户菜单显示用户名 `idakellams159`；未改动其既有内容。 |
| Sender / 非 Owner 对照（Account B） | `2518wllalpor@gmail.com` | SUCCESS | 926 | 登录后账户菜单显示用户名 `2518wllalpor`；未改动其既有内容。 |

## 结论

两组用户提供的独立免费账号均可用，且均已有可见 Zaps 余额，可进入后续受控测试。后续只使用新建且名称前缀为 `EXT-INDEX-*` 或 `EXT-GIFT-*` 的专用资产；不会对登录前已有的用户内容做任何修改。

## 证据

浏览器登录结果页分别显示上述账户邮箱与对应余额。登录后已安全退出 Account A，并已登录 Account B 完成验证。

## 约束确认

本轮不进行真实付款、充值、会员购买、提交真实 API Key、权限绕过、隐藏 API 调用、高频请求或压力测试。

## References

[1]: https://worldos.cc "WorldOS"
