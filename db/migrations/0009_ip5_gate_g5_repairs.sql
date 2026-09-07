-- Gate G5 repairs: a Restore Commit may only advance the active Branch.
-- Application transactions serialize on the Continuity row; this trigger keeps
-- the same invariant at the database authority boundary.

create or replace function simulora.validate_restore_commit_binding() returns trigger
language plpgsql as $$
declare
  proposal_branch uuid;
  proposal_actor uuid;
  proposal_head uuid;
  proposal_status text;
  current_head uuid;
  active_branch uuid;
begin
  if new.kind <> 'RESTORE_COMMITTED' then return new; end if;
  select branch_id, actor_account_id, expected_head_commit_id, status
    into proposal_branch, proposal_actor, proposal_head, proposal_status
    from simulora.restore_proposals where id = new.restore_proposal_id;
  select branch.head_commit_id, continuity.active_branch_id
    into current_head, active_branch
    from simulora.branches branch
    join simulora.continuities continuity on continuity.id = branch.continuity_id
    where branch.id = new.branch_id;
  if proposal_branch is distinct from new.branch_id
     or proposal_actor is distinct from new.actor_account_id
     or proposal_head is distinct from new.parent_commit_id
     or proposal_status is distinct from 'CONFIRMED'
     or current_head is distinct from new.parent_commit_id
     or active_branch is distinct from new.branch_id then
    raise exception 'Restore Commit requires exact confirmed proposal on the active Branch and current expected head';
  end if;
  return new;
end;
$$;
