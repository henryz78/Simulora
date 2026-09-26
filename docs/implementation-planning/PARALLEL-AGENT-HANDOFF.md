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

- **Approved behavior:** TB-1 closed at `95a23c5`
  ([report](TB-1-IMPLEMENTATION-REPORT.md)).
- **In review by the main session:** PX-1 at `2a860ec`
  ([contract](PX-1-PLAY-EXPERIENCE-CONTRACT.md)).
- **In progress by the main session (do not edit these until it lands):**
  PX-2a, which touches `apps/web/src/continuity.tsx`,
  `apps/web/src/pages.tsx`, `apps/web/src/styles.css` and the live prompt in
  `packages/model-gateway/src/index.ts`.
  - D2 "quick play": an opt-in setting on the play page; L2 proposals are
    confirmed automatically by the player's client, with one-click Undo through
    the existing Restore.
  - D1's second half: the prompt narrates the player's own action in the
    second person.

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
