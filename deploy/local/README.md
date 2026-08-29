# Local dependencies

The production workspace expects PostgreSQL and an S3-compatible object store. For local development:

```text
copy .env.example .env.local
pnpm local:up
pnpm db:migrate
pnpm dev
```

`pnpm local:up` requires Docker Compose. The services bind only to loopback and use development-only credentials. Do not reuse them outside local development.

IP-1 does not create World, Continuity or Action tables. `0001_foundation.sql` establishes migration metadata only.
