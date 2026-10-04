-- PX-4b (ADR-PX4-4): a story turn may make two to four changes. The candidate is
-- schemaVersion 2 with `operations`; one change or none stays v1. Each change is
-- validated by the unchanged v1 effect validators as a virtual one-change
-- proposal, and commits with its own typed Event, in order. All of this applies
-- only to STORY_DECIDES Actions created after this migration; the ledger
-- timestamp is the boundary, so earlier evidence stays exact.
create function simulora.px4b_multi_apply(action_created_at timestamptz)
returns boolean language plpgsql stable as $$
declare
  applied timestamptz;
begin
  if to_regclass('app_meta.schema_migrations') is not null then
    execute 'select applied_at from app_meta.schema_migrations where name = $1'
      into applied using '0058_px4b_multi_change.sql';
  end if;
  return action_created_at >= coalesce(applied, '-infinity'::timestamptz);
end;
$$;

create function simulora.px4b_reject_epoch_change() returns trigger
language plpgsql as $$
begin
  if old.name <> '0058_px4b_multi_change.sql' then
    if tg_op = 'DELETE' then return old; end if;
    return new;
  end if;
  if tg_op = 'DELETE' then
    raise exception 'The PX-4b multi-change epoch is immutable' using errcode = '55000';
  end if;
  if new.name is distinct from old.name or new.applied_at is distinct from old.applied_at then
    raise exception 'The PX-4b multi-change epoch is immutable' using errcode = '55000';
  end if;
  return new;
end;
$$;

do $$
begin
  if to_regclass('app_meta.schema_migrations') is not null then
    create trigger px4b_multi_change_epoch_immutable
    before update or delete on app_meta.schema_migrations
    for each row execute function simulora.px4b_reject_epoch_change();
  end if;
end;
$$;

-- A commit may now carry several Events of one type, told apart by position.
-- Every existing row keeps ordinal 1, so the widened key holds for it.
alter table simulora.domain_events
  add column ordinal integer not null default 1 check (ordinal between 1 and 4);
alter table simulora.domain_events drop constraint domain_events_commit_id_event_type_key;
alter table simulora.domain_events
  add constraint domain_events_commit_type_ordinal_key unique (commit_id, event_type, ordinal);

-- A multi-change proposal is schema version 2; virtual parts are never stored.
alter table simulora.action_proposals drop constraint action_proposals_schema_version_check;
alter table simulora.action_proposals
  add constraint action_proposals_schema_version_check check (schema_version in (1, 2));

