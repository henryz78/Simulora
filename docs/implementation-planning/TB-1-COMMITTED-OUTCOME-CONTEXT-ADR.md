# ADR-TB1: Committed outcomes in the generation context

**Status:** accepted by the product owner on 2026-09-25 (option A, in chat).
Implemented under TB-1; subject to independent Review.

**Supersedes in part:** the RE-2 history rule in the
[RE-2 Authorized Context Implementation Report](RE-2-AUTHORIZED-CONTEXT-IMPLEMENTATION-REPORT.md),
which requires an earlier conversation to share the addressed Character's
attribution. All other RE-2 rules stand.

## Context

In track B live play, the model contradicted a confirmed outcome. The
[Track B report](TRACK-B-LOCAL-LIVE-PLAY-REPORT.md) §3.4 has the details.

The generation context listed committed turns only as event kinds and IDs.
Text reached the model only as conversation from the same Character's earlier
turns. So when the user addressed another Character, the model was never told
what had happened, although Return showed it.

## Decision

The generation context gains `committedOutcomes`. It lists what already
happened on the path, oldest first, over the same recent-commit walk as the
RE-2 history: at most 10 commits, stopping at a Restore or a correction.

Each item has two parts:

- **SHARED Event text:**
  - a transformed attempt's outcome;
  - a thread opened or resolved;
  - a relationship shift;
  - a Character's movement, with names rather than IDs.
- **The committed exchange:** the user's line and the Character's reply. It is
  included only when every fact used to generate it is known to the addressed
  Character or is SHARED.

**Privacy line.** Text that quotes an active fact which is neither known to the
addressed Character nor SHARED is left out. So `CONTINUITY_PRIVATE` and
`ACCOUNT_PRIVATE` knowledge of other Characters does not pass through outcomes.

**What stays the same:**

- The Character's `knownFacts` and the output guards are unchanged. A proposal
  that quotes a fact the Character does not know is still refused.
- The prompt tells the model to stay consistent with the outcomes, and that the
  Character knows only its facts and what it witnessed. `livePromptVersion` is
  now 7, which is a material profile change.

**Size.** When the context would exceed the RE-2 byte bound, the oldest
outcomes are dropped first. The context no longer fails for that reason.

**Upgrade.** Actions created before the migration keep the earlier context, so
their recorded digest evidence still validates.

## Consequences

- Later turns can build on confirmed outcomes, including ones involving other
  Characters.
- Outcome and exchange text of SHARED commits is now world history for every
  Character.
- This is still not long-term memory: it is bounded to recent commits.
