# RE-3 Bounded Dialogue Evidence Repair

Status: historical implementation checkpoint; successor independently approved
at `ae02de4fe8de261a4164ee6f67c534f8349e1fd5` (PASS, 0/0/0; exact-SHA CI
`35415958261`). The original finding and repair evidence below remain unchanged.

## Finding

The first bounded `NO_WORLD_EFFECT` implementation had a real SQL-boundary gap.
The worker and domain validator bound the response to the selected Character and
authorized causal facts, but the `0034` trigger trusted parts of the durable
generation output and `context_manifest` instead of reconstructing the canonical
context. A direct SQL writer could therefore attempt a forged response source or
manifest, and the recursive dialogue query also discarded a dialogue whose source
head was itself a correction/removal/restore boundary.

## Minimal repair

Migration `0035_re3_dialogue_evidence_hardening.sql` adds a successor SQL
validator and replaces the dialogue trigger. It now:

- reconstructs the `re2_generation_context` digest and exact context manifest;
- requires the deterministic adapter, successful attempt, exact output envelope,
  candidate schema, operation shape, Action/head binding and causal IDs;
- derives the expected `WORLD`/selected `CHARACTER` response source from the
  canonical compiled context rather than trusting generated JSON;
- recomputes the authorized fact allow-list and applies privacy/protected-speech
  checks to narrative and response reason;
- keeps dialogue Action-bound and immutable, with no World Commit or second ledger;
- includes dialogue created at the current boundary head while stopping traversal
  before older pre-boundary history.

The application worker and frozen `COMPLETED_NO_EFFECT` contract are unchanged.

## Verification

- Real PostgreSQL RE-3 suite: 8/8, including forged source/manifest/causal probes
  and post-correction dialogue context.
- Fresh PostgreSQL focused IP-4 + RE-3: 32/32.
- Fresh PostgreSQL full G1–G6/RE-3 suite: **128/128 PASS, 0 skipped** after the
  final migration and timeout adjustment.
- Prior-schema migration rehearsal remains covered; the populated upgrade test
  timeout is now 30 seconds because it creates and migrates an isolated database
  through the complete migration set.
- Desktop + 390×844 Playwright: **62/62 PASS**.
- Workspace unit tests: **63 PASS**; build, runtime, architecture, migration,
  typecheck and lint checks pass. Docker was unavailable locally.
- Independent re-review is required before any live-model corpus.

## Scope

No new effect, provider, production live-model enablement, durable memory system,
IP-7 work, or change to World/Recovery/confirmation authority was introduced.
