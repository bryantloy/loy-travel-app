-- Loy Travel v0.16 — earned card packs (additive only)
-- Run once in the Supabase SQL editor after v015. Safe to rerun.
-- Creates one new table and one read-only view. Does not touch trips, votes, packing,
-- photos, starter-pack state or any existing card data. Nothing is deleted or reseeded.
-- Until this runs, the app keeps packs on each phone and copies them up once the table exists.

create table if not exists earned_packs (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips(id) on delete cascade,
  traveler_name text not null check (traveler_name in ('Bryant','Bryson','Bennett','Brooks')),
  pack_key text not null,          -- starter, arrival, haleakala, ocean, explorer, quest-5, quest-10, wildlife, family-memory, surf, shave-ice, bonus-<time>
  pack_name text,
  card_ids text[],                 -- the 3 cards pulled; null until a Dad-awarded pack is opened
  note text,                       -- Dad's reason for a bonus pack
  awarded_by text,
  earned_at timestamptz not null default now(),
  opened_at timestamptz,
  unique (trip_id, traveler_name, pack_key)   -- each pack opens once, even across phones
);

create index if not exists earned_packs_trip_traveler on earned_packs (trip_id, traveler_name);

alter table earned_packs enable row level security;

-- Same shared-link model as the rest of the trip data: profile names are labels, not logins.
-- Read and add for everyone with the app; updates only to open a pack that isn't opened yet; no deletes.
drop policy if exists "family packs read" on earned_packs;
drop policy if exists "family packs add" on earned_packs;
drop policy if exists "family packs open" on earned_packs;
create policy "family packs read" on earned_packs for select to anon using (true);
create policy "family packs add" on earned_packs for insert to anon with check (true);
create policy "family packs open" on earned_packs for update to anon using (opened_at is null) with check (opened_at is not null);

-- One row per card pulled, for easy SQL / CSV analysis (duplicates appear as repeat rows).
create or replace view card_collections with (security_invoker = true) as
select p.id as earned_pack_id, p.trip_id, p.traveler_name, c.card_id, p.pack_key as source_pack, p.opened_at as unlocked_at
from earned_packs p cross join lateral unnest(p.card_ids) as c(card_id)
where p.opened_at is not null;

grant select on card_collections to anon;
