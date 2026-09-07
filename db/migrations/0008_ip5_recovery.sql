-- IP-5 Recovery: reference-only safe points, isolated branch forks and
-- append-only restore commits. Recovery never rewrites an existing Commit or
-- State Revision and never owns a second copy of canonical truth.

alter table simulora.world_commits
  drop constraint if exists world_commits_kind_check;

alter table simulora.world_commits
  add constraint world_commits_kind_check
  check (kind in (
    'CONTINUITY_INITIALIZED',
    'ACTION_COMMITTED',
    'BRANCH_FORK',
    'RESTORE_COMMITTED'
  ));

alter table simulora.branches
  add column if not exists parent_branch_id uuid references simulora.branches(id),
  add column if not exists fork_source_commit_id uuid references simulora.world_commits(id),
  add column if not exists created_by_account_id uuid references simulora.accounts(id),
  add column if not exists idempotency_key text;

create unique index branches_fork_idempotency_idx
  on simulora.branches(created_by_account_id, continuity_id, idempotency_key)
  where idempotency_key is not null;

comment on column simulora.branches.parent_branch_id is
  'Lineage only: the source Branch of a fork. It is never a second state authority.';
comment on column simulora.branches.fork_source_commit_id is
  'The immutable source Commit selected for the BRANCH_FORK snapshot.';

create function simulora.validate_branch_fork_lineage() returns trigger
language plpgsql as $$
declare
  parent_continuity uuid;
  source_branch uuid;
  owner_account uuid;
  head_kind text;
  head_parent uuid;
begin
  if new.parent_branch_id is null and new.fork_source_commit_id is null then return new; end if;
  select continuity_id into parent_continuity from simulora.branches where id = new.parent_branch_id;
  select branch_id into source_branch from simulora.world_commits where id = new.fork_source_commit_id;
  select owner_account_id into owner_account from simulora.continuities where id = new.continuity_id;
  if new.parent_branch_id is null
     or new.fork_source_commit_id is null
     or parent_continuity is distinct from new.continuity_id
     or source_branch is distinct from new.parent_branch_id
     or new.created_by_account_id is distinct from owner_account then
    raise exception 'Branch fork lineage must remain inside one owned Continuity';
  end if;
  if new.status = 'ACTIVE' and (tg_op = 'INSERT' or old.status = 'INITIALIZING') then
    select kind, parent_commit_id into head_kind, head_parent
      from simulora.world_commits where id = new.head_commit_id;
    if head_kind is distinct from 'BRANCH_FORK'
       or head_parent is distinct from new.fork_source_commit_id then
      raise exception 'New Branch head must be its BRANCH_FORK Commit over the selected source';
    end if;
  end if;
  return new;
end;
$$;

create constraint trigger branch_fork_lineage_integrity
after insert or update of parent_branch_id, fork_source_commit_id, status, head_commit_id
on simulora.branches
deferrable initially deferred
for each row execute function simulora.validate_branch_fork_lineage();

create table simulora.recovery_points (
  id uuid primary key,
  continuity_id uuid not null references simulora.continuities(id),
  branch_id uuid not null references simulora.branches(id),
  commit_id uuid not null references simulora.world_commits(id),
  label text not null check (length(trim(label)) between 1 and 160),
  idempotency_key text not null,
  created_by_account_id uuid not null references simulora.accounts(id),
  created_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (created_by_account_id, branch_id, idempotency_key)
);

create index recovery_points_branch_idx
  on simulora.recovery_points(branch_id, created_at desc)
  where deleted_at is null;

create function simulora.validate_recovery_point_reference() returns trigger
language plpgsql as $$
declare
  commit_branch uuid;
  branch_continuity uuid;
  owner_account uuid;
begin
  select branch_id into commit_branch from simulora.world_commits where id = new.commit_id;
  select continuity_id into branch_continuity from simulora.branches where id = new.branch_id;
  select owner_account_id into owner_account from simulora.continuities where id = new.continuity_id;
  if commit_branch is distinct from new.branch_id
     or branch_continuity is distinct from new.continuity_id
     or owner_account is distinct from new.created_by_account_id then
    raise exception 'Recovery Point must reference an owned Commit on its Continuity Branch';
  end if;
  return new;
end;
$$;

create trigger recovery_point_reference_integrity
before insert or update of continuity_id, branch_id, commit_id, created_by_account_id
on simulora.recovery_points
for each row execute function simulora.validate_recovery_point_reference();

create table simulora.restore_proposals (
  id uuid primary key,
  continuity_id uuid not null references simulora.continuities(id),
  branch_id uuid not null references simulora.branches(id),
  actor_account_id uuid not null references simulora.accounts(id),
  source_commit_id uuid not null references simulora.world_commits(id),
  expected_head_commit_id uuid not null references simulora.world_commits(id),
  included_sections jsonb not null,
  excluded_sections jsonb not null,
  diff jsonb not null,
  proposal_digest text not null check (proposal_digest ~ '^[0-9a-f]{64}$'),
  status text not null check (status in ('ACTIVE', 'CONFIRMED', 'STALE', 'REJECTED', 'EXPIRED')),
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  unique (branch_id, proposal_digest)
);

