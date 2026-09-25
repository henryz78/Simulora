-- MGC-1 (MUST-gap closure): causal relationship shift, structured story
-- threads and transformed failure. See
-- docs/implementation-planning/MUST-GAP-CLOSURE-CONTRACT.md.
--
-- Everything here is additive and successor-only:
-- * World Revisions may declare relationship protection/scale, threads and
--   constraints; State Revisions may carry relationship `state` and `threads`.
--   Documents without them validate exactly as before.
-- * Four closed operations are validated here exactly as the application
--   validates them, and their impact (L2/L3) is derived from the declared
--   World policy, never taken from the candidate.
-- * Generation evidence binds a digest of the declared effect context only
--   when an Action can use it, so every earlier Action keeps its evidence.
-- * Restore includes `threads` only when either snapshot has them.
--
-- Functions changed in place are the latest definitions (0013, 0032, 0046)
-- copied verbatim apart from the marked MGC-1 additions.

alter function simulora.valid_world_revision_document(jsonb) rename to valid_world_revision_document_pre_mgc;
create function simulora.valid_world_revision_document(candidate jsonb) returns boolean
language plpgsql immutable strict as $$
declare
  item jsonb;
  stripped_relationships jsonb;
begin
  if coalesce(jsonb_typeof(candidate), '') <> 'object'
     or coalesce(jsonb_typeof(candidate->'relationships'), '') <> 'array' then
    return simulora.valid_world_revision_document_pre_mgc(candidate);
  end if;
  select coalesce(jsonb_agg(
      case when jsonb_typeof(relationship) = 'object'
        then relationship - 'protection' - 'scale' - 'initialState' else relationship end
      order by position), '[]'::jsonb)
    into stripped_relationships
    from jsonb_array_elements(candidate->'relationships') with ordinality as r(relationship, position);
  if not simulora.valid_world_revision_document_pre_mgc(
    jsonb_set(candidate - 'threads' - 'constraints', '{relationships}', stripped_relationships)
  ) then return false; end if;

  for item in select value from jsonb_array_elements(candidate->'relationships') loop
    if (item ? 'protection' and coalesce(item->>'protection', '') not in ('PROTECTED', 'ROUTINE'))
       or (item ? 'scale') <> (item ? 'initialState') then return false; end if;
    if item ? 'scale' and (
      coalesce(jsonb_typeof(item->'scale'), '') <> 'array'
      or jsonb_array_length(item->'scale') not between 2 and 7
      or exists (select 1 from jsonb_array_elements(item->'scale') label
                  where not simulora.valid_text(label, 60))
      or (select count(distinct label) from jsonb_array_elements(item->'scale') label)
         <> jsonb_array_length(item->'scale')
      or not simulora.valid_text(item->'initialState', 60)
      or not jsonb_exists(item->'scale', item->>'initialState')
    ) then return false; end if;
  end loop;

  if candidate ? 'threads' then
    if coalesce(jsonb_typeof(candidate->'threads'), '') <> 'array' then return false; end if;
    for item in select value from jsonb_array_elements(candidate->'threads') loop
      if not simulora.valid_object_keys(item, array['id', 'title'])
         or not simulora.valid_stable_id(item->'id')
         or not simulora.valid_text(item->'title', 200) then return false; end if;
    end loop;
  end if;
  if candidate ? 'constraints' then
    if coalesce(jsonb_typeof(candidate->'constraints'), '') <> 'array' then return false; end if;
    for item in select value from jsonb_array_elements(candidate->'constraints') loop
      if not simulora.valid_object_keys(item, array['id', 'statement'])
         or not simulora.valid_stable_id(item->'id')
         or not simulora.valid_text(item->'statement', 4000) then return false; end if;
    end loop;
  end if;
  -- Stable IDs stay unique across the whole World, including the new sections.
  return (
    select count(*) = count(distinct id) from (
      select value->>'id' as id from jsonb_array_elements(candidate->'locations')
      union all select value->>'id' from jsonb_array_elements(candidate->'characters')
      union all select value->>'id' from jsonb_array_elements(candidate->'facts')
      union all select value->>'id' from jsonb_array_elements(candidate->'relationships')
      union all select value->>'id' from jsonb_array_elements(coalesce(candidate->'threads', '[]'::jsonb))
      union all select value->>'id' from jsonb_array_elements(coalesce(candidate->'constraints', '[]'::jsonb))
    ) ids
  );
