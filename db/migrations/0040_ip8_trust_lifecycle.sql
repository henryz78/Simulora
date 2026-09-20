-- IP-8 closes the trust/lifecycle envelope without changing World truth.

update app_meta.foundation_metadata
set value = jsonb_set(value, '{phase}', '"IP-8"'::jsonb)
where key = 'implementation_phase';

create table simulora.account_consents (
  id uuid primary key,
  account_id uuid not null references simulora.accounts(id),
  consent_type text not null check (consent_type in ('TERMS', 'PRIVACY', 'CONTENT_BOUNDARIES')),
  version text not null check (length(trim(version)) > 0),
  scope text not null check (scope in ('ACCOUNT', 'WORLD')),
  decision text not null check (decision in ('GRANTED', 'WITHDRAWN')),
  updated_at timestamptz not null default now(),
  unique (account_id, consent_type, version, scope)
);

create index account_consents_account_idx
  on simulora.account_consents(account_id, updated_at desc);

create table simulora.product_changes (
  id uuid primary key,
  version text not null unique,
  category text not null check (category in ('CAPABILITY', 'POLICY', 'MODEL')),
  summary text not null check (length(trim(summary)) > 0),
  effect text not null check (length(trim(effect)) > 0),
  recovery text not null check (length(trim(recovery)) > 0),
  published_at timestamptz not null default now()
);

insert into simulora.product_changes (id, version, category, summary, effect, recovery)
values (
  '00000000-0000-4000-8000-000000000040',
  'IP-8-TRUST-LIFECYCLE-V1',
  'CAPABILITY',
  'Trust and lifecycle controls are now explicit and reviewable.',
  'Access explanations, zero-cost usage reservations, selected-scope export, deletion tombstones, and appeals are available; staged import and sharing remain deferred.',
  'Review the resource explanation, export manifest, deletion status, or appeal state before retrying a blocked operation.'
)
on conflict (version) do nothing;

