# IP-6 / Gate G6 Evidence — Participation and Character Authority

Historical slice evidence: earlier review-candidate states below are retained,
not current Gate decisions. G1–G6 are PASS on `eb55734`; see
[Final Independent / Integrated Review](G1-G6-FINAL-INTEGRATED-REVIEW.md) and
[Current Implementation Handoff](IMPLEMENTATION_STATUS_HANDOFF.md).

Status: `IP-6 IMPLEMENTATION COMPLETE / GATE G6 REVIEW CANDIDATE / INDEPENDENT REVIEW REQUIRED`.

Production implementation baseline: `4e682f7732e514b74062c32f512f9f2ed1522e29`.

The initial integrated candidate `2a15424f5f94d713b36e5d1d54a96d64466a67f0` reached real PostgreSQL CI and exposed three compatibility/test-construction defects: an IP-4 fixture retained a Character knowledge reference after replacing its fact set, a replacement trigger changed the established G4 correction error contract, and a new adversarial test used an invalid Commit shape before reaching the intended invariant. `4e682f7` repairs those exact causes without weakening the new authority constraints.

IP-6 was integrated on top of the Gate G5 repair baseline `4cd5106528fef80fadbbb825b064439106400538`. The user explicitly authorized this work to proceed while the independent G5 re-review runs against an isolated detached worktree. This document does not approve G5 or G6 and does not authorize IP-7.

## Implemented contract

- The two Participation Contract axes remain independent: Direct / Guided / World-active and Open-ended / Goal-framed form six combinations without a combined mode enum.
- A contract change is a direct, authenticated user command bound to the exact current Branch head and complete before/after contract. It creates one Action, proposal, exact confirmation, Commit, immutable State Revision and `PARTICIPATION_CONTRACT_CHANGED` Event in one transaction.
- Stale head, mismatched before-state, cross-account access and idempotency-key payload reuse write no Action or World mutation.
- PostgreSQL rejects any non-direct Commit that changes participation and rejects a direct participation Commit that changes anything else.
- Ordinary Action candidates cannot carry participation, avatar-authorship or protected-authority fields. World-active remains bounded to a user-triggered Action cycle; no scheduler or off-session mutation was added.
- Character Asset, immutable World Revision Character Spec snapshot and runtime Character state are separate representations.
- PostgreSQL verifies Character Asset content hashes and requires an active, same-owner, exactly matching source Asset when a new snapshot is created. Existing immutable snapshots remain playable after source deletion.
- Character context is compiled from identity, motives, stance, current state, relationships and an allow-listed fact set. `ACCOUNT_PRIVATE` facts are excluded before ranking or generator invocation.
- Deterministic character responses preserve attribution, disagreement and refusal without speaking or committing for the user.
- The responsive Participation review surface exposes before/after values, exact apply, stale-review recovery and authority boundaries on desktop and 390×844 mobile.

## Persistence and implementation map

| Layer | IP-6 addition |
|---|---|
| PostgreSQL | `0012_ip6_participation_character_authority.sql`: direct-operation support, character source/snapshot tables and database authority constraints |
| Domain | Six contract combinations, direct participation transition, Character Asset/Spec/runtime schemas and source-first context compiler |
| Model gateway | Deterministic, user-cycle-bound character request/response seam; no live provider |
| Contracts/application | Typed direct contract command and service boundary |
| API | Authenticated `POST /v1/branches/:branchId/participation-contract` |
| Web | Exact two-axis review and stale-current-path recovery |
| Tests | Domain, API, real-PostgreSQL candidate tests and desktop/mobile journeys |

The Branch-head Commit and immutable State Revision remain the only participation authority. Client selections, generated output and derived projections are not truth.

## Local verification on repaired baseline

- `pnpm check`: PASS — formatting, lint, TypeScript, architecture boundary, twelve-migration replay, local tests, all production builds and worker runtime smoke.
- Local Vitest: `48/48` passed. The `55` tests requiring `SIMULORA_DATABASE_URL` were explicitly skipped and are not claimed as PostgreSQL evidence.
- `pnpm test:e2e`: `44/44` passed across desktop Chromium and 390×844 mobile, including all G1–G5 regression journeys and the IP-6 exact/stale participation reviews.
- `git diff --check`: PASS before commit.
- Initial CI [run 34198119271](https://github.com/henryz78/Simulora/actions/runs/34198119271) failed in the real PostgreSQL step and is retained as evidence of the repair chain.
- Exact repaired-baseline CI [run 34198810966](https://github.com/henryz78/Simulora/actions/runs/34198810966) completed successfully on `4e682f7732e514b74062c32f512f9f2ed1522e29`:
  - empty and prior PostgreSQL schema migration plus ledger/recovery rehearsal: PASS with twelve migrations;
  - real PostgreSQL suites: `55/55` passed in seven files, with no database test skipped;
  - full `pnpm check`: `103/103` passed in twenty-one files, including Linux lint/typecheck/architecture/migrations, production builds and built-worker runtime smoke;
  - API and worker production container build, API health and worker-ready smoke: PASS;
  - desktop Chromium plus 390×844 Playwright: `44/44` passed.
- CI is evidence, not Gate G6 approval. An independent Reviewer must still inspect the implementation and tests rather than infer the decision from a green run.

## Gate G6 evidence mapping

| Requirement | Candidate evidence |
|---|---|
| Six independent combinations | Domain round-trip plus PostgreSQL transition loop; no combined enum exists |
| Direct authority only | Authenticated API, owner-scoped repository transaction, typed Event and database non-direct mutation rejection |
| Exact state change | Deferred database trigger compares parent/current State Revision and permits only the exact two-axis replacement |
| Idempotency and concurrency | Same-key retry returns one Action; Branch lock and expected-head check allow at most one competing Commit |
| Stale expectation | Ordinary and direct mismatch tests assert no new Action, generation attempt or World mutation |
| Model authority boundary | Strict candidate schema/validator and deterministic-gateway tests reject protected fields and avatar takeover |
| Character source boundary | Asset hash/owner/status/snapshot constraints plus deletion-survival integration journey |
| Knowledge boundary | Source-first allow-list test captures generator input and persisted context manifest without account-private facts |
| Character differentiation | Two-character domain test and gateway disagreement/refusal assertions |
| Initiative semantics | Deterministic tests cover Direct, Guided and user-cycle-bound World-active; no autonomous worker/scheduler path |
| Structure semantics | Open-ended starts without fabricated objectives; Goal-framed uses only declared World objectives |
| Responsive UX | Exact and stale-review Playwright paths pass on both configured viewports |
| Regression and scope | Full local check/E2E passed; CI and independent review remain mandatory |

## Explicit exclusions

Not implemented or claimed: live model/provider selection, unattended World-active execution, a combined participation mode, IP-7 World Studio production behavior, IP-8 lifecycle/governance work, formal deployment or release readiness.

```text
IP-6 IMPLEMENTATION: COMPLETE
GATE G6: PENDING INDEPENDENT REVIEW
G6 PRODUCTION CANDIDATE: 4e682f7732e514b74062c32f512f9f2ed1522e29
LOCAL CHECK: PASS
LOCAL DESKTOP + 390x844 E2E: 44/44 PASS
GITHUB CI 34198810966: PASS
REAL POSTGRESQL: 55/55 PASS
FULL SUITE: 103/103 PASS
DESKTOP + 390x844 CI: 44/44 PASS
CONTAINER SMOKE: PASS
IP-7: NOT STARTED
```
