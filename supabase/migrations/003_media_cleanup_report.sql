-- Read-only report. Never deletes Storage objects or enables deletion policies.
begin;
create or replace function public.menu_media_cleanup_report() returns jsonb
language plpgsql security definer set search_path='' as $$
declare result jsonb; current_version integer;
begin
  perform private.require_menu_staff();
  select version into current_version from private.menu_state where id;
  if current_version is null then raise exception 'MENU_NOT_INITIALIZED'; end if;
  with documents as (
    select draft as content from private.menu_state where id
    union all select content from private.menu_revisions
  ), image_references as (
    select i->>'image' as src from documents d cross join lateral jsonb_array_elements(d.content->'items') i
    union all select c->>'image' from documents d cross join lateral jsonb_array_elements(d.content->'categories') c
    union all select s->>'src' from documents d cross join lateral jsonb_array_elements(d.content->'slides') s
  ), referenced_names as (
    select distinct substring(src from 8) as name from image_references where src like '/media/%'
  ), assets as (
    select o.name,o.created_at,to_jsonb(o)->'user_metadata'->>'menuKind' as kind,
      case when to_jsonb(o)->'metadata'->>'size' ~ '^[0-9]{1,15}$'
        then (to_jsonb(o)->'metadata'->>'size')::bigint else 0 end as bytes,
      exists(select 1 from referenced_names r where r.name=o.name) as referenced
    from storage.objects o where o.bucket_id='menu-media'
  ), classified as (
    select *,case
      when referenced then 'referenced'
      when kind='category' then 'category_icon'
      when kind is null or kind not in ('dish','offer') then 'unclassified'
      when name !~ '^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\.webp$' then 'unknown_path'
      when created_at is null then 'unknown_age'
      when created_at>now()-interval '7 days' then 'recent'
      else 'candidate' end as reason
    from assets
  ), candidates as (
    select name as filename,kind,created_at as "createdAt",bytes from classified
    where reason='candidate' order by created_at,name limit 200
  )
  select jsonb_build_object(
    'generatedAt',now(),'draftVersion',current_version,'minimumAgeDays',7,'readOnly',true,
    'totalCount',(select count(*) from classified),
    'protectedCount',(select count(*) from classified where reason<>'candidate'),
    'candidateCount',(select count(*) from classified where reason='candidate'),
    'candidateBytes',(select coalesce(sum(bytes),0) from classified where reason='candidate'),
    'protectedReasons',coalesce((select jsonb_object_agg(reason,total) from (
      select reason,count(*) as total from classified where reason<>'candidate' group by reason
    ) counts),'{}'::jsonb),
    'candidates',coalesce((select jsonb_agg(to_jsonb(c) order by c."createdAt",c.filename) from candidates c),'[]'::jsonb),
    'truncated',(select count(*)>200 from classified where reason='candidate')
  ) into result;
  return result;
end $$;
revoke all on function public.menu_media_cleanup_report() from public,anon,authenticated;
grant execute on function public.menu_media_cleanup_report() to authenticated;
notify pgrst,'reload schema';
commit;
