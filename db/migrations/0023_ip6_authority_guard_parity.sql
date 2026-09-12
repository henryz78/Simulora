-- Close the authority classifier before subject matching so unsupported scripts
-- cannot reach a permissive branch. Keep English and localized matching parity
-- for non-ASCII roles and normalize punctuation consistently with the app.

create or replace function simulora.generated_narrative_authors_user(
  narrative text,
  user_role_name text
) returns boolean
language plpgsql immutable as $$
declare
  body text := lower(normalize(coalesce(narrative, ''), NFKC));
  role_name text := lower(normalize(nullif(trim(user_role_name), ''), NFKC));
  role_alias text;
  sentence text;
  normalized_sentence text;
  compact_sentence text;
  subject text;
  normalized_subject text;
  compact_subject text;
  tail text;
  before_subject text;
  verb text;
  noun text;
  subject_position integer;
  by_position integer;
  subjects text[] := array['you', 'the user', 'the player', 'the participant', '你', '用户', '玩家', '参与者'];
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
  localized_verbs text[] := array[
    '说', '同意', '答应', '决定', '选择', '承诺', '接受', '批准', '允许',
    '授权', '支付', '花费', '转移', '分享', '发布', '删除', '放弃', '签署',
    '购买', '出售', '拒绝'
  ];
  nouns text[] := array[
    'speech', 'words', 'agreement', 'approval', 'decision', 'choice',
    'commitment', 'promise', 'consent', 'acceptance', 'permission', 'grant',
    'waiver', 'authorization', 'payment', 'spending', 'transfer', 'sharing',
    'publication', 'deletion', 'surrender', 'signature', 'purchase', 'sale'
  ];
  localized_nouns text[] := array[
    '发言', '话语', '同意', '决定', '选择', '承诺', '许可', '授权',
    '付款', '转移', '分享', '发布', '删除', '签名', '购买', '出售'
  ];
begin
  if body = '' then return false; end if;

  -- This boundary is intentionally conservative: unsupported scripts cannot
  -- be classified safely and therefore fail closed before subject lookup.
  if body ~ '[^A-Za-zÀ-ÖØ-öø-ÿĀ-ſ0-9[:punct:][:space:]一-鿿㐀-䶿]' then
    return true;
  end if;

  if role_name is not null then
    role_name := trim(regexp_replace(role_name, '[[:punct:][:space:]]+', ' ', 'g'));
    role_alias := regexp_replace(role_name, '^.*[[:space:]]+', '');
    subjects := array_append(subjects, role_name);
    if role_alias <> role_name then
      subjects := array_append(subjects, role_alias);
    end if;
  end if;

  foreach sentence in array regexp_split_to_array(body, E'[.!?。！？\\n]+') loop
    normalized_sentence := ' ' || trim(
      regexp_replace(sentence, '[[:punct:][:space:]]+', ' ', 'g')
    ) || ' ';
    compact_sentence := regexp_replace(sentence, '[[:punct:][:space:]]+', '', 'g');

    foreach subject in array subjects loop
      normalized_subject := trim(regexp_replace(subject, '[[:punct:][:space:]]+', ' ', 'g'));
      compact_subject := regexp_replace(normalized_subject, '[[:space:]]+', '', 'g');
      if normalized_subject ~ '^[A-Za-z0-9_ ]+$' then
        subject_position := position(' ' || normalized_subject || ' ' in normalized_sentence);
        if subject_position = 0 then
          if position(compact_subject in compact_sentence) > 0 then
            tail := substring(
              compact_sentence from position(compact_subject in compact_sentence) + length(compact_subject)
            );
            foreach verb in array localized_verbs loop
              if position(verb in tail) > 0 then
                return true;
              end if;
            end loop;
            foreach verb in array verbs loop
              if position(verb in tail) > 0 then
                return true;
              end if;
            end loop;
          end if;
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
        foreach verb in array localized_verbs loop
          if position(verb in tail) > 0 then
            return true;
          end if;
        end loop;
        foreach verb in array verbs loop
          if position(verb in tail) > 0 then
            return true;
          end if;
        end loop;
        before_subject := substring(normalized_sentence from 1 for subject_position - 1);
        by_position := position(' by ' || normalized_subject || ' ' in normalized_sentence);
        if by_position = 0 then
          by_position := position(' by the ' || normalized_subject || ' ' in normalized_sentence);
        end if;
        if by_position > 0 then
          foreach verb in array verbs loop
            if position(' ' || verb || ' ' in before_subject) > 0 then
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
      else
        subject_position := position(compact_subject in compact_sentence);
        if subject_position = 0 then
          continue;
        end if;
        tail := substring(compact_sentence from subject_position + length(compact_subject));
        foreach verb in array localized_verbs loop
          if position(verb in tail) > 0 then
            return true;
          end if;
        end loop;
        foreach verb in array verbs loop
          if position(verb in tail) > 0 then
            return true;
          end if;
        end loop;
        before_subject := substring(compact_sentence from 1 for subject_position - 1);
        if (position('由' in before_subject) > 0 or position('被' in before_subject) > 0) then
          foreach verb in array localized_verbs loop
            if position(verb in before_subject) > 0 then
              return true;
            end if;
          end loop;
        end if;
        if sentence ~ '(^|[^A-Za-z0-9_])by([^A-Za-z0-9_]|$)' then
          foreach verb in array verbs loop
            if position(verb in before_subject) > 0 then
              return true;
            end if;
          end loop;
        end if;
        tail := regexp_replace(tail, '^的', '');
        foreach noun in array localized_nouns loop
          if position(noun in tail) > 0 then
            return true;
          end if;
        end loop;
        foreach noun in array nouns loop
          if position(noun in tail) > 0 then
            return true;
          end if;
        end loop;
      end if;
    end loop;
  end loop;
  return false;
end;
$$;
