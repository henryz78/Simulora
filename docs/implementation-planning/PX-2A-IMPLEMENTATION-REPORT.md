# PX-2a Quick Play and Player-Owned Actions: Implementation Report

**Date:** 2026-09-26 · **Contract:**
[PX-2a contract](PX-2A-QUICK-PLAY-CONTRACT.md) · **Decision:**
[PX-2](PX-2-PROPOSED-ADRS.md) D1 A and D2 A · **Approved behavior SHA:**
`275805a` · **Evidence:** exact-SHA CI `36263455824` (`47e2b9e`) and
`36265388855` (`275805a`) `success` · **Review:** new independent Reviewer
(Sonnet 5): `PASS WITH ISSUES` (0B/2I/3M), then `PASS` on the repair.
**PX-2a CLOSED.**

## 1. Commits

| Commit | Kind | What | CI |
|---|---|---|---|
| `79da254` | docs | Contract | — |
| `47e2b9e` | behavior | Quick play, Undo, prompt version 8, tests | `36263455824` success |
| `275805a` | behavior | Review repair: Undo explanation; narrative precedence | `36265388855` success |

## 2. What changed

- **Quick play:** an opt-in setting on the play page, kept per Continuity in
  the browser. While it is on, the player's client sends the exact
  confirmation for an L2 proposal as it arrives; L3 still waits for the
  button. The server's Commit rule is unchanged: every Commit still follows an
  exact confirmation from the player's session.
- **Undo:** the latest committed change, while it is still the head, can be
  undone through the existing Restore endpoints. Undo appends a Commit, so
  history is kept. The button says the story keeps what was said. An undone
  change says so, and its story entry is marked for the session.
- **Player-owned actions:** live prompt version 8 narrates the player's own
  attempt in the second person, in its own sentence. The agency guard is
  unchanged. App and SQL parity cases show it accepts this shape and still
  refuses the player's words, choices and commitments.

## 3. Evidence

`275805a`, CI `36265388855`, verified by the Reviewer:

- `test:postgres` 181/181;
- IP-5 311/311;
- stack 10/10;
- browser matrix 230 passed, with the new quick play, Undo and refused-Undo
  cases on all five projects;
- no retries.

## 4. Independent Review

**First round, `PASS WITH ISSUES`.** Verified in code:

- quick play sends only the human-equivalent confirmation, for L2 only;
- corrections are always L3;
- confirm and Restore re-check the head under a row lock, so races and stale
  Undo are refused;
- Restore covers the sections an L2 change touches;
- the prompt bump is a recorded material change.

| # | Finding | Resolution |
|---|---|---|
| I-1 | Undo returns the world but the story still narrates the undone outcome, with no explanation. | `275805a`: explanation on the button and after Undo, and a story mark. Re-review `PASS`. |
| I-2 | Quick play is stored per browser, narrower than D2 A's "like the participation contract". | The owner chose to keep it per browser (2026-09-26). |
| M | Untested paths: manual confirm racing quick play, Undo refused on a moved head, quick play across a reload. | Refused Undo now tested (`275805a`); the others are traced safe and accepted. |

**Re-review of `275805a`: `PASS`**, no new findings. Accepted residual
(MINOR): the undone mark on a story entry is session-only. A durable mark can
come from the existing `STATE_RESTORED` event later.

Also fixed in `275805a`: PX-1 review M1 (history narrative precedence).

## 5. Not claimed

- Human enjoyment of prompt version 8. An Agent-operated live check with `grok-4.7` was
  run later ([Track B §3.7](TRACK-B-LOCAL-LIVE-PLAY-REPORT.md)).
- Human enjoyment.
- Beta, launch or production live model use.
