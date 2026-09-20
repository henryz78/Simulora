-- IP-8 repair: a confirmed deletion must be able to tombstone an ACTIVE Continuity.
--
-- 0014 froze the Continuity lifecycle so an ACTIVE Continuity could never leave
-- ACTIVE, which was correct while INITIALIZING and ACTIVE were the only states.
-- 0040 added TOMBSTONED to the status check but left that trigger unchanged, so
-- deletion confirmation failed against real PostgreSQL. This successor allows the
-- single new transition and makes a tombstone terminal.

create or replace function simulora.protect_continuity_identity_and_lifecycle() returns trigger
language plpgsql as $$
begin
  if tg_op = 'UPDATE' then
    if new.owner_account_id is distinct from old.owner_account_id
       or new.world_revision_id is distinct from old.world_revision_id
       or new.created_at is distinct from old.created_at then
      raise exception 'Continuity ownership, pinned World Revision and identity are immutable';
    end if;
    if old.status = 'TOMBSTONED' and new.status is distinct from 'TOMBSTONED' then
      raise exception 'A tombstoned Continuity cannot be reactivated';
    end if;
    if old.status = 'ACTIVE' and new.status not in ('ACTIVE', 'TOMBSTONED') then
      raise exception 'Active Continuity lifecycle cannot return to initialization';
    end if;
  end if;

  return new;
end;
$$;
