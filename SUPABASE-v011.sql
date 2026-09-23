-- Loy Travel v0.11 — additive prep + Costco tables
-- Safe for the existing Maui 2026 voting/card data: no deletes, resets, or reseeds of existing tables.

create table if not exists trip_prep_items (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips(id) on delete cascade,
  owner text not null,
  item text not null,
  quantity text,
  bag text,
  have_status text not null default 'have' check (have_status in ('have','need_to_order')),
  packed boolean not null default false,
  sort_order integer not null default 0,
  updated_at timestamptz not null default now(),
  unique(trip_id, owner, item)
);

create table if not exists costco_items (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips(id) on delete cascade,
  category text not null,
  item text not null,
  quantity text,
  est_cost numeric(10,2) not null default 0,
  actual_cost numeric(10,2),
  purchased boolean not null default false,
  sort_order integer not null default 0,
  updated_at timestamptz not null default now(),
  unique(trip_id, item)
);

alter table trip_prep_items enable row level security;
alter table costco_items enable row level security;

drop policy if exists "family prep read" on trip_prep_items;
drop policy if exists "family prep write" on trip_prep_items;
create policy "family prep read" on trip_prep_items for select to anon using (true);
create policy "family prep write" on trip_prep_items for all to anon using (true) with check (true);

drop policy if exists "family costco read" on costco_items;
drop policy if exists "family costco write" on costco_items;
create policy "family costco read" on costco_items for select to anon using (true);
create policy "family costco write" on costco_items for all to anon using (true) with check (true);

