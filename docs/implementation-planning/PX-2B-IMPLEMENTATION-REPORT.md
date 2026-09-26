# PX-2b Implementation Report

**Status:** implementation complete; independent review and exact-SHA CI are
pending.

PX-2b implements the approved D1 A behavior: a new unaddressed
`PARTICIPATE` Action is generated as a WORLD response. The Action may still
include the shared facts visible at the current head, but it receives no
Character context, private Character facts, or Character-owned effect.
Explicit Character selection remains unchanged.

The successor migration `0054_px2b_world_response.sql` records an immutable
selection epoch. Actions created before that epoch keep the previous implicit
selection behavior, so existing pending Actions are not silently rebound.
The application compiler and the SQL generation, evidence, and terminal
validators use the same selection rule.

Validation completed locally:

- `pnpm migrations:check` — pass (54 migrations).
- `pnpm test` — pass (20 files, 130 tests; 20 files and 182 tests skipped by
  the repository's existing gates).
- `pnpm typecheck` — pass.
- `pnpm lint` — pass.
- `git diff --check` — pass.
- The focused IP-6 participation test covers pre-epoch implicit Character
  selection and post-epoch WORLD selection.

The repository's full `format:check` still reports pre-existing warnings in
`packages/config/src/index.ts`, `packages/model-gateway/src/index.test.ts`,
and `packages/testkit/src/index.ts`; the PX-2b files were formatted directly.
Real PostgreSQL validation was not run because `SIMULORA_DATABASE_URL` is not
configured in this workspace.

The implementation does not modify the PX-2a front-end files or model-gateway
prompt. Login, staging preparation, production live enablement, and any
knowledge-boundary expansion remain out of scope.

## CI repairs and independent Review (2026-09-26)

- `55fa21e` gates the application on the installed 0054 function and repairs
  the PX-2b tests; `afb4b5b` gives a cold-start PG case a 30s timeout.
- CI `36278200069` at `afb4b5b`: every PostgreSQL suite passed. The only failure
  was the stack journey `tests/stack/first-action.spec.ts`, which still expected
  "Character response · A local guide" for an Action that addresses no Character.
  Under D1 A that Action is a WORLD response, so the test now expects
  "World response" (test-only change). Local stack run against real PostgreSQL,
  API and worker: 10/10 (desktop and 390×844).
- Independent Reviewer: `PASS WITH ISSUES` (0B/2I/2M) on `3012bea` + `55fa21e` +
  `f926ac4`. Disposition:
  - **I-1 (evidence copies responseSource): does not reproduce.** The proposal
    binding trigger also requires `action_proposal_effect_is_valid`, which binds
    the source for every PARTICIPATE family: fact rewrite to the manifest's
    `includedCharacterIds` (itself bound to the epoch-gated selection by the
    evidence check, 0030), MOVE to the explicit target (0032), and closures to
    `mgc_selected_character` (0048, epoch-gated by 0054). No migration added.
  - **I-2 (no negative test): added.** `binds the declared response source to
    the selected Character or WORLD` forges a self-consistent attempt and
    proposal both ways (Iora-addressed sealed as WORLD; unaddressed sealed as
    Iora) and is rejected, with a sealing WORLD control. It was run against a
    0054-only database first and was already rejected there, which is the
    evidence for the I-1 disposition.
  - **M-1** (no proposal sealed before 0054 then confirmed after): accepted as
    low risk; 0054 changes no manifest shape, only the epoch-gated selection.
  - **M-2** (stale untracked `dist/` typings): not a tracked artifact; no change.
- Local evidence after the repair: fresh PostgreSQL 16, `test:postgres` 21 files,
  181 passed / 2 skipped; `pnpm check` pass. Exact-SHA CI and the Reviewer's
  focused re-review are still required before PX-2b closes.
