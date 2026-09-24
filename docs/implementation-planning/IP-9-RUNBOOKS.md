# IP-9 Operational Runbooks

**Scope:** the runbooks [Implementation Plan §18.3](IMPLEMENTATION_PLAN.md)
requires before release, as far as IP-9 can prove them. Named owners, alert
routing and escalation belong to IP-10.7 and are not assigned here.

Each runbook states its signal, its procedure, how to verify recovery, and
whether a CI drill exercises it (**Proven**) or it is written but not yet
drilled (**Documented**).

## 1. Database restore into isolation — Proven

**Signal:** data loss, corruption, or a region or instance failure.

1. Restore the latest backup or point-in-time copy into a new, isolated
   database. Never restore over the live database.
2. Run `SIMULORA_DATABASE_URL=<source or last known good copy>
   SIMULORA_RESTORE_DATABASE_URL=<isolated copy> pnpm restore:drill` with the
   object-store variables set. When the original is gone, compare against the
   most recent verified copy instead.
3. Serve from the copy only if every check passes: `TABLE_CONTENT_IDENTICAL`,
   `BRANCH_HEADS_RESOLVE`, `ACTIVE_BRANCH_BELONGS_TO_CONTINUITY`,
   `COMMIT_STATE_PAIRS_MATCH`, `EXPORT_STORAGE_CONSISTENT`, both
   `CANONICAL_*_HASHES_PRESERVED`, `RESTORED_STATE_SERVED` and
   `OBJECT_MANIFEST_INTACT`.
4. Run `pnpm db:migrate` against the copy. It must report only
   `Already applied`; any `Applied` line means the migration ledger was not
   restored whole.

**Drill:** CI step *Rehearse backup restore into an isolated database* seeds a
source through the real repository and MinIO, dumps it with `pg_dump`,
restores it with `pg_restore`, runs every check, confirms the ledger re-applies
nothing, and then proves a tampered copy fails.

## 2. Worker retry and dead jobs — Proven

**Signal:** `action.process_failed` errors, growing `durable_jobs` in `DEAD`,
or Actions stuck in `GENERATING` beyond their lease.

1. A crashed or slow worker needs no intervention: an expired lease is
   reclaimed, the abandoned attempt is closed as `LEASE_EXPIRED`, and its late
   answer has no write authority.
2. After three failed attempts an Action becomes `FAILED_RECOVERABLE` and its
   job `DEAD`. The person sees a recoverable state and can retry or close it;
   an operator never edits the Action row.
3. Inspect `durable_jobs.last_error` (bounded to 500 characters) and the
   attempt `error_class` to tell a provider outage from a validation rejection.

**Evidence:** `action-lease`, `ip9-model-provider` and `ip9-fault-matrix`
suites (see [IP-9 Fault Matrix](IP-9-FAULT-MATRIX.md)).

## 3. Projection rebuild — Proven

**Signal:** Return shows `STALE` or `REBUILDING` for longer than expected, or
`projection.rebuild_failed` in worker logs.

1. Confirm the authoritative state is readable: Return keeps serving
   `authoritativeFallback`, so people are not blocked.
2. Run `pnpm projections:rebuild`. It marks drifted projections stale, rebuilds
   from authoritative State Revisions and exits non-zero unless the queue
   drained.
3. A branch that keeps failing stays `STALE` and visible; investigate its
   error rather than editing projection rows.

**Evidence:** `ip9-fault-matrix` › rebuilds missing and drifted projections;
`ip4-adversarial` projection suites.

## 4. Object-store outage and export retry — Proven

**Signal:** `export.storage` warnings with outcome `DELAYED`, exports held in
`PENDING` with `storage_last_error`, or 503 `OBJECT_STORE_UNAVAILABLE` on
downloads.

1. Core play is unaffected; do not pause Actions.
2. Restore object-store access. The worker retries staged uploads with bounded
   exponential backoff (up to five minutes); no manual resubmission is needed.
3. To retry at once, clear `storage_available_at` for the affected rows; the
   staged bytes and checksum are immutable, so a retry cannot change an export.
   Leave `storage_lease_until` alone: it marks an upload that may still be
   running, and a deletion waits for it.
4. Verify that the rows reach `STORED` and that `artifact_bytes` is cleared.

**Evidence:** `ip9-object-storage` › outage drill (in-memory) and the
unreachable-store case (real S3 client); MinIO leg in CI.

## 5. Provider outage and profile rollback — Proven for outage, Documented for rollback

**Signal:** `ProviderUnavailableError` attempts, `FAILED_RECOVERABLE` Actions
with `GENERATION_FAILED`, or fallback drafts marked on Actions.

1. State, history, export and recovery stay readable; nothing needs pausing.
2. With a declared fallback (`SIMULORA_MODEL_FALLBACK=deterministic`), new
   drafts come from the fallback and say so on the Action. Without one,
   Actions become recoverable after three attempts.
3. To roll back a profile, redeploy the worker with the previous profile
   configuration. At start the worker records the activation, and a material
   change publishes a MODEL notice before any Action is generated under it.

**Evidence:** `ip9-model-provider` outage and fallback cases. The rollback
itself has not been drilled against a real provider.

## 6. Material model-change rollback — Documented

Same procedure as §5.3. The `model_profile_activations` record is append-only,
so a rollback is itself a new activation with its own notice.

## 7. Confirmation or idempotency anomaly — Documented

**Signal:** `IDEMPOTENCY_KEY_REUSED`, `CONFIRMATION_EXPIRED_OR_PROPOSAL_CHANGED`
or `CONCURRENT_UPDATE_RETRY` rates rising; `transaction.retry_conflict` warnings.

1. `transaction.retry_conflict` records the SQLSTATE (`40001` or `40P01`) that
   was flattened to a 409; a rising rate points at a hot path, not at data loss.
2. Idempotency and confirmation conflicts are safe refusals; correlate by
   `request_id` → `action_id` in logs. Nothing is written by a refused request.

## 8. Permission revocation and deletion propagation — Proven for deletion

**Signal:** a confirmed deletion.

1. Deletion tombstones the World, revokes its grants and exports, clears staged
   export bytes in the same transaction and queues stored objects for removal.
2. Verify that the worker reaches `DELETED` for each export object. Minimal
   audit metadata remains, as the deletion review states.

**Evidence:** `ip8-trust-lifecycle`, `ip9-object-storage` › deletion
propagates to staged bytes and stored objects. Grant revocation without
deletion has no product path yet (see the threat model, open item 1).
