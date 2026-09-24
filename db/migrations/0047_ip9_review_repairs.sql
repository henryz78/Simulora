-- IP-9 review repairs.
--
-- An upload holds its export under a lease of its own, separate from the retry
-- backoff in storage_available_at. A deletion clears the backoff but keeps a
-- running lease, so an object is never deleted underneath an upload that could
-- still land, and a retry backoff never delays a deletion.
alter table simulora.export_jobs
  add column storage_lease_until timestamptz;

-- A profile activation records the provider origin it routes to, so moving the
-- same model name to another provider is recorded as a change and can be judged
-- material. Earlier activations keep a null provider; no row is updated, so the
-- append-only trigger is untouched.
alter table simulora.model_profile_activations
  add column provider text check (provider is null or length(trim(provider)) > 0);
