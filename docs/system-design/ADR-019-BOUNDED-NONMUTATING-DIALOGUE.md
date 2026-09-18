# ADR-019: Bounded Non-Mutating Dialogue

Status: Accepted for the bounded Product Reality implementation

## Decision

`NO_WORLD_EFFECT` may complete as `COMPLETED_NO_EFFECT` when the generated response is
valid, attributed to the compiled World or Character source, and passes the existing
authority and context guards.

The result is an immutable dialogue record attached to the Action. It records the
Action id, source head and state revision, response attribution, provenance, and
continuity-private visibility. It is not a canonical fact, State Revision, World
Commit, world-clock advance, Character knowledge update, relationship/resource/permission
change, or derived memory.

Later generation may receive these records only through an explicit same-Branch,
same-account authorized-context query. The query stops at Restore and correction/removal
boundaries and never crosses a private or removed fact boundary. The record is therefore
an auditable Action result, not a second World truth ledger.

Exact confirmation remains required for L2/L3 effects. Correction, Removal, Branch,
Restore, and participation authority retain their existing contracts. Durable dialogue,
long-term memory, autonomous Character memory, and broader conversation semantics require
a successor product/system decision rather than being inferred from this ADR.

## Consequences

- A normal Character answer can finish honestly without manufacturing a World mutation.
- World head, State Revision, clock, and canonical history remain unchanged.
- Existing Return/Recovery projections continue to derive truth from the authoritative
  World path; dialogue is shown only as Action-bound response evidence.
- The bounded record can be filtered after correction, removal, or restore without
  rewriting prior Action evidence.
