-- Final Gate G5 hardening: bind Recovery review evidence to its exact effect,
-- keep confirmation evidence immutable, and enforce root/fork lineage in the
-- same PostgreSQL authority that owns Commit materialization.

create function simulora.restore_proposal_effect_is_valid(
  candidate simulora.restore_proposals
) returns boolean
language plpgsql stable strict as $$
declare
  current_document jsonb;
  source_document jsonb;
  current_hash text;
  source_hash text;
  expected_included jsonb := '["worldClock","locations","entities","characters","facts","relationships","openThreads","objectives","resources"]'::jsonb;
  expected_excluded jsonb := '["participation","interactionBoundaries","customState","account identity / eligibility / consent","ownership / grants / usage / exports","other Branches"]'::jsonb;
  changed_sections jsonb := '[]'::jsonb;
  section_changes jsonb := '[]'::jsonb;
  expected_diff jsonb;
  digest_payload jsonb;
  expected_digest text;
  section_name text;
begin
  select state.document, state.document_hash
    into current_document, current_hash
    from simulora.world_commits commit
    join simulora.state_revisions state on state.id = commit.state_revision_id
   where commit.id = candidate.expected_head_commit_id;
  select state.document, state.document_hash
    into source_document, source_hash
    from simulora.world_commits commit
    join simulora.state_revisions state on state.id = commit.state_revision_id
   where commit.id = candidate.source_commit_id;

  if current_document is null or source_document is null then return false; end if;

  foreach section_name in array array[
    'worldClock', 'locations', 'entities', 'characters', 'facts',
    'relationships', 'openThreads', 'objectives', 'resources'
  ] loop
    if current_document->section_name is distinct from source_document->section_name then
      changed_sections := changed_sections || jsonb_build_array(section_name);
      section_changes := section_changes || jsonb_build_array(jsonb_build_object(
        'section', section_name,
        'before', current_document->section_name,
        'after', source_document->section_name
      ));
    end if;
  end loop;

  expected_diff := jsonb_build_object(
    'changedSections', changed_sections,
    'sectionChanges', section_changes,
    'beforeHash', current_hash,
    'sourceHash', source_hash
  );
  digest_payload := jsonb_build_object(
    'actorAccountId', candidate.actor_account_id,
    'continuityId', candidate.continuity_id,
    'branchId', candidate.branch_id,
    'sourceCommitId', candidate.source_commit_id,
    'expectedHeadCommitId', candidate.expected_head_commit_id,
    'includedSections', expected_included,
    'excludedSections', expected_excluded,
    'changedSections', changed_sections,
    'beforeHash', current_hash,
    'sourceHash', source_hash
  );
  expected_digest := encode(
    sha256(convert_to(simulora.canonical_jsonb_text(digest_payload), 'UTF8')),
    'hex'
  );

  return jsonb_array_length(changed_sections) > 0
     and candidate.included_sections = expected_included
     and candidate.excluded_sections = expected_excluded
     and candidate.diff = expected_diff
     and candidate.proposal_digest = expected_digest
     and candidate.expires_at > candidate.created_at;
end;
$$;

create function simulora.validate_restore_proposal_effect() returns trigger
language plpgsql as $$
declare
  branch_head uuid;
  branch_status text;
  continuity_status text;
  active_branch uuid;
begin
  select branch.head_commit_id, branch.status, continuity.status, continuity.active_branch_id
    into branch_head, branch_status, continuity_status, active_branch
    from simulora.branches branch
    join simulora.continuities continuity on continuity.id = branch.continuity_id
    where branch.id = new.branch_id;
  if new.status is distinct from 'ACTIVE'
     or new.expected_head_commit_id is distinct from branch_head
     or branch_status is distinct from 'ACTIVE'
     or continuity_status is distinct from 'ACTIVE'
     or active_branch is distinct from new.branch_id
     or new.expires_at <= clock_timestamp()
     or not simulora.restore_proposal_effect_is_valid(new) then
    raise exception 'Restore proposal must exactly bind its scope, diff, hashes and digest';
  end if;
  return new;
end;
$$;

create trigger restore_proposal_effect_integrity
before insert on simulora.restore_proposals
for each row execute function simulora.validate_restore_proposal_effect();

create trigger restore_proposal_delete_immutable
before delete on simulora.restore_proposals
for each row execute function simulora.reject_immutable_change();

create trigger restore_confirmation_immutable
before update or delete on simulora.restore_confirmations
for each row execute function simulora.reject_immutable_change();

create function simulora.protect_recovery_point() returns trigger
language plpgsql as $$
begin
  if (to_jsonb(new) - 'deleted_at') is distinct from (to_jsonb(old) - 'deleted_at')
     or (old.deleted_at is not null and new.deleted_at is distinct from old.deleted_at) then
    raise exception 'Recovery Point is immutable except for its deletion tombstone';
  end if;
  return new;
end;
$$;

create trigger recovery_point_update_integrity
before update on simulora.recovery_points
for each row execute function simulora.protect_recovery_point();

