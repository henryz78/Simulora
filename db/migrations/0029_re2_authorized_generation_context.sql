-- RE-2 is context/targeting only: no new state-effect types or world mutation.
-- Legacy automatic Actions/proposals remain valid through upgrade.

create function simulora.validate_re2_action_target() returns trigger
language plpgsql as $$
declare
  state jsonb;
  world jsonb;
  target jsonb;
begin
  if new.operation_type <> 'PARTICIPATE' then return new; end if;
  if (new.operation_payload = '{}'::jsonb or (
    jsonb_typeof(new.operation_payload) = 'object'
    and new.operation_payload = jsonb_build_object('targetCharacterId', new.operation_payload->>'targetCharacterId')
    and (new.operation_payload->>'targetCharacterId' ~ '^[a-z0-9][a-z0-9._-]{0,119}$') is true
  )) is not true then
    raise exception 'Ordinary Action targeting cannot change authority or participation';
  end if;
  if new.operation_payload = '{}'::jsonb then return new; end if;
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

create trigger actions_re2_target before insert on simulora.actions
for each row execute function simulora.validate_re2_action_target();

-- One shared compiler serves the worker and durable evidence validator. Its
-- output is minimized context, not another world-state store.
create function simulora.re2_generation_context(action_id uuid) returns jsonb
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
    where (action.operation_payload->>'targetCharacterId' is null or s.character->>'id' = action.operation_payload->>'targetCharacterId')
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
    and not simulora.generated_narrative_authors_user(proposal.candidate_transition->>'narrative', user_role_name)
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
