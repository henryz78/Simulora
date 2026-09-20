# IP-8 Repair / Verification Handoff

更新日期：2026-09-20（America/Los_Angeles）

这份文档是当前会话的停止点交接。接手 Agent 必须以仓库当前内容、当前
`git` 状态和最新 CI 为准，不要用旧聊天中的 SHA 覆盖仓库事实。

## 1. 当前目标

完成 Simulora 的 **IP-8 — Trust / Lifecycle** implementation candidate，修复
独立 Reviewer 对第一版候选指出的 IP-8 范围内问题，然后：

1. 做必要的静态、契约、浏览器和构建检查；
2. 提交一个精确的 repair commit；
3. 推送到 `main`，让仓库 GitHub Action 完成真实 PostgreSQL / CI 验证；
4. 使用同一个新的独立 Reviewer Agent 进行复审；
5. 只有独立复审和 CI 都满足时，才把 G8 标为 PASS。

用户明确要求：真实 PostgreSQL blocker 不需要在本机解决，本仓库推送后由
Action 自动验证。不要把本地跳过的数据库测试写成 PASS。

IP-8 冻结范围仍然是：

- eligibility / policy outcomes；
- ownership、grants、visibility、access explanation；
- consent 与 material-change notices；
- zero-cost usage quote / reservation / append-only ledger；
- selected-scope export、manifest、checksums；
- deletion proposal、tombstone、mutation block、purge status；
- audit / appeal seams。

明确延期且不要顺手实现：IP-8.7 staged import、IP-8.8 bounded sharing、
production live provider、autonomous scheduler、完整 long-term memory、任意
effect DSL、新 truth model，或依赖 Prototype 的 production 语义。

## 2. 当前正在做的事

第一版 IP-8 候选已经由前一个 Agent 实现并提交；独立的新 Reviewer
`/root/ip8_reviewer_new`（用户指定模型：**gpt-5.6-luna max**）审查后返回
**FAIL**。本会话正在对该 FAIL 做 repair，但在 repair 完成前用户要求停止，
因此当前工作区是“未提交的 repair candidate”，不是最终 Gate。

本次 repair 已涉及：

- 新增 `db/migrations/0041_ip8_trust_repairs.sql`：
  - material product change 的 `affected_scopes`、`effective_at`、
    `available_choices`；
  - `export_jobs.reservation_id`；
  - `export_jobs.artifact_bytes`，让 export artifact 可从 PostgreSQL 恢复。
- contracts 增加 product-change 必需字段；export request 增加必需
  `reservationId`。
- export server path：要求账户拥有、未终结的 EXPORT reservation，且其
  `action_key` 必须是 `export:<idempotencyKey>`；export snapshot 使用
  `REPEATABLE READ` transaction；artifact bytes 写入 `export_jobs`，下载时从
  DB 读取并重新校验 SHA-256；export job insert 使用 conflict-safe idempotency。
- usage reservation：先恢复相同 action key 的既有 reservation，再检查 quote
  expiry；insert 使用 `ON CONFLICT DO NOTHING`，处理重试/竞态。
- appeal insert 使用 conflict-safe idempotency。
- tombstone protection：新增 branch / continuity mutable guard；已接到
  `confirmAction`、recoverable `retryAction`、recovery point create/delete、
  branch fork 等 mutation path，返回稳定 `WORLD_TOMBSTONED` conflict，而不是
  让 PostgreSQL trigger 变成泛化 500。
- consent：新增 `assertConsentActive`；如果账户存在任何 `WITHDRAWN`
  consent，阻断主要 authoring / continuity / action / recovery mutation；
  读取、appeal、export、delete 等恢复路径仍应保持可用。
- material changes UI 显示 affected scopes、effective time、available choices。
- IP-8 integration fixture 改成 reservation 先绑定 export，再 settle；E2E
  mock 增加新的 product-change 字段。

## 3. 当前进展与精确仓库状态

### 已批准基线

