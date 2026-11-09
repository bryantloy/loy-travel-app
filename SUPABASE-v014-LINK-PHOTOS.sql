-- Shared-link photos for Maui 2026. Run ONCE after v013.
-- Adds link-sharing metadata and access policies; keeps every existing photo,
-- object, account, membership and planning row. No drops, resets or reseeding.
-- Anyone with the app's public connection details can read/upload these photos.
begin;

create table public.maui_link_photo_access (
  trip_id uuid primary key references public.trips(id)
);
alter table public.maui_link_photo_access enable row level security;
revoke all on public.maui_link_photo_access from anon, authenticated;
grant select on public.maui_link_photo_access to anon, authenticated;
create policy maui_link_access_read on public.maui_link_photo_access for select to anon, authenticated using (true);
insert into public.maui_link_photo_access(trip_id)
select id from public.trips where name='Maui 2026';

create table public.maui_link_photos (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.maui_link_photo_access(trip_id),
  person text not null check (person in ('Bryant','Bryson','Bennett','Brooks','Grandpa Rick')),
  storage_path text not null unique,
  caption text not null default '' check (length(caption)<=500),
  activity text not null default '' check (length(activity)<=100),
  trip_day date check (trip_day between date '2026-11-19' and date '2026-11-27'),
  created_at timestamptz not null default now(),
  check (storage_path ~ ('^' || trip_id::text || '/(shared|[0-9a-f-]{36})/[0-9a-f-]{36}\.jpg$'))
);
create index maui_link_photos_trip_created on public.maui_link_photos(trip_id,created_at desc,id);
alter table public.maui_link_photos enable row level security;
revoke all on public.maui_link_photos from anon, authenticated;
grant select, insert on public.maui_link_photos to anon, authenticated;
create policy maui_link_photos_read on public.maui_link_photos for select to anon, authenticated
using (exists (select 1 from public.maui_link_photo_access a where a.trip_id=maui_link_photos.trip_id));
create policy maui_link_photos_insert on public.maui_link_photos for insert to anon, authenticated
with check (
  storage_path ~ ('^' || trip_id::text || '/shared/[0-9a-f-]{36}\.jpg$') and
  exists (select 1 from public.maui_link_photo_access a where a.trip_id=maui_link_photos.trip_id)
);

-- Copy metadata only. Original objects remain at exactly the same paths.
insert into public.maui_link_photos(id,trip_id,person,storage_path,caption,activity,trip_day,created_at)
select p.id,p.trip_id,p.person,p.storage_path,p.caption,p.activity,p.trip_day,p.created_at
from public.maui_trip_photos p join public.maui_link_photo_access a on a.trip_id=p.trip_id;

-- Broaden only the existing trip bucket's v013 restrictions. Other buckets
-- keep their current policy behavior. The bucket itself remains non-public.
alter policy maui_storage_anon_guard on storage.objects
using (bucket_id<>'maui-family-private' or exists (
  select 1 from public.maui_link_photo_access a where a.trip_id::text=(storage.foldername(name))[1]
)) with check (bucket_id<>'maui-family-private' or exists (
  select 1 from public.maui_link_photo_access a where a.trip_id::text=(storage.foldername(name))[1]
));
alter policy maui_storage_family_read_guard on storage.objects
using (bucket_id<>'maui-family-private' or exists (
  select 1 from public.maui_link_photo_access a where a.trip_id::text=(storage.foldername(name))[1]
));
alter policy maui_storage_family_write_guard on storage.objects
with check (bucket_id<>'maui-family-private' or (
  name ~ '^[0-9a-f-]{36}/shared/[0-9a-f-]{36}\.jpg$' and exists (
    select 1 from public.maui_link_photo_access a where a.trip_id::text=(storage.foldername(name))[1]
  )
));
alter policy maui_storage_owner_delete_guard on storage.objects
using (bucket_id<>'maui-family-private' or (
  name ~ '^[0-9a-f-]{36}/shared/[0-9a-f-]{36}\.jpg$' and exists (
    select 1 from public.maui_link_photo_access a where a.trip_id::text=(storage.foldername(name))[1]
  ) and not exists (select 1 from public.maui_link_photos p where p.storage_path=name)
));

-- Also guard against unrelated old permissive policies on storage.objects.
create policy maui_link_storage_insert_guard on storage.objects as restrictive for insert to anon, authenticated
with check (bucket_id<>'maui-family-private' or (
  name ~ '^[0-9a-f-]{36}/shared/[0-9a-f-]{36}\.jpg$' and exists (
    select 1 from public.maui_link_photo_access a where a.trip_id::text=(storage.foldername(name))[1]
  )
));
create policy maui_link_storage_anon_no_update on storage.objects as restrictive for update to anon
using (bucket_id<>'maui-family-private') with check (bucket_id<>'maui-family-private');
create policy maui_link_storage_delete_guard on storage.objects as restrictive for delete to anon, authenticated
using (bucket_id<>'maui-family-private' or (
  name ~ '^[0-9a-f-]{36}/shared/[0-9a-f-]{36}\.jpg$' and exists (
    select 1 from public.maui_link_photo_access a where a.trip_id::text=(storage.foldername(name))[1]
  ) and not exists (select 1 from public.maui_link_photos p where p.storage_path=name)
));
create policy maui_link_storage_read on storage.objects for select to anon, authenticated
using (bucket_id='maui-family-private' and exists (
  select 1 from public.maui_link_photo_access a where a.trip_id::text=(storage.foldername(name))[1]
));
create policy maui_link_storage_insert on storage.objects for insert to anon, authenticated
with check (bucket_id='maui-family-private' and name ~ '^[0-9a-f-]{36}/shared/[0-9a-f-]{36}\.jpg$' and exists (
  select 1 from public.maui_link_photo_access a where a.trip_id::text=(storage.foldername(name))[1]
));
create policy maui_link_storage_cleanup on storage.objects for delete to anon, authenticated
using (bucket_id='maui-family-private' and name ~ '^[0-9a-f-]{36}/shared/[0-9a-f-]{36}\.jpg$' and exists (
  select 1 from public.maui_link_photo_access a where a.trip_id::text=(storage.foldername(name))[1]
) and not exists (select 1 from public.maui_link_photos p where p.storage_path=name));

commit;
