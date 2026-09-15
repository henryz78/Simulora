# RE-2 — Authorized Context / Explicit Character Selection

**State:** `IMPLEMENTED / LOCAL CHECKS PASS / INDEPENDENT REVIEW PENDING`.
**Date:** `2026-09-15`. This is implementation evidence, not independent approval.

## Scope and baseline chain

- Historical G1–G6 approval: `eb55734f258fc9be6f4837df888700e34eaa67e2`.
- Approved RE-1 behavior: `7d668daa64f1b579eec0196c16f2500f255169ab`.
- Documentation closure and direction guardrails: `9b2ed881da9e4f3dcf08e71e5237b851d6d46f7d`.
- RE-2 candidate: the subsequent implementation commit containing this report,
  migration `0029_re2_authorized_generation_context.sql` and its tests. Resolve
  that commit from Git; documentation-only descendants are not behavior approval.

The user authorized RE-2 after accepting RE-1's independent result. This does not
authorize RE-3 effects, RE-4 live/human execution, IP-7, unattended simulation or a
production provider switch. No credentials were used and no live calls occurred.
Frozen Product/System/Experience and the approved Prototype were not changed.

## Chosen contract and implementation

### Explicit Character targeting

Ordinary Action accepts an optional stable `targetCharacterId`. It is stored in
the existing immutable `operation_payload`, included in request digest and
idempotency identity, and returned with the durable Action. Same-key exact retry
recovers the original Action; changing the Character with that key is refused.
The native web selector submits the same identity and preserves it during
lost-ACK retry. Omission preserves the legacy automatic selection policy; it
does not mean that a model may choose arbitrary identities or knowledge grants.

Both repository and PostgreSQL insert guard require the selected Character to
exist in the pinned World/current runtime and know the current supported target.
Ordinary payload cannot smuggle participation or other authority fields. Worker,
proposal evidence and confirmation all resolve the same selected Character from
the fixed expected head. Attribution/output guards remain in force.

### Source-bound context

`simulora.re2_generation_context(action_id)` is the shared SQL compiler used by
worker preparation and durable proposal-evidence validation. It reads immutable
World Revision and source-head State Revision, not a second world-state store.
Its output contains:

1. Participation, user role, immutable World/current interaction boundaries.
2. World title/premise, definitions of locations/interaction paths, explicitly
   history-only starting background.
3. Source-head clock, authorized ACTIVE facts and selected runtime location.
4. Selected Character identity, motives, stance, runtime state and relationships.
5. Up to ten same-Branch ancestor Commit references, SHARED Event metadata and
   eligible committed conversation entries; history is explicitly `historyOnly`.

Source metadata binds Branch/head/State Revision and World Revision IDs/digests.
Sealed generation evidence uses `re2-context-v1` plus SHA-256
`sourceContextDigest`. The database recomputes the context and exact manifest;
an invented digest cannot authorize a proposal. Generator fact payloads now carry
only id/statement/scope, not raw ledger provenance or lifecycle.

Authorization precedes inclusion. ACCOUNT_PRIVATE facts are excluded even if an
authored knowledge list names them. Other Characters' undeclared facts are
excluded. Conversation requires the same Character attribution, a succeeded
committed ordinary Action, and previously included facts still authorized at the
current head. Correction/Removal/Restore stop older raw conversation from crossing
that boundary. Pending/cancelled output, raw event payloads, model reasoning,
account state and unscoped arbitrary JSON are not input sources.

Context is bounded to 48,000 canonical JSON bytes; the complete generator request
has a separate 64,000-byte limit. Budget/privacy failure does not call the model:
the acknowledged Action becomes `FAILED_RECOVERABLE` with
`AUTHORIZED_CONTEXT_UNAVAILABLE`, remains visible and can be cancelled. It does
not clear the Action or manufacture a successful world mutation. These are byte
limits, not provider token-budget qualification.

### Upgrade and authority continuity

Existing automatic `ip6-context-v1` sealed proposals remain valid. Explicit
targeting requires the new evidence form. Existing Actions retain their immutable
identity and no old migration is rewritten. Predecessor-schema rehearsal helpers
use legacy context when the new SQL function has not yet been installed; the
fully migrated runtime uses the new compiler. Migration runner/checksums and all
head/lease/attempt fencing remain unchanged.

