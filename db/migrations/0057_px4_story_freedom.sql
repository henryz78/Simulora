-- PX-4a (ADR-PX4-2): under "Let the story decide" the model may choose any closed
-- operation: rewrite a SHARED fact (L3), move the selected Character along an
-- authorized route, shift its scaled relationship, open a thread or resolve any
-- open one. Each keeps its existing validator; only the requested-effect gate
-- widens. The effect context is compiled for every such Action. All of this
-- applies only to Actions created after this migration; the ledger timestamp
-- is the boundary, so earlier evidence stays exact.
create function simulora.px4_story_freedom_apply(action_created_at timestamptz)
returns boolean language plpgsql stable as $$
declare
  applied timestamptz;
begin
  if to_regclass('app_meta.schema_migrations') is not null then
    execute 'select applied_at from app_meta.schema_migrations where name = $1'
      into applied using '0057_px4_story_freedom.sql';
  end if;
  return action_created_at >= coalesce(applied, '-infinity'::timestamptz);
end;
$$;

create function simulora.px4_reject_epoch_change() returns trigger
language plpgsql as $$
begin
  if old.name <> '0057_px4_story_freedom.sql' then
    if tg_op = 'DELETE' then return old; end if;
    return new;
  end if;
  if tg_op = 'DELETE' then
    raise exception 'The PX-4a story-freedom epoch is immutable' using errcode = '55000';
  end if;
  if new.name is distinct from old.name or new.applied_at is distinct from old.applied_at then
    raise exception 'The PX-4a story-freedom epoch is immutable' using errcode = '55000';
  end if;
  return new;
end;
$$;

do $$
begin
  if to_regclass('app_meta.schema_migrations') is not null then
    create trigger px4_story_freedom_epoch_immutable
    before update or delete on app_meta.schema_migrations
    for each row execute function simulora.px4_reject_epoch_change();
  end if;
end;
$$;

-- PX-4a: a story Action after the epoch always carries the effect context.
create or replace function simulora.mgc_effect_context(p_action_id uuid) returns jsonb
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
          or (requested = 'STORY_DECIDES' and simulora.px4_story_freedom_apply(action.created_at))
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

-- PX-4a: the MGC-1 validator (renamed by 0055) lets a story Action shift the
-- selected Character's relationship, open a thread or resolve any open thread.
create or replace function simulora.action_proposal_effect_is_valid_pre_wd1(proposal simulora.action_proposals)
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
  story boolean;
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
  -- PX-4a (ADR-PX4-2): a story Action after 0057 may shift, open or resolve.
  story := requested = 'STORY_DECIDES' and simulora.px4_story_freedom_apply(action_row.created_at);
  character_id := simulora.mgc_selected_character(action_row.id);
  new_thread_id := 'thread.' || action_row.id::text;

  if operation->>'type' = 'SHIFT_RELATIONSHIP' then
    select value into relationship from jsonb_array_elements(parent_document->'relationships')
      where value->>'id' = operation->>'relationshipId';
    select value into spec from jsonb_array_elements(world_document->'relationships')
      where value->>'id' = operation->>'relationshipId';
    if (requested <> 'RELATIONSHIP_EFFECT' and not story) or character_id is null
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
    if (not story and (requested <> 'THREAD_EFFECT'
         or operation->>'threadId' is distinct from action_row.operation_payload->>'targetThreadId'))
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
      if (requested <> 'THREAD_EFFECT' and not story) or action_row.operation_payload ? 'targetThreadId'
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

-- PX-4a: the RE-3 validator (renamed by 0048) lets a story Action rewrite a fact
-- (L3) or move its explicitly selected Character along an authorized route.
create or replace function simulora.action_proposal_effect_is_valid_pre_mgc(proposal simulora.action_proposals)
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
    -- PX-4a (ADR-PX4-2): a story Action after 0057 may also rewrite a fact.
    if action_row.operation_type = 'PARTICIPATE'
       and coalesce(action_row.operation_payload->>'requestedEffect', 'FACT_REWRITE') <> 'FACT_REWRITE'
       and not (action_row.operation_payload->>'requestedEffect' = 'STORY_DECIDES'
                and simulora.px4_story_freedom_apply(action_row.created_at)) then return false; end if;
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
    and (action_row.operation_payload->>'requestedEffect' = 'ROUTINE_EFFECT'
      or (action_row.operation_payload->>'requestedEffect' = 'STORY_DECIDES'
          and action_row.operation_payload ? 'targetCharacterId'
          and simulora.px4_story_freedom_apply(action_row.created_at)))
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
