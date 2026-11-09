-- Run once after v014. Adds deletion capability; deletes NO photos by itself.
-- Matches the trip's chosen shared-link access model, without photo accounts.
begin;
grant delete on public.maui_link_photos to anon, authenticated;
create policy maui_link_photos_delete on public.maui_link_photos for delete to anon, authenticated
using (exists (select 1 from public.maui_link_photo_access a where a.trip_id=maui_link_photos.trip_id));

-- Allow removing a listed photo as well as cleaning an unlisted failed upload.
-- Both new shared paths and migrated v013 account paths remain supported.
alter policy maui_storage_owner_delete_guard on storage.objects
using (bucket_id<>'maui-family-private' or (
  name ~ '^[0-9a-f-]{36}/(shared|[0-9a-f-]{36})/[0-9a-f-]{36}\.jpg$' and exists (
    select 1 from public.maui_link_photo_access a where a.trip_id::text=(storage.foldername(name))[1]
  )
));
alter policy maui_link_storage_delete_guard on storage.objects
using (bucket_id<>'maui-family-private' or (
  name ~ '^[0-9a-f-]{36}/(shared|[0-9a-f-]{36})/[0-9a-f-]{36}\.jpg$' and exists (
    select 1 from public.maui_link_photo_access a where a.trip_id::text=(storage.foldername(name))[1]
  )
));
create policy maui_link_storage_photo_delete on storage.objects for delete to anon, authenticated
using (bucket_id='maui-family-private' and
  name ~ '^[0-9a-f-]{36}/(shared|[0-9a-f-]{36})/[0-9a-f-]{36}\.jpg$' and exists (
    select 1 from public.maui_link_photo_access a where a.trip_id::text=(storage.foldername(name))[1]
  )
);
commit;
