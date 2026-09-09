-- Gate G5 final authority hardening: initialized paths cannot be reset, and
-- ownership/pinned World identity cannot be reassigned outside an explicit
-- future lifecycle command.

create function simulora.protect_world_identity() returns trigger
language plpgsql as $$
begin
  if new.owner_account_id is distinct from old.owner_account_id
     or new.created_at is distinct from old.created_at then
    raise exception 'World ownership and identity are immutable';
  end if;
  return new;
end;
$$;

create trigger world_identity_immutable
before update on simulora.worlds
for each row execute function simulora.protect_world_identity();

create function simulora.protect_continuity_identity_and_lifecycle() returns trigger
language plpgsql as $$
begin
  if tg_op = 'UPDATE' then
    if new.owner_account_id is distinct from old.owner_account_id
       or new.world_revision_id is distinct from old.world_revision_id
       or new.created_at is distinct from old.created_at then
      raise exception 'Continuity ownership, pinned World Revision and identity are immutable';
    end if;
    if old.status = 'ACTIVE' and new.status is distinct from 'ACTIVE' then
      raise exception 'Active Continuity lifecycle cannot return to initialization';
    end if;
  end if;

  return new;
end;
$$;

create trigger continuity_identity_and_lifecycle_integrity
before insert or update on simulora.continuities
for each row execute function simulora.protect_continuity_identity_and_lifecycle();

create function simulora.protect_initialized_branch_lifecycle() returns trigger
language plpgsql as $$
begin
  if old.status = 'ACTIVE' and new.status is distinct from 'ACTIVE' then
    raise exception 'Active Branch lifecycle cannot return to initialization';
  end if;
  if old.head_commit_id is not null
     and (new.head_commit_id is null or new.head_state_revision_id is null) then
    raise exception 'Initialized Branch heads cannot be cleared';
  end if;
  return new;
end;
$$;

create trigger initialized_branch_lifecycle_integrity
before update of status, head_commit_id, head_state_revision_id on simulora.branches
for each row execute function simulora.protect_initialized_branch_lifecycle();
