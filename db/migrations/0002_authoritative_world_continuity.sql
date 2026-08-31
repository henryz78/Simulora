create schema if not exists simulora;

create table simulora.accounts (
  id uuid primary key,
  eligibility text not null check (eligibility in ('ADULT', 'INELIGIBLE', 'UNKNOWN')),
  created_at timestamptz not null default now()
);

create table simulora.worlds (
  id uuid primary key,
  owner_account_id uuid not null references simulora.accounts(id),
  title text not null,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table simulora.world_drafts (
  world_id uuid primary key references simulora.worlds(id),
  row_version integer not null check (row_version > 0),
  document jsonb not null,
  document_hash text not null check (document_hash ~ '^[0-9a-f]{64}$'),
  updated_at timestamptz not null default now()
);

create table simulora.authoring_validation_runs (
  id uuid primary key,
  world_id uuid not null references simulora.worlds(id),
  draft_row_version integer not null,
  outcome text not null check (outcome in ('VALID', 'INVALID')),
  findings jsonb not null,
  validated_at timestamptz not null default now()
);

create table simulora.world_revisions (
  id uuid primary key,
  world_id uuid not null references simulora.worlds(id),
  revision_number integer not null check (revision_number > 0),
  source_draft_row_version integer not null,
  document jsonb not null,
  document_hash text not null check (document_hash ~ '^[0-9a-f]{64}$'),
  validation_run_id uuid not null references simulora.authoring_validation_runs(id),
  created_at timestamptz not null default now(),
  unique (world_id, revision_number),
  unique (world_id, document_hash)
);

create table simulora.continuities (
  id uuid primary key,
  owner_account_id uuid not null references simulora.accounts(id),
  world_revision_id uuid not null references simulora.world_revisions(id),
  active_branch_id uuid,
  status text not null check (status in ('INITIALIZING', 'ACTIVE')),
  created_at timestamptz not null default now()
);

create table simulora.branches (
  id uuid primary key,
  continuity_id uuid not null references simulora.continuities(id),
  name text not null,
  head_commit_id uuid,
  head_state_revision_id uuid,
  status text not null check (status in ('INITIALIZING', 'ACTIVE')),
  created_at timestamptz not null default now()
);

alter table simulora.continuities
  add constraint continuity_active_branch_fk
  foreign key (active_branch_id) references simulora.branches(id);

create table simulora.world_commits (
  id uuid primary key,
  branch_id uuid not null references simulora.branches(id),
  parent_commit_id uuid references simulora.world_commits(id),
  kind text not null check (kind in ('CONTINUITY_INITIALIZED')),
  actor_account_id uuid not null references simulora.accounts(id),
  state_revision_id uuid not null,
  created_at timestamptz not null default now()
);

create table simulora.state_revisions (
  id uuid primary key,
  branch_id uuid not null references simulora.branches(id),
  commit_id uuid not null unique references simulora.world_commits(id),
  schema_version integer not null check (schema_version = 1),
  document jsonb not null,
  document_hash text not null check (document_hash ~ '^[0-9a-f]{64}$'),
  created_at timestamptz not null default now(),
  unique (branch_id, document_hash)
);

alter table simulora.world_commits
  add constraint world_commit_state_revision_fk
  foreign key (state_revision_id) references simulora.state_revisions(id)
  deferrable initially deferred;

alter table simulora.branches
  add constraint branch_head_commit_fk
  foreign key (head_commit_id) references simulora.world_commits(id);

alter table simulora.branches
  add constraint branch_head_state_revision_fk
  foreign key (head_state_revision_id) references simulora.state_revisions(id);

create table simulora.domain_events (
  id uuid primary key,
  branch_id uuid not null references simulora.branches(id),
  commit_id uuid not null references simulora.world_commits(id),
  event_type text not null,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  unique (commit_id, event_type)
);

create index worlds_owner_idx on simulora.worlds(owner_account_id);
create index revisions_world_idx on simulora.world_revisions(world_id, revision_number desc);
create index continuities_owner_idx on simulora.continuities(owner_account_id);
create index branches_continuity_idx on simulora.branches(continuity_id);
create index commits_branch_idx on simulora.world_commits(branch_id, created_at);

create function simulora.reject_immutable_change() returns trigger
language plpgsql as $$
begin
  raise exception '% is immutable', tg_table_name using errcode = '55000';
end;
$$;

create trigger world_revisions_immutable
before update or delete on simulora.world_revisions
for each row execute function simulora.reject_immutable_change();

create trigger world_commits_immutable
before update or delete on simulora.world_commits
for each row execute function simulora.reject_immutable_change();

create trigger state_revisions_immutable
before update or delete on simulora.state_revisions
for each row execute function simulora.reject_immutable_change();

create trigger domain_events_immutable
before update or delete on simulora.domain_events
for each row execute function simulora.reject_immutable_change();

create function simulora.validate_branch_head() returns trigger
language plpgsql as $$
declare
  commit_branch uuid;
  state_branch uuid;
  commit_state uuid;
begin
  if new.status = 'ACTIVE' and (new.head_commit_id is null or new.head_state_revision_id is null) then
    raise exception 'Active Branch requires Commit and State Revision heads';
  end if;

  if new.head_commit_id is null and new.head_state_revision_id is null then
    return new;
  end if;

  select branch_id, state_revision_id into commit_branch, commit_state
  from simulora.world_commits where id = new.head_commit_id;
  select branch_id into state_branch
  from simulora.state_revisions where id = new.head_state_revision_id;

  if commit_branch is distinct from new.id
     or state_branch is distinct from new.id
     or commit_state is distinct from new.head_state_revision_id then
    raise exception 'Branch head must reference a matching Commit and State Revision on the same Branch';
  end if;
  return new;
end;
$$;

create constraint trigger branch_head_integrity
after insert or update of head_commit_id, head_state_revision_id, status on simulora.branches
deferrable initially deferred
for each row execute function simulora.validate_branch_head();

create function simulora.validate_active_branch() returns trigger
language plpgsql as $$
declare
  owning_continuity uuid;
begin
  if new.status = 'ACTIVE' and new.active_branch_id is null then
    raise exception 'Active Continuity requires an active Branch';
  end if;
  if new.active_branch_id is not null then
    select continuity_id into owning_continuity
    from simulora.branches where id = new.active_branch_id;
    if owning_continuity is distinct from new.id then
      raise exception 'Active Branch must belong to its Continuity';
    end if;
  end if;
  return new;
end;
$$;

create constraint trigger continuity_active_branch_integrity
after insert or update of active_branch_id, status on simulora.continuities
deferrable initially deferred
for each row execute function simulora.validate_active_branch();

update app_meta.foundation_metadata
set value = '{"phase":"IP-2","productSemanticsStarted":true}'::jsonb
where key = 'implementation_phase';
