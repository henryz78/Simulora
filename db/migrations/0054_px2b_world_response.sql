-- PX-2b: unaddressed post-cutoff Actions are WORLD responses.
-- The ledger timestamp is the compatibility boundary for pending Actions.
create function simulora.px2b_world_response_apply(action_created_at timestamptz)
returns boolean language plpgsql stable as $$
declare
  applied timestamptz;
begin
  if to_regclass('app_meta.schema_migrations') is not null then
    execute 'select applied_at from app_meta.schema_migrations where name = $1'
      into applied using '0054_px2b_world_response.sql';
  end if;
  return action_created_at >= coalesce(applied, '-infinity'::timestamptz);
end;
$$;

create function simulora.px2b_reject_epoch_change() returns trigger
language plpgsql as $$
begin
  if old.name <> '0054_px2b_world_response.sql' then
    if tg_op = 'DELETE' then return old; end if;
    return new;
  end if;
  if tg_op = 'DELETE' then
    raise exception 'The PX-2b selection epoch is immutable' using errcode = '55000';
  end if;
  if new.name is distinct from old.name or new.applied_at is distinct from old.applied_at then
    raise exception 'The PX-2b selection epoch is immutable' using errcode = '55000';
  end if;
  return new;
end;
$$;

do $$
begin
  if to_regclass('app_meta.schema_migrations') is not null then
    create trigger px2b_selection_epoch_immutable
    before update or delete on app_meta.schema_migrations
    for each row execute function simulora.px2b_reject_epoch_change();
  end if;
end;
$$;
create or replace function simulora.re2_generation_context_pre_tb1(action_id uuid) returns jsonb
language plpgsql stable strict as $$
declare
  action simulora.actions%rowtype;
  state jsonb;
  world jsonb;
  source_state_id uuid;
  revision_id uuid;
  state_hash text;
  revision_hash text;
  target jsonb;
  spec jsonb;
  runtime jsonb;
  allowed jsonb;
  facts jsonb;
  relations jsonb;
  history jsonb;
  context jsonb;
