# IP-9 Fault Matrix Evidence

**Scope:** IP-9.5 (worker, process, provider and object-store fault injection) and
IP-9.6 (projection lag and rebuild drills).

**Source:** the frozen resilience matrix in
[Validation Strategy §7](../system-design/VALIDATION_STRATEGY.md) and the degraded
operation table in [API, Security and Operations §8.4](../system-design/API_SECURITY_AND_OPERATIONS.md).

Every row below names the test that injects the fault and asserts the frozen
outcome. All tests named here run against real PostgreSQL 17 in CI
(`pnpm test:postgres`); the object-store rows also run against a real MinIO.
Rows covered by an earlier Gate keep that Gate's test as their evidence; IP-9
added a test only where a row had been covered implicitly or not at all.

| Injection point (frozen) | Expected result (frozen) | Evidence | Added in |
|---|---|---|---|
| Before the Action transaction | No acknowledgement and no Action | `ip9-fault-matrix` › leaves no Action and no job when the acknowledgement transaction fails (a fault injected after the Action insert rolls back the Action and its job together) | IP-9 |
| After Action commit, before the response | Retry returns the same Action by idempotency key | `ip9-fault-matrix` › recovers a lost acknowledgement by retrying the same request (same id, one job); `action-truth` › rejects idempotency-key reuse when the canonical request changes | IP-9, G3 |
| Worker after provider call | Attempt can retry; no Commit yet | `action-lease` › renews a live slow attempt past its original deadline and prevents takeover; › retains bounded failure/dead-state recovery with a new attempt epoch on explicit retry | G3 |
| During validation | Recoverable failure; state unchanged | `ip9-model-provider` › rejects an out-of-envelope provider answer and never lets it touch World truth (three failed attempts, `FAILED_RECOVERABLE`, head and participation unchanged); `ip9-model-evaluation` (corpus replay, every adversarial case rejected for its pinned reason) | IP-9 |
| Just before Commit | Retry rechecks the expected head | `action-truth` › serializes a concurrent cancel and Commit race into one truthful terminal result; › allows only one unresolved ordinary Action against a Branch head | G3 |
| Ordinary Action with a stale or mismatched participation expectation | Recoverable stale-contract/head result before generation or Commit; no axis mutation | `ip6-participation-character` › rejects stale/mismatched expectations before generation or World mutation | G6 |
| Direct mode, correction or removal with a stale head or changed exact effect | Conflict or renewed direct authorization; no mutation | `ip6-participation-character` › rejects stale and expired proposal confirmation transitions; `ip4-return-continuity` › keeps exact direct confirmation, cancellation and proposal binding constraints effective | G4, G6 |
| After Commit, before the client's final frame | Action query or SSE resume returns the existing Commit; no duplicate | `ip9-fault-matrix` › resumes a lost final frame to the existing Commit without a second one (same Commit on retry and read, one `action.committed` frame, one Commit row) | IP-9 |
| After outbox insert, before delivery | Outbox redelivery is safe | Projection delivery is idempotent: `ip4-adversarial` › discovers a missing projection and enforces its Branch/head integrity; `ip9-fault-matrix` › rebuilds missing and drifted projections from authoritative state on demand | G4, IP-9 |
| After usage reservation | A terminal no-Commit releases once | `ip9-fault-matrix` › releases a reservation exactly once when an Action ends without a Commit (second release is a no-op, settlement after release refused, one `RELEASE` entry) | IP-9 |
| Provider slow beyond ten seconds | Explicit wait state and safe cancel/retry | `ip9-model-provider` › shows the ten-second wait state for a slow provider and lets cancel win (a really slow provider double; `recoverableWait` after ten seconds; cancel wins; the late answer has no write authority); `action-truth` › keeps a slow acknowledgement recoverable by Action ID and lets cancellation win before Commit | G3, IP-9 |
| Provider unavailable | State, history, export and recovery stay readable; new generation stays unresolved or retryable | `ip9-model-provider` › keeps state readable through an outage and discloses a fallback draft (without a fallback: `FAILED_RECOVERABLE` and a readable head; with the declared fallback: the same rules decide and the draft is marked as fallback) | IP-9 |
| Projection worker unavailable | Authoritative state served; projection marked stale | `ip4-adversarial` › marks a delayed projection stale while keeping the authoritative fallback readable, then rebuilds it from the current head; `ip9-fault-matrix` › rebuilds missing and drifted projections… (stale Return still serves the authoritative head) | G4, IP-9 |
| Object store unavailable | Core World state stays usable; export or import is delayed visibly | `ip9-object-storage` › keeps core play usable and makes an object-store outage a visible, recoverable delay (an Action commits during the outage; the export stays `PENDING` with a reason and is stored after recovery); › turns an unreachable store into a bounded, visible delay (real S3 client against a closed port, bounded time); › lets a second uploader finish without deleting the stored object; › never deletes under a running upload, and removes what a crashed upload left (added in `d7430e3`) | IP-9 |
| Database recovery from backup | Referential, head and hash integrity verified before service resumes | CI step *Rehearse backup restore into an isolated database* (`pnpm restore:drill`): content, integrity, canonical hashes, application reads and stored objects all checked; the restored migration ledger re-applies nothing; a tampered copy fails | IP-9 |

## Projection lag and rebuild (IP-9.6)

- Stale is visible: `readOrientation` reports `STALE` with head distance and an
  `authoritativeFallback` naming the current head, state revision and state URL
  (`ip4-adversarial`, `ip9-fault-matrix`).
- A missing projection is discovered as `REBUILDING`, never served as empty
  history (`ip4-adversarial`, browser `ip4-continuity` › Return never describes
  missing projection history as no recorded change).
- The database refuses to label an older head `FRESH`, so drift can only arise
  naturally when a Commit outpaces the projection; it cannot be written in.
- `pnpm projections:rebuild` is the operator procedure. It marks drift stale,
  drains the rebuild queue from authoritative state and exits non-zero unless
  the queue drained. It never reads or writes World truth.

## What this matrix does not prove

- Worker process death is simulated through lease expiry and reclaim, not by
  killing a container mid-attempt. The lease tests prove the fencing that makes
  a real crash safe; a container-kill drill belongs to IP-10.6.
- The provider rows use a loopback provider double. No real provider was
  called during IP-9, and none is approved (see the IP-9 report).
- The PGlite socket server used for quick local runs cannot reproduce these
  concurrency rows; only the CI PostgreSQL runs count as evidence.
