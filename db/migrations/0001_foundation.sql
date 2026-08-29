create schema if not exists app_meta;

create table if not exists app_meta.foundation_metadata (
  key text primary key,
  value jsonb not null,
  created_at timestamptz not null default now()
);

insert into app_meta.foundation_metadata (key, value)
values (
  'implementation_phase',
  '{"phase":"IP-1","productSemanticsStarted":false}'::jsonb
)
on conflict (key) do update
set value = excluded.value;
