-- Keep application and PostgreSQL authority guards aligned for a bounded
-- conditional reference such as "whichever you choose". Direct user claims
-- remain protected by the predecessor guard.

alter function simulora.generated_narrative_authors_user(text, text, text)
  rename to generated_narrative_authors_user_pre_option_followup;

create function simulora.generated_narrative_authors_user(
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
  if narrator ~ '^[a-z][a-z0-9_]*( [a-z][a-z0-9_]*)*$'
     and not (string_to_array(regexp_replace(narrator, '[^a-z0-9]+', ' ', 'g'), ' ') &&
       (array['you', 'user', 'player', 'participant'] || role_tokens)) then
    if normalized_role <> '' and normalized_role ~ '^[a-z0-9_ ]+$' then
      subjects := subjects || '|' || replace(regexp_replace(normalized_role, '[[:space:]]+', ' ', 'g'), ' ', '[[:space:]]+') || '|' ||
        regexp_replace(normalized_role, '^.*[[:space:]]+', '');
    end if;
    body := regexp_replace(
      body,
      '\m(?:whichever|whatever|if)[[:space:]]+(?:' || subjects || ')[[:space:]]+(choose|chooses|decide|decides)\M',
      E'\\1deliberate', 'gi'
    );
  end if;
  return simulora.generated_narrative_authors_user_pre_option_followup(
    body, user_role_name, response_character_name
  );
end;
$$;
