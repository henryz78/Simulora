-- Gate G6 final authority hardening: confirmation remains live at transition,
-- acknowledgement time is immutable, and protected user claims fail closed
-- across punctuation and intervening clauses.

create or replace function simulora.protect_action_identity() returns trigger
language plpgsql as $$
begin
  if (to_jsonb(new) - array['status', 'status_reason', 'terminal_at', 'row_version', 'updated_at'])
     is distinct from
     (to_jsonb(old) - array['status', 'status_reason', 'terminal_at', 'row_version', 'updated_at']) then
    raise exception 'Action identity, authority and command binding are immutable';
  end if;
  return new;
end;
$$;

create or replace function simulora.generated_narrative_authors_user(
  narrative text,
  user_role_name text
) returns boolean
language plpgsql immutable as $$
declare
  body text := lower(narrative);
  role_name text := lower(nullif(trim(user_role_name), ''));
  role_alias text;
  sentence text;
  normalized_sentence text;
  subject text;
  normalized_subject text;
  tail text;
  verb text;
  subject_position integer;
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
      if subject_position > 0 then
        tail := substring(
          normalized_sentence from subject_position + length(normalized_subject) + 2
        );
        foreach verb in array verbs loop
          if position(' ' || verb || ' ' in ' ' || tail) > 0 then
            return true;
          end if;
        end loop;
      end if;
    end loop;
  end loop;
  return false;
end;
$$;

create or replace function simulora.protect_action_proposal() returns trigger
language plpgsql as $$
declare
  action_actor uuid;
  action_status text;
  action_head uuid;
  action_branch uuid;
  branch_head uuid;
  branch_status text;
  active_branch uuid;
  continuity_status text;
begin
  if (to_jsonb(new) - 'status') is distinct from (to_jsonb(old) - 'status') then
    raise exception 'Action proposal evidence is immutable';
  end if;
  if new.status is distinct from old.status and not (
    old.status = 'ACTIVE' and new.status in ('CONFIRMED', 'EXPIRED', 'REJECTED')
  ) then
    raise exception 'Invalid Action proposal status transition';
  end if;
  if old.status = 'ACTIVE' and new.status = 'CONFIRMED' then
    select a.actor_account_id, a.status, a.expected_head_commit_id, a.branch_id,
           b.head_commit_id, b.status, c.active_branch_id, c.status
      into action_actor, action_status, action_head, action_branch,
           branch_head, branch_status, active_branch, continuity_status
      from simulora.actions a
      join simulora.branches b on b.id = a.branch_id
      join simulora.continuities c on c.id = a.continuity_id
      where a.id = new.action_id
      for share of a, b, c;
    if action_status not in ('VALIDATING', 'AWAITING_CONFIRMATION')
       or action_head is distinct from new.expected_head_commit_id
       or branch_head is distinct from new.expected_head_commit_id
       or branch_status is distinct from 'ACTIVE'
       or continuity_status is distinct from 'ACTIVE'
       or active_branch is distinct from action_branch
       or new.expires_at <= clock_timestamp()
       or not simulora.action_proposal_effect_is_valid(new)
       or not exists (
         select 1 from simulora.action_confirmations confirmation
         where confirmation.action_id = new.action_id
           and confirmation.proposal_id = new.id
           and confirmation.actor_account_id = action_actor
           and confirmation.proposal_digest = new.proposal_digest
           and confirmation.expected_head_commit_id = new.expected_head_commit_id
           and confirmation.confirmed_at >= new.created_at
           and confirmation.confirmed_at <= new.expires_at
           and confirmation.confirmed_at <= clock_timestamp()
       ) then
      raise exception 'Confirmed proposal requires its exact current Action, Branch head and live confirmation';
    end if;
  end if;
  return new;
end;
$$;
