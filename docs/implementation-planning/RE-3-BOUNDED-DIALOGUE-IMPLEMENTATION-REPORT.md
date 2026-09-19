# RE-3 Bounded Dialogue Implementation Report

> **Historical status note:** The pending-review language later in this report
> reflects its authoring checkpoint. The successor behavior was independently
> approved at `ae02de4fe8de261a4164ee6f67c534f8349e1fd5` (PASS, 0/0/0;
> exact-SHA CI `35415958261`). See the [final RE-1–RE-3 closure handoff](RE-1-RE-3-PRODUCT-REALITY-CLOSURE-HANDOFF.md)
> for the current disposition.

## Scope

This repair closes the remaining Product Reality gap for the already-approved
`NO_WORLD_EFFECT` effect. It does not add a new effect, live provider, scheduler,
long-term memory system, or IP-7 behavior.

## Root causes

1. The Character agency guard treated a small set of explicit deference phrases
   (for example, `keeper can decide` and `I won't choose for you`) as if the
   Character had made the user's protected decision.
2. A valid response-only candidate was classified as an uncommitted L0 result,
   then surfaced as `FAILED_RECOVERABLE` and forced through Cancel. That made a
   normal answer look like a generation failure.

## Chosen contract

ADR-019 defines `COMPLETED_NO_EFFECT`: a successful, immutable Action terminal
with one Action-bound dialogue record. The record keeps Character/World
attribution, source head and State Revision, provenance, visibility and time.
It is not a fact, Commit, State Revision, clock advance, Character knowledge,
relationship, resource, permission or derived-memory ledger. Later generation
can receive only the same-account, same-Branch authorized dialogue tail; the SQL
query stops at Restore and correction/removal boundaries and applies existing
context filtering.

L2/L3 effects still require their existing exact confirmation. Cancel, Correction,
Removal, Branch and Restore semantics are unchanged.

## Implementation

- Added `COMPLETED_NO_EFFECT` to domain/transport Action status handling.
- Added migration `0034_re3_bounded_dialogue.sql` with an Action-bound JSON record,
  immutable evidence checks, source/attempt/Character binding, SQL guard parity,
  and an authorized same-path dialogue query.
- Completed the L0 worker path atomically after successful generation; it writes
  no Commit, State Revision, Event or world-clock change and marks the durable job
  successful.
- Added the bounded deference exception in the shared domain guard and its SQL
  mirror; protected continued commitments remain rejected.
- Added API/UI projection and mobile/desktop evidence with no confirmation
  controls for a completed response-only Action.
- Added ADR-019 and regression coverage for domain, SQL, migration upgrade,
  G3/G4/G5/G6 integration and browser paths.

## Verification

Before independent review, the candidate passed:

- format, typecheck, ESLint JSON, architecture and migration checks;
- production build and worker runtime startup/shutdown;
- unit suite: 63 passed, 125 database-dependent tests skipped by the default
  command (the skipped suites were run separately below);
- fresh PostgreSQL 17 full integration: **126/126, 0 skipped**;
- full desktop Chromium + 390x844 mobile E2E: **62/62**;
- prior-schema migration upgrade, including populated predecessor data.

The independent focused review and exact-SHA CI are intentionally still pending;
this report does not self-approve the behavior.

## Known boundaries

This is bounded Action evidence, not a general conversation or memory product.
It does not prove broad model reliability, autonomous world progression, human
enjoyment, multi-character simulation, or durable dialogue beyond the explicit
authorized same-path tail. Those remain future product/reality decisions.
