# IP-5 Recovery Execution Plan

Status: implementation authorized; Gate G5 remains independent and not self-approved.

## Contract

- A Recovery Point is a label/reference to an existing Commit. Deleting its label never deletes the Commit or State Revision.
- A Branch fork creates a new Branch, immutable copied State Revision and `BRANCH_FORK` Commit in one PostgreSQL transaction. The source Branch bytes, head and history are not updated.
- A Restore proposal names one source Commit, the exact included/excluded state sections, a before/after diff, a digest and the expected current Branch head.
- Exact confirmation is actor-, digest- and expected-head-bound. A stale head writes no Commit, State Revision, Event or Branch-head update.
- A successful Restore appends `RESTORE_COMMITTED` plus a new State Revision and Event. It never truncates history and never changes participation, interaction boundaries, account rights, consent, ownership, grants, usage, exports or other Branches.
- Recovery navigation reads the same durable pending Action projection used by World/Return/Context; leaving a surface does not clear an Action.

## Scope

IP-5 includes repository, API contracts/routes, minimal Recovery surface, PostgreSQL concurrency/authorization tests and desktop/mobile coverage. It excludes IP-6 participation/character work, IP-7 Studio production work, live models, destructive rewind and branch merge.

## Evidence

`IP-5-G5-TEST-MATRIX.md` records the acceptance cases. G5 is not approved by this implementation commit; an independent reviewer must verify the evidence.
