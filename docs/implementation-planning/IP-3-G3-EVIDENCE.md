# IP-3 / Gate G3 Evidence — Action Truth

**Status:** `IMPLEMENTATION IP-3 COMPLETE — AWAITING INDEPENDENT G3 REVIEW`

**Scope:** This slice implements the server-side Action Truth vertical path only. IP-4 Return/Continuity/Correction, Recovery, Character autonomy, World Studio, live model providers and formal deployment remain out of scope.

## Implemented contract

```text
ready
  → POST Action (durable ACKNOWLEDGED)
  → worker lease + deterministic generation
  → provisional draft / exact L3 proposal
  → direct confirmation bound to actor + digest + expected head
  → atomic Commit + State Revision + Event + history + Branch head
  → next Action can start from the new head
```

PostgreSQL is authoritative. A model output, progress frame or client cache cannot advance current truth. The first deterministic adapter updates one existing canonical fact so the complete proposal/confirmation/commit semantics are exercised without a live provider.

## Data and invariants

- `actions` is the durable process record and idempotency boundary.
- `generation_attempts` records at-least-once worker attempts and an authorized context manifest.
- `action_proposals` stores one exact, digest-bound L3 proposal per Action.
- `action_confirmations` binds the actor, proposal digest and expected Branch head.
- `world_commits`, `state_revisions`, `domain_events` and `conversation_entries` are written with the Branch-head CAS in one transaction.
- `action_progress_events` is ordered and resumable; `transactional_outbox` is deduplicated by topic/source key.
- Database triggers reject invalid Action status transitions, mismatched Branch/head references and unconfirmed Action Commits.
- Duplicate submit returns the original Action. Duplicate confirmation returns the existing Commit. A stale head produces `CONFLICT` without a World mutation.
- Cancel competes under the locked Action transaction; a committed Action is never reported as cancelled.

## Verification run

The following local checks passed:

```text
pnpm format:check
pnpm typecheck
pnpm architecture:check
pnpm migrations:check
pnpm test
```

The full Playwright suite also passed for both desktop Chromium and the configured 390×844 mobile project:

```text
pnpm test:e2e
14 passed
```

The added PostgreSQL-compatible integration coverage exercises:

1. durable acknowledgement with no Commit;
2. duplicate idempotent submission;
3. worker generation into provisional/awaiting-confirmation;
4. exact confirmation and atomic Commit/head/state update;
5. repeated second Action with both committed history entries preserved;
6. stale submission rejected before generation;
7. ordered progress cursor/resume and terminal detection.

The browser Action Truth spec covers the same visible distinctions with a deterministic API fixture for desktop and the configured 390×844 project. The local static-preview run passed both tests on desktop Chromium and both tests on the 390×844 mobile project. Vite explicitly deduplicates the workspace React runtime so the production bundle renders the router and Action surface consistently.

## Explicit non-claims

- No live provider, model quality claim or unattended world-active mutation.
- No production retention, broker, distributed exactly-once or durable client/offline guarantee.
- No IP-4 Return/Continuity/Correction, P3 Recovery, P4 World Studio or formal deployment.

## Gate decision

This document records implementation evidence only. Gate G3 is not self-approved; an independent reviewer must verify the required journey and issue the external PASS/FAIL decision.
