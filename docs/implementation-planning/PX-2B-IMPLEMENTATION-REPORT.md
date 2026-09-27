# PX-2b Implementation Report

**Status:** `CLOSED` at `c7242b2` (exact-SHA CI `36279253443` success;
independent re-review `PASS WITH ISSUES`, 0B/0I/1M accepted). Behavior
commits: `3012bea`, `55fa21e`; later commits are test and docs only.

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
  - **M-1** (no proposal sealed before 0054 then confirmed after): already
    covered. The migration-upgrade case "across 0047 to 0048 and later" seals
    a proposal on a 0047 schema, runs the full chain through 0054 and confirms
    it as `COMMITTED` (confirmed by the re-review).
  - **M-2** (stale untracked `dist/` typings): not a tracked artifact; no change.
- Local evidence after the repair: fresh PostgreSQL 16, `test:postgres` 21 files,
  181 passed / 2 skipped; `pnpm check` pass. Exact-SHA CI and the Reviewer's
  focused re-review are still required before PX-2b closes.

## Focused re-review and closure (2026-09-27)

A new independent Reviewer (Sonnet 5; the first Reviewer's session could not be
resumed) re-reviewed `9ae9b69` and `c7242b2`: **`PASS WITH ISSUES`, 0B/0I/1M.**

- **I-1 disposition confirmed.** Every `PARTICIPATE` family binds the response
  source to the epoch-gated selection somewhere on the insert path:
  - fact rewrite through `action_proposal_effect_shape_is_valid` (0030) and
    the manifest check in `action_generation_evidence_is_valid` (0054);
  - MOVE to the explicit target (0032);
  - closures through `mgc_selected_character` (0048, 0054);
  - no-effect responses in `valid_action_no_effect_evidence` (0054).
- **The new negative test rejects for the claimed reason.** Its WORLD control
  seals and is checked valid.
- **The stack test change matches D1 A.** Explicit-Character coverage stays
  in `tests/e2e/action-truth.spec.ts`.
- **Migration hygiene holds.** Only `0054` was added; no existing migration
  was edited.
- **New M (accepted):** the addressed half of the new test relies on
  `prepareRawParticipateProposal` lifting every legacy manifest. If that lift
  were narrowed later, the case could pass for the legacy-manifest reason
  instead. Recorded here; no change.

Evidence: exact-SHA CI `36279253443` at `c7242b2`, success (verified by the
owner). **PX-2b CLOSED.**

## Not claimed

- A live check of WORLD responses with the owner's provider (not yet run).
- Human enjoyment; beta, launch or production live model use.
