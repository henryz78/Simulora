-- IP-4 Return / Continuity / Correction.  This migration is additive: all
-- existing immutable World/Commit/State/History records remain readable.

alter table simulora.actions
  drop constraint if exists actions_operation_type_check;

alter table simulora.actions
  add constraint actions_operation_type_check
  check (operation_type in ('PARTICIPATE', 'CORRECT_CONTINUITY', 'REMOVE_CONTINUITY'));

alter table simulora.actions
  add column if not exists operation_payload jsonb not null default '{}'::jsonb;

comment on column simulora.actions.operation_payload is
  'Validated direct-operation data; model output can never populate direct correction authority.';

-- Direct corrections use the same Action/Proposal/Confirmation/Commit chain,
-- but do not call a model and therefore have no Generation Attempt.
alter table simulora.action_proposals
  alter column generation_attempt_id drop not null;

-- The IP-3 trigger required a model Generation Attempt.  Direct correction
-- proposals deliberately have no attempt, but still bind to the exact Action
-- and expected head; preserve the other binding checks unchanged.
create or replace function simulora.validate_action_proposal_binding() returns trigger
language plpgsql as $$
declare
  v_expected_head uuid;
  v_attempt_action uuid;
  v_operation_type text;
begin
  select expected_head_commit_id, operation_type
    into v_expected_head, v_operation_type
    from simulora.actions where id = new.action_id;
  if v_operation_type = 'PARTICIPATE' and new.generation_attempt_id is null then
    raise exception 'PARTICIPATE proposal requires a Generation Attempt';
  end if;
  if v_operation_type in ('CORRECT_CONTINUITY', 'REMOVE_CONTINUITY')
     and new.generation_attempt_id is not null then
    raise exception 'Direct correction proposal cannot bind a Generation Attempt';
  end if;
  if new.generation_attempt_id is not null then
    select action_id into v_attempt_action
      from simulora.generation_attempts where id = new.generation_attempt_id;
  end if;
  if v_expected_head is distinct from new.expected_head_commit_id
     or (new.generation_attempt_id is not null and v_attempt_action is distinct from new.action_id) then
    raise exception 'Proposal must bind the Action, optional Generation Attempt and expected head';
  end if;
  return new;
end;
$$;

alter table simulora.domain_events
  add column if not exists source_type text not null default 'SYSTEM'
    check (source_type in ('USER', 'CHARACTER', 'WORLD', 'SYSTEM', 'CREATOR_RULE')),
  add column if not exists visibility_scope text not null default 'SHARED'
    check (visibility_scope in ('ACCOUNT_PRIVATE', 'CONTINUITY_PRIVATE', 'SHARED')),
  add column if not exists cause_action_id uuid references simulora.actions(id);

comment on column simulora.domain_events.visibility_scope is
  'Visibility is filtered before Change Trace/Explanation assembly.';

create function simulora.validate_domain_event_binding() returns trigger
language plpgsql as $$
declare
  commit_branch uuid;
begin
  select branch_id into commit_branch
    from simulora.world_commits where id = new.commit_id;
  if commit_branch is distinct from new.branch_id then
    raise exception 'Domain Event must belong to its Commit Branch';
  end if;
  return new;
end;
$$;

create trigger domain_event_binding
before insert on simulora.domain_events
for each row execute function simulora.validate_domain_event_binding();

create table simulora.return_orientation_projections (
  branch_id uuid primary key references simulora.branches(id),
  source_head_commit_id uuid not null references simulora.world_commits(id),
  payload jsonb not null,
  status text not null check (status in ('FRESH', 'STALE', 'REBUILDING')),
  rebuilt_at timestamptz,
  row_version integer not null default 1 check (row_version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index return_orientation_source_idx
  on simulora.return_orientation_projections(source_head_commit_id, status);

-- The projection row itself is mutable metadata, but a FRESH content/head
-- pair is accepted only when it names the branch's captured head.  The
-- repository also holds that Branch row FOR SHARE while rebuilding.
create function simulora.validate_orientation_projection_write() returns trigger
language plpgsql as $$
begin
  if new.source_head_commit_id is null or new.payload is null then
    raise exception 'Orientation projection requires source head and payload';
  end if;
  if new.status = 'FRESH' and new.rebuilt_at is null then
    raise exception 'Fresh orientation projection requires rebuilt_at';
  end if;
  return new;
end;
$$;

create trigger return_orientation_projection_integrity
before insert or update on simulora.return_orientation_projections
for each row execute function simulora.validate_orientation_projection_write();

update app_meta.foundation_metadata
set value = '{"phase":"IP-4","productSemanticsStarted":true}'::jsonb
where key = 'implementation_phase';