- 当前正式历史行为基线：`284454e0ba3d26509a335e9742a1dee11143a155`
  （IP-7 / G7 通过前的文档历史基线；不要把它误当成当前未提交 repair）。
- IP-7 / G7 已通过。
- IP-8 第一版行为提交：
  `686b93c4a2964aa95eaef41966347bad74f2988e`
  (`feat: implement IP-8 trust lifecycle envelope`)
- IP-8 第一版文档提交：`6f13007`
  (`docs: record IP-8 candidate handoff`)
- `main` 当前 HEAD 是 `6f13007`；本会话没有推送 repair。
- `work/` 是用户已有的未跟踪目录，**禁止读取后改写、删除、加入 commit 或
  reset**。

### 当前未提交文件

当前 `git status --short` 应显示这些 repair 文件，以及用户目录 `work/`：

```text
 M apps/api/src/app.ts
 M apps/web/src/pages.tsx
 M packages/contracts/src/index.ts
 M packages/database/src/index.ts
 M tests/e2e/ip8-trust-lifecycle.spec.ts
 M tests/integration/ip8-trust-lifecycle.test.ts
?? db/migrations/0041_ip8_trust_repairs.sql
?? work/
```

除上述 repair 外，不要覆盖用户的其它工作。

### 本地验证结果（repair 后）

已完成并通过：

- `pnpm typecheck`
- `pnpm format:check`
- `pnpm architecture:check`
- `pnpm migrations:check`（当前 41 migrations）
- `pnpm runtime:check`
- changed-file ESLint JSON run：0 errors
- `pnpm test`：64 passed；129 PostgreSQL-dependent tests skipped
- `pnpm test:e2e`：68 个测试输出均显示 `ok`，但本会话在 Playwright server
  cleanup 完成前主动中止，所以不要把它写成正式最终 PASS；接手 Agent 可
  重新跑一次并等待正常退出。

已知本地工具问题：普通 `pnpm lint` 的 ESLint stylish formatter 在当前环境
会报 `TypeError: chalk.underline is not a function`。这不是代码 lint finding；
可使用仓库本地 `.\node_modules\.bin\eslint.cmd ... --format json` 验证，或在
CI 观察正式 lint 结果。

尚未完成、必须交给 CI / 接手 Agent：

- 本机没有 `SIMULORA_DATABASE_URL`；Docker 也不可用，因此 real PostgreSQL
  IP-8 integration 仍未执行。用户明确要求 push 后由 Action 自动验证。
- repair 后尚未做一次完整、正常退出的 `pnpm build`；第一版 build 曾在
  require-escalated 环境 PASS，sandbox 失败是 esbuild 读取父目录限制。
- 未提交、未推送、未更新 G8 PASS 结论。

### Reviewer 第一轮 FAIL（必须逐项复核）

Reviewer 的结论不是 Gate：

- **B-1**：真实 PostgreSQL/IP-8 integration 未跑（当前应由 push/Action 关闭）。
- **I-1**：tombstoned World 后 retry、recovery point delete、confirm 等路径
  不能继续变更或返回泛化 500。
- **I-2**：export 没有 server-side 绑定 usage reservation。
- **I-3**：usage / export / appeal idempotency 存在 precheck-then-insert race；
  quote 过期后同 action key retry 也不能恢复既有 reservation。
- **I-4**：`LocalArtifactStorage` 是进程内 Map，重启后 artifact 丢失；export
  多次独立 query 也没有固定 snapshot/head。
- **I-5**：withdrawn consent 只写审计，不影响授权 mutation。
- **I-6**：material-change notice 缺 affected scope、effective timing、
  available choices/recovery 等 MUST 字段。
- **M-1**：冻结 API 约定的 idempotency key 应优先走 HTTP header；当前主要仍
  在 JSON body。若修复，不要破坏现有兼容性。
- **M-2**：purge status 仍是 seam，不应让 UI 暗示实际 purge worker 已完成。

接手 Agent 必须用真实 diff / tests 复核上述 repair 是否真的覆盖，而不是只
看这份摘要。

