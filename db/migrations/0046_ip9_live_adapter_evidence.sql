-- IP-9.1: admit the provider-neutral live adapter as a source of Generation
-- Attempt evidence. Until now the database accepted a proposal or a response-only
-- record only from a deterministic attempt. The binding itself is unchanged: the
-- attempt must carry the exact compiled context manifest, its output must equal
-- the candidate exactly, and the narrative guard still applies. Only the list of
-- adapters whose attempts may be bound widens, from one entry to two.
--
-- Both functions are the latest definitions (0032 and 0035) copied verbatim
-- apart from that single adapter condition.

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
   where (p_action.operation_payload->>'targetCharacterId' is null
          or spec.character->>'id' = p_action.operation_payload->>'targetCharacterId')
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