alter table simulora.state_revisions
  drop constraint if exists state_revisions_branch_id_document_hash_key;

alter table simulora.world_commits
  add column if not exists restore_proposal_id uuid unique references simulora.restore_proposals(id);

create index restore_proposals_branch_idx on simulora.restore_proposals(branch_id, created_at desc);

create function simulora.validate_restore_proposal_reference() returns trigger
language plpgsql as $$
declare
  source_branch uuid;
  expected_branch uuid;
  proposal_continuity uuid;
  source_continuity uuid;
  actor_owner uuid;
begin
  select branch_id into source_branch from simulora.world_commits where id = new.source_commit_id;
  select branch_id into expected_branch from simulora.world_commits where id = new.expected_head_commit_id;
  select continuity_id into proposal_continuity from simulora.branches where id = new.branch_id;
  select continuity_id into source_continuity from simulora.branches where id = source_branch;
  select owner_account_id into actor_owner from simulora.continuities where id = new.continuity_id;
  if expected_branch is distinct from new.branch_id
     or proposal_continuity is distinct from new.continuity_id
     or source_continuity is distinct from new.continuity_id
     or actor_owner is distinct from new.actor_account_id then
    raise exception 'Restore proposal references must belong to the same owned Continuity';
  end if;
  return new;
end;
$$;

create trigger restore_proposal_reference_integrity
before insert or update of continuity_id, branch_id, actor_account_id,
  source_commit_id, expected_head_commit_id
on simulora.restore_proposals
for each row execute function simulora.validate_restore_proposal_reference();

create function simulora.validate_restore_proposal_update() returns trigger
language plpgsql as $$
begin
  if (to_jsonb(new) - 'status') is distinct from (to_jsonb(old) - 'status') then
    raise exception 'Restore proposal content is immutable';
  end if;
  if old.status <> new.status
     and not (old.status = 'ACTIVE' and new.status in ('CONFIRMED', 'STALE', 'REJECTED', 'EXPIRED')) then
    raise exception 'Invalid Restore proposal status transition';
  end if;
  return new;
end;
$$;

create trigger restore_proposal_update_integrity
before update on simulora.restore_proposals
for each row execute function simulora.validate_restore_proposal_update();

create table simulora.restore_confirmations (
  id uuid primary key,
  proposal_id uuid not null unique references simulora.restore_proposals(id),
  actor_account_id uuid not null references simulora.accounts(id),
  proposal_digest text not null check (proposal_digest ~ '^[0-9a-f]{64}$'),
  expected_head_commit_id uuid not null references simulora.world_commits(id),
  confirmed_at timestamptz not null default now()
);

create function simulora.validate_restore_confirmation() returns trigger
language plpgsql as $$
declare
  proposal_actor uuid;
  proposal_digest_value text;
  proposal_head uuid;
  proposal_expiry timestamptz;
begin
  select actor_account_id, proposal_digest, expected_head_commit_id, expires_at
    into proposal_actor, proposal_digest_value, proposal_head, proposal_expiry
    from simulora.restore_proposals where id = new.proposal_id;
  if proposal_actor is distinct from new.actor_account_id
     or proposal_digest_value is distinct from new.proposal_digest
     or proposal_head is distinct from new.expected_head_commit_id
     or proposal_expiry <= new.confirmed_at then
    raise exception 'Restore confirmation must bind actor, digest, expected head and expiry';
  end if;
  return new;
end;
$$;

create trigger restore_confirmation_integrity
before insert on simulora.restore_confirmations
for each row execute function simulora.validate_restore_confirmation();

alter table simulora.world_commits
  add constraint world_commits_recovery_shape_check
  check (
    (kind = 'RESTORE_COMMITTED' and action_id is null and restore_proposal_id is not null)
    or (kind <> 'RESTORE_COMMITTED' and restore_proposal_id is null)
  );

create function simulora.validate_restore_commit_binding() returns trigger
language plpgsql as $$
declare
  proposal_branch uuid;
  proposal_actor uuid;
  proposal_head uuid;
  proposal_status text;
  current_head uuid;
begin
  if new.kind <> 'RESTORE_COMMITTED' then return new; end if;
  select branch_id, actor_account_id, expected_head_commit_id, status
    into proposal_branch, proposal_actor, proposal_head, proposal_status
    from simulora.restore_proposals where id = new.restore_proposal_id;
  select head_commit_id into current_head from simulora.branches where id = new.branch_id;
  if proposal_branch is distinct from new.branch_id
     or proposal_actor is distinct from new.actor_account_id
     or proposal_head is distinct from new.parent_commit_id
     or proposal_status is distinct from 'CONFIRMED'
     or current_head is distinct from new.parent_commit_id then
    raise exception 'Restore Commit requires exact confirmed proposal and current expected head';
  end if;
  return new;
end;
$$;

create trigger restore_commit_binding
before insert on simulora.world_commits
for each row execute function simulora.validate_restore_commit_binding();

update app_meta.foundation_metadata
set value = '{"phase":"IP-5","productSemanticsStarted":true}'::jsonb
where key = 'implementation_phase';
