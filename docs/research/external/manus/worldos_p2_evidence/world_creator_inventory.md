# World Creator — Control Inventory

**Identity:** Owner `idakellams159`  
**URL:** https://worldos.cc/worlds/create  
**Timestamp:** 2026-08-25 06:29:35–06:29:45 (browser session time)  
**Preconditions:** 新建公开 World Creator，未输入任何字段、未上传封面。  
**Screenshot:** `/home/ubuntu/screenshots/worldos_cc_2026-08-25_06-29-35_1799.webp`  
**DOM evidence:** `/home/ubuntu/console_outputs/exec_result_2026-08-25_06-29-45_550.txt`

## 可见控件

| 分区 | 控件 | 形态 | 初始状态 / 可见属性 |
|---|---|---|---|
| 提交 | Create world | 主按钮 | `disabled = true`（pristine） |
| 基础 | Save name | 文本输入框 | 未显式 `required`/`maxlength` 属性；页面标签未显示可见长度计数器。 |
| 基础 | Cover image / video / GIF | Upload 按钮与文件输入 | 文件输入 `accept="image/*,video/mp4,video/webm"`；页面说明为 Required。 |
| 基础 | Theme | 主题按钮组 | Classic、Kraft、Wood、Arcade、Sakura、Lavender、Peach、Jade、Rose Gold、Cyberpunk、Midnight、Celestial、Starlit、Plum、Forest、Graphite、War Room、Custom colors。 |
| 基础 | Tagline | 文本输入框 | 无可见 maxlength。 |
| 基础 | Categories | 搜索式文本输入框 | 占位：`Type or search a category…`；页面说明最多 3 个。 |
| 基础 | Introduction | textarea + Edit/Preview tab | 页面说明支持 Markdown/HTML。 |
| 发布 | Visibility | Public/Unlisted/Private 按钮组 | Unlisted 和 Private 标记 Members；会员相关分支需记录 `MEMBERSHIP_BLOCKED` 后停止。 |
| 发布 | Remixing | Allow/Don't allow 按钮组 | 初始可操作。 |
| 扩展 | Characters | Add character / From library | 可见且可操作。 |
| 扩展 | Player setup fields | Add field / Add player setup / Genre templates | 可见且可操作。 |
| 扩展 | Apps | 6 个默认 App 块、Configure / Uninstall / Install App | 可见且可操作。 |
| 内容 | System instructions | textarea | 无可见 maxlength。 |
| 内容 | Win/lose rules | textarea | 可选。 |
| 内容 | Game opening | textarea + Edit/Preview | 可选，页面说明支持 Markdown/HTML。 |
| 内容 | Player tools | Add field / Allow the Console checkbox | 可见。 |
| 预览 | Live preview | 侧边浮动按钮 / 预览区 | 可见。 |

## 初始校验结论

> 在无名称、无封面、无其他输入的 pristine 状态下，`Create world` 主按钮禁用。当前证据尚不能区分名称与封面等各项的单独必填贡献，后续将以最小有效组合增量验证。

**Confidence:** High for visible control inventory and pristine disabled state; unknown for未尝试字段的服务端边界。


## 文件控件前置观察

点击可见 `Upload` 后未出现浏览器选择器状态变化；正常页面 DOM 中存在一个隐藏的原生 file input，属性为 `accept="image/*,video/mp4,video/webm"`、未禁用、`display:none`。该可见 accept 限制将先用无害 `.txt` 测试夹具验证，再使用小 PNG 作为有效最小夹具。证据：`/home/ubuntu/console_outputs/exec_result_2026-08-25_06-30-17_683.txt`。


## 上传测试执行限制

为使用用户界面的文件选择路径，已临时将页面标准 file input 从隐藏状态显示出来；但页面交互控件快照仍未将其暴露为可上传索引，因此在不使用任何非标准接口的限制下，当前浏览器会话无法把测试文件提交给该字段。该项暂记为 `UNKNOWN — browser control binding unavailable`，不将 accept 属性误写为实际客户端或服务端拒绝结果。


已在页面内暴露同一个标准 file input 后，浏览器控件快照将其识别为 `input[type=file]`（index 23），可用于一次正常上传绑定。该步骤仅改变显示样式，不改写字段值、业务状态或访问控制。截图：`/home/ubuntu/screenshots/worldos_cc_2026-08-25_06-31-49_8119.webp`。


## 发布更新对话框

在有效 Draft 状态点击 `Publish v2` 后，出现 `Publish world update` 模态。`Version title` 为 optional，原生 `maxlength=120`；`Changelog*` 为必填语义字段，原生 `maxlength=12000`，空值时确认按钮禁用。控件属性证据：`/home/ubuntu/console_outputs/exec_result_2026-08-25_06-38-03_211.txt`；模态截图：`/home/ubuntu/screenshots/worldos_cc_2026-08-25_06-38-12_3528.webp`。

