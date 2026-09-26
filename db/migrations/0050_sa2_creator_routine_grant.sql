-- SA-2 / ADR-SA2: the World owner may grant routine movement inside the
-- Revision document. `routineMovers` names the Characters that may move on
-- their own; `routineRoutes[].permitsRoutineMovement` marks the routes they
-- may use. The database derives that Revision's RE-3 policy from the document
-- at insert, so an authored route alone, prose, a model or a participant
-- still grants nothing. Enforcement downstream is unchanged.

alter function simulora.valid_world_revision_document(jsonb) rename to valid_world_revision_document_pre_sa2;
create function simulora.valid_world_revision_document(candidate jsonb) returns boolean
language plpgsql immutable strict as $$
declare
  item jsonb;
  stripped_routes jsonb;
  movers jsonb;
begin
  if coalesce(jsonb_typeof(candidate), '') <> 'object' then
    return simulora.valid_world_revision_document_pre_sa2(candidate);
  end if;
  if candidate ? 'routineRoutes' and jsonb_typeof(candidate->'routineRoutes') = 'array' then
    for item in select value from jsonb_array_elements(candidate->'routineRoutes') loop
      if item ? 'permitsRoutineMovement'
         and coalesce(jsonb_typeof(item->'permitsRoutineMovement'), '') <> 'boolean' then
        return false;
      end if;
    end loop;
    select coalesce(jsonb_agg(
        case when jsonb_typeof(route) = 'object' then route - 'permitsRoutineMovement' else route end
        order by position), '[]'::jsonb)
      into stripped_routes
      from jsonb_array_elements(candidate->'routineRoutes') with ordinality as r(route, position);
    if not simulora.valid_world_revision_document_pre_sa2(
      jsonb_set(candidate - 'routineMovers', '{routineRoutes}', stripped_routes)
    ) then return false; end if;
  elsif not simulora.valid_world_revision_document_pre_sa2(candidate - 'routineMovers') then
    return false;
  end if;

  movers := coalesce(candidate->'routineMovers', '[]'::jsonb);
  if coalesce(jsonb_typeof(movers), '') <> 'array'
     or not simulora.valid_stable_id_array(movers)
     or (select count(distinct value) from jsonb_array_elements(movers)) <> jsonb_array_length(movers)
     or exists (
       select 1 from jsonb_array_elements(movers) mover
       where not exists (
         select 1 from jsonb_array_elements(candidate->'characters') character
         where character->'id' = mover
       )
     ) then
    return false;
  end if;
  -- Movers exist exactly when at least one route is open to them.
  return (jsonb_array_length(movers) > 0) = exists (
    select 1 from jsonb_array_elements(coalesce(candidate->'routineRoutes', '[]'::jsonb)) route
    where route->'permitsRoutineMovement' = 'true'::jsonb
  );
end;
$$;

create function simulora.grant_creator_routine_policy() returns trigger
language plpgsql as $$
declare
  routes jsonb;
  places jsonb;
begin
  if jsonb_array_length(coalesce(new.document->'routineMovers', '[]'::jsonb)) = 0 then
    return new;
  end if;
  select coalesce(jsonb_agg(jsonb_build_object(
      'fromLocationId', route->'fromLocationId',
      'toLocationId', route->'toLocationId',
      'label', route->'label') order by position), '[]'::jsonb)
    into routes
    from jsonb_array_elements(new.document->'routineRoutes') with ordinality as r(route, position)
    where route->'permitsRoutineMovement' = 'true'::jsonb;
  select coalesce(jsonb_agg(place order by place), '[]'::jsonb)
    into places
    from (
      select distinct route->>'fromLocationId' as place from jsonb_array_elements(routes) route
      union
      select route->>'toLocationId' from jsonb_array_elements(routes) route
    ) endpoints;
  -- The RE-3 shape trigger validates the row and computes its digest.
  insert into simulora.re3_routine_policies (world_revision_id, document, digest)
  values (
    new.id,
    jsonb_build_object(
      'version', 're3-routine-v1',
      'npcIds', new.document->'routineMovers',
      'publicLocationIds', places,
      'routes', routes
    ),
    ''
  );
  return new;
end;
$$;
create trigger world_revision_creator_routine_grant after insert on simulora.world_revisions
for each row execute function simulora.grant_creator_routine_policy();
