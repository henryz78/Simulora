# RE-3 Nonbinding Option Follow-up Repair

## Scope

This is a narrow follow-up to the bounded Product Reality work. It does not
enable the production live provider, add an effect, start IP-7, or change the
frozen authority contract.

## Reproduced issue

With the exact ModelScope route `deepseek-ai/DeepSeek-V4.1-Flash`, a real
isolated RE-3 follow-up after a committed Character movement returned a valid
`NO_WORLD_EFFECT` candidate. The narrative included the deferential phrase
“whichever you choose”. The Action candidate was otherwise correctly bound to
Tavi, the expected head, and `NO_WORLD_EFFECT`, but the Action remained
`GENERATING` with a bounded retry because the authority guard reported:

`Generated narrative cannot author user speech or protected commitments`

The phrase was a reference to a future player choice, not an assertion that
the player had already chosen, consented, paid, spoken, or committed.

## Root cause

The TypeScript and PostgreSQL guards intentionally use a conservative
sentence-level subject/verb heuristic. Their existing narrow exceptions covered
`can decide`, `I won't choose for you`, and `由你决定`, but not conditional
phrases such as `whichever you choose` or `whatever the player decides`.

## Repair

- Added a TypeScript normalization for the bounded conditional forms
  `whichever|whatever|if <bound user subject> choose/chooses/decide/decides`.
- Added migration `0036_re3_nonbinding_option_followup.sql` with the same
  successor normalization at the PostgreSQL guard boundary, followed by
  `0037_re3_nonbinding_option_capture_fix.sql` to preserve the conditional
  subject prefix while normalizing the verb.
- The no-world-effect reason now uses the same bound-Character context in the
  application and SQL paths.
- Direct claims such as `you choose`, `you consented`, `you pay`, and a
  conditional phrase followed by a protected claim remain rejected.
- Added application and PostgreSQL-parity positive/negative examples.

No validator was loosened globally, no output is rewritten into a proposal,
and no confirmation or authority check was bypassed.

## Bounded live evidence

- ModelScope initially rejected the unqualified model ID with HTTP 400. The
  provider catalog identified `deepseek-ai/DeepSeek-V4.1-Flash` as the valid
  route. A minimal request then returned HTTP 200 with the expected
  `choices[0].message.content` envelope.
- A fresh isolated RE-3 session produced one real `COMPLETED_NO_EFFECT`
  response-only Action with Character attribution and no proposal/Commit. Its
  head, facts, world clock, Return freshness, and pending count were unchanged.
- The same session produced one real movement proposal for Tavi; exact
  confirmation committed the move from `Tidal Observatory` to `Sheltered East
  Lookout`.
- The post-movement response-only sample is the preserved guard-failure case
  above. It was not silently retried or edited. Its Action had no proposal or
  Commit and its original model output remains in ignored local evidence only.

## Verification status

Passed locally:

- domain authority tests: 23/23;
- repository lint;
- workspace typecheck;
- architecture check;
- migration ordering check before the successor: 36 migrations;
- diff whitespace check.

The migration catalog now contains 37 files; a PGlite fresh-migration probe
also confirms the positive conditional forms and the protected continuation
cases have matching SQL results. Real PostgreSQL CI remains authoritative.

The local PostgreSQL process disappeared before the focused integration suite
could run, so the SQL migration and app/SQL parity still require the exact-SHA
CI PostgreSQL run and an independent focused review. No production database was
touched.

## Remaining gate

Before treating this repair as closed, run fresh PostgreSQL migration/parity
tests, the existing G3–G6 regression suites, and one independent reviewer. A
post-repair live follow-up may be run only once a disposable PostgreSQL session
is available; the preserved pre-repair failure is already sufficient evidence
of the root cause.
