-- Extend the parity guard to the article-free generic subjects commonly used
-- in generated prose. Keep the previous implementation intact as the base so
-- this migration changes only the missing subject forms.
-- First-person pronouns are intentionally not prose-classified here because
-- Character dialogue may use “I/me/we”; response-source and actor bindings
-- remain responsible for that identity boundary.

alter function simulora.generated_narrative_authors_user(text, text)
  rename to generated_narrative_authors_user_base;

create or replace function simulora.generated_narrative_authors_user(
  narrative text,
  user_role_name text
) returns boolean
language plpgsql immutable as $$
declare
  body text := lower(normalize(coalesce(narrative, ''), NFKC));
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

  if body = '' then return false; end if;

  foreach sentence in array regexp_split_to_array(body, E'[.!?\n]+') loop
    normalized_sentence := ' ' || trim(
      regexp_replace(sentence, '[[:punct:][:space:]]+', ' ', 'g')
    ) || ' ';
    foreach subject in array subjects loop
      subject_position := position(' ' || subject || ' ' in normalized_sentence);
      if subject_position = 0 then
        continue;
      end if;

      tail := substring(
        normalized_sentence from subject_position + length(subject) + 2
      );
      foreach verb in array verbs loop
        if position(' ' || verb || ' ' in ' ' || tail) > 0 then
          return true;
        end if;
      end loop;

      before_subject := substring(normalized_sentence from 1 for subject_position - 1);
      if position(' by ' || subject || ' ' in normalized_sentence) > 0
        or position(' by the ' || subject || ' ' in normalized_sentence) > 0 then
        foreach verb in array verbs loop
          if position(' ' || verb || ' ' in before_subject) > 0 then
            return true;
          end if;
        end loop;
      end if;

      if position(' ' || subject || ' s ' in normalized_sentence) > 0 then
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