## 4. 接手 Agent 的第一整天阅读与执行顺序

### 先恢复仓库事实

1. 先读根目录 `AGENTS.md`。
2. 读取 `docs/implementation-planning/IMPLEMENTATION_STATUS_HANDOFF.md`。
3. 读取 `docs/implementation-planning/IP-8-IMPLEMENTATION-REPORT.md`。
4. 读取冻结 Product / System / Experience 文档，以及
   `docs/implementation-planning/RE-1-RE-3-PRODUCT-REALITY-CLOSURE-HANDOFF.md`。
5. 阅读本文件后执行：

   ```powershell
   git status --short
   git log --oneline -8
   git diff --stat
   git diff -- db/migrations/0041_ip8_trust_repairs.sql packages/contracts/src/index.ts packages/database/src/index.ts apps/api/src/app.ts
   ```

6. 不要使用旧对话中的 SHA 覆盖 `git` 事实；不动 `work/`。

### 然后做最小但完整的技术检查

1. 先 `pnpm typecheck`、`pnpm format:check`、`pnpm architecture:check`、
   `pnpm migrations:check`、`pnpm runtime:check`。
2. 用 JSON formatter 跑 changed-file ESLint；普通 stylish formatter 的
   `chalk.underline` 环境问题应单独记录。
3. 重新跑 `pnpm test`，确认 migration-contract 和非 PostgreSQL 套件。
4. 重新跑 `pnpm test:e2e` 并等待正常退出；确认 desktop/mobile、IP-8、axe。
5. 在允许的环境中跑 `pnpm build`。
6. 不要为了本机补 Docker 或 secret；real PG 交给 Action。

### 之后做代码审计重点

- `packages/database/src/index.ts` 的 `createExport`：transaction 中调用
  `this.readExport` 的 idempotent return 是否在目标 pool 配置下安全；竞态、
  tombstone、reservation ownership、artifact checksum 是否一致。
- `assertMutableBranchWithClient` / `assertMutableContinuityWithClient` 的
  PostgreSQL `FOR UPDATE OF` 语法和真实 migration schema。
- `assertConsentActive` 是否只阻断 mutation，不阻断用户查看、申诉、导出和
  删除自有数据；withdrawal 后重新 grant 是否可恢复。
- `0040` 到 `0041` 的 fresh database 与 upgrade path；不要修改历史 migration
  `0040` 代替新增 successor。
- `readExportArtifact` 真实 PostgreSQL `bytea` driver 返回类型（Buffer）和
  checksum。
- `M-1` header idempotency 和 `M-2` purge 文案是否仍需最小修复。

## 5. 提交、推送与复审协议

完成上述检查后：

1. 只提交 IP-8 repair 文件，不要加入 `work/`。
2. 提交信息应明确是 IP-8 repair；记录精确 repair SHA。
3. 推送 `main`，让 GitHub Action 自动运行真实 PostgreSQL / CI。用户已说明
   这里不需要本机跑数据库。
4. Action 完成后，使用同一个 `/root/ip8_reviewer_new` 做 focused re-review；
   不要换成旧 IP-7 reviewer，也不要主实现 Agent 自我批准 Gate。
5. 复审必须看到 repair commit SHA、CI run、真实 PG 结果、migration upgrade、
   domain / browser / build evidence。
6. 若 Reviewer 仍 FAIL，先修复 findings，再让同一 Reviewer 复审；不要把
   G8 标成 PASS。
7. 只有 Reviewer PASS 且 CI evidence 完整后，才更新
   `IMPLEMENTATION_STATUS_HANDOFF.md`、IP-8 report 和导航文档，明确：
   - IP-8 behavior SHA；
   - documentation-only SHA（如有）；
   - CI run；
   - G8 PASS；
   - 延期 IP-8.7 / IP-8.8；
   - human long-play、production live model、broad autonomous simulation、
     long-term memory 仍未验证/未启用。

本交接文档本身只记录停止点，不代表 IP-8/G8 已通过。