-- Intentional family packing list
with m as (select id from trips where name='Maui 2026' limit 1)
insert into trip_prep_items(trip_id,owner,item,quantity,bag,have_status,packed,sort_order)
select m.id,x.owner,x.item,x.quantity,x.bag,'have',false,x.sort_order from m cross join (values
  ('Bryant','Underwear','4','Luggage',1),
  ('Bryant','Running shorts','4','Luggage',2),
  ('Bryant','Running shirts','4','Luggage',3),
  ('Bryant','Swim trunks','4','Luggage',4),
  ('Bryant','Daily shorts','4','Luggage',5),
  ('Bryant','Daily shirts','4','Luggage',6),
  ('Bryant','Jeans','1 pair','Luggage',7),
  ('Bryant','Comfortable pants','1 pair','Luggage',8),
  ('Bryant','Long sleeve shirts','2','Luggage',9),
  ('Bryant','Hoodie','1','Luggage',10),
  ('Bryant','Socks','6 pairs','Luggage',11),
  ('Bryant','Flip flops','1 pair','Luggage',12),
  ('Bryant','Water shoes','1 pair','Luggage',13),
  ('Bryant','Running shoes','1 pair','Wear / Luggage',14),
  ('Bryant','Hiking shoes','1 pair','Luggage',15),
  ('Bryant','Light rain / wind shell','1','Luggage',16),
  ('Bryant','Hat','1','Backpack',17),
  ('Bryant','Sunglasses','1','Backpack',18),
  ('Bryant','Deodorant','1','Luggage',19),
  ('Bryant','Toothbrush','1','Luggage',20),
  ('Bryant','Hair pills / vitamins','8 each','Luggage',21),
  ('Bryant','Creatine gummy packs','8','Luggage',22),
  ('Bryant','Wallet, cash, IDs & passports','1 set','Backpack',23),
  ('Bryant','Phone','1','Backpack',24),
  ('Bryant','Watch charger','1','Backpack',25),
  ('Bryant','Pixel tablet','1','Backpack',26),
  ('Bryant','Kindle','1','Backpack',27),
  ('Bryant','Noise-canceling headphones','1','Backpack',28),
  ('Bryson','Underwear','5','Luggage',29),
  ('Bryson','Swim trunks','3','Luggage',30),
  ('Bryson','Swim shirts','2','Luggage',31),
  ('Bryson','Socks','5 pairs','Luggage',32),
  ('Bryson','Water shoes','1 pair','Luggage',33),
  ('Bryson','Flip flops','1 pair','Luggage',34),
  ('Bryson','Daily shoes','1 pair','Wear / Luggage',35),
  ('Bryson','Daily shorts','4','Luggage',36),
  ('Bryson','Daily shirts','5','Luggage',37),
  ('Bryson','Comfortable pants','1 pair','Luggage',38),
  ('Bryson','Hoodie','1','Luggage',39),
  ('Bryson','Long sleeve shirts','2','Luggage',40),
  ('Bryson','Light rain / wind shell','1','Luggage',41),
  ('Bryson','Hat','1','Luggage',42),
  ('Bryson','Sunglasses','1','Luggage',43),
  ('Bryson','Nicer shirt','1','Luggage',44),
  ('Bryson','Reusable water bottle','1','Luggage',45),
  ('Bryson','Deodorant','1','Luggage',46),
  ('Bryson','Toothbrush','1','Luggage',47),
  ('Bryson','Phone','1','Shared Boys Backpack',48),
  ('Bryson','Phone charging cord','1','Shared Boys Backpack',49),
  ('Bryson','Noise-canceling headphones','1','Shared Boys Backpack',50),
  ('Bennett','Underwear','5','Luggage',51),
  ('Bennett','Swim trunks','3','Luggage',52),
  ('Bennett','Swim shirts','2','Luggage',53),
  ('Bennett','Socks','5 pairs','Luggage',54),
  ('Bennett','Water shoes','1 pair','Luggage',55),
  ('Bennett','Flip flops','1 pair','Luggage',56),
  ('Bennett','Daily shoes','1 pair','Wear / Luggage',57),
  ('Bennett','Daily shorts','4','Luggage',58),
  ('Bennett','Daily shirts','5','Luggage',59),
  ('Bennett','Comfortable pants','1 pair','Luggage',60),
  ('Bennett','Hoodie','1','Luggage',61),
  ('Bennett','Long sleeve shirts','2','Luggage',62),
  ('Bennett','Light rain / wind shell','1','Luggage',63),
  ('Bennett','Hat','1','Luggage',64),
  ('Bennett','Sunglasses','1','Luggage',65),
  ('Bennett','Nicer shirt','1','Luggage',66),
  ('Bennett','Reusable water bottle','1','Luggage',67),
  ('Bennett','Deodorant','1','Luggage',68),
  ('Bennett','Toothbrush','1','Luggage',69),
  ('Bennett','Phone','1','Shared Boys Backpack',70),
  ('Bennett','Phone charging cord','1','Shared Boys Backpack',71),
  ('Bennett','Noise-canceling headphones','1','Shared Boys Backpack',72),
  ('Brooks','Underwear','5','Luggage',73),
  ('Brooks','Swim trunks','3','Luggage',74),
  ('Brooks','Swim shirts','2','Luggage',75),
  ('Brooks','Socks','5 pairs','Luggage',76),
  ('Brooks','Water shoes','1 pair','Luggage',77),
  ('Brooks','Flip flops','1 pair','Luggage',78),
  ('Brooks','Daily shoes','1 pair','Wear / Luggage',79),
  ('Brooks','Daily shorts','4','Luggage',80),
  ('Brooks','Daily shirts','5','Luggage',81),
  ('Brooks','Comfortable pants','1 pair','Luggage',82),
  ('Brooks','Hoodie','1','Luggage',83),
  ('Brooks','Long sleeve shirts','2','Luggage',84),
  ('Brooks','Light rain / wind shell','1','Luggage',85),
  ('Brooks','Hat','1','Luggage',86),
  ('Brooks','Sunglasses','1','Luggage',87),
  ('Brooks','Nicer shirt','1','Luggage',88),
  ('Brooks','Reusable water bottle','1','Luggage',89),
  ('Brooks','Toothbrush','1','Luggage',90),
  ('Brooks','Phone','1','Shared Boys Backpack',91),
  ('Brooks','Phone charging cord','1','Shared Boys Backpack',92),
  ('Brooks','Noise-canceling headphones','1','Shared Boys Backpack',93),
  ('Shared Family Gear','Anti-chafe cream','1','Shared',94),
  ('Shared Family Gear','Toothpaste','1','Shared',95),
  ('Shared Family Gear','Sea salt hair spray','1','Shared',96),
  ('Shared Family Gear','Allergy pills','Family supply','Shared',97),
  ('Shared Family Gear','Instant hydration packs','8','Shared',98),
  ('Shared Family Gear','Large metal water canisters','2','Shared',99),
  ('Shared Family Gear','Snorkel masks','4','Shared',100),
  ('Shared Family Gear','3-port wall charging plug','1','Shared',101),
  ('Shared Family Gear','USB-C to USB-C charging cords','3','Shared',102),
  ('Shared Family Gear','USB-C to Lightning charging cord','1','Shared',103),
  ('Shared Family Gear','Power bank','1','Shared Boys Backpack',104),
  ('Shared Family Gear','Dramamine','Family supply','Shared',105),
  ('Shared Family Gear','Tylenol','Family supply','Shared',106),
  ('Shared Family Gear','Ibuprofen','Family supply','Shared',107),
  ('Shared Family Gear','Excedrin','Family supply','Shared',108),
  ('Shared Family Gear','Band-Aids','1 pack','Shared',109),
  ('Shared Family Gear','Blister care','1 pack','Shared',110),
  ('Shared Family Gear','Antibiotic ointment','1','Shared',111),
  ('Shared Family Gear','Laundry sheets','Trip supply','Shared',112),
  ('Shared Family Gear','Sunscreen','Family supply','Shared',113),
  ('Shared Family Gear','SPF lip balm','Family supply','Shared',114),
  ('Shared Family Gear','Waterproof phone pouches / dry bag','1 set','Shared',115),
  ('Shared Family Gear','Reusable tote / beach bag','1','Shared',116),
  ('Shared Family Gear','Daypack','1','Shared',117),
  ('Shared Boys Backpack','Shared boys backpack','1','Shared Boys Backpack',118),
  ('Shared Boys Backpack','Nintendo Switch','1','Shared Boys Backpack',119),
  ('Shared Boys Backpack','Switch charging cord','1','Shared Boys Backpack',120),
  ('Shared Boys Backpack','Wipes / tissues','1 pack','Shared Boys Backpack',121)
) as x(owner,item,quantity,bag,sort_order)
on conflict (trip_id,owner,item) do nothing;

