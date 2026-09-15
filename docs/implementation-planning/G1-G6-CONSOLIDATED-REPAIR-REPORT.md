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
