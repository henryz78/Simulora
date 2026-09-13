-- Bind an idempotency key to the complete canonical request, not only to the
-- actor/branch/key uniqueness tuple. Legacy rows remain nullable and are
-- checked against their stored identity fields by the repository.

alter table simulora.actions
  add column if not exists idempotency_request_digest text;

alter table simulora.actions
  drop constraint if exists actions_idempotency_request_digest_check;

alter table simulora.actions
  add constraint actions_idempotency_request_digest_check
  check (
    idempotency_request_digest is null
    or idempotency_request_digest ~ '^[0-9a-f]{64}$'
  );

comment on column simulora.actions.idempotency_request_digest is
  'Canonical request binding for safe retry; a reused key with a different payload is rejected.';
