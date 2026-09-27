-- WD-1b: author secrets revealed through an L2 REVEAL_FACT (ADR-WD1-3), and the
-- STORY_DECIDES requested effect (ADR-WD1-4). Both are new values, so no Action
-- created before this migration can carry them; no epoch is needed.

-- World Revisions may declare discoverable continuity-private facts.
alter function simulora.valid_world_revision_document(jsonb) rename to valid_world_revision_document_pre_wd1b;
create function simulora.valid_world_revision_document(candidate jsonb) returns boolean
language plpgsql immutable strict as $$
declare
  declared jsonb;
begin
  if coalesce(jsonb_typeof(candidate), '') <> 'object' or not candidate ? 'discoverableFacts' then
    return simulora.valid_world_revision_document_pre_wd1b(candidate);
  end if;
  if not simulora.valid_world_revision_document_pre_wd1b(candidate - 'discoverableFacts') then
    return false;
  end if;
  declared := candidate->'discoverableFacts';
  return coalesce(jsonb_typeof(declared), '') = 'array'
    and not exists (
      select 1 from jsonb_array_elements(declared) item
      where coalesce(jsonb_typeof(item), '') <> 'object'
         or not simulora.valid_object_keys(item, array['factId', 'howToFind'])
         or not simulora.valid_stable_id(item->'factId')
         or not simulora.valid_text(item->'howToFind', 1000)
         or not exists (
           select 1 from jsonb_array_elements(candidate->'facts') fact
           where fact->>'id' = item->>'factId' and fact->>'scope' = 'CONTINUITY_PRIVATE'))
    and (select count(distinct item->>'factId') from jsonb_array_elements(declared) item)
      = jsonb_array_length(declared);
end;
$$;

-- WD-1b: STORY_DECIDES is a closed requested effect.
create or replace function simulora.validate_re2_action_target() returns trigger
language plpgsql as $$
declare
  state jsonb;
  world jsonb;
  target jsonb;
begin
  if new.operation_type <> 'PARTICIPATE' then return new; end if;
  if not simulora.valid_object_keys(new.operation_payload, array['targetCharacterId', 'requestedEffect', 'targetThreadId']) then
    raise exception 'Ordinary Action targeting cannot change authority or participation';
  end if;
  if new.operation_payload ? 'requestedEffect' and coalesce(new.operation_payload->>'requestedEffect', '') not in ('FACT_REWRITE', 'ROUTINE_EFFECT', 'NO_WORLD_EFFECT', 'RELATIONSHIP_EFFECT', 'THREAD_EFFECT', 'STORY_DECIDES') then
    raise exception 'Unknown closed requested effect';
  end if;
  if new.operation_payload ? 'targetCharacterId' and not coalesce(simulora.valid_stable_id(new.operation_payload->'targetCharacterId'), false) then
    raise exception 'Invalid explicit Character target';
  end if;
  if new.operation_payload->>'requestedEffect' = 'ROUTINE_EFFECT' and not new.operation_payload ? 'targetCharacterId' then
    raise exception 'Routine effect requires explicit Character selection';
  end if;
  -- MGC-1: relationship effects need a selected Character; a thread target
  -- needs a thread effect and must name a thread that is open at the head.
  if new.operation_payload->>'requestedEffect' = 'RELATIONSHIP_EFFECT' and not new.operation_payload ? 'targetCharacterId' then
    raise exception 'Relationship effect requires explicit Character selection';
  end if;
  if new.operation_payload ? 'targetThreadId' then
    if new.operation_payload->>'requestedEffect' is distinct from 'THREAD_EFFECT'
       or not coalesce(simulora.valid_stable_id(new.operation_payload->'targetThreadId'), false)
       or not exists (
         select 1 from simulora.world_commits commit
         join simulora.state_revisions snapshot on snapshot.id = commit.state_revision_id
         cross join lateral jsonb_array_elements(coalesce(snapshot.document->'threads', '[]'::jsonb)) thread
         where commit.id = new.expected_head_commit_id
           and thread->>'id' = new.operation_payload->>'targetThreadId'
           and thread->>'status' = 'OPEN') then
      raise exception 'Thread target must name an open thread at the expected head';
    end if;
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

