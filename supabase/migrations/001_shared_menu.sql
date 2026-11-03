-- Run as postgres in the Supabase SQL editor. No service-role key is used by the app.
begin;
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
create table if not exists private.menu_staff (
  user_id uuid primary key references auth.users(id) on delete cascade
);
create table if not exists private.menu_revisions (
  id bigint generated always as identity primary key,
  content jsonb not null,
  actor uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create table if not exists private.menu_state (
  id boolean primary key default true check (id),
  draft jsonb not null,
  version integer not null default 1,
  published_id bigint not null references private.menu_revisions(id),
  updated_at timestamptz not null default now()
);
alter table private.menu_staff enable row level security;
alter table private.menu_state enable row level security;
alter table private.menu_revisions enable row level security;
revoke all on all tables in schema private from public, anon, authenticated;

create or replace function private.require_menu_staff() returns void
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null or not exists (
    select 1 from private.menu_staff s join auth.users u on u.id = s.user_id
    where s.user_id = auth.uid() and u.email_confirmed_at is not null
  ) then raise exception 'STAFF_REQUIRED' using errcode = '42501'; end if;
end $$;

create or replace function private.validate_menu(document jsonb) returns void
language plpgsql set search_path = '' as $$
begin
  if document is null or jsonb_typeof(document) <> 'object'
    or jsonb_typeof(document->'items') is distinct from 'array'
    or jsonb_typeof(document->'categories') is distinct from 'array'
    or jsonb_typeof(document->'slides') is distinct from 'array'
    or octet_length(document::text) > 2000000 then raise exception 'INVALID_MENU'; end if;
  if jsonb_array_length(document->'items') > 2000 or jsonb_array_length(document->'categories') > 200
    or jsonb_array_length(document->'slides') > 30 then raise exception 'INVALID_MENU'; end if;
  if exists (select 1 from jsonb_array_elements(document->'categories') c where
    jsonb_typeof(c->'id') is distinct from 'string' or coalesce(c->>'id','') !~ '^[a-zA-Z0-9_-]{1,80}$'
    or jsonb_typeof(c->'name') is distinct from 'string' or length(trim(c->>'name')) not between 1 and 100
    or (c ? 'icon' and (jsonb_typeof(c->'icon') <> 'string' or length(c->>'icon') > 100)))
    or exists (select 1 from jsonb_array_elements(document->'categories') c group by c->>'id' having count(*) > 1)
    or exists (select 1 from jsonb_array_elements(document->'categories') c group by c->>'name' having count(*) > 1)
    then raise exception 'INVALID_CATEGORIES'; end if;
  if exists (select 1 from jsonb_array_elements(document->'items') i where
    jsonb_typeof(i->'id') is distinct from 'string' or coalesce(i->>'id','') !~ '^[a-zA-Z0-9_-]{1,80}$'
    or jsonb_typeof(i->'name') is distinct from 'string' or length(trim(i->>'name')) not between 1 and 120
    or jsonb_typeof(i->'price') is distinct from 'number' or (i->>'price')::numeric < 0
    or (i->>'price')::numeric > 999999999 or (i->>'price')::numeric <> trunc((i->>'price')::numeric)
    or jsonb_typeof(i->'available') is distinct from 'boolean'
    or jsonb_typeof(i->'size') is distinct from 'string' or length(i->>'size') > 100
    or jsonb_typeof(i->'description') is distinct from 'string' or length(i->>'description') > 3000
    or jsonb_typeof(i->'shortDescription') is distinct from 'string' or length(i->>'shortDescription') > 240
    or jsonb_typeof(i->'addOn') is distinct from 'string' or length(i->>'addOn') > 300
    or not exists (select 1 from jsonb_array_elements(document->'categories') c where c->>'name' = i->>'category'))
    or exists (select 1 from jsonb_array_elements(document->'items') i group by i->>'id' having count(*) > 1)
    then raise exception 'INVALID_DISHES'; end if;
  if exists (select 1 from jsonb_array_elements(document->'slides') s where
    jsonb_typeof(s->'id') is distinct from 'string' or coalesce(s->>'id','') !~ '^[a-zA-Z0-9_-]{1,80}$'
    or jsonb_typeof(s->'alt') is distinct from 'string' or length(s->>'alt') > 240
    or jsonb_typeof(s->'src') is distinct from 'string' or length(s->>'src') = 0)
    or exists (select 1 from jsonb_array_elements(document->'slides') s group by s->>'id' having count(*) > 1)
    then raise exception 'INVALID_SLIDES'; end if;
  -- This milestone uses existing local images only; arbitrary remote/data URLs are rejected.
  if exists (select 1 from (
    select i->>'image' as src from jsonb_array_elements(document->'items') i
    union all select c->>'image' from jsonb_array_elements(document->'categories') c
    union all select s->>'src' from jsonb_array_elements(document->'slides') s
  ) images where coalesce(src,'') <> '' and (src !~ '^/(menu|hero)/[a-zA-Z0-9._-]+$' or src like '%..%'))
    then raise exception 'INVALID_IMAGE'; end if;
end $$;

create or replace function public.menu_admin_read() returns jsonb
language plpgsql security definer set search_path = '' as $$
declare result jsonb;
begin
  perform private.require_menu_staff();
  select jsonb_build_object('draft',s.draft,'version',s.version,'baseline',r.content,
    'publishedId',r.id,'publishedAt',r.created_at) into result
    from private.menu_state s join private.menu_revisions r on r.id=s.published_id where s.id;
  if result is null then raise exception 'MENU_NOT_INITIALIZED'; end if;
  return result;
end $$;

create or replace function public.menu_save(value jsonb, expected_version integer) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare current_state private.menu_state;
begin
  perform private.require_menu_staff();
  perform private.validate_menu(value);
  select * into current_state from private.menu_state where id for update;
  if current_state.version is distinct from expected_version then raise exception 'VERSION_CONFLICT' using errcode='40001'; end if;
  update private.menu_state set draft=value,version=version+1,updated_at=now() where id;
  return public.menu_admin_read();
end $$;

create or replace function public.menu_publish(expected_version integer) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare current_state private.menu_state; revision_id bigint;
begin
  perform private.require_menu_staff();
  select * into current_state from private.menu_state where id for update;
  if current_state.version is distinct from expected_version then raise exception 'VERSION_CONFLICT' using errcode='40001'; end if;
  perform private.validate_menu(current_state.draft);
  insert into private.menu_revisions(content,actor) values(current_state.draft,auth.uid()) returning id into revision_id;
  update private.menu_state set published_id=revision_id,version=version+1,updated_at=now() where id;
  return public.menu_admin_read();
end $$;

create or replace function public.menu_public_read() returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object('content',r.content,'revision',r.id,'publishedAt',r.created_at)
  from private.menu_state s join private.menu_revisions r on r.id=s.published_id where s.id;
$$;

create or replace function public.menu_history() returns jsonb
language plpgsql security definer set search_path = '' as $$
declare result jsonb;
begin
  perform private.require_menu_staff();
  select coalesce(jsonb_agg(row_to_json(r)), '[]'::jsonb) into result from (
    select id,created_at from private.menu_revisions order by id desc limit 20
  ) r;
  return result;
end $$;

-- Restoring creates a draft for review; the live revision stays unchanged until Publish.
create or replace function public.menu_restore(revision_id bigint, expected_version integer) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare current_state private.menu_state; previous_content jsonb;
begin
  perform private.require_menu_staff();
  select * into current_state from private.menu_state where id for update;
  if current_state.version is distinct from expected_version then raise exception 'VERSION_CONFLICT' using errcode='40001'; end if;
  select content into previous_content from private.menu_revisions where id=revision_id;
  if previous_content is null then raise exception 'INVALID_REVISION'; end if;
  perform private.validate_menu(previous_content);
  update private.menu_state set draft=previous_content,version=version+1,updated_at=now() where id;
  return public.menu_admin_read();
end $$;

revoke all on function private.require_menu_staff() from public,anon,authenticated;
revoke all on function private.validate_menu(jsonb) from public,anon,authenticated;
revoke all on function public.menu_admin_read() from public,anon,authenticated;
revoke all on function public.menu_save(jsonb,integer) from public,anon,authenticated;
revoke all on function public.menu_publish(integer) from public,anon,authenticated;
revoke all on function public.menu_public_read() from public,anon,authenticated;
revoke all on function public.menu_history() from public,anon,authenticated;
revoke all on function public.menu_restore(bigint,integer) from public,anon,authenticated;
grant execute on function public.menu_admin_read(), public.menu_save(jsonb,integer), public.menu_publish(integer) to authenticated;
grant execute on function public.menu_public_read() to anon,authenticated;
grant execute on function public.menu_history(), public.menu_restore(bigint,integer) to authenticated;
notify pgrst, 'reload schema';
commit;
