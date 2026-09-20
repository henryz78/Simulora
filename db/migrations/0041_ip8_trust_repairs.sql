-- IP-8 repair: bind exports to a reviewed reservation and keep artifacts durable.

alter table simulora.product_changes
  add column affected_scopes jsonb not null default '["ACCOUNT"]'::jsonb,
  add column effective_at timestamptz not null default now(),
  add column available_choices jsonb not null default '["REVIEW"]'::jsonb;

update simulora.product_changes
set affected_scopes = '["ACCOUNT", "WORLD", "EXPORT"]'::jsonb,
    effective_at = published_at,
    available_choices = '["REVIEW_ACCESS", "EXPORT_SELECTED_SCOPE", "OPEN_APPEAL"]'::jsonb
where version = 'IP-8-TRUST-LIFECYCLE-V1';

alter table simulora.export_jobs
  add column reservation_id uuid references simulora.usage_reservations(id),
  add column artifact_bytes bytea;

create index export_jobs_reservation_idx on simulora.export_jobs(reservation_id);
