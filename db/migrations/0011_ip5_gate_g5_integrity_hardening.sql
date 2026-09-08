-- Gate G5 integrity hardening. Recovery continues to use the one authoritative
-- Branch -> Commit -> State Revision spine; these checks make the reciprocal
-- links and exact Restore confirmation enforceable by PostgreSQL itself.

create function simulora.canonical_jsonb_text(value jsonb) returns text
language plpgsql immutable strict parallel safe as $$
declare
  result text;
begin
  case jsonb_typeof(value)
    when 'object' then
      select '{' || coalesce(
        string_agg(to_jsonb(entry.key)::text || ':' || simulora.canonical_jsonb_text(entry.value),
                   ',' order by entry.key collate "C"),
        ''
      ) || '}' into result
      from jsonb_each(value) as entry;
    when 'array' then
      select '[' || coalesce(
        string_agg(simulora.canonical_jsonb_text(entry.value), ',' order by entry.position),
        ''
      ) || ']' into result
      from jsonb_array_elements(value) with ordinality as entry(value, position);
    when 'number' then
      return trim_scale((value #>> '{}')::numeric)::text;
    else
      return value::text;
  end case;
  return result;
end;
$$;

alter table simulora.state_revisions
  add constraint state_revision_document_hash_matches
  check (
    document_hash = encode(
      sha256(convert_to(simulora.canonical_jsonb_text(document), 'UTF8')),
      'hex'
    )
  ) not valid;

create function simulora.validate_commit_state_pair() returns trigger
language plpgsql as $$
declare
  commit_id_value uuid;
  state_id_value uuid;
  commit_branch uuid;
  commit_state uuid;
  state_branch uuid;
  state_commit uuid;
begin
  if tg_table_name = 'world_commits' then
    commit_id_value := new.id;
    state_id_value := new.state_revision_id;
  else
    commit_id_value := new.commit_id;
    state_id_value := new.id;
  end if;

  select branch_id, state_revision_id into commit_branch, commit_state
    from simulora.world_commits where id = commit_id_value;
  select branch_id, commit_id into state_branch, state_commit
    from simulora.state_revisions where id = state_id_value;

  if commit_branch is null
     or state_branch is null
     or commit_state is distinct from state_id_value
     or state_commit is distinct from commit_id_value
     or commit_branch is distinct from state_branch then
    raise exception 'Commit and State Revision must reference each other on one Branch';
  end if;
  return new;
end;
$$;

create constraint trigger world_commit_state_pair_integrity
after insert on simulora.world_commits
deferrable initially deferred
for each row execute function simulora.validate_commit_state_pair();

create constraint trigger state_revision_commit_pair_integrity
after insert on simulora.state_revisions
deferrable initially deferred
for each row execute function simulora.validate_commit_state_pair();

create function simulora.validate_commit_parent_lineage() returns trigger
language plpgsql as $$
declare
  parent_branch uuid;
  branch_parent uuid;
  fork_source uuid;
begin
  if new.parent_commit_id is not null then
    select branch_id into parent_branch
      from simulora.world_commits where id = new.parent_commit_id;
  end if;
  select parent_branch_id, fork_source_commit_id into branch_parent, fork_source
    from simulora.branches where id = new.branch_id;

  if new.kind = 'CONTINUITY_INITIALIZED' then
    if new.parent_commit_id is not null then
      raise exception 'Continuity initialization cannot have a parent Commit';
    end if;
  elsif new.kind = 'BRANCH_FORK' then
    if new.parent_commit_id is distinct from fork_source
       or parent_branch is distinct from branch_parent then
      raise exception 'Branch fork Commit must preserve its declared source lineage';
    end if;
  elsif new.parent_commit_id is null or parent_branch is distinct from new.branch_id then
    raise exception 'Commit parent must remain on the same Branch';
  end if;
  return new;
end;
$$;

create trigger world_commit_parent_lineage_integrity
before insert on simulora.world_commits
for each row execute function simulora.validate_commit_parent_lineage();

create function simulora.protect_branch_identity() returns trigger
language plpgsql as $$
begin
  if new.continuity_id is distinct from old.continuity_id
     or new.parent_branch_id is distinct from old.parent_branch_id
     or new.fork_source_commit_id is distinct from old.fork_source_commit_id
     or new.created_by_account_id is distinct from old.created_by_account_id
     or new.idempotency_key is distinct from old.idempotency_key
     or new.created_at is distinct from old.created_at then
    raise exception 'Branch identity and lineage are immutable';
  end if;
  return new;
end;
$$;

create trigger branch_identity_immutable
before update on simulora.branches
for each row execute function simulora.protect_branch_identity();

create function simulora.validate_event_commit_branch() returns trigger
language plpgsql as $$
declare
  owning_branch uuid;
begin
  select branch_id into owning_branch from simulora.world_commits where id = new.commit_id;
  if owning_branch is distinct from new.branch_id then
    raise exception 'Domain Event must belong to its Commit Branch';
  end if;
  return new;
end;
$$;

create trigger domain_event_commit_branch_integrity
before insert on simulora.domain_events
for each row execute function simulora.validate_event_commit_branch();

create or replace function simulora.validate_restore_commit_binding() returns trigger
language plpgsql as $$
declare
  proposal_branch uuid;
  proposal_actor uuid;
  proposal_head uuid;
  proposal_digest_value text;
  proposal_status text;
  proposal_expiry timestamptz;
  current_head uuid;
  active_branch uuid;
  confirmation_count integer;
begin
  if new.kind <> 'RESTORE_COMMITTED' then return new; end if;
  select branch_id, actor_account_id, expected_head_commit_id, proposal_digest, status, expires_at
    into proposal_branch, proposal_actor, proposal_head, proposal_digest_value,
         proposal_status, proposal_expiry
    from simulora.restore_proposals where id = new.restore_proposal_id;
  select count(*)::integer into confirmation_count
    from simulora.restore_confirmations
    where proposal_id = new.restore_proposal_id
      and actor_account_id = proposal_actor
      and proposal_digest = proposal_digest_value
      and expected_head_commit_id = proposal_head
      and confirmed_at < proposal_expiry;
  select branch.head_commit_id, continuity.active_branch_id
    into current_head, active_branch
    from simulora.branches branch
    join simulora.continuities continuity on continuity.id = branch.continuity_id
    where branch.id = new.branch_id
    for share of branch, continuity;
  if proposal_branch is distinct from new.branch_id
     or proposal_actor is distinct from new.actor_account_id
     or proposal_head is distinct from new.parent_commit_id
     or proposal_status is distinct from 'CONFIRMED'
     or confirmation_count <> 1
     or current_head is distinct from new.parent_commit_id
     or active_branch is distinct from new.branch_id then
    raise exception 'Restore Commit requires exact confirmed proposal on the active Branch and current expected head';
  end if;
  return new;
end;
$$;

create function simulora.validate_restore_materialization() returns trigger
language plpgsql as $$
declare
  proposal_digest_value text;
  proposal_head uuid;
  proposal_actor uuid;
  proposal_source uuid;
  proposal_expiry timestamptz;
  confirmation_count integer;
  event_count integer;
  resulting_document jsonb;
  parent_document jsonb;
  source_document jsonb;
  expected_document jsonb;
  section_name text;
begin
  if new.kind <> 'RESTORE_COMMITTED' then return new; end if;
  select proposal_digest, expected_head_commit_id, actor_account_id, source_commit_id, expires_at
    into proposal_digest_value, proposal_head, proposal_actor, proposal_source, proposal_expiry
    from simulora.restore_proposals where id = new.restore_proposal_id;
  select count(*)::integer into confirmation_count
    from simulora.restore_confirmations
    where proposal_id = new.restore_proposal_id
      and actor_account_id = proposal_actor
      and proposal_digest = proposal_digest_value
      and expected_head_commit_id = proposal_head
      and confirmed_at < proposal_expiry;
  select count(*)::integer into event_count
    from simulora.domain_events
    where commit_id = new.id
      and branch_id = new.branch_id
      and event_type = 'STATE_RESTORED'
      and payload->>'restoreProposalId' = new.restore_proposal_id::text
      and payload->>'sourceCommitId' = proposal_source::text;
  select document into resulting_document
    from simulora.state_revisions where id = new.state_revision_id;
  select state.document into parent_document
    from simulora.world_commits commit
    join simulora.state_revisions state on state.id = commit.state_revision_id
    where commit.id = new.parent_commit_id;
  select state.document into source_document
    from simulora.world_commits commit
    join simulora.state_revisions state on state.id = commit.state_revision_id
    where commit.id = proposal_source;
  expected_document := parent_document;
  foreach section_name in array array[
    'worldClock', 'locations', 'entities', 'characters', 'facts',
    'relationships', 'openThreads', 'objectives', 'resources'
  ] loop
    expected_document := jsonb_set(
      expected_document,
      array[section_name],
      source_document->section_name,
      true
    );
  end loop;
  if confirmation_count <> 1
     or event_count <> 1
     or resulting_document is distinct from expected_document then
    raise exception 'Restore Commit requires exact confirmation, append-only state and one linked STATE_RESTORED Event';
  end if;
  return new;
end;
$$;

create constraint trigger restore_commit_materialization_integrity
after insert on simulora.world_commits
deferrable initially deferred
for each row execute function simulora.validate_restore_materialization();
