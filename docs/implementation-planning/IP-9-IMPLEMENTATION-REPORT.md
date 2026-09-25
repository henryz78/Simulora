# IP-9 Implementation Report — Model, Accessibility and Reliability Hardening

**Status:** `G9 PASS` on code review. Current approved behavior:
`c812d6c6d29be86be3557a00b4866b5d01f0499f`. Its exact-SHA CI `36096978257` was not checked by the reviewer, and
the user will verify it.

The last behavior with CI verified by the reviewer is `69228ef` (`36094446366`,
PASS WITH ISSUES). The one before that is `e1fa0a6` (`35964085085`).

The [independent review](IP-9-INDEPENDENT-REVIEW.md) went through three
rounds:

1. The first review, on `b0f12ab`, returned `PASS WITH ISSUES` (0 BLOCKER /
   2 IMPORTANT / 1 MINOR).
2. The same reviewer re-reviewed the repair and returned `PASS` on `a59a58a`.
3. A second, separate audit then found further defects (§4.8). The reviewer
   independently confirmed the repair `d7430e3` and returned `PASS`. It raised
   one IMPORTANT documentation finding (N1) and one MINOR finding (N2).
   `e1fa0a6` closes N2; this documentation closes N1.
4. The same reviewer re-reviewed `f5949ac` after the export-worker and endpoint
   hardening repairs: `PASS WITH ISSUES` (0 BLOCKER / 1 IMPORTANT / 0 MINOR).
   The remaining Important is the missing exact-SHA CI and stale evidence,
   which this report now records.
5. CI for that candidate failed, and `69228ef` repaired the tests. The Sonnet 5
   reviewer returned `PASS WITH ISSUES` (0 / 1 / 1) on `69228ef`; `c812d6c`
   repaired both findings and it returned `PASS` (0 / 0 / 0). See review §11.

**Phase goal (frozen):** move from deterministic correctness to production-shaped
quality without weakening contracts ([Roadmap §12](ROADMAP_AND_WORK_BREAKDOWN.md)).

**Starting point:** `main` at `a3e0b7e` (documentation) with approved IP-8
behavior `666db383eeb413778f5b090f1b2089b93e31ef53`. G1–G7 closed; G8
`PASS WITH ISSUES` with one accepted important item (export bytes in
PostgreSQL, no signed object URLs, no purge worker).

## 1. Scope recovered before implementation

| Question | Finding | Source |
|---|---|---|
| Does the IP-8 object-storage / signed-URL / purge obligation belong to IP-9? | **Object storage and signed URLs: yes.** IP-9.5 requires object-store fault injection, IP-9.10 an object-manifest restore drill, G9 a proven object-store delay runbook, and the Plan fixes S3-compatible storage with signed short-lived access. **Purge worker: only partly.** Deletion propagation to object artifacts is a Validation §8 test and is done here. Retention-driven purge of PostgreSQL data depends on the *Retention, deletion purge and DR SLO* decision, which the Plan requires before production release; it stays a release obligation. | Roadmap §12; Plan §5, §19.2, §20; Validation §8 |
| Does IP-9 include production live-model hardening, and within what approval? | IP-9.1 is *one approved live capability profile/adaptor*. Approval of the provider, its retention/training terms and the profile is an external decision required before live-model staging, with the deterministic adapter as the interim. No provider has such an approval, and earlier authorizations covered isolated experiments only. IP-9 therefore builds and proves the adapter and its hard gates against provider doubles, and confines a live profile without an approval reference to local and test. No real provider was called. | Roadmap §12; Plan §20; API §6.2 |
| What stays outside IP-9? | Long-term memory, autonomous scheduling, broad autonomous simulation, IP-8.7 staged import, IP-8.8 bounded sharing, `LONG-01` (IP-10.3), the full INV run and compatibility matrix (IP-10.1/10.4), operations ownership and alerts (IP-10.7), specialist penetration and legal review (G10). None of these were implemented. | Roadmap §12–13 |

## 2. What was built

