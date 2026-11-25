-- Loy Travel v0.18 wind-down questions (additive only). Run once in the Supabase SQL editor. Safe to rerun.
-- Adds one new table and five functions (questions, shoutouts and help-Dad tasks). Changes nothing in trips, photos, packs or any other table.
-- The app key cannot read the table directly: each boy reads his own answers, a boy sees a shoutout
-- about him only after Dad approves it, and only the Dad code (checked by maui_dad_check from v017) reads all.
begin;

create table if not exists public.maui_wind_down_answers (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  traveler_name text not null check (traveler_name in ('Bryson','Bennett','Brooks')),
  question_id text not null check (question_id in ('next-days','meal','top3','word','caption','learned','tell-friend','next-trip','person-bryant','person-bryson','person-bennett','person-brooks') or question_id ~ '^help-(clean|pack)-2026-11-2[4-7]$'),
  about text check (about is null or about in ('Bryant','Bryson','Bennett','Brooks')),
  answer text not null check (char_length(answer) between 1 and 2000),
  status text not null default 'counted' check (status in ('counted','pending','approved','not_approved')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  reviewed_at timestamptz,
  unique (trip_id, traveler_name, question_id)
);
alter table public.maui_wind_down_answers enable row level security;
revoke all on public.maui_wind_down_answers from anon, authenticated;

-- Save or change one answer. Shoutouts (person-*) and helper tasks (help-*) wait for Dad; changing one sends it back to Dad.
create or replace function public.maui_wd_save(p_trip uuid, p_name text, p_qid text, p_answer text)
returns table(question_id text, status text, updated_at timestamptz)
language plpgsql security definer set search_path=public as $$
#variable_conflict use_column
declare v_about text; v_person boolean := p_qid like 'person-%'; v_check boolean := p_qid like 'person-%' or p_qid like 'help-%';
begin
  if p_name not in ('Bryson','Bennett','Brooks') then raise exception 'Only the boys answer these'; end if;
  if v_person then
    v_about := initcap(substr(p_qid, 8));
    if v_about = p_name then raise exception 'Pick someone else'; end if;
  end if;
  return query
  insert into public.maui_wind_down_answers as a (trip_id, traveler_name, question_id, about, answer, status)
  values (p_trip, p_name, p_qid, v_about, p_answer, case when v_check then 'pending' else 'counted' end)
  on conflict (trip_id, traveler_name, question_id) do update
    set answer = excluded.answer,
        status = case when a.answer = excluded.answer then a.status else excluded.status end,
        reviewed_at = case when a.answer = excluded.answer then a.reviewed_at else null end,
        updated_at = now()
  returning a.question_id, a.status, a.updated_at;
end $$;

-- A boy's own answers, with Dad's OK status on his shoutouts.
create or replace function public.maui_wd_mine(p_trip uuid, p_name text)
returns table(question_id text, answer text, status text, updated_at timestamptz)
language sql stable security definer set search_path=public as $$
  select a.question_id, a.answer, a.status, a.updated_at from public.maui_wind_down_answers a
  where a.trip_id = p_trip and a.traveler_name = p_name;
$$;

-- Shoutouts about a boy that Dad approved.
create or replace function public.maui_wd_for_me(p_trip uuid, p_name text)
returns table(from_name text, answer text, reviewed_at timestamptz)
language sql stable security definer set search_path=public as $$
  select a.traveler_name, a.answer, a.reviewed_at from public.maui_wind_down_answers a
  where a.trip_id = p_trip and a.about = p_name and a.status = 'approved';
$$;

-- Everything, for Dad only.
create or replace function public.maui_wd_all(p_code text, p_trip uuid)
returns table(id uuid, traveler_name text, question_id text, about text, answer text, status text, updated_at timestamptz)
language plpgsql stable security definer set search_path=public as $$
#variable_conflict use_column
begin
  if not public.maui_dad_check(p_code) then raise exception 'Dad code is not right'; end if;
  return query select a.id, a.traveler_name, a.question_id, a.about, a.answer, a.status, a.updated_at
    from public.maui_wind_down_answers a where a.trip_id = p_trip order by a.updated_at;
end $$;

-- Dad approves a shoutout or helper task (it counts, and a shoutout shows to the one it is about) or sends it back.
create or replace function public.maui_wd_review(p_code text, p_id uuid, p_ok boolean)
returns text
language plpgsql security definer set search_path=public as $$
declare v text;
begin
  if not public.maui_dad_check(p_code) then raise exception 'Dad code is not right'; end if;
  update public.maui_wind_down_answers set status = case when p_ok then 'approved' else 'not_approved' end, reviewed_at = now()
    where id = p_id and (question_id like 'person-%' or question_id like 'help-%') returning status into v;
  return v;
end $$;

revoke all on function public.maui_wd_save(uuid,text,text,text) from public;
revoke all on function public.maui_wd_mine(uuid,text) from public;
revoke all on function public.maui_wd_for_me(uuid,text) from public;
revoke all on function public.maui_wd_all(text,uuid) from public;
revoke all on function public.maui_wd_review(text,uuid,boolean) from public;
grant execute on function public.maui_wd_save(uuid,text,text,text) to anon, authenticated;
grant execute on function public.maui_wd_mine(uuid,text) to anon, authenticated;
grant execute on function public.maui_wd_for_me(uuid,text) to anon, authenticated;
grant execute on function public.maui_wd_all(text,uuid) to anon, authenticated;
grant execute on function public.maui_wd_review(text,uuid,boolean) to anon, authenticated;

commit;
