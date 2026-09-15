-- Consolidated G1-G6 re-review repairs.  This migration closes authority
-- gaps found only when the individual slices were exercised together.

-- Preserve request lineage across the durable Action -> job -> attempt path.
alter table simulora.actions
  add column if not exists correlation_id text
    check (correlation_id is null or correlation_id ~ '^[A-Za-z0-9._:-]{1,128}$');
alter table simulora.durable_jobs
  add column if not exists correlation_id text
    check (correlation_id is null or correlation_id ~ '^[A-Za-z0-9._:-]{1,128}$');
alter table simulora.generation_attempts
  add column if not exists correlation_id text
    check (correlation_id is null or correlation_id ~ '^[A-Za-z0-9._:-]{1,128}$');

-- A fork idempotency key identifies the complete request, not merely the
-- existence of a Branch row.
alter table simulora.branches
  add column if not exists fork_request_digest text
    check (fork_request_digest is null or fork_request_digest ~ '^[0-9a-f]{64}$');

-- World Revision rows are immutable authoritative definitions.  The database
-- must enforce the same playable shape and validation provenance as the
-- application path, including the exact source draft and content hash.
alter table simulora.world_revisions
  add constraint world_revision_document_hash_matches
  check (
    document_hash = encode(
      sha256(convert_to(simulora.canonical_jsonb_text(document), 'UTF8')),
      'hex'
    )
  ) not valid;