begin
  select * into action from simulora.actions where id = action_id;
  if action.id is null or action.operation_type <> 'PARTICIPATE' then return null; end if;
  select snapshot.document, revision.document, snapshot.id, revision.id,
         snapshot.document_hash, revision.document_hash
    into state, world, source_state_id, revision_id, state_hash, revision_hash
    from simulora.world_commits commit
    join simulora.state_revisions snapshot on snapshot.id = commit.state_revision_id
    join simulora.continuities continuity on continuity.id = action.continuity_id
    join simulora.world_revisions revision on revision.id = continuity.world_revision_id
    where commit.id = action.expected_head_commit_id and commit.branch_id = action.branch_id;
  select fact into target from jsonb_array_elements(state->'facts') with ordinality as f(fact, position)
    where fact->>'scope' = 'SHARED' and fact->>'lifecycle' = 'ACTIVE' order by position limit 1;
  if target is null then return null; end if;
  select s.character, r.character into spec, runtime
    from jsonb_array_elements(world->'characters') with ordinality as s(character, position)
    join jsonb_array_elements(state->'characters') as r(character) on r.character->>'id' = s.character->>'id'
    where (
      (action.operation_payload->>'targetCharacterId' is not null
       and s.character->>'id' = action.operation_payload->>'targetCharacterId')
      or (
        action.operation_payload->>'targetCharacterId' is null
        and not simulora.px2b_world_response_apply(action.created_at)
      )
    )
      and (jsonb_exists(s.character->'knowledgeFactIds', target->>'id')
        or jsonb_exists(r.character->'knownFactIds', target->>'id'))
    order by s.position limit 1;
  if action.operation_payload->>'targetCharacterId' is not null and spec is null then return null; end if;
  select coalesce(jsonb_agg(to_jsonb(fact->>'id') order by position), '[]'::jsonb)
    into allowed from jsonb_array_elements(state->'facts') with ordinality as f(fact, position)
    where fact->>'lifecycle' = 'ACTIVE' and (
      fact->>'id' = target->>'id' or (
        fact->>'scope' <> 'ACCOUNT_PRIVATE'
        and (jsonb_exists(spec->'knowledgeFactIds', fact->>'id') or jsonb_exists(runtime->'knownFactIds', fact->>'id'))
      ));
  select coalesce(jsonb_agg(jsonb_build_object('id', fact->>'id', 'statement', fact->>'statement',
    'scope', fact->>'scope') order by position), '[]'::jsonb) into facts
    from jsonb_array_elements(state->'facts') with ordinality as f(fact, position)
    where jsonb_exists(allowed, fact->>'id');
  select coalesce(jsonb_agg(relation), '[]'::jsonb) into relations
    from jsonb_array_elements(state->'relationships') relation
    where relation->>'fromCharacterId' = spec->>'id' or relation->>'toCharacterId' = spec->>'id';
  -- Authorize conversation before inclusion; never carry old correction/removal/
  -- restore-era raw text forward as knowledge. No cancelled/pending output.
  with recursive recent as (
    select commit.*, 0 as distance,
      (commit.kind = 'RESTORE_COMMITTED' or exists (
        select 1 from simulora.domain_events event where event.commit_id = commit.id
          and event.event_type in ('CONTINUITY_ITEM_CORRECTED', 'CONTINUITY_ITEM_REMOVED'))) as boundary
      from simulora.world_commits commit where commit.id = action.expected_head_commit_id
    union all
    select parent.*, recent.distance + 1,
      (parent.kind = 'RESTORE_COMMITTED' or exists (
        select 1 from simulora.domain_events event where event.commit_id = parent.id
          and event.event_type in ('CONTINUITY_ITEM_CORRECTED', 'CONTINUITY_ITEM_REMOVED')))
      from recent join simulora.world_commits parent on parent.id = recent.parent_commit_id
      where not recent.boundary and recent.distance < 9 and parent.branch_id = action.branch_id
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'commitId', commit.id, 'stateRevisionId', commit.state_revision_id,
    'kind', commit.kind, 'sourceClass', commit.source_type, 'historyOnly', true,
    'events', coalesce((select jsonb_agg(jsonb_build_object(
      'id', event.id, 'type', event.event_type, 'scope', event.visibility_scope,
      'sourceClass', event.source_type, 'causeActionId', event.cause_action_id))
      from simulora.domain_events event where event.commit_id = commit.id
        and event.visibility_scope = 'SHARED'), '[]'::jsonb),
    'conversation', coalesce((
      select jsonb_agg(jsonb_build_object('id', entry.id, 'role', entry.role,
        'characterId', entry.speaker_character_id, 'content', entry.content) order by entry.ordinal)
        from simulora.conversation_entries entry
        join simulora.actions earlier on earlier.id = commit.action_id and earlier.operation_type = 'PARTICIPATE'
        join simulora.generation_attempts attempt on attempt.action_id = earlier.id and attempt.status = 'SUCCEEDED'
        where entry.commit_id = commit.id and not commit.boundary
          and attempt.context_manifest->'includedCharacterIds' =
            case when spec is null then '[]'::jsonb else jsonb_build_array(spec->>'id') end
          and not exists (select 1 from jsonb_array_elements_text(
            attempt.context_manifest->'includedFactIds') as permitted(fact_id)
            where not jsonb_exists(allowed, permitted.fact_id))
          and not simulora.generated_output_references_excluded_fact(entry.content, state, allowed)
    ), '[]'::jsonb)
  ) order by commit.distance desc), '[]'::jsonb) into history from recent commit;
  context := jsonb_build_object(
    'schemaVersion', 1,
    'source', jsonb_build_object('branchId', action.branch_id, 'headCommitId', action.expected_head_commit_id,
      'stateRevisionId', source_state_id, 'stateDigest', state_hash,
      'worldRevisionId', revision_id, 'worldRevisionDigest', revision_hash),
    'contract', jsonb_build_object('participation', action.participation_expectation,
      'userRole', world->'userRole', 'worldBoundaries', world->'interactionBoundaries',
      'currentBoundaries', state->'interactionBoundaries'),
    'world', jsonb_build_object('title', world->'title', 'premise', world->'premise',
      'startingBackground', jsonb_build_object('historyOnly', true, 'text', world->'startingSituation'),
      'locations', world->'locations', 'interactionPaths', world->'interactionPaths'),
    'current', jsonb_build_object('worldClock', state->'worldClock', 'facts', facts,
      'location', (select location from jsonb_array_elements(state->'locations') location
        where location->>'id' = runtime->>'locationId' limit 1),
      'character', case when spec is null then null else jsonb_build_object(
        'id', spec->>'id', 'name', spec->>'name', 'role', spec->>'role',
        'motives', spec->'motives', 'stance', spec->>'stance',
        'locationId', runtime->>'locationId', 'state', runtime->>'currentState') end,
      'relationships', relations),
    'history', history);
  -- Fail closed rather than truncate a canonical source or silently send private
  -- material. This is a byte bound, not a provider tokenizer estimate.
  if octet_length(simulora.canonical_jsonb_text(context)) > 48000
     or simulora.generated_output_references_excluded_fact(
       simulora.canonical_jsonb_text(context), state, allowed) then return null; end if;
  return context;
