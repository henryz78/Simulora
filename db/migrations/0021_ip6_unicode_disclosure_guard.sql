-- Keep the database disclosure guard aligned with the application boundary:
-- short and non-ASCII facts are protected too.

create or replace function simulora.generated_output_references_excluded_fact(
  output_text text,
  parent_document jsonb,
  included_fact_ids jsonb
) returns boolean
language plpgsql stable as $$
declare
  fact jsonb;
  exact_output text := lower(normalize(coalesce(output_text, ''), NFKC));
  normalized_output text := trim(regexp_replace(
    exact_output, '[^[:alnum:]]+', ' ', 'g'
  ));
  exact_fact text;
  normalized_fact text;
begin
  if exact_output = '' then return false; end if;
  for fact in
    select value from jsonb_array_elements(coalesce(parent_document->'facts', '[]'::jsonb)) as item(value)
  loop
    if exists (
      select 1
      from jsonb_array_elements_text(coalesce(included_fact_ids, '[]'::jsonb)) as allowed(id)
      where allowed.id = fact->>'id'
    ) then
      continue;
    end if;
    exact_fact := lower(normalize(coalesce(fact->>'statement', ''), NFKC));
    normalized_fact := trim(regexp_replace(exact_fact, '[^[:alnum:]]+', ' ', 'g'));
    if exact_fact <> '' and (
      position(exact_fact in exact_output) > 0
      or (
        normalized_fact <> ''
        and position(normalized_fact in normalized_output) > 0
      )
    ) then
      return true;
    end if;
  end loop;
  return false;
end;
$$;
