-- IP-6 participation and character authority. Participation stays inside the
-- immutable State Revision selected by the Branch head; no second mode column
-- or unattended world scheduler is introduced.

alter table simulora.actions
  drop constraint if exists actions_operation_type_check;

alter table simulora.actions
  add constraint actions_operation_type_check
  check (operation_type in (
    'PARTICIPATE', 'CORRECT_CONTINUITY', 'REMOVE_CONTINUITY',
    'CHANGE_PARTICIPATION_CONTRACT'
  ));

create or replace function simulora.validate_action_references() returns trigger
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
  if new.operation_type = 'CHANGE_PARTICIPATION_CONTRACT' and not (
    new.operation_payload->>'schemaVersion' = '1'
    and new.operation_payload ? 'before'
    and new.operation_payload ? 'after'
    and new.operation_payload->'before' = new.participation_expectation
    and new.operation_payload->'after'->>'initiativeMode' in ('DIRECT', 'GUIDED', 'WORLD_ACTIVE')
    and new.operation_payload->'after'->>'structureMode' in ('OPEN_ENDED', 'GOAL_FRAMED')
    and new.operation_payload->'before' <> new.operation_payload->'after'
  ) then
    raise exception 'Participation change requires exact complete before/after contracts';
  end if;
  return new;
end;
$$;

drop trigger action_reference_integrity on simulora.actions;
create trigger action_reference_integrity
before insert or update of continuity_id, branch_id, expected_head_commit_id,
  participation_expectation, operation_type, operation_payload
on simulora.actions
for each row execute function simulora.validate_action_references();

create or replace function simulora.validate_action_status_transition() returns trigger
language plpgsql as $$
begin
  if new.status = old.status then return new; end if;
  if old.status in ('COMMITTED', 'CANCELLED', 'SUPERSEDED') then
    raise exception 'Terminal Action cannot return to processing';
  end if;
  if not (
    (old.status = 'ACKNOWLEDGED' and new.status in ('GENERATING', 'VALIDATING', 'CANCELLED')) or
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
  if v_operation_type in (
       'CORRECT_CONTINUITY', 'REMOVE_CONTINUITY', 'CHANGE_PARTICIPATION_CONTRACT'
     ) and new.generation_attempt_id is not null then
    raise exception 'Direct proposal cannot bind a Generation Attempt';
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

create table simulora.character_assets (
  id uuid primary key,
  owner_account_id uuid not null references simulora.accounts(id),
  document jsonb not null,
  document_hash text not null check (document_hash ~ '^[0-9a-f]{64}$'),
  status text not null default 'ACTIVE' check (status in ('ACTIVE', 'DELETED')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table simulora.character_assets
  add constraint character_assets_document_shape_check
  check (
    document->>'schemaVersion' = '1'
    and jsonb_typeof(document->'name') = 'string'
    and jsonb_typeof(document->'role') = 'string'
    and jsonb_typeof(document->'motives') = 'array'
    and jsonb_array_length(document->'motives') > 0
    and jsonb_typeof(document->'stance') = 'string'
    and jsonb_typeof(document->'knowledgeFactIds') = 'array'
  );

create index character_assets_owner_idx
  on simulora.character_assets(owner_account_id, created_at desc);

create table simulora.world_revision_characters (
  world_revision_id uuid not null references simulora.world_revisions(id),
  character_spec_id text not null,
  source_asset_id uuid references simulora.character_assets(id),
  spec jsonb not null,
  created_at timestamptz not null default now(),
  primary key (world_revision_id, character_spec_id)
);

create trigger world_revision_characters_immutable
before update or delete on simulora.world_revision_characters
for each row execute function simulora.reject_immutable_change();

create function simulora.validate_world_revision_character_snapshot() returns trigger
language plpgsql as $$
declare
  v_world_owner uuid;
  v_asset_owner uuid;
  v_revision_document jsonb;
begin
  select w.owner_account_id, wr.document
    into v_world_owner, v_revision_document
    from simulora.world_revisions wr
    join simulora.worlds w on w.id = wr.world_id
    where wr.id = new.world_revision_id;
  if not exists (
    select 1 from jsonb_array_elements(v_revision_document->'characters') as character_spec
    where character_spec->>'id' = new.character_spec_id and character_spec = new.spec
  ) then
    raise exception 'Character snapshot must equal its immutable World Revision spec';
  end if;
  if new.source_asset_id is not null then
    select owner_account_id into v_asset_owner
      from simulora.character_assets where id = new.source_asset_id;
    if v_asset_owner is distinct from v_world_owner then
      raise exception 'Character Asset and World Revision require the same owner';
    end if;
  end if;
  return new;
end;
$$;

create trigger world_revision_character_snapshot_integrity
before insert on simulora.world_revision_characters
for each row execute function simulora.validate_world_revision_character_snapshot();

insert into simulora.world_revision_characters
  (world_revision_id, character_spec_id, source_asset_id, spec)
select wr.id, character_spec->>'id', null, character_spec
from simulora.world_revisions wr
cross join lateral jsonb_array_elements(wr.document->'characters') as character_spec;

create function simulora.validate_participation_contract_state() returns trigger
language plpgsql as $$
declare
  v_operation text;
  v_payload jsonb;
  v_expectation jsonb;
  v_parent_document jsonb;
begin
  select a.operation_type, a.operation_payload, a.participation_expectation,
         parent_state.document
    into v_operation, v_payload, v_expectation, v_parent_document
    from simulora.world_commits wc
    join simulora.actions a on a.id = wc.action_id
    join simulora.world_commits parent_commit on parent_commit.id = wc.parent_commit_id
    join simulora.state_revisions parent_state on parent_state.id = parent_commit.state_revision_id
    where wc.id = new.commit_id;

  if v_operation is distinct from 'CHANGE_PARTICIPATION_CONTRACT' then
    return new;
  end if;
  if v_payload->'before' is distinct from v_expectation
     or v_parent_document->'participation' is distinct from v_payload->'before'
     or new.document->'participation' is distinct from v_payload->'after'
     or (new.document - 'participation') is distinct from (v_parent_document - 'participation') then
    raise exception 'Participation Commit may change only the exact direct two-axis contract';
  end if;
  return new;
end;
$$;

create constraint trigger participation_contract_state_integrity
after insert on simulora.state_revisions
deferrable initially deferred
for each row execute function simulora.validate_participation_contract_state();

update app_meta.foundation_metadata
set value = '{"phase":"IP-6","productSemanticsStarted":true}'::jsonb
where key = 'implementation_phase';
