# RE-2 Dialogue Attribution Repair

Status: **IMPLEMENTED / LOCAL REGRESSION PASS / INDEPENDENT REVIEW PENDING**.
Pre-repair HEAD: `b0832dd8ba7cd9e4208046eb52c8e85a09368fd9`.
Last independently approved RE-2 behavior remains
`3d14dc6792e406ce4c054ee01f4b424b00c27053`; this repair is not self-approved.

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
