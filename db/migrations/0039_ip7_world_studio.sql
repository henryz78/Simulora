-- IP-7 activates the creator path without changing World/Continuity authority.
update app_meta.foundation_metadata
set value = jsonb_set(value, '{phase}', '"IP-7"'::jsonb)
where key = 'implementation_phase';
