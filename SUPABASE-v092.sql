-- Loy Travel v0.9.2 — starter-pack identity hotfix
-- This removes the pack system's dependency on a loaded travelers UUID.
-- Safe to run after SUPABASE-v09.sql.

alter table card_unlocks
  add column if not exists traveler_name text;

alter table starter_pack_claims
  add column if not exists traveler_name text;

-- Keep traveler_id when available, but do not require it for card packs.
alter table card_unlocks
  alter column traveler_id drop not null;

alter table starter_pack_claims
  alter column traveler_id drop not null;

-- Name-based uniqueness is what the app now uses.
create unique index if not exists card_unlocks_trip_name_card_uidx
  on card_unlocks (trip_id, traveler_name, card_id);

create unique index if not exists starter_pack_claims_trip_name_uidx
  on starter_pack_claims (trip_id, traveler_name);

-- No RLS policy changes are needed; the v0.9 policies already cover these tables.
