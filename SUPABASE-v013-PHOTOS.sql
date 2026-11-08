-- Additive private-photo migration. Run once in the Supabase SQL editor.
-- Does not modify votes, packing, cards, travelers or existing planning policies.
begin;
create table public.maui_photo_members (
  trip_id uuid not null references public.trips(id),
  user_id uuid not null references auth.users(id),
  person text not null check (person in ('Bryant','Bryson','Bennett','Brooks')),
  primary key (trip_id,user_id), unique (trip_id,person), unique (trip_id,user_id,person)
);
alter table public.maui_photo_members enable row level security;
revoke all on public.maui_photo_members from anon, authenticated;
grant select on public.maui_photo_members to authenticated;
create policy maui_member_self on public.maui_photo_members for select to authenticated using (user_id=(select auth.uid()));

create table public.maui_trip_photos (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null,
  user_id uuid not null,
  person text not null,
  storage_path text not null unique,
  caption text not null default '' check (length(caption)<=500),
  activity text not null default '' check (length(activity)<=100),
  trip_day date check (trip_day between date '2026-11-19' and date '2026-11-27'),
  created_at timestamptz not null default now(),
  foreign key (trip_id,user_id,person) references public.maui_photo_members(trip_id,user_id,person),
  check (storage_path ~ ('^' || trip_id::text || '/' || user_id::text || '/[0-9a-f-]{36}\.jpg$'))
);
create index maui_photos_trip_created on public.maui_trip_photos(trip_id,created_at desc,id);
alter table public.maui_trip_photos enable row level security;
revoke all on public.maui_trip_photos from anon, authenticated;
grant select, insert on public.maui_trip_photos to authenticated;
create policy maui_photos_read on public.maui_trip_photos for select to authenticated using (
  exists (select 1 from public.maui_photo_members m where m.trip_id=maui_trip_photos.trip_id and m.user_id=(select auth.uid()))
);
create policy maui_photos_insert on public.maui_trip_photos for insert to authenticated with check (
  user_id=(select auth.uid()) and exists (
    select 1 from public.maui_photo_members m where m.trip_id=maui_trip_photos.trip_id and m.user_id=(select auth.uid()) and m.person=maui_trip_photos.person
  )
);

-- A new private bucket; fail rather than silently reuse a pre-existing bucket.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('maui-family-private','maui-family-private',false,15728640,array['image/jpeg']);

-- Restrictive guards protect this bucket even if older permissive policies exist.
-- Other buckets retain their current access rules.
create policy maui_storage_anon_guard on storage.objects as restrictive for all to anon
using (bucket_id<>'maui-family-private') with check (bucket_id<>'maui-family-private');
create policy maui_storage_family_read_guard on storage.objects as restrictive for select to authenticated
using (bucket_id<>'maui-family-private' or exists (
  select 1 from public.maui_photo_members m where m.trip_id::text=(storage.foldername(name))[1] and m.user_id=(select auth.uid())
));
create policy maui_storage_family_write_guard on storage.objects as restrictive for insert to authenticated
with check (bucket_id<>'maui-family-private' or (
  (storage.foldername(name))[2]=(select auth.uid())::text and name ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}/[0-9a-f-]{36}\.jpg$' and exists (
    select 1 from public.maui_photo_members m where m.trip_id::text=(storage.foldername(name))[1] and m.user_id=(select auth.uid())
  )
));
create policy maui_storage_no_update on storage.objects as restrictive for update to authenticated
using (bucket_id<>'maui-family-private') with check (bucket_id<>'maui-family-private');
create policy maui_storage_owner_delete_guard on storage.objects as restrictive for delete to authenticated
using (bucket_id<>'maui-family-private' or (
  (storage.foldername(name))[2]=(select auth.uid())::text and exists (
    select 1 from public.maui_photo_members m where m.trip_id::text=(storage.foldername(name))[1] and m.user_id=(select auth.uid())
  ) and not exists (select 1 from public.maui_trip_photos p where p.storage_path=name)
));
create policy maui_storage_read on storage.objects for select to authenticated
using (bucket_id='maui-family-private' and exists (
  select 1 from public.maui_photo_members m where m.trip_id::text=(storage.foldername(name))[1] and m.user_id=(select auth.uid())
));
create policy maui_storage_insert on storage.objects for insert to authenticated
with check (bucket_id='maui-family-private' and (storage.foldername(name))[2]=(select auth.uid())::text and exists (
  select 1 from public.maui_photo_members m where m.trip_id::text=(storage.foldername(name))[1] and m.user_id=(select auth.uid())
));
create policy maui_storage_cleanup on storage.objects for delete to authenticated
using (bucket_id='maui-family-private' and (storage.foldername(name))[2]=(select auth.uid())::text and exists (
  select 1 from public.maui_photo_members m where m.trip_id::text=(storage.foldername(name))[1] and m.user_id=(select auth.uid())
) and not exists (select 1 from public.maui_trip_photos p where p.storage_path=name));
commit;

-- SETUP after migration, separately: create four email/password users in
-- Supabase Authentication (dashboard). Send credentials privately; never put
-- them in this repository. Disable public signups if unused by other apps.
-- Then insert approved memberships with actual auth user UUIDs, for example:
-- insert into public.maui_photo_members(trip_id,user_id,person)
-- select id,'ACTUAL-AUTH-USER-UUID'::uuid,'Bryant' from public.trips where name='Maui 2026';
-- Repeat for Bryson, Bennett and Brooks. Do not add Guest or Grandpa Rick.