create function simulora.valid_world_revision_document(candidate jsonb) returns boolean
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
     or coalesce(candidate->>'schemaVersion', '') <> '1'
     or length(trim(coalesce(candidate->>'title', ''))) = 0
     or length(trim(coalesce(candidate->>'premise', ''))) = 0
     or length(trim(coalesce(candidate->>'startingSituation', ''))) = 0
     or coalesce(jsonb_typeof(candidate->'userRole'), '') <> 'object'
     or length(trim(coalesce(candidate->'userRole'->>'name', ''))) = 0
     or length(trim(coalesce(candidate->'userRole'->>'authorityBoundary', ''))) = 0
     or coalesce(jsonb_typeof(candidate->'locations'), '') <> 'array'
     or jsonb_array_length(candidate->'locations') < 1
     or coalesce(jsonb_typeof(candidate->'characters'), '') <> 'array'
     or jsonb_array_length(candidate->'characters') < 1
     or coalesce(jsonb_typeof(candidate->'facts'), '') <> 'array'
     or jsonb_array_length(candidate->'facts') < 1
     or coalesce(jsonb_typeof(candidate->'relationships'), '') <> 'array'
     or coalesce(jsonb_typeof(candidate->'interactionPaths'), '') <> 'array'
     or jsonb_array_length(candidate->'interactionPaths') < 1
     or coalesce(jsonb_typeof(candidate->'interactionBoundaries'), '') <> 'array'
     or jsonb_array_length(candidate->'interactionBoundaries') < 1
     or coalesce(jsonb_typeof(candidate->'objectives'), '') <> 'array' then
    return false;
  end if;

  for item in select value from jsonb_array_elements(candidate->'locations') loop
    id := item->>'id';
    if coalesce(jsonb_typeof(item), '') <> 'object'
       or coalesce(id, '') !~ '^[a-z0-9][a-z0-9._-]*$'
       or length(trim(coalesce(item->>'name', ''))) = 0
       or length(trim(coalesce(item->>'description', ''))) = 0
       or id = any(all_ids) then
      return false;
    end if;
    location_ids := array_append(location_ids, id);
    all_ids := array_append(all_ids, id);
  end loop;

  for item in select value from jsonb_array_elements(candidate->'facts') loop
    id := item->>'id';
    if coalesce(jsonb_typeof(item), '') <> 'object'
       or coalesce(id, '') !~ '^[a-z0-9][a-z0-9._-]*$'
       or length(trim(coalesce(item->>'statement', ''))) = 0
       or coalesce(item->>'scope', '') not in ('ACCOUNT_PRIVATE', 'CONTINUITY_PRIVATE', 'SHARED')
       or length(trim(coalesce(item->>'provenance', ''))) = 0
       or coalesce(item->>'lifecycle', '') <> 'ACTIVE'
       or coalesce(id, '') = any(all_ids) then
      return false;
    end if;
    fact_ids := array_append(fact_ids, id);
    all_ids := array_append(all_ids, id);
  end loop;

  for item in select value from jsonb_array_elements(candidate->'characters') loop
    id := item->>'id';
    if coalesce(jsonb_typeof(item), '') <> 'object'
       or coalesce(id, '') !~ '^[a-z0-9][a-z0-9._-]*$'
       or length(trim(coalesce(item->>'name', ''))) = 0
       or length(trim(coalesce(item->>'role', ''))) = 0
       or length(trim(coalesce(item->>'stance', ''))) = 0
       or length(trim(coalesce(item->>'locationId', ''))) = 0 then
      -- The location/reference checks below provide the actual validation;
      -- this branch only keeps malformed scalar/object values fail-closed.
      return false;
    end if;
    if not (coalesce(item->>'locationId', '') = any(location_ids))
       or coalesce(jsonb_typeof(item->'motives'), '') <> 'array'
       or jsonb_array_length(item->'motives') < 1
       or coalesce(jsonb_typeof(item->'knowledgeFactIds'), '') <> 'array'
       or coalesce(id, '') = any(all_ids) then
      return false;
    end if;
    character_ids := array_append(character_ids, id);
    all_ids := array_append(all_ids, id);
  end loop;

  for item in select value from jsonb_array_elements(candidate->'characters') loop
    for id in select jsonb_array_elements_text(item->'knowledgeFactIds') loop
      if not (coalesce(id, '') = any(fact_ids)) then return false; end if;
    end loop;
  end loop;

  for item in select value from jsonb_array_elements(candidate->'relationships') loop
    id := item->>'id';
    if coalesce(jsonb_typeof(item), '') <> 'object'
       or coalesce(id, '') !~ '^[a-z0-9][a-z0-9._-]*$'
       or length(trim(coalesce(item->>'description', ''))) = 0
       or not (coalesce(item->>'fromCharacterId', '') = any(character_ids))
       or not (coalesce(item->>'toCharacterId', '') = any(character_ids))
       or coalesce(id, '') = any(all_ids) then
      return false;
    end if;
    all_ids := array_append(all_ids, id);
  end loop;

  for item in select value from jsonb_array_elements(candidate->'interactionPaths') loop
    if coalesce(jsonb_typeof(item), '') <> 'string' or length(trim(item #>> '{}')) = 0 then return false; end if;
  end loop;
  for item in select value from jsonb_array_elements(candidate->'interactionBoundaries') loop
    if coalesce(jsonb_typeof(item), '') <> 'string' or length(trim(item #>> '{}')) = 0 then return false; end if;
  end loop;
  return true;
end;
$$;

-- State Revision is the authoritative runtime head.  Existing pre-repair
-- legacy rows remain readable; every new authoritative row must be shaped.
create function simulora.valid_state_revision_document(candidate jsonb) returns boolean
language plpgsql immutable strict as $$
declare
  item jsonb;
  id text;
  fact_ids text[] := array[]::text[];
  character_ids text[] := array[]::text[];
begin
  if coalesce(jsonb_typeof(candidate), '') <> 'object'
     or coalesce(candidate->>'schemaVersion', '') <> '1'
     or coalesce(jsonb_typeof(candidate->'participation'), '') <> 'object'
     or coalesce(candidate->'participation'->>'initiativeMode', '') not in ('DIRECT', 'GUIDED', 'WORLD_ACTIVE')
     or coalesce(candidate->'participation'->>'structureMode', '') not in ('OPEN_ENDED', 'GOAL_FRAMED')
     or coalesce(jsonb_typeof(candidate->'worldClock'), '') <> 'object'
     or coalesce(candidate->'worldClock'->>'turn', '') !~ '^[0-9]+$'
     or length(trim(coalesce(candidate->'worldClock'->>'label', ''))) = 0
     or coalesce(jsonb_typeof(candidate->'locations'), '') <> 'array'
     or coalesce(jsonb_typeof(candidate->'entities'), '') <> 'array'
     or coalesce(jsonb_typeof(candidate->'characters'), '') <> 'array'
     or coalesce(jsonb_typeof(candidate->'facts'), '') <> 'array'
     or coalesce(jsonb_typeof(candidate->'relationships'), '') <> 'array'
     or coalesce(jsonb_typeof(candidate->'openThreads'), '') <> 'array'
     or coalesce(jsonb_typeof(candidate->'objectives'), '') <> 'array'
     or coalesce(jsonb_typeof(candidate->'resources'), '') <> 'object'
     or coalesce(jsonb_typeof(candidate->'interactionBoundaries'), '') <> 'array'
     or jsonb_array_length(candidate->'interactionBoundaries') < 1
     or coalesce(jsonb_typeof(candidate->'customState'), '') <> 'object' then
    return false;
  end if;

  for item in select value from jsonb_array_elements(candidate->'facts') loop
    id := item->>'id';
    if coalesce(jsonb_typeof(item), '') <> 'object'
       or coalesce(id, '') !~ '^[a-z0-9][a-z0-9._-]*$'
       or length(trim(coalesce(item->>'statement', ''))) = 0
       or coalesce(item->>'scope', '') not in ('ACCOUNT_PRIVATE', 'CONTINUITY_PRIVATE', 'SHARED')
       or length(trim(coalesce(item->>'provenance', ''))) = 0
       or coalesce(item->>'lifecycle', '') not in ('ACTIVE', 'SUPERSEDED', 'REMOVED')
       or coalesce(id, '') = any(fact_ids) then
      return false;
    end if;
    fact_ids := array_append(fact_ids, id);
  end loop;
  for item in select value from jsonb_array_elements(candidate->'characters') loop
    id := item->>'id';
    if coalesce(jsonb_typeof(item), '') <> 'object'
       or coalesce(id, '') !~ '^[a-z0-9][a-z0-9._-]*$'
       or length(trim(coalesce(item->>'name', ''))) = 0
       or length(trim(coalesce(item->>'role', ''))) = 0
       or length(trim(coalesce(item->>'currentState', ''))) = 0
       or coalesce(id, '') = any(character_ids)
       or coalesce(jsonb_typeof(item->'knownFactIds'), '') <> 'array' then
      return false;
    end if;
    character_ids := array_append(character_ids, id);
    for id in select jsonb_array_elements_text(item->'knownFactIds') loop
      if not (coalesce(id, '') = any(fact_ids)) then return false; end if;
    end loop;
  end loop;
  for item in select value from jsonb_array_elements(candidate->'interactionBoundaries') loop
    if coalesce(jsonb_typeof(item), '') <> 'string' or length(trim(item #>> '{}')) = 0 then return false; end if;
  end loop;
  return true;
end;
$$;

create function simulora.validate_state_revision_document() returns trigger
language plpgsql as $$
begin
  if not simulora.valid_state_revision_document(new.document) then
    raise exception 'State Revision document is not a valid authoritative runtime state';
  end if;
  return new;
end;
$$;

create function simulora.validate_world_revision_authority() returns trigger
language plpgsql as $$
declare
  run_world uuid;
  run_draft integer;
  run_outcome text;
  draft_document jsonb;
  draft_hash text;
  draft_version integer;
begin
  if not simulora.valid_world_revision_document(new.document) then
    raise exception 'World Revision document is not a playable World definition';
  end if;
  if new.document_hash <> encode(
       sha256(convert_to(simulora.canonical_jsonb_text(new.document), 'UTF8')), 'hex') then
    raise exception 'World Revision document_hash does not match document';
  end if;
  select world_id, draft_row_version, outcome
    into run_world, run_draft, run_outcome
    from simulora.authoring_validation_runs where id = new.validation_run_id;
  select document, document_hash, row_version
    into draft_document, draft_hash, draft_version
    from simulora.world_drafts where world_id = new.world_id;
  if run_world is distinct from new.world_id
     or run_draft is distinct from new.source_draft_row_version
     or run_outcome is distinct from 'VALID'
     or draft_version is distinct from new.source_draft_row_version
     or draft_document is null
     or draft_document is distinct from new.document
     or draft_hash <> new.document_hash
     or not simulora.valid_world_revision_document(draft_document)
     or draft_hash <> encode(
          sha256(convert_to(simulora.canonical_jsonb_text(draft_document), 'UTF8')), 'hex') then
    raise exception 'World Revision validation provenance does not match its World Draft';
  end if;
  return new;
end;
$$;

create trigger world_revision_authority_integrity
before insert on simulora.world_revisions
for each row execute function simulora.validate_world_revision_authority();

create trigger state_revision_document_integrity
before insert on simulora.state_revisions
for each row execute function simulora.validate_state_revision_document();

-- Continuity ownership is not equated with World ownership.  Owner access is
-- implicit; future shared Worlds use this explicit grant seam without adding
-- a second truth model or changing the current single-user API.
create table if not exists simulora.world_access_grants (
  world_id uuid not null references simulora.worlds(id),
  account_id uuid not null references simulora.accounts(id),
  role text not null check (role in ('PARTICIPANT', 'VIEWER')),
  status text not null check (status in ('ACTIVE', 'REVOKED')),
  created_at timestamptz not null default now(),
  revoked_at timestamptz,
  primary key (world_id, account_id)
);
create index if not exists world_access_grants_account_idx
  on simulora.world_access_grants(account_id, world_id) where status = 'ACTIVE';

create function simulora.validate_continuity_world_access() returns trigger
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
         and grant_row.status = 'ACTIVE'
     ) then
    raise exception 'Continuity owner requires explicit access to the World';
  end if;
  return new;
end;
$$;
create trigger continuity_world_access_integrity
before insert or update of owner_account_id, world_revision_id on simulora.continuities
for each row execute function simulora.validate_continuity_world_access();

-- Derived projection payloads must carry the identity of their own row.
create or replace function simulora.validate_orientation_projection_write() returns trigger
language plpgsql as $$
declare
  projection_continuity uuid;
  projection_world_revision uuid;
  branch_head uuid;
  source_branch uuid;
begin
  if new.source_head_commit_id is null or new.payload is null then
    raise exception 'Orientation projection requires source head and payload';
  end if;
  select continuity_id, head_commit_id into projection_continuity, branch_head
    from simulora.branches where id = new.branch_id;
  select branch_id into source_branch
    from simulora.world_commits where id = new.source_head_commit_id;
  select world_revision_id into projection_world_revision
    from simulora.continuities where id = projection_continuity;
  if source_branch is distinct from new.branch_id then
    raise exception 'Orientation projection source Commit must belong to its Branch';
  end if;
  if new.payload->'continuity'->>'id' is distinct from projection_continuity::text
     or new.payload->'continuity'->>'branchId' is distinct from new.branch_id::text
     or new.payload->'continuity'->>'worldRevisionId' is distinct from projection_world_revision::text then
    raise exception 'Orientation projection payload identity must match its Branch and Continuity';
  end if;
  if new.status = 'FRESH' then
    if new.rebuilt_at is null then
      raise exception 'Fresh orientation projection requires rebuilt_at';
    end if;
    if new.source_head_commit_id is distinct from branch_head then
      raise exception 'Fresh orientation projection must name the current Branch head';
    end if;
  end if;
  return new;
end;
$$;

-- The application already checks this before switching.  Keep the same
-- invariant at the authoritative database boundary for direct SQL/concurrency.
create function simulora.prevent_pending_active_branch_switch() returns trigger
language plpgsql as $$
begin
  if new.active_branch_id is distinct from old.active_branch_id
     and old.active_branch_id is not null
     and exists (
       select 1 from simulora.actions
       where branch_id = old.active_branch_id
         and status in ('ACKNOWLEDGED', 'GENERATING', 'VALIDATING',
                        'AWAITING_CONFIRMATION', 'COMMITTING', 'FAILED_RECOVERABLE')
     ) then
    raise exception 'Cannot switch Branch while an unresolved Action remains on the current path';
  end if;
  return new;
end;
$$;
create trigger continuity_pending_branch_switch
before update of active_branch_id on simulora.continuities
for each row execute function simulora.prevent_pending_active_branch_switch();

-- One unresolved ordinary Action may occupy a Branch/head.  CONFLICT is kept
-- visible but no longer owns generation authority, so a corrected path can
-- continue after the conflict is surfaced.
create unique index actions_one_unresolved_participate_head_idx
  on simulora.actions(branch_id, expected_head_commit_id)
  where operation_type = 'PARTICIPATE'
    and status in ('ACKNOWLEDGED', 'GENERATING', 'VALIDATING',
                   'AWAITING_CONFIRMATION', 'COMMITTING', 'FAILED_RECOVERABLE');

-- Stale work must be fenced before it reaches the generator.
create or replace function simulora.validate_action_status_transition() returns trigger
language plpgsql as $$
begin
  if new.status in ('COMMITTED', 'CANCELLED', 'SUPERSEDED') and new.terminal_at is null then
    raise exception 'Terminal Action requires terminal_at';
  end if;
  if new.status not in ('COMMITTED', 'CANCELLED', 'SUPERSEDED') and new.terminal_at is not null then
    raise exception 'Non-terminal Action cannot carry terminal_at';
  end if;
  if new.status = old.status then
    if new.terminal_at is distinct from old.terminal_at
       or (new.status in ('COMMITTED', 'CANCELLED', 'SUPERSEDED')
           and new.status_reason is distinct from old.status_reason) then
      raise exception 'Terminal Action evidence is immutable';
    end if;
    return new;
  end if;
  if old.status in ('COMMITTED', 'CANCELLED', 'SUPERSEDED') then
    raise exception 'Terminal Action cannot return to processing';
  end if;
  if not (
    (old.status in ('ACKNOWLEDGED', 'GENERATING') and new.status in ('GENERATING', 'CONFLICT', 'CANCELLED')) or
    (old.status = 'GENERATING' and new.status in ('VALIDATING', 'FAILED_RECOVERABLE', 'CONFLICT', 'CANCELLED')) or
    (old.status = 'VALIDATING' and new.status in ('AWAITING_CONFIRMATION', 'COMMITTING', 'FAILED_RECOVERABLE', 'CANCELLED')) or
    (old.status = 'AWAITING_CONFIRMATION' and new.status in ('COMMITTING', 'CONFLICT', 'FAILED_RECOVERABLE', 'CANCELLED')) or
    (old.status = 'COMMITTING' and new.status in ('COMMITTED', 'CONFLICT', 'FAILED_RECOVERABLE', 'CANCELLED')) or
    (old.status = 'FAILED_RECOVERABLE' and new.status in ('GENERATING', 'CANCELLED')) or
    (old.status = 'CONFLICT' and new.status = 'SUPERSEDED')
  ) then
    raise exception 'Invalid Action status transition: % to %', old.status, new.status;
  end if;
  if new.status = 'COMMITTED'
     and not exists (select 1 from simulora.world_commits where action_id = new.id) then
    raise exception 'Committed Action requires exactly one linked Commit';
  end if;
  return new;
end;
$$;