create trigger recovery_point_delete_immutable
before delete on simulora.recovery_points
for each row execute function simulora.reject_immutable_change();

create or replace function simulora.validate_restore_confirmation() returns trigger
language plpgsql as $$
declare
  proposal_actor uuid;
  proposal_digest_value text;
  proposal_head uuid;
  proposal_expiry timestamptz;
begin
  select actor_account_id, proposal_digest, expected_head_commit_id, expires_at
    into proposal_actor, proposal_digest_value, proposal_head, proposal_expiry
    from simulora.restore_proposals where id = new.proposal_id;
  if proposal_actor is distinct from new.actor_account_id
     or proposal_digest_value is distinct from new.proposal_digest
     or proposal_head is distinct from new.expected_head_commit_id
     or new.confirmed_at > clock_timestamp()
     or proposal_expiry <= new.confirmed_at
     or proposal_expiry <= clock_timestamp() then
    raise exception 'Restore confirmation must bind actor, digest, expected head and a live expiry';
  end if;
  return new;
end;
$$;

create unique index branches_one_root_per_continuity_idx
  on simulora.branches(continuity_id)
  where parent_branch_id is null and fork_source_commit_id is null;

create unique index commits_one_initialization_per_branch_idx
  on simulora.world_commits(branch_id)
  where kind = 'CONTINUITY_INITIALIZED';

create unique index commits_one_fork_per_branch_idx
  on simulora.world_commits(branch_id)
  where kind = 'BRANCH_FORK';

create or replace function simulora.validate_branch_head() returns trigger
language plpgsql as $$
declare
  commit_branch uuid;
  state_branch uuid;
  commit_state uuid;
  new_head_parent uuid;
  new_head_kind text;
begin
  if new.status = 'ACTIVE' and (new.head_commit_id is null or new.head_state_revision_id is null) then
    raise exception 'Active Branch requires Commit and State Revision heads';
  end if;
  if new.head_commit_id is null and new.head_state_revision_id is null then return new; end if;

  select branch_id, state_revision_id, parent_commit_id, kind
    into commit_branch, commit_state, new_head_parent, new_head_kind
    from simulora.world_commits where id = new.head_commit_id;
  select branch_id into state_branch
    from simulora.state_revisions where id = new.head_state_revision_id;
  if commit_branch is distinct from new.id
     or state_branch is distinct from new.id
     or commit_state is distinct from new.head_state_revision_id then
    raise exception 'Branch head must reference a matching Commit and State Revision on the same Branch';
  end if;

  if tg_op = 'UPDATE' and new.head_commit_id is distinct from old.head_commit_id then
    if old.head_commit_id is null then
      if new_head_kind not in ('CONTINUITY_INITIALIZED', 'BRANCH_FORK') then
        raise exception 'First Branch head must be its initialization or fork Commit';
      end if;
    elsif new_head_parent is distinct from old.head_commit_id then
      raise exception 'Branch head may only advance to a direct child Commit';
    end if;
  end if;
  return new;
end;
$$;

create or replace function simulora.validate_commit_parent_lineage() returns trigger
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
    if new.parent_commit_id is not null or branch_parent is not null or fork_source is not null then
      raise exception 'Continuity initialization requires the single root Branch and no parent Commit';
    end if;
  elsif new.kind = 'BRANCH_FORK' then
    if new.parent_commit_id is null
       or branch_parent is null
       or fork_source is null
       or new.parent_commit_id is distinct from fork_source
       or parent_branch is distinct from branch_parent then
      raise exception 'Branch fork Commit requires complete declared source lineage';
    end if;
  elsif new.parent_commit_id is null or parent_branch is distinct from new.branch_id then
    raise exception 'Commit parent must remain on the same Branch';
  end if;
  return new;
end;
$$;

create function simulora.validate_branch_fork_materialization() returns trigger
language plpgsql as $$
declare
  branch_parent uuid;
  fork_source uuid;
  branch_creator uuid;
  resulting_document jsonb;
  resulting_hash text;
  source_document jsonb;
  event_count integer;
begin
  if new.kind <> 'BRANCH_FORK' then return new; end if;
  select parent_branch_id, fork_source_commit_id, created_by_account_id
    into branch_parent, fork_source, branch_creator
    from simulora.branches where id = new.branch_id;
  select document, document_hash into resulting_document, resulting_hash
    from simulora.state_revisions where id = new.state_revision_id;
  select state.document into source_document
    from simulora.world_commits commit
    join simulora.state_revisions state on state.id = commit.state_revision_id
    where commit.id = fork_source;
  select count(*)::integer into event_count
    from simulora.domain_events
    where commit_id = new.id
      and branch_id = new.branch_id
      and event_type = 'BRANCH_FORKED'
      and payload->>'sourceBranchId' = branch_parent::text
      and payload->>'sourceCommitId' = fork_source::text;

  if new.actor_account_id is distinct from branch_creator
     or resulting_document is distinct from source_document
     or resulting_hash is distinct from encode(
       sha256(convert_to(simulora.canonical_jsonb_text(source_document), 'UTF8')),
       'hex'
     )
     or event_count <> 1 then
    raise exception 'Branch fork requires the exact source state and one linked BRANCH_FORKED Event';
  end if;
  return new;
