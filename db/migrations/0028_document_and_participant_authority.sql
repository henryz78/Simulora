-- Keep the authoritative PostgreSQL boundary aligned with the frozen domain
-- schemas. Application validation is defence in depth, not database authority.

create function simulora.valid_stable_id(value jsonb) returns boolean
language sql immutable as $$
  select coalesce(jsonb_typeof(value), '') = 'string'
     and length(value #>> '{}') between 1 and 120
     and (value #>> '{}') ~ '^[a-z0-9][a-z0-9._-]*$'
$$;

create function simulora.valid_text(value jsonb, maximum_length integer) returns boolean
language sql immutable as $$
  select coalesce(jsonb_typeof(value), '') = 'string'
     and length(btrim(value #>> '{}',
       U&'\0009\000A\000B\000C\000D\0020\00A0\1680\2000\2001\2002\2003\2004\2005\2006\2007\2008\2009\200A\2028\2029\202F\205F\3000\FEFF'
     )) between 1 and maximum_length
$$;

-- Capture every Character spec in the same transaction as its Revision.
-- The existing snapshot trigger validates source Asset ownership, lifecycle
-- and exact content, so direct SQL cannot bypass the application check.
create function simulora.capture_world_revision_characters() returns trigger
language plpgsql as $$
begin
  perform id from simulora.character_assets
   where id in (
     select (character->>'sourceAssetId')::uuid
       from jsonb_array_elements(new.document->'characters') character
      where character ? 'sourceAssetId'
   ) order by id for share;
  insert into simulora.world_revision_characters
    (world_revision_id, character_spec_id, source_asset_id, spec)
  select new.id, character->>'id', (character->>'sourceAssetId')::uuid, character
    from jsonb_array_elements(new.document->'characters') character;
  return new;
end;
$$;
create trigger world_revision_character_capture
after insert on simulora.world_revisions
for each row execute function simulora.capture_world_revision_characters();

create function simulora.valid_text_array(
  value jsonb,
  minimum_length integer default 0
) returns boolean
language sql immutable as $$
  select case when coalesce(jsonb_typeof(value), '') <> 'array' then false else
    jsonb_array_length(value) >= minimum_length
    and not exists (
      select 1 from jsonb_array_elements(value) item
       where not simulora.valid_text(item, 4000)
    ) end
$$;

create function simulora.valid_stable_id_array(value jsonb) returns boolean
language sql immutable as $$
  select case when coalesce(jsonb_typeof(value), '') <> 'array' then false else
    not exists (
      select 1 from jsonb_array_elements(value) item
       where not simulora.valid_stable_id(item)
    ) end
$$;

create function simulora.valid_object_keys(value jsonb, allowed_keys text[]) returns boolean
language sql immutable as $$
  select case when coalesce(jsonb_typeof(value), '') <> 'object' then false else
    not exists (
      select 1 from jsonb_object_keys(value) key
       where not (key = any(allowed_keys))
    ) end
$$;

alter table simulora.character_assets
  add constraint character_assets_definition_document_shape
  check (
    coalesce(jsonb_typeof(document), '') = 'object'
    and simulora.valid_object_keys(document, array[
      'schemaVersion', 'name', 'role', 'motives', 'stance', 'knowledgeFactIds'
    ])
    and coalesce(document->'schemaVersion', 'null'::jsonb) = '1'::jsonb
    and simulora.valid_text(document->'name', 120)
    and simulora.valid_text(document->'role', 4000)
    and simulora.valid_text_array(document->'motives', 1)
    and simulora.valid_text(document->'stance', 4000)
    and simulora.valid_stable_id_array(document->'knowledgeFactIds')
  ) not valid;

-- Serialize Action creation against path selection/head advances. The ordinary
-- application commands take this same lock before checking or inserting rows.
create function simulora.lock_action_current_context() returns trigger
language plpgsql as $$
begin
  perform id from simulora.continuities where id = new.continuity_id for update;
  perform id from simulora.branches
   where id = new.branch_id and continuity_id = new.continuity_id for share;
  return new;
end;
$$;
create trigger action_context_lock
before insert on simulora.actions
for each row execute function simulora.lock_action_current_context();

create or replace function simulora.prevent_pending_active_branch_switch() returns trigger
language plpgsql as $$
begin
  if new.active_branch_id is distinct from old.active_branch_id
     and old.active_branch_id is not null
     and exists (
       select 1 from simulora.actions
        where branch_id = old.active_branch_id
          and status not in ('COMMITTED', 'CANCELLED', 'SUPERSEDED')
     ) then
    raise exception 'Cannot switch Branch while an unresolved Action remains on the current path';
  end if;
  return new;
end;
$$;

-- Locale-independent lowercase for the accepted Latin/Han generation profile.
create function simulora.normalized_generation_text(value text) returns text
language sql immutable as $$
  select translate(
    replace(replace(normalize(coalesce(value, ''), NFKC), chr(304), 'i' || chr(775)), 'ẞ', 'ß'),
    'ABCDEFGHIJKLMNOPQRSTUVWXYZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞĀĂĄĆĈĊČĎĐĒĔĖĘĚĜĞĠĢĤĦĨĪĬĮĲĴĶĹĻĽĿŁŃŅŇŊŌŎŐŒŔŖŘŚŜŞŠŢŤŦŨŪŬŮŰŲŴŶŸŹŻŽ',
    'abcdefghijklmnopqrstuvwxyzàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþāăąćĉċčďđēĕėęěĝğġģĥħĩīĭįĳĵķĺļľŀłńņňŋōŏőœŕŗřśŝşšţťŧũūŭůűųŵŷÿźżž'
  )
$$;

create function simulora.normalized_disclosure_text(value text) returns text
language sql immutable as $$
  select trim(regexp_replace(coalesce(string_agg(
    case when codepoint between 48 and 57 or codepoint between 97 and 122
           or codepoint between 192 and 214 or codepoint between 216 and 246
           or codepoint between 248 and 383
           or codepoint between 13312 and 19903 or codepoint between 19968 and 40959
           or character ~ '[[:alnum:]]'
         then character else ' ' end, '' order by position
  ), ''), ' +', ' ', 'g'))
  from (
    select character, position, ascii(character) as codepoint
      from regexp_split_to_table(simulora.normalized_generation_text(value), '')
        with ordinality item(character, position)
  ) characters
$$;

create or replace function simulora.generated_output_references_excluded_fact(
  output_text text, parent_document jsonb, included_fact_ids jsonb
) returns boolean
language plpgsql stable as $$
declare
  fact jsonb;
  exact_output text := simulora.normalized_generation_text(output_text);
  normalized_output text := simulora.normalized_disclosure_text(output_text);
  exact_fact text;
  normalized_fact text;
begin
  if exact_output = '' then return false; end if;
  for fact in select value from jsonb_array_elements(coalesce(parent_document->'facts', '[]'::jsonb)) item(value)
  loop
    if included_fact_ids ? (fact->>'id') then continue; end if;
    exact_fact := simulora.normalized_generation_text(fact->>'statement');
    normalized_fact := simulora.normalized_disclosure_text(fact->>'statement');
    if exact_fact <> '' and (
      position(exact_fact in exact_output) > 0
      or (normalized_fact <> '' and position(normalized_fact in normalized_output) > 0)
    ) then return true; end if;
  end loop;
  return false;
end;
$$;

create or replace function simulora.valid_world_revision_document(candidate jsonb) returns boolean
language plpgsql immutable strict as $$
declare
  item jsonb;
  id text;
  location_ids text[] := array[]::text[];
  character_ids text[] := array[]::text[];
  fact_ids text[] := array[]::text[];
  all_ids text[] := array[]::text[];
begin
  if coalesce(jsonb_typeof(candidate), '') <> 'object'
     or not simulora.valid_object_keys(candidate, array[
       'schemaVersion', 'title', 'premise', 'startingSituation', 'userRole',
       'locations', 'characters', 'facts', 'relationships', 'interactionPaths',
       'interactionBoundaries', 'objectives'
     ])
     or candidate->'schemaVersion' is distinct from '1'::jsonb
     or not simulora.valid_text(candidate->'title', 120)
     or not simulora.valid_text(candidate->'premise', 4000)
     or not simulora.valid_text(candidate->'startingSituation', 4000)
     or coalesce(jsonb_typeof(candidate->'userRole'), '') <> 'object'
     or not simulora.valid_object_keys(candidate->'userRole', array['name', 'authorityBoundary'])
     or not simulora.valid_text(candidate->'userRole'->'name', 120)
     or not simulora.valid_text(candidate->'userRole'->'authorityBoundary', 4000)
     or coalesce(jsonb_typeof(candidate->'locations'), '') <> 'array'
     or jsonb_array_length(candidate->'locations') < 1
     or coalesce(jsonb_typeof(candidate->'characters'), '') <> 'array'
     or jsonb_array_length(candidate->'characters') < 1
     or coalesce(jsonb_typeof(candidate->'facts'), '') <> 'array'
     or jsonb_array_length(candidate->'facts') < 1
     or coalesce(jsonb_typeof(candidate->'relationships'), '') <> 'array'
     or not simulora.valid_text_array(candidate->'interactionPaths', 1)
     or not simulora.valid_text_array(candidate->'interactionBoundaries', 1)
     or not simulora.valid_text_array(candidate->'objectives', 0) then
    return false;
  end if;

  for item in select value from jsonb_array_elements(candidate->'locations') loop
    id := item->>'id';
    if coalesce(jsonb_typeof(item), '') <> 'object'
       or not simulora.valid_object_keys(item, array['id', 'name', 'description'])
       or not simulora.valid_stable_id(item->'id')
       or not simulora.valid_text(item->'name', 120)
       or not simulora.valid_text(item->'description', 4000)
       or id = any(all_ids) then return false; end if;
    location_ids := array_append(location_ids, id);
    all_ids := array_append(all_ids, id);
  end loop;

  for item in select value from jsonb_array_elements(candidate->'facts') loop
    id := item->>'id';
    if coalesce(jsonb_typeof(item), '') <> 'object'
       or not simulora.valid_object_keys(
         item, array['id', 'statement', 'scope', 'provenance', 'lifecycle']
       )
       or not simulora.valid_stable_id(item->'id')
       or not simulora.valid_text(item->'statement', 4000)
       or coalesce(item->>'scope', '') not in ('ACCOUNT_PRIVATE', 'CONTINUITY_PRIVATE', 'SHARED')
       or not simulora.valid_text(item->'provenance', 4000)
       or coalesce(item->>'lifecycle', '') <> 'ACTIVE'
       or id = any(all_ids) then return false; end if;
    fact_ids := array_append(fact_ids, id);
    all_ids := array_append(all_ids, id);
  end loop;

  for item in select value from jsonb_array_elements(candidate->'characters') loop
    id := item->>'id';
    if coalesce(jsonb_typeof(item), '') <> 'object'
       or not simulora.valid_object_keys(item, array[
         'id', 'name', 'role', 'motives', 'stance', 'knowledgeFactIds',
         'locationId', 'sourceAssetId'
       ])
       or not simulora.valid_stable_id(item->'id')
       or not simulora.valid_text(item->'name', 120)
       or not simulora.valid_text(item->'role', 4000)
       or not simulora.valid_text_array(item->'motives', 1)
       or not simulora.valid_text(item->'stance', 4000)
       or not simulora.valid_stable_id_array(item->'knowledgeFactIds')
       or not simulora.valid_stable_id(item->'locationId')
       or not ((item->>'locationId') = any(location_ids))
       or (item ? 'sourceAssetId' and (
         coalesce(jsonb_typeof(item->'sourceAssetId'), '') <> 'string'
         or (item->>'sourceAssetId') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
       ))
       or id = any(all_ids) then return false; end if;
    if exists (
      select 1 from jsonb_array_elements_text(item->'knowledgeFactIds') fact_id
       where not (fact_id = any(fact_ids))
    ) then return false; end if;
    character_ids := array_append(character_ids, id);
    all_ids := array_append(all_ids, id);
  end loop;

  for item in select value from jsonb_array_elements(candidate->'relationships') loop
    id := item->>'id';
    if coalesce(jsonb_typeof(item), '') <> 'object'
       or not simulora.valid_object_keys(
         item, array['id', 'fromCharacterId', 'toCharacterId', 'description']
       )
       or not simulora.valid_stable_id(item->'id')
       or not simulora.valid_stable_id(item->'fromCharacterId')
       or not ((item->>'fromCharacterId') = any(character_ids))
       or not simulora.valid_stable_id(item->'toCharacterId')
       or not ((item->>'toCharacterId') = any(character_ids))
       or not simulora.valid_text(item->'description', 4000)
       or id = any(all_ids) then return false; end if;
    all_ids := array_append(all_ids, id);
  end loop;
  return true;
end;
$$;

create or replace function simulora.valid_state_revision_document(candidate jsonb) returns boolean
language plpgsql immutable strict as $$
declare
  item jsonb;
  entry record;
  id text;
  fact_ids text[] := array[]::text[];
  character_ids text[] := array[]::text[];
  turn_value numeric;
begin
  if coalesce(jsonb_typeof(candidate), '') <> 'object'
     or not simulora.valid_object_keys(candidate, array[
       'schemaVersion', 'participation', 'worldClock', 'locations', 'entities',
       'characters', 'facts', 'relationships', 'openThreads', 'objectives',
       'resources', 'interactionBoundaries', 'customState'
     ])
     or candidate->'schemaVersion' is distinct from '1'::jsonb
     or coalesce(jsonb_typeof(candidate->'participation'), '') <> 'object'
     or not simulora.valid_object_keys(
       candidate->'participation', array['initiativeMode', 'structureMode']
     )
     or coalesce(candidate->'participation'->>'initiativeMode', '') not in ('DIRECT', 'GUIDED', 'WORLD_ACTIVE')
     or coalesce(candidate->'participation'->>'structureMode', '') not in ('OPEN_ENDED', 'GOAL_FRAMED')
     or coalesce(jsonb_typeof(candidate->'worldClock'), '') <> 'object'
     or not simulora.valid_object_keys(candidate->'worldClock', array['turn', 'label'])
     or coalesce(jsonb_typeof(candidate->'worldClock'->'turn'), '') <> 'number'
     or not simulora.valid_text(candidate->'worldClock'->'label', 4000)
     or coalesce(jsonb_typeof(candidate->'locations'), '') <> 'array'
     or coalesce(jsonb_typeof(candidate->'entities'), '') <> 'array'
     or coalesce(jsonb_typeof(candidate->'characters'), '') <> 'array'
     or coalesce(jsonb_typeof(candidate->'facts'), '') <> 'array'
     or coalesce(jsonb_typeof(candidate->'relationships'), '') <> 'array'
     or not simulora.valid_text_array(candidate->'openThreads', 0)
     or not simulora.valid_text_array(candidate->'objectives', 0)
     or coalesce(jsonb_typeof(candidate->'resources'), '') <> 'object'
     or not simulora.valid_text_array(candidate->'interactionBoundaries', 1)
     or coalesce(jsonb_typeof(candidate->'customState'), '') <> 'object' then
    return false;
  end if;

  turn_value := (candidate->'worldClock'->>'turn')::numeric;
  if turn_value < 0
     or turn_value > 9007199254740991::numeric
     or turn_value <> trunc(turn_value) then return false; end if;

  if exists (
    select 1 from jsonb_array_elements(candidate->'entities') entity
     where coalesce(jsonb_typeof(entity), '') <> 'object'
  ) then return false; end if;

  for item in select value from jsonb_array_elements(candidate->'locations') loop
    if coalesce(jsonb_typeof(item), '') <> 'object'
       or not simulora.valid_object_keys(item, array['id', 'name', 'description'])
       or not simulora.valid_stable_id(item->'id')
       or not simulora.valid_text(item->'name', 4000)
       or not simulora.valid_text(item->'description', 4000) then return false; end if;
  end loop;

  for item in select value from jsonb_array_elements(candidate->'facts') loop
    id := item->>'id';
    if coalesce(jsonb_typeof(item), '') <> 'object'
       or not simulora.valid_object_keys(item, array[
         'id', 'statement', 'scope', 'provenance', 'lifecycle',
         'supersededBy', 'supersedes', 'removalReason'
       ])
       or not simulora.valid_stable_id(item->'id')
       or not simulora.valid_text(item->'statement', 4000)
       or coalesce(item->>'scope', '') not in ('ACCOUNT_PRIVATE', 'CONTINUITY_PRIVATE', 'SHARED')
       or not simulora.valid_text(item->'provenance', 4000)
       or coalesce(item->>'lifecycle', '') not in ('ACTIVE', 'SUPERSEDED', 'REMOVED')
       or (item ? 'supersededBy' and not simulora.valid_stable_id(item->'supersededBy'))
       or (item ? 'supersedes' and not simulora.valid_stable_id(item->'supersedes'))
       or (item ? 'removalReason' and not simulora.valid_text(item->'removalReason', 4000))
       or id = any(fact_ids) then return false; end if;
    fact_ids := array_append(fact_ids, id);
  end loop;

  for item in select value from jsonb_array_elements(candidate->'characters') loop
    id := item->>'id';
    if coalesce(jsonb_typeof(item), '') <> 'object'
       or not simulora.valid_object_keys(item, array[
         'id', 'name', 'role', 'locationId', 'currentState', 'knownFactIds'
       ])
       or not simulora.valid_stable_id(item->'id')
       or not simulora.valid_text(item->'name', 4000)
       or not simulora.valid_text(item->'role', 4000)
       or not simulora.valid_stable_id(item->'locationId')
       or not simulora.valid_text(item->'currentState', 4000)
       or not simulora.valid_stable_id_array(item->'knownFactIds')
       or id = any(character_ids) then return false; end if;
    if exists (
      select 1 from jsonb_array_elements_text(item->'knownFactIds') fact_id
       where not (fact_id = any(fact_ids))
    ) then return false; end if;
    character_ids := array_append(character_ids, id);
  end loop;

  for item in select value from jsonb_array_elements(candidate->'relationships') loop
    if coalesce(jsonb_typeof(item), '') <> 'object'
       or not simulora.valid_object_keys(
         item, array['id', 'fromCharacterId', 'toCharacterId', 'description']
       )
       or not simulora.valid_stable_id(item->'id')
       or not simulora.valid_stable_id(item->'fromCharacterId')
       or not simulora.valid_stable_id(item->'toCharacterId')
       or not simulora.valid_text(item->'description', 4000) then return false; end if;
  end loop;

  for entry in select key, value from jsonb_each(candidate->'resources') loop
    if coalesce(jsonb_typeof(entry.value), '') <> 'number'
       or abs((entry.value #>> '{}')::numeric) > 1.7976931348623157e308::numeric then
      return false;
    end if;
  end loop;
  return true;
end;
$$;

create or replace function simulora.validate_continuity_world_access() returns trigger
language plpgsql as $$
declare
  revision_world uuid;
  world_owner uuid;
begin
  select revision.world_id, world.owner_account_id
    into revision_world, world_owner
    from simulora.world_revisions revision
    join simulora.worlds world on world.id = revision.world_id
    where revision.id = new.world_revision_id;
  if revision_world is null then
    raise exception 'Continuity must reference an existing World Revision';
  end if;
  if new.owner_account_id is distinct from world_owner
     and not exists (
       select 1 from simulora.world_access_grants grant_row
       where grant_row.world_id = revision_world
         and grant_row.account_id = new.owner_account_id
         and grant_row.role = 'PARTICIPANT'
         and grant_row.status = 'ACTIVE'
     ) then
    raise exception 'Continuity owner requires active participant access to the World';
  end if;
  return new;
end;
$$;

-- PostgreSQL character classes depend on the host locale. Use Unicode code
-- points for the supported-script boundary so Linux and Windows enforce the
-- same fail-closed result.
create function simulora.contains_unsupported_authority_script(value text) returns boolean
language sql immutable as $$
  select exists (
    select 1
      from generate_series(1, char_length(coalesce(value, ''))) position
     where ascii(substr(value, position, 1)) not between 0 and 383
       and ascii(substr(value, position, 1)) not between 768 and 879
       and ascii(substr(value, position, 1)) not between 8192 and 8303
       and ascii(substr(value, position, 1)) not between 12288 and 12351
       and ascii(substr(value, position, 1)) not between 13312 and 19903
       and ascii(substr(value, position, 1)) not between 19968 and 40959
       and ascii(substr(value, position, 1)) not between 65280 and 65519
  )
$$;

alter function simulora.generated_narrative_authors_user_base(text, text)
  rename to generated_narrative_authors_user_locale_legacy;

create function simulora.generated_narrative_authors_user_base(
  narrative text,
  user_role_name text
) returns boolean
language plpgsql immutable as $$
declare
  body text := simulora.normalized_generation_text(narrative);
  role_name text := nullif(trim(simulora.normalized_generation_text(user_role_name)), '');
  latin_body text;
  latin_role text;
  compact_body text;
  compact_subject text;
  subject text;
  tail text;
  before_subject text;
  verb text;
  noun text;
  subject_position integer;
  subjects text[] := array['你', '用户', '玩家', '参与者'];
  verbs text[] := array[
    '说', '同意', '答应', '决定', '选择', '承诺', '接受', '批准', '允许',
    '授权', '支付', '花费', '转移', '分享', '发布', '删除', '放弃', '签署',
    '购买', '出售', '拒绝', 'say', 'agree', 'decide', 'choose', 'commit',
    'promise', 'consent', 'accept', 'approve', 'permit', 'grant', 'waive',
    'authorize', 'pay', 'spend', 'transfer', 'share', 'publish', 'delete',
    'surrender', 'sign', 'buy', 'sell', 'refuse', 'decline', 'reject',
    'said', 'chose', 'chosen', 'paid', 'spent', 'bought', 'sold'
  ];
  nouns text[] := array[
    '发言', '话语', '同意', '决定', '选择', '承诺', '许可', '授权',
    '付款', '转移', '分享', '发布', '删除', '签名', '购买', '出售'
  ];
begin
  if body = '' then return false; end if;
  if simulora.contains_unsupported_authority_script(body) then return true; end if;

  select string_agg(
           case when ascii(character) between 0 and 383
                  or ascii(character) between 768 and 879
                then character else ' ' end,
           '' order by position
         )
    into latin_body
    from regexp_split_to_table(body, '') with ordinality item(character, position);
  select string_agg(
           case when ascii(character) between 0 and 383 then character else ' ' end,
           '' order by position
         )
    into latin_role
    from regexp_split_to_table(coalesce(role_name, ''), '')
         with ordinality item(character, position);
  if simulora.generated_narrative_authors_user_locale_legacy(
       coalesce(latin_body, ''), nullif(trim(coalesce(latin_role, '')), '')
     ) then return true; end if;

  compact_body := regexp_replace(body, '[[:punct:][:space:]]+', '', 'g');
  if role_name is not null then
    subjects := array_append(subjects, role_name);
    subjects := array_append(subjects, regexp_replace(role_name, '^.*[[:space:]]+', ''));
  end if;
  foreach subject in array subjects loop
    compact_subject := regexp_replace(subject, '[[:punct:][:space:]]+', '', 'g');
    subject_position := position(compact_subject in compact_body);
    if subject_position = 0 then continue; end if;
    tail := substring(compact_body from subject_position + length(compact_subject));
    before_subject := substring(compact_body from 1 for subject_position - 1);
    foreach verb in array verbs loop
      if position(verb in tail) > 0 then return true; end if;
      if (position('by' in before_subject) > 0
          or position('由' in before_subject) > 0
          or position('被' in before_subject) > 0)
         and position(verb in before_subject) > 0 then return true; end if;
    end loop;
    tail := regexp_replace(tail, '^的', '');
    foreach noun in array nouns loop
      if position(noun in tail) > 0 then return true; end if;
    end loop;
  end loop;
  return false;
end;
$$;

create or replace function simulora.generated_narrative_authors_user(
  narrative text,
  user_role_name text
) returns boolean
language plpgsql immutable as $$
declare
  body text;
  sentence text;
  normalized_sentence text;
  subject text;
  tail text;
  before_subject text;
  verb text;
  noun text;
  subject_position integer;
  subjects text[] := array['user', 'player', 'participant'];
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
    'sign', 'signs', 'signed', 'buy', 'buys', 'bought', 'sell', 'sells', 'sold',
    'refuse', 'refuses', 'refused', 'decline', 'declines', 'declined',
    'reject', 'rejects', 'rejected'
  ];
  nouns text[] := array[
    'speech', 'words', 'agreement', 'approval', 'decision', 'choice',
    'commitment', 'promise', 'consent', 'acceptance', 'permission', 'grant',
    'waiver', 'authorization', 'payment', 'spending', 'transfer', 'sharing',
    'publication', 'deletion', 'surrender', 'signature', 'purchase', 'sale'
  ];
begin
  if simulora.generated_narrative_authors_user_base(narrative, user_role_name) then
    return true;
  end if;
  select string_agg(
           case when ascii(character) between 0 and 383
                  or ascii(character) between 768 and 879
                then character else ' ' end,
           '' order by position
         )
    into body
    from regexp_split_to_table(simulora.normalized_generation_text(narrative), '')
         with ordinality item(character, position);
  if coalesce(body, '') = '' then return false; end if;
  foreach sentence in array regexp_split_to_array(body, E'[.!?\n]+') loop
    normalized_sentence := ' ' || trim(
      regexp_replace(sentence, '[[:punct:][:space:]]+', ' ', 'g')
    ) || ' ';
    foreach subject in array subjects loop
      subject_position := position(' ' || subject || ' ' in normalized_sentence);
      if subject_position = 0 then continue; end if;
      tail := substring(normalized_sentence from subject_position + length(subject) + 2);
      before_subject := substring(normalized_sentence from 1 for subject_position - 1);
      foreach verb in array verbs loop
        if position(' ' || verb || ' ' in ' ' || tail) > 0 then return true; end if;
        if (position(' by ' || subject || ' ' in normalized_sentence) > 0
            or position(' by the ' || subject || ' ' in normalized_sentence) > 0)
           and position(' ' || verb || ' ' in before_subject) > 0 then return true; end if;
      end loop;
      if position(' ' || subject || ' s ' in normalized_sentence) > 0 then
        foreach noun in array nouns loop
          if position(' s ' || noun || ' ' in normalized_sentence) > 0 then return true; end if;
        end loop;
      end if;
    end loop;
  end loop;
  return false;
end;
$$;
