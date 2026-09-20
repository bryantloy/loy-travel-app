-- Loy Travel v0.5 — Food discovery + family restaurant voting
-- Safe to run more than once.

create table if not exists restaurants (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips(id) on delete cascade,
  name text not null,
  area text,
  meal_types text,
  cuisine text,
  price_level text,
  short_description text,
  drive_from_lodging text,
  pairs_with text,
  has_chicken boolean not null default false,
  has_burgers boolean not null default false,
  has_tacos boolean not null default false,
  has_pizza boolean not null default false,
  website_url text,
  menu_url text,
  maps_url text,
  created_at timestamptz not null default now(),
  unique(trip_id,name)
);

create table if not exists restaurant_votes (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  traveler_id uuid not null references travelers(id) on delete cascade,
  vote text not null check (vote in ('fire','interested','meh','nope')),
  updated_at timestamptz not null default now(),
  unique(restaurant_id,traveler_id)
);

alter table restaurants enable row level security;
alter table restaurant_votes enable row level security;

do $$ begin
  create policy "family test read restaurants" on restaurants for select using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "family test read restaurant votes" on restaurant_votes for select using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "family test insert restaurant votes" on restaurant_votes for insert with check (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "family test update restaurant votes" on restaurant_votes for update using (true) with check (true);
exception when duplicate_object then null; end $$;

with m as (select id from trips where name='Maui 2026' limit 1),
r(name,area,meal_types,cuisine,price_level,short_description,drive,pairs,chicken,burgers,tacos,pizza,website,menu,maps) as (values
('Monkeypod Kitchen Kaʻanapali','West Maui · Kaʻanapali','Lunch · Dinner','Hawaiʻi regional · seafood · pizza','$$$','Big-flavor Maui restaurant with local fish, pizzas and a broad menu.','~5–10 min','Great resort-day or West Maui dinner.',true,true,true,true,'https://www.monkeypodkitchen.com/','https://www.monkeypodkitchen.com/menus/','https://www.google.com/maps/search/?api=1&query=Monkeypod+Kitchen+Kaanapali+Maui'),
('Leilani’s on the Beach','West Maui · Kaʻanapali','Lunch · Dinner','Hawaiian · seafood · beach grill','$$$','Beachfront Kaʻanapali option with island food and familiar choices.','~5–10 min','Easy pairing with Black Rock, Kaʻanapali beach or a resort day.',true,true,true,false,'https://www.leilanis.com/','https://www.leilanis.com/menus/','https://www.google.com/maps/search/?api=1&query=Leilanis+on+the+Beach+Maui'),
('Castaway Cafe','West Maui · Kaʻanapali','Breakfast · Lunch · Dinner','Casual island · burgers · seafood','$$','Oceanfront casual choice with burgers, chicken tenders, fish tacos and breakfast.','~5 min','Very easy Honua Kai / West Maui meal.',true,true,true,false,'https://www.castawaycafe.com/','https://www.castawaycafe.com/menu/','https://www.google.com/maps/search/?api=1&query=Castaway+Cafe+Maui'),
('Leoda’s Kitchen and Pie Shop','West Maui · Olowalu','Lunch · Early dinner','Comfort food · sandwiches · pies','$$','Casual family stop known for sandwiches and sweet/savory pies.','~25–35 min','Good when driving between West Maui and Maʻalaea/South Maui.',true,true,false,false,'https://www.leodas.com/','https://www.leodas.com/','https://www.google.com/maps/search/?api=1&query=Leodas+Kitchen+and+Pie+Shop+Maui'),
('Paʻia Fish Market · Paʻia','North Shore · Paʻia','Lunch · Dinner','Fresh fish · burgers · casual','$$','Counter-service Maui classic with fresh catch plus burgers and kids choices.','~60–75 min','Natural stop on a Paʻia / North Shore / Road-to-Hāna day.',true,true,true,false,'https://paiafishmarket.com/','https://paiafishmarket.com/','https://www.google.com/maps/search/?api=1&query=Paia+Fish+Market+Paia+Maui'),
('Flatbread Company · Paʻia','North Shore · Paʻia','Lunch · Dinner','Wood-fired pizza · salads','$$','Easy family win with wood-fired pizza and locally sourced toppings.','~60–75 min','Great Paʻia or Road-to-Hāna bookend meal.',true,false,false,true,'https://flatbreadcompany.com/locations/paia-maui-hi/','https://flatbreadcompany.com/locations/paia-maui-hi/','https://www.google.com/maps/search/?api=1&query=Flatbread+Company+Paia+Maui'),
('Tin Roof Maui','Central Maui · Kahului','Lunch · Early dinner','Local Hawaiʻi · takeout','$$','Chef Sheldon Simeon’s casual local-food counter; strong choice for something distinctly Maui.','~50–60 min','Useful near airport/Costco or when crossing Central Maui.',true,false,false,false,'https://www.tinroofmaui.com/','https://www.tinroofmaui.com/','https://www.google.com/maps/search/?api=1&query=Tin+Roof+Maui'),
('Nalu’s South Shore Grill','South Maui · Kīhei','Breakfast · Lunch · Dinner','Local · burgers · chicken · brunch','$$','Relaxed South Maui spot with loco moco, chicken & waffles, burgers and local dishes.','~55–70 min','Pair with a Kīhei / South Maui beach or snorkel day.',true,true,false,false,'https://naluskihei.com/','https://naluskihei.com/menus/','https://www.google.com/maps/search/?api=1&query=Nalus+South+Shore+Grill+Maui'),
('Cool Cat Cafe · Kīhei','South Maui · Kīhei','Lunch · Dinner','Burgers · diner','$$','Family-style burger stop with shakes plus chicken, fish and sandwiches.','~55–70 min','Easy South Maui fallback when everyone wants familiar food.',true,true,false,false,'https://www.coolcatcafe.com/kihei/','https://www.coolcatcafe.com/kihei/','https://www.google.com/maps/search/?api=1&query=Cool+Cat+Cafe+Kihei+Maui'),
('Paʻia Fish Market · Southside','South Maui · Kīhei','Lunch · Dinner','Fresh fish · burgers · casual','$$','Same Maui fish-market concept in South Maui; flexible for mixed appetites.','~55–70 min','Pair with South Maui snorkeling, beaches or Molokini from Makena.',true,true,true,false,'https://paiafishmarket.com/','https://paiafishmarket.com/','https://www.google.com/maps/search/?api=1&query=Paia+Fish+Market+Southside+Kihei'),
('Kula Bistro','Upcountry · Kula','Breakfast · Lunch · Dinner','Bistro · burgers · pizza · pasta','$$','Broad Upcountry menu with burgers, pizzas, chicken, pasta and local favorites.','~75–90 min','Strong Haleakalā/Upcountry option because almost everyone can find something.',true,true,false,true,'https://kulabistro.com/','https://kulabistro.com/','https://www.google.com/maps/search/?api=1&query=Kula+Bistro+Maui'),
('Haliʻimaile General Store','Upcountry · Haliʻimaile','Lunch · Dinner','Hawaiʻi regional cuisine','$$$','More destination-style Upcountry meal with regional Maui flavors.','~65–80 min','Potential nicer meal on an Upcountry day rather than a special drive from Honua Kai.',true,false,false,true,'https://hgsmaui.com/','https://hgsmaui.com/menus/','https://www.google.com/maps/search/?api=1&query=Haliimaile+General+Store+Maui'),
('Hāna Farms · Bamboo Hale','East Maui · Hāna','Lunch · Early dinner','Farm-to-table · pizza · local','$$','Open-air farm stop with local plates; pizza is especially associated with Friday service, so verify the current menu for your day.','Road-to-Hāna day','Build directly into the Hāna route rather than treating it as a separate restaurant trip.',true,false,false,true,'https://www.hanafarms.com/','https://www.hanafarms.com/restaurant','https://www.google.com/maps/search/?api=1&query=Hana+Farms+Maui'),
('Ululani’s Hawaiian Shave Ice · Māʻalaea','Māʻalaea','Treat / dessert','Shave ice','$','A Maui treat stop with a Māʻalaea location that can pair naturally with harbor excursions.','~40–50 min','Perfect add-on before/after a Maʻalaea harbor day.',false,false,false,false,'https://www.ululanishawaiianshaveice.com/','https://www.ululanishawaiianshaveice.com/locations/','https://www.google.com/maps/search/?api=1&query=Ululanis+Shave+Ice+Maalaea'),
('Maʻalaea General Store & Cafe','Māʻalaea','Breakfast · Lunch · Early dinner','Cafe · sandwiches · burgers · tacos','$$','Practical harbor-area cafe with broad casual options.','~40–50 min','Potential easy meal around a Maʻalaea Molokini departure.',true,true,true,false,'https://maalaeageneralstore.com/','https://maalaeageneralstore.com/','https://www.google.com/maps/search/?api=1&query=Maalaea+General+Store+Maui')
)
insert into restaurants(trip_id,name,area,meal_types,cuisine,price_level,short_description,drive_from_lodging,pairs_with,has_chicken,has_burgers,has_tacos,has_pizza,website_url,menu_url,maps_url)
select m.id,r.name,r.area,r.meal_types,r.cuisine,r.price_level,r.short_description,r.drive,r.pairs,r.chicken,r.burgers,r.tacos,r.pizza,r.website,r.menu,r.maps
from m cross join r
on conflict (trip_id,name) do update set
area=excluded.area,meal_types=excluded.meal_types,cuisine=excluded.cuisine,price_level=excluded.price_level,short_description=excluded.short_description,drive_from_lodging=excluded.drive_from_lodging,pairs_with=excluded.pairs_with,has_chicken=excluded.has_chicken,has_burgers=excluded.has_burgers,has_tacos=excluded.has_tacos,has_pizza=excluded.has_pizza,website_url=excluded.website_url,menu_url=excluded.menu_url,maps_url=excluded.maps_url;
