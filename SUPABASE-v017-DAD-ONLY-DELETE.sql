-- v017: only Dad can delete trip photos; the boys can ask Dad to delete. Run once in the Supabase SQL editor.
-- Deletes NO photos by itself. Uploading and viewing photos keep working for everyone as before.
-- This repo copy is a template: replace the two placeholders below with the salt and
-- hash from the filled-in copy (never put the Dad code itself in this public repo).
begin;

-- 1) The public app key can no longer delete gallery entries directly.
drop policy if exists maui_link_photos_delete on public.maui_link_photos;
revoke delete on public.maui_link_photos from anon, authenticated;

-- 2) An image file can only be removed once its gallery entry is gone
--    (after Dad deletes it, or a failed upload that never got an entry).
drop policy if exists maui_link_storage_photo_delete on storage.objects;
alter policy maui_storage_owner_delete_guard on storage.objects
using (bucket_id<>'maui-family-private' or (
  name ~ '^[0-9a-f-]{36}/(shared|[0-9a-f-]{36})/[0-9a-f-]{36}\.jpg$' and exists (
    select 1 from public.maui_link_photo_access a where a.trip_id::text=(storage.foldername(name))[1]
  ) and not exists (select 1 from public.maui_link_photos p where p.storage_path=name)
));
alter policy maui_link_storage_delete_guard on storage.objects
using (bucket_id<>'maui-family-private' or (
  name ~ '^[0-9a-f-]{36}/(shared|[0-9a-f-]{36})/[0-9a-f-]{36}\.jpg$' and exists (
    select 1 from public.maui_link_photo_access a where a.trip_id::text=(storage.foldername(name))[1]
  ) and not exists (select 1 from public.maui_link_photos p where p.storage_path=name)
));
drop policy if exists maui_link_storage_cleanup on storage.objects;
create policy maui_link_storage_cleanup on storage.objects for delete to anon, authenticated
using (bucket_id='maui-family-private' and name ~ '^[0-9a-f-]{36}/(shared|[0-9a-f-]{36})/[0-9a-f-]{36}\.jpg$' and exists (
  select 1 from public.maui_link_photo_access a where a.trip_id::text=(storage.foldername(name))[1]
) and not exists (select 1 from public.maui_link_photos p where p.storage_path=name));

-- 3) The Dad code, stored only as a salted hash in a table the app key cannot read.
create table if not exists public.maui_dad_code (
  id int primary key default 1 check (id=1),
  salt text not null,
  code_hash text not null
);
alter table public.maui_dad_code enable row level security;
revoke all on public.maui_dad_code from anon, authenticated;
insert into public.maui_dad_code(id,salt,code_hash) values (1,'PASTE-SALT','PASTE-HASH')
on conflict (id) do update set salt=excluded.salt, code_hash=excluded.code_hash;

create or replace function public.maui_dad_check(p_code text) returns boolean
language plpgsql security definer set search_path=public as $$
declare ok boolean;
begin
  select exists(select 1 from public.maui_dad_code c
    where c.code_hash=encode(sha256(convert_to(c.salt||coalesce(p_code,''),'UTF8')),'hex')) into ok;
  if not ok then perform pg_sleep(1); end if; -- slows down guessing
  return ok;
end $$;

create or replace function public.maui_dad_delete_photos(p_code text, p_ids uuid[]) returns text[]
language plpgsql security definer set search_path=public as $$
declare paths text[];
begin
  if not public.maui_dad_check(p_code) then raise exception 'Dad code is not right'; end if;
  with d as (delete from public.maui_link_photos where id = any(p_ids) returning storage_path)
  select coalesce(array_agg(storage_path),'{}') into paths from d;
  return paths;
end $$;

-- 4) The boys can ask Dad to delete photos. Asking deletes nothing; Dad deletes or keeps.
create table if not exists public.maui_photo_delete_requests (
  id uuid primary key default gen_random_uuid(),
  photo_id uuid not null unique references public.maui_link_photos(id) on delete cascade,
  requested_by text not null check (requested_by in ('Bryson','Bennett','Brooks')),
  created_at timestamptz not null default now()
);
alter table public.maui_photo_delete_requests enable row level security;
revoke all on public.maui_photo_delete_requests from anon, authenticated;
grant select, insert on public.maui_photo_delete_requests to anon, authenticated;
drop policy if exists maui_delete_requests_read on public.maui_photo_delete_requests;
create policy maui_delete_requests_read on public.maui_photo_delete_requests for select to anon, authenticated using (true);
drop policy if exists maui_delete_requests_add on public.maui_photo_delete_requests;
create policy maui_delete_requests_add on public.maui_photo_delete_requests for insert to anon, authenticated
with check (requested_by in ('Bryson','Bennett','Brooks'));

create or replace function public.maui_dad_dismiss_requests(p_code text, p_ids uuid[]) returns int
language plpgsql security definer set search_path=public as $$
declare n int;
begin
  if not public.maui_dad_check(p_code) then raise exception 'Dad code is not right'; end if;
  delete from public.maui_photo_delete_requests where id = any(p_ids);
  get diagnostics n = row_count;
  return n;
end $$;

revoke all on function public.maui_dad_check(text) from public;
revoke all on function public.maui_dad_delete_photos(text,uuid[]) from public;
revoke all on function public.maui_dad_dismiss_requests(text,uuid[]) from public;
grant execute on function public.maui_dad_check(text) to anon, authenticated;
grant execute on function public.maui_dad_delete_photos(text,uuid[]) to anon, authenticated;
grant execute on function public.maui_dad_dismiss_requests(text,uuid[]) to anon, authenticated;

commit;
