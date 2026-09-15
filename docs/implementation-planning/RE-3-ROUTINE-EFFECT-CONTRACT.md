# RE-3 Routine Effect / No-Change Comparison — Proposed Contract

**PROPOSED / NOT IMPLEMENTED / AWAITING APPROVAL**.
This translates frozen Domain §5.5 and Runtime §6–§8 into a small comparison.
It does not replace the roadmap, authorize IP-7 or enable production live execution.
Input evidence: [RE-2 actual results](RE-2-CONTEXT-REALITY-CHECK.md) and
[product direction guardrails](PRODUCT_DIRECTION_GUARDRAILS.md).

## 1. Question and smallest effect

Can a selected NPC perform a meaningful, causal scene action without requiring
the player to confirm an unrelated canonical fact rewrite?

Recommend one closed operation: **MOVE_CHARACTER**, a selected non-user Character
moving between two already declared, public locations on one pre-approved safe
route. For example, Tavi walks from the observatory to the sheltered east lookout
to inspect the approach. It does not move/invite a ship or move the player.
The current seed has only one location: use a separate synthetic two-location
World Revision, not silent edits to approved production worlds or creator UI.

Required typed fields: selected Character ID, before/after location IDs and
authorized causal source references. The request, compiled context and proposal
bind the same expected head, actor and versioned server-owned route policy.
The model supplies a proposal, never an impact label or permission grant.

The allow-list must identify explicit NPC IDs, public locations and permitted
routes in that pinned fixture revision. A name comparison cannot prove that a
Character is not the user's avatar; prose descriptions cannot grant route access.
Do not treat absence of an avatar field as authorization. Production support for
arbitrary user worlds remains out of scope until that durable policy/identity
mapping is specified. Record this bounded policy and version transition in a
successor ADR before implementation, rather than a hidden fixture bypass.

## 2. Closed L2 acceptance

The server accepts only one changed location on the selected allowed NPC, with
exact prior location, valid destination/route, authorized causal references and
an active Branch/head. No automatic L3 downgrade or partial acceptance of mixed
operations. A world/safety boundary may raise impact or reject the candidate.

- Direct: movement must respond to explicit user input or its necessary immediate
  consequence; no optional unsolicited initiative.
- Guided: permit that same bounded scene response/initiative during the active turn.
- World-active: only an active user-triggered cycle; no off-session scheduler.
- Open-ended/Goal-framed remains an independent axis. No operation changes either
  axis, objective definitions, permission or consent.

No user-avatar action, fact rewrite/removal, knowledge/visibility grant, resource
transfer, protected relationship commitment, deletion, new location/Character,
Revision adoption or external action. Existing L3 UPDATE_CANONICAL_FACT and direct
Correction/Removal retain exact confirmation; they are not combined with L2 here.

Any `currentState` location description must be updated deterministically by the
server to match the move, not left claiming the old location or freely authored
by the model. No arbitrary Character status rewrite is included.

Validated L2 may append using the existing authoritative transaction: one Action
terminal, Commit, State Revision, causal Domain Event, attributed history and
Branch head. Preserve canonical facts byte-for-byte and all non-allowed sections.
Use existing successful-turn clock bookkeeping, with no invented elapsed duration.
Expose the changed location and source/scope through current state/trace/Return;
it is not a model-stream success. Freshness, stale head, fencing, cancellation,
duplicate delivery and effective-once guarantees remain the G3/G6 guarantees.

Recovery Point snapshots include Character location under existing G5 membership.
Fork preserves original; Restore appends from the selected snapshot without
changing participation/ownership or other branches. Do not invent Branch merge
or a new ledger. Provide a record-bound explanation/recovery path; do not present
fact-only Correction as an implemented Character-location editing capability.

## 3. No-world-change comparison

For this experiment, a refusal, question or advice-only response is explicitly
**uncommitted generated output (L0)**. Proposed result variant: NO_WORLD_EFFECT,
with attributed narrative and zero state operations. No forced rewrite of the
beacon fact, no canonical Commit/State Revision/Event, no clock/head advance and
no committed-history claim. Retain diagnostic/output provenance on the existing
generation-attempt store, subject to existing privacy rules.

Use the existing isolated runner to show that result and explicitly cancel its
test Action, labelled `No world change recorded; response not committed`.
That is an honest bounded comparison, **not** a finished production conversation
loop. Do not silently turn CANCELLED into successful durable dialogue or inject
this output into committed conversation context.

Whether ordinary advice-only exchanges should become remembered committed
dialogue is an additional product/durable-semantics decision. RE-3 must not decide
it accidentally through a fabricated fact UPDATE. If approved later, specify its
Action terminal, history/clock/head and source boundaries in a separate ADR;
there must still be one authoritative ledger. This remains a known bridge to the
long-lived AI World goal, not a justification to call the final product complete.

## 4. Acceptance and experiment

Before live calls: real PG fresh/prior-schema rehearsal, app/SQL impact parity,
raw SQL attacks, actor/head/policy binding, stale/duplicate/cancel/concurrency,
facts/participation unchanged, fork/Restore membership, current projections and
desktop/390×844. No activation via deployment preference or model-proposed policy.

Then isolated same-model scenarios: selected Tavi causal move and next scene;
Iora refusal/advice with NO_WORLD_EFFECT; identical advice must not become an L3
fact rewrite. Attack player movement, private destination, unknown route, mixed
protected effects and stale review. Report raw failures/no-effects, latency and
confirmation burden separately from database success. No user call-count ceiling;
use a finite useful corpus and stop at provider limits without endless retries.

After focused independent review, do a small **human/browser live play** comparison
with the current context and these effects. That is the next opportunity to judge
actual feel; neither deterministic replay nor 54 existing browser tests proves it.
Two Characters plus one movement are still not a complete magic-world simulation
or long-term qualification. Expand only when observed play demonstrates a missing
causal capability, not by reopening every frozen contract.

Next approval sought: this bounded effect/no-effect contract and its policy ADR;
RE-3 code, full RE-4 and IP-7 have not started.