-- WD-1b: a STORY_DECIDES context lists the facts this generation may reveal.
alter function simulora.re2_generation_context(uuid) rename to re2_generation_context_pre_wd1b;
create function simulora.re2_generation_context(action_id uuid) returns jsonb
language plpgsql stable strict as $$
declare
  action simulora.actions%rowtype;
  context jsonb := simulora.re2_generation_context_pre_wd1b(action_id);
  state jsonb;
  world jsonb;
  character_id text;
  discoverable jsonb;
begin
  if context is null then return null; end if;
  select * into action from simulora.actions where id = action_id;
  if coalesce(action.operation_payload->>'requestedEffect', '') <> 'STORY_DECIDES' then
    return context;
  end if;
  select snapshot.document, revision.document into state, world
    from simulora.world_commits commit
    join simulora.state_revisions snapshot on snapshot.id = commit.state_revision_id
    join simulora.continuities continuity on continuity.id = action.continuity_id
    join simulora.world_revisions revision on revision.id = continuity.world_revision_id
    where commit.id = action.expected_head_commit_id;
  character_id := context->'current'->'character'->>'id';
  -- A World response may reveal every declared secret; a Character only its own.
  select coalesce(jsonb_agg(jsonb_build_object(
      'factId', d.item->>'factId', 'statement', f.fact->>'statement',
      'howToFind', d.item->>'howToFind') order by d.position), '[]'::jsonb)
    into discoverable
    from jsonb_array_elements(coalesce(world->'discoverableFacts', '[]'::jsonb))
      with ordinality as d(item, position)
    join jsonb_array_elements(state->'facts') as f(fact) on f.fact->>'id' = d.item->>'factId'
    where f.fact->>'lifecycle' = 'ACTIVE' and f.fact->>'scope' = 'CONTINUITY_PRIVATE'
      and (character_id is null or exists (
        select 1 from jsonb_array_elements(world->'characters') spec
        join jsonb_array_elements(state->'characters') runtime on runtime->>'id' = spec->>'id'
        where spec->>'id' = character_id
          and (jsonb_exists(spec->'knowledgeFactIds', f.fact->>'id')
            or jsonb_exists(runtime->'knownFactIds', f.fact->>'id'))));
  if jsonb_array_length(discoverable) = 0 then return context; end if;
  context := context || jsonb_build_object('discoverable', discoverable);
  if octet_length(simulora.canonical_jsonb_text(context)) > 48000 then return null; end if;
  return context;
end;
$$;

