-- TB-1 / ADR-TB1: the generation context also carries what already happened on
-- this path, so a later turn cannot contradict a confirmed outcome. The
-- wrapped RE-2 compiler is unchanged; this adds `committedOutcomes`:
--   * the SHARED Event text of recent committed Actions (transformed outcome,
--     thread opened or resolved, relationship shift, movement), and
--   * their committed exchange, when the knowledge that produced it was this
--     Character's own or SHARED.
-- Any text quoting a fact that is neither known to this Character nor SHARED is
-- left out. The walk stops at a Restore or correction boundary exactly as the
-- RE-2 history does. Actions created before this migration keep the earlier
-- context, so their pending evidence still validates.

create table simulora.tb1_outcome_context_epoch (
  started_at timestamptz primary key
);
insert into simulora.tb1_outcome_context_epoch (started_at) values (now());
create trigger tb1_outcome_context_epoch_immutable
before update or delete on simulora.tb1_outcome_context_epoch
for each row execute function simulora.reject_immutable_change();

create function simulora.tb1_event_text(event_type text, payload jsonb, world jsonb)
returns text language sql immutable as $$
  select case event_type
    when 'ATTEMPT_TRANSFORMED' then
      'An attempt met a world constraint: ' || (payload->>'outcome')
    when 'THREAD_OPENED' then 'A story thread opened: ' || (payload->>'title')
    when 'THREAD_RESOLVED' then 'A story thread was resolved: ' || (payload->>'resolution')
    when 'RELATIONSHIP_SHIFTED' then
      coalesce((select relation->>'description' from jsonb_array_elements(world->'relationships') relation
        where relation->>'id' = payload->>'relationshipId' limit 1), 'A relationship')
      || ' changed from ' || (payload->>'before') || ' to ' || (payload->>'after') || '.'
    when 'CHARACTER_MOVED' then
      coalesce((select spec->>'name' from jsonb_array_elements(world->'characters') spec
        where spec->>'id' = payload->>'characterId' limit 1), 'A character')
      || ' moved from '
      || coalesce((select place->>'name' from jsonb_array_elements(world->'locations') place
        where place->>'id' = payload->>'beforeLocationId' limit 1), 'one place')
      || ' to '
      || coalesce((select place->>'name' from jsonb_array_elements(world->'locations') place
        where place->>'id' = payload->>'afterLocationId' limit 1), 'another place') || '.'
  end
$$;

alter function simulora.re2_generation_context(uuid) rename to re2_generation_context_pre_tb1;
create function simulora.re2_generation_context(action_id uuid) returns jsonb
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
  if action.created_at < (select started_at from simulora.tb1_outcome_context_epoch) then
    return context;
  end if;
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
          order by event.created_at, event.id)
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