end;
$$;

create or replace function simulora.mgc_selected_character(p_action_id uuid) returns text
language plpgsql stable strict as $$
declare
  action simulora.actions%rowtype;
  state jsonb;
  world jsonb;
  target jsonb;
  selected text;
begin
  select * into action from simulora.actions where id = p_action_id;
  select snapshot.document, revision.document into state, world
    from simulora.world_commits commit
    join simulora.state_revisions snapshot on snapshot.id = commit.state_revision_id
    join simulora.continuities continuity on continuity.id = action.continuity_id
    join simulora.world_revisions revision on revision.id = continuity.world_revision_id
    where commit.id = action.expected_head_commit_id;
  select fact into target from jsonb_array_elements(state->'facts') with ordinality as f(fact, position)
    where fact->>'scope' = 'SHARED' and fact->>'lifecycle' = 'ACTIVE' order by position limit 1;
  if target is null then return null; end if;
  select s.character->>'id' into selected
    from jsonb_array_elements(world->'characters') with ordinality as s(character, position)
    join jsonb_array_elements(state->'characters') as r(character) on r.character->>'id' = s.character->>'id'
    where (
      (action.operation_payload->>'targetCharacterId' is not null
       and s.character->>'id' = action.operation_payload->>'targetCharacterId')
      or (
        action.operation_payload->>'targetCharacterId' is null
        and not simulora.px2b_world_response_apply(action.created_at)
      )
    )
      and (jsonb_exists(s.character->'knowledgeFactIds', target->>'id')
        or jsonb_exists(r.character->'knownFactIds', target->>'id'))
    order by s.position limit 1;
  return selected;
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
  effect_context jsonb;
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
    where (
      (action.operation_payload->>'targetCharacterId' is not null
       and spec.character->>'id' = action.operation_payload->>'targetCharacterId')
      or (
        action.operation_payload->>'targetCharacterId' is null
        and not simulora.px2b_world_response_apply(action.created_at)
      )
    )
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
  -- MGC-1: bind the declared effect context when this Action can use it.
  effect_context := simulora.mgc_effect_context(action.id);
  if effect_context is not null then
    expected_manifest := expected_manifest || jsonb_build_object('effectContextDigest', encode(
      sha256(convert_to(simulora.canonical_jsonb_text(effect_context), 'UTF8')), 'hex'));
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
    and attempt.adapter in ('deterministic', 'openai-compatible')
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
    -- MGC-1: closure operations need their effect context, authorized causes and
    -- the same authority and disclosure guards on every generated text field.
    when operation->>'type' in ('SHIFT_RELATIONSHIP', 'OPEN_THREAD', 'RESOLVE_THREAD', 'TRANSFORM_FAILURE') then
      effect_context is not null
      and coalesce(jsonb_typeof(operation->'causalFactIds'), '') = 'array'
      and operation->'causalFactIds' <@ included_fact_ids
      and not exists (
        select 1 from jsonb_array_elements_text(simulora.mgc_operation_texts(operation)) as field(value)
        where simulora.generated_narrative_authors_user(field.value, user_role_name,
            case when proposal.candidate_transition->'responseSource'->>'type' = 'CHARACTER'
              then selected_runtime->>'name' else null end)
          or simulora.generated_output_references_excluded_fact(field.value, parent_document, included_fact_ids)
      )
    else
      operation->>'provenance' = 'Confirmed Action ' || action.id::text
      and not simulora.generated_narrative_authors_user(operation->>'afterStatement', user_role_name)
      and not simulora.generated_narrative_authors_user(operation->>'provenance', user_role_name)
      and not simulora.generated_output_references_excluded_fact(operation->>'afterStatement', parent_document, included_fact_ids)
    end;