end;
$$;

create constraint trigger branch_fork_materialization_integrity
after insert on simulora.world_commits
deferrable initially deferred
for each row execute function simulora.validate_branch_fork_materialization();

create or replace function simulora.validate_restore_commit_binding() returns trigger
language plpgsql as $$
declare
  proposal simulora.restore_proposals%rowtype;
  current_head uuid;
  active_branch uuid;
  branch_status text;
  continuity_status text;
  confirmation_count integer;
begin
  if new.kind <> 'RESTORE_COMMITTED' then return new; end if;
  select * into proposal
    from simulora.restore_proposals where id = new.restore_proposal_id;
  select count(*)::integer into confirmation_count
    from simulora.restore_confirmations
    where proposal_id = new.restore_proposal_id
      and actor_account_id = proposal.actor_account_id
      and proposal_digest = proposal.proposal_digest
      and expected_head_commit_id = proposal.expected_head_commit_id
      and confirmed_at <= clock_timestamp()
      and confirmed_at < proposal.expires_at;
  select branch.head_commit_id, continuity.active_branch_id, branch.status, continuity.status
    into current_head, active_branch, branch_status, continuity_status
    from simulora.branches branch
    join simulora.continuities continuity on continuity.id = branch.continuity_id
    where branch.id = new.branch_id
    for share of branch, continuity;
  if proposal.id is null
     or proposal.branch_id is distinct from new.branch_id
     or proposal.actor_account_id is distinct from new.actor_account_id
     or proposal.expected_head_commit_id is distinct from new.parent_commit_id
     or proposal.status is distinct from 'CONFIRMED'
     or proposal.expires_at <= clock_timestamp()
     or not simulora.restore_proposal_effect_is_valid(proposal)
     or confirmation_count <> 1
     or current_head is distinct from new.parent_commit_id
     or active_branch is distinct from new.branch_id
     or branch_status is distinct from 'ACTIVE'
     or continuity_status is distinct from 'ACTIVE' then
    raise exception 'Restore Commit requires exact live confirmed proposal on the active Branch and current expected head';
  end if;
  return new;
end;
$$;

create or replace function simulora.validate_restore_materialization() returns trigger
language plpgsql as $$
declare
  proposal simulora.restore_proposals%rowtype;
  confirmation_count integer;
  event_count integer;
  resulting_document jsonb;
  parent_document jsonb;
  source_document jsonb;
  expected_document jsonb;
  section_name text;
  branch_head uuid;
  branch_state_head uuid;
  active_branch uuid;
  branch_status text;
  continuity_status text;
begin
  if new.kind <> 'RESTORE_COMMITTED' then return new; end if;
  select * into proposal
    from simulora.restore_proposals where id = new.restore_proposal_id;
  select count(*)::integer into confirmation_count
    from simulora.restore_confirmations
    where proposal_id = new.restore_proposal_id
      and actor_account_id = proposal.actor_account_id
      and proposal_digest = proposal.proposal_digest
      and expected_head_commit_id = proposal.expected_head_commit_id
      and confirmed_at <= clock_timestamp()
      and confirmed_at < proposal.expires_at;
  select count(*)::integer into event_count
    from simulora.domain_events
    where commit_id = new.id
      and branch_id = new.branch_id
      and event_type = 'STATE_RESTORED'
      and payload->>'restoreProposalId' = new.restore_proposal_id::text
      and payload->>'sourceCommitId' = proposal.source_commit_id::text
      and payload->'includedSections' = proposal.included_sections;
  select document into resulting_document
    from simulora.state_revisions where id = new.state_revision_id;
  select state.document into parent_document
    from simulora.world_commits commit
    join simulora.state_revisions state on state.id = commit.state_revision_id
    where commit.id = new.parent_commit_id;
  select state.document into source_document
    from simulora.world_commits commit
    join simulora.state_revisions state on state.id = commit.state_revision_id
    where commit.id = proposal.source_commit_id;
  select branch.head_commit_id, branch.head_state_revision_id, branch.status,
         continuity.active_branch_id, continuity.status
    into branch_head, branch_state_head, branch_status, active_branch, continuity_status
    from simulora.branches branch
    join simulora.continuities continuity on continuity.id = branch.continuity_id
    where branch.id = new.branch_id;
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
  if proposal.expires_at <= clock_timestamp()
     or not simulora.restore_proposal_effect_is_valid(proposal)
     or confirmation_count <> 1
     or event_count <> 1
     or resulting_document is distinct from expected_document
     or branch_head is distinct from new.id
     or branch_state_head is distinct from new.state_revision_id
     or branch_status is distinct from 'ACTIVE'
     or continuity_status is distinct from 'ACTIVE'
     or active_branch is distinct from new.branch_id then
    raise exception 'Restore Commit requires exact live confirmation, append-only state, one linked STATE_RESTORED Event and an advanced Branch head';
  end if;
  return new;
end;
$$;
