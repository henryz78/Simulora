-- Bounded NO_WORLD_EFFECT completion.  Dialogue is Action-bound evidence,
-- never a second World truth ledger or a canonical conversation Commit.

alter table simulora.actions
  add column if not exists dialogue_record jsonb;

alter table simulora.actions
  drop constraint if exists actions_status_check;

alter table simulora.actions
  add constraint actions_status_check
  check (status in (
    'ACKNOWLEDGED', 'GENERATING', 'VALIDATING', 'AWAITING_CONFIRMATION',
    'COMMITTING', 'COMMITTED', 'COMPLETED_NO_EFFECT', 'FAILED_RECOVERABLE',
    'CONFLICT', 'CANCELLED', 'SUPERSEDED'
  ));

alter table simulora.actions
  add constraint actions_dialogue_record_object_check
  check (dialogue_record is null or jsonb_typeof(dialogue_record) = 'object');

create or replace function simulora.protect_action_identity() returns trigger
language plpgsql as $$
begin
  if (to_jsonb(new) - array['status', 'status_reason', 'terminal_at', 'row_version', 'updated_at', 'dialogue_record'])
     is distinct from
     (to_jsonb(old) - array['status', 'status_reason', 'terminal_at', 'row_version', 'updated_at', 'dialogue_record']) then
    raise exception 'Action identity, authority and command binding are immutable';
  end if;
  return new;
end;
$$;

create or replace function simulora.validate_action_status_transition() returns trigger
language plpgsql as $$
begin
  if new.status in ('COMMITTED', 'COMPLETED_NO_EFFECT', 'CANCELLED', 'SUPERSEDED')
     and new.terminal_at is null then
    raise exception 'Terminal Action requires terminal_at';
  end if;
  if new.status not in ('COMMITTED', 'COMPLETED_NO_EFFECT', 'CANCELLED', 'SUPERSEDED')
     and new.terminal_at is not null then
    raise exception 'Non-terminal Action cannot carry terminal_at';
  end if;
  if new.status = old.status then
    if new.terminal_at is distinct from old.terminal_at
       or (new.status in ('COMMITTED', 'COMPLETED_NO_EFFECT', 'CANCELLED', 'SUPERSEDED')
           and new.status_reason is distinct from old.status_reason)
       or (new.status = 'COMPLETED_NO_EFFECT'
           and new.dialogue_record is distinct from old.dialogue_record) then
      raise exception 'Terminal Action evidence is immutable';
    end if;
    return new;
  end if;
  if old.status in ('COMMITTED', 'COMPLETED_NO_EFFECT', 'CANCELLED', 'SUPERSEDED') then
    raise exception 'Terminal Action cannot return to processing';
  end if;
  if not (
    (old.status in ('ACKNOWLEDGED', 'GENERATING') and new.status in ('GENERATING', 'VALIDATING', 'CONFLICT', 'CANCELLED')) or
    (old.status = 'GENERATING' and new.status in ('VALIDATING', 'FAILED_RECOVERABLE', 'CONFLICT', 'CANCELLED')) or
    (old.status = 'VALIDATING' and new.status in ('AWAITING_CONFIRMATION', 'COMMITTING', 'COMPLETED_NO_EFFECT', 'FAILED_RECOVERABLE', 'CANCELLED')) or
    (old.status = 'AWAITING_CONFIRMATION' and new.status in ('COMMITTING', 'CONFLICT', 'FAILED_RECOVERABLE', 'CANCELLED')) or
    (old.status = 'COMMITTING' and new.status in ('COMMITTED', 'CONFLICT', 'FAILED_RECOVERABLE', 'CANCELLED')) or
    (old.status = 'FAILED_RECOVERABLE' and new.status in ('GENERATING', 'CANCELLED')) or
    (old.status = 'CONFLICT' and new.status = 'SUPERSEDED')
  ) then
    raise exception 'Invalid Action status transition: % to %', old.status, new.status;
  end if;
  if new.status = 'COMMITTED'
     and not exists (select 1 from simulora.world_commits where action_id = new.id) then
    raise exception 'Committed Action requires exactly one linked Commit';
  end if;
  if new.status = 'COMPLETED_NO_EFFECT' and new.dialogue_record is null then
    raise exception 'No-effect Action requires an immutable dialogue record';
  end if;
  return new;
end;
$$;

