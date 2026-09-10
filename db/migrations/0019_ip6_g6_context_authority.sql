-- Gate G6 context authority: generated output may only use the compiled fact
-- scope, and its provenance is a server-owned Action reference.

create or replace function simulora.generated_narrative_authors_user(
  narrative text,
  user_role_name text
) returns boolean
language plpgsql immutable as $$
declare
  body text := lower(coalesce(narrative, ''));
  role_name text := lower(nullif(trim(user_role_name), ''));
  role_alias text;
  sentence text;
  normalized_sentence text;
  subject text;
  normalized_subject text;
  tail text;
  verb text;
  noun text;
  subject_position integer;
  verb_position integer;
  by_position integer;
  subjects text[] := array['you', 'the user', 'the player', 'the participant'];
  verbs text[] := array[
    'say', 'says', 'said', 'agree', 'agrees', 'agreed',
    'decide', 'decides', 'decided', 'choose', 'chooses', 'chose', 'chosen',
    'commit', 'commits', 'committed', 'promise', 'promises', 'promised',
    'consent', 'consents', 'consented', 'accept', 'accepts', 'accepted',
    'approve', 'approves', 'approved', 'permit', 'permits', 'permitted',
    'grant', 'grants', 'granted', 'waive', 'waives', 'waived',
    'authorize', 'authorizes', 'authorized', 'pay', 'pays', 'paid',
    'spend', 'spends', 'spent', 'transfer', 'transfers', 'transferred',
    'share', 'shares', 'shared', 'publish', 'publishes', 'published',
    'delete', 'deletes', 'deleted', 'surrender', 'surrenders', 'surrendered',
    'sign', 'signs', 'signed', 'buy', 'buys', 'bought', 'sell', 'sells', 'sold'
  ];
  nouns text[] := array[
    'speech', 'words', 'agreement', 'approval', 'decision', 'choice',
    'commitment', 'promise', 'consent', 'acceptance', 'permission', 'grant',
    'waiver', 'authorization', 'payment', 'spending', 'transfer', 'sharing',
    'publication', 'deletion', 'surrender', 'signature', 'purchase', 'sale'
  ];
begin
  if role_name is not null then
    role_name := trim(regexp_replace(role_name, '[^[:alnum:]_]+', ' ', 'g'));
    role_alias := regexp_replace(role_name, '^.*[[:space:]]+', '');
    subjects := array_append(subjects, role_name);
    if length(role_alias) >= 3 and role_alias <> role_name then
      subjects := array_append(subjects, role_alias);
    end if;
  end if;

  foreach sentence in array regexp_split_to_array(body, E'[.!?\\n]+') loop
    normalized_sentence := ' ' || trim(
      regexp_replace(sentence, '[^[:alnum:]_]+', ' ', 'g')
    ) || ' ';
    foreach subject in array subjects loop
      normalized_subject := trim(regexp_replace(subject, '[^[:alnum:]_]+', ' ', 'g'));
      subject_position := position(' ' || normalized_subject || ' ' in normalized_sentence);
      if subject_position = 0 then
        continue;
      end if;

      tail := substring(
        normalized_sentence from subject_position + length(normalized_subject) + 2
      );
      foreach verb in array verbs loop
        if position(' ' || verb || ' ' in ' ' || tail) > 0 then
          return true;
        end if;
      end loop;

      by_position := position(' by ' || normalized_subject || ' ' in normalized_sentence);
      if by_position > 0 then
        foreach verb in array verbs loop
          verb_position := position(' ' || verb || ' ' in normalized_sentence);
          if verb_position > 0 and verb_position < by_position then
            return true;
          end if;
        end loop;
      end if;

      if position(' ' || normalized_subject || ' s ' in normalized_sentence) > 0 then
        foreach noun in array nouns loop
          if position(' s ' || noun || ' ' in normalized_sentence) > 0 then
            return true;
          end if;
        end loop;
      end if;
    end loop;
  end loop;
  return false;
end;
$$;

create or replace function simulora.generated_output_references_excluded_fact(
  output_text text,
  parent_document jsonb,
  included_fact_ids jsonb
) returns boolean
language plpgsql stable as $$
declare
  fact jsonb;
  normalized_output text := trim(regexp_replace(
    lower(coalesce(output_text, '')), '[^a-z0-9]+', ' ', 'g'
  ));
  normalized_fact text;
begin
  if normalized_output = '' then return false; end if;
  for fact in
    select value from jsonb_array_elements(coalesce(parent_document->'facts', '[]'::jsonb)) as item(value)
  loop
    if fact->>'lifecycle' <> 'ACTIVE'
       or exists (
         select 1
         from jsonb_array_elements_text(coalesce(included_fact_ids, '[]'::jsonb)) as allowed(id)
         where allowed.id = fact->>'id'
       ) then
      continue;
    end if;
    normalized_fact := trim(regexp_replace(
      lower(coalesce(fact->>'statement', '')), '[^a-z0-9]+', ' ', 'g'
    ));
    if length(normalized_fact) >= 8
       and position(' ' || normalized_fact || ' ' in ' ' || normalized_output || ' ') > 0 then
      return true;
    end if;
  end loop;
  return false;
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
    where jsonb_exists(spec.character->'knowledgeFactIds', target_fact->>'id')
       or jsonb_exists(runtime_row.runtime_character->'knownFactIds', target_fact->>'id')
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
