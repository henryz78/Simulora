# IP-10.7 Release-Candidate Alert Definitions

**Date:** 2026-09-25 · **Scope:** Roadmap IP-10.7 · **Status:** engineering
definitions; it passes no Gate.

This document defines the alerts a release candidate needs. They follow the
metrics that [Implementation Plan §18.2](IMPLEMENTATION_PLAN.md) requires, the
release gates in
[API, Security and Operations §9](../system-design/API_SECURITY_AND_OPERATIONS.md)
and the [IP-9 Runbooks](IP-9-RUNBOOKS.md).

**What this document does and does not do:**

- It uses only signals that exist today.
- It does not invent a metric, and it does not assign a person.
- It does not deploy rules, because no monitoring stack exists yet. Choosing
  one depends on the cloud vendor decision.

## 1. Signal sources

The product has no metrics endpoint. Every alert reads one of three sources:

| Source | What it is |
|---|---|
| **Log** | A structured JSON log event from the API or worker, with the event name in `message`. Logs carry identifiers and classes only; INV-07 is tested, so no user text or private facts appear. |
| **Probe** | A read-only SQL query against the authoritative database, run on a schedule. |
| **Drill** | The exit status or JSON report of an existing script: `restore:drill`, `projections:rebuild` or `perf:ack`. |

## 2. Severity and escalation seam

| Severity | Meaning | Response target | Route |
|---|---|---|---|
| **SEV-1** | Truth or data-integrity risk, a privacy obligation at risk, or the product unavailable | Immediate page | Primary on-call → secondary → incident lead |
| **SEV-2** | Core play degraded for some people; no truth risk | Page in working hours, otherwise the next response window | Primary on-call |
| **SEV-3** | Degraded background or non-core path, or an early warning | Ticket | Owning team queue |

**The escalation seam.** Each alert names its severity and runbook. Mapping a
severity to a route is the only point where people attach.

**Owners and escalation are `EXTERNAL`.** Named operations owners, on-call
rotations, response-time commitments and a tested escalation path are G10
decisions (Plan §20). This document assigns no person and claims no tested
escalation.

## 3. Alerts

The thresholds are engineering defaults for a release candidate, and each is
marked as one. Where a threshold depends on an SLO or DR target, that target is
external and the default is provisional.

