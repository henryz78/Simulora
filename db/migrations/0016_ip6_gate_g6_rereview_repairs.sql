-- Gate G6 re-review repairs: reject malformed authority JSON, bind generated
-- speaker attribution, and require exact conversation materialization.

create function simulora.valid_participation_contract(candidate jsonb) returns boolean
language sql immutable as $$
  select (
    jsonb_typeof(candidate) = 'object'
    and candidate = jsonb_build_object(
      'initiativeMode', candidate->>'initiativeMode',
      'structureMode', candidate->>'structureMode'
    )
    and (candidate->>'initiativeMode' in ('DIRECT', 'GUIDED', 'WORLD_ACTIVE')) is true
    and (candidate->>'structureMode' in ('OPEN_ENDED', 'GOAL_FRAMED')) is true
  ) is true;
$$;

create or replace function simulora.validate_action_references() returns trigger
language plpgsql as $$
declare
  branch_continuity uuid;
  branch_head uuid;
  branch_status text;
  continuity_owner uuid;
  continuity_active_branch uuid;
  continuity_status text;
  expected_branch uuid;
  parent_participation jsonb;
begin
  select branch.continuity_id, branch.head_commit_id, branch.status,
         continuity.owner_account_id, continuity.active_branch_id, continuity.status
    into branch_continuity, branch_head, branch_status,
         continuity_owner, continuity_active_branch, continuity_status
    from simulora.branches branch
    join simulora.continuities continuity on continuity.id = branch.continuity_id
    where branch.id = new.branch_id;
  select commit.branch_id, state.document->'participation'
    into expected_branch, parent_participation
    from simulora.world_commits commit
    join simulora.state_revisions state on state.id = commit.state_revision_id
    where commit.id = new.expected_head_commit_id;

  if branch_continuity is distinct from new.continuity_id
     or expected_branch is distinct from new.branch_id then
    raise exception 'Action Branch, Continuity and expected head must agree';
  end if;
  if continuity_owner is distinct from new.actor_account_id
     or branch_status is distinct from 'ACTIVE'
     or continuity_status is distinct from 'ACTIVE'
     or continuity_active_branch is distinct from new.branch_id
     or branch_head is distinct from new.expected_head_commit_id then
    raise exception 'Action requires its Continuity owner and current active Branch head';
  end if;
  if not simulora.valid_participation_contract(new.participation_expectation)
     or new.participation_expectation is distinct from parent_participation then
    raise exception 'Action requires the exact current participation contract';
  end if;
  if new.operation_type = 'CHANGE_PARTICIPATION_CONTRACT' and (
    jsonb_typeof(new.operation_payload) = 'object'
    and new.operation_payload = jsonb_build_object(
      'schemaVersion', 1,
      'before', new.operation_payload->'before',
      'after', new.operation_payload->'after'
    )
    and simulora.valid_participation_contract(new.operation_payload->'before')
    and simulora.valid_participation_contract(new.operation_payload->'after')
    and new.operation_payload->'before' = new.participation_expectation
    and new.operation_payload->'before' <> new.operation_payload->'after'
  ) is not true then
    raise exception 'Participation change requires exact complete before/after contracts';
  end if;
  return new;
end;
$$;

create or replace function simulora.protect_action_identity() returns trigger
language plpgsql as $$
begin
  if (to_jsonb(new) - array['status', 'status_reason', 'terminal_at', 'row_version', 'updated_at'])
     is distinct from
     (to_jsonb(old) - array['status', 'status_reason', 'terminal_at', 'row_version', 'updated_at']) then
    raise exception 'Action identity, authority and command binding are immutable';
  end if;
  return new;
end;
$$;

