# Account / Models / BYOK

研究状态：`TESTED / PARTIAL`

## Settings IA

`/zh-cn/account` 包含：个人资料、偏好、世界模型、我的预设、账户。

- 个人资料页有头像上传、用户名、简介、性别（未设置/男/女/非二元/不愿透露）、兴趣标签和显式 `保存资料`。

## Profile 与推荐

- 用户名、简介、性别、兴趣标签、头像。
- 兴趣标签明确影响 `猜你想玩` 与世界广场分类行排序，证实推荐至少部分使用显式偏好，不只是浏览历史。

## Preferences

- 语言切换：English / Español / 中文。
- 当前未发现其他偏好项。

## Models / BYOK

- 页面说明：订阅自备 API 后，可填 OpenRouter key、使用更多模型，模拟世界不消耗 Zaps。
- OpenRouter key 格式示例 `sk-or-...`，提供 `测试并保存`；文案称加密存储，仅用于运行自己的回合。
- 内置候选：免费模型、DeepSeek V4 Flash、DeepSeek V4 Pro、GLM-4.6、Kimi K2、Qwen3 Max、更多模型。
- 自定义网关支持任意 OpenAI-compatible endpoint：Base URL、key、model id，测试并添加；由网关计费，不消耗电量。
- 每个 Simulation 在局内设置单独选择模型，可在 WorldOS 官方档位与已添加自备模型间切换。
- 未输入真实 key，未发送/验证外部凭据。
- 历史免费账号样本曾稳定为 `查看自备 API` entitlement CTA、disabled key 字段；EVD-0237 的当前日期样本已经切换为明确的 `自备 API 限免`，文案称无需订阅即可填自己的 Key、模型 Turn 不消耗 Zaps。该限免状态跨 reload 稳定，四个 Provider 均可切换；这是时间/账号条件相关状态变化，不能再把旧会员墙当成当前唯一状态。
- 可见模型价位标记：`免费模型`、DeepSeek V4 Flash `$`、DeepSeek V4 Pro `$$`、GLM-4.6 `$`、Kimi K2 `$$`、Qwen3 Max `$$`。

### Invalid-key validation (EVD-0208)

- 可提交路径下用纯测试值 `sk-test-worldos-blackbox-invalid-0208` 实触发 `测试并保存`，返回内联错误 `key 无效，请检查后重试。`，未新增模型。
- `显示 key / 隐藏 key` 在 `password` 与 `text` 显示之间切换；reload 会清掉失败 key 和错误，提交按钮恢复 disabled，模型列表不受污染。
- 可见 provider 为 DeepSeek、智谱 GLM、OpenRouter 与自定义 OpenAI-compatible gateway。
- DeepSeek 与智谱 GLM 面板的字段标题都错误写成 `OpenRouter API key`，但 placeholder、教程和模型清单会随 provider 切换。
- 有效 key、密钥加密/删除、真实 provider 失败与跨设备同步仍为 `UNKNOWN`；未输入真实凭证。

### Limited-time provider/catalog controls (EVD-0237)

- DeepSeek：key、Flash/Pro/Visual 三个预置选择、手工 model id + disabled `使用`；智谱 GLM：4.5-Flash 免费、4.6、4.7；OpenRouter：Free/DeepSeek/GLM/Kimi/Qwen 预置；自定义：Base URL + key + model id。
- DeepSeek/GLM 的字段标题仍误写 `OpenRouter API key`。
- OpenRouter `更多模型` 会先显示 loading，随后加载可搜索 vendor/name/id 目录；精确搜索 Claude 3 Haiku 返回单条，选择只激活目录行，不会把值复制到独立手工 model-id 字段。无 Key 时 `使用` 仍 disabled。
- 页内说明：OpenRouter 免费模型对未充值账号每天 50 次，外部充值 10 美元可永久升为每天 1000 次。仅记录文案；未打开/执行充值。

### Profile avatar upload boundary (EVD-0209, EVD-0217, EVD-0222, EVD-0224)

- 头像入口背后是隐藏的 `input[type=file][accept="image/*"]`。
- SVG/PNG/JPEG/WEBP/GIF、wide PNG 与 EXIF-orientation JPEG 均被接受；系统无 crop/显式 Save/toast，自动保存、reload 后持久，并通过保留格式后缀的对象路径传播到三个公共 Profile 投影。
- benign invalid `.txt` 没有验证错误，却把旧头像清成 generic fallback；随后上传合法图片可恢复。oversize/tiny/transparency、网络失败、主动 reset、动画与 EXIF 二进制规范化仍 UNKNOWN。

## My Presets

- 已创建并验证 3 个私有预设：人设、文风、世界观各一；支持创建、编辑、删除和 reload 持久化（EVD-0092）。
- World `/new` 中存在 `用人设预设` / `套用我的预设`，但多次桌面/移动端复验均无弹窗、无字段变化（EVD-0098）。
- Simulation Settings 的 `设定我的身份 仅一次` 提供另一个 `用人设预设`，该入口实际打开 Persona listbox；选择 `TEST Preset Persona 002` 后精确填入 `Preset Tester` 与其 Persona 文本，Cancel 不消耗机会，Save 后生成 `playerSetup`、跨 reload 隐藏入口并在下一 Turn 被角色采用（EVD-0236）。Checkpoint 复制 identity+consumed lock，历史查看覆盖当前 identity，Rewind 后两者仍保留；EVD-0249 又补齐 manual/Emoji form 与 World `/new` identity precedence conflict。UNKNOWN 已收窄为 `/new` preset no-op、avatar model serialization、native keyboard enforcement 和冲突仲裁。
- EVD-0237 补齐创建失败/最小值矩阵：三类空表单的 `保存` 均可点击，但提交只显示 `请填写必填项。`；Persona 必须填写预设名 + 玩家名，Persona 描述可空；Style/Lore 必须填写预设名 + 对应正文。`添加预设` 在保存前就临时提高总数/类型计数。三类最小样本保存后 reload 持久，最终 `6 = 2/2/2`。卡片的 pencil/trash 为无 accessible label/title 的 icon-only 按钮。

## Account lifecycle

- 只有危险区域：输入精确 `DELETE` 后启用删除账号。
- 文案明确永久删除账号、世界与所有模拟记录，不可恢复。
- 未执行账户删除。
- 全局账号菜单同时提供：查看主页、账号设置、购买电量、赚电量、QQ 群、跟随系统/语言和退出登录。退出登录后的匿名/重新认证路径尚未执行。

## Credits evidence

- EVD-0204 resolves the earlier `522 → 514` discrepancy. A controlled Shop install changed Deepseek `8→10/回合` and charged `303→293`. Rewind to the pre-install Turn did not refund the 10, immediately restored the model menu to `8/回合`, and the next Turn charged `293→285`; reload then removed the stale Shop Dock. Dynamic-App surcharge is derived from the active post-Rewind install set, not from a temporarily visible Dock.
- EVD-0212 exposes an insufficient-balance boundary: a positive balance of 1 can still submit and commit an 8-energy Turn, producing `-7`; only the following submission is blocked. After test quota is added, the same Turn-4 save becomes usable again and the rejected fifth action remains absent.
