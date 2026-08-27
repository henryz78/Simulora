# Phase-4 · Corrected status report

Updated: 2026-08-24 (Asia/Shanghai)

## Provenance correction

The first Phase-4 attempt was performed only inside the main Codex Agent's browser contexts, which both hydrated to Account A. The project's real Account B and Guest contexts belonged to the user's external Tencent Marvis Agent and were never expected to be visible inside Codex. Accordingly, the earlier statement that all three project experiments were `BLOCKED` was incorrect.

EVD-0178 is retained only as `CODEX_LOCAL_SESSION_ISOLATION`; it must not be used as evidence that Account B/Guest were unavailable to the project.

## Final status of the three targets

1. App `test-app-first-publish-001`: EVD-0179 preserves the earlier external 404 state. After owner downlist→republish, EVD-0190 verifies Guest/B direct URL and hard reload recovered, while Market/Search remained empty. External lifecycle delta closed; exact backend/index cause remains `UNKNOWN`.
2. Link-visible Collection `test-collection-001-g6wi`: EVD-0191 verifies Guest/B direct read and member access, canonical Share, directory/Search omission and absence of owner controls. Link-visible enforcement closed; only-me remains `UNKNOWN`.
3. Remix-disabled World `test-template-world-001-fv99`: EVD-0192 verifies Guest/B enforcement and no child creation. Known external enforcement closed; direct undocumented route/existing-descendant exceptions remain `UNKNOWN`.

Final source: `docs/research/external/marvis/phase-3/raw/FINAL_RECHECK_001.md`. The assigned external Marvis recheck is complete and no further Marvis action is pending.

No report may infer that the external Marvis account is unavailable merely because Codex cannot access its browser session.
