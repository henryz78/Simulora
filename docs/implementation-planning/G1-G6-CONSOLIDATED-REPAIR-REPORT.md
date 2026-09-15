# G1–G6 Consolidated Repair Report

## Scope

This repair starts from the final re-review baseline
`3ebd8326dadebe08eb294f185d305138fb0362e7`. It consolidates the seven
independent reviews without changing the frozen Product, System, or Experience
contracts. IP-7 and the Live Model / Product Reality Spike remain out of scope.

## Consolidated findings

The original reports contained 6 blockers, 3 important findings, and 1 minor
finding. They reduce to these shared root causes:

1. A production-shaped process could omit `SIMULORA_ENV` and inherit local
   development authority.
2. The durable Action pipeline did not preserve HTTP correlation lineage.
3. PostgreSQL did not fully validate World Revision provenance, authoritative
   State Revision shape, Continuity access, or Return projection identity.
4. A stale acknowledged Action could reach generation after the active
   Branch/head changed.
5. PostgreSQL could switch the current Branch while an unresolved Action
   remained on the previous Branch.
6. Ordinary Action and Branch-fork retry identities were incomplete under
   lost-response/concurrent submission scenarios.
7. Container artifacts copied unused broken workspace symlinks.

## Repairs

- Production images now set `SIMULORA_ENV=production`; configuration also
  fails closed when `NODE_ENV=production` would otherwise resolve to local.
- Correlation ID is stored on Action, durable job, and generation attempt, and
  is restored in worker processing/logging.
- Migration `0026_integrated_authority_repairs.sql` adds database-side:
  - World Revision document/hash/validation-run/Draft provenance checks;
  - State Revision document-shape checks for all new rows;
  - grant-aware Continuity access (`world_access_grants`), without equating
    Continuity ownership with World ownership;
  - Return projection payload identity checks;
  - unresolved-Action protection for active-Branch switches;
  - one-unresolved-ordinary-Action-per-Branch/head enforcement.
- Worker processing fences stale/inactive Action work before leasing or calling
  the generator and records a durable conflict outcome.
- Branch fork idempotency now binds name, source Commit, expected head, and
  Continuity; changing the source clears the browser retry key. Lost responses
  no longer claim the Branch definitely was not created.
- Ordinary Action error paths refresh durable state before allowing the user to
  proceed, while the database constraint remains the authority under races.
- API and worker runtime images retain external third-party dependencies from
  the deploy artifact while removing unused broken workspace symlinks.

## Verification

- format: PASS
- lint: PASS
- strict typecheck: PASS
- architecture check: PASS
- migration check: PASS (27 migrations)
- unit/contract/PGlite tests: PASS (53 passed; PostgreSQL-only suites require CI)
- migration negative probes: PASS for invalid document shape, projection
  identity, denied cross-owner Continuity, and explicit grant acceptance
- production build: PASS
- worker runtime bundle smoke: PASS
- `git diff --check`: PASS

Real PostgreSQL concurrency suites, container builds, and desktop/mobile E2E
must run in CI against the resulting commit before final approval.

## Required independent re-review

- **Focused re-review:** G1, G2, G4, and G5, because their recorded findings
  changed directly.
- **Full regression:** G3 and G6, because Action lifecycle, database authority,
  and pre-generation fencing are shared with those gates.
- **Integrated re-review:** required across lost ACK, Correction/Removal,
  Restore, Participation change, Branch selection, Return projection rebuild,
  and Character context paths.

No Gate is self-approved by this report.

## Follow-up repair after `da60d2d` final reviews

The G1/G2/G3 reports reviewed `da60d2d61a542a7c1dd334f60d18dcb6720a3634`.
The newly supplied G4/G5 findings reviewed the older `3ebd8326` baseline; their
projection, stale-generation, pending-Branch-switch and fork-retry root causes
remain covered by the current repairs rather than being implemented twice.

### Additional repairs

- `0028_document_and_participant_authority.sql` validates nested World/State
  scalar types, text/ID bounds, references, optional UUIDs, arrays, finite
  numeric resources and allowed object keys at the database boundary.
- Cross-owner Continuity creation requires an **ACTIVE PARTICIPANT** grant;
  VIEWER is not participation authority. World and Continuity ownership remain
  independent for future shared-World access.
- `0026` now transitions prior-schema duplicate unresolved ordinary Actions
  before creating its unique index. The oldest retains its lifecycle; other
  rows remain visible as `CONFLICT / MIGRATED_MULTIPLE_UNRESOLVED`, with their
  unfinished jobs/attempts fenced. No Action, history or canonical Commit is
  deleted.
