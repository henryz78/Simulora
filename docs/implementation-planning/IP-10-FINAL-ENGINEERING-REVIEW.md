# IP-10 Final Engineering Review

**Date:** 2026-09-25 · **Reviewer:** a new independent Reviewer, not the
implementer · **Reviewed head:** `73294e8` (behavior through `b3c914d`) ·
**Verdict:** `PASS` — 0 BLOCKER / 0 IMPORTANT / 1 MINOR (inherited, already
accepted).

The implementer records this result; the implementer did not approve its own
work. The Reviewer modified, committed and deleted no file.

## 1. Scope

- IP-10.1–IP-10.8 engineering work.
- The bounded repairs: successor migration `0049` (`28b0d8a`) and the
  presentation repair `1629a2c`.
- The test-only commits `80491d1`, `e55179a`, `7964e7c` and `b3c914d`.

## 2. Findings

| Class | Count | Finding |
|---|---|---|
| BLOCKER | 0 | — |
| IMPORTANT | 0 | — |
| MINOR | 1 | Inherited from `28b0d8a` and already accepted: a raw exception from `simulora.prevent_pending_active_branch_switch()` maps to 500, not 409. `selectBranch` locks the Continuity before its own 409 check, so the normal API path does not reach it. No action required. |

Two disclosed observations, not new defects and not owed by IP-10:

- The RE-3 `CHARACTER_MOVED` Change Trace summary still lists raw
  identifiers (approved RE-3 behavior outside `1629a2c`).
- Compatibility row C11 (a stale G9 tab on an MGC-1 World) stays
  `ANALYSED — PARTIAL` and is a deploy-strategy decision.

## 3. Repair `1629a2c`: `PASS`

The Reviewer read the diff directly:

- Presentation only. No contract shape, table, migration or authority rule
  changes.
- `safeCommitReason` still returns only the opaque token on the API.
- The web shows the account's own Action intent from already-fetched history.
  When no Action matches, it shows nothing rather than the token.
- Continuity uses the existing `GET /v1/branches/:id/commits`; no new route.
- The stack scenario asserts that no UUID appears in the rendered Trace, and
  checks the API `targetId` and `summary` values.

## 4. G10 conditions satisfied by engineering evidence

- **MUST PR/NFR evidence** for what the product implements (matrix §2).
- **Invariants** INV-01–INV-13 (matrix §4).
- **`LONG-01`:** 20 sessions / 30 days, with the full schedule logged.
- **Branch-switch repair `28b0d8a`:** `0049` matches `0028` except for
  `COMPLETED_NO_EFFECT`.
- **Security and privacy (automated):** the SEC-ACCESS sweep of 43 routes.
- **Accessibility (automated):** 195 browser-matrix tests.
- **Compatibility and rollback:** C1–C5, C8, C9, C12 and C13 (layout).
- **Capacity and fault tolerance:** the killed-worker drill.
- **Operations readiness:** documents only; 17 alerts on existing signals.

## 5. Still `EXTERNAL` (not PASS)

- Cloud vendor and region.
- OIDC/session and adult-eligibility provider and policy.
- Approved real model provider, retention/training terms, and model-quality
  judgment.
- Safety taxonomy, appeal path and operator policy.
- Pricing and allowance.
- Retention, deletion purge (including PostgreSQL retention purge), DR SLO
  and rollback window.
- Brand and asset provenance.
- Specialist security, privacy and legal review.
- Human screen-reader review.
- Named operations owners, on-call rotation, tested escalation, and the
  monitoring stack.

## 6. Determination

**G10 can enter conditional closure.** Engineering is complete; no
engineering gap blocks it. Everything in §5 is a business, vendor, legal or
staffing decision, recorded as `EXTERNAL`.

## 7. CI verified by the Reviewer

| Run | Commit | What the Reviewer confirmed |
|---|---|---|
| `36207364368` | `b3c914d` | Read the logs itself:<br>- real PG 171/171 and 294/294;<br>- stack 6/6 on desktop and 390×844, including E2E-CONTINUITY-IMPACT;<br>- drill p95 466.9 ms, 0 undrained, 0 errors, 0 lease-expiry closures;<br>- rehearsal passed with empty ledger diffs;<br>- browser matrix 195;<br>- LONG-01 with 20 sessions and 30 days. |
| `36198101564` | `7964e7c` | `success` |
| `36197080077` | `28b0d8a` | `failure`, as the docs state: 170/171, the harness issue fixed test-only in `80491d1` |
