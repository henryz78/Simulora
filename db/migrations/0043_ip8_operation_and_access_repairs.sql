-- IP-8 repair: make governance retries durable and keep tombstoned Worlds from
-- accepting a late export insert even if an application check regresses.

create table simulora.consent_operations (
  id uuid primary key,
  account_id uuid not null references simulora.accounts(id),
  idempotency_key text not null,
  request_digest text not null check (request_digest ~ '^[0-9a-f]{64}$'),
  result jsonb not null,
  created_at timestamptz not null default now(),
  unique (account_id, idempotency_key)
);

create index consent_operations_account_idx
  on simulora.consent_operations(account_id, created_at desc);

alter table simulora.usage_quotes
  add column idempotency_key text,
  add column request_digest text;

update simulora.usage_quotes
set idempotency_key = 'legacy-quote-' || id::text,
    request_digest = repeat('0', 64)
where idempotency_key is null;

alter table simulora.usage_quotes
  alter column idempotency_key set not null,
  alter column request_digest set not null;

alter table simulora.usage_quotes
  add constraint usage_quotes_request_digest_check
  check (request_digest ~ '^[0-9a-f]{64}$');

create unique index usage_quotes_account_idempotency_idx
  on simulora.usage_quotes(account_id, idempotency_key);

alter table simulora.deletion_proposals
  add column idempotency_key text,
  add column request_digest text;

update simulora.deletion_proposals
set idempotency_key = 'legacy-deletion-' || id::text,
    request_digest = digest::text
where idempotency_key is null;

alter table simulora.deletion_proposals
  alter column idempotency_key set not null,
  alter column request_digest set not null;

alter table simulora.deletion_proposals
  add constraint deletion_proposals_request_digest_check
  check (request_digest ~ '^[0-9a-f]{64}$');

create unique index deletion_proposals_account_idempotency_idx
  on simulora.deletion_proposals(account_id, idempotency_key);

create or replace function simulora.reject_tombstoned_world_authoring() returns trigger
language plpgsql as $$
declare
  target_world uuid;
begin
  if tg_table_name = 'world_access_grants' then
    if new.status = 'REVOKED' then
      return new;
    end if;
  end if;
  if tg_table_name in ('world_drafts', 'world_revisions', 'world_access_grants', 'export_jobs') then
    target_world := new.world_id;
  elsif tg_table_name = 'continuities' then
    select world_id into target_world
      from simulora.world_revisions where id = new.world_revision_id;
  end if;
  perform 1 from simulora.worlds
    where id = target_world and deleted_at is null
    for share;
  if not found then
    raise exception 'World is tombstoned; authoring mutation is blocked';
  end if;
  return new;
end;
$$;

create trigger export_jobs_block_tombstoned_world
before insert on simulora.export_jobs
for each row execute function simulora.reject_tombstoned_world_authoring();
