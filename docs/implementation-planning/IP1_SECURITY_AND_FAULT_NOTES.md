# IP-1 Security and Fault Notes

This is the minimum foundation evidence required before IP-2. It does not define product authorization, Action semantics or a production threat model.

## Threat surface kept in scope

| Surface | Foundation control | Explicit non-goal |
|---|---|---|
| Environment and credentials | Zod configuration, local-only `.env.local`, fail-closed shared/production environments, config redaction | production identity provider and secret manager selection |
| HTTP boundary | Fastify request IDs, structured request logs and package boundary checks | product endpoints and authorization policy |
| Logs and traces | recursive redaction of content, token, cookie, authorization, secret and password fields; circular/error handling | model chain-of-thought or raw prompt storage |
| Database migration | ordered checksums, advisory lock, transaction per migration and migration ledger | product tables, rollback policy for domain data |
| Worker handoff | version-neutral correlation context/work envelope contract | Action jobs and durable product processing |
| Dependency supply chain | frozen lockfile, exact versions, CI install from lockfile | vendor/prod deployment approval |

## Fault foundation

`@simulora/testkit` exposes a deterministic `FaultInjector` and `FakeClock`. They are intentionally generic: a test can fail a named boundary once and then verify recovery without creating World or Action semantics. IP-2 and later phases must use these seams for stale-head, worker retry and commit-recovery tests.

## Review boundary

IP-1 proves that secrets and raw content are not emitted by the foundation logger, that unapproved shared/production modes do not start with development adapters, and that future API-to-worker work can carry correlation metadata. Detailed policy, abuse controls and production identity remain later gated decisions.