| Work package | Roadmap item | Commit |
|---|---|---|
| Export artifacts in S3-compatible storage: staged → stored lifecycle (successor `0044`), visible delay on outage, worker retry with bounded backoff, deletion propagation to objects, single-export API-signed links (S3 presigned links were built, then removed in `d7430e3`, see §4.8), legacy inline migration, checksum/key immutability, MinIO in CI | IP-8 obligation; IP-9.5 prerequisite | `2395366`, `5354f08` |
| Provider-neutral OpenAI-compatible live adapter, capability profiles, declared fallback for outages only, fallback disclosed on the Action, routed profile on every attempt and append-only profile activations with MODEL notices (`0045`), live-profile confinement to local/test without a retention approval | IP-9.1, IP-9.2 | `eec1286` |
| Fixed original evaluation corpus (13 cases across benign, authority, privacy, structure, injection) with per-case hard gates, never averaged; replay in CI; live mode gated on an approval reference | IP-9.3 | `eec1286` |
| Live attempts admitted as SQL evidence by successor `0046` (see §4) | IP-9.1 | `77f4ee8` |
| Explicit fault-matrix tests, `projections:rebuild` operator procedure, `restore:drill` with CI dump/restore/verify/tamper | IP-9.5, IP-9.6, IP-9.10 | `fd4f9df` |
| `perf:ack` profiling against the API and worker containers; accessibility gate extended with reflow at 320 CSS px, visible focus and reduced motion; keyboard-only Action journey; Firefox, WebKit and tablet projects; security headers and a production CSP render smoke | IP-9.4, IP-9.7, IP-9.8, IP-9.9 | `7247264` |
| Fault matrix, threat model and runbook documents | IP-9.5, IP-9.9, G9 | `6deb446` (documentation) |
| Runtime profiled on its own migrated database, and a drain gate on the queue | IP-9.4 | `9e8099c` |
| WebKit 320 px reflow: `7d452fa` addressed the wrong cause; `b0f12ab` is the real fix (see §4.5) | IP-9.7 | `7d452fa`, `b0f12ab` |
| G9 review repair: the server settles a delayed export's reservation (I1), and a corrected worker comment (M1) | IP-9 obligation | `a59a58a` |
| Second audit repair: export finalize race and upload lease (`0047`), API-signed links only, live-evaluation verdict, movement cases, bounded provider body, provider in the profile, integrity reason, export status UI, legacy reservation | IP-9.1–9.5 | `d7430e3` |
| Upload lease tied to the object store's worst-case call time (review N2) | IP-9.5 | `e1fa0a6` |
| Bounded S3 timeouts, quarantine of uncertain writes by lease renewal, orphan-object reconciliation (serialized, claim-first, paced), endpoint secret rejection and redaction | IP-9.5 | `b6f1978`–`f5949ac` |
| Tests aligned with the renewed lease and the in-flight join (CI repair) | IP-9.5 | `69228ef` |
| Export worker calls stay scoped to their own World; a test proves the renewed lease (review §11) | IP-9.5 | `c812d6c` |

Supporting documents: [Fault Matrix](IP-9-FAULT-MATRIX.md) ·
[Threat Model](IP-9-THREAT-MODEL.md) · [Runbooks](IP-9-RUNBOOKS.md).

## 3. G9 criteria

| G9 criterion (frozen) | Evidence | Status |
|---|---|---|
| Live provider cannot bypass deterministic rules | Provider output passes the same application and SQL validators; out-of-envelope answers rejected on real PostgreSQL; corpus authority cases rejected for pinned reasons; hard gates re-check accepted candidates | Met against provider doubles; **no real provider evaluated** |
| Provider outage/degradation leaves state readable and Action recoverable | `ip9-model-provider` outage and fallback cases | Met |
| p95 acknowledgement ≤ 1 s and ten-second recoverable wait under a documented profile | `perf:ack` in CI (200 Actions, concurrency 10, containerized API, PG17); slow-provider wait-state test | Met under the CI profile; figures in §5 |
| Core journeys pass keyboard and supported assistive-technology review, desktop and mobile | axe on every major page, reflow, focus, reduced motion, keyboard-only Action journey, five browser/device projects | **Automated evidence only.** No human screen-reader review was run |
| No state meaning depends on animation, audio, color or optional media | Status and provisional states are text; reduced motion removes all motion; the fallback disclosure is text | Met by automated checks |
| Backup/restore, worker retry, projection rebuild and object-store delay runbooks are proven | CI restore drill; lease, fault-matrix and object-storage suites | Met ([Runbooks](IP-9-RUNBOOKS.md)) |
| Security/privacy review has no open release BLOCKER | Threat model with test evidence; six open items recorded | **No BLOCKER found by IP-9's own review**; the specialist review is a G10 gate |

