# WD-1a Shared World Contract

**Date:** 2026-09-27 · **Status:** `CLOSED` at `838b36f` ([report](WD-1A-IMPLEMENTATION-REPORT.md)). Owner decision W1 A and W2 A (
[WD-1](WD-1-PROPOSED-DECISIONS.md)). The track closes on an independent Review
of an exact SHA with green CI.

## Successor decisions (supersede in part)

- **ADR-WD1-1: context.** This supersedes the RE-2 authorized-context rule for
  new Actions. A generation context includes every ACTIVE SHARED fact. A
  Character context also adds the non-ACCOUNT_PRIVATE facts that Character
  knows, as before. The lead fact (the first ACTIVE SHARED fact) stays first.
  The rest follow in state order. A fact rewrite (`UPDATE_CANONICAL_FACT`) may
  target any ACTIVE SHARED fact in the context. It stays L3.
- **ADR-WD1-2: `ADD_FACT`.** This extends ADR-018's closed impact table with
  one operation. `ADD_FACT` records one new fact:
  - server-derived id `fact.<actionId>`;
  - SHARED, ACTIVE;
  - provenance `Confirmed Action <actionId>`;
  - its statement, and 1–4 causal facts from the context.

  It changes and removes nothing, so it is **L2**. It commits with a typed
  `FACT_ADDED` Event. Removal, supersession, semantic rewrite and scope
  widening stay L3 as ADR-018 states.

## Scope

1. **Epoch.** Both rules apply to Actions created after migration `0055` is
   applied, read from its immutable ledger row, as TB-1 and PX-2b did. Pending
   and earlier Actions keep their evidence.
2. **Context and evidence.** The application compiler, the SQL context
   (`re2_generation_context`), and the manifest and evidence validators all
   include the same fact ids in the same order.
3. **Requested effect.** "Change something in the world" (`FACT_REWRITE`) now
   allows either a rewrite (L3) or `ADD_FACT` (L2). The model chooses one; the
   server classifies the level. Other envelopes are unchanged.
4. **Guards.** The new statement must not author the user, must not reference
   facts outside the context, and its causes must be in the context.
5. **Play.** An `ADD_FACT` proposal shows "New in the world" and the statement.
   Quick play applies it, and Undo reverses it through Restore.
6. **Prompt version 9.** It covers:
   - all shared facts are listed;
   - prefer `ADD_FACT` for a new detail and a rewrite only when an existing
     fact is no longer true;
   - a no-change result should be a response, not a fact;
   - a World response may voice unnamed people already in the scene. They know
     only shared facts and do not persist.

## Unchanged

- Commit on confirmation (ADR-005). Quick play is still the player's own
  confirmation.
- Restore (ADR-011); the agency and disclosure guards.
- Character private knowledge, and the PX-2b response-source rule.
- Every other operation and its level.

## Acceptance

- **Real PostgreSQL:**
  - A new Action's context and manifest contain every ACTIVE SHARED fact and no
    other private fact.
  - A pre-0055 Action keeps the lead-fact manifest.
  - Application and SQL agree.
  - A rewrite of a non-lead SHARED fact seals and commits as L3.
  - `ADD_FACT` seals as L2 and commits with the new fact and one `FACT_ADDED`
    Event; Restore removes the fact again.
  - Forged variants are rejected: wrong id, non-SHARED scope, wrong
    provenance, L3 label, a cause outside the context, or text that authors the
    user.
  - An upgrade case covers pending pre-0055 proposals.
- **Browser:** an `ADD_FACT` proposal shows the new statement; with quick play
  on it applies at once and Undo is offered.
- **Model gateway:** the compiled prompt is version 9 and carries the new
  rules; the parser accepts `ADD_FACT`.
