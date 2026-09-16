# RE-3 Integration Repair

Status: repair CLOSED after [same independent Reviewer PASS](RE-3-INDEPENDENT-REVIEW.md).
Behavior `f435d5b35dcf53c4493a78e84ea0b611872e832b`; 0/0/0 and exact-SHA CI
`35041266321` PASS. Below preserves the preceding repair/self-test evidence,
not a claim of live reality validation or IP-7 authorization.

## Failure evidence and root causes

Same Reviewer reviewed behavior `9cbb6513114672901fe13488f4decbfd9f47925b`:
**RE-3 FAIL — 3 BLOCKER / 3 IMPORTANT / 1 MINOR**. This is a summarized
transcription, not a fabricated verbatim original report; the original agent
result and historical implementation commits remain retained.

| Finding | Repair |
| --- | --- |
| B1 routes missing from worker dispatch | Load explicit administrative policy; forward routes to the adapter. |
| B2 movement had no SQL expected-state materialization | Narrow MOVE wrapper around the unchanged legacy state function; update only location/currentState/turn/openThreads. |
| B3 L2 skipped full proposal/evidence authority checks | Bind exact candidate shape, request/selected Character, actor-derived digest, head, display, policy, sealed attempt/output, source and existing privacy/agency guards; fail closed on missing causal IDs. |
| I1 proposal read returned hard-coded L3 | Read stored server-computed impact. |
| I2 generic event omitted movement causality | CHARACTER_MOVED event binds Character, before/after locations and causal fact IDs; exact materialization checks it; Return/Trace summarize that event. |
| I3 no explicit NPC/public route policy | Immutable administrative policy pinned to World Revision; no authored-route permission or avatar-name inference. See companion ADR. |
| M1 invalid route references | Matching World schema/SQL location-reference checks. |

Real chain tests also exposed an inherited RE-2 insert trigger rejecting all new
requested-effect payloads. The successor accepts only closed keys/effect values,
keeps target-knowledge checks and requires explicit Character selection for MOVE.
No permission/participation fields are admitted.

## Migration and compatibility

Historical 0031 is unchanged. Successor 0032 repairs its functions and adds the
bounded policy. Existing L3, direct Correction/Removal and participation use the
legacy validated ledger, not a parallel truth model. Old request digests still
omit default FACT_REWRITE (prior repair `9cbb651`); old-schema worker execution
checks policy-table availability. The populated prior-schema rehearsal now creates
UTF-8 explicitly rather than inheriting this machine's SQL_ASCII template.

## Self-test evidence

- Real PostgreSQL 17: authoritative subset **124 tests**, included in the final
  whole workspace **182/182 PASS, zero skip**. New RE-3 suite covers movement proposal /
  exact confirmation / actor and digest mismatch / duplicate submit and worker /
  duplicate confirm / typed event / current state / Return / fork / append Restore /
  stale Correction / cancel race / malformed and forged SQL proposals /
  no-policy denial / honest L0 / invalid and immutable policy.
- Populated 0025 → current upgrade PASS; populated 0031 → 0032 preserves the
  sealed L3 proposal byte-for-byte and confirms it after migration. Clean-schema
  32 migrations PASS.
- Desktop and real-pointer 390×844: **56/56 PASS**, including new movement
  provisional → refresh → exact confirmation → current Character state, with
  facts unchanged. These browser tests mock API transport; PG tests independently
  exercise the real repository/transaction. This is not a live browser-play claim.
- Format, typecheck, architecture, unit/contract tests, production build,
  worker runtime startup/shutdown and diff check verified before commit.
- Local default ESLint formatter has a chalk interop error when reporting issues;
  the same ESLint engine was run using filtered JSON output. No lint rules or
  dependencies were weakened to hide this environment problem.

No local Docker/remote CI PASS is inferred from build success. The pushed SHA
must pass exact-SHA CI; the same Reviewer checks that evidence independently.

One repeated run on the reused local database was 181 PASS / 1 FAIL: the existing
IP-4 worker-discovery test's fixed 50-job loop exhausted accumulated projection
backlog before reaching its fixture. It was not suppressed or counted as PASS.
The final whole-suite evidence above uses a fresh UTF-8 database, where that
test and all 182 tests pass. Migration checks also caught a non-immutable digest
generated-column expression during development; the final insert trigger computes
and seals that digest instead. These development failures are not approval evidence.

## Boundaries / next

Production seed, frozen Prototype and Product/System/Experience contracts unchanged.
Production adapter remains deterministic; no secret changes, new live calls,
IP-7, scheduler or World Studio implementation. Existing English/Unicode privacy
guards are bounded lexical safeguards, not universal semantic safety.
The next step is the same Reviewer's focused closure of the above findings,
plus nearby regression—not a new whole-repo audit. Only after closure should
isolated live/human play compare causal movement, no-effect advice and confirmation
burden. A two-location NPC move is not a completed long-lived AI World.
