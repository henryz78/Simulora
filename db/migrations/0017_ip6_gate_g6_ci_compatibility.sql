-- Gate G6 CI compatibility: watch terminal evidence columns directly, retain
-- the established recoverable-wait fixture seam, and preserve diagnostic order.

create or replace function simulora.protect_action_identity() returns trigger
language plpgsql as $$
begin
  if (to_jsonb(new) - array['status', 'status_reason', 'terminal_at', 'row_version',
                            'acknowledged_at', 'updated_at'])
     is distinct from
     (to_jsonb(old) - array['status', 'status_reason', 'terminal_at', 'row_version',
                            'acknowledged_at', 'updated_at']) then
    raise exception 'Action identity, authority and command binding are immutable';
  end if;
  return new;
end;
$$;

drop trigger action_status_transition on simulora.actions;
create trigger action_status_transition
before update of status, status_reason, terminal_at on simulora.actions
for each row execute function simulora.validate_action_status_transition();

drop trigger action_commit_history_materialization_integrity on simulora.world_commits;
create constraint trigger zz_action_commit_history_materialization_integrity
after insert on simulora.world_commits
deferrable initially deferred
for each row execute function simulora.validate_action_history_materialization();

create or replace function simulora.generated_narrative_authors_user(
  narrative text,
  user_role_name text
) returns boolean
language plpgsql immutable as $$
declare
  body text := lower(narrative);
  role_name text := lower(nullif(trim(user_role_name), ''));
  role_alias text;
  verb text;
  prefix text;
  verbs text[] := array[
    'say', 'says', 'said', 'agree', 'agrees', 'agreed', 'promise', 'promises', 'promised',
    'consent', 'consents', 'consented', 'accept', 'accepts', 'accepted',
    'authorize', 'authorizes', 'authorized', 'pay', 'pays', 'paid', 'spend', 'spends', 'spent',
    'transfer', 'transfers', 'transferred', 'share', 'shares', 'shared',
    'publish', 'publishes', 'published', 'delete', 'deletes', 'deleted',
    'surrender', 'surrenders', 'surrendered', 'sign', 'signs', 'signed',
    'buy', 'buys', 'bought', 'sell', 'sells', 'sold'
  ];
begin
  if body ~ '\m(you|the user|the player|the participant)\M[[:space:]]+(has[[:space:]]+|have[[:space:]]+|had[[:space:]]+|will[[:space:]]+|did[[:space:]]+|does[[:space:]]+|is[[:space:]]+|was[[:space:]]+)?(say|says|said|agree|agrees|agreed|promise|promises|promised|consent|consents|consented|accept|accepts|accepted|authorize|authorizes|authorized|pay|pays|paid|spend|spends|spent|transfer|transfers|transferred|share|shares|shared|publish|publishes|published|delete|deletes|deleted|surrender|surrenders|surrendered|sign|signs|signed|buy|buys|bought|sell|sells|sold)\M' then
    return true;
  end if;
  if role_name is null then return false; end if;
  role_alias := regexp_replace(role_name, '^.*[[:space:]]+', '');
  foreach verb in array verbs loop
    foreach prefix in array array[' ', ' has ', ' have ', ' had ', ' will ', ' did ', ' does ', ' is ', ' was '] loop
      if position(role_name || prefix || verb in body) > 0
         or (length(role_alias) >= 3 and position(role_alias || prefix || verb in body) > 0) then
        return true;
      end if;
    end loop;
  end loop;
  return false;
end;
$$;

create or replace function simulora.validate_action_initial_status() returns trigger
language plpgsql as $$
begin
  if new.status is distinct from 'ACKNOWLEDGED'
     or new.terminal_at is not null
     or new.status_reason is not null then
    raise exception 'New Action must begin as ACKNOWLEDGED; non-terminal ACKNOWLEDGED cannot carry terminal evidence';
  end if;
  return new;
end;
$$;

alter function simulora.action_proposal_effect_is_valid(simulora.action_proposals)
  rename to action_proposal_effect_shape_is_valid;

create function simulora.action_generation_evidence_is_valid(
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
    order by position
    limit 1;
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
    where jsonb_exists(spec.character->'knowledgeFactIds', target_fact->>'id')
       or jsonb_exists(runtime_row.runtime_character->'knownFactIds', target_fact->>'id')
    order by spec.position
    limit 1;

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
    then '[]'::jsonb
    else jsonb_build_array(selected_character->>'id')
  end;
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
    and not simulora.generated_narrative_authors_user(
      proposal.candidate_transition->>'narrative', user_role_name
    )
    and not simulora.generated_narrative_authors_user(
      operation->>'afterStatement', user_role_name
    )
    and not simulora.generated_narrative_authors_user(
      operation->>'provenance', user_role_name
    );
end;
$$;

create function simulora.action_proposal_effect_is_valid(
  proposal simulora.action_proposals
) returns boolean
language sql stable strict as $$
  select simulora.action_proposal_effect_shape_is_valid(proposal)
     and simulora.action_generation_evidence_is_valid(proposal);
$$;
