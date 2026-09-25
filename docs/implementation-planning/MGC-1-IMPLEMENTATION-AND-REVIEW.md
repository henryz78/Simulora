# MGC-1 Implementation and Independent Review

**Status:** `MGC-1 PASS` — independent re-review `PASS` (0 Blocking / 0 Important /
1 Minor, accepted with no action) on 2026-09-25.

**Approved behavior SHA:** `f68addd` (full SHA in `git log`), exact-SHA CI
[run 36103979617](https://github.com/henryz78/Simulora/actions/runs/36103979617)
`success`. The MGC-1 feature commit itself is `30e9d85`, with exact-SHA CI
[run 36102392020](https://github.com/henryz78/Simulora/actions/runs/36102392020)
`success`.

**Contract:** [MUST-Gap Closure Contract (MGC-1)](MUST-GAP-CLOSURE-CONTRACT.md).
MGC-1 is a separate bounded track. IP-10 itself stays validation only.

## 1. What MGC-1 closes

MGC-1 adds the minimum behavior that three frozen MUST proofs need. It does not
relax those requirements.

| Gap | Frozen source | Mechanism |
|---|---|---|
| Causal relationship change | PR-005, `LONG-01` (NFR-006) | A World may give a relationship a closed `scale` of 2–7 labels, an `initialState` and a `protection` class. `SHIFT_RELATIONSHIP` moves it to another label on that scale. |
| Thread open/resolve lifecycle | `LONG-01` (NFR-006) | Optional authoritative `threads` state (`OPEN` / `RESOLVED`) with Events. `OPEN_THREAD` and `RESOLVE_THREAD` append to it; no history is rewritten. |
| Transformed failure | PR-005 | `TRANSFORM_FAILURE` cites one World-declared constraint and opens a new thread from the failed attempt. The model may propose it, and the user confirms it exactly. |

These points follow the product owner's decisions of 2026-09-24:

- **Authority is derived, never proposed.** The application validator and the
  database independently compute impact from the declared protection class and
  the scale distance. An adjacent step on a `ROUTINE` relationship is L2;
  anything else is L3. A model cannot choose authority or impact.
- **Every closure effect is an ordinary Action.** Each goes through Action,
  validation, exact confirmation and Commit. A technical or provider failure
  never becomes a transformed failure. A World without a declared constraint
  can never produce one.
- **Legacy Worlds are unchanged.** A World without the new declarations produces
  byte-identical state and evidence, with no `threads` key and no
  `effectContextDigest`.
- **Out of scope, and absent:** an arbitrary effect DSL, a general relationship
  engine, a quest system, long-term memory, an autonomous scheduler and broad
  simulation.

## 2. Implementation

| Area | Change |
|---|---|
| `packages/domain` | World declarations (`scale`, `initialState`, `protection`, `threads`, `constraints`), the four operations, `validateClosureOperation`, `compileEffectContext`, `restoreSectionsFor` |
| `packages/contracts` | Optional World and state fields; `RELATIONSHIP_EFFECT` and `THREAD_EFFECT` requested effects; `targetThreadId` |
| `packages/database` | Validation of submit and confirm, the `effectContextDigest` manifest entry, closure Events, and Restore section selection |
| `db/migrations/0048_mgc1_must_gap_closure.sql` | A successor migration. The database re-derives declaration validity, impact, the effect context digest, expected state, materialization Events and Restore sections in plpgsql. |
| `packages/model-gateway` | Deterministic adapter support; closed live-prompt skeletons; `livePromptVersion` 6 |
| `apps/web` | Composer choices, "Affects" and "Review level" in the proposal review, and Story threads and Relationships on the Continuity and Return surfaces |

## 3. Verification

| Evidence | Where | Result |
|---|---|---|
| Domain rules | `packages/domain/src/mgc.test.ts` (8) | Pass in CI |
| Live prompt skeletons | `packages/model-gateway/src/index.test.ts`, "offers only the closed MGC-1 skeleton…" | Pass in CI |
| Real PostgreSQL | `tests/integration/mgc1-closure.test.ts` (8): L2 step with manifest digest equal to the SQL digest; PROTECTED and jump are L3, and a forged L2 is refused; thread open/resolve with append-only history; transformed failure proposed, rejected, then confirmed; provider failure never transformed; SQL forgery list; Restore; legacy World unchanged | 8/8 in CI `36103979617` |
| Migration upgrade | `migration-upgrade.test.ts`, "keeps a pending proposal and an active Restore review valid across 0047 to 0048" | Pass in CI |
| Browser | `tests/e2e/mgc1-closure.spec.ts` on five browser and device projects | Pass in CI (195 browser tests total) |

Local runs used PGlite and are not counted as evidence.

## 4. Independent review

The reviewer was a Sonnet 5 subagent that did not write the code.

### Round 1 — `30e9d85`

The verdict was `PASS WITH ISSUES` (0 Blocking / 0 Important / 2 Minor). It
was conditional because CI `36102392020` was still running. The reviewer traced
impact parity, append-only threads, the transformed-failure boundary, Restore,
legacy compatibility and the generation evidence digest, and found no bypass.

- **Minor 1:** the live prompt skeletons for the new effects had no unit test.
- **Minor 2:** a relationship that declares `protection` without `scale` is
  accepted but inert.

### Repair

- **Minor 1** was repaired in `18320b4`.
- **Minor 2 is not changed.** A relationship without a scale cannot change at
  all, which is the most protective outcome, and Studio does not expose
  `protection`. Rejecting the declaration would need a new successor migration
  for no safety gain.
- `38672ee` repaired IP-10.2 findings in MGC-1 UI code (§5). It was
  re-reviewed with the rest.

### Round 2 — through `f68addd`

The verdict was **`PASS`** (0 Blocking / 0 Important / 1 Minor, accepted with no
action). The reviewer verified runs `36102392020`, `36103467010` and
`36103979617` itself, each on its exact SHA and each `success`.

- Minor 1 was found sufficient.
- The Minor 2 rationale was accepted.
- `38672ee` was found correct.
- The deterministic adapter needs no profile version bump. Material-change
  detection keys on the routing profile, not on adapter template text.

## 5. Findings from the real-stack journeys (IP-10.2, repaired in `38672ee`)

The first browser journeys through the real API, worker and PostgreSQL found
three defects that transport fixtures had hidden. The fixture IDs, such as
`character.iora`, happened to read as names.

1. The proposal named the responding Character and the affected target by a
   humanized raw UUID. Names now come from the loaded World; an identifier is
   never shown.
2. A long unbroken token broke 320 px reflow. Headings and Action status now
   wrap.
3. The deterministic adapter wrote "The observatory now bears…" into any World.
   It now writes "Changed by the Action: …".

## 6. What this does not claim

- No real model provider was called. Transformed-failure and relationship
  quality on a real model remain `EXTERNAL`.
- `LONG-01` has not run yet. MGC-1 makes its three unsupported pass conditions
  implementable; it does not meet them.
- MGC-1 is not a Gate. G10 is not evaluated here, and no beta or launch is
  authorized.