end;
$$;

alter function simulora.valid_state_revision_document(jsonb) rename to valid_state_revision_document_pre_mgc;
create function simulora.valid_state_revision_document(candidate jsonb) returns boolean
language plpgsql immutable strict as $$
declare
  item jsonb;
  stripped_relationships jsonb;
begin
  if coalesce(jsonb_typeof(candidate), '') <> 'object'
     or coalesce(jsonb_typeof(candidate->'relationships'), '') <> 'array' then
    return simulora.valid_state_revision_document_pre_mgc(candidate);
  end if;
  select coalesce(jsonb_agg(
      case when jsonb_typeof(relationship) = 'object' then relationship - 'state' else relationship end
      order by position), '[]'::jsonb)
    into stripped_relationships
    from jsonb_array_elements(candidate->'relationships') with ordinality as r(relationship, position);
  if not simulora.valid_state_revision_document_pre_mgc(
    jsonb_set(candidate - 'threads', '{relationships}', stripped_relationships)
  ) then return false; end if;
  for item in select value from jsonb_array_elements(candidate->'relationships') loop
    if item ? 'state' and not simulora.valid_text(item->'state', 60) then return false; end if;
  end loop;
  if candidate ? 'threads' then
    if coalesce(jsonb_typeof(candidate->'threads'), '') <> 'array' then return false; end if;
    for item in select value from jsonb_array_elements(candidate->'threads') loop
      if not simulora.valid_object_keys(item, array['id', 'title', 'status', 'resolution'])
         or not simulora.valid_stable_id(item->'id')
         or not simulora.valid_text(item->'title', 200)
         or coalesce(item->>'status', '') not in ('OPEN', 'RESOLVED')
         or (item->>'status' = 'RESOLVED') <> (item ? 'resolution')
         or (item ? 'resolution' and not simulora.valid_text(item->'resolution', 1000)) then
        return false;
      end if;
    end loop;
    if (select count(distinct value->>'id') from jsonb_array_elements(candidate->'threads'))
       <> jsonb_array_length(candidate->'threads') then return false; end if;
  end if;
  return true;
end;
$$;

-- The Character that responds to an Action: the explicit target, or the first
-- World Character that knows the first active shared fact. Mirrors the
-- application compiler and the 0029/0046 evidence selection.
create function simulora.mgc_selected_character(p_action_id uuid) returns text
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
    where (action.operation_payload->>'targetCharacterId' is null
           or s.character->>'id' = action.operation_payload->>'targetCharacterId')
      and (jsonb_exists(s.character->'knowledgeFactIds', target->>'id')
        or jsonb_exists(r.character->'knownFactIds', target->>'id'))
    order by s.position limit 1;
  return selected;
end;
$$;

-- MGC-1 effect context, identical to the application's compileEffectContext.
-- Null when the Action cannot use it, so earlier manifests stay exact.
create function simulora.mgc_effect_context(p_action_id uuid) returns jsonb
language plpgsql stable strict as $$
declare
  action simulora.actions%rowtype;
  state jsonb;
  world jsonb;
  requested text;
  character_id text;
  relations jsonb;
  open_threads jsonb;
  declared_constraints jsonb;