- A narrowly bound predecessor checksum preserves databases that already
  successfully applied the original `0026`; its final schema is equivalent,
  and the amended SQL only changes the previously failing pre-index upgrade
  transition. All other checksum drift still fails closed.
- The correlation regression now submits a real HTTP Action and inspects its
  PostgreSQL Action/job/generation-attempt lineage; it is included in
  `test:postgres`.
- API/worker images also remove the nested pnpm workspace self-links.
- The supported-script authority boundary uses Unicode code points instead of
  locale-dependent regex ranges, keeping safe Han text and protected claims
  consistent on Windows and Linux.
- Both generation success and failure callbacks lock/recheck the current
  Branch/Continuity after checking lease ownership. A direct Correction/Removal
  that advanced the head during generation produces a durable conflict, not an
  obsolete visible proposal or a retry of the old context.
- Callback and same-path writers acquire path locks in explicit
  Continuity-before-Branch order. A PostgreSQL blocking-graph regression covers
  both callback outcomes while another transaction holds the Continuity.
- Retired duplicate Actions keep generation/proposal evidence, but their ACTIVE
  proposals become REJECTED and are not exposed as live confirmation targets.
  A real PostgreSQL prior-lifecycle upgrade test exercises a generated proposal,
  succeeded attempt and available job together.
- Required text rejects ECMAScript whitespace-only values, including non-ASCII
  whitespace. Revision insertion captures every Character snapshot atomically
  through the existing Asset ownership/lifecycle/content validator, preventing
  direct SQL from bypassing the application Asset check.
- An independent relabeled-payload probe was reproduced locally: identity
  fields alone did not bind cached content to its source. Return reads now
  rebuild visible content from the authorized source Commit/State/Trace using
  the same presentation function as the worker. The source must belong to the
  Branch and current-head ancestry; invalid sources fall back to current state.
  Cached payload is not read or trusted. This closes the demonstrated read
  boundary without treating unrestricted SQL access as a proven user API exploit.

### Local evidence for the follow-up worktree

- format, lint, strict typecheck, architecture and migration checks: PASS.
- PGlite clean/populated/duplicate-pending upgrade tests: **3/3 PASS**.
- Fresh real PostgreSQL 17 full suite: **95/95 PASS, 0 skip**, including in-flight
  Correction/Removal × generation success/failure races, callback lock order,
  populated pending-proposal migration, additional direct SQL validators and
  relabeled foreign projection content rejection at the authorized read boundary.
- Original already-applied `0026` ledger → `0028`: PASS via the real migration
  runner, without rewriting its stored predecessor checksum.
- Full workspace production build: PASS outside the Windows filesystem sandbox.
- Worker runtime startup/shutdown: PASS.
- Desktop + 390×844 Playwright: all **50 individual cases PASS**; Windows
  web-server teardown did not exit naturally and was interrupted after the
  final case. CI must supply the authoritative runner completion result.
- `git diff --check`: PASS.

Independent focused review, G1–G6 integrated review and CI are still required.
This section records repair evidence, not approval. IP-7 and Live Model Spike
remain NOT STARTED.

## Complete reviewer batch: verification and disposition

The follow-up reviewer reported three blockers, four important findings and
one minor finding against the evolving repair worktree. These are the
reviewer's classifications, not a claim that all eight were reachable through
the ordinary authenticated API. The database-boundary findings were checked
against actual SQL/domain behavior before repair; fresh PostgreSQL reproduced
the mixed-script irregular verbs, normalized Han disclosure, malformed Asset
and unsafe-integer discrepancies. The projection payload finding was likewise
reproduced independently. Existing older-baseline findings were deduplicated.

