# Production packages

Packages enforce the modular-monolith boundaries defined by frozen System Design. They are not independent services.

- `contracts` — versioned transport contracts.
- `domain` — pure domain types/invariants for the IP-3 World, Continuity and Action Truth spine.
- `application` — use-case orchestration.
- `database` — PostgreSQL adapter and typed query boundary.
- `jobs` — durable job/outbox ports.
- `model-gateway` — deterministic adapter and future provider port.
- `auth`, `storage`, `config`, `observability` — infrastructure ports and foundations.
- `ui` — production-accessible primitives, not copied Prototype components.
- `testkit` — original synthetic fakes and clocks.
