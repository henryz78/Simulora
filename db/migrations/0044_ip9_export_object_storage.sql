-- IP-9 starts production-shaped hardening. The first obligation it closes is
-- the one IP-8 recorded as accepted: export artifacts move from PostgreSQL into
-- S3-compatible object storage. PostgreSQL keeps identity, authorization,
-- lifecycle and checksum authority; `artifact_bytes` becomes a transient staging
-- buffer that is cleared once the object is stored or the export is revoked.

update app_meta.foundation_metadata
set value = jsonb_set(value, '{phase}', '"IP-9"'::jsonb)
where key = 'implementation_phase';

alter table simulora.export_jobs
  add column storage_state text not null default 'LEGACY_INLINE',
  add column storage_attempts integer not null default 0 check (storage_attempts >= 0),
  add column storage_last_error text
    check (storage_last_error is null or storage_last_error in (
      'OBJECT_STORE_UNAVAILABLE', 'OBJECT_INTEGRITY_FAILED'
    )),
  add column storage_available_at timestamptz,
  add column object_stored_at timestamptz,
  add column object_deleted_at timestamptz;

-- Revoked or failed exports must not keep their bytes. They move to
-- DELETE_PENDING so the worker also removes any object a crashed upload left.
update simulora.export_jobs
set storage_state = 'DELETE_PENDING', artifact_bytes = null
where status in ('REVOKED', 'FAILED');

alter table simulora.export_jobs
  add constraint export_jobs_storage_state_check check (
    storage_state in ('LEGACY_INLINE', 'STAGED', 'STORED', 'DELETE_PENDING', 'DELETED')
    and (storage_state <> 'STAGED' or (
      status = 'PENDING' and artifact_bytes is not null
      and checksum is not null and artifact_key is not null
    ))
    and (storage_state <> 'STORED' or (
      status = 'READY' and artifact_bytes is null
      and checksum is not null and artifact_key is not null and object_stored_at is not null
    ))
    and (storage_state not in ('DELETE_PENDING', 'DELETED') or (
      artifact_bytes is null and status in ('REVOKED', 'FAILED')
    ))
    and (storage_state <> 'DELETED' or object_deleted_at is not null)
  );

create index export_jobs_storage_work_idx
  on simulora.export_jobs(storage_available_at nulls first, created_at)
  where storage_state in ('STAGED', 'LEGACY_INLINE', 'DELETE_PENDING');

-- The checksum and object key are what a restore drill and a download verify
-- against, so they are fixed once written. Staged bytes may only be cleared,
-- never replaced, and the storage lifecycle only moves forward.
create or replace function simulora.protect_export_artifact_identity() returns trigger
language plpgsql as $$
begin
  if new.account_id is distinct from old.account_id
     or new.world_id is distinct from old.world_id
     or new.idempotency_key is distinct from old.idempotency_key
     or new.selected_scopes is distinct from old.selected_scopes
     or new.omitted_scopes is distinct from old.omitted_scopes
     or new.manifest is distinct from old.manifest
     or new.created_at is distinct from old.created_at then
    raise exception 'Export identity and manifest are immutable';
  end if;
  if (old.checksum is not null and new.checksum is distinct from old.checksum)
     or (old.artifact_key is not null and new.artifact_key is distinct from old.artifact_key) then
    raise exception 'Export checksum and object key are immutable once recorded';
  end if;
  if new.artifact_bytes is not null
     and new.artifact_bytes is distinct from old.artifact_bytes then
    raise exception 'Export staging bytes can only be cleared';
  end if;
  if new.storage_state is distinct from old.storage_state and not (
       (old.storage_state in ('LEGACY_INLINE', 'STAGED')
         and new.storage_state in ('STORED', 'DELETE_PENDING'))
    or (old.storage_state = 'STORED' and new.storage_state = 'DELETE_PENDING')
    or (old.storage_state = 'DELETE_PENDING' and new.storage_state = 'DELETED')
  ) then
    raise exception 'Export storage lifecycle cannot move from % to %',
      old.storage_state, new.storage_state;
  end if;
  return new;
end;
$$;

create trigger export_jobs_protect_artifact_identity
before update on simulora.export_jobs
for each row execute function simulora.protect_export_artifact_identity();
