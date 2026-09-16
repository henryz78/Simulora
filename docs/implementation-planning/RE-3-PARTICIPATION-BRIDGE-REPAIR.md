# RE-3 Participation Bridge Repair

## Scope

This is a minimal follow-up to the bounded browser live-play report. It does
not start IP-7, enable the production live model, or change the frozen Product,
System, Experience, or Action authority contracts.

## Findings addressed

- The production Action Composer previously omitted the approved
  `requestedEffect` envelope, so browser participation always defaulted to
  `FACT_REWRITE` even when the bounded routine/no-world-effect paths existed.
- A recoverable generation retry was displayed only as “Still working”, which
  was technically true but did not explain that the durable Action remains
  safe to leave and revisit while a bounded retry is pending.

## Repair

- Added a plain-language Desired outcome selector with the three already
  supported effects: change a current world fact, have a selected character
  move, or ask for a response only.
- Included the selected effect in the client submission identity so a changed
  effect cannot reuse a prior in-flight idempotency key. The legacy default
  `FACT_REWRITE` remains omitted from the wire body for compatibility while the
  server contract still applies its existing default.
- If the movement outcome is selected and the character is cleared, the UI
  returns to the safe fact-rewrite default rather than submitting an invalid
  movement request.
- Reworded the recoverable generation status to name the bounded retry and
  preserve the current-truth/no-silent-disappearance explanation.

No database, worker, model gateway, migration, confirmation, or authority
semantics changed.

## Validation

- Prettier formatting and `git diff --check`: pass.
- Web typecheck and production build: pass.
- Full Playwright invocation (desktop plus 390×844 projects): **60/60 pass**,
  including the new requested-outcome and recoverable-retry coverage.
- New E2E checks verify explicit `ROUTINE_EFFECT` and `NO_WORLD_EFFECT` reach
  the existing API contract, use distinct submission identity, and that the
  default legacy body remains unchanged.
- Exact-SHA CI run `35057880397` completed all 185 tests successfully but failed
  because the upgrade-test teardown force-dropped a temporary database while a
  pooled connection was still closing, producing PostgreSQL `57P01` as an
  unhandled Vitest error. The teardown now waits for normal disconnect and
  retries only PostgreSQL `55006` (database still in use), rather than forcibly
  terminating test clients. This changes test cleanup only, not product behavior.

## Remaining limits

This closes the sampled frontend bridge/comprehension gap only. It does not
prove model quality, human enjoyment, durable no-effect dialogue memory, a
multi-character world, autonomous World-active simulation, or the final
WorldOS-like product direction. Those remain bounded future validation work;
IP-7 and production live enablement remain separately authorized decisions.
