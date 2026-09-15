-- Narrow RE-2 dialogue attribution repair; all other authority checks remain intact.
-- Only a server-bound non-user Character can use this overload, and only narrative
-- gets it. Canonical statements and provenance retain the strict two-argument guard.
create function simulora.generated_narrative_authors_user(
  narrative text,
  user_role_name text,
  response_character_name text
) returns boolean
language plpgsql immutable as $$
declare
  body text := simulora.normalized_generation_text(narrative);
  narrator text := trim(simulora.normalized_generation_text(response_character_name));
  role_tokens text[] := regexp_split_to_array(
    trim(regexp_replace(simulora.normalized_generation_text(user_role_name), '[^[:alnum:]]+', ' ', 'g')),
    '[[:space:]]+'
  );
begin
  -- ponytail: one English attribution shape, not a general grammar classifier.
  if narrator ~ '^[a-z][a-z0-9_]*( [a-z][a-z0-9_]*)*$'
     and not (string_to_array(regexp_replace(narrator, '[^a-z0-9]+', ' ', 'g'), ' ') &&
       (array['you', 'user', 'player', 'participant'] || role_tokens)) then
    body := regexp_replace(
      body,
      '(,[[:space:]''"]*' || narrator || '[[:space:]]+)(says|said)([[:space:]]*,)',
      E'\\1narrates\\3',
      'g'
    );
  end if;
  return simulora.generated_narrative_authors_user(body, user_role_name);
end;
$$;

create or replace function simulora.action_proposal_effect_shape_is_valid(
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
         world_document->'userRole'->>'name',
         (select character->>'name'
           from jsonb_array_elements(parent_document->'characters') character
           where character->>'id' = expected_response_source->>'characterId'
           limit 1)
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
    and operation->>'provenance' = 'Confirmed Action ' || action.id::text
    and not simulora.generated_narrative_authors_user(
      proposal.candidate_transition->>'narrative', user_role_name,
      case when proposal.candidate_transition->'responseSource'->>'type' = 'CHARACTER'
        then selected_runtime->>'name' else null end
    )
    and not simulora.generated_narrative_authors_user(operation->>'afterStatement', user_role_name)
    and not simulora.generated_narrative_authors_user(operation->>'provenance', user_role_name)
    and not simulora.generated_output_references_excluded_fact(
      proposal.candidate_transition->>'narrative', parent_document, included_fact_ids
    )
    and not simulora.generated_output_references_excluded_fact(
      operation->>'afterStatement', parent_document, included_fact_ids
    );
end;
$$;
