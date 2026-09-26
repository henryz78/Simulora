# SA-2 Studio Movement Grant and Knowledge Guidance: Implementation Report

**Date:** 2026-09-25 · **Contract:**
[SA-2 contract](SA-2-STUDIO-MOVEMENT-AND-KNOWLEDGE-CONTRACT.md) ·
**Decision:** [ADR-SA2](SA-2-CREATOR-ROUTINE-GRANT-ADR.md) ·
**Behavior SHA:** `9e06d52ce030420a551281a73c376fc8d3e9ddea` ·
**Evidence:** exact-SHA CI `36220835359` `success` ·
**Review:** new independent Reviewer `PASS` (0B/0I/4M). **SA-2 CLOSED** (§6).

## 1. Commits

| Commit | Kind | What |
|---|---|---|
| `3531252` | docs | SA-2 contract and ADR-SA2 |
| `9e06d52` | behavior | Creator movement grant (schema, successor 0050, state response, Studio, Composer), knowledge warning and message, tests |

## 2. What changed

### 2.1 Movement grant

- **Domain and contracts:** optional `routineMovers` and
  `routineRoutes[].permitsRoutineMovement`. Movers must be distinct World
  Characters, and movers exist exactly when at least one route is open.
- **Successor migration `0050_sa2_creator_routine_grant.sql`:**
  - The SQL document validator is wrapped (`valid_world_revision_document_pre_sa2`).
    The new one checks the flag is boolean and the movers rule, then strips
    both fields and calls the earlier validator, so earlier rules are unchanged.
  - An AFTER INSERT trigger on `world_revisions` inserts the derived
    `re3_routine_policies` row only when the Revision declares movers. The
    existing RE-3 shape trigger validates it and computes the digest; the
    existing immutability applies.
- **Unchanged:** worker policy load, NPC and route allow-lists, digest
  evidence, SQL proposal binding, `MOVE_CHARACTER` materialization and exact
  confirmation. Administrative policies still work for Revisions without movers.
- **State response:** optional `routineMoverIds` (the policy's `npcIds`, or
  `[]`). Absent in older responses, where the Composer behaves as before.
- **Composer:** "Have this character move" is disabled unless the selected
  Character is a mover, with a submit guard.
- **Studio:** "Who may move" (one checkbox per Character), and per route
  "Characters above may use this route on their own". A mismatch disables save
  with an inline message. Removing a Character removes it from the movers.

### 2.2 Knowledge guidance

- **Playability check:** one `WARNING` per Character for which
  `compileActionGenerationContext` fails on the initial state, the same rule
  play uses. It names the first shared fact the Character would need, and it
  never blocks.
- **Composer:** a `WORLD_NOT_PLAYABLE` refusal of an addressed Action now
  says the Character does not know anything the Action can be about yet, and
  points to World Studio.
- The RE-2 knowledge rule is unchanged.

## 3. Evidence (CI `36220835359` on `9e06d52`)

- **Migrations:** 0050 applies to an empty and a prior schema, is idempotent,
  and applies in the upgrade-and-rollback rehearsal.
- **Real PostgreSQL:** `test:postgres` 175/175 (171 + 4 SA-2); IP-5 suite
  304/304 (includes the 4 PG cases and 5 domain cases). The PG cases:
  - the application and SQL agree on granted, no-grant, unknown mover,
    duplicate mover, movers without an open route, an open route without
    movers, and a non-boolean flag;
  - a Revision with movers gets exactly the derived policy (digest present,
    delete refused) and `routineMoverIds`; one without movers gets none and `[]`;
  - Tavi moves along the open route and is confirmed; Iora is refused (no
    proposal); Tavi's move back along the closed route becomes a
    `TRANSFORM_FAILURE` citing `constraint.flood`;
  - an uninformed Character gets exactly one knowledge warning; informed ones
    get none.
- **Real stack:** 10/10 (5 per project, desktop and 390×844), including "a
  Studio World moves a named Character along an opened route, and its rule
  meets the closed way back": a World authored only in Studio, the knowledge
  warning in Studio, movement disabled for a non-mover, the guide's move
  confirmed (checked through the API), and the second move meeting the rule.
- **Browser matrix:** 210 passed, no retries, across five projects. The two
  SA-2 cases (Studio controls, guards, keyboard, cleanup, axe and 320 px;
  Composer mover gating and the knowledge message) pass on every project.

## 4. Notes for review

- The grant applies to any Revision whose document declares movers, whether
  authored in Studio or through the API. In both cases the World owner creates
  the Revision.
- The trigger runs as the role that inserts the Revision. The schema has no
  per-role grants on `re3_routine_policies`, and the real stack exercises the
  path.
- Not changed: m1 from SA-1 (the save-blocking live region renders only while
  a problem exists). SA-2's new guard messages share that region.

## 5. Not claimed

- No model provider was called.
- Human play (track B), beta, launch and production live model use remain
  unstarted and unauthorized.

## 6. Independent Review: `PASS`

A new independent Reviewer returned `PASS`: 0 BLOCKER, 0 IMPORTANT, 4 MINOR.
SA-2 closes, and the approved behavior SHA is
`9e06d52ce030420a551281a73c376fc8d3e9ddea`.

**Commit verdicts:** `3531252` PASS, `9e06d52` PASS (no frozen constraint
weakened), `ac44912` PASS (report accurate).

**Verified in code by the Reviewer:**

- Only the owner-scoped `createRevision` writes `world_revisions`, and the
  Revision document must equal the validated Draft. No import, remix, restore,
  branch or correction path creates a policy row. An administrative insert for
  a Revision that already has a derived policy is refused by the primary key.
- `userRole` has no id, so it cannot be a mover.
- 0050 edits no earlier migration. The domain and SQL agree on every traced
  edge case, and a valid document always yields a row that passes the RE-3
  shape trigger, so Studio cannot save a Draft that later fails at Revision.
- Enforcement still comes only from the policy row.

**Verified CI by the Reviewer:** run `36220835359` on `9e06d52`, `success`,
real `postgres:17`: 0050 applied, idempotent and rehearsed; `test:postgres`
175/175; IP-5 304/304; stack 10/10; browser matrix 210 with no flaky, skipped
or retried test.

**Minors, accepted as follow-ups (not changed, so the approved SHA stays):**

| # | Finding | Follow-up |
|---|---|---|
| M1 | The knowledge message is chosen from `WORLD_NOT_PLAYABLE` plus a selected Character, but every validation error uses that code. A thread closing just before submit would show the knowledge message. | Give the RE-2 refusal its own code or match its message. |
| M2 | Start-continuity and branch-state responses never fill `routineMoverIds`. No current consumer is affected; a future one would not gate movement. | Fill the field there, or document that only the state endpoint carries it. |
| M3 | Routes are one-way, but the route checkbox does not say so. | Say "one way, From → To" in the label or help text. |
| M4 | The domain comment still calls the policy "not creator-authored permission", and ADR-RE3 had no supersession pointer. | ADR-RE3 pointer added in this documentation commit; the code comment waits for the next behavior change. |

**Test gaps noted, not claimed:** UPDATE immutability of the derived row is
covered by the existing trigger but not probed separately; stale movers after a
place is removed are caught by the save guard but not tested.

