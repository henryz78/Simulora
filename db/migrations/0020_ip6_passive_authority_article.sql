-- Detect protected user-authority claims in passive voice when the role is
-- introduced by an article, for example "transferred by the keeper".

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
      if by_position = 0 then
        by_position := position(' by the ' || normalized_subject || ' ' in normalized_sentence);
      end if;
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
    if exists (
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
