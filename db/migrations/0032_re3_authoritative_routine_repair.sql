-- Approved bounded RE-3 policy. Provisioned administratively for experiment
-- revisions only; neither creator API nor generated prose can grant it.
create table simulora.re3_routine_policies (
  world_revision_id uuid primary key references simulora.world_revisions(id),
  document jsonb not null,
  digest text not null
);

create function simulora.validate_re3_routine_policy() returns trigger
language plpgsql as $$
declare
  world_document jsonb;
  route jsonb;
  member_id jsonb;
begin
  select document into world_document from simulora.world_revisions where id = new.world_revision_id;
  if not simulora.valid_object_keys(new.document, array['version', 'npcIds', 'publicLocationIds', 'routes'])
     or new.document->>'version' is distinct from 're3-routine-v1'
     or not simulora.valid_stable_id_array(new.document->'npcIds')
     or not simulora.valid_stable_id_array(new.document->'publicLocationIds')
     or jsonb_array_length(new.document->'npcIds') < 1
     or jsonb_array_length(new.document->'publicLocationIds') < 2
     or coalesce(jsonb_typeof(new.document->'routes'), '') <> 'array'
     or jsonb_array_length(new.document->'routes') < 1 then
    raise exception 'Invalid bounded routine policy';
  end if;
  for member_id in select value from jsonb_array_elements(new.document->'npcIds') loop
    if not exists (select 1 from jsonb_array_elements(world_document->'characters') character where character->'id' = member_id) then
      raise exception 'Routine NPC must exist in pinned World Revision';
    end if;
  end loop;
  for member_id in select value from jsonb_array_elements(new.document->'publicLocationIds') loop
    if not exists (select 1 from jsonb_array_elements(world_document->'locations') location where location->'id' = member_id) then
      raise exception 'Routine public location must exist in pinned World Revision';
    end if;
  end loop;
  for route in select value from jsonb_array_elements(new.document->'routes') loop
    if not simulora.valid_object_keys(route, array['fromLocationId', 'toLocationId', 'label'])
       or not simulora.valid_stable_id(route->'fromLocationId')
       or not simulora.valid_stable_id(route->'toLocationId')
       or not simulora.valid_text(route->'label', 4000)
       or route->>'fromLocationId' = route->>'toLocationId'
       or not jsonb_exists(new.document->'publicLocationIds', route->>'fromLocationId')
       or not jsonb_exists(new.document->'publicLocationIds', route->>'toLocationId') then
      raise exception 'Routine route must connect declared public locations';
    end if;
  end loop;
  new.digest := encode(sha256(convert_to(simulora.canonical_jsonb_text(new.document), 'UTF8')), 'hex');
  return new;
end;
$$;
create trigger re3_routine_policy_shape before insert on simulora.re3_routine_policies
for each row execute function simulora.validate_re3_routine_policy();
create trigger re3_routine_policy_immutable before update or delete on simulora.re3_routine_policies
for each row execute function simulora.reject_immutable_change();

-- Authored routes remain descriptive, never permissions.
alter function simulora.valid_world_revision_document(jsonb) rename to valid_world_revision_document_pre_re3;
create function simulora.valid_world_revision_document(candidate jsonb) returns boolean
language plpgsql immutable strict as $$
declare route jsonb;
begin
  if not simulora.valid_world_revision_document_pre_re3(candidate - 'routineRoutes') then return false; end if;
  if not candidate ? 'routineRoutes' then return true; end if;
  if coalesce(jsonb_typeof(candidate->'routineRoutes'), '') <> 'array' then return false; end if;
  for route in select value from jsonb_array_elements(candidate->'routineRoutes') loop
    if not simulora.valid_object_keys(route, array['fromLocationId', 'toLocationId', 'label'])
       or not simulora.valid_stable_id(route->'fromLocationId')
       or not simulora.valid_stable_id(route->'toLocationId')
       or not simulora.valid_text(route->'label', 4000)
       or route->>'fromLocationId' = route->>'toLocationId'
       or not exists (select 1 from jsonb_array_elements(candidate->'locations') location where location->>'id' = route->>'fromLocationId')
       or not exists (select 1 from jsonb_array_elements(candidate->'locations') location where location->>'id' = route->>'toLocationId') then return false; end if;
  end loop;
  return true;
