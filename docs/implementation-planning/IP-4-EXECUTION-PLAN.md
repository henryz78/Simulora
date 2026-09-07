# IP-4 Execution Plan — Return, Continuity and Correction

Status: `IP-4 COMPLETE / GATE G4 PASSED`; IP-5 remains not started.

## Starting point and authority

- Approved engineering baseline: `7985471a9965ee8fea2f04354230d3fd9b5602aa` on `main`.
- The same independent Luna/max G3 Reviewer returned `PASS`, with zero BLOCKER, IMPORTANT or MINOR findings and `READY FOR IP-4: YES` after the lease repair.
- [Baseline CI](https://github.com/henryz78/Simulora/actions/runs/33647981503) verified 23 real PostgreSQL tests, the full 56-test quality check, built API/worker container smoke and 16 desktop/mobile browser tests.
- The user authorizes IP-4 with the main Agent responsible for planning, guidance, integration decisions and supervision; implementation work is delegated to GPT-5.6 Luna / max agents.

Controlling specifications: [Implementation Plan](IMPLEMENTATION_PLAN.md), [Roadmap IP-4 / G4](ROADMAP_AND_WORK_BREAKDOWN.md), [System Handoff](../system-design/SYSTEM_DESIGN_HANDOFF.md), [Validation Strategy](../system-design/VALIDATION_STRATEGY.md), [Experience Freeze](../deliverables/experience-structure/EXPERIENCE_FREEZE_HANDOFF.md). Frozen Product/System/Experience semantics take precedence over implementation convenience.

## Scope

Implement only IP-4.1–IP-4.9:

- committed Change Trace and permitted provenance;
- Return Orientation, meaningful-change/empty states, source-head freshness and authoritative fallback;
- general Continuity landing and contextual explanation;
- direct canonical correction/removal with exact review and confirmation;
- stable target identity, supersession/removal lifecycle and retained history;
- invalidation/rebuild of derived projections;
- account/character privacy boundary tests;
- coherent navigation, refresh and pending Action recovery across World, Return, Continuity and Context.

Do not start IP-5 Recovery, IP-6 participation/character behavior, IP-7 World Studio, live models, deployment, a new design direction or Prototype changes. No dependencies or infrastructure are added merely for future scale.

## Work ownership

| Role | Responsibilities | Write boundary |
|---|---|---|
| Main Agent | scope, contracts, decisions, evidence review, integration coordination, final Git/CI verification | planning/evidence documentation; release coordination |
| Luna/max backend implementer | schema, domain/application/repository, API/worker, privacy/projection/correction tests | `db/`, server/domain/contract packages, API/worker, backend tests |
| Luna/max frontend implementer | responsive routes, Return/Continuity/Lens/Context, review states, pending recovery, accessibility and browser tests | `apps/web/`, `packages/ui/`, `tests/e2e/` |
| Luna/max adversarial-test implementer | independent test construction for pagination, legacy provenance and private/removed targets; reports defects to implementation owners | only `tests/integration/ip4-adversarial.test.ts` and an explicitly necessary test-only helper |
| Independent Reviewer | review integrated baseline and actual CI without implementing its fix | read-only |

Shared contract changes must be communicated before the frontend adopts them. Agents do not commit/push independently, modify each other's files or run whole-repository formatting over concurrent work. Root scripts/CI changes are assigned explicitly after new suite paths are known.

The backend implementer is additionally assigned the minimal G4 test-script/CI wiring, migration verification scripts and phase metadata assertions. No dependency upgrade or deployment change is authorized by that assignment.

## Coordinated implementation decisions

- Reuse the specified orientation, Branch commits, explanation and corrections resource families; retain the existing Continuity-state URL while providing the Branch-state alias.
- Correction/removal targets the existing canonical fact representation in this vertical slice. A correction changes statement text within the existing scope; removal changes its current-use lifecycle. Neither is a grant/knowledge/scope editor. Unsupported target kinds must be rejected explicitly and documented, not accepted through free-form JSON. Broader canonical target editing remains a later completion item, not a claim made by G4 fact coverage.
- Client requests bind the stable target, before statement/scope, proposed after statement where applicable, reason and expected head. Trusted provenance is server-produced, not a client-editable field.
- Both commands reuse durable Action/status, exact proposal confirmation and the atomic Commit path. Correction review and an older unresolved participation Action have separate identities in shared client state.
- Freshness/source-head conventions are shared across projections. An older projection or pinned World starting situation must not be presented as newly current after a correction.
- Privacy checks cover both context construction and candidate validation. A generated candidate cannot target a private record merely because its ID exists in the full authoritative snapshot.
- The current deterministic adapter requires an eligible active fact. If none exists (including after last-fact removal), reject a new submission explicitly before acknowledgement/job creation; do not fabricate canon or spin an unresolved job. Treat this as a named adapter capability limit, not a new general product rule. An already acknowledged job must instead reach an explicit recoverable outcome if it cannot be processed.
- Return's bounded recent-change list is not a cross-device last-seen tracker. UI wording must not claim unseen/away-time changes without evidence; source freshness and user awareness are different concepts.

## Engineering checkpoints

1. **Contract alignment:** agree response/request schemas, provenance/freshness, correction/removal scope and navigation ownership against the frozen specifications. Do not invent a second client truth model.
2. **Parallel implementation:** backend and frontend use those shared contracts; migrations are additive and prior immutable documents remain readable. Each implementer supplies focused tests.
3. **Cross-surface integration:** use real server IDs/head and the existing durable Action lifecycle. A correction can advance the head while an older participation Action remains pending; that Action stays visible and cannot commit against the stale head.
4. **Verification:** run local quality/build/runtime checks and desktop/390×844 browser journeys. Real PostgreSQL migration, concurrency, privacy and API integration must run in CI, not be inferred from local skips or HTTP fixtures.
5. **Independent review:** review the exact integrated commit, full CI logs and remaining limitations. Do not self-approve G4 or begin IP-5.

## Binding implementation guardrails

- Current truth is always Branch head → Commit → immutable State Revision. Return/explanation are projections, never new authority.
- A correction/removal request is explicitly direct-user L3. It binds actor, target, before/after effect, scope, reason, digest and expected head; generation cannot manufacture that authority.
- Cancellation, stale confirmation and retry do not erase or silently commit user intent. Duplicate submissions/confirmations remain effective-once.
- Superseded/removed content remains historical provenance, not an active fact or a source of future canonical reassertion. Existing World Revisions remain pinned and unchanged.
- Scope filtering precedes projection assembly and model-context use. Raw prompts, hidden context, provider reasoning and inaccessible source identities/counts must not leak through explanations or summaries.
- A global Continuity entry lands on a category/current-path view, not one hard-coded fact. Both form factors follow the same semantic route model.
- Pending Action status is recovered from the server across route changes and refresh; local component/storage state is not acknowledgement or truth.
- Old G3 leasing, idempotency, confirmation, atomicity, SSE/polling and repeated-participation tests remain mandatory regressions.

## Gate G4 verification map

| Gate concern | Required evidence |
|---|---|
| Return usefulness and honest empty state | current situation, meaningful committed changes, open thread/relationship context and continuation point; no fabricated change |
| Projection staleness (`INV-11`) | deliberately delayed/rebuilt projection discloses source head; latest authoritative state stays readable; old projection cannot overwrite newer data |
| Scoped explanation (`INV-07/13`) | API/repository adversarial tests across accounts and character visibility; forbidden content/identity absent, not merely hidden by UI |
| Direct correction/removal (`INV-08`) | real PostgreSQL submission/review/confirmation; old snapshots/history retained; current target superseded/removed once |
| Authority/concurrency | wrong actor/digest/head, duplicate requests, cancellation/confirmation race and stale pending participation produce no unauthorized mutation |
| Future context | next generation receives corrected active canon; removed/superseded facts are not revived from old summaries/history |
| Navigation and pending lifecycle | World → Return → Continuity → Lens/Context → World; pending status and explicit outcome retained through Back/refresh |
| Desktop/mobile/accessibility | same global-to-contextual model, 390×844 pointer paths, keyboard/focus/Escape, axe and explicit limits of assistive-technology evidence |
| Engineering/regression | format/lint/typecheck/architecture/migrations/unit/build/runtime, actual PostgreSQL, container smoke, G2/G3 and G4 browser suites |

Final evidence belongs in `IP-4-G4-EVIDENCE.md` and `IP-4-G4-TEST-MATRIX.md`. Historical audits, approved Prototype behavior and upstream freezes remain unchanged. Any unsupported canonical target or unverified platform boundary must be named, not hidden behind a blanket PASS.

## Completion update

Gate G4 passed on `75bda8ff37f4238fdc727fc9a325500dc8f26df5` after the independent review and CI evidence recorded in [IP-4 G4 Evidence](IP-4-G4-EVIDENCE.md). This completes only IP-4. It does not start or authorize IP-5 Recovery, IP-6 participation/character authority, IP-7 World Studio, IP-8 trust/lifecycle work, a live model provider, deployment, or any change to the frozen Prototype.
