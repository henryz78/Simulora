-- RE-3 bounded routine effects: preserve the existing validator for L3 fact
-- rewrites and add a narrow, route-bound L2 Character movement envelope.
alter table simulora.action_proposals
  drop constraint if exists action_proposals_impact_level_check;
alter table simulora.action_proposals
  add constraint action_proposals_impact_level_check
  check (impact_level in ('L0', 'L2', 'L3'));

alter function simulora.action_proposal_effect_is_valid(simulora.action_proposals)
  rename to action_proposal_effect_is_valid_legacy;

create function simulora.action_proposal_effect_is_valid(
  proposal simulora.action_proposals
) returns boolean
language plpgsql stable strict as $$
declare
  action_row simulora.actions%rowtype;
  parent_document jsonb;
  world_document jsonb;
  operation jsonb;
  character_row jsonb;
  route_exists boolean;
begin
  if proposal.impact_level <> 'L2' then
    return simulora.action_proposal_effect_is_valid_legacy(proposal);
  end if;
  select * into action_row from simulora.actions where id = proposal.action_id;
  select state.document into parent_document
    from simulora.world_commits commit
    join simulora.state_revisions state on state.id = commit.state_revision_id
    where commit.id = proposal.expected_head_commit_id;
  select revision.document into world_document
    from simulora.actions action
    join simulora.continuities continuity on continuity.id = action.continuity_id
    join simulora.world_revisions revision on revision.id = continuity.world_revision_id
    where action.id = proposal.action_id;
  operation := proposal.candidate_transition->'operation';
  select character into character_row
    from jsonb_array_elements(parent_document->'characters') characters(character)
    where character->>'id' = operation->>'characterId';
  select exists (
    select 1 from jsonb_array_elements(coalesce(world_document->'routineRoutes', '[]'::jsonb)) route
    where route->>'fromLocationId' = operation->>'beforeLocationId'
      and route->>'toLocationId' = operation->>'afterLocationId'
  ) into route_exists;
  return action_row.id is not null
    and parent_document is not null
    and action_row.operation_type = 'PARTICIPATE'
    and proposal.expected_head_commit_id = action_row.expected_head_commit_id
    and proposal.schema_version = 1
    and proposal.expires_at > proposal.created_at
    and proposal.candidate_transition->>'schemaVersion' = '1'
    and proposal.candidate_transition->>'actionId' = action_row.id::text
    and proposal.candidate_transition->>'expectedHeadCommitId' = action_row.expected_head_commit_id::text
    and nullif(trim(proposal.candidate_transition->>'narrative'), '') is not null
    and operation->>'type' = 'MOVE_CHARACTER'
    and proposal.candidate_transition->'responseSource'->>'type' = 'CHARACTER'
    and proposal.candidate_transition->'responseSource'->>'characterId' = operation->>'characterId'
    and character_row is not null
    and character_row->>'locationId' = operation->>'beforeLocationId'
    and operation->>'beforeLocationId' <> operation->>'afterLocationId'
    and exists (select 1 from jsonb_array_elements(parent_document->'locations') location where location->>'id' = operation->>'afterLocationId')
    and route_exists
    and jsonb_array_length(operation->'causalFactIds') > 0
    and not exists (
      select 1 from jsonb_array_elements(operation->'causalFactIds') fact_id
      where not exists (
        select 1 from jsonb_array_elements(parent_document->'facts') fact
        where fact->>'id' = fact_id #>> '{}'
          and fact->>'lifecycle' = 'ACTIVE'
          and fact->>'scope' <> 'ACCOUNT_PRIVATE'
      )
    );
end;
$$;
