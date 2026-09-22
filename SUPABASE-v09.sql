-- Loy Travel v0.9 — First Pack Night
create table if not exists card_unlocks (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips(id) on delete cascade,
  traveler_id uuid not null references travelers(id) on delete cascade,
  card_id text not null,
  source text not null default 'starter_pack',
  unlocked_at timestamptz not null default now(),
  unique(trip_id, traveler_id, card_id)
);
create table if not exists starter_pack_claims (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips(id) on delete cascade,
  traveler_id uuid not null references travelers(id) on delete cascade,
  pack_code text not null default 'starter_001',
  opened_at timestamptz not null default now(),
  unique(trip_id, traveler_id)
);
alter table card_unlocks enable row level security;
alter table starter_pack_claims enable row level security;
do $$ begin create policy "family test read card unlocks" on card_unlocks for select using (true); exception when duplicate_object then null; end $$;
do $$ begin create policy "family test insert card unlocks" on card_unlocks for insert with check (true); exception when duplicate_object then null; end $$;
do $$ begin create policy "family test update card unlocks" on card_unlocks for update using (true) with check (true); exception when duplicate_object then null; end $$;
do $$ begin create policy "family test read starter claims" on starter_pack_claims for select using (true); exception when duplicate_object then null; end $$;
do $$ begin create policy "family test insert starter claims" on starter_pack_claims for insert with check (true); exception when duplicate_object then null; end $$;
do $$ begin create policy "family test update starter claims" on starter_pack_claims for update using (true) with check (true); exception when duplicate_object then null; end $$;
