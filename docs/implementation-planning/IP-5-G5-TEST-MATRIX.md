# IP-5 / Gate G5 Test Matrix

| ID | Acceptance | Evidence target |
|---|---|---|
| G5-01 | Safe point references an existing Commit and list/delete-label preserve it | PostgreSQL repository test |
| G5-02 | Fork creates separate active head, lineage and `BRANCH_FORK`; source bytes/head/history unchanged | PostgreSQL transaction test |
| G5-03 | Active Branch selection changes only Continuity current-path pointer | PostgreSQL/API test |
| G5-04 | Restore preview returns exact source, scope, excluded protected fields, diff and digest | repository/API test |
| G5-05 | Exact Restore appends one Commit/State Revision/Event and leaves old rows intact | PostgreSQL test |
| G5-06 | Stale Restore confirmation writes no world mutation and requires a new proposal | concurrent PostgreSQL test |
| G5-07 | Cross-account recovery reads and writes are denied | authorization test |
| G5-08 | Pending Action remains recoverable while Recovery routes are visited | API/E2E test |
| G5-09 | Branch, Restore, Correction and Delete have distinct command/result semantics | contract/E2E test |
| G5-10 | Recovery paths work on desktop and 390x844 without fixed-nav obstruction | Playwright walkthrough |
| G5-11 | IP-2 through IP-4 authority, action and continuity suites remain green | full suite |
| G5-12 | No IP-6/IP-7/live-model implementation enters the production slice | architecture/scope check |