create or replace function simulora.validate_action_status_transition() returns trigger
language plpgsql as $$
begin
  if new.status in ('COMMITTED', 'CANCELLED', 'SUPERSEDED') and new.terminal_at is null then
    raise exception 'Terminal Action requires terminal_at';
  end if;
  if new.status not in ('COMMITTED', 'CANCELLED', 'SUPERSEDED') and new.terminal_at is not null then
    raise exception 'Non-terminal Action cannot carry terminal_at';
  end if;
  if new.status = old.status then
    if new.terminal_at is distinct from old.terminal_at
       or (new.status in ('COMMITTED', 'CANCELLED', 'SUPERSEDED')
           and new.status_reason is distinct from old.status_reason) then
      raise exception 'Terminal Action evidence is immutable';
    end if;
    return new;
  end if;
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
  if new.status = 'COMMITTED'
     and not exists (select 1 from simulora.world_commits where action_id = new.id) then
    raise exception 'Committed Action requires exactly one linked Commit';
  end if;
  return new;
end;
$$;

create function simulora.generated_narrative_authors_user(
  narrative text,
  user_role_name text
) returns boolean
language plpgsql immutable as $$
declare
  body text := lower(narrative);
  role_name text := lower(nullif(trim(user_role_name), ''));
  verb text;
  prefix text;
  verbs text[] := array[
    'say', 'says', 'said', 'agree', 'agrees', 'agreed', 'promise', 'promises', 'promised',
    'consent', 'consents', 'consented', 'accept', 'accepts', 'accepted',
    'authorize', 'authorizes', 'authorized', 'pay', 'pays', 'paid', 'spend', 'spends', 'spent',
    'transfer', 'transfers', 'transferred', 'share', 'shares', 'shared',
    'publish', 'publishes', 'published', 'delete', 'deletes', 'deleted',
    'surrender', 'surrenders', 'surrendered', 'sign', 'signs', 'signed',
    'buy', 'buys', 'bought', 'sell', 'sells', 'sold'
  ];
begin
  if body ~ '\m(you|the user|the player|the participant)\M[[:space:]]+(has[[:space:]]+|have[[:space:]]+|had[[:space:]]+|will[[:space:]]+|did[[:space:]]+|does[[:space:]]+|is[[:space:]]+|was[[:space:]]+)?(say|says|said|agree|agrees|agreed|promise|promises|promised|consent|consents|consented|accept|accepts|accepted|authorize|authorizes|authorized|pay|pays|paid|spend|spends|spent|transfer|transfers|transferred|share|shares|shared|publish|publishes|published|delete|deletes|deleted|surrender|surrenders|surrendered|sign|signs|signed|buy|buys|bought|sell|sells|sold)\M' then
    return true;
  end if;
  if role_name is null then return false; end if;
  foreach verb in array verbs loop
    foreach prefix in array array[' ', ' has ', ' have ', ' had ', ' will ', ' did ', ' does ', ' is ', ' was '] loop
      if position(role_name || prefix || verb in body) > 0 then return true; end if;
    end loop;
  end loop;
  return false;
end;
$$;

create or replace function simulora.action_proposal_effect_is_valid(
  proposal simulora.action_proposals
) returns boolean
language plpgsql stable strict as $$
declare
  action simulora.actions%rowtype;
  parent_document jsonb;
  world_document jsonb;
  attempt_manifest jsonb;
  operation jsonb;
  target_fact jsonb;
  expected_operation jsonb;
  expected_display jsonb;
  expected_response_source jsonb;
  expected_candidate jsonb;
  expected_digest text;
  digest_payload jsonb;
