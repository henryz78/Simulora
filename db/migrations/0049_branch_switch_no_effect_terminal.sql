-- Branch switching treats a response-only Action as resolved.
--
-- 0034 added the terminal status COMPLETED_NO_EFFECT, and the application
-- guard in `selectBranch` counts it as resolved. The SQL guard from 0028
-- was never updated, so a single response-only Action made every later
-- Branch switch fail. Found by IP-10.3 LONG-01.
--
-- The latest definition (0028) is copied verbatim apart from the added
-- status. The trigger binding from 0026 still points at this function.

create or replace function simulora.prevent_pending_active_branch_switch() returns trigger
language plpgsql as $$
begin
  if new.active_branch_id is distinct from old.active_branch_id
     and old.active_branch_id is not null
     and exists (
       select 1 from simulora.actions
        where branch_id = old.active_branch_id
          and status not in ('COMMITTED', 'COMPLETED_NO_EFFECT', 'CANCELLED', 'SUPERSEDED')
     ) then
    raise exception 'Cannot switch Branch while an unresolved Action remains on the current path';
  end if;
  return new;
end;
$$;