-- Initial Costco list and planning estimates
with m as (select id from trips where name='Maui 2026' limit 1)
insert into costco_items(trip_id,category,item,quantity,est_cost,actual_cost,purchased,sort_order)
select m.id,x.category,x.item,x.quantity,x.est_cost,null,false,x.sort_order from m cross join (values
  ('Breakfast','Packaged muffins','1 pack',9,1),
  ('Breakfast','Pop-Tarts','1 box',12,2),
  ('Protein','Protein bars','1 box',20,3),
  ('Protein','Fairlife protein shakes','1 case',33,4),
  ('Snacks','Chips','1 variety pack',11,5),
  ('Breakfast','Cereal','1–2 boxes',10,6),
  ('Breakfast','Milk','1',6,7),
  ('Easy meals','Frozen pizza','1 pack',14,8),
  ('Easy meals','Chicken tenders','1 bag',18,9),
  ('Snacks','Fruit chips','1 pack',11,10),
  ('Fruit','Fresh fruit','Small amount',15,11),
  ('Condo','Paper goods','As needed',10,12),
  ('Snacks','Goldfish','1 box',11,13),
  ('Drinks','Drinks','Trip supply',25,14)
) as x(category,item,quantity,est_cost,sort_order)
on conflict (trip_id,item) do nothing;