-- WD-1b: evidence binds story prior dialogue and lets a reveal name its fact.
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
  prior_dialogue jsonb;
  prior_dialogue_ids jsonb;
  disclosed_fact_ids jsonb;
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

  -- WD-1a: after the epoch every other ACTIVE SHARED fact is included too.
  select coalesce(jsonb_agg(to_jsonb(fact->>'id') order by position), '[]'::jsonb)
    into known_fact_ids
    from jsonb_array_elements(parent_document->'facts') with ordinality as facts(fact, position)
    where fact->>'id' <> target_fact->>'id'
      and fact->>'lifecycle' = 'ACTIVE'
      and (
        (fact->>'scope' = 'SHARED' and simulora.wd1_shared_world_apply(action.created_at))
        or (
          selected_character is not null
          and fact->>'scope' <> 'ACCOUNT_PRIVATE'
          and (
            jsonb_exists(selected_character->'knowledgeFactIds', fact->>'id')
            or jsonb_exists(selected_runtime->'knownFactIds', fact->>'id')
          )
        )
      );

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
  -- WD-1b: a story outcome may be dialogue, so its manifest binds prior dialogue.
  if action.operation_payload->>'requestedEffect' = 'STORY_DECIDES' then
    prior_dialogue := simulora.authorized_action_dialogue(action.id);
    select coalesce(jsonb_agg(entry.value->'id' order by entry.ordinality), '[]'::jsonb)
      into prior_dialogue_ids
      from jsonb_array_elements(coalesce(prior_dialogue, '[]'::jsonb)) with ordinality entry(value, ordinality);
    expected_manifest := expected_manifest || jsonb_build_object(
      'priorDialogueIds', prior_dialogue_ids,
      'priorDialogueDigest', encode(
        sha256(convert_to(simulora.canonical_jsonb_text(prior_dialogue), 'UTF8')), 'hex'));
  end if;
  expected_output := jsonb_build_object(
    'narrative', proposal.candidate_transition->'narrative',
    'responseSource', proposal.candidate_transition->'responseSource',
    'candidate', proposal.candidate_transition
  );
  operation := proposal.candidate_transition->'operation';
  user_role_name := world_document->'userRole'->>'name';
  -- WD-1b: a reveal may name the fact it reveals; nothing else outside the context.
  disclosed_fact_ids := included_fact_ids || case when operation->>'type' = 'REVEAL_FACT'
    then jsonb_build_array(operation->>'factId') else '[]'::jsonb end;

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
      proposal.candidate_transition->>'narrative', parent_document, disclosed_fact_ids
    )
    and case when operation->>'type' = 'REVEAL_FACT' then
      -- WD-1b: the target and authority are bound by the effect validator.
      action.operation_payload->>'requestedEffect' = 'STORY_DECIDES'
      and proposal.impact_level = 'L2'
      and coalesce(jsonb_typeof(operation->'causalFactIds'), '') = 'array'
      and operation->'causalFactIds' <@ included_fact_ids
    when operation->>'type' = 'ADD_FACT' then
      -- WD-1a: one new SHARED fact; its causes and text meet the same guards.
      simulora.wd1_shared_world_apply(action.created_at)
      and proposal.impact_level = 'L2'
      and coalesce(jsonb_typeof(operation->'causalFactIds'), '') = 'array'
      and operation->'causalFactIds' <@ included_fact_ids
      and not simulora.generated_narrative_authors_user(operation->>'statement', user_role_name)
      and not simulora.generated_output_references_excluded_fact(operation->>'statement', parent_document, included_fact_ids)
    when operation->>'type' = 'MOVE_CHARACTER' then
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

-- WD-1b: a STORY_DECIDES Action may end as a response.
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
  effect_context jsonb;