UPDATE_CANONICAL_FACT remains the only ordinary Action effect. Exact L3
confirmation, actor/digest/expected-head binding, atomic Commit/State/Event/
history/head, duplicate handling, stale refusal and Recovery membership are not
relaxed. Deterministic production generation still ignores richer context; the
existing generator seam exposes it for later authorized experiments, not as proof
of actual model grounding or a production live connection.

## Validation evidence

Local Node 24 / real PostgreSQL 17 on localhost, synthetic disposable databases:

| Verification | Result |
| --- | --- |
| Explicit real PostgreSQL full suite | **117/117 PASS, 0 skip**, final new database |
| Character/Participation suite within it | **37/37 PASS** |
| G3 Action/lease, G4 adversarial/Return, G5 Recovery | All included and PASS |
| Real prior-schema migration/proposal-evidence retirement | PASS within full suite |
| Format, lint, typecheck, architecture, 29-migration check | PASS |
| Default unit/PGlite suite | **55 PASS / 116 DB-dependent skips**; explicit PG above is separate |
| Production workspace/API/worker build and runtime startup/shutdown | PASS |
| Full Playwright: desktop Chromium and touch 390×844 | **54/54 PASS** |
| `git diff --check` | PASS |
| Fresh local Docker/container smoke | NOT RUN; local Docker unavailable |
| Candidate GitHub CI | PENDING at handoff; do not inherit predecessor CI success |
| New live calls / human play qualification | NOT RUN / NOT AUTHORIZED |

New probes cover two selected Characters with distinct CONTINUITY_PRIVATE
knowledge, malformed account-private allow-list exclusion, absent and present-but-
ungranted targets through application and raw SQL, immutable target identity,
changed-target retry refusal, source digest and invented-digest refusal, obsolete
pre-correction dialogue filtering, budget failure with zero generator calls, exact
confirmation and browser lost-ACK target/idempotency binding.

During development, one G4 assertion failed because it expected internal ledger
provenance/lifecycle in model input. Its corrected statement was already right.
The assertion now requires the exact minimized id/statement/scope object; checks
that corrected/removed canonical state and public projections remain correct were
retained and passed. An initial compiler SQL alias ambiguity was fixed before the
final fresh-database run. Neither failure is omitted or counted as a passed run.
An earlier focused browser helper hung during teardown; the final full run reused
an explicitly started local Vite server and completed normally, 54/54, exit 0.

## Known ceilings / next independent review

- First ACTIVE SHARED fact remains the supported mutation target. A Character
  without knowledge of it cannot perform a different supported ordinary effect;
  this is refused, not silently redirected. The two-Character test proves distinct
  identity/knowledge, not flexible scene targeting or whole-world simulation.
- Raw `openThreads: string[]`, arbitrary entities/custom state/resources and
  unscoped objectives are not upgraded into authorized current knowledge. They
  lack sufficient source/scope semantics for safe general retrieval. History tail
  is deliberately conservative, not relevance search or durable derived memory.
- Whole-context lexical disclosure checks can reject legitimate overlapping text;
  they cannot prove general semantic secrecy. Over-budget context is not ranked
  or summarized. Neither ceiling is solved by silently bypassing the guard.
- Current location is selected-character-local. World definitions are background,
  not a complete current scene synthesis. No multi-character parallel response,
  director control, new effect type or reduced confirmation burden was implemented.
- No fresh model-quality, rich causal evolution, long-lived play, provider-token,
  production auth/deployment or release-readiness claim follows from these tests.

Independent RE-2 Review should verify targeting/authorization/digest/history/
budget failures from code and PostgreSQL, full G3/G4/G6 regression, G5 pending-
Recovery and append-only invariants, G1/G2 build/authority and exact-SHA CI/browser
evidence. Self-tests do not replace that review. Preserve RE-1 and G1–G6 approvals
as scoped historical decisions. Stop for review; RE-3/RE-4/IP-7 remain not started.
