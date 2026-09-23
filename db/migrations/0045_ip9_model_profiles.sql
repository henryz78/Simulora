-- IP-9 model hardening. A Generation Attempt records the capability profile it
-- was routed to, so provider output can be compared before and after a model
-- change without treating it as history. Profile activations are an append-only
-- record, and a material change publishes a MODEL product-change notice.

alter table simulora.generation_attempts
  add column profile_id text,
  add column profile_version text;

-- Earlier attempts keep a null profile: their `adapter` column already says they
-- were deterministic, and attempt identity is immutable under the IP-6 trigger.
alter table simulora.generation_attempts
  add constraint generation_attempts_profile_check check (
    (profile_id is null) = (profile_version is null)
    and adapter in ('deterministic', 'openai-compatible')
  ) not valid;

create table simulora.model_profile_activations (
  id uuid primary key,
  sequence bigint generated always as identity unique,
  profile_id text not null check (length(trim(profile_id)) > 0),
  profile_version text not null check (length(trim(profile_version)) > 0),
  adapter text not null check (adapter in ('deterministic', 'openai-compatible')),
  model text,
  prompt_version integer not null check (prompt_version >= 0),
  -- A digest of the full profile, so any field change is a new activation.
  profile_digest text not null check (profile_digest ~ '^[0-9a-f]{64}$'),
  fallback_profile text,
  material boolean not null,
  previous_activation_id uuid references simulora.model_profile_activations(id),
  product_change_id uuid references simulora.product_changes(id),
  activated_at timestamptz not null default now(),
  check (not material or product_change_id is not null)
);

create trigger model_profile_activations_immutable
before update or delete on simulora.model_profile_activations
for each row execute function simulora.reject_immutable_change();
