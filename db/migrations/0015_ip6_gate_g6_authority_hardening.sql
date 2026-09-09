-- Gate G6 authority hardening. Every Action Commit is materialized through
-- the same PostgreSQL-owned actor/head/confirmation/state/event boundary.

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
  if not (
    new.participation_expectation ? 'initiativeMode'
    and new.participation_expectation ? 'structureMode'
    and new.participation_expectation->>'initiativeMode' in ('DIRECT', 'GUIDED', 'WORLD_ACTIVE')
    and new.participation_expectation->>'structureMode' in ('OPEN_ENDED', 'GOAL_FRAMED')
    and new.participation_expectation = parent_participation
  ) then
    raise exception 'Action requires the exact current participation contract';
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

create function simulora.protect_action_identity() returns trigger
language plpgsql as $$
begin
  if (to_jsonb(new) - array['status', 'status_reason', 'terminal_at', 'row_version',
                            'acknowledged_at', 'updated_at'])
     is distinct from
     (to_jsonb(old) - array['status', 'status_reason', 'terminal_at', 'row_version',
                            'acknowledged_at', 'updated_at']) then
    raise exception 'Action identity, authority and command binding are immutable';
  end if;
  return new;
end;
$$;

create trigger action_identity_immutable
before update on simulora.actions
for each row execute function simulora.protect_action_identity();

create function simulora.validate_action_initial_status() returns trigger
language plpgsql as $$
begin
  if new.status is distinct from 'ACKNOWLEDGED' then
    raise exception 'New Action must begin as ACKNOWLEDGED';
  end if;
  return new;
end;
$$;

create trigger action_initial_status_integrity
before insert on simulora.actions
for each row execute function simulora.validate_action_initial_status();

create trigger action_delete_immutable
before delete on simulora.actions
for each row execute function simulora.reject_immutable_change();

create function simulora.action_proposal_effect_is_valid(
  proposal simulora.action_proposals
) returns boolean
language plpgsql stable strict as $$
declare
  action simulora.actions%rowtype;
  parent_document jsonb;
  operation jsonb;
  target_fact jsonb;
  expected_operation jsonb;
  expected_display jsonb;
  expected_digest text;
  digest_payload jsonb;
begin
  select * into action from simulora.actions where id = proposal.action_id;
  select state.document into parent_document
    from simulora.world_commits commit
    join simulora.state_revisions state on state.id = commit.state_revision_id
    where commit.id = proposal.expected_head_commit_id;
  if action.id is null
     or parent_document is null
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
       or operation is distinct from expected_operation then
      return false;
    end if;
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
  else
    return false;
  end if;

  if proposal.candidate_transition is distinct from jsonb_build_object(
       'schemaVersion', 1,
       'actionId', action.id,
       'expectedHeadCommitId', action.expected_head_commit_id,
       'narrative', proposal.candidate_transition->>'narrative',
       'operation', expected_operation
     )
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

create or replace function simulora.validate_action_proposal_binding() returns trigger
language plpgsql as $$
declare
  action_status text;
  operation_type text;
  attempt_action uuid;
begin
  select action.status, action.operation_type into action_status, operation_type
    from simulora.actions action where action.id = new.action_id;
  if action_status is distinct from 'VALIDATING'
     or new.status is distinct from 'ACTIVE'
     or not simulora.action_proposal_effect_is_valid(new) then
    raise exception 'Proposal must exactly bind a validating Action, effect, digest and current head';
  end if;
  if operation_type = 'PARTICIPATE' and new.generation_attempt_id is null then
    raise exception 'PARTICIPATE proposal requires a Generation Attempt';
  end if;
  if operation_type <> 'PARTICIPATE' and new.generation_attempt_id is not null then
    raise exception 'Direct proposal cannot bind a Generation Attempt';
  end if;
  if new.generation_attempt_id is not null then
    select action_id into attempt_action
      from simulora.generation_attempts where id = new.generation_attempt_id;
    if attempt_action is distinct from new.action_id then
      raise exception 'Proposal Generation Attempt must belong to its Action';
    end if;
  end if;
  return new;