## 4. Defects found during IP-9

1. **Live evidence refused by the database (found by CI on real PostgreSQL).**
   The G6/RE-3 evidence functions accepted a proposal or response-only record
   only from a `deterministic` attempt whose output equals the candidate
   exactly. The first live-path commit put profile provenance inside that output
   and ran attempts as `openai-compatible`, so every live proposal was refused.
   Local runs could not show it. Successor `0046` re-creates both functions
   verbatim except for the adapter condition (a one-line diff per function),
   the attempt output keeps its exact shape, and provenance moved to the draft
   progress frame. The exact-evidence binding was not loosened.
2. **Unreachable MinIO image.** Docker Hub no longer serves `minio/minio`; CI
   and local compose now pull the same pinned release from `quay.io`.
3. **Root-manifest dependency, again.** New scripts imported `pg`, which only
   the database package declares; a clean CI install failed lint. The database
   package now re-exports its pool types, and the IP-8 root-dependency guard was
   widened from `tests/` to `scripts/` and shown to catch the case.
4. **Pool starvation risk.** A schema probe inside the attempt transaction used
   a second pooled connection. It now runs on the transaction's own client.
5. **WebKit reflow at 320 CSS px (found by CI on mobile WebKit).** The Recovery
   view scrolled sideways at 320 px. The first fix (`7d452fa`, `min-width: 0`
   on the select) addressed the wrong cause. WebKit counts a native select's
   longest option label as overflow of the whole page. `b0f12ab` renders the
   field select as a plain box with a drawn arrow. It is still a real
   `<select>`, so keyboard use and screen-reader semantics are unchanged. The
   reflow check now waits for the resize to paint, and a failure names the
   overflowing text runs.
6. **Shared-database backlog in the first profile run.** The first `perf:ack`
   run reported 200 undrained Actions, left behind by the integration suites.
   `9e8099c` gives the runtime its own migrated database and makes the profile
   fail unless the queue drains.
7. **Orphaned export reservation (independent review finding I1).** A delayed
   export's usage reservation was settled only by the browser's poll, so a
   tab closed during an object-store outage left it `RESERVED` for good.
   `a59a58a` settles the reservation in the transaction that stores the
   object, and releases it when an export is revoked before it was stored.
8. **Second audit (a separate, read-only auditor).** Every finding was checked
   against the code before any change; all were real. `d7430e3` repairs them:
   - **Finalize race.** An uploader whose finalize failed deleted the object
     unconditionally, even when another uploader had just stored it. The
     API's synchronous upload took no lease, so an API/worker race was
     enough. Finalize now reports `STORED`, `ALREADY_STORED` or `REVOKED`,
     and only `REVOKED` deletes. The API leases like the worker.
   - **Deletion during an upload.** Successor `0047` adds
     `storage_lease_until`, separate from the retry backoff. A delete waits
     for a running upload and removes what a crashed upload left behind.
   - **Presigned S3 URLs** skipped the checksum and outlived revocation. They
     are removed; every download is an API-signed link.
   - **Live evaluation** passed a provider that only failed. Live mode now
     requires every benign case to be accepted.
   - **Provider response** was fully buffered before its size check, and a
     password-only URL was accepted. Both are fixed.
   - **The provider endpoint was not part of the profile**, so switching
     providers recorded nothing. The profile now carries the provider origin,
     and a change of provider or fallback is material.
   - **Minor:** integrity failures have their own reason; revoked and failed
     exports no longer show "Export ready"; deleting a World settles a
     delivered legacy export's open reservation; the corpus gains movement
     cases.

   `e1fa0a6` closes review finding N2: a test now fails unless the 30 s upload
   lease outlasts the storage package's worst-case S3 call, and configured
   timeouts are capped at that bound.

## 5. Evidence

CI runs on `main` (real PostgreSQL 17, MinIO, containers, browser matrix):

- `2395366`/`5354f08` object storage — run `35927879488` passed.
- `eec1286` live adapter — run `35930110554` failed on the defect in §4.1.
- `fd4f9df` drills — run `35931753434`: all PostgreSQL suites passed; `pnpm
  check` failed on the lint defect in §4.3.
- `7247264` profiling, accessibility and headers, then `9e8099c` — run
  `35934442173` failed only on mobile WebKit reflow (§4.5).
