# RE-2 Dialogue Attribution Repair

Status: **CLOSED / FOCUSED INDEPENDENT REVIEW PASS / EXACT-SHA CI PASS**.
Pre-repair HEAD: `b0832dd8ba7cd9e4208046eb52c8e85a09368fd9`.
Approved repair behavior: `d6d6ea9a8278a8510e83ffa70d54baa0503463d8`.
Earlier RE-2 approval `3d14dc6792e406ce4c054ee01f4b424b00c27053` is preserved.
The independent closure below supersedes the original pending state; this is not
self-approval or qualification of a complete AI World.

## Demonstrated root cause

The [actual RE-2 experiment](RE-2-CONTEXT-REALITY-CHECK.md) rejected Tavi's
`'If you wave …,' Tavi says, …` with the user-agency error. The English guard
associated `you` with a later `says` belonging to Tavi. This was not a user
decision, consent or completed movement. Historical failed/cancelled Action
`f8c669ec-7638-4b3e-90da-e5c7bfefe231` and its experiment evidence stay unchanged.

There are three production checks: repository output, domain candidate and SQL
proposal effect/evidence validation. The SQL effect-shape function inherited from
0016 also checked narrative independently; repairing only the latest evidence
function was insufficient. The initial local replay caught that remaining refusal.

## Minimal repair

- Only narrative may recognize a comma-delimited `, Tavi says/said,` attribution,
  including surrounding ASCII quote/whitespace. The narrator name must come from
  the selected Character in the bound source-head State Revision, not model prose.
- For the guard's analysis only, replace that attribution verb with `narrates`.
  Do not discard the utterance, split away user clauses, alter stored output or
  rewrite the model's candidate/digest. Every other authority check still runs.
- If the Character name overlaps generic user subjects or normalized user-role
  tokens/aliases (including underscores), no exception applies. Unrecognized
  names/scripts/grammar retain the conservative existing guard.
- Canonical after-statements and provenance retain strict checking. Protected
  user speech/commitment before or after the attribution still fails. Character
  identity, authorized facts, actor/head/digest, impact and confirmation are unchanged.
- Migration 0030 adds a scoped SQL overload and replaces both existing proposal
  validators without modifying historical migrations or prior records.

This is one demonstrated English attribution repair, not an NLP parser or a
general solution to semantic agency/disclosure detection. Other false positives
may remain. Do not weaken privacy or user authority to improve acceptance rates.

## Validation

- Domain: 19/19; safe attribution, wrong/missing speaker, direct/passive user
  commitments, comma interruptions, composite `You and Tavi said`, role collisions.
- Real PostgreSQL 17: **118/118, zero skip**, fresh database through 0030;
  existing prior-schema upgrade tests and G1–G6 integration regressions included.
- Exact historical Tavi prose replay: durable Action → sealed proposal → exact
  confirmation → Commit; head unchanged before confirmation. The test uses the
  existing deterministic candidate effect, not acceptance of the historical
  model's new factual claims, and makes no live request.
- Default suite: **57 PASS / 117 DB-dependent skips**, separately covered above.
- Desktop/390×844 pointer browser suite: **54/54 PASS**, existing mocked-API E2E,
  not live-model/browser play.
- Format, lint, typecheck, architecture and 30-migration checks PASS.
- Sandbox build initially failed on Windows ancestor-directory access; existing
  build rerun with approval **PASS**; worker bundle startup/shutdown **PASS**.

No new API calls, dependencies, effect operations, frontend redesign, production
live switch, RE-3 implementation or IP-7. Docker smoke not run locally; exact-SHA
GitHub CI and independent review are not inferred from local success.

## Independent closure — original Reviewer result

Reviewer: existing `/root/re1_independent_review`, GPT 5.6 Luna max.
The following is its returned focused result, not a new main-Agent test run.

FOCUSED REPAIR REVIEW: **PASS**

范围：`b0832dd8..d6d6ea9`。基线独立确认：

- Branch `main`
- HEAD/origin/main：`d6d6ea9a8278a8510e83ffa70d54baa0503463d8`
- tracked worktree clean；仅保留既有未跟踪 `work/`

结论：

- `packages/domain/src/index.ts:527-565`：仅允许绑定 source-head Character 的 ASCII comma-delimited `says/said` narrative 例外；实际文本不被改写。
- `packages/database/src/index.ts:4122-4131`：repository 使用 bound Character name；source/actor/head/context/L3 约束保持。
- `db/migrations/0030_re2_dialogue_attribution.sql:4-29,117-124,337-349`：SQL effect-shape 与 evidence validator 同步修复；afterStatement/provenance 仍使用严格两参数 guard；proposal digest/narrative 原值不变。
- wrong/missing speaker、user/generic/underscore collisions、前后 user commitment 均继续阻断。

独立验证：

- Domain: **19/19 passed**
- Fresh PostgreSQL 17 DB `simulora_re2_dialogue_reviewer_20260915`
- Focused `tests/integration/ip6-participation-character.test.ts`: **38/38 passed**
- 覆盖真实 Tavi prose replay、sealed SQL evidence、exact confirmation、head unchanged before confirmation、wrong speaker、missing speaker、role/generic/underscore collision。
- 该 replay 使用 deterministic candidate，不代表真实模型调用或接受历史模型新增事实；历史失败 Action/evidence 未修改。
- 本地 Docker 未运行；exact-SHA CI 的 container/build/browser steps 已实际通过。

Exact-SHA CI：

- [Run 35034518562](https://github.com/henryz78/Simulora/actions/runs/35034518562)
- [Quality job 104600447908](https://github.com/henryz78/Simulora/actions/runs/35034518562/job/104600447908)
- SHA `d6d6ea9a8278a8510e83ffa70d54baa0503463d8`
- `success`：migration、authoritative PG、IP-5、container smoke、desktop/390x844 browser checks 全部成功；browser evidence upload 按预期 skipped。

BLOCKERS: **0**

IMPORTANT: **0**

MINOR: **0**

局限（不计 issue）：这是一个明确的英文 `, Character says/said,` 归属修复，不是通用 NLP parser；其他语言/语法仍保持保守拒绝。未运行 live model。

**RE-2 小修复可关闭：YES。**

不批准 RE-3、RE-4 或 IP-7。