end;
$$;

create function simulora.protect_action_proposal() returns trigger
language plpgsql as $$
begin
  if (to_jsonb(new) - 'status') is distinct from (to_jsonb(old) - 'status') then
    raise exception 'Action proposal evidence is immutable';
  end if;
  if new.status is distinct from old.status and not (
    old.status = 'ACTIVE' and new.status in ('CONFIRMED', 'EXPIRED', 'REJECTED')
  ) then
    raise exception 'Invalid Action proposal status transition';
  end if;
  return new;
end;
$$;

create trigger action_proposal_update_integrity
before update on simulora.action_proposals
for each row execute function simulora.protect_action_proposal();

create trigger action_proposal_delete_immutable
before delete on simulora.action_proposals
for each row execute function simulora.reject_immutable_change();

create trigger action_confirmation_immutable
before update or delete on simulora.action_confirmations
for each row execute function simulora.reject_immutable_change();

create or replace function simulora.validate_action_confirmation() returns trigger
language plpgsql as $$
declare
  action simulora.actions%rowtype;
  proposal simulora.action_proposals%rowtype;
  current_head uuid;
  active_branch uuid;
begin
  select * into action from simulora.actions where id = new.action_id;
  select * into proposal from simulora.action_proposals where id = new.proposal_id;
  select branch.head_commit_id, continuity.active_branch_id
    into current_head, active_branch
    from simulora.branches branch
    join simulora.continuities continuity on continuity.id = branch.continuity_id
    where branch.id = action.branch_id;
  if proposal.action_id is distinct from action.id
     or proposal.proposal_digest is distinct from new.proposal_digest
     or proposal.expected_head_commit_id is distinct from new.expected_head_commit_id
     or action.actor_account_id is distinct from new.actor_account_id
     or action.expected_head_commit_id is distinct from new.expected_head_commit_id
     or action.status not in ('VALIDATING', 'AWAITING_CONFIRMATION')
     or proposal.status is distinct from 'ACTIVE'
     or new.confirmed_at > clock_timestamp()
     or proposal.expires_at <= new.confirmed_at
     or proposal.expires_at <= clock_timestamp()
     or current_head is distinct from new.expected_head_commit_id
     or active_branch is distinct from action.branch_id
     or not simulora.action_proposal_effect_is_valid(proposal) then
    raise exception 'Confirmation must bind the exact live Action, actor, proposal, digest and current head';
  end if;
  return new;
end;
$$;

create or replace function simulora.validate_action_commit_binding() returns trigger
language plpgsql as $$
declare
  action simulora.actions%rowtype;
  proposal simulora.action_proposals%rowtype;
  current_head uuid;
  branch_status text;
  active_branch uuid;
  continuity_owner uuid;
  continuity_status text;
  confirmation_count integer;
