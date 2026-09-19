-- Successor to 0037: reject direct possessive claims of protected user acts
-- in both the strict (canonical/provenance) and Character-bound guards.
-- Choice/decision remain intentionally outside this narrow list because
-- "your choice" and "your decision" can be ordinary deference language.

create or replace function simulora.generated_narrative_has_direct_possessive_claim(
  narrative text
) returns boolean
language sql immutable as $$
  select lower(simulora.normalized_generation_text(coalesce($1, ''))) ~*
    '\myour\M[[:space:]]+(speech|words|agreement|approval|commitment|promise|consent|acceptance|permission|grant|waiver|authorization|payment|spending|transfer|sharing|publication|deletion|surrender|signature|purchase|sale)\M[[:space:]]+(is|are|was|were|has[[:space:]]+been|have[[:space:]]+been|had[[:space:]]+been|will[[:space:]]+be|can[[:space:]]+be|cannot[[:space:]]+be|must[[:space:]]+be|shall[[:space:]]+be)\M';
$$;

alter function simulora.generated_narrative_authors_user(text, text)
  rename to generated_narrative_authors_user_pre_direct_possessive;

create function simulora.generated_narrative_authors_user(
  narrative text,
  user_role_name text
) returns boolean
language plpgsql immutable as $$
begin
  if simulora.generated_narrative_has_direct_possessive_claim(narrative) then
    return true;
  end if;
  return simulora.generated_narrative_authors_user_pre_direct_possessive(
    narrative, user_role_name
  );
end;
$$;

create or replace function simulora.generated_narrative_authors_user(
  narrative text,
  user_role_name text,
  response_character_name text
) returns boolean
language plpgsql immutable as $$
declare
  body text := lower(simulora.normalized_generation_text(narrative));
  role_name text := lower(trim(simulora.normalized_generation_text(user_role_name)));
  narrator text := lower(trim(simulora.normalized_generation_text(response_character_name)));
  normalized_role text := trim(regexp_replace(role_name, '[^[:alnum:]]+', ' ', 'g'));
  role_tokens text[] := regexp_split_to_array(normalized_role, '[[:space:]]+');
  subjects text := 'you|the user|the player|the participant|user|player|participant';
begin
  if simulora.generated_narrative_has_direct_possessive_claim(body) then
    return true;
  end if;
  if narrator ~ '^[a-z][a-z0-9_]*( [a-z][a-z0-9_]*)*$'
     and not (string_to_array(regexp_replace(narrator, '[^a-z0-9]+', ' ', 'g'), ' ') &&
       (array['you', 'user', 'player', 'participant'] || role_tokens)) then
    if normalized_role <> '' and normalized_role ~ '^[a-z0-9_ ]+$' then
      subjects := subjects || '|' || replace(regexp_replace(normalized_role, '[[:space:]]+', ' ', 'g'), ' ', '[[:space:]]+') || '|' ||
        regexp_replace(normalized_role, '^.*[[:space:]]+', '');
    end if;
    body := regexp_replace(
      body,
      '(\m(?:whichever|whatever|if)[[:space:]]+(?:' || subjects || ')[[:space:]]+)(?:choose|chooses|decide|decides)\M',
      E'\\1deliberate', 'gi'
    );
  end if;
  return simulora.generated_narrative_authors_user_pre_option_followup(
    body, user_role_name, response_character_name
  );
end;
$$;
