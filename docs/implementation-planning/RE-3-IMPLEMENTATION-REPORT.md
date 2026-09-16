# RE-3 Bounded Routine Effects — Implementation Report

**Latest:** initial implementation failed independent review (3B/3I/1M).
See [integration repair](RE-3-INTEGRATION-REPAIR-REPORT.md) and
[bounded policy ADR](RE-3-ROUTINE-POLICY-ADR.md). The original claims below are
historical local evidence, not current independent approval.

Status: implemented locally; independent Gate review pending. This is a bounded
follow-up on the frozen IP-6 authority spine, not IP-7 or a live-model switch.

Implemented:

- optional closed `ROUTINE_EFFECT` request envelope with `MOVE_CHARACTER` only;
- server validation of selected Character, exact before/after locations, causal
  shared context and declared route;
- deterministic server update of Character location/currentState while leaving
  facts and participation unchanged;
- exact confirmation remains required and uses the existing atomic Commit path;
- explicit `NO_WORLD_EFFECT` generation result is recoverable output with no
  proposal, head advance or world mutation;
- migration `0031_re3_routine_effects.sql` permits and validates L2 proposals.

Validation: typecheck, migration check, domain tests (including L2 and L0), and
migration-contract tests pass locally. PostgreSQL/e2e validation remains part of
the focused independent review; no live provider calls were made.