| Finding | Shared-root repair | Verification |
| --- | --- | --- |
| Pending Action/path-switch race; CONFLICT omitted | Action insertion locks Continuity before Branch; application insert paths use the same lock order. Path selection counts every nonterminal Action, including CONFLICT. | Real PostgreSQL blocking graph, both winners; direct SQL CONFLICT switch rejected. |
| Mixed Han/English protected speech | Accepted-profile normalization shared by SQL checks; irregular English verbs are recognized after Han/configured-role subjects. | Domain/SQL differential cases plus bound, successful-attempt proposal inserts rejected. |
| Han punctuation/emoji excluded-fact disclosure | Locale-independent normalization retains accepted Latin/Han letters and digits while separating punctuation, with exact-text fallback. | Normalized predicate cases plus otherwise-valid raw proposal materialization rejected; no head change. |
| Malformed reusable Character Asset | New full document-shape constraint covers required text, array members, stable IDs and allowed keys. | Direct SQL malformed document with correct content hash rejected. |
| Unsafe integer World clock | Authoritative clock bound matches the domain's JavaScript safe-integer range. | Domain/SQL comparison at max-safe, max-safe+1 and large finite values. |
| Head conflict retains ACTIVE proposal | Shared conflict transition rejects ACTIVE proposals in the same transaction. Historical evidence remains. | Correction/old-proposal conflict exposes no live proposal; row remains REJECTED. |
| Legacy fork with NULL request digest | Both normal and concurrent retry lookups reject unbound predecessor keys rather than guessing their request. | Populated prior-schema upgrade then changed-key reuse rejected. |
| Safe Point key reused with changed label/source | Shared retry read compares trimmed label and an explicitly supplied source Commit, including concurrent insert fallback. | Changed label and explicit source rejected; exact duplicate still returns one reference-only Point. |

### Compatibility and intentional limits

- A legacy fork without a request digest cannot prove exact retry identity;
  reusing its old key returns `IDEMPOTENCY_KEY_REUSED`. A new operation needs a
  new key. The original fork and path remain intact.
- Character Asset shape validation is `NOT VALID` for predecessor rows: new
  writes are checked, but migration does not silently rewrite/delete historical
  assets. Revision snapshot capture still enforces active ownership and exact
  source content. Any legacy cleanup requires explicit inspection, not guessing.
- A Safe Point request that omits `commitId` retains the original result across
  head advances. An explicit changed source is rejected; no new durable request
  envelope or truth model was introduced.
- These textual guard repairs align the bounded accepted Latin/Han profile;
  they are not proof of universal semantic privacy/agency enforcement. Real
  model semantic evaluation remains a separate authorized task, not IP-7 work
  started here.
- The cached Return payload remains non-authoritative. The repair binds reads
  to authorized source state/history, rather than attempting to classify every
  arbitrary JSON string inserted through unrestricted database access.

### Final local repair evidence

- Fresh real PostgreSQL 17: **111/111 PASS, 0 skip** across all nine production
  integration suites. After the Safe Point retry follow-up, G5 was rerun:
  **22/22 PASS**, including both changed-request checks.
- Strict typecheck: PASS. Unit/contract/PGlite: **54 PASS**; PostgreSQL-only
  cases skipped in the no-database unit invocation were independently run in
  the real PostgreSQL suite above.
- Full production workspace/API/worker build: PASS.
- Latest format, lint, architecture, migration and runtime results are checked
  before the unified commit. Containers and authoritative browser-runner
  completion must be verified against that commit in Ubuntu CI.

Status: repair candidate, **not independently approved**. Required next step is
focused verification of the complete batch, followed by G1–G6 integrated
review on one fixed commit and its real CI evidence. No IP-7, Live Model Spike,
new production feature, or frozen Prototype behavior change is included.

## Independent closure — 2026-09-15

The candidate status above is the historical pre-review state, not the current
disposition. The same independent Reviewer completed fixed-baseline focused
verification and integrated G1–G6 review on
`eb55734f258fc9be6f4837df888700e34eaa67e2`:

- **G1–G6: PASS; Integrated G1–G6: APPROVED.**
- **0 BLOCKER / 0 IMPORTANT / 0 MINOR.**
- Independent fresh real PostgreSQL: **111/111 PASS, 0 skip**; PGlite migration
  contracts: **3/3 PASS**. Exact predecessor `0026` checksum compatibility and
  arbitrary-checksum refusal were independently exercised.
- [Exact-commit CI run 34981973475](https://github.com/henryz78/Simulora/actions/runs/34981973475):
  Ubuntu migration, quality/build/runtime, real PostgreSQL, API/worker container
  smoke and desktop / 390×844 E2E all succeeded.

The [complete independent report](G1-G6-FINAL-INTEGRATED-REVIEW.md) retains the
original report and coverage limits. The
[current implementation handoff](IMPLEMENTATION_STATUS_HANDOFF.md) records the
approved behavior baseline separately from subsequent documentation commits.

The known in-scope findings are closed. Bounded textual guard coverage is not a
claim of universal model semantics or release readiness. IP-7 and the proposed
Live Model / Product Reality Spike remain **not started** and require separate
user authorization. No frozen Product/System/Experience or Prototype behavior
is modified by this documentation closure.
