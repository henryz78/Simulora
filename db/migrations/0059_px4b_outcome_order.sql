-- PX-4b review (M-1): the TB-1 committed outcomes list a multi-change turn's
-- Events in ordinal order, as the history aggregate does since 0058. Every
-- earlier commit's Events have ordinal 1, so their order, and every digest built
-- on it, is unchanged. This is the 0052 body that 0053 renamed, with only that
-- ORDER BY changed.
create or replace function simulora.re2_generation_context_tb1_unbounded(action_id uuid) returns jsonb
language plpgsql stable strict as $$
declare
  context jsonb := simulora.re2_generation_context_pre_tb1(action_id);
  action simulora.actions%rowtype;
  state jsonb;
  world jsonb;
  allowed jsonb;
  visible jsonb;
  outcomes jsonb;
begin
  if context is null then return null; end if;
  select * into action from simulora.actions where id = action_id;
  if not simulora.tb1_outcomes_apply(action.created_at) then return context; end if;
  select snapshot.document, revision.document into state, world
    from simulora.world_commits commit
    join simulora.state_revisions snapshot on snapshot.id = commit.state_revision_id
    join simulora.continuities continuity on continuity.id = action.continuity_id
    join simulora.world_revisions revision on revision.id = continuity.world_revision_id
    where commit.id = action.expected_head_commit_id and commit.branch_id = action.branch_id;
  -- The RE-2 compiler already listed exactly the facts this Character may know.
  select coalesce(jsonb_agg(fact->'id'), '[]'::jsonb) into allowed
    from jsonb_array_elements(context->'current'->'facts') fact;
  select allowed || coalesce(jsonb_agg(fact->'id'), '[]'::jsonb) into visible
    from jsonb_array_elements(state->'facts') fact
    where fact->>'lifecycle' = 'ACTIVE' and fact->>'scope' = 'SHARED';
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
  ), items as (
    select commit.distance, jsonb_build_object(
      'commitId', commit.id,
      'events', coalesce((
        select jsonb_agg(jsonb_build_object('type', event.event_type, 'text', described.text)
          order by event.ordinal, event.created_at, event.id)
          from simulora.domain_events event
          cross join lateral (select simulora.tb1_event_text(event.event_type, event.payload, world) as text) described
          where event.commit_id = commit.id and event.visibility_scope = 'SHARED'
            and described.text is not null
            and not simulora.generated_output_references_excluded_fact(described.text, state, visible)
      ), '[]'::jsonb),
      'exchange', coalesce((
        select jsonb_agg(jsonb_build_object('role', entry.role,
          'characterId', entry.speaker_character_id, 'content', entry.content) order by entry.ordinal)
          from simulora.conversation_entries entry
          join simulora.actions earlier on earlier.id = commit.action_id and earlier.operation_type = 'PARTICIPATE'
          join simulora.generation_attempts attempt on attempt.action_id = earlier.id and attempt.status = 'SUCCEEDED'
          where entry.commit_id = commit.id
            and not exists (select 1 from jsonb_array_elements(
              attempt.context_manifest->'includedFactIds') as used(fact_id)
              where not jsonb_exists(visible, used.fact_id #>> '{}'))
            and not simulora.generated_output_references_excluded_fact(entry.content, state, visible)
      ), '[]'::jsonb)) as item
      from recent commit
      where not commit.boundary and commit.kind <> 'CONTINUITY_INITIALIZED'
  )
  select coalesce(jsonb_agg(item order by distance desc), '[]'::jsonb) into outcomes
    from items where item->'events' <> '[]'::jsonb or item->'exchange' <> '[]'::jsonb;
  -- Stay within the RE-2 byte bound by dropping the oldest outcomes first.
  while jsonb_array_length(outcomes) > 0 and octet_length(simulora.canonical_jsonb_text(
      context || jsonb_build_object('committedOutcomes', outcomes))) > 48000 loop
    outcomes := outcomes - 0;
  end loop;
  return context || jsonb_build_object('committedOutcomes', outcomes);
end;
$$;