begin
  select * into action from simulora.actions where id = p_action_id;
  if action.id is null or action.operation_type <> 'PARTICIPATE' then return null; end if;
  select snapshot.document, revision.document into state, world
    from simulora.world_commits commit
    join simulora.state_revisions snapshot on snapshot.id = commit.state_revision_id
    join simulora.continuities continuity on continuity.id = action.continuity_id
    join simulora.world_revisions revision on revision.id = continuity.world_revision_id
    where commit.id = action.expected_head_commit_id;
  requested := coalesce(action.operation_payload->>'requestedEffect', 'FACT_REWRITE');
  if not (requested in ('RELATIONSHIP_EFFECT', 'THREAD_EFFECT')
          or (requested <> 'NO_WORLD_EFFECT'
              and jsonb_array_length(coalesce(world->'constraints', '[]'::jsonb)) > 0)) then
    return null;
  end if;
  character_id := simulora.mgc_selected_character(p_action_id);
  select coalesce(jsonb_agg(jsonb_build_object(
      'id', r.relationship->>'id',
      'fromCharacterId', r.relationship->>'fromCharacterId',
      'toCharacterId', r.relationship->>'toCharacterId',
      'protection', coalesce(w.spec->>'protection', 'PROTECTED'),
      'scale', w.spec->'scale',
      'state', r.relationship->>'state') order by r.position), '[]'::jsonb)
    into relations
    from jsonb_array_elements(state->'relationships') with ordinality as r(relationship, position)
    join jsonb_array_elements(world->'relationships') as w(spec) on w.spec->>'id' = r.relationship->>'id'
    where character_id is not null and w.spec ? 'scale' and r.relationship ? 'state'
      and (r.relationship->>'fromCharacterId' = character_id
        or r.relationship->>'toCharacterId' = character_id);
  select coalesce(jsonb_agg(jsonb_build_object('id', t.thread->>'id', 'title', t.thread->>'title')
      order by t.position), '[]'::jsonb)
    into open_threads
    from jsonb_array_elements(coalesce(state->'threads', '[]'::jsonb)) with ordinality as t(thread, position)
    where t.thread->>'status' = 'OPEN';
  select coalesce(jsonb_agg(jsonb_build_object('id', c.item->>'id', 'statement', c.item->>'statement')
      order by c.position), '[]'::jsonb)
    into declared_constraints
    from jsonb_array_elements(coalesce(world->'constraints', '[]'::jsonb)) with ordinality as c(item, position);
  return jsonb_build_object('relationships', relations, 'openThreads', open_threads,
    'constraints', declared_constraints);
end;
$$;

-- The generated text fields of a closure operation, in the application's order.
create function simulora.mgc_operation_texts(operation jsonb) returns jsonb
language sql immutable strict as $$
  select case operation->>'type'
    when 'OPEN_THREAD' then jsonb_build_array(operation->'title')
    when 'RESOLVE_THREAD' then jsonb_build_array(operation->'resolution')
    when 'TRANSFORM_FAILURE' then jsonb_build_array(operation->'outcome', operation->'newThreadTitle')
    else '[]'::jsonb end
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

alter function simulora.action_proposal_effect_is_valid(simulora.action_proposals)
  rename to action_proposal_effect_is_valid_pre_mgc;
create function simulora.action_proposal_effect_is_valid(proposal simulora.action_proposals)
returns boolean language plpgsql stable strict as $$
declare
  operation jsonb := proposal.candidate_transition->'operation';
  action_row simulora.actions%rowtype;
  parent_document jsonb;
  world_document jsonb;
  requested text;
  character_id text;
  new_thread_id text;
  relationship jsonb;
  spec jsonb;
  before_index integer;
  after_index integer;
  expected_impact text := 'L2';
  expected_operation jsonb;
  expected_display jsonb;
  expected_candidate jsonb;
  digest_payload jsonb;
