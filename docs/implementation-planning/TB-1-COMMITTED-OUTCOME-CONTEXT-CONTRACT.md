# TB-1 Committed Outcome Context

**Date:** 2026-09-25 · **Status:** `APPROVED DIRECTION 2026-09-25 — IN
IMPLEMENTATION`.

The product owner chose option A in chat on 2026-09-25, after the
[Track B report](TRACK-B-LOCAL-LIVE-PLAY-REPORT.md) §3.4.

Decision: [ADR-TB1](TB-1-COMMITTED-OUTCOME-CONTEXT-ADR.md). The track closes
only after an independent Review on an exact SHA with green CI.

## Scope

- **Successor migration 0051:**
  - wraps `simulora.re2_generation_context`, keeping the earlier function as
    `re2_generation_context_pre_tb1`;
  - appends `committedOutcomes`;
  - adds an immutable epoch row, so Actions created before the upgrade keep
    the earlier context.
- **Live prompt:** one consistency rule, and prompt version 7.

## Out of scope

- Long-term memory or retrieval beyond the RE-2 walk.
- Changes to what a Character knows as facts.
- Output guards.
- New effect types.
- UI.

## Acceptance (real PostgreSQL)

- On the same Action, the new context equals the earlier one plus
  `committedOutcomes`.
- A Character who does not know a private fact:
  - is told a transformed outcome from another Character's turn;
  - is not told that turn's exchange, when it was generated with the private
    fact;
  - is not told a resolution that quotes the private fact.
- The Character who knows the private fact is told all of it, including the
  exchange.
- A proposal generated with outcomes confirms against its recorded evidence.
- The epoch cannot be changed.
- The existing context suites (IP-6, RE-3, MGC-1, SA-2) and the upgrade
  rehearsal stay green.
