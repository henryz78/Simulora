-- IP-3 Action Truth: durable command lifecycle, proposals, confirmations and
-- resumable progress.  The database remains the only authoritative store.

alter table simulora.world_commits
  drop constraint if exists world_commits_kind_check;

alter table simulora.world_commits
  add constraint world_commits_kind_check
  check (kind in ('CONTINUITY_INITIALIZED', 'ACTION_COMMITTED'));

create table simulora.actions (
  id uuid primary key,
  actor_account_id uuid not null references simulora.accounts(id),
  continuity_id uuid not null references simulora.continuities(id),
  branch_id uuid not null references simulora.branches(id),
  operation_type text not null check (operation_type in ('PARTICIPATE')),
  idempotency_key text not null,
  expected_head_commit_id uuid not null references simulora.world_commits(id),
  participation_expectation jsonb not null,
  intent text not null check (length(trim(intent)) > 0),
  status text not null check (status in (
    'ACKNOWLEDGED', 'GENERATING', 'VALIDATING', 'AWAITING_CONFIRMATION',
    'COMMITTING', 'COMMITTED', 'FAILED_RECOVERABLE', 'CONFLICT',
    'CANCELLED', 'SUPERSEDED'
  )),
  status_reason text,
  acknowledged_at timestamptz not null default now(),
  terminal_at timestamptz,
  row_version integer not null default 1 check (row_version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (actor_account_id, branch_id, idempotency_key)
);

comment on table simulora.actions is 'Durable Action Truth process record; generated output is never canonical state.';
comment on column simulora.actions.status is 'ACKNOWLEDGED means received only; COMMITTED means authoritative mutation succeeded.';

create index actions_branch_created_idx on simulora.actions(branch_id, created_at desc);
create index actions_status_idx on simulora.actions(status, created_at);

create function simulora.validate_action_references() returns trigger
language plpgsql as $$
declare
  branch_continuity uuid;
  expected_branch uuid;
begin
  select continuity_id into branch_continuity from simulora.branches where id = new.branch_id;
  select branch_id into expected_branch from simulora.world_commits where id = new.expected_head_commit_id;
  if branch_continuity is distinct from new.continuity_id then
    raise exception 'Action Branch must belong to its Continuity';
  end if;
  if expected_branch is distinct from new.branch_id then
    raise exception 'Action expected head must belong to its Branch';
  end if;
  if not (
    new.participation_expectation ? 'initiativeMode'
    and new.participation_expectation ? 'structureMode'
    and new.participation_expectation->>'initiativeMode' in ('DIRECT', 'GUIDED', 'WORLD_ACTIVE')
    and new.participation_expectation->>'structureMode' in ('OPEN_ENDED', 'GOAL_FRAMED')
  ) then
    raise exception 'Action requires a complete valid participation expectation';
  end if;
  return new;
end;
$$;

create trigger action_reference_integrity
before insert or update of continuity_id, branch_id, expected_head_commit_id, participation_expectation
on simulora.actions
for each row execute function simulora.validate_action_references();

create function simulora.validate_action_status_transition() returns trigger
language plpgsql as $$
begin
  if new.status = old.status then return new; end if;
  if old.status in ('COMMITTED', 'CANCELLED', 'SUPERSEDED') then
    raise exception 'Terminal Action cannot return to processing';
  end if;
  if not (
    (old.status = 'ACKNOWLEDGED' and new.status in ('GENERATING', 'CANCELLED')) or
    (old.status = 'GENERATING' and new.status in ('VALIDATING', 'FAILED_RECOVERABLE', 'CANCELLED')) or
    (old.status = 'VALIDATING' and new.status in ('AWAITING_CONFIRMATION', 'COMMITTING', 'FAILED_RECOVERABLE', 'CANCELLED')) or
    (old.status = 'AWAITING_CONFIRMATION' and new.status in ('COMMITTING', 'CONFLICT', 'FAILED_RECOVERABLE', 'CANCELLED')) or
    (old.status = 'COMMITTING' and new.status in ('COMMITTED', 'CONFLICT', 'FAILED_RECOVERABLE', 'CANCELLED')) or
    (old.status = 'FAILED_RECOVERABLE' and new.status in ('GENERATING', 'CANCELLED')) or
    (old.status = 'CONFLICT' and new.status = 'SUPERSEDED')
  ) then
    raise exception 'Invalid Action status transition: % to %', old.status, new.status;
  end if;
  if new.status in ('COMMITTED', 'CANCELLED', 'SUPERSEDED') and new.terminal_at is null then
    raise exception 'Terminal Action requires terminal_at';
  end if;
  if new.status = 'COMMITTED'
     and not exists (select 1 from simulora.world_commits where action_id = new.id) then
    raise exception 'Committed Action requires exactly one linked Commit';
  end if;
  return new;
end;
$$;

create trigger action_status_transition
before update of status on simulora.actions
for each row execute function simulora.validate_action_status_transition();

create table simulora.generation_attempts (
  id uuid primary key,
  action_id uuid not null references simulora.actions(id),
  attempt_number integer not null check (attempt_number > 0),
  adapter text not null,
  status text not null check (status in ('RUNNING', 'SUCCEEDED', 'FAILED')),
  context_manifest jsonb not null,
  output jsonb,
  error_class text,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  unique (action_id, attempt_number)
);

create table simulora.action_proposals (
  id uuid primary key,
  action_id uuid not null references simulora.actions(id),
  generation_attempt_id uuid not null references simulora.generation_attempts(id),
  expected_head_commit_id uuid not null references simulora.world_commits(id),
  schema_version integer not null check (schema_version = 1),
  candidate_transition jsonb not null,
  impact_level text not null check (impact_level in ('L3')),
  proposal_digest text not null check (proposal_digest ~ '^[0-9a-f]{64}$'),
  display_effect jsonb not null,
  status text not null check (status in ('ACTIVE', 'CONFIRMED', 'EXPIRED', 'REJECTED')),
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  unique (action_id)
);

comment on table simulora.action_proposals is 'Validated proposal; remains non-authoritative until exact direct confirmation and Commit.';

create function simulora.validate_action_proposal_binding() returns trigger
language plpgsql as $$
declare
  v_expected_head uuid;
  v_attempt_action uuid;
begin
  select expected_head_commit_id into v_expected_head
    from simulora.actions where id = new.action_id;
  select action_id into v_attempt_action
    from simulora.generation_attempts where id = new.generation_attempt_id;
  if v_expected_head is distinct from new.expected_head_commit_id
     or v_attempt_action is distinct from new.action_id then
    raise exception 'Proposal must bind the Action, Generation Attempt and expected head';
  end if;
  return new;
end;
$$;

create trigger action_proposal_binding
before insert on simulora.action_proposals
for each row execute function simulora.validate_action_proposal_binding();

create table simulora.action_confirmations (
  id uuid primary key,
  action_id uuid not null references simulora.actions(id),
  proposal_id uuid not null unique references simulora.action_proposals(id),
  actor_account_id uuid not null references simulora.accounts(id),
  proposal_digest text not null check (proposal_digest ~ '^[0-9a-f]{64}$'),
  expected_head_commit_id uuid not null references simulora.world_commits(id),
  confirmed_at timestamptz not null default now()
);

create function simulora.validate_action_confirmation() returns trigger
language plpgsql as $$
declare
  v_proposal_action uuid;
  v_proposal_digest text;
  v_proposal_expiry timestamptz;
  v_action_actor uuid;
  v_action_head uuid;
begin
  select action_id, proposal_digest, expires_at
    into v_proposal_action, v_proposal_digest, v_proposal_expiry
    from simulora.action_proposals where id = new.proposal_id;
  select actor_account_id, expected_head_commit_id
    into v_action_actor, v_action_head
    from simulora.actions where id = new.action_id;
  if v_proposal_action is distinct from new.action_id
     or v_proposal_digest is distinct from new.proposal_digest
     or v_action_actor is distinct from new.actor_account_id
     or v_action_head is distinct from new.expected_head_commit_id
     or v_proposal_expiry <= new.confirmed_at then
    raise exception 'Confirmation must bind the exact Action, actor, proposal, digest and head';
  end if;
  return new;
end;
$$;

create trigger action_confirmation_integrity
before insert on simulora.action_confirmations
for each row execute function simulora.validate_action_confirmation();

alter table simulora.world_commits
  add column if not exists action_id uuid unique references simulora.actions(id),
  add column if not exists source_type text not null default 'SYSTEM'
    check (source_type in ('USER', 'CHARACTER', 'WORLD', 'SYSTEM', 'CREATOR_RULE')),
  add column if not exists reason text;

alter table simulora.world_commits
  add constraint world_commits_action_shape_check
  check (
    (kind = 'ACTION_COMMITTED' and action_id is not null)
    or (kind <> 'ACTION_COMMITTED' and action_id is null)
  );

create function simulora.validate_action_commit_binding() returns trigger
language plpgsql as $$
declare
  v_branch uuid;
  v_actor uuid;
  v_expected_head uuid;
  v_status text;
begin
  if new.action_id is null then return new; end if;
  select branch_id, actor_account_id, expected_head_commit_id, status
    into v_branch, v_actor, v_expected_head, v_status
    from simulora.actions where id = new.action_id;
  if v_branch is distinct from new.branch_id
     or v_actor is distinct from new.actor_account_id
     or v_expected_head is distinct from new.parent_commit_id
     or v_status is distinct from 'COMMITTING'
     or not exists (
       select 1
       from simulora.action_confirmations confirmation
       join simulora.action_proposals proposal on proposal.id = confirmation.proposal_id
       where confirmation.action_id = new.action_id
         and confirmation.expected_head_commit_id = new.parent_commit_id
         and proposal.status = 'CONFIRMED'
     ) then
    raise exception 'Action Commit requires matching Branch, actor, expected head and exact confirmation';
  end if;
  return new;
end;
$$;

create trigger action_commit_binding
before insert on simulora.world_commits
for each row execute function simulora.validate_action_commit_binding();

create table simulora.conversation_entries (
  id uuid primary key,
  commit_id uuid not null references simulora.world_commits(id),
  branch_id uuid not null references simulora.branches(id),
  ordinal integer not null check (ordinal > 0),
  role text not null check (role in ('USER', 'WORLD')),
  content text not null,
  created_at timestamptz not null default now(),
  unique (commit_id, ordinal)
);

create trigger conversation_entries_immutable
before update or delete on simulora.conversation_entries
for each row execute function simulora.reject_immutable_change();

create table simulora.durable_jobs (
  id uuid primary key,
  type text not null check (type in ('ACTION_PROCESS')),
  action_id uuid not null references simulora.actions(id),
  dedupe_key text not null unique,
  status text not null check (status in ('AVAILABLE', 'LEASED', 'SUCCEEDED', 'FAILED', 'DEAD')),
  attempts integer not null default 0 check (attempts >= 0),
  lease_owner text,
  lease_until timestamptz,
  available_at timestamptz not null default now(),
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index durable_jobs_claim_idx on simulora.durable_jobs(status, available_at);
create index durable_jobs_action_idx on simulora.durable_jobs(action_id, type);

create table simulora.action_progress_events (
  id uuid primary key,
  action_id uuid not null references simulora.actions(id),
  sequence integer not null check (sequence > 0),
  event_type text not null check (event_type in (
    'action.status', 'generation.draft', 'confirmation.required',
    'action.committed', 'action.failed', 'heartbeat'
  )),
  payload jsonb not null,
  created_at timestamptz not null default now(),
  unique (action_id, sequence)
);

comment on table simulora.action_progress_events is 'Resumable delivery projection, never canonical World truth.';

create index action_progress_events_cursor_idx
  on simulora.action_progress_events(action_id, sequence);

create trigger action_progress_events_immutable
before update or delete on simulora.action_progress_events
for each row execute function simulora.reject_immutable_change();

create table simulora.transactional_outbox (
  id uuid primary key,
  topic text not null,
  source_id uuid not null,
  dedupe_key text not null,
  payload jsonb not null,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  unique (topic, dedupe_key)
);

update app_meta.foundation_metadata
set value = '{"phase":"IP-3","productSemanticsStarted":true}'::jsonb
where key = 'implementation_phase';