create or replace function simulora.validate_action_dialogue_record() returns trigger
language plpgsql as $$
declare
  attempt_row simulora.generation_attempts%rowtype;
  candidate jsonb;
  operation jsonb;
  output_source jsonb;
  source_branch uuid;
  source_state_revision uuid;
  source_state jsonb;
  world_document jsonb;
  user_role_name text;
  source_character_id text;
  source_character_name text;
  expected_character_id text;
  allowed_fact_ids jsonb;
begin
  if new.dialogue_record is null then
    if new.status = 'COMPLETED_NO_EFFECT' then
      raise exception 'Completed no-effect Action requires dialogue evidence';
    end if;
    if tg_op = 'UPDATE' and old.dialogue_record is not null then
      raise exception 'Dialogue evidence is immutable';
    end if;
    return new;
  end if;
  if new.status <> 'COMPLETED_NO_EFFECT'
     or new.operation_type <> 'PARTICIPATE'
     or new.operation_payload->>'requestedEffect' <> 'NO_WORLD_EFFECT' then
    raise exception 'Dialogue evidence is only valid for a completed NO_WORLD_EFFECT Action';
  end if;
  if new.dialogue_record->>'id' is distinct from new.id::text
     or nullif(trim(new.dialogue_record->>'narrative'), '') is null
     or new.dialogue_record->>'sourceHeadCommitId' is distinct from new.expected_head_commit_id::text
     or new.dialogue_record->>'provenance' is distinct from 'Generated Action ' || new.id::text
     or new.dialogue_record->>'visibilityScope' is distinct from 'CONTINUITY_PRIVATE'
     or new.dialogue_record->'responseSource' is null
     or new.dialogue_record->>'recordedAt' is null then
    raise exception 'Malformed or unbound dialogue evidence';
  end if;
  if tg_op = 'UPDATE' and old.dialogue_record is not null
     and new.dialogue_record is distinct from old.dialogue_record then
    raise exception 'Dialogue evidence is immutable';
  end if;
  select commit.branch_id, commit.state_revision_id, state.document, revision.document
    into source_branch, source_state_revision, source_state, world_document
    from simulora.world_commits commit
    join simulora.state_revisions state on state.id = commit.state_revision_id
    join simulora.continuities continuity on continuity.id = new.continuity_id
    join simulora.world_revisions revision on revision.id = continuity.world_revision_id
   where commit.id = new.expected_head_commit_id;
  if source_branch is distinct from new.branch_id
     or source_state_revision is distinct from (new.dialogue_record->>'sourceStateRevisionId')::uuid then
    raise exception 'Dialogue source must bind the Action Branch and State Revision';
  end if;
  select attempt.* into attempt_row
    from simulora.generation_attempts attempt
   where attempt.action_id = new.id and attempt.status = 'SUCCEEDED'
   order by attempt.attempt_number desc limit 1;
  if attempt_row.id is null then
    raise exception 'Completed no-effect Action requires a successful generation attempt';
  end if;
  candidate := attempt_row.output->'candidate';
  operation := candidate->'operation';
  output_source := attempt_row.output->'responseSource';
  if candidate->>'actionId' is distinct from new.id::text
     or candidate->>'expectedHeadCommitId' is distinct from new.expected_head_commit_id::text
     or operation->>'type' is distinct from 'NO_WORLD_EFFECT'
     or attempt_row.output->>'narrative' is distinct from new.dialogue_record->>'narrative'
     or output_source is distinct from new.dialogue_record->'responseSource'
     or candidate->'responseSource' is distinct from output_source
     or nullif(trim(operation->>'reason'), '') is null then
    raise exception 'Dialogue evidence does not match the successful generated output';
  end if;
  if output_source->>'type' = 'CHARACTER' then
    source_character_id := output_source->>'characterId';
    if source_character_id is null
       or not exists (
         select 1 from jsonb_array_elements(source_state->'characters') character
          where character->>'id' = source_character_id
       ) then
      raise exception 'Dialogue Character source is not present in the source State Revision';
    end if;
    if new.operation_payload->>'targetCharacterId' is not null
       and source_character_id is distinct from new.operation_payload->>'targetCharacterId' then
      raise exception 'Dialogue Character source does not match the selected Character';
    end if;
    if to_regprocedure('simulora.re2_generation_context(uuid)') is not null then
      select simulora.re2_generation_context(new.id)->'current'->'character'->>'id'
        into expected_character_id;
      if expected_character_id is not null and source_character_id is distinct from expected_character_id then
        raise exception 'Dialogue Character source does not match the authorized generation context';
      end if;
    end if;
    select character->>'name' into source_character_name
      from jsonb_array_elements(source_state->'characters') character
     where character->>'id' = source_character_id;
  elsif output_source->>'type' <> 'WORLD' then
    raise exception 'Dialogue response source is not bound to World or Character';
  end if;
  user_role_name := world_document->'userRole'->>'name';
  if simulora.generated_narrative_authors_user(new.dialogue_record->>'narrative', user_role_name,
                                                case when output_source->>'type' = 'CHARACTER'
                                                     then source_character_name else null end) then
    raise exception 'Dialogue narrative authors protected user authority';
  end if;
  if simulora.generated_narrative_authors_user(operation->>'reason', user_role_name,
                                                case when output_source->>'type' = 'CHARACTER'
                                                     then source_character_name else null end) then
    raise exception 'Dialogue reason authors protected user authority';
  end if;
  allowed_fact_ids := coalesce(attempt_row.context_manifest->'includedFactIds', '[]'::jsonb);
  if simulora.generated_output_references_excluded_fact(new.dialogue_record->>'narrative', source_state, allowed_fact_ids)
     or simulora.generated_output_references_excluded_fact(operation->>'reason', source_state, allowed_fact_ids) then
    raise exception 'Dialogue output references excluded canonical material';
  end if;
  return new;
