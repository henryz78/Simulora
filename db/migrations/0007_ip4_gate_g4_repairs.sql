create or replace function simulora.validate_orientation_projection_write() returns trigger
language plpgsql as $$
declare
  v_branch_head uuid;
  v_source_branch uuid;
begin
  if new.source_head_commit_id is null or new.payload is null then
    raise exception 'Orientation projection requires source head and payload';
  end if;

  select head_commit_id into v_branch_head
    from simulora.branches where id = new.branch_id;
  select branch_id into v_source_branch
    from simulora.world_commits where id = new.source_head_commit_id;

  if v_source_branch is distinct from new.branch_id then
    raise exception 'Orientation projection source Commit must belong to its Branch';
  end if;
  if new.status = 'FRESH' then
    if new.rebuilt_at is null then
      raise exception 'Fresh orientation projection requires rebuilt_at';
    end if;
    if new.source_head_commit_id is distinct from v_branch_head then
      raise exception 'Fresh orientation projection must name the current Branch head';
    end if;
  end if;
  return new;
end;
$$;

comment on function simulora.validate_orientation_projection_write() is
  'Enforces projection Branch ownership and the FRESH-to-current-head invariant.';