begin
  if new.action_id is null then return new; end if;
  select * into action from simulora.actions where id = new.action_id;
  select * into proposal from simulora.action_proposals where action_id = new.action_id;
  select branch.head_commit_id, branch.status, continuity.active_branch_id,
         continuity.owner_account_id, continuity.status
    into current_head, branch_status, active_branch, continuity_owner, continuity_status
    from simulora.branches branch
    join simulora.continuities continuity on continuity.id = branch.continuity_id
    where branch.id = new.branch_id
    for share of branch, continuity;
  select count(*)::integer into confirmation_count
    from simulora.action_confirmations confirmation
    where confirmation.action_id = action.id
      and confirmation.proposal_id = proposal.id
      and confirmation.actor_account_id = action.actor_account_id
      and confirmation.proposal_digest = proposal.proposal_digest
      and confirmation.expected_head_commit_id = action.expected_head_commit_id
      and confirmation.confirmed_at < proposal.expires_at;
  if new.kind is distinct from 'ACTION_COMMITTED'
     or new.source_type is distinct from 'USER'
     or action.branch_id is distinct from new.branch_id
     or action.actor_account_id is distinct from new.actor_account_id
     or action.actor_account_id is distinct from continuity_owner
     or action.expected_head_commit_id is distinct from new.parent_commit_id
     or action.status is distinct from 'COMMITTING'
     or proposal.status is distinct from 'CONFIRMED'
     or proposal.expires_at <= clock_timestamp()
     or confirmation_count <> 1
     or current_head is distinct from new.parent_commit_id
     or branch_status is distinct from 'ACTIVE'
     or continuity_status is distinct from 'ACTIVE'
     or active_branch is distinct from new.branch_id
     or not simulora.action_proposal_effect_is_valid(proposal) then
    raise exception 'Action Commit requires exact user authority, confirmation and current active head';
  end if;
  return new;
end;
$$;

create function simulora.expected_action_state(p_action_id uuid) returns jsonb
language plpgsql stable as $$
declare
  action simulora.actions%rowtype;
  proposal simulora.action_proposals%rowtype;
  parent_document jsonb;
  operation jsonb;
  expected_document jsonb;
  expected_facts jsonb;
begin
  select * into action from simulora.actions where id = p_action_id;
  select * into proposal from simulora.action_proposals where action_proposals.action_id = p_action_id;
  select state.document into parent_document
    from simulora.world_commits commit
    join simulora.state_revisions state on state.id = commit.state_revision_id
    where commit.id = action.expected_head_commit_id;
  operation := proposal.candidate_transition->'operation';
  expected_document := parent_document;

  if action.operation_type = 'CHANGE_PARTICIPATION_CONTRACT' then
    return jsonb_set(expected_document, '{participation}', action.operation_payload->'after');
  end if;

  if action.operation_type = 'PARTICIPATE' then
    select jsonb_agg(
      case when fact->>'id' = operation->>'targetFactId' then
        fact || jsonb_build_object(
          'statement', operation->>'afterStatement',
          'scope', operation->>'scope',
          'provenance', operation->>'provenance'
        )
      else fact end order by position
    ) into expected_facts
      from jsonb_array_elements(parent_document->'facts') with ordinality as facts(fact, position);
    expected_document := jsonb_set(expected_document, '{facts}', expected_facts);
    expected_document := jsonb_set(expected_document, '{worldClock}', jsonb_build_object(
      'turn', ((parent_document->'worldClock'->>'turn')::integer + 1),
      'label', 'After action ' || ((parent_document->'worldClock'->>'turn')::integer + 1)
    ));
    return jsonb_set(
      expected_document,
      '{openThreads}',
      parent_document->'openThreads' || jsonb_build_array(proposal.candidate_transition->>'narrative')
    );
  end if;

  select jsonb_agg(
    case when fact->>'id' = operation->>'targetFactId' then
      case when action.operation_type = 'REMOVE_CONTINUITY' then
        fact || jsonb_build_object(
          'lifecycle', 'REMOVED',
          'removalReason', operation->>'reason',
          'provenance', 'Direct user removal ' || action.id::text
        )
      else
        fact || jsonb_build_object(
          'statement', operation->>'afterStatement',
          'lifecycle', 'ACTIVE',
          'provenance', 'Direct user correction ' || action.id::text
        )
      end
    else fact end order by position
  ) into expected_facts
    from jsonb_array_elements(parent_document->'facts') with ordinality as facts(fact, position);
  return jsonb_set(expected_document, '{facts}', expected_facts);
end;
$$;

