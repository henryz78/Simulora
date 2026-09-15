-- Direct commands validate synchronously and legitimately move from durable
-- acknowledgement to validation without a model-generation phase.
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
    (old.status in ('ACKNOWLEDGED', 'GENERATING') and new.status in ('GENERATING', 'VALIDATING', 'CONFLICT', 'CANCELLED')) or
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
