-- Narrative-only successor to 0030. Canonical/provenance two-argument checks
-- remain strict; this does not authorize decisions, commitments or world effects.
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
begin
  if narrator ~ '^[a-z][a-z0-9_]*( [a-z][a-z0-9_]*)*$'
     and not (string_to_array(regexp_replace(narrator, '[^a-z0-9]+', ' ', 'g'), ' ') &&
       (array['you', 'user', 'player', 'participant'] || role_tokens)) then
    body := regexp_replace(
      body,
      '(,[[:space:]''"]*' || narrator || '[[:space:]]+)(says|said)([[:space:]]*,)',
      E'\\1narrates\\3', 'g'
    );
    -- ponytail: a bare clause-ending "can decide", not a general modal parser.
    -- Preserve the subject so earlier/later authority claims remain inspected.
    foreach subject in array array[
      'you', 'the user', 'the player', 'the participant', 'user', 'player', 'participant',
      normalized_role, role_name, role_tokens[array_length(role_tokens, 1)]
    ] loop
      if subject ~ '^[a-z][a-z0-9_]*( [a-z][a-z0-9_]*)*$' then
        body := regexp_replace(
          body,
          '(\m' || subject || '\M[[:space:]]+can[[:space:]]+)decide(?=[[:space:]]*([;.!?''"\n]|$))',
          E'\\1deliberate', 'g'
        );
      end if;
    end loop;
  end if;
  return simulora.generated_narrative_authors_user(body, user_role_name);
end;
$$;