create table simulora.appeals (
  id uuid primary key,
  account_id uuid not null references simulora.accounts(id),
  idempotency_key text not null,
  request_digest text not null check (request_digest ~ '^[0-9a-f]{64}$'),
  reason_code text not null check (reason_code in ('ELIGIBILITY', 'CONSENT', 'ACCESS', 'DELETION', 'OTHER')),
  subject_type text not null check (subject_type in ('ACCOUNT', 'WORLD', 'CONTINUITY', 'CHARACTER_ASSET')),
  subject_id uuid,
  summary text not null check (length(trim(summary)) > 0),
  status text not null check (status in ('OPEN', 'UNDER_REVIEW', 'RESOLVED', 'REJECTED')),
  recovery_state text not null check (recovery_state in ('REVIEW_PENDING', 'REVIEWABLE', 'CLOSED')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (account_id, idempotency_key)
);

create index appeals_account_idx on simulora.appeals(account_id, created_at desc);

create table simulora.governance_audit_events (
  id uuid primary key,
  actor_account_id uuid references simulora.accounts(id),
  event_type text not null,
  resource_type text not null,
  resource_id uuid,
  purpose text not null,
  outcome text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index governance_audit_resource_idx
  on simulora.governance_audit_events(resource_type, resource_id, created_at desc);

create table simulora.usage_quotes (
  id uuid primary key,
  account_id uuid not null references simulora.accounts(id),
  action_profile text not null check (action_profile in ('WORLD_TURN', 'EXPORT')),
  policy_version text not null,
  cost_mode text not null check (cost_mode = 'ZERO_COST_TEST'),
  units integer not null check (units = 0),
  status text not null check (status in ('ISSUED', 'EXPIRED')),
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index usage_quotes_account_idx on simulora.usage_quotes(account_id, created_at desc);

create table simulora.usage_reservations (
  id uuid primary key,
  quote_id uuid not null references simulora.usage_quotes(id),
  account_id uuid not null references simulora.accounts(id),
  action_key text not null,
  status text not null check (status in ('RESERVED', 'SETTLED', 'RELEASED')),
  units integer not null check (units = 0),
  created_at timestamptz not null default now(),
  unique (account_id, action_key)
);

create table simulora.usage_ledger (
  id uuid primary key,
  reservation_id uuid not null references simulora.usage_reservations(id),
  account_id uuid not null references simulora.accounts(id),
  entry_type text not null check (entry_type in ('SETTLEMENT', 'RELEASE')),
  units integer not null check (units = 0),
  created_at timestamptz not null default now(),
  unique (reservation_id, entry_type)
);

create table simulora.export_jobs (
  id uuid primary key,
  account_id uuid not null references simulora.accounts(id),
  world_id uuid not null references simulora.worlds(id),
  idempotency_key text not null,
  selected_scopes jsonb not null,
  omitted_scopes jsonb not null,
  status text not null check (status in ('PENDING', 'READY', 'FAILED', 'REVOKED')),
  schema_version integer not null check (schema_version = 1),
  artifact_key text,
  checksum text check (checksum is null or checksum ~ '^[0-9a-f]{64}$'),
  manifest jsonb,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  unique (account_id, idempotency_key)
);

create index export_jobs_account_idx on simulora.export_jobs(account_id, created_at desc);

create table simulora.deletion_proposals (
  id uuid primary key,
  account_id uuid not null references simulora.accounts(id),
  target_type text not null check (target_type in ('WORLD', 'CHARACTER_ASSET')),
  target_id uuid not null,
  digest text not null check (digest ~ '^[0-9a-f]{64}$'),
  affected jsonb not null,
  status text not null check (status in ('ACTIVE', 'COMPLETED', 'EXPIRED', 'CANCELLED')),
  expires_at timestamptz not null,
  tombstoned_at timestamptz,
  confirmation_idempotency_key text,
  purge_status text not null check (purge_status in ('NOT_STARTED', 'QUEUED', 'RETAINING_MINIMAL_AUDIT')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index deletion_confirmation_idempotency_idx
  on simulora.deletion_proposals(account_id, confirmation_idempotency_key)
  where confirmation_idempotency_key is not null;

create index deletion_proposals_account_idx on simulora.deletion_proposals(account_id, created_at desc);

alter table simulora.continuities drop constraint continuities_status_check;
alter table simulora.continuities
  add constraint continuities_status_check
  check (status in ('INITIALIZING', 'ACTIVE', 'TOMBSTONED'));

create function simulora.reject_tombstoned_world_authoring() returns trigger
language plpgsql as $$
declare
  target_world uuid;
begin
  if tg_table_name = 'world_access_grants' then
    if new.status = 'REVOKED' then
      return new;
    end if;
  end if;
  if tg_table_name in ('world_drafts', 'world_revisions', 'world_access_grants') then
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

create trigger world_drafts_block_tombstoned_world
before update on simulora.world_drafts
for each row execute function simulora.reject_tombstoned_world_authoring();

create trigger world_revisions_block_tombstoned_world
before insert on simulora.world_revisions
for each row execute function simulora.reject_tombstoned_world_authoring();

create trigger continuities_block_tombstoned_world
before insert or update of world_revision_id on simulora.continuities
for each row execute function simulora.reject_tombstoned_world_authoring();

create trigger world_grants_block_tombstoned_world
before insert or update on simulora.world_access_grants
for each row execute function simulora.reject_tombstoned_world_authoring();

create function simulora.reject_tombstoned_world_action() returns trigger
language plpgsql as $$
begin
  if exists (
    select 1
    from simulora.continuities continuity
    join simulora.world_revisions revision on revision.id = continuity.world_revision_id
    join simulora.worlds world on world.id = revision.world_id
    where continuity.id = new.continuity_id and world.deleted_at is not null
  ) then
    raise exception 'World is tombstoned; new Action is blocked';
  end if;
  return new;
end;
$$;

create trigger actions_block_tombstoned_world
before insert on simulora.actions
for each row execute function simulora.reject_tombstoned_world_action();

create function simulora.reject_tombstoned_world_commit() returns trigger
language plpgsql as $$
begin
  if exists (
    select 1
    from simulora.branches branch
    join simulora.continuities continuity on continuity.id = branch.continuity_id
    join simulora.world_revisions revision on revision.id = continuity.world_revision_id
    join simulora.worlds world on world.id = revision.world_id
    where branch.id = new.branch_id and world.deleted_at is not null
  ) then
    raise exception 'World is tombstoned; new Commit is blocked';
  end if;
  return new;
end;
$$;

create trigger world_commits_block_tombstoned_world
before insert on simulora.world_commits
for each row execute function simulora.reject_tombstoned_world_commit();

create trigger governance_audit_events_immutable
before update or delete on simulora.governance_audit_events
for each row execute function simulora.reject_immutable_change();

create trigger usage_ledger_immutable
before update or delete on simulora.usage_ledger
for each row execute function simulora.reject_immutable_change();