- **`b0f12ab` — run `35936816813` passed in full.** This is the exact SHA
  the independent review examined:
  - PostgreSQL suites: 14 files, 149 tests.
  - `pnpm check`: 31 files, 245 tests; migration check covers 46 migrations.
  - Restore drill: 39 tables and 171 rows identical, 3 stored objects, every
    check passed. The restored ledger re-applied nothing, and a tampered copy
    failed the drill.
  - `perf:ack`: 200 Actions, concurrency 10, against the API and worker
    containers on PostgreSQL 17.
    - Acknowledgement: p50 76.7 ms, p95 524.6 ms (target 1000 ms), p99 724 ms.
    - Acknowledgement to proposal: p50 18.3 s, p95 35.3 s, p99 36.8 s
      (reported, not gated).
    - Errors 0, undrained 0.
  - Production CSP render smoke: 26 elements, no violations.
  - Browser and device matrix: 180 passed across the five projects.
- **`a59a58a` review repair (approved behavior) — run `35955102973` passed
  in full.**
  - PostgreSQL suites: 14 files. `pnpm check`: 31 files.
  - `perf:ack`: acknowledgement p95 398.6 ms; acknowledgement to proposal p95
    35.7 s.
  - Browser and device matrix: 180 passed.
- **`d7430e3` second audit repair — run `35961891632` passed in full.** 47
  migrations; acknowledgement p95 427.1 ms; 185 browser tests.
- **`e1fa0a6` (approved behavior) — run `35964085085` passed in full.**
  - PostgreSQL suites: 154 tests. `pnpm check`: 251 tests; 47 migrations.
  - Restore drill: 172 rows identical; every check passed.
  - `perf:ack`: acknowledgement p95 508.8 ms; acknowledgement to proposal p95
    35.2 s.
  - Browser and device matrix: 185 passed.

- **`f5949ac` candidate — exact-SHA CI pending.** The focused repair adds
  claim-first, paced best-effort reconciliation with an idle force sweep after
  DELETE, and rejects/redacts endpoint URL secrets. Local targeted tests are
  55 passed / 11 skipped; the full local run is 114 passed / 154 skipped.
  Real PostgreSQL, MinIO/S3, provider, human assistive-technology review and
  exact-SHA CI are not yet evidence for this candidate; local build remains
  blocked by the Windows sandbox's esbuild parent-directory access denial.
  Its CI (`36092785927`) and `716deba`'s (`36093084620`) failed at the MinIO
  start step. With S3Mock, `dab139c` (`36093434199`) ran the suites and failed 5
  object-storage tests (review §11).
- **`69228ef` test repair — run `36094446366` passed in full.**
  - PostgreSQL suites: 155 tests. `pnpm check`: 268 tests; 47 migrations.
  - Restore drill: 172 rows.
  - Acknowledgement p95: 427.9 ms.
  - Browser matrix: 185 passed.
- **`c812d6c` (approved behavior) — run `36096978257`, not checked by the
  reviewer; the user will verify it.**

Local checks on each commit: format, ESLint (0 problems), typecheck,
architecture, migrations (46), unit tests, build and worker runtime. Local
PostgreSQL-dependent runs used a PGlite wire server and are **not** counted as
evidence: its single-session multiplexer cannot represent concurrency and
desynchronizes after an in-transaction error.

## 6. Not proven, and why

- **No real provider was evaluated.** No provider has a recorded retention and
  training approval; the corpus's live mode exists but was not run.
- **No human assistive-technology review.** Automated checks cannot establish
  that a screen-reader user can complete the journeys.
- **PERF-ACK holds for the CI profile only.** Loopback network, one host,
  deterministic generation. A supported-device and normal-network profile
  needs the deployment decision.
- **Worker throughput is one Action per poll interval per worker.** Reported,
  not gated. Capacity targets are not frozen (Validation §9.3).
- **Worker death is simulated by lease expiry**, not by killing a container.
- **Retention-driven purge of PostgreSQL data** remains a release obligation.
- The threat model's six open items (§3 of that document).

## 7. External decisions still required

From Implementation Plan §20, still open: approved model provider with
retention/training terms; cloud vendor and region; identity provider and
adult-eligibility policy; retention, purge and DR SLO; pricing; safety
taxonomy and appeal SLA; brand and asset provenance.

IP-10 has not started.
