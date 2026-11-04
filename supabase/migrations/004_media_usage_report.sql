-- Staff-only, read-only Storage usage. Does not change quotas or billing settings.
begin;
create or replace function public.menu_storage_usage() returns jsonb
language plpgsql security definer set search_path='' as $$
declare result jsonb;
begin
  perform private.require_menu_staff();
  with assets as (
    select created_at,case when to_jsonb(o)->'metadata'->>'size' ~ '^[0-9]{1,15}$'
      then (to_jsonb(o)->'metadata'->>'size')::bigint end as bytes
    from storage.objects o where bucket_id='menu-media'
  )
  select jsonb_build_object(
    'generatedAt',now(),'scope','menu-media','readOnly',true,
    'imageCount',count(*),'knownSizeCount',count(bytes),
    'unknownSizeCount',count(*)-count(bytes),
    'totalBytes',coalesce(sum(bytes),0),
    'largestFileBytes',coalesce(max(bytes),0),'latestUploadAt',max(created_at)
  ) into result from assets;
  return result;
end $$;
revoke all on function public.menu_storage_usage() from public,anon,authenticated;
grant execute on function public.menu_storage_usage() to authenticated;
notify pgrst,'reload schema';
commit;