begin
  if (
    p_action.id is not null
    and p_action.operation_type = 'PARTICIPATE'
    and p_action.operation_payload->>'requestedEffect' in ('NO_WORLD_EFFECT', 'STORY_DECIDES')
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
  -- WD-1a: after the epoch every other ACTIVE SHARED fact is included too.
  select coalesce(jsonb_agg(to_jsonb(fact->>'id') order by position), '[]'::jsonb)
    into known_fact_ids
    from jsonb_array_elements(source_state->'facts') with ordinality as facts(fact, position)
   where fact->>'id' <> target_fact->>'id'
     and fact->>'lifecycle' = 'ACTIVE'
     and (
       (fact->>'scope' = 'SHARED' and simulora.wd1_shared_world_apply(p_action.created_at))
       or (
         selected_character is not null
         and fact->>'scope' <> 'ACCOUNT_PRIVATE'
         and (jsonb_exists(selected_character->'knowledgeFactIds', fact->>'id')
              or jsonb_exists(selected_runtime->'knownFactIds', fact->>'id'))
       )
     );
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
  -- WD-1b: a story Action in a World with constraints binds its effect context
  -- (always absent for NO_WORLD_EFFECT).
  effect_context := simulora.mgc_effect_context(p_action.id);
  if effect_context is not null then
    expected_manifest := expected_manifest || jsonb_build_object('effectContextDigest', encode(
      sha256(convert_to(simulora.canonical_jsonb_text(effect_context), 'UTF8')), 'hex'));
  end if;
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

-- WD-1b (ADR-WD1-3): an author-declared secret becomes SHARED at L2.
create function simulora.wd1b_reveal_is_valid(proposal simulora.action_proposals)
returns boolean language plpgsql stable strict as $$
declare
  operation jsonb := proposal.candidate_transition->'operation';
  action_row simulora.actions%rowtype;
  parent_document jsonb;
  world_document jsonb;
  character_id text;
  revealed jsonb;
  expected_candidate jsonb;
  expected_display jsonb;
  digest_payload jsonb;
begin
  select * into action_row from simulora.actions where id = proposal.action_id;
  select state.document, revision.document into parent_document, world_document
    from simulora.world_commits commit
    join simulora.state_revisions state on state.id = commit.state_revision_id
    join simulora.continuities continuity on continuity.id = action_row.continuity_id
    join simulora.world_revisions revision on revision.id = continuity.world_revision_id
    where commit.id = action_row.expected_head_commit_id;
  if action_row.id is null or parent_document is null
     or action_row.operation_type <> 'PARTICIPATE'
     or action_row.operation_payload->>'requestedEffect' is distinct from 'STORY_DECIDES'
     or coalesce(jsonb_typeof(operation->'causalFactIds'), '') <> 'array'
     or not simulora.valid_stable_id_array(operation->'causalFactIds')
     or jsonb_array_length(operation->'causalFactIds') not between 1 and 4
     or not coalesce(simulora.valid_stable_id(operation->'factId'), false) then
    return false;
  end if;
  select fact into revealed from jsonb_array_elements(parent_document->'facts') fact
    where fact->>'id' = operation->>'factId'
      and fact->>'lifecycle' = 'ACTIVE' and fact->>'scope' = 'CONTINUITY_PRIVATE';
  if revealed is null or not exists (
       select 1 from jsonb_array_elements(coalesce(world_document->'discoverableFacts', '[]'::jsonb)) item
       where item->>'factId' = operation->>'factId') then
    return false;
  end if;
  character_id := simulora.mgc_selected_character(action_row.id);
  -- A Character may reveal only a secret it knows.
  if character_id is not null and not exists (
       select 1 from jsonb_array_elements(world_document->'characters') spec
       join jsonb_array_elements(parent_document->'characters') runtime on runtime->>'id' = spec->>'id'
       where spec->>'id' = character_id
         and (jsonb_exists(spec->'knowledgeFactIds', operation->>'factId')
           or jsonb_exists(runtime->'knownFactIds', operation->>'factId'))) then
    return false;
  end if;
  expected_candidate := jsonb_build_object('schemaVersion', 1, 'actionId', action_row.id,
    'expectedHeadCommitId', action_row.expected_head_commit_id,
    'narrative', proposal.candidate_transition->'narrative',
    'responseSource', case when character_id is null then jsonb_build_object('type', 'WORLD')
      else jsonb_build_object('type', 'CHARACTER', 'characterId', character_id) end,
    'operation', jsonb_build_object('type', 'REVEAL_FACT', 'factId', operation->>'factId',
      'causalFactIds', operation->'causalFactIds'));
  expected_display := jsonb_build_object('target', revealed->>'id',
    'before', 'Hidden until now.', 'after', revealed->>'statement', 'scope', 'SHARED');
  digest_payload := jsonb_build_object('actionId', action_row.id, 'actorAccountId', action_row.actor_account_id,
    'expectedHeadCommitId', action_row.expected_head_commit_id, 'candidate', proposal.candidate_transition,
    'displayEffect', proposal.display_effect, 'expiresAt', to_char(proposal.expires_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'));
  return coalesce(
    proposal.impact_level = 'L2'
    and proposal.expected_head_commit_id = action_row.expected_head_commit_id
    and proposal.schema_version = 1 and proposal.expires_at > proposal.created_at
    and simulora.valid_text(proposal.candidate_transition->'narrative', 4000)
    and proposal.candidate_transition = expected_candidate
    and proposal.display_effect = expected_display
    and proposal.proposal_digest = encode(sha256(convert_to(simulora.canonical_jsonb_text(digest_payload), 'UTF8')), 'hex')
    and simulora.action_generation_evidence_is_valid(proposal), false);
end;
$$;

-- WD-1b: ADD_FACT also under STORY_DECIDES; REVEAL_FACT has its own validator.
create or replace function simulora.action_proposal_effect_is_valid(proposal simulora.action_proposals)
returns boolean language plpgsql stable strict as $$
declare
  operation jsonb := proposal.candidate_transition->'operation';
  action_row simulora.actions%rowtype;
  parent_document jsonb;
  character_id text;
  new_fact_id text;
  expected_candidate jsonb;
  expected_display jsonb;
  digest_payload jsonb;
begin
  if coalesce(operation->>'type', '') = 'REVEAL_FACT' then
    return simulora.wd1b_reveal_is_valid(proposal);
  end if;
  if coalesce(operation->>'type', '') <> 'ADD_FACT' then
    return simulora.action_proposal_effect_is_valid_pre_wd1(proposal);
  end if;
  select * into action_row from simulora.actions where id = proposal.action_id;
  select state.document into parent_document from simulora.world_commits commit
    join simulora.state_revisions state on state.id = commit.state_revision_id
    where commit.id = action_row.expected_head_commit_id;
  if action_row.id is null or parent_document is null
     or action_row.operation_type <> 'PARTICIPATE'
     or coalesce(action_row.operation_payload->>'requestedEffect', 'FACT_REWRITE') not in ('FACT_REWRITE', 'STORY_DECIDES')
     or not simulora.wd1_shared_world_apply(action_row.created_at)
     or coalesce(jsonb_typeof(operation->'causalFactIds'), '') <> 'array'
     or not simulora.valid_stable_id_array(operation->'causalFactIds')
     or jsonb_array_length(operation->'causalFactIds') not between 1 and 4
     or not simulora.valid_text(operation->'statement', 1000) then
    return false;
  end if;
  new_fact_id := 'fact.' || action_row.id::text;
  if exists (select 1 from jsonb_array_elements(parent_document->'facts') fact
             where fact->>'id' = new_fact_id) then
    return false;
  end if;
  character_id := simulora.mgc_selected_character(action_row.id);
  expected_candidate := jsonb_build_object('schemaVersion', 1, 'actionId', action_row.id,
    'expectedHeadCommitId', action_row.expected_head_commit_id,
    'narrative', proposal.candidate_transition->'narrative',
    'responseSource', case when character_id is null then jsonb_build_object('type', 'WORLD')
      else jsonb_build_object('type', 'CHARACTER', 'characterId', character_id) end,
    'operation', jsonb_build_object('type', 'ADD_FACT', 'statement', operation->'statement',
      'causalFactIds', operation->'causalFactIds'));
  expected_display := jsonb_build_object('target', new_fact_id,
    'before', 'Nothing recorded yet.', 'after', operation->>'statement', 'scope', 'SHARED');
  digest_payload := jsonb_build_object('actionId', action_row.id, 'actorAccountId', action_row.actor_account_id,
    'expectedHeadCommitId', action_row.expected_head_commit_id, 'candidate', proposal.candidate_transition,
    'displayEffect', proposal.display_effect, 'expiresAt', to_char(proposal.expires_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'));
  return coalesce(
    proposal.impact_level = 'L2'
    and proposal.expected_head_commit_id = action_row.expected_head_commit_id
    and proposal.schema_version = 1 and proposal.expires_at > proposal.created_at
    and simulora.valid_text(proposal.candidate_transition->'narrative', 4000)
    and proposal.candidate_transition = expected_candidate
    and proposal.display_effect = expected_display
    and proposal.proposal_digest = encode(sha256(convert_to(simulora.canonical_jsonb_text(digest_payload), 'UTF8')), 'hex')
    and simulora.action_generation_evidence_is_valid(proposal), false);
end;
$$;

-- WD-1b: the state a reveal must produce.
create or replace function simulora.expected_action_state(p_action_id uuid) returns jsonb
language plpgsql stable as $$
declare
  action simulora.actions%rowtype;
  proposal simulora.action_proposals%rowtype;
  parent_document jsonb;
  operation jsonb;
  expected_document jsonb;
  items jsonb;
begin
  select * into action from simulora.actions where id = p_action_id;
  select * into proposal from simulora.action_proposals where action_id = p_action_id;
  operation := proposal.candidate_transition->'operation';
  if action.operation_type <> 'PARTICIPATE'
     or coalesce(operation->>'type', '') not in ('ADD_FACT', 'REVEAL_FACT') then
    return simulora.expected_action_state_pre_wd1(p_action_id);
  end if;
  select state.document into parent_document from simulora.world_commits commit
    join simulora.state_revisions state on state.id = commit.state_revision_id
    where commit.id = action.expected_head_commit_id;
  expected_document := jsonb_set(parent_document, '{worldClock}', jsonb_build_object(
    'turn', ((parent_document->'worldClock'->>'turn')::integer + 1),
    'label', 'After action ' || ((parent_document->'worldClock'->>'turn')::integer + 1)));
  expected_document := jsonb_set(expected_document, '{openThreads}',
    parent_document->'openThreads' || jsonb_build_array(proposal.candidate_transition->>'narrative'));
  if operation->>'type' = 'REVEAL_FACT' then
    -- WD-1b: the revealed fact keeps its place and everything but its scope.
    select jsonb_agg(case when fact->>'id' = operation->>'factId'
        then fact || jsonb_build_object('scope', 'SHARED') else fact end order by position)
      into items
      from jsonb_array_elements(parent_document->'facts') with ordinality as f(fact, position);
    return jsonb_set(expected_document, '{facts}', items);
  end if;
  return jsonb_set(expected_document, '{facts}',
    parent_document->'facts' || jsonb_build_array(jsonb_build_object(
      'id', 'fact.' || action.id::text,
      'statement', operation->>'statement',
      'scope', 'SHARED',
      'provenance', 'Confirmed Action ' || action.id::text,
      'lifecycle', 'ACTIVE')));
end;
$$;

-- WD-1b: a REVEAL_FACT Commit carries exactly one FACT_REVEALED Event.
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
    -- MGC-1: each closure operation commits with its own typed causal Event.
    if proposal.candidate_transition->'operation'->>'type' = 'SHIFT_RELATIONSHIP' then
      expected_event_type := 'RELATIONSHIP_SHIFTED';
      expected_payload := jsonb_build_object(
        'actionId', action.id,
        'relationshipId', proposal.candidate_transition->'operation'->>'relationshipId',
        'before', proposal.candidate_transition->'operation'->>'beforeState',
        'after', proposal.candidate_transition->'operation'->>'afterState',
        'causalFactIds', proposal.candidate_transition->'operation'->'causalFactIds'
      );
    elsif proposal.candidate_transition->'operation'->>'type' = 'OPEN_THREAD' then
      expected_event_type := 'THREAD_OPENED';
      expected_payload := jsonb_build_object(
        'actionId', action.id,
        'threadId', 'thread.' || action.id::text,
        'title', proposal.candidate_transition->'operation'->>'title',
        'causalFactIds', proposal.candidate_transition->'operation'->'causalFactIds'
      );
    elsif proposal.candidate_transition->'operation'->>'type' = 'RESOLVE_THREAD' then
      expected_event_type := 'THREAD_RESOLVED';
      expected_payload := jsonb_build_object(
        'actionId', action.id,
        'threadId', proposal.candidate_transition->'operation'->>'threadId',
        'resolution', proposal.candidate_transition->'operation'->>'resolution',
        'causalFactIds', proposal.candidate_transition->'operation'->'causalFactIds'
      );
    elsif proposal.candidate_transition->'operation'->>'type' = 'REVEAL_FACT' then
      -- WD-1b: a reveal commits with its own typed Event.
      expected_event_type := 'FACT_REVEALED';
      expected_payload := jsonb_build_object(
        'actionId', action.id,
        'factId', proposal.candidate_transition->'operation'->>'factId',
        'causalFactIds', proposal.candidate_transition->'operation'->'causalFactIds'
      );
    elsif proposal.candidate_transition->'operation'->>'type' = 'ADD_FACT' then
      -- WD-1a: an added fact commits with its own typed Event.
      expected_event_type := 'FACT_ADDED';
      expected_payload := jsonb_build_object(
        'actionId', action.id,
        'factId', 'fact.' || action.id::text,
        'statement', proposal.candidate_transition->'operation'->>'statement',
        'causalFactIds', proposal.candidate_transition->'operation'->'causalFactIds'
      );
    elsif proposal.candidate_transition->'operation'->>'type' = 'TRANSFORM_FAILURE' then
      expected_event_type := 'ATTEMPT_TRANSFORMED';
      expected_payload := jsonb_build_object(
        'actionId', action.id,
        'constraintId', proposal.candidate_transition->'operation'->>'constraintId',
        'outcome', proposal.candidate_transition->'operation'->>'outcome',
        'threadId', 'thread.' || action.id::text,
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