end;
$$;

create trigger action_dialogue_integrity
before insert or update of status, dialogue_record on simulora.actions
for each row execute function simulora.validate_action_dialogue_record();

create or replace function simulora.authorized_action_dialogue(action_id uuid)
returns jsonb
language plpgsql stable strict as $$
declare
  current_action simulora.actions%rowtype;
  result jsonb;
begin
  select * into current_action from simulora.actions where id = action_id;
  if current_action.id is null then return '[]'::jsonb; end if;
  with recursive recent as (
    select commit.id, commit.parent_commit_id, commit.branch_id, 0 as distance,
      (commit.kind = 'RESTORE_COMMITTED' or exists (
        select 1 from simulora.domain_events event where event.commit_id = commit.id
          and event.event_type in ('CONTINUITY_ITEM_CORRECTED', 'CONTINUITY_ITEM_REMOVED')
      )) as boundary
      from simulora.world_commits commit
     where commit.id = current_action.expected_head_commit_id
    union all
    select parent.id, parent.parent_commit_id, parent.branch_id, recent.distance + 1,
      (parent.kind = 'RESTORE_COMMITTED' or exists (
        select 1 from simulora.domain_events event where event.commit_id = parent.id
          and event.event_type in ('CONTINUITY_ITEM_CORRECTED', 'CONTINUITY_ITEM_REMOVED')
      ))
      from recent
      join simulora.world_commits parent on parent.id = recent.parent_commit_id
     where not recent.boundary and recent.distance < 9 and parent.branch_id = current_action.branch_id
  )
  select coalesce(jsonb_agg(action.dialogue_record order by recent.distance desc, action.created_at), '[]'::jsonb)
    into result
    from recent
    join simulora.actions action
      on action.expected_head_commit_id = recent.id
     and action.branch_id = current_action.branch_id
     and action.actor_account_id = current_action.actor_account_id
     and action.status = 'COMPLETED_NO_EFFECT'
     and action.dialogue_record is not null
   where not recent.boundary;
  return result;
end;
$$;

-- Keep the application and SQL authority guards on the same narrow exception:
-- bound Character deference is safe only at a clause boundary.  A continued
-- protected action ("I won't choose for you to pay") remains rejected.
create or replace function simulora.generated_narrative_authors_user_exact_latin(
  narrative text,
  user_role_name text
) returns boolean
language plpgsql immutable as $$
declare
  body text := lower(simulora.normalized_generation_text(narrative));
  role_name text := lower(trim(simulora.normalized_generation_text(user_role_name)));
  role_pattern text;
  subjects text := 'you|the user|the player|the participant|user|player|participant';
  sentence text;
  verbs text := 'say|says|said|agree|agrees|agreed|decide|decides|decided|choose|chooses|chose|chosen|commit|commits|committed|promise|promises|promised|consent|consents|consented|accept|accepts|accepted|approve|approves|approved|permit|permits|permitted|grant|grants|granted|waive|waives|waived|authorize|authorizes|authorized|pay|pays|paid|spend|spends|spent|transfer|transfers|transferred|share|shares|shared|publish|publishes|published|delete|deletes|deleted|surrender|surrenders|surrendered|sign|signs|signed|buy|buys|bought|sell|sells|sold|refuse|refuses|refused|decline|declines|declined|reject|rejects|rejected';
  nouns text := 'speech|words|agreement|approval|decision|choice|commitment|promise|consent|acceptance|permission|grant|waiver|authorization|payment|spending|transfer|sharing|publication|deletion|surrender|signature|purchase|sale';
