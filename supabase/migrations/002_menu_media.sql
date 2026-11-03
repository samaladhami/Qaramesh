-- Run after 001_shared_menu.sql as postgres. Keeps all existing records and revisions.
begin;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('menu-media','menu-media',false,500000,array['image/webp'])
on conflict(id) do update set public=false,file_size_limit=500000,allowed_mime_types=array['image/webp'];

create or replace function private.menu_has_image(document jsonb,filename text) returns boolean
language sql immutable set search_path='' as $$
  select exists(select 1 from (
    select i->>'image' as src from jsonb_array_elements(document->'items') i
    union all select c->>'image' from jsonb_array_elements(document->'categories') c
    union all select s->>'src' from jsonb_array_elements(document->'slides') s
  ) images where src='/media/' || filename);
$$;
create or replace function public.menu_media_staff() returns boolean
language sql stable security definer set search_path='' as $$
  select exists(select 1 from private.menu_staff s join auth.users u on u.id=s.user_id
    where s.user_id=auth.uid() and u.email_confirmed_at is not null);
$$;
create or replace function public.menu_media_can_read(filename text) returns boolean
language sql stable security definer set search_path='' as $$
  select public.menu_media_staff() or exists(
    select 1 from private.menu_state s join private.menu_revisions r on r.id=s.published_id
    where s.id and private.menu_has_image(r.content,filename));
$$;
revoke all on function private.menu_has_image(jsonb,text) from public,anon,authenticated;
revoke all on function public.menu_media_staff() from public,anon,authenticated;
revoke all on function public.menu_media_can_read(text) from public,anon,authenticated;
grant execute on function public.menu_media_staff() to authenticated;
grant execute on function public.menu_media_can_read(text) to anon,authenticated;

drop policy if exists qaramesh_media_insert on storage.objects;
create policy qaramesh_media_insert on storage.objects for insert to authenticated
with check(bucket_id='menu-media' and public.menu_media_staff()
  and name ~ '^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\.webp$');
drop policy if exists qaramesh_media_read on storage.objects;
create policy qaramesh_media_read on storage.objects for select to anon,authenticated
using(bucket_id='menu-media' and public.menu_media_can_read(name));
-- No UPDATE or DELETE policy: assets cannot be overwritten or removed by staff.
-- Retain old and abandoned uploads until a reference-aware cleanup workflow is added.

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
  -- Accept local images and immutable, registered Storage assets only.
  if exists (select 1 from (
    select i->>'image' as src from jsonb_array_elements(document->'items') i
    union all select c->>'image' from jsonb_array_elements(document->'categories') c
    union all select s->>'src' from jsonb_array_elements(document->'slides') s
  ) images where coalesce(src,'') <> '' and ((src !~ '^/(menu|hero)/[a-zA-Z0-9._-]+$' and src !~ '^/media/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\.webp$') or src like '%..%'))
    then raise exception 'INVALID_IMAGE'; end if;
  if exists (select 1 from (
    select i->>'image' as src from jsonb_array_elements(document->'items') i
    union all select c->>'image' from jsonb_array_elements(document->'categories') c
    union all select s->>'src' from jsonb_array_elements(document->'slides') s
  ) images where src like '/media/%' and not exists (
    select 1 from storage.objects o where o.bucket_id='menu-media' and o.name=substring(src from 8)
  )) then raise exception 'INVALID_IMAGE_REFERENCE'; end if;
end $$;


notify pgrst, 'reload schema';
commit;