begin
  if coalesce(operation->>'type', '') not in ('SHIFT_RELATIONSHIP', 'OPEN_THREAD', 'RESOLVE_THREAD', 'TRANSFORM_FAILURE') then
    return simulora.action_proposal_effect_is_valid_pre_mgc(proposal);
  end if;
  select * into action_row from simulora.actions where id = proposal.action_id;
  select state.document, revision.document into parent_document, world_document
    from simulora.world_commits commit
    join simulora.state_revisions state on state.id = commit.state_revision_id
    join simulora.continuities continuity on continuity.id = action_row.continuity_id
    join simulora.world_revisions revision on revision.id = continuity.world_revision_id
    where commit.id = action_row.expected_head_commit_id;
  if action_row.id is null or parent_document is null
     or action_row.operation_type <> 'PARTICIPATE'
     or coalesce(jsonb_typeof(operation->'causalFactIds'), '') <> 'array'
     or not simulora.valid_stable_id_array(operation->'causalFactIds')
     or jsonb_array_length(operation->'causalFactIds') not between 1 and 4 then
    return false;
  end if;
  requested := coalesce(action_row.operation_payload->>'requestedEffect', 'FACT_REWRITE');
  character_id := simulora.mgc_selected_character(action_row.id);
  new_thread_id := 'thread.' || action_row.id::text;

  if operation->>'type' = 'SHIFT_RELATIONSHIP' then
    select value into relationship from jsonb_array_elements(parent_document->'relationships')
      where value->>'id' = operation->>'relationshipId';
    select value into spec from jsonb_array_elements(world_document->'relationships')
      where value->>'id' = operation->>'relationshipId';
    if requested <> 'RELATIONSHIP_EFFECT' or character_id is null
       or relationship is null or spec is null
       or not spec ? 'scale' or not relationship ? 'state'
       or (relationship->>'fromCharacterId' <> character_id
           and relationship->>'toCharacterId' <> character_id)
       or relationship->>'state' is distinct from operation->>'beforeState' then
      return false;
    end if;
    select position - 1 into before_index
      from jsonb_array_elements_text(spec->'scale') with ordinality as s(label, position)
      where label = operation->>'beforeState';
    select position - 1 into after_index
      from jsonb_array_elements_text(spec->'scale') with ordinality as s(label, position)
      where label = operation->>'afterState';
    if before_index is null or after_index is null or before_index = after_index then
      return false;
    end if;
    -- Domain 5.5: only an adjacent step on a declared ROUTINE relationship is L2.
    expected_impact := case when coalesce(spec->>'protection', 'PROTECTED') = 'ROUTINE'
      and abs(after_index - before_index) = 1 then 'L2' else 'L3' end;
    expected_operation := jsonb_build_object('type', 'SHIFT_RELATIONSHIP',
      'relationshipId', relationship->>'id', 'beforeState', relationship->>'state',
      'afterState', operation->>'afterState', 'causalFactIds', operation->'causalFactIds');
    expected_display := jsonb_build_object('target', relationship->>'id',
      'before', relationship->>'state', 'after', operation->>'afterState', 'scope', 'SHARED');
  elsif operation->>'type' = 'RESOLVE_THREAD' then
    if requested <> 'THREAD_EFFECT'
       or operation->>'threadId' is distinct from action_row.operation_payload->>'targetThreadId'
       or not simulora.valid_text(operation->'resolution', 1000)
       or not exists (
         select 1 from jsonb_array_elements(coalesce(parent_document->'threads', '[]'::jsonb)) thread
         where thread->>'id' = operation->>'threadId' and thread->>'status' = 'OPEN') then
      return false;
    end if;
    expected_operation := jsonb_build_object('type', 'RESOLVE_THREAD',
      'threadId', operation->>'threadId', 'resolution', operation->'resolution',
      'causalFactIds', operation->'causalFactIds');
    expected_display := jsonb_build_object('target', operation->>'threadId',
      'before', 'OPEN', 'after', 'RESOLVED', 'scope', 'SHARED');
  else
    if exists (
      select 1 from jsonb_array_elements(coalesce(parent_document->'threads', '[]'::jsonb)) thread
      where thread->>'id' = new_thread_id) then return false; end if;
    if operation->>'type' = 'OPEN_THREAD' then
      if requested <> 'THREAD_EFFECT' or action_row.operation_payload ? 'targetThreadId'
         or not simulora.valid_text(operation->'title', 200) then return false; end if;
      expected_operation := jsonb_build_object('type', 'OPEN_THREAD', 'title', operation->'title',
        'causalFactIds', operation->'causalFactIds');
      expected_display := jsonb_build_object('target', new_thread_id,
        'before', 'No thread', 'after', operation->>'title', 'scope', 'SHARED');
    else
      -- A world-changing attempt may fail against a constraint the World declares.
      if requested = 'NO_WORLD_EFFECT'
         or not exists (
           select 1 from jsonb_array_elements(coalesce(world_document->'constraints', '[]'::jsonb)) item
           where item->>'id' = operation->>'constraintId')
         or not simulora.valid_text(operation->'outcome', 1000)
         or not simulora.valid_text(operation->'newThreadTitle', 200) then return false; end if;
      expected_operation := jsonb_build_object('type', 'TRANSFORM_FAILURE',
        'constraintId', operation->>'constraintId', 'outcome', operation->'outcome',
        'newThreadTitle', operation->'newThreadTitle', 'causalFactIds', operation->'causalFactIds');
      expected_display := jsonb_build_object('target', operation->>'constraintId',
        'before', operation->>'outcome', 'after', operation->>'newThreadTitle', 'scope', 'SHARED');
    end if;
  end if;

  expected_candidate := jsonb_build_object('schemaVersion', 1, 'actionId', action_row.id,
    'expectedHeadCommitId', action_row.expected_head_commit_id,
    'narrative', proposal.candidate_transition->'narrative',
    'responseSource', case when character_id is null then jsonb_build_object('type', 'WORLD')
      else jsonb_build_object('type', 'CHARACTER', 'characterId', character_id) end,
    'operation', expected_operation);
  digest_payload := jsonb_build_object('actionId', action_row.id, 'actorAccountId', action_row.actor_account_id,
    'expectedHeadCommitId', action_row.expected_head_commit_id, 'candidate', proposal.candidate_transition,
    'displayEffect', proposal.display_effect, 'expiresAt', to_char(proposal.expires_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'));
  return coalesce(
    proposal.impact_level = expected_impact
    and proposal.expected_head_commit_id = action_row.expected_head_commit_id
    and proposal.schema_version = 1 and proposal.expires_at > proposal.created_at
    and simulora.valid_text(proposal.candidate_transition->'narrative', 4000)
    and proposal.candidate_transition = expected_candidate
    and proposal.display_effect = expected_display
    and proposal.proposal_digest = encode(sha256(convert_to(simulora.canonical_jsonb_text(digest_payload), 'UTF8')), 'hex')
    and simulora.action_generation_evidence_is_valid(proposal), false);
end;
$$;

alter function simulora.expected_action_state(uuid) rename to expected_action_state_pre_mgc;
create function simulora.expected_action_state(p_action_id uuid) returns jsonb
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
  if action.operation_type <> 'PARTICIPATE' or coalesce(operation->>'type', '') not in ('SHIFT_RELATIONSHIP', 'OPEN_THREAD', 'RESOLVE_THREAD', 'TRANSFORM_FAILURE') then
    return simulora.expected_action_state_pre_mgc(p_action_id);
  end if;
  select state.document into parent_document from simulora.world_commits commit
    join simulora.state_revisions state on state.id = commit.state_revision_id
    where commit.id = action.expected_head_commit_id;
  expected_document := jsonb_set(parent_document, '{worldClock}', jsonb_build_object(
    'turn', ((parent_document->'worldClock'->>'turn')::integer + 1),
    'label', 'After action ' || ((parent_document->'worldClock'->>'turn')::integer + 1)));
  expected_document := jsonb_set(expected_document, '{openThreads}',
    parent_document->'openThreads' || jsonb_build_array(proposal.candidate_transition->>'narrative'));
  if operation->>'type' = 'SHIFT_RELATIONSHIP' then
    select jsonb_agg(case when relationship->>'id' = operation->>'relationshipId'
        then relationship || jsonb_build_object('state', operation->>'afterState')
        else relationship end order by position) into items
      from jsonb_array_elements(parent_document->'relationships') with ordinality as r(relationship, position);
    return jsonb_set(expected_document, '{relationships}', coalesce(items, '[]'::jsonb));
  end if;
  if operation->>'type' = 'RESOLVE_THREAD' then
    select jsonb_agg(case when thread->>'id' = operation->>'threadId'
        then thread || jsonb_build_object('status', 'RESOLVED', 'resolution', operation->'resolution')
        else thread end order by position) into items
      from jsonb_array_elements(coalesce(parent_document->'threads', '[]'::jsonb)) with ordinality as t(thread, position);
    return jsonb_set(expected_document, '{threads}', coalesce(items, '[]'::jsonb), true);
  end if;
  return jsonb_set(expected_document, '{threads}',
    coalesce(parent_document->'threads', '[]'::jsonb) || jsonb_build_array(jsonb_build_object(
      'id', 'thread.' || action.id::text,
      'title', case when operation->>'type' = 'OPEN_THREAD'
        then operation->'title' else operation->'newThreadTitle' end,
      'status', 'OPEN')), true);
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
  if new.operation_payload ? 'requestedEffect' and coalesce(new.operation_payload->>'requestedEffect', '') not in ('FACT_REWRITE', 'ROUTINE_EFFECT', 'NO_WORLD_EFFECT', 'RELATIONSHIP_EFFECT', 'THREAD_EFFECT') then
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

create or replace function simulora.restore_proposal_effect_is_valid(
  candidate simulora.restore_proposals
) returns boolean
language plpgsql stable strict as $$
declare
  current_document jsonb;
  source_document jsonb;
  current_hash text;
  source_hash text;
  expected_included jsonb := '["worldClock","locations","entities","characters","facts","relationships","openThreads","objectives","resources"]'::jsonb;
  expected_excluded jsonb := '["participation","interactionBoundaries","customState","account identity / eligibility / consent","ownership / grants / usage / exports","other Branches"]'::jsonb;
  changed_sections jsonb := '[]'::jsonb;
  section_changes jsonb := '[]'::jsonb;
  expected_diff jsonb;
  digest_payload jsonb;
  expected_digest text;
  section_name text;
  sections text[] := array[
    'worldClock', 'locations', 'entities', 'characters', 'facts',
    'relationships', 'openThreads', 'objectives', 'resources'
  ];
begin
  select state.document, state.document_hash
    into current_document, current_hash
    from simulora.world_commits commit
    join simulora.state_revisions state on state.id = commit.state_revision_id
   where commit.id = candidate.expected_head_commit_id;
  select state.document, state.document_hash
    into source_document, source_hash
    from simulora.world_commits commit
    join simulora.state_revisions state on state.id = commit.state_revision_id
   where commit.id = candidate.source_commit_id;

  if current_document is null or source_document is null then return false; end if;
  -- MGC-1: threads are restorable once either snapshot has them.
  if current_document ? 'threads' or source_document ? 'threads' then
    sections := sections || array['threads'];
    expected_included := expected_included || '["threads"]'::jsonb;
  end if;

  foreach section_name in array sections loop
    if current_document->section_name is distinct from source_document->section_name then
      changed_sections := changed_sections || jsonb_build_array(section_name);
      -- An absent section has no before/after key, exactly as the application stores it.
      section_changes := section_changes || jsonb_build_array(
        jsonb_build_object('section', section_name)
        || case when current_document ? section_name
             then jsonb_build_object('before', current_document->section_name) else '{}'::jsonb end
        || case when source_document ? section_name
             then jsonb_build_object('after', source_document->section_name) else '{}'::jsonb end
      );
    end if;
  end loop;

  expected_diff := jsonb_build_object(
    'changedSections', changed_sections,
    'sectionChanges', section_changes,
    'beforeHash', current_hash,
    'sourceHash', source_hash
  );
  digest_payload := jsonb_build_object(
    'actorAccountId', candidate.actor_account_id,
    'continuityId', candidate.continuity_id,
    'branchId', candidate.branch_id,
    'sourceCommitId', candidate.source_commit_id,
    'expectedHeadCommitId', candidate.expected_head_commit_id,
    'includedSections', expected_included,
    'excludedSections', expected_excluded,
    'changedSections', changed_sections,
    'beforeHash', current_hash,
    'sourceHash', source_hash
  );
  expected_digest := encode(
    sha256(convert_to(simulora.canonical_jsonb_text(digest_payload), 'UTF8')),
    'hex'
  );

  return jsonb_array_length(changed_sections) > 0
     and candidate.included_sections = expected_included
     and candidate.excluded_sections = expected_excluded
     and candidate.diff = expected_diff
     and candidate.proposal_digest = expected_digest
     and candidate.expires_at > candidate.created_at;
end;
$$;

create or replace function simulora.validate_restore_materialization() returns trigger
language plpgsql as $$
declare
  proposal simulora.restore_proposals%rowtype;
  confirmation_count integer;
  event_count integer;
  resulting_document jsonb;
  parent_document jsonb;
  source_document jsonb;
  expected_document jsonb;
  section_name text;
  branch_head uuid;
  branch_state_head uuid;
  active_branch uuid;
  branch_status text;
  continuity_status text;
begin
  if new.kind <> 'RESTORE_COMMITTED' then return new; end if;
  select * into proposal
    from simulora.restore_proposals where id = new.restore_proposal_id;
  select count(*)::integer into confirmation_count
    from simulora.restore_confirmations
    where proposal_id = new.restore_proposal_id
      and actor_account_id = proposal.actor_account_id
      and proposal_digest = proposal.proposal_digest
      and expected_head_commit_id = proposal.expected_head_commit_id
      and confirmed_at <= clock_timestamp()
      and confirmed_at < proposal.expires_at;
  select count(*)::integer into event_count
    from simulora.domain_events
    where commit_id = new.id
      and branch_id = new.branch_id
      and event_type = 'STATE_RESTORED'
      and payload->>'restoreProposalId' = new.restore_proposal_id::text
      and payload->>'sourceCommitId' = proposal.source_commit_id::text
      and payload->'includedSections' = proposal.included_sections;
  select document into resulting_document
    from simulora.state_revisions where id = new.state_revision_id;
  select state.document into parent_document
    from simulora.world_commits commit
    join simulora.state_revisions state on state.id = commit.state_revision_id
    where commit.id = new.parent_commit_id;
  select state.document into source_document
    from simulora.world_commits commit
    join simulora.state_revisions state on state.id = commit.state_revision_id
    where commit.id = proposal.source_commit_id;
  select branch.head_commit_id, branch.head_state_revision_id, branch.status,
         continuity.active_branch_id, continuity.status
    into branch_head, branch_state_head, branch_status, active_branch, continuity_status
    from simulora.branches branch
    join simulora.continuities continuity on continuity.id = branch.continuity_id
    where branch.id = new.branch_id;
  expected_document := parent_document;
  -- MGC-1: the included sections are the proposal's validated list; a section the
  -- source snapshot lacks is removed rather than set to null.
  for section_name in select value from jsonb_array_elements_text(proposal.included_sections) loop
    expected_document := case when source_document ? section_name
      then jsonb_set(expected_document, array[section_name], source_document->section_name, true)
      else expected_document - section_name end;
  end loop;
  if proposal.expires_at <= clock_timestamp()
     or not simulora.restore_proposal_effect_is_valid(proposal)
     or confirmation_count <> 1
     or event_count <> 1
     or resulting_document is distinct from expected_document
     or branch_head is distinct from new.id
     or branch_state_head is distinct from new.state_revision_id
     or branch_status is distinct from 'ACTIVE'
     or continuity_status is distinct from 'ACTIVE'
     or active_branch is distinct from new.branch_id then
    raise exception 'Restore Commit requires exact live confirmation, append-only state, one linked STATE_RESTORED Event and an advanced Branch head';
  end if;
  return new;
end;
$$;