create function simulora.validate_action_materialization() returns trigger
language plpgsql as $$
declare
  action simulora.actions%rowtype;
  proposal simulora.action_proposals%rowtype;
  resulting_document jsonb;
  expected_document jsonb;
  branch_head uuid;
  branch_state_head uuid;
  branch_status text;
  active_branch uuid;
  continuity_status text;
  expected_event_type text;
  expected_visibility text;
  expected_payload jsonb;
  event_count integer;
begin
  if new.kind <> 'ACTION_COMMITTED' then return new; end if;
  select * into action from simulora.actions where id = new.action_id;
  select * into proposal from simulora.action_proposals where action_id = new.action_id;
  select document into resulting_document
    from simulora.state_revisions where id = new.state_revision_id;
  expected_document := simulora.expected_action_state(new.action_id);
  select branch.head_commit_id, branch.head_state_revision_id, branch.status,
         continuity.active_branch_id, continuity.status
    into branch_head, branch_state_head, branch_status, active_branch, continuity_status
    from simulora.branches branch
    join simulora.continuities continuity on continuity.id = branch.continuity_id
    where branch.id = new.branch_id;

  if action.operation_type = 'PARTICIPATE' then
    expected_event_type := 'ACTION_RECORDED';
    expected_visibility := proposal.display_effect->>'scope';
    expected_payload := jsonb_build_object(
      'actionId', action.id,
      'target', proposal.display_effect->>'target'
    );
  elsif action.operation_type = 'CORRECT_CONTINUITY' then
    expected_event_type := 'CONTINUITY_ITEM_CORRECTED';
    expected_visibility := proposal.display_effect->>'scope';
    expected_payload := jsonb_build_object(
      'actionId', action.id,
      'targetFactId', proposal.display_effect->>'target',
      'operation', action.operation_type,
      'before', proposal.display_effect->>'before',
      'after', proposal.display_effect->>'after',
      'scope', proposal.display_effect->>'scope',
      'reason', action.operation_payload->>'reason'
    );
  elsif action.operation_type = 'REMOVE_CONTINUITY' then
    expected_event_type := 'CONTINUITY_ITEM_REMOVED';
    expected_visibility := proposal.display_effect->>'scope';
    expected_payload := jsonb_build_object(
      'actionId', action.id,
      'targetFactId', proposal.display_effect->>'target',
      'operation', action.operation_type,
      'before', proposal.display_effect->>'before',
      'after', proposal.display_effect->>'after',
      'scope', proposal.display_effect->>'scope',
      'reason', action.operation_payload->>'reason'
    );
  else
    expected_event_type := 'PARTICIPATION_CONTRACT_CHANGED';
    expected_visibility := 'ACCOUNT_PRIVATE';
    expected_payload := jsonb_build_object(
      'actionId', action.id,
      'before', action.operation_payload->'before',
      'after', action.operation_payload->'after'
    );
  end if;

  select count(*)::integer into event_count
    from simulora.domain_events event
    where event.commit_id = new.id
      and event.branch_id = new.branch_id
      and event.event_type = expected_event_type
      and event.source_type = 'USER'
      and event.visibility_scope = expected_visibility
      and event.cause_action_id = action.id
      and event.payload = expected_payload;

  if action.status is distinct from 'COMMITTED'
     or proposal.status is distinct from 'CONFIRMED'
     or not simulora.action_proposal_effect_is_valid(proposal)
     or resulting_document is distinct from expected_document
     or branch_head is distinct from new.id
     or branch_state_head is distinct from new.state_revision_id
     or branch_status is distinct from 'ACTIVE'
     or continuity_status is distinct from 'ACTIVE'
     or active_branch is distinct from new.branch_id
     or event_count <> 1
     or (select count(*) from simulora.domain_events where commit_id = new.id) <> 1 then
    raise exception 'Action Commit requires exact state, typed Event, terminal Action and advanced active Branch head';
  end if;
  return new;
end;
$$;

create constraint trigger action_commit_materialization_integrity
after insert on simulora.world_commits
deferrable initially deferred
for each row execute function simulora.validate_action_materialization();