end;
$$;

create or replace function simulora.valid_action_no_effect_evidence(
  p_action simulora.actions,
  p_dialogue jsonb
) returns boolean
language plpgsql stable as $$
declare
  attempt_row simulora.generation_attempts%rowtype;
  candidate jsonb;
  operation jsonb;
  output_source jsonb;
  dialogue_source jsonb;
  source_branch uuid;
  source_state_revision uuid;
  source_state jsonb;
  world_document jsonb;
  re2_context jsonb;
  expected_character_id text;
  expected_response_source jsonb;
  target_fact jsonb;
  selected_character jsonb;
  selected_runtime jsonb;
  source_character_name text;
  known_fact_ids jsonb := '[]'::jsonb;
  included_fact_ids jsonb;
  included_character_ids jsonb;
  expected_manifest jsonb;
  prior_dialogue jsonb;
  prior_dialogue_ids jsonb;
  user_role_name text;
begin
  if (
    p_action.id is not null
    and p_action.operation_type = 'PARTICIPATE'
    and p_action.operation_payload->>'requestedEffect' = 'NO_WORLD_EFFECT'
    and p_action.status = 'COMPLETED_NO_EFFECT'
    and p_dialogue is not null
    and coalesce(jsonb_typeof(p_dialogue), '') = 'object'
    and simulora.valid_object_keys(p_dialogue, array[
      'id', 'narrative', 'responseSource', 'sourceHeadCommitId',
      'sourceStateRevisionId', 'provenance', 'visibilityScope', 'recordedAt'
    ])
    and p_dialogue->>'id' is not distinct from p_action.id::text
    and simulora.valid_text(p_dialogue->'narrative', 4000)
    and p_dialogue->>'sourceHeadCommitId' is not distinct from p_action.expected_head_commit_id::text
    and p_dialogue->>'provenance' is not distinct from 'Generated Action ' || p_action.id::text
    and p_dialogue->>'visibilityScope' is not distinct from 'CONTINUITY_PRIVATE'
    and simulora.valid_text(p_dialogue->'recordedAt', 120)
  ) is not true then
    return false;
  end if;

  select commit.branch_id, commit.state_revision_id, state.document, revision.document
    into source_branch, source_state_revision, source_state, world_document
    from simulora.world_commits commit
    join simulora.state_revisions state on state.id = commit.state_revision_id
    join simulora.continuities continuity on continuity.id = p_action.continuity_id
    join simulora.world_revisions revision on revision.id = continuity.world_revision_id
   where commit.id = p_action.expected_head_commit_id;
  if source_branch is distinct from p_action.branch_id
     or source_state_revision is distinct from (p_dialogue->>'sourceStateRevisionId')::uuid then
    return false;
  end if;

  select attempt.* into attempt_row
    from simulora.generation_attempts attempt
   where attempt.action_id = p_action.id and attempt.status = 'SUCCEEDED'
   order by attempt.attempt_number desc limit 1;
  if attempt_row.id is null
     or attempt_row.adapter not in ('deterministic', 'openai-compatible')
     or attempt_row.completed_at is null
     or coalesce(jsonb_typeof(attempt_row.output), '') <> 'object' then
    return false;
  end if;

  re2_context := simulora.re2_generation_context(p_action.id);
  if re2_context is null then return false; end if;
  expected_character_id := re2_context->'current'->'character'->>'id';
  expected_response_source := case
    when expected_character_id is null then jsonb_build_object('type', 'WORLD')
    else jsonb_build_object('type', 'CHARACTER', 'characterId', expected_character_id)
  end;

  output_source := attempt_row.output->'responseSource';
  dialogue_source := p_dialogue->'responseSource';
  if (
    coalesce(jsonb_typeof(output_source), '') = 'object'
    and (
      output_source = jsonb_build_object('type', 'WORLD')
      or (
        simulora.valid_object_keys(output_source, array['type', 'characterId'])
        and output_source->>'type' = 'CHARACTER'
        and simulora.valid_stable_id(output_source->'characterId')
      )
    )
  ) is not true
     or output_source is distinct from expected_response_source
     or dialogue_source is distinct from expected_response_source then
    return false;
  end if;

  candidate := attempt_row.output->'candidate';
  operation := candidate->'operation';
  if (
    coalesce(jsonb_typeof(candidate), '') = 'object'
    and simulora.valid_object_keys(candidate, array[
      'schemaVersion', 'actionId', 'expectedHeadCommitId', 'narrative',
      'responseSource', 'operation'
    ])
    and candidate->'schemaVersion' = '1'::jsonb
    and candidate->>'actionId' = p_action.id::text
    and candidate->>'expectedHeadCommitId' = p_action.expected_head_commit_id::text
    and simulora.valid_text(candidate->'narrative', 4000)
    and candidate->'responseSource' = expected_response_source
    and coalesce(jsonb_typeof(operation), '') = 'object'
    and simulora.valid_object_keys(operation, array['type', 'reason', 'causalFactIds'])
    and operation->>'type' = 'NO_WORLD_EFFECT'
    and simulora.valid_text(operation->'reason', 4000)
  ) is not true then
    return false;
  end if;
  if coalesce(jsonb_typeof(operation->'causalFactIds'), '') <> 'array' then
    return false;
  end if;
  if jsonb_array_length(operation->'causalFactIds') not between 1 and 4
     or simulora.valid_stable_id_array(operation->'causalFactIds') is not true then
    return false;
  end if;
  if attempt_row.output is distinct from jsonb_build_object(
    'narrative', candidate->'narrative',
    'responseSource', output_source,
    'candidate', candidate
  ) then
    return false;
  end if;
  if attempt_row.output->>'narrative' is distinct from p_dialogue->>'narrative'
     or candidate->'responseSource' is distinct from output_source then
    return false;
  end if;

  select fact into target_fact
    from jsonb_array_elements(source_state->'facts') with ordinality as facts(fact, position)
   where fact->>'lifecycle' = 'ACTIVE' and fact->>'scope' = 'SHARED'
   order by position limit 1;
  if target_fact is null then return false; end if;
  select spec.character, runtime.character
    into selected_character, selected_runtime
    from jsonb_array_elements(world_document->'characters') with ordinality as spec(character, position)
    join jsonb_array_elements(source_state->'characters') runtime(character)
      on runtime.character->>'id' = spec.character->>'id'
   where (
        (p_action.operation_payload->>'targetCharacterId' is not null
         and spec.character->>'id' = p_action.operation_payload->>'targetCharacterId')
        or (
          p_action.operation_payload->>'targetCharacterId' is null
          and not simulora.px2b_world_response_apply(p_action.created_at)
        )
      )
     and (jsonb_exists(spec.character->'knowledgeFactIds', target_fact->>'id')
          or jsonb_exists(runtime.character->'knownFactIds', target_fact->>'id'))
   order by spec.position limit 1;
  if p_action.operation_payload->>'targetCharacterId' is not null
     and selected_character is null then
    return false;
  end if;
  if expected_character_id is distinct from selected_character->>'id' then
    return false;
  end if;
  if selected_character is not null then
    select coalesce(jsonb_agg(to_jsonb(fact->>'id') order by position), '[]'::jsonb)
      into known_fact_ids
      from jsonb_array_elements(source_state->'facts') with ordinality as facts(fact, position)
     where fact->>'id' <> target_fact->>'id'
       and fact->>'lifecycle' = 'ACTIVE'
       and fact->>'scope' <> 'ACCOUNT_PRIVATE'
       and (jsonb_exists(selected_character->'knowledgeFactIds', fact->>'id')
            or jsonb_exists(selected_runtime->'knownFactIds', fact->>'id'));
  end if;
  included_fact_ids := jsonb_build_array(target_fact->>'id') || known_fact_ids;
  included_character_ids := case when selected_character is null
    then '[]'::jsonb else jsonb_build_array(selected_character->>'id') end;
  expected_manifest := jsonb_build_object(
    'compilerVersion', 're2-context-v1',
    'expectedHeadCommitId', p_action.expected_head_commit_id,
    'participation', p_action.participation_expectation,
    'includedFactIds', included_fact_ids,
    'includedCharacterIds', included_character_ids,
    'excludedScopeCounts', jsonb_build_object(
      'unauthorized', jsonb_array_length(source_state->'facts') - jsonb_array_length(included_fact_ids)
    ),
    'sourceContextDigest', encode(
      sha256(convert_to(simulora.canonical_jsonb_text(re2_context), 'UTF8')), 'hex'
    )
  );
  prior_dialogue := simulora.authorized_action_dialogue(p_action.id);
  select coalesce(jsonb_agg(entry.value->'id' order by entry.ordinality), '[]'::jsonb)
    into prior_dialogue_ids
    from jsonb_array_elements(coalesce(prior_dialogue, '[]'::jsonb)) with ordinality entry(value, ordinality);
  expected_manifest := expected_manifest || jsonb_build_object(
    'priorDialogueIds', prior_dialogue_ids,
    'priorDialogueDigest', encode(
      sha256(convert_to(simulora.canonical_jsonb_text(prior_dialogue), 'UTF8')), 'hex'
    )
  );
  if attempt_row.context_manifest is distinct from expected_manifest then
    return false;
  end if;

  if exists (
    select 1 from jsonb_array_elements_text(operation->'causalFactIds') causal(id)
     where not (included_fact_ids ? causal.id)
        or not exists (
          select 1 from jsonb_array_elements(source_state->'facts') fact
           where fact->>'id' = causal.id
             and fact->>'lifecycle' = 'ACTIVE'
             and fact->>'scope' <> 'ACCOUNT_PRIVATE'
        )
  ) then
    return false;
  end if;
  select character->>'name' into source_character_name
    from jsonb_array_elements(source_state->'characters') character
   where character->>'id' = expected_character_id;
  user_role_name := world_document->'userRole'->>'name';
  if simulora.generated_narrative_authors_user(
       p_dialogue->>'narrative', user_role_name, source_character_name
     )
     or simulora.generated_narrative_authors_user(
       operation->>'reason', user_role_name, source_character_name
     )
     or simulora.generated_output_references_excluded_fact(
       p_dialogue->>'narrative', source_state, included_fact_ids
     )
     or simulora.generated_output_references_excluded_fact(
       operation->>'reason', source_state, included_fact_ids
     ) then
    return false;
  end if;
  return true;
end;
$$;