begin
  if role_name <> '' and role_name ~ '^[a-z0-9_ ]+$' then
    role_pattern := replace(regexp_replace(role_name, '[[:space:]]+', ' ', 'g'), ' ', '[[:space:]]+');
    subjects := subjects || '|' || role_pattern || '|' ||
      regexp_replace(role_name, '^.*[[:space:]]+', '');
  end if;
  foreach sentence in array regexp_split_to_array(body, E'[.!?\n]+') loop
    if sentence ~* ('(^|[^A-Za-z0-9_])(?:' || subjects || ')([^A-Za-z0-9_]).*\m(?:' || verbs || ')\M') then
      return true;
    end if;
    if sentence ~* ('\m(?:' || verbs || ')\M.*\mby\M(?:[[:space:]]+the)?[[:space:]]+(?:' || subjects || ')\M') then
      return true;
    end if;
    if sentence ~* ('(?:^|[^A-Za-z0-9_])(?:' || subjects || ')(?:[''’]s)?[[:space:]]+(?:' || nouns || ')\M') then
      return true;
    end if;
  end loop;
  return false;
end;
$$;

create or replace function simulora.generated_narrative_authors_user(
  narrative text,
  user_role_name text,
  response_character_name text
) returns boolean
language plpgsql immutable as $$
declare
  body text := simulora.normalized_generation_text(narrative);
  narrator text := trim(simulora.normalized_generation_text(response_character_name));
  role_name text := trim(simulora.normalized_generation_text(user_role_name));
  normalized_role text := trim(regexp_replace(role_name, '[^[:alnum:]]+', ' ', 'g'));
  role_tokens text[] := regexp_split_to_array(normalized_role, '[[:space:]]+');
  subject text;
  subjects text[];
begin
  if narrator ~ '^[a-z][a-z0-9_]*( [a-z][a-z0-9_]*)*$'
     and not (string_to_array(regexp_replace(narrator, '[^a-z0-9]+', ' ', 'g'), ' ') &&
       (array['you', 'user', 'player', 'participant'] || role_tokens)) then
    body := regexp_replace(
      body,
      '(,[[:space:]''"]*' || narrator || '[[:space:]]+)(says|said)([[:space:]]*,)',
      E'\\1narrates\\3', 'g'
    );
    subjects := array[
      'you', 'the user', 'the player', 'the participant', 'user', 'player', 'participant',
      normalized_role, role_name, role_tokens[array_length(role_tokens, 1)]
    ];
    foreach subject in array subjects loop
      if subject is not null and subject <> '' and subject ~ '^[a-z][a-z0-9_]*( [a-z][a-z0-9_]*)*$' then
        body := regexp_replace(
          body,
          '(\m' || subject || '\M[[:space:]]+can[[:space:]]+)decide(?=[[:space:]]*([;.!?''"\n]|$))',
          E'\\1deliberate', 'g'
        );
      end if;
    end loop;
    body := regexp_replace(
      body,
      '\m(?:i|we)[[:space:]]+(?:won''t|will not|can''t|cannot|shouldn''t|should not|mustn''t|must not)[[:space:]]+(?:choose|decide)[[:space:]]+for[[:space:]]+(?:you|the user|the player|the participant|user|player|participant|'
        || coalesce(normalized_role, '(?!)') || ')[[:>:]](?=[[:space:]]*([;.!?''"\n]|$))',
      'I defer to your judgment', 'gi'
    );
    if normalized_role <> '' then
      body := regexp_replace(
        body,
        '\muntil[[:space:]]+(?:the[[:space:]]+)?' || normalized_role || '\M[[:space:]]+decides?(?=[[:space:]]*([;.!?''"\n]|$))',
        'until ' || normalized_role || ' deliberates', 'gi'
      );
    end if;
    body := regexp_replace(
      body,
      '由(?:你|' || coalesce(normalized_role, '(?!)') || ')决定(?=[；。！？\n]|$)',
      '由你斟酌', 'g'
    );
  end if;
  if simulora.generated_narrative_authors_user_exact_latin(body, user_role_name) then
    return true;
  end if;
  if body ~ '[^A-Za-z0-9[:punct:][:space:]]'
     and simulora.generated_narrative_authors_user(body, user_role_name) then
    return true;
  end if;
  return false;
end;
$$;
