# Deployment foundations

IP-1 contains vendor-neutral container definitions and local dependency composition only. There is no formal staging or production environment, cloud selection, region, DNS, release or deployment in this phase.

- `local/compose.yaml` — local PostgreSQL and S3-compatible MinIO.
- `containers/` — production-shape build definitions for later review.

Cloud-specific infrastructure begins only after the later vendor/region decision Gate.