begin
  select * into action from simulora.actions where id = proposal.action_id;
  select state.document into parent_document
    from simulora.world_commits commit
    join simulora.state_revisions state on state.id = commit.state_revision_id
    where commit.id = proposal.expected_head_commit_id;
  select revision.document into world_document
    from simulora.continuities continuity
    join simulora.world_revisions revision on revision.id = continuity.world_revision_id
    where continuity.id = action.continuity_id;
  if action.id is null
     or parent_document is null
     or world_document is null
     or proposal.expected_head_commit_id is distinct from action.expected_head_commit_id
     or proposal.schema_version <> 1
     or proposal.impact_level <> 'L3'
     or proposal.expires_at <= proposal.created_at
     or proposal.candidate_transition->>'schemaVersion' <> '1'
     or proposal.candidate_transition->>'actionId' is distinct from action.id::text
     or proposal.candidate_transition->>'expectedHeadCommitId' is distinct from action.expected_head_commit_id::text
     or nullif(trim(proposal.candidate_transition->>'narrative'), '') is null then
    return false;
  end if;

  operation := proposal.candidate_transition->'operation';
  if action.operation_type = 'PARTICIPATE' then
    select context_manifest into attempt_manifest
      from simulora.generation_attempts where id = proposal.generation_attempt_id;
    if jsonb_typeof(attempt_manifest->'includedCharacterIds') <> 'array'
       or jsonb_array_length(attempt_manifest->'includedCharacterIds') > 1 then
      return false;
    end if;
    expected_response_source := case
      when jsonb_array_length(attempt_manifest->'includedCharacterIds') = 1 then
        jsonb_build_object(
          'type', 'CHARACTER',
          'characterId', attempt_manifest->'includedCharacterIds'->>0
        )
      else jsonb_build_object('type', 'WORLD')
    end;
    select fact into target_fact
      from jsonb_array_elements(parent_document->'facts') with ordinality as facts(fact, position)
      where fact->>'lifecycle' = 'ACTIVE' and fact->>'scope' = 'SHARED'
      order by position limit 1;
    expected_operation := jsonb_build_object(
      'type', 'UPDATE_CANONICAL_FACT',
      'targetFactId', target_fact->>'id',
      'beforeStatement', target_fact->>'statement',
      'afterStatement', operation->>'afterStatement',
      'scope', target_fact->>'scope',
      'provenance', operation->>'provenance'
    );
    expected_display := jsonb_build_object(
      'target', target_fact->>'id',
      'before', target_fact->>'statement',
      'after', operation->>'afterStatement',
      'scope', target_fact->>'scope'
    );
    if target_fact is null
       or nullif(trim(operation->>'afterStatement'), '') is null
       or nullif(trim(operation->>'provenance'), '') is null
       or operation is distinct from expected_operation
       or proposal.candidate_transition->'responseSource' is distinct from expected_response_source
       or (expected_response_source->>'type' = 'CHARACTER' and not exists (
         select 1 from jsonb_array_elements(parent_document->'characters') character
         where character->>'id' = expected_response_source->>'characterId'
       ))
       or simulora.generated_narrative_authors_user(
         proposal.candidate_transition->>'narrative',
         world_document->'userRole'->>'name'
       ) then
      return false;
    end if;
    expected_candidate := jsonb_build_object(
      'schemaVersion', 1,
      'actionId', action.id,
      'expectedHeadCommitId', action.expected_head_commit_id,
      'narrative', proposal.candidate_transition->>'narrative',
      'responseSource', expected_response_source,
      'operation', expected_operation
    );
  elsif action.operation_type in ('CORRECT_CONTINUITY', 'REMOVE_CONTINUITY') then
    select fact into target_fact
      from jsonb_array_elements(parent_document->'facts') as facts(fact)
      where fact->>'id' = operation->>'targetFactId'
        and fact->>'lifecycle' = 'ACTIVE'
      limit 1;
    expected_operation := jsonb_build_object(
      'type', action.operation_type,
      'targetFactId', target_fact->>'id',
      'beforeStatement', target_fact->>'statement',
      'beforeScope', target_fact->>'scope',
      'reason', action.operation_payload->>'reason'
    );
    if action.operation_type = 'CORRECT_CONTINUITY' then
      expected_operation := expected_operation || jsonb_build_object(
        'afterStatement', action.operation_payload->'after'->>'statement'
      );
    end if;
    expected_display := jsonb_build_object(
      'target', target_fact->>'id',
      'before', target_fact->>'statement',
      'after', case when action.operation_type = 'REMOVE_CONTINUITY'
        then 'This canonical fact will be removed from the current continuity.'
        else action.operation_payload->'after'->>'statement' end,
      'scope', target_fact->>'scope',
      'operation', action.operation_type
    );
    if target_fact is null
       or action.operation_payload->'target'->>'type' <> 'fact'
       or action.operation_payload->'target'->>'id' is distinct from target_fact->>'id'
       or action.operation_payload->'before'->>'statement' is distinct from target_fact->>'statement'
       or action.operation_payload->'before'->>'scope' is distinct from target_fact->>'scope'
       or nullif(trim(action.operation_payload->>'reason'), '') is null
       or (action.operation_type = 'CORRECT_CONTINUITY'
           and nullif(trim(action.operation_payload->'after'->>'statement'), '') is null)
       or (action.operation_type = 'REMOVE_CONTINUITY' and action.operation_payload ? 'after')
       or operation is distinct from expected_operation then
      return false;
    end if;
    expected_candidate := jsonb_build_object(
      'schemaVersion', 1,
      'actionId', action.id,
      'expectedHeadCommitId', action.expected_head_commit_id,
      'narrative', proposal.candidate_transition->>'narrative',
      'operation', expected_operation
    );
  elsif action.operation_type = 'CHANGE_PARTICIPATION_CONTRACT' then
    expected_operation := jsonb_build_object(
      'type', 'CHANGE_PARTICIPATION_CONTRACT',
      'before', action.operation_payload->'before',
      'after', action.operation_payload->'after'
    );
    expected_display := jsonb_build_object(
      'target', 'Participation contract',
      'before', replace(action.operation_payload->'before'->>'initiativeMode', '_', ' ')
        || ' · ' || replace(action.operation_payload->'before'->>'structureMode', '_', ' '),
      'after', replace(action.operation_payload->'after'->>'initiativeMode', '_', ' ')
        || ' · ' || replace(action.operation_payload->'after'->>'structureMode', '_', ' '),
      'scope', 'ACCOUNT_PRIVATE'
    );
    if operation is distinct from expected_operation then return false; end if;
    expected_candidate := jsonb_build_object(
      'schemaVersion', 1,
      'actionId', action.id,
      'expectedHeadCommitId', action.expected_head_commit_id,
      'narrative', proposal.candidate_transition->>'narrative',
      'operation', expected_operation
    );
  else
    return false;
  end if;

  if proposal.candidate_transition is distinct from expected_candidate
     or proposal.display_effect is distinct from expected_display then
    return false;
  end if;
  digest_payload := jsonb_build_object(
    'actionId', action.id,
    'actorAccountId', action.actor_account_id,
    'expectedHeadCommitId', action.expected_head_commit_id,
    'candidate', proposal.candidate_transition,
    'displayEffect', proposal.display_effect,
    'expiresAt', to_char(proposal.expires_at at time zone 'UTC',
                         'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
  );
  expected_digest := encode(
    sha256(convert_to(simulora.canonical_jsonb_text(digest_payload), 'UTF8')),
    'hex'
  );
  return proposal.proposal_digest = expected_digest;
end;
$$;

create or replace function simulora.protect_action_proposal() returns trigger
language plpgsql as $$
declare
  action_actor uuid;
begin
  if (to_jsonb(new) - 'status') is distinct from (to_jsonb(old) - 'status') then
    raise exception 'Action proposal evidence is immutable';
  end if;
  if new.status is distinct from old.status and not (
    old.status = 'ACTIVE' and new.status in ('CONFIRMED', 'EXPIRED', 'REJECTED')
  ) then
    raise exception 'Invalid Action proposal status transition';
  end if;
  if old.status = 'ACTIVE' and new.status = 'CONFIRMED' then
    select actor_account_id into action_actor from simulora.actions where id = new.action_id;
    if not exists (
      select 1 from simulora.action_confirmations confirmation
      where confirmation.action_id = new.action_id
        and confirmation.proposal_id = new.id
        and confirmation.actor_account_id = action_actor
        and confirmation.proposal_digest = new.proposal_digest
        and confirmation.expected_head_commit_id = new.expected_head_commit_id
        and confirmation.confirmed_at <= new.expires_at
    ) then
      raise exception 'Confirmed proposal requires its exact live confirmation';
    end if;
  end if;
  return new;
end;
$$;

create function simulora.validate_generation_attempt_change() returns trigger
language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    if new.status <> 'RUNNING' or new.output is not null or new.completed_at is not null then
      raise exception 'Generation Attempt must begin RUNNING without output';
    end if;
    return new;
  end if;
  if (to_jsonb(new) - array['status', 'output', 'error_class', 'completed_at'])
     is distinct from (to_jsonb(old) - array['status', 'output', 'error_class', 'completed_at']) then
    raise exception 'Generation Attempt identity and compiled context are immutable';
  end if;
  if old.status <> 'RUNNING' or new.status not in ('SUCCEEDED', 'FAILED') then
    raise exception 'Invalid Generation Attempt status transition';
  end if;
  if new.completed_at is null
     or (new.status = 'SUCCEEDED' and new.output is null)
     or (new.status = 'FAILED' and nullif(trim(new.error_class), '') is null) then
    raise exception 'Completed Generation Attempt requires its exact result evidence';
  end if;
  return new;
end;
$$;

create trigger generation_attempt_insert_integrity
before insert on simulora.generation_attempts
for each row execute function simulora.validate_generation_attempt_change();

create trigger generation_attempt_update_integrity
before update on simulora.generation_attempts
for each row execute function simulora.validate_generation_attempt_change();

create trigger generation_attempt_delete_immutable
before delete on simulora.generation_attempts
for each row execute function simulora.reject_immutable_change();

alter table simulora.conversation_entries
  drop constraint conversation_entries_role_check;

alter table simulora.conversation_entries
  add column speaker_character_id text,
  add constraint conversation_entries_role_check
    check (role in ('USER', 'WORLD', 'CHARACTER')),
  add constraint conversation_entries_speaker_shape_check
    check (
      (role = 'CHARACTER' and speaker_character_id is not null
       and speaker_character_id ~ '^[a-z0-9][a-z0-9._-]*$')
      or (role in ('USER', 'WORLD') and speaker_character_id is null)
    );

create function simulora.validate_action_history_materialization() returns trigger
language plpgsql as $$
declare
  action simulora.actions%rowtype;
  proposal simulora.action_proposals%rowtype;
  resulting_document jsonb;
  expected_role text;
  expected_speaker text;
  exact_user_count integer;
  exact_response_count integer;
  total_count integer;
begin
  if new.kind <> 'ACTION_COMMITTED' then return new; end if;
  select * into action from simulora.actions where id = new.action_id;
  if action.operation_type = 'CHANGE_PARTICIPATION_CONTRACT' then return new; end if;
  select * into proposal from simulora.action_proposals where action_id = new.action_id;
  select document into resulting_document
    from simulora.state_revisions where id = new.state_revision_id;

  if action.operation_type = 'PARTICIPATE'
     and proposal.candidate_transition->'responseSource'->>'type' = 'CHARACTER' then
    expected_role := 'CHARACTER';
    expected_speaker := proposal.candidate_transition->'responseSource'->>'characterId';
  else
    expected_role := 'WORLD';
    expected_speaker := null;
  end if;

  select count(*)::integer into total_count
    from simulora.conversation_entries where commit_id = new.id;
  select count(*)::integer into exact_user_count
    from simulora.conversation_entries entry
    where entry.commit_id = new.id
      and entry.branch_id = new.branch_id
      and entry.ordinal = 1
      and entry.role = 'USER'
      and entry.speaker_character_id is null
      and entry.content = action.intent;
  select count(*)::integer into exact_response_count
    from simulora.conversation_entries entry
    where entry.commit_id = new.id
      and entry.branch_id = new.branch_id
      and entry.ordinal = 2
      and entry.role = expected_role
      and entry.speaker_character_id is not distinct from expected_speaker
      and entry.content = proposal.candidate_transition->>'narrative';

  if total_count <> 2 or exact_user_count <> 1 or exact_response_count <> 1
     or (expected_role = 'CHARACTER' and not exists (
       select 1 from jsonb_array_elements(resulting_document->'characters') character
       where character->>'id' = expected_speaker
     )) then
    raise exception 'Action Commit requires exact attributed conversation history';
  end if;
  return new;
end;
$$;

create constraint trigger action_commit_history_materialization_integrity
after insert on simulora.world_commits
deferrable initially deferred
for each row execute function simulora.validate_action_history_materialization();
