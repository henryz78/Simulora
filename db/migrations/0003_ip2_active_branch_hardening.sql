-- IP-2 follow-up hardening: an ACTIVE Continuity must always point at a
-- complete ACTIVE Branch head belonging to that Continuity.

create or replace function simulora.validate_active_branch() returns trigger
language plpgsql as $$
declare
  owning_continuity uuid;
  branch_status text;
  branch_head_commit uuid;
  branch_head_state uuid;
begin
  if new.status = 'ACTIVE' and new.active_branch_id is null then
    raise exception 'Active Continuity requires an active Branch';
  end if;

  if new.active_branch_id is not null then
    select continuity_id, status, head_commit_id, head_state_revision_id
      into owning_continuity, branch_status, branch_head_commit, branch_head_state
      from simulora.branches
     where id = new.active_branch_id;

    if owning_continuity is distinct from new.id then
      raise exception 'Active Branch must belong to its Continuity';
    end if;

    if new.status = 'ACTIVE'
       and (branch_status is distinct from 'ACTIVE'
            or branch_head_commit is null
            or branch_head_state is null) then
      raise exception 'Active Continuity requires an active Branch head';
    end if;
  end if;

  return new;
end;
$$;
