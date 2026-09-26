# Parallel Agent Handoff (2026-09-26)

For a second coding Agent working alongside the main session. Read
`AGENTS.md` first; all its rules apply. In particular:

- Never read, modify, delete or commit `work/`. Never read or print
  `.secret.txt`.
- Migrations are successor-only. Behavior and documentation commits stay
  separate. Broad suites run in CI (GitHub Actions on real PostgreSQL); PGlite
  and skipped tests are not evidence.
- A track closes only on an independent Reviewer's PASS on an exact SHA with
  green CI. Reviewer subagents use Sonnet 5.
- Beta, launch and production live model use remain unauthorized.

## Current state

_Updated 2026-09-26 (evening)._

- **Closed:** TB-1 (`95a23c5`), PX-1 (`2a860ec`), PX-2a (`275805a`); see
  [handoff](IMPLEMENTATION_STATUS_HANDOFF.md) §58–§60.
- **In progress by the main session:** PX-2b (Task 1 below), implemented on
  `main`; the exact-SHA CI and the Reviewer's focused re-review are pending
  (handoff §59). Until it closes, do not edit `db/migrations/`,
  `packages/database/src/index.ts` or `tests/integration/ip6-participation-character.test.ts`.
- **Free for a parallel Agent:** Task 4 (front-end design proposal).

## Task 1 (ready now, decided): PX-2b, the world answers when no Character is addressed

**Decision:** [PX-2](PX-2-PROPOSED-ADRS.md) D1 option A, chosen by the owner
on 2026-09-26.

**Problem:** with no Character selected ("Let the world respond"), the server
binds the first Character who knows the target fact, so that Character answers
everything. In the [health check](PLAY-WEIGHT-HEALTH-CHECK.md) Marta answered
for a wool merchant who could not speak.

**Goal:** an Action with no `targetCharacterId` gets a `WORLD` response. The
world may voice unnamed people in the scene. They know only what the context
already allows for a `WORLD` response, change nothing beyond the requested
effect, and do not become Characters.

**Where the selection rule lives** (each must change identically):

- application: `compileActionGenerationContext` in
  `packages/database/src/index.ts`;
- SQL, current definitions:
  - the RE-2 compiler (`re2_generation_context_pre_tb1`, from 0029);
  - `action_generation_evidence_is_valid` (0048);
  - `mgc_selected_character` (0048);
  - `valid_action_no_effect_evidence` (0046);
  - check for any later copy with
    `grep -n "targetCharacterId' is null" db/migrations/*.sql`.

**Constraints:**

- One successor migration (0054 or later).
- Actions created before it keep today's selection, so their pending evidence
  still validates. Use the TB-1 pattern: gate on the Action's `created_at`
  against the migration ledger's `applied_at`, protected like 0053.
- Keep application and SQL parity, and prove it on real PostgreSQL.
- The knowledge boundary does not widen: a `WORLD` response gets no private
  fact it would not get today.
- The prompt wording for voicing unnamed people touches
  `packages/model-gateway/src/index.ts`. Wait until PX-2a lands.
- Write a short contract first, then implementation, then an independent
  Review.

## Task 2 (needs the owner's OK first): real sign-in

Only a development auth adapter exists (`packages/auth`). The owner chose
Google and email sign-in ([G10 packet](G10-EXTERNAL-DECISION-PACKET.md) §5);
the identity service is still open. Supabase Auth fits the Supabase database
choice. Needs the owner to confirm the service and to create the Google OAuth
client. Then: an `AuthPort` adapter verifying the service's tokens, a sign-in
page in a new web file, adult-only statement, tests with a token double.

## Task 3 (needs the owner's OK first): staging preparation

Containers exist in `deploy/containers`; no cloud environment exists. The
owner chose Cloudflare and Supabase; the container host for API and worker is
open. Preparation only, no deployment without the owner:

- environment templates;
- running migrations over a direct or session connection (the migrator holds a
  session advisory lock);
- the web build for Cloudflare;
- a staging runbook with backup, restore and point-in-time recovery for the
  1 h RPO.

## Task 4 (approved by the owner 2026-09-26): front-end design proposal

**Goal:** an original front-end design proposal the owner can choose from.
This is a design step, not an implementation track. What the owner selects
becomes a later bounded track (PX-3) with its own contract, independent
Review and exact-SHA CI.

**Work in a new git worktree** on its own branch, for example:

```
git fetch origin main
git worktree add ../Simulora-frontend-design -b frontend-design origin/main
```

Commit and push only that branch; do not push to `main`, and do not modify
the main checkout. Remove the worktree when the proposal is delivered.

**Deliverable:** `docs/implementation-planning/FRONTEND-DESIGN-PROPOSAL.md`.
An optional standalone prototype may live under `docs/implementation-planning/frontend-design/`;
it must not import from or change `apps/web`.

**Start from:**

- the open findings of the [Play Weight Health Check](PLAY-WEIGHT-HEALTH-CHECK.md):
  two choices before every Action, engineering copy (Branch, Commit, L3,
  Provisional), feedback while a ~20 s generation runs, a home page that reads
  as implementation status;
- what PX-1 and PX-2a already changed ([PX-1 report](PX-1-IMPLEMENTATION-REPORT.md),
  [PX-2a report](PX-2A-IMPLEMENTATION-REPORT.md)), and PX-2b's WORLD response;
- both viewpoints in [Product Direction Guardrails](PRODUCT_DIRECTION_GUARDRAILS.md):
  the world director who shapes the World, and the player who enters as a
  role and controls only themselves;
- the current screens in `apps/web/src` (read only).

**The proposal covers:**

- information architecture and navigation (home, library, Studio, play,
  Return, recovery);
- the play loop, step by step, at desktop and 390×844;
- a visual direction (type, colour, spacing, motion), stated as a direction
  only, since brand is still open (G10 packet item 7);
- for each change: whether it touches frozen semantics (exact confirmation,
  authority, participation, Restore). Changes that do need a successor ADR and
  the owner's decision, and are marked as such;
- the effect on accessibility (the E2E suites run axe checks) and on the
  browser tests that locate elements by accessible name and copy;
- options where there is a real choice, with a recommendation.

**Not allowed:**

- copying WorldOS UI, layout, copy, naming, icons or visual expression;
- changing APIs, database, confirmation or any frozen semantics;
- editing `apps/web`, `packages/` or tests in this task;
- reading, modifying or committing `work/`; reading or printing `.secret.txt`.

**Done when:** the proposal is pushed on its branch and the owner has the
link. No Review is needed for the proposal itself; its implementation is
reviewed as PX-3.