end;
$$;

create or replace function simulora.action_proposal_effect_is_valid(proposal simulora.action_proposals)
returns boolean language plpgsql stable strict as $$
declare
  action_row simulora.actions%rowtype;
  parent_document jsonb;
  policy_document jsonb;
  operation jsonb := proposal.candidate_transition->'operation';
  expected_operation jsonb;
  expected_candidate jsonb;
  expected_display jsonb;
  digest_payload jsonb;
  character_row jsonb;
begin
  select * into action_row from simulora.actions where id = proposal.action_id;
  if proposal.impact_level <> 'L2' then
    if action_row.operation_type = 'PARTICIPATE'
       and coalesce(action_row.operation_payload->>'requestedEffect', 'FACT_REWRITE') <> 'FACT_REWRITE' then return false; end if;
    return coalesce(simulora.action_proposal_effect_is_valid_legacy(proposal), false);
  end if;
  if coalesce(jsonb_typeof(operation->'causalFactIds'), '') <> 'array' then return false; end if;
  if not simulora.valid_stable_id_array(operation->'causalFactIds')
     or jsonb_array_length(operation->'causalFactIds') not between 1 and 4 then return false; end if;
  select state.document into parent_document from simulora.world_commits commit
    join simulora.state_revisions state on state.id = commit.state_revision_id
    where commit.id = action_row.expected_head_commit_id;
  select policy.document into policy_document from simulora.re3_routine_policies policy
    join simulora.continuities continuity on continuity.world_revision_id = policy.world_revision_id
    where continuity.id = action_row.continuity_id;
  select character into character_row from jsonb_array_elements(parent_document->'characters') character
    where character->>'id' = operation->>'characterId';
  expected_operation := jsonb_build_object('type', 'MOVE_CHARACTER',
    'characterId', action_row.operation_payload->>'targetCharacterId',
    'beforeLocationId', character_row->>'locationId',
    'afterLocationId', operation->>'afterLocationId', 'causalFactIds', operation->'causalFactIds');
  expected_candidate := jsonb_build_object('schemaVersion', 1, 'actionId', action_row.id,
    'expectedHeadCommitId', action_row.expected_head_commit_id,
    'narrative', proposal.candidate_transition->>'narrative',
    'responseSource', jsonb_build_object('type', 'CHARACTER', 'characterId', action_row.operation_payload->>'targetCharacterId'),
    'operation', expected_operation);
  expected_display := jsonb_build_object('target', operation->>'characterId',
    'before', operation->>'beforeLocationId', 'after', operation->>'afterLocationId', 'scope', 'SHARED');
  digest_payload := jsonb_build_object('actionId', action_row.id, 'actorAccountId', action_row.actor_account_id,
    'expectedHeadCommitId', action_row.expected_head_commit_id, 'candidate', proposal.candidate_transition,
    'displayEffect', proposal.display_effect, 'expiresAt', to_char(proposal.expires_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'));
  return coalesce(
    action_row.id is not null and parent_document is not null and policy_document is not null
    and action_row.operation_type = 'PARTICIPATE'
    and action_row.operation_payload->>'requestedEffect' = 'ROUTINE_EFFECT'
    and proposal.expected_head_commit_id = action_row.expected_head_commit_id
    and proposal.schema_version = 1 and proposal.expires_at > proposal.created_at
    and simulora.valid_text(proposal.candidate_transition->'narrative', 4000)
    and jsonb_exists(policy_document->'npcIds', operation->>'characterId')
    and operation->>'beforeLocationId' <> operation->>'afterLocationId'
    and exists (select 1 from jsonb_array_elements(parent_document->'locations') location where location->>'id' = operation->>'afterLocationId')
    and exists (select 1 from jsonb_array_elements(policy_document->'routes') route
      where route->>'fromLocationId' = operation->>'beforeLocationId' and route->>'toLocationId' = operation->>'afterLocationId')
    and proposal.candidate_transition = expected_candidate
    and proposal.display_effect = expected_display
    and proposal.proposal_digest = encode(sha256(convert_to(simulora.canonical_jsonb_text(digest_payload), 'UTF8')), 'hex')
    and simulora.action_generation_evidence_is_valid(proposal), false);
end;
$$;
create or replace function simulora.validate_re2_action_target() returns trigger
language plpgsql as $$
declare
  state jsonb;
  world jsonb;
  target jsonb;
begin
  if new.operation_type <> 'PARTICIPATE' then return new; end if;
  if not simulora.valid_object_keys(new.operation_payload, array['targetCharacterId', 'requestedEffect']) then
    raise exception 'Ordinary Action targeting cannot change authority or participation';
  end if;
  if new.operation_payload ? 'requestedEffect' and coalesce(new.operation_payload->>'requestedEffect', '') not in ('FACT_REWRITE', 'ROUTINE_EFFECT', 'NO_WORLD_EFFECT') then
    raise exception 'Unknown closed requested effect';
  end if;
  if new.operation_payload ? 'targetCharacterId' and not coalesce(simulora.valid_stable_id(new.operation_payload->'targetCharacterId'), false) then
    raise exception 'Invalid explicit Character target';
  end if;
  if new.operation_payload->>'requestedEffect' = 'ROUTINE_EFFECT' and not new.operation_payload ? 'targetCharacterId' then
    raise exception 'Routine effect requires explicit Character selection';
  end if;
  if not new.operation_payload ? 'targetCharacterId' then return new; end if;
  select revision.document, snapshot.document into world, state
    from simulora.world_commits commit
    join simulora.state_revisions snapshot on snapshot.id = commit.state_revision_id
    join simulora.continuities continuity on continuity.id = new.continuity_id
    join simulora.world_revisions revision on revision.id = continuity.world_revision_id
    where commit.id = new.expected_head_commit_id;
  select fact into target from jsonb_array_elements(state->'facts') with ordinality as f(fact, position)
    where fact->>'scope' = 'SHARED' and fact->>'lifecycle' = 'ACTIVE' order by position limit 1;
  if not exists (
    select 1 from jsonb_array_elements(world->'characters') spec
    join jsonb_array_elements(state->'characters') runtime on runtime->>'id' = spec->>'id'
    where spec->>'id' = new.operation_payload->>'targetCharacterId'
      and (jsonb_exists(spec->'knowledgeFactIds', target->>'id') or jsonb_exists(runtime->'knownFactIds', target->>'id'))
  ) then raise exception 'Selected Character is unavailable or cannot know the canonical target'; end if;
  return new;
end;
$$;


create or replace function simulora.action_generation_evidence_is_valid(
  proposal simulora.action_proposals
) returns boolean
language plpgsql stable strict as $$
declare
  action simulora.actions%rowtype;
  attempt simulora.generation_attempts%rowtype;
  parent_document jsonb;
  world_document jsonb;
  target_fact jsonb;
  selected_character jsonb;
  selected_runtime jsonb;
  known_fact_ids jsonb := '[]'::jsonb;
  included_fact_ids jsonb;
  included_character_ids jsonb;
  expected_manifest jsonb;
  expected_output jsonb;
  operation jsonb;
  user_role_name text;
  policy_digest text;
begin
  select * into action from simulora.actions where id = proposal.action_id;
  if action.operation_type <> 'PARTICIPATE' then
    return proposal.generation_attempt_id is null;
  end if;

  select * into attempt
    from simulora.generation_attempts where id = proposal.generation_attempt_id;
  select state.document, revision.document
    into parent_document, world_document
    from simulora.world_commits commit
    join simulora.state_revisions state on state.id = commit.state_revision_id
    join simulora.continuities continuity on continuity.id = action.continuity_id
    join simulora.world_revisions revision on revision.id = continuity.world_revision_id
    where commit.id = action.expected_head_commit_id;

  select fact into target_fact
    from jsonb_array_elements(parent_document->'facts') with ordinality as facts(fact, position)
    where fact->>'lifecycle' = 'ACTIVE' and fact->>'scope' = 'SHARED'
    order by position limit 1;
  if target_fact is null then return false; end if;

  select spec.character, runtime_row.runtime_character
    into selected_character, selected_runtime
    from jsonb_array_elements(world_document->'characters') with ordinality
      as spec(character, position)
    join lateral (
      select runtime_character
        from jsonb_array_elements(parent_document->'characters') runtime_character
        where runtime_character->>'id' = spec.character->>'id'
        limit 1
    ) runtime_row on true
    where (action.operation_payload->>'targetCharacterId' is null
           or spec.character->>'id' = action.operation_payload->>'targetCharacterId')
      and (jsonb_exists(spec.character->'knowledgeFactIds', target_fact->>'id')
       or jsonb_exists(runtime_row.runtime_character->'knownFactIds', target_fact->>'id'))
    order by spec.position limit 1;

  if selected_character is not null then
    select coalesce(jsonb_agg(to_jsonb(fact->>'id') order by position), '[]'::jsonb)
      into known_fact_ids
      from jsonb_array_elements(parent_document->'facts') with ordinality as facts(fact, position)
      where fact->>'id' <> target_fact->>'id'
        and fact->>'lifecycle' = 'ACTIVE'
        and fact->>'scope' <> 'ACCOUNT_PRIVATE'
        and (
          jsonb_exists(selected_character->'knowledgeFactIds', fact->>'id')
          or jsonb_exists(selected_runtime->'knownFactIds', fact->>'id')
        );
  end if;

  included_fact_ids := jsonb_build_array(target_fact->>'id') || known_fact_ids;
  included_character_ids := case when selected_character is null
    then '[]'::jsonb else jsonb_build_array(selected_character->>'id') end;
  expected_manifest := jsonb_build_object(
    'compilerVersion', 'ip6-context-v1',
    'expectedHeadCommitId', action.expected_head_commit_id,
    'participation', action.participation_expectation,
    'includedFactIds', included_fact_ids,
    'includedCharacterIds', included_character_ids,
    'excludedScopeCounts', jsonb_build_object(
      'unauthorized', jsonb_array_length(parent_document->'facts') - jsonb_array_length(included_fact_ids)
    )
  );
  if attempt.context_manifest->>'compilerVersion' = 're2-context-v1' then
    if simulora.re2_generation_context(action.id) is null then return false; end if;
    expected_manifest := jsonb_set(expected_manifest, '{compilerVersion}', '"re2-context-v1"'::jsonb)
      || jsonb_build_object('sourceContextDigest', encode(
        sha256(convert_to(simulora.canonical_jsonb_text(simulora.re2_generation_context(action.id)), 'UTF8')), 'hex'));
  elsif action.operation_payload <> '{}'::jsonb then
    -- Explicit targeting is a v2 command; legacy evidence may not bind it.
    return false;
  end if;
  if action.operation_payload->>'requestedEffect' = 'ROUTINE_EFFECT' then
    select policy.digest into policy_digest from simulora.re3_routine_policies policy
      join simulora.continuities continuity on continuity.world_revision_id = policy.world_revision_id
      where continuity.id = action.continuity_id;
    if policy_digest is null then return false; end if;
    expected_manifest := expected_manifest || jsonb_build_object('routinePolicyDigest', policy_digest);
  end if;
  expected_output := jsonb_build_object(
    'narrative', proposal.candidate_transition->'narrative',
    'responseSource', proposal.candidate_transition->'responseSource',
    'candidate', proposal.candidate_transition
  );
  operation := proposal.candidate_transition->'operation';
  user_role_name := world_document->'userRole'->>'name';

  return attempt.id is not null
    and attempt.action_id = action.id
    and attempt.adapter = 'deterministic'
    and attempt.status = 'SUCCEEDED'
    and attempt.completed_at is not null
    and attempt.context_manifest = expected_manifest
    and attempt.output = expected_output
    and not simulora.generated_narrative_authors_user(
      proposal.candidate_transition->>'narrative', user_role_name,
      case when proposal.candidate_transition->'responseSource'->>'type' = 'CHARACTER'
        then selected_runtime->>'name' else null end
    )
    and not simulora.generated_output_references_excluded_fact(
      proposal.candidate_transition->>'narrative', parent_document, included_fact_ids
    )
    and case when operation->>'type' = 'MOVE_CHARACTER' then
      proposal.impact_level = 'L2'
      and coalesce(jsonb_typeof(operation->'causalFactIds'), '') = 'array'
      and operation->'causalFactIds' <@ included_fact_ids
    else
      operation->>'provenance' = 'Confirmed Action ' || action.id::text
      and not simulora.generated_narrative_authors_user(operation->>'afterStatement', user_role_name)
      and not simulora.generated_narrative_authors_user(operation->>'provenance', user_role_name)
      and not simulora.generated_output_references_excluded_fact(operation->>'afterStatement', parent_document, included_fact_ids)
    end;
end;
$$;


alter function simulora.expected_action_state(uuid) rename to expected_action_state_pre_re3;
create function simulora.expected_action_state(p_action_id uuid) returns jsonb
language plpgsql stable as $$
declare
  action simulora.actions%rowtype;
  proposal simulora.action_proposals%rowtype;
  parent_document jsonb;
  operation jsonb;
  destination jsonb;
  characters jsonb;
  expected_document jsonb;
begin
  select * into action from simulora.actions where id = p_action_id;
  select * into proposal from simulora.action_proposals where action_id = p_action_id;
  operation := proposal.candidate_transition->'operation';
  if action.operation_type <> 'PARTICIPATE' or operation->>'type' is distinct from 'MOVE_CHARACTER' then
    return simulora.expected_action_state_pre_re3(p_action_id);
  end if;
  select state.document into parent_document from simulora.world_commits commit
    join simulora.state_revisions state on state.id = commit.state_revision_id
    where commit.id = action.expected_head_commit_id;
  select location into destination from jsonb_array_elements(parent_document->'locations') location
    where location->>'id' = operation->>'afterLocationId';
  select jsonb_agg(case when character->>'id' = operation->>'characterId' then
    character || jsonb_build_object('locationId', operation->>'afterLocationId',
      'currentState', 'Present at ' || (destination->>'name') || '.')
    else character end order by position) into characters
    from jsonb_array_elements(parent_document->'characters') with ordinality as items(character, position);
  expected_document := jsonb_set(parent_document, '{characters}', characters);
  expected_document := jsonb_set(expected_document, '{worldClock}', jsonb_build_object(
    'turn', ((parent_document->'worldClock'->>'turn')::integer + 1),
    'label', 'After action ' || ((parent_document->'worldClock'->>'turn')::integer + 1)));
  return jsonb_set(expected_document, '{openThreads}',
    parent_document->'openThreads' || jsonb_build_array(proposal.candidate_transition->>'narrative'));
end;
$$;

create or replace function simulora.validate_action_materialization() returns trigger
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
    if proposal.candidate_transition->'operation'->>'type' = 'MOVE_CHARACTER' then
      expected_event_type := 'CHARACTER_MOVED';
      expected_payload := jsonb_build_object(
        'actionId', action.id,
        'characterId', proposal.candidate_transition->'operation'->>'characterId',
        'beforeLocationId', proposal.candidate_transition->'operation'->>'beforeLocationId',
        'afterLocationId', proposal.candidate_transition->'operation'->>'afterLocationId',
        'causalFactIds', proposal.candidate_transition->'operation'->'causalFactIds'
      );
    end if;
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