| ID | Alert | Source and condition | Sev | Runbook | Signal exercised by |
|---|---|---|---|---|---|
| A1 | Export integrity violation | Log `export.integrity_violation`: any occurrence | SEV-1 | Runbook §1 and §4 | `ip9-object-storage` integrity cases (`ExportIntegrityError`, `ObjectIntegrityError`) |
| A2 | Restore drill failed | Drill: `restore:drill` exits non-zero or reports any `passed: false` | SEV-1 | Runbook §1 | CI *Rehearse backup restore…*, where a tampered copy fails as required. The production drill cadence is external (DR). |
| A3 | Service failed to start | Log `service.start_failed` from the API or worker | SEV-1 | Redeploy the previous release; see the rollback note in the [compatibility matrix](IP-10-COMPATIBILITY-MATRIX.md) §2 C5–C7 | Container smoke step |
| A4 | API unavailable | Probe: `GET /health` fails 3 times in a row at a 30 s interval | SEV-1 | Service restart; Runbook §1 if the database is lost | Container smoke step |
| A5 | Committing Action stuck | Probe: `select count(*) from simulora.actions where status = 'COMMITTING' and updated_at < now() - interval '1 minute'` > 0 | SEV-1 | Runbook §7; an operator never edits Action rows | Commit is one transaction (`action-truth`), so this should never fire. It guards the truth invariant. |
| A6 | Unresolved Actions ageing | Probe: `count(*)` of `actions` in (`ACKNOWLEDGED`, `GENERATING`, `VALIDATING`) with `updated_at < now() - interval '2 minutes'` > 0 | SEV-2 | Runbook §2 | IP-10.6 drill checks zero left `ACKNOWLEDGED` / `GENERATING`; LONG-01 checks the interrupted Action |
| A7 | Queue not draining | Probe: `select count(*) from simulora.durable_jobs where status = 'AVAILABLE' and available_at < now() - interval '60 seconds'` > 0 | SEV-2 | Runbook §2; start a worker | IP-10.6 killed-worker drill: the replacement worker drains |
| A8 | Dead jobs | Probe: `durable_jobs` with `status = 'DEAD'` and `updated_at > now() - interval '15 minutes'`: ≥ 1 raises SEV-3, ≥ 5 raises SEV-2 | SEV-3 / SEV-2 | Runbook §2 | `action-lease`, `ip9-fault-matrix` |
| A9 | Worker processing errors | Log `action.process_failed`: more than 0 in each of 5 consecutive minutes | SEV-2 | Runbook §2 | Emitted by the worker loop. No test asserts the log line itself. |
| A10 | Worker crash rate | Probe: `generation_attempts` with `error_class = 'LEASE_EXPIRED'` and `completed_at > now() - interval '15 minutes'` > 3 | SEV-3 | Runbook §2 | LONG-01 (real process kill), `action-lease` |
| A11 | Provider failures | Probe: the share of `generation_attempts` that are `FAILED` (excluding `LEASE_EXPIRED`) over 10 minutes > 20% | SEV-2 | Runbook §5 | `ip9-model-provider` outage and fallback. **Dormant:** no production provider is enabled, and provider approval is external. |
| A12 | Model profile activation failed | Log `model.profile_activation_failed` | SEV-2 | Runbook §5–§6 | Emitted by the worker. Activation itself is tested in `ip9-model-provider`. |
| A13 | Return projection lagging | Probe: `return_orientation_projections` with `status in ('STALE', 'REBUILDING')` and `updated_at < now() - interval '5 minutes'` > 0; or log `projection.rebuild_failed` | SEV-3 | Runbook §3 (Return keeps serving authoritative fallback) | `ip9-fault-matrix` rebuild cases; LONG-01 stale-then-rebuilt check |
| A14 | Export stuck in storage | Probe: `export_jobs` with `storage_state = 'STAGED'` and `created_at < now() - interval '30 minutes'` > 0; or log `export.storage_failed` | SEV-3 | Runbook §4 | `ip9-object-storage` outage drill |
| A15 | Deletion not propagated | Probe: `export_jobs` with `storage_state = 'DELETE_PENDING'` and `storage_attempts >= 3` > 0 (removal is retrying and failing) | SEV-2 | Runbook §8 | `ip9-object-storage` deletion propagation. The final purge SLA is external (retention). |
| A16 | API server errors | Log `request.complete` with `status_code >= 500` above 1% of requests over 5 minutes, or any `request.failed` burst of 10 or more per minute | SEV-2 | Correlate by `request_id`; Runbook §7 | Every request emits `request.complete` (container smoke, stack journeys) |
| A17 | Transaction conflict rate | Log `transaction.retry_conflict`: more than 20 per minute for 5 minutes | SEV-3 | Runbook §7 (a hot path, not data loss) | Emitted by the database layer. **No test asserts the log line.** |

Probe SQL uses only tables and columns defined in the migrations
(`0005`, `0006`, `0040`, `0044`). Every probe is read-only.

## 4. Required signals that are not available yet

These metrics are required by Plan §18.2, but nothing emits them today. They
are gaps, not PASS, and none is added in IP-10.

| Required metric | Why no alert is defined | What would close it |
|---|---|---|
| **Acknowledgement p50/p95/p99 in production** (NFR-007) | `request.complete` has no duration field. The only measurement is the CI `perf:ack` profile, where p95 was 569 ms in the IP-10.6 drill. | A latency field on `request.complete` (a small observability change needing its own authorization), or a load-balancer metric from the chosen cloud vendor (`EXTERNAL`) |
| Database transaction latency | Not emitted | Database or cloud metrics (`EXTERNAL`), or instrumentation (needs authorization) |
| Time to first meaningful output; ten-second wait transitions | Per-Action progress events exist (`action_progress_events`), but no aggregate is emitted | An aggregate probe over `action_progress_events` could be defined once a dashboard stack exists |
| Duplicate idempotency hits, prevented duplicates, Branch conflicts, stale participation expectations, protected-change rejections, impact-level aggregates, context exclusions | They are refusals returned to the caller; `request.complete` carries only the status code, not the reason code | Reason-code aggregation, which needs authorization, or dashboards built from 409 counts by route |
| Age of a pending export deletion | A deletion clears `storage_available_at`, and `export_jobs` has no `updated_at`, so A15 can only count failed attempts, not elapsed time | A deletion-requested timestamp (a schema change needing authorization) or a join to the confirmed deletion record |
| Model or profile change correlated with continuity evaluation | No continuity-evaluation pipeline runs in production | The model-quality work that follows provider approval (`EXTERNAL`) |

## 5. What stays external

- Named operations owners, on-call rotation and a **tested** escalation path.
- The monitoring and paging stack, which follows the cloud vendor and region
  decision.
- SLO, DR and retention targets, which would firm up A2, A6, A15 and the
  provisional thresholds.
- A production provider, which activates A11.

No alert here has fired in a production-like monitoring stack. The table
records, per alert, which test or drill exercises its underlying signal; a
drilled signal does not mean a drilled alert.