-- PX-4b: the 0056 generation evidence with its expected output and the facts
-- the whole turn reveals as inputs. Only the narrative uses that union.
create function simulora.px4b_generation_evidence_core(
  proposal simulora.action_proposals, expected_output jsonb, turn_disclosed jsonb
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
  operation := proposal.candidate_transition->'operation';
  user_role_name := world_document->'userRole'->>'name';
  -- WD-1b: a reveal may name the fact it reveals; nothing else outside the context.
  disclosed_fact_ids := included_fact_ids || case when operation->>'type' = 'REVEAL_FACT'
    then jsonb_build_array(operation->>'factId') else '[]'::jsonb end
    -- PX-4b: the narrative of a multi-change turn may name what the turn reveals.
    || turn_disclosed;

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

-- PX-4b: the evidence entry point. A Generation Attempt whose output is a v2
-- candidate makes this a virtual one-change part of that turn: its operation must
-- be one of the output's operations, and its other fields the output's. Only the
-- dispatcher below builds such a part; the top-level validator refuses a stored
-- v1 proposal whose attempt output is v2, so no partial turn can be stored.
create or replace function simulora.action_generation_evidence_is_valid(
  proposal simulora.action_proposals
) returns boolean
language plpgsql stable strict as $$
declare
  attempt_output jsonb;
begin
  select attempt.output into attempt_output
    from simulora.generation_attempts attempt where attempt.id = proposal.generation_attempt_id;
  if attempt_output->'candidate'->>'schemaVersion' = '2' then
    if proposal.schema_version <> 1
       or (proposal.candidate_transition - 'operation') is distinct from
          (((attempt_output->'candidate') - 'operations') || jsonb_build_object('schemaVersion', 1))
       or not exists (
         select 1 from jsonb_array_elements(attempt_output->'candidate'->'operations') item
          where item.value = proposal.candidate_transition->'operation') then
      return false;
    end if;
    return simulora.px4b_generation_evidence_core(proposal, attempt_output, coalesce((
      select jsonb_agg(item.value->'factId')
        from jsonb_array_elements(attempt_output->'candidate'->'operations') item
       where item.value->>'type' = 'REVEAL_FACT'), '[]'::jsonb));
  end if;
  return simulora.px4b_generation_evidence_core(proposal, jsonb_build_object(
    'narrative', proposal.candidate_transition->'narrative',
    'responseSource', proposal.candidate_transition->'responseSource',
    'candidate', proposal.candidate_transition), '[]'::jsonb);
end;
$$;

-- PX-4b combination rules (ADR-PX4-4), mirrored by the domain's
-- assertOperationsCombine: disjoint targets, no cause that another change
-- rewrites or reveals, one failure joined only by added facts, one move.
create function simulora.px4b_operations_combine(operations jsonb) returns boolean
language sql immutable as $$
  with keyed as (
    select item.value as operation, item.ordinality as op_position,
      case item.value->>'type'
        when 'UPDATE_CANONICAL_FACT' then 'fact:' || (item.value->>'targetFactId')
        when 'REVEAL_FACT' then 'fact:' || (item.value->>'factId')
        when 'SHIFT_RELATIONSHIP' then 'relationship:' || (item.value->>'relationshipId')
        when 'RESOLVE_THREAD' then 'thread:' || (item.value->>'threadId')
        when 'MOVE_CHARACTER' then 'character:' || (item.value->>'characterId')
        else 'new:' || item.ordinality end as target,
      case item.value->>'type'
        when 'UPDATE_CANONICAL_FACT' then item.value->>'targetFactId'
        when 'REVEAL_FACT' then item.value->>'factId' end as changed_fact
    from jsonb_array_elements(operations) with ordinality as item(value, ordinality)
  )
  select (select count(distinct target) from keyed) = (select count(*) from keyed)
    and not exists (
      select 1 from keyed cause join keyed other
        on other.op_position <> cause.op_position and other.changed_fact is not null
       where jsonb_typeof(cause.operation->'causalFactIds') = 'array'
         and cause.operation->'causalFactIds' ? other.changed_fact)
    and (select count(*) from keyed where operation->>'type' = 'TRANSFORM_FAILURE') <= 1
    and (not exists (select 1 from keyed where operation->>'type' = 'TRANSFORM_FAILURE')
      or not exists (select 1 from keyed
        where operation->>'type' not in ('TRANSFORM_FAILURE', 'ADD_FACT')))
    and (select count(*) from keyed where operation->>'type' = 'MOVE_CHARACTER') <= 1
    and not exists (select 1 from keyed
      where coalesce(operation->>'type', 'NO_WORLD_EFFECT') = 'NO_WORLD_EFFECT')
$$;

-- PX-4b: one operation's change to a state document, without the turn's clock
-- and narrative. Each case is the v1 state change of that operation
-- (expected_action_state and its predecessors); the domain mirrors it.
create function simulora.px4b_operation_delta(
  document jsonb, operation jsonb, p_action_id uuid, new_fact_id text, new_thread_id text
) returns jsonb language plpgsql stable as $$
declare
  items jsonb;
  destination jsonb;
begin
  case operation->>'type'
  when 'UPDATE_CANONICAL_FACT' then
    select jsonb_agg(case when fact->>'id' = operation->>'targetFactId' then
        fact || jsonb_build_object('statement', operation->>'afterStatement',
          'scope', operation->>'scope', 'provenance', operation->>'provenance')
        else fact end order by position) into items
      from jsonb_array_elements(document->'facts') with ordinality as facts(fact, position);
    return jsonb_set(document, '{facts}', items);
  when 'REVEAL_FACT' then
    select jsonb_agg(case when fact->>'id' = operation->>'factId'
        then fact || jsonb_build_object('scope', 'SHARED') else fact end order by position) into items
      from jsonb_array_elements(document->'facts') with ordinality as facts(fact, position);
    return jsonb_set(document, '{facts}', items);
  when 'ADD_FACT' then
    return jsonb_set(document, '{facts}', document->'facts' || jsonb_build_array(jsonb_build_object(
      'id', new_fact_id, 'statement', operation->>'statement', 'scope', 'SHARED',
      'provenance', 'Confirmed Action ' || p_action_id::text, 'lifecycle', 'ACTIVE')));
  when 'MOVE_CHARACTER' then
    select location into destination from jsonb_array_elements(document->'locations') location
      where location->>'id' = operation->>'afterLocationId';
    select jsonb_agg(case when character->>'id' = operation->>'characterId' then
        character || jsonb_build_object('locationId', operation->>'afterLocationId',
          'currentState', 'Present at ' || (destination->>'name') || '.')
        else character end order by position) into items
      from jsonb_array_elements(document->'characters') with ordinality as c(character, position);
    return jsonb_set(document, '{characters}', items);
  when 'SHIFT_RELATIONSHIP' then
    select jsonb_agg(case when relationship->>'id' = operation->>'relationshipId'
        then relationship || jsonb_build_object('state', operation->>'afterState')
        else relationship end order by position) into items
      from jsonb_array_elements(document->'relationships') with ordinality as r(relationship, position);
    return jsonb_set(document, '{relationships}', coalesce(items, '[]'::jsonb));
  when 'RESOLVE_THREAD' then
    select jsonb_agg(case when thread->>'id' = operation->>'threadId'
        then thread || jsonb_build_object('status', 'RESOLVED', 'resolution', operation->'resolution')
        else thread end order by position) into items
      from jsonb_array_elements(coalesce(document->'threads', '[]'::jsonb)) with ordinality as t(thread, position);
    return jsonb_set(document, '{threads}', coalesce(items, '[]'::jsonb), true);
  when 'OPEN_THREAD', 'TRANSFORM_FAILURE' then
    return jsonb_set(document, '{threads}',
      coalesce(document->'threads', '[]'::jsonb) || jsonb_build_array(jsonb_build_object(
        'id', new_thread_id,
        'title', case when operation->>'type' = 'OPEN_THREAD'
          then operation->'title' else operation->'newThreadTitle' end,
        'status', 'OPEN')), true);
  else
    return null;
  end case;
end;
$$;

-- PX-4b: the typed Event each operation commits with; the payload is the v1
-- payload, with the position-derived id of a new fact or thread.
create function simulora.px4b_event(
  p_action_id uuid, operation jsonb, op_position integer, display jsonb
) returns jsonb language sql immutable as $$
  select case operation->>'type'
    when 'UPDATE_CANONICAL_FACT' then jsonb_build_object('type', 'ACTION_RECORDED',
      'payload', jsonb_build_object('actionId', p_action_id, 'target', display->>'target'))
    when 'MOVE_CHARACTER' then jsonb_build_object('type', 'CHARACTER_MOVED',
      'payload', jsonb_build_object('actionId', p_action_id,
        'characterId', operation->>'characterId',
        'beforeLocationId', operation->>'beforeLocationId',
        'afterLocationId', operation->>'afterLocationId',
        'causalFactIds', operation->'causalFactIds'))
    when 'SHIFT_RELATIONSHIP' then jsonb_build_object('type', 'RELATIONSHIP_SHIFTED',
      'payload', jsonb_build_object('actionId', p_action_id,
        'relationshipId', operation->>'relationshipId',
        'before', operation->>'beforeState', 'after', operation->>'afterState',
        'causalFactIds', operation->'causalFactIds'))
    when 'OPEN_THREAD' then jsonb_build_object('type', 'THREAD_OPENED',
      'payload', jsonb_build_object('actionId', p_action_id,
        'threadId', 'thread.' || p_action_id::text || '.' || op_position,
        'title', operation->>'title', 'causalFactIds', operation->'causalFactIds'))
    when 'RESOLVE_THREAD' then jsonb_build_object('type', 'THREAD_RESOLVED',
      'payload', jsonb_build_object('actionId', p_action_id,
        'threadId', operation->>'threadId', 'resolution', operation->>'resolution',
        'causalFactIds', operation->'causalFactIds'))
    when 'REVEAL_FACT' then jsonb_build_object('type', 'FACT_REVEALED',
      'payload', jsonb_build_object('actionId', p_action_id,
        'factId', operation->>'factId', 'causalFactIds', operation->'causalFactIds'))
    when 'ADD_FACT' then jsonb_build_object('type', 'FACT_ADDED',
      'payload', jsonb_build_object('actionId', p_action_id,
        'factId', 'fact.' || p_action_id::text || '.' || op_position,
        'statement', operation->>'statement', 'causalFactIds', operation->'causalFactIds'))
    when 'TRANSFORM_FAILURE' then jsonb_build_object('type', 'ATTEMPT_TRANSFORMED',
      'payload', jsonb_build_object('actionId', p_action_id,
        'constraintId', operation->>'constraintId', 'outcome', operation->>'outcome',
        'threadId', 'thread.' || p_action_id::text || '.' || op_position,
        'causalFactIds', operation->'causalFactIds'))
  end
$$;

-- PX-4b: the state a multi-change turn must produce: its operations in order,
-- then one clock step and one narrative entry.
alter function simulora.expected_action_state(uuid) rename to expected_action_state_pre_px4b;
create function simulora.expected_action_state(p_action_id uuid) returns jsonb
language plpgsql stable as $$
declare
  action simulora.actions%rowtype;
  proposal simulora.action_proposals%rowtype;
  parent_document jsonb;
  document jsonb;
  item record;
begin
  select * into action from simulora.actions where id = p_action_id;
  select * into proposal from simulora.action_proposals where action_id = p_action_id;
  if proposal.schema_version is distinct from 2 or action.operation_type <> 'PARTICIPATE' then
    return simulora.expected_action_state_pre_px4b(p_action_id);
  end if;
  select state.document into parent_document from simulora.world_commits commit
    join simulora.state_revisions state on state.id = commit.state_revision_id
    where commit.id = action.expected_head_commit_id;
  document := parent_document;
  for item in
    select value as operation, ordinality::integer as op_position
      from jsonb_array_elements(proposal.candidate_transition->'operations') with ordinality
  loop
    document := simulora.px4b_operation_delta(document, item.operation, action.id,
      'fact.' || action.id::text || '.' || item.op_position,
      'thread.' || action.id::text || '.' || item.op_position);
  end loop;
  document := jsonb_set(document, '{worldClock}', jsonb_build_object(
    'turn', ((parent_document->'worldClock'->>'turn')::integer + 1),
    'label', 'After action ' || ((parent_document->'worldClock'->>'turn')::integer + 1)));
  return jsonb_set(document, '{openThreads}',
    parent_document->'openThreads' || jsonb_build_array(proposal.candidate_transition->>'narrative'));
end;
$$;

-- PX-4b: a stored multi-change proposal. The envelope binds the whole v2
-- candidate, its Generation Attempt, digest and combination; each operation is
-- then a virtual v1 part checked by the unchanged effect validators, at exactly
-- one impact level, with the v1 base id in place of its derived id.
create function simulora.px4b_turn_is_valid(proposal simulora.action_proposals)
returns boolean language plpgsql stable strict as $$
declare
  action_row simulora.actions%rowtype;
  attempt_output jsonb;
  parent_document jsonb;
  candidate jsonb := proposal.candidate_transition;
  operations jsonb := proposal.candidate_transition->'operations';
  character_id text;
  part simulora.action_proposals;
  item record;
  display jsonb;
  derived text;
  at_l2 boolean;
  at_l3 boolean;
  turn_impact text := 'L2';
begin
  select * into action_row from simulora.actions where id = proposal.action_id;
  select attempt.output into attempt_output
    from simulora.generation_attempts attempt where attempt.id = proposal.generation_attempt_id;
  select state.document into parent_document from simulora.world_commits commit
    join simulora.state_revisions state on state.id = commit.state_revision_id
    where commit.id = action_row.expected_head_commit_id;
  if action_row.id is null or attempt_output is null or parent_document is null then
    return false;
  end if;
  character_id := simulora.mgc_selected_character(action_row.id);
  if not coalesce(
       proposal.schema_version = 2
       and action_row.operation_type = 'PARTICIPATE'
       and action_row.operation_payload->>'requestedEffect' = 'STORY_DECIDES'
       and simulora.px4_story_freedom_apply(action_row.created_at)
       and simulora.px4b_multi_apply(action_row.created_at)
       and simulora.valid_object_keys(candidate, array['schemaVersion', 'actionId',
         'expectedHeadCommitId', 'narrative', 'responseSource', 'operations'])
       and (select count(*) from jsonb_object_keys(candidate)) = 6
       and candidate->'schemaVersion' = '2'::jsonb
       and candidate->>'actionId' = action_row.id::text
       and candidate->>'expectedHeadCommitId' = action_row.expected_head_commit_id::text
       and candidate->'responseSource' = case when character_id is null
         then jsonb_build_object('type', 'WORLD')
         else jsonb_build_object('type', 'CHARACTER', 'characterId', character_id) end
       and simulora.valid_text(candidate->'narrative', 4000)
       and jsonb_typeof(operations) = 'array'
       and jsonb_array_length(operations) between 2 and 4
       and jsonb_typeof(proposal.display_effect) = 'array'
       and jsonb_array_length(proposal.display_effect) = jsonb_array_length(operations)
       and proposal.expected_head_commit_id = action_row.expected_head_commit_id
       and proposal.expires_at > proposal.created_at
       and attempt_output = jsonb_build_object('narrative', candidate->'narrative',
         'responseSource', candidate->'responseSource', 'candidate', candidate)
       and simulora.px4b_operations_combine(operations)
       and proposal.proposal_digest = encode(sha256(convert_to(simulora.canonical_jsonb_text(
         jsonb_build_object('actionId', action_row.id, 'actorAccountId', action_row.actor_account_id,
           'expectedHeadCommitId', action_row.expected_head_commit_id, 'candidate', candidate,
           'displayEffect', proposal.display_effect,
           'expiresAt', to_char(proposal.expires_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'))),
         'UTF8')), 'hex'),
     false) then
    return false;
  end if;

  for item in
    select value as operation, ordinality::integer as op_position
      from jsonb_array_elements(operations) with ordinality
  loop
    display := proposal.display_effect->(item.op_position - 1);
    if item.operation->>'type' in ('ADD_FACT', 'OPEN_THREAD', 'TRANSFORM_FAILURE') then
      derived := case when item.operation->>'type' = 'ADD_FACT' then 'fact.' else 'thread.' end
        || action_row.id::text || '.' || item.op_position;
      if exists (select 1 from jsonb_array_elements(coalesce(parent_document->'facts', '[]'::jsonb)) fact
                 where fact->>'id' = derived)
         or exists (select 1 from jsonb_array_elements(coalesce(parent_document->'threads', '[]'::jsonb)) thread
                 where thread->>'id' = derived) then
        return false;
      end if;
      -- A new fact or thread is shown by its derived id; the v1 part uses the base id.
      if item.operation->>'type' <> 'TRANSFORM_FAILURE' then
        if display->>'target' is distinct from derived then return false; end if;
        display := display || jsonb_build_object('target',
          case when item.operation->>'type' = 'ADD_FACT' then 'fact.' else 'thread.' end
          || action_row.id::text);
      end if;
    end if;
    part := proposal;
    part.schema_version := 1;
    part.candidate_transition := (candidate - 'operations')
      || jsonb_build_object('schemaVersion', 1, 'operation', item.operation);
    part.display_effect := display;
    part.proposal_digest := encode(sha256(convert_to(simulora.canonical_jsonb_text(
      jsonb_build_object('actionId', action_row.id, 'actorAccountId', action_row.actor_account_id,
        'expectedHeadCommitId', action_row.expected_head_commit_id,
        'candidate', part.candidate_transition, 'displayEffect', display,
        'expiresAt', to_char(proposal.expires_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'))),
      'UTF8')), 'hex');
    part.impact_level := 'L2';
    at_l2 := coalesce(simulora.action_proposal_effect_is_valid_pre_px4b(part), false);
    part.impact_level := 'L3';
    at_l3 := coalesce(simulora.action_proposal_effect_is_valid_pre_px4b(part), false);
    -- Exactly one level must pass: none is an invalid change, both a broken table.
    if at_l2 = at_l3 then return false; end if;
    if at_l3 then turn_impact := 'L3'; end if;
  end loop;
  return proposal.impact_level = turn_impact;
end;
$$;

alter function simulora.action_proposal_effect_is_valid(simulora.action_proposals)
  rename to action_proposal_effect_is_valid_pre_px4b;
create function simulora.action_proposal_effect_is_valid(proposal simulora.action_proposals)
returns boolean language plpgsql stable strict as $$
begin
  if proposal.schema_version = 2 then
    return simulora.px4b_turn_is_valid(proposal);
  end if;
  -- A stored one-change proposal may not come from a multi-change generation.
  if exists (select 1 from simulora.generation_attempts attempt
             where attempt.id = proposal.generation_attempt_id
               and attempt.output->'candidate'->>'schemaVersion' = '2') then
    return false;
  end if;
  return simulora.action_proposal_effect_is_valid_pre_px4b(proposal);
end;
$$;

-- PX-4b: the WD-1b materialization rule, plus one typed Event per change.
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

  -- PX-4b: a multi-change turn commits one typed Event per operation, by ordinal.
  if proposal.schema_version = 2 then
    if action.status is distinct from 'COMMITTED'
       or proposal.status is distinct from 'CONFIRMED'
       or not simulora.action_proposal_effect_is_valid(proposal)
       or resulting_document is distinct from expected_document
       or branch_head is distinct from new.id
       or branch_state_head is distinct from new.state_revision_id
       or branch_status is distinct from 'ACTIVE'
       or continuity_status is distinct from 'ACTIVE'
       or active_branch is distinct from new.branch_id
       or (select count(*) from simulora.domain_events where commit_id = new.id)
          <> jsonb_array_length(proposal.candidate_transition->'operations')
       or exists (
         select 1
           from jsonb_array_elements(proposal.candidate_transition->'operations')
             with ordinality as item(operation, position)
           cross join lateral (select simulora.px4b_event(action.id, item.operation,
             item.position::integer, proposal.display_effect->(item.position::integer - 1)) as expected) e
          where not exists (
            select 1 from simulora.domain_events event
             where event.commit_id = new.id and event.branch_id = new.branch_id
               and event.ordinal = item.position
               and event.event_type = e.expected->>'type'
               and event.payload = e.expected->'payload'
               and event.source_type = 'USER'
               and event.visibility_scope = proposal.display_effect->(item.position::integer - 1)->>'scope'
               and event.cause_action_id = action.id)) then
      raise exception 'A multi-change Commit requires exact state, one typed Event per change, terminal Action and advanced active Branch head';
    end if;
    return new;
  end if;

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

-- PX-4b: the WD-1a generation context, with Events ordered within a commit.
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
      fact->>'id' = target->>'id'
      -- WD-1a: every shared fact joins the context for Actions after 0055.
      or (fact->>'scope' = 'SHARED' and simulora.wd1_shared_world_apply(action.created_at))
      or (
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
    -- PX-4b: a commit with several Events lists them by ordinal; a commit with
    -- one keeps its earlier aggregate exactly, so earlier digests still hold.
    'events', case when exists (select 1 from simulora.domain_events event
        where event.commit_id = commit.id and event.ordinal > 1)
      then coalesce((select jsonb_agg(jsonb_build_object(
        'id', event.id, 'type', event.event_type, 'scope', event.visibility_scope,
        'sourceClass', event.source_type, 'causeActionId', event.cause_action_id)
        order by event.ordinal)
        from simulora.domain_events event where event.commit_id = commit.id
          and event.visibility_scope = 'SHARED'), '[]'::jsonb)
      else coalesce((select jsonb_agg(jsonb_build_object(
      'id', event.id, 'type', event.event_type, 'scope', event.visibility_scope,
      'sourceClass', event.source_type, 'causeActionId', event.cause_action_id))
      from simulora.domain_events event where event.commit_id = commit.id
        and event.visibility_scope = 'SHARED'), '[]'::jsonb) end,
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
