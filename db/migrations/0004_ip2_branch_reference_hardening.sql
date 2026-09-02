-- IP-2 follow-up hardening: a Branch referenced by an ACTIVE Continuity
-- cannot be demoted, detached, or stripped of its authoritative heads.

create function simulora.validate_active_continuity_branch_reference() returns trigger
language plpgsql as $$
declare
  active_continuity_id uuid;
begin
  select id
    into active_continuity_id
    from simulora.continuities
   where active_branch_id = new.id
     and status = 'ACTIVE'
   limit 1;

  if active_continuity_id is not null
     and (new.continuity_id is distinct from active_continuity_id
          or new.status is distinct from 'ACTIVE'
          or new.head_commit_id is null
          or new.head_state_revision_id is null) then
    raise exception 'ACTIVE Continuity requires its Branch to remain active with complete heads';
  end if;

  return new;
end;
$$;

create constraint trigger active_continuity_branch_reference_integrity
after update of continuity_id, status, head_commit_id, head_state_revision_id
on simulora.branches
deferrable initially deferred
for each row execute function simulora.validate_active_continuity_branch_reference();
