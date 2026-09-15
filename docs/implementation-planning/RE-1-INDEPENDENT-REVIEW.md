# RE-1 Independent Review and Closure

Reviewer: `gpt-5.6-luna / max`, independent read-only sub-agent.
Reviewed behavior: `7d668daa64f1b579eec0196c16f2500f255169ab`.
Diff: `e892c616ca7205d89b0d03584fa5ede65882d8cc..7d668daa64f1b579eec0196c16f2500f255169ab`.
The user accepted the result and subsequently instructed the agent to begin the
recommended documentation closure and RE-2. This is focused RE-1 approval, not
approval of a full runtime, RE-3, IP-7 or real-model product quality.

## Original Reviewer result

```text
RE-1 INDEPENDENT REVIEW: PASS

- SOURCE-HEAD BINDING: PASS
- CURRENT TRUTH / HISTORY: PASS
- WORLD / CONTINUITY / RETURN PARITY: PASS
- CORRECTION + LATER ACTION: PASS
- REMOVAL / PRIVACY: PASS
- RESTORE REGRESSION: PASS
- DESKTOP / 390x844: PASS
- G1–G6 AUTHORITY REGRESSION: PASS
- EXACT-SHA CI: PASS

BLOCKERS: 0
IMPORTANT: 0
MINOR: 0

RE-1 READY FOR APPROVAL: YES
```

审查范围固定为 `e892c616ca7205d89b0d03584fa5ede65882d8cc..7d668daa64f1b579eec0196c16f2500f255169ab`。基线独立确认：

```text
branch: main
HEAD: 7d668daa64f1b579eec0196c16f2500f255169ab
origin/main: 7d668daa64f1b579eec0196c16f2500f255169ab
behavioral tracked worktree: clean at review start
```

实际实现检查：

- `packages/database/src/index.ts:482-486`：orientation payload 选择 bound State Revision 中第一个 `ACTIVE + SHARED` fact；无共享事实时回退 `worldClock`。
- `packages/database/src/index.ts:879-899, 2864-3075`：初始化、读取、STALE/REBUILDING、重建均保持 source-head/revision 绑定；旧 projection 不被静默当作 current。
- `apps/web/src/pages.tsx:1751-1837`：World、Continuity、Return fallback 使用同一 current-fact 规则；private、removed、非-active facts 不成为 current lead。
- `packages/domain/src/index.ts:969,1043`：ordinary Action 追加历史，初始 seed 仍保留为 history；Correction 后 11 个后续 Action 不会重新选旧 seed。

未发现真实 RE-1 issue，因此没有需要指定文件行号的修复项，也没有最小修复要求。

独立验证：

- `pnpm format:check` — PASS
- `pnpm lint` — PASS
- `pnpm typecheck` — PASS
- `pnpm architecture:check` — PASS
- `pnpm migrations:check` — PASS
- 独立临时 PostgreSQL 17.11：`pnpm test:postgres` — 113/114 passed；唯一失败为无关的 `tests/integration/migration-upgrade.test.ts:73`（期待 `AWAITING_CONFIRMATION`，实际 `GENERATING`）。RE-1 相关测试全部通过：Return/Continuity 15/15、adversarial 9/9、Recovery 22/22。
- `.\node_modules\.bin\playwright.cmd test tests/e2e/ip4-continuity.spec.ts` — desktop + 390x844 共 16/16 observed `ok`；本地 Vite helper 在测试后未自行退出，手动终止进程，非测试失败。
- GitHub Actions exact SHA run `34990847673` — PASS，包含 migration、authoritative PG integration、build/container smoke、Chromium、desktop 和 390x844 browser checks：
  [CI run](https://github.com/henryz78/Simulora/actions/runs/34990847673)
  [quality job](https://github.com/henryz78/Simulora/actions/runs/34990847673/job/104454791142)

OBSERVATION / FUTURE HARDENING（不计 severity）：当前 lead 明确只是 source-bound 的单一 shared fact，不是完整 scene synthesis；多 fact 主次排序和结构化 threads 仍未定义。这是报告已披露的边界，不构成 RE-1 缺陷，也不代表 RE-2/IP-7 获得批准。

本地未新跑 Docker（环境无 Docker）；未读取原 Spike DB（指定实例当时不可用），但独立临时 PG 与 exact-SHA CI 已覆盖本次修复。最终未改产品/测试/冻结 contract，未 commit/push；当前并行文档及 `work/` 临时目录的未提交变化属于主 Agent 范围，未纳入行为审查。

## Evidence qualification

The original result above is preserved, including the failed local upgrade test.
That run is **not** represented as 114/114 PASS. Main's earlier 114/114 local run
and same-SHA successful CI are distinct evidence. The isolated failure's cause
was not independently established by this focused review; retain it as an
unresolved test-run observation and check it during subsequent regression.
No authority failure was reported or reproduced in RE-1.

The direction-goal documentation written during review does not change its
behavior baseline. Subsequent documentation-only closure does not replace
`7d668daa` with a new reviewed behavior SHA.
