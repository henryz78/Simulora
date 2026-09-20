# IP-8 Trust / Lifecycle Implementation Report

**State:** `IMPLEMENTATION CANDIDATE / G8 PENDING`

**Candidate behavior commit:** `686b93c4a2964aa95eaef41966347bad74f2988e`

**Scope:** the frozen IP-8 roadmap envelope only. This candidate implements
IP-8.1–IP-8.6 and IP-8.9: eligibility/policy outcomes, ownership/grants/
visibility explanations, consent and material-change notices, zero-cost usage
quote/reservation/ledger, selected-scope export with manifest/checksums,
deletion proposal/tombstone/mutation blocking/purge status, and audit/appeal
seams. IP-8.7 staged import and IP-8.8 bounded sharing remain explicitly
deferred, as allowed by the original roadmap.

The candidate does not enable a production live model, add an autonomous
scheduler, redesign long-term memory, add an effect DSL or truth model, alter
World/Revision/Continuity/authority contracts, or depend on the frozen
Prototype. Creator and lifecycle operations remain progressive, reviewable and
bound to existing World Revision and Continuity lifecycles.

## Implementation

- Added versioned governance contracts and a `GovernanceService` port.
- Added API routes for account/policy, consents, access explanations, product
  changes, appeals, usage quote/reservation/settlement/release/ledger, exports
  and artifacts, and deletion proposal/confirmation/status.
- Added migration `0040_ip8_trust_lifecycle.sql` for governance records,
  append-only usage/audit records, export jobs, deletion proposals, tombstones,
  mutation triggers and the `TOMBSTONED` Continuity state.
- Added the responsive Trust & lifecycle surface with access, consent,
  material-change, appeal, selected export and exact deletion review flows.
- Export artifacts are standard-library ZIPs containing selected owner data,
  a versioned manifest and SHA-256 checksums; other participants' private
  Continuities are excluded.
- Deletion confirmation is digest-, scope-freshness- and idempotency-bound;
  it revokes grants/exports, tombstones affected Continuities and blocks later
  Draft/Revision/Continuity/Action/Commit mutation.
- Corrected PostgreSQL consent UPDATE parameter binding and the migration
  trigger's table-specific `NEW.status` access.
- Added a mobile layout guard so long checksums cannot widen Trust cards past
  the 390×844 viewport.

## Verification

| Check | Result |
| --- | --- |
| Prettier format check | PASS |
| ESLint JSON-result check | PASS |
| Typecheck | PASS |
| Architecture check | PASS |
| Migration check | PASS, 40 migrations |
| Worker runtime startup/shutdown | PASS |
| Workspace production build | PASS (esbuild required the approved elevated run) |
| Default Vitest | 64 passed; 129 PostgreSQL-dependent tests skipped because `SIMULORA_DATABASE_URL` is absent |
| Full Playwright E2E + axe | 68/68 PASS, desktop Chromium and touch 390×844 |
| Dedicated IP-8 E2E + axe | 2/2 PASS, desktop Chromium and touch 390×844 |
| Real PostgreSQL IP-8 integration | NOT RUN locally; Docker and `SIMULORA_DATABASE_URL` unavailable |
| Independent review / G8 | PENDING; this report is not self-approval |

## Known boundaries

This evidence proves the bounded lifecycle envelope and local integration
contracts, not production deployment, live-provider quality, human enjoyment,
autonomous world progression, broad multi-Character development or complete
long-term memory. Real PostgreSQL CI remains required before G8 can close.
