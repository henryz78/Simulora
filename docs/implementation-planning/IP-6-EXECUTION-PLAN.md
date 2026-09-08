# IP-6 Participation and Character Authority — Execution Plan

Status: `IMPLEMENTATION COMPLETE / GATE G6 REVIEW CANDIDATE`

Starting integration baseline: `4cd5106528fef80fadbbb825b064439106400538`

Production candidate: `4e682f7732e514b74062c32f512f9f2ed1522e29`

## Scope

IP-6 translates the frozen agency contract into the existing PostgreSQL-authoritative runtime. It does not introduce a second truth model, live model provider, autonomous scheduler, IP-7 World Studio or IP-8 governance/lifecycle work.

## Implementation slices

1. Add a direct `CHANGE_PARTICIPATION_CONTRACT` command with complete before/after contracts, idempotency and expected-head binding.
2. Commit a valid change through the existing Action → Commit → State Revision → Domain Event → Branch-head transaction.
3. Expose a responsive before/after review with separate initiative and structure controls and an explicit stale-review result.
4. Preserve the six independent contract combinations; ordinary Actions remain match-only and model candidates cannot mutate either axis.
5. Add Character Asset storage and immutable World Revision Character Spec snapshots while keeping runtime Character state separate.
6. Compile character identity, motives, stance, relationship context and allowed knowledge before generation; exclude unauthorized sources before relevance or provider work.
7. Keep Direct, Guided and World-active behavior bounded to user-triggered Action cycles; no off-session mutation exists.
8. Prove disagreement/refusal can be character-attributed without authoring the user avatar or a protected commitment.

## Authority and persistence contract

- The Branch head State Revision remains the only participation authority.
- A client selection is local review state until the direct command commits.
- A stale head or mismatched before-contract writes no Action, Commit or State Revision.
- A successful command changes only `state.participation` and emits `PARTICIPATION_CONTRACT_CHANGED` with complete before/after values.
- Character Assets are authored sources. A World Revision stores an immutable self-contained Character Spec snapshot. Runtime state is initialized from that snapshot and no longer depends on source-asset availability.
- Character knowledge filtering occurs before any ranking/generation. `ACCOUNT_PRIVATE` facts never enter character context.

## Explicit exclusions

- live provider/model selection;
- unattended or scheduled World-active mutation;
- combined participation mode enum;
- automatic participation change from prompts, proposals, Restore, Correction or Revision;
- IP-7 World Studio production implementation;
- IP-8 consent, sharing, usage, deletion and portability implementation.

## Gate G6 evidence plan

Gate evidence must include schema/migration rehearsal, real PostgreSQL authorization/concurrency/invariant tests, deterministic orchestration tests, full G1–G5 regression, production builds and desktop plus 390×844 E2E. The implementation agent does not approve G6.
