-- TB-1 review repairs.
--  * The outcome epoch is the ledger's applied_at for 0051 (0052). The ledger
--    stays writable for the recovery rehearsal's checksum probe, but that row's
--    name and applied_at may no longer change, and it may not be deleted.
--  * Fail closed when the RE-2 context alone leaves no room for the empty
--    `committedOutcomes`, rather than exceed the 48,000 byte bound.

create function simulora.tb1_reject_epoch_change() returns trigger
language plpgsql as $$
begin
  if old.name <> '0051_tb1_committed_outcome_context.sql' then
    if tg_op = 'DELETE' then return old; end if;
    return new;
  end if;
  if tg_op = 'DELETE' then
    raise exception 'The TB-1 outcome epoch is immutable' using errcode = '55000';
  end if;
  if new.name is distinct from old.name or new.applied_at is distinct from old.applied_at then
    raise exception 'The TB-1 outcome epoch is immutable' using errcode = '55000';
  end if;
  return new;
end;
$$;

-- Schema-only checks apply migrations without the runner's ledger.
do $$
begin
  if to_regclass('app_meta.schema_migrations') is not null then
    create trigger tb1_outcome_epoch_immutable
    before update or delete on app_meta.schema_migrations
    for each row execute function simulora.tb1_reject_epoch_change();
  end if;
end;
$$;

alter function simulora.re2_generation_context(uuid) rename to re2_generation_context_tb1_unbounded;
create function simulora.re2_generation_context(action_id uuid) returns jsonb
language plpgsql stable strict as $$
declare
  context jsonb := simulora.re2_generation_context_tb1_unbounded(action_id);
begin
  if octet_length(simulora.canonical_jsonb_text(context)) > 48000 then return null; end if;
  return context;
end;
$$;
