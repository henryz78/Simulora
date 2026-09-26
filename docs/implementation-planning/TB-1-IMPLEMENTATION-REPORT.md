# TB-1 Committed Outcome Context: Implementation Report

**Date:** 2026-09-26 · **Contract:**
[TB-1 contract](TB-1-COMMITTED-OUTCOME-CONTEXT-CONTRACT.md) ·
**Decision:** [ADR-TB1](TB-1-COMMITTED-OUTCOME-CONTEXT-ADR.md) (owner chose
option A on 2026-09-25) · **Behavior SHA:**
`fd4b44449d6dc7415007950b7a5245ac972e64cd` · **Evidence:** exact-SHA CI
`36225725632` `success` · **Review:** pending (new independent Reviewer, which
also covers the track B gateway fixes).

## 1. Commits

| Commit | Kind | What | CI |
|---|---|---|---|
| `e269364` | behavior | Gateway: a profile may declare the model name its provider answers with | `36223815271` success |
| `9ca1fdb` | behavior | Gateway: that name is recorded in the profile digest but is not a material change | `36223922224` success |
| `6f44524` | behavior | Gateway: an empty HTTP 200 (`choices` null or empty) is `ProviderUnavailableError` | `36224408355` success |
| `fb531b8` | docs | TB-1 contract and ADR-TB1 | — |
| `e0c8b9c` | behavior | Successor 0051, prompt version 7, tests | `36225204723` **failure** (§4) |
| `fd4b444` | behavior | Successor 0052: epoch from the migration ledger; test update | `36225725632` success |

## 2. What changed

- **0051** keeps the RE-2 compiler as `re2_generation_context_pre_tb1` and
  wraps it. The wrapper returns the earlier context unchanged plus
  `committedOutcomes`: for each recent commit on the path (the same walk as
  RE-2: at most 10 commits, stopping at a Restore or correction boundary),
  oldest first:
  - `events`: the SHARED Event text of a transformed attempt, thread opened or
    resolved, relationship shift or movement (`simulora.tb1_event_text`);
  - `exchange`: the committed conversation of that turn, only when the
    generating attempt's `includedFactIds` are all visible to this Character
    (its own facts plus ACTIVE SHARED facts).
  - Any text that quotes a fact outside the visible set is dropped, using the
    existing `generated_output_references_excluded_fact`.
  - The oldest items are dropped while the context exceeds the RE-2 48,000
    byte bound.
- **0052** replaces 0051's epoch table with
  `simulora.tb1_outcomes_apply(created_at)`: outcomes apply to Actions created
  at or after the ledger's `applied_at` for 0051. Actions created before the
  upgrade keep the earlier context, so their pending evidence still validates.
  Without a ledger (schema-only checks) the gate is open. The table is dropped.
- **Live prompt version 7:** one rule to stay consistent with
  `context.committedOutcomes`, and that the Character knows only its supplied
  facts and what it witnessed.
- **Unchanged:** the evidence validator (it recomputes the digest through the
  same function), the fact knowledge rule, output guards, effect types, UI.

## 3. Evidence (CI `36225725632` on `fd4b444`, real `postgres:17`)

- **Migrations:** 0051 and 0052 apply to an empty schema and are idempotent
  on rerun.
- **Upgrade rehearsal** from the approved release `c812d6c` and rollback by
  restore: the only allowed difference, `app_meta.schema_migrations`, is the
  only one.
- **`test:postgres`:** 178/178 (175 + 3 TB-1).
- **IP-5 suite:** 309/309, including IP-6, RE-3, MGC-1 and SA-2.
- **Real stack:** 10/10. **Browser matrix:** 210 passed.

TB-1 cases (`tests/integration/tb1-committed-outcomes.test.ts`):

1. On the same Action, the new context equals the earlier one plus
   `committedOutcomes`. Iora, who lacks Tavi's private fact, is told Tavi's
   transformed attempt, but not Tavi's exchange (generated with the private
   fact) nor the resolution that quotes it. Tavi is told all of it, including
   the exchange.
2. A proposal generated with outcomes confirms against its recorded evidence.
3. The gate is closed for an Action created before 0051 was applied and open
   after, and the epoch table is gone.

## 4. The first CI failure

`e0c8b9c` failed the upgrade rehearsal with
`differs: app_meta.schema_migrations, simulora.tb1_outcome_context_epoch`: the
upgraded copy and the one restored and migrated again each inserted their own
`now()`, so the epoch differed. The rehearsal allows only the ledger to
differ. 0052 reads the epoch from the ledger itself. It is PL/pgSQL with a
`to_regclass` guard, because a SQL-language body is checked at create time and
the schema check runs without the ledger.

## 5. Local replay (track B, not evidence)

On the local PGlite play database migrated to 0052 with the owner's provider,
action 4 of track B was sent again ([report §3.6](TRACK-B-LOCAL-LIVE-PLAY-REPORT.md)).
The context carried the committed outcomes; one reply was refused by the
agency guard, and the next was a consistent L3 fact change, confirmed in the
UI with the SQL evidence check passing.

## 6. Notes for review

- The contract's "the epoch cannot be changed" now rests on the migration
  ledger row, which has no immutability trigger. Changing it would need a
  direct write to `app_meta.schema_migrations`.
- Outcome and exchange text passes the whole-statement fact check only; a
  paraphrase of a private fact is not detected, as in RE-2.
- The answering name is excluded from materiality both in the pure function
  and in the worker's rebuilt previous profile.

## 7. Not claimed

- Human play, beta, launch or production live model use.
- Any provider approval.
- Closure: TB-1 and the gateway fixes close only on an independent PASS.
