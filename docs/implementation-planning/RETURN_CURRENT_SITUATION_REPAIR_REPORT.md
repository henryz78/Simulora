# Return Current Situation — RE-1 Repair

**State:** `IMPLEMENTED / LOCAL VALIDATION PASS / INDEPENDENT REVIEW PENDING`.

## Evidence and cause

R1 in the [Product Reality Spike Report](PRODUCT_REALITY_SPIKE_REPORT.md) is an
IMPORTANT display issue: corrected green truth followed by a recorded Action
still produced a FRESH Return lead saying the initial signal had dimmed.
The original report/journal remain unchanged.

Both `orientationPayload` in `packages/database/src/index.ts` and `currentSituation`
in `apps/web/src/pages.tsx` read `openThreads[0]`. Initial state seeds this array
with the starting situation; ordinary Actions append narrative, while Correction
correctly preserves history. A latest-event Correction/Removal exception hid the
problem only until a later Commit. The same cause affected World, Continuity and
the client's authoritative Return fallback.

## Chosen contract and repair

- Use the first ACTIVE SHARED fact of the **bound source-head** state as the
  current lead. Without one, use that state's world-clock label, not old threads.
- Keep source-head/current-head freshness intact. An old cached projection may
  still show old facts as explicitly STALE; rebuilding reads the current state.
- Remove the latest-event special case. Restore legitimately showing the restored
  earlier fact follows from the newly appended head, not a search through history.
- Never promote private or removed facts into the shared lead. Frontend reuses
  its existing fact parsers and legacy lifecycle read compatibility.
- Keep starting background, threads, historical State Revisions, Events, Commit
  history and exact confirmation intact. No migration or model call is needed.

This is one current factual lead, not a complete living-world scene summary. The
historical/current string-thread limitation remains explicit; broader context and
effect work is only [proposed](BOUNDED_RUNTIME_ENABLEMENT_PLAN.md).

## Regression and limits

Three new real PostgreSQL cases cover Correction then 11 separately confirmed
Actions (outside the ten-Commit Return trace), pending output/head immutability,
source-bound stale reads, FRESH rebuild/read, Removal of the last fact, private
fact exclusion and append-only Restore back to an earlier fact. The old code was
observed failing the new source-bound assertion before the repair; a malformed
private fixture was corrected separately, not counted as a production defect.

One new Playwright journey runs in both desktop and touch-enabled 390×844
projects: World → Continuity → Return fallback → World. Its fixture deliberately
has an earlier dim thread, a private first fact, a removed fact and current green
truth. It checks that starting background remains separate from the current lead.
Browser fixtures test rendering/navigation, not real database authority; the
separate real PostgreSQL suite supplies that evidence.

No live request,
provider switch, production deployment, IP-7 or frozen Prototype change occurs.
Historical G1–G6 approval remains at `eb55734`; this repair needs its own review
and does not self-approve a replacement behavior baseline.

### Completed local verification

- `pnpm format:check`, lint, typecheck, architecture and 28-migration check: PASS.
- Default tests: **55 PASS / 113 PostgreSQL-dependent cases skipped**. This is not
  the PostgreSQL evidence; the explicit database run below is separate.
- `pnpm test:postgres`: **114/114 PASS, 0 skip, nine suites**, on real local
  PostgreSQL 17.11 in a new disposable `simulora_return_r1_20260915` database.
  Includes G2–G6 authority, stale/concurrency/lease, correction, Recovery,
  Participation/Character and prior-schema upgrade regressions.
- `pnpm build`: PASS for full workspace, web and API/worker artifacts. The first
  `pnpm check` stopped at build because Windows sandbox denied esbuild ancestor
  directory reads; the same build passed outside the sandbox with approval.
  This was an environment restriction, not a hidden all-in-one check PASS.
- `pnpm runtime:check`: worker bundle startup/shutdown PASS.
- `playwright test tests/e2e/ip4-continuity.spec.ts`: **16/16 PASS**, eight journeys
  each in desktop Chromium and touch-enabled 390×844. Real pointer interactions;
  includes exact Correction, lost confirmation outcome, freshness, pending Action
  coexistence and SSE/polling stability. The separate first two-case focused run
  also passed; its lingering helper was interrupted after the completed rerun.
- Read-only check against the **original retained live Spike database**: FRESH
  Return lead equals the current ACTIVE SHARED green fact. No new provider call,
  Commit, projection rebuild or journal write; original raw evidence is preserved.
- `git diff --check`: PASS.

No fresh container smoke or full non-G4 browser matrix was run for this small
projection-only change. New-commit GitHub CI is not claimed PASS or polled here.
Focused independent G4/R1 review is recommended; the larger proposed RE-2–RE-3
envelope would require the stronger regression matrix in its plan.
