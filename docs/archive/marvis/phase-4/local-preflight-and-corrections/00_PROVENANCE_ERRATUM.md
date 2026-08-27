# Phase-4 provenance erratum

## Error corrected

Some earlier Phase-4 text said that “there was no independent Account B or Guest session” and marked three experiments as project-level `BLOCKED`. That wording was too broad and is corrected here.

What was actually observed was narrower:

- The main Codex Agent's local IAB and Chrome contexts were both authenticated as Account A.
- The user's real independent Account B and Guest work was performed in a separate Tencent Marvis application/session, which Codex cannot inspect or claim.
- Therefore Codex's local session limitation cannot be used to negate, block, or replace Marvis's external evidence.

## Correct status after external final recheck

- App `test-app-first-publish-001`: EVD-0179 preserves the earlier downlisted-interval 404; external final EVD-0190 shows Guest/B direct access recovered after republish while discovery/search stayed absent.
- Link-visible Collection `test-collection-001-g6wi`: EVD-0191 verifies Guest/B direct access, discovery omission and stripped management controls.
- Remix-disabled World `test-template-world-001-fv99`: EVD-0192 verifies Guest/B enforcement with surface-dependent hidden/silent/late-block behavior.

Final source: `docs/research/external/marvis/phase-3/raw/FINAL_RECHECK_001.md`. External Marvis's assigned recheck is complete.

The original local preflight files are retained for audit history, but their status is now `CODEX_LOCAL_SESSION_ISOLATION`, not “Account B unavailable” or “project blocked.”
