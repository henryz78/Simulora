# Simulora

一个属于你自己的、会记住一切的 AI 世界。

- 产品定义：[docs/PRODUCT.md](docs/PRODUCT.md)
- 进度：[docs/PROGRESS.md](docs/PROGRESS.md)
- 旧版（V1）：`v1` 分支，标签 `v1-final`

## 运行

需要 Node 24。模型配置放在仓库根目录被忽略的 `.secret.txt` 里：第一行密钥，第二行接口地址。

```bash
npm install
npm run dev     # 打开 http://127.0.0.1:5170
npm run fake    # 不调用模型，用假模型试界面
npm run check   # 类型检查、测试、构建
```

可选环境变量：`SIMULORA_MODEL`（讲故事的模型）、`SIMULORA_RECORD_MODEL`（记录变化的模型）、
`SIMULORA_REASONING`（讲故事的思考强度，默认 `none` 不思考）、`SIMULORA_RECORD_REASONING`（记录变化的思考强度，默认留空用模型默认）、`SIMULORA_PORT`。数据存在 `data/` 下的 SQLite 文件里。
