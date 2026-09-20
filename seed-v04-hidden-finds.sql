-- Loy Travel v0.4 — Hidden Finds candidate wave
-- Safe to run more than once. These are candidates, not fixed itinerary items.
with m as (select id from trips where name='Maui 2026' limit 1),
new_items(name,category,short_description,status) as (values
('Halemauʻu Trail to Rainbow Bridge','Hidden Find · Hike','2.2-mile round trip to a dramatic Haleakalā crater-edge viewpoint. Strong sunrise-day add-on candidate.','idea'),
('Hosmer Grove Bird Walk','Hidden Find · Hike','Short ~0.6-mile forest loop near 7,000 feet with native bird habitat; easy Haleakalā add-on.','idea'),
('Sliding Sands First Overlook','Hidden Find · Hike','Taste the otherworldly Haleakalā crater trail without committing to the full strenuous crossing.','idea'),
('Pā Kaʻoao Summit Walk','Hidden Find · Hike','Very short summit-area walk for another crater perspective when conditions cooperate.','idea'),
('Hoapili Trail Lava Coast','Hidden Find · Hike','Rugged South Maui lava-coast hiking candidate on a state-listed public trail.','idea'),
('ʻOhai Loop + Overlook','Hidden Find · Hike','Short West Maui coastal trail candidate with big ocean and cliff scenery.','idea'),
('Polipoli / Redwood Trail','Hidden Find · Hike','Cool-elevation forest hiking candidate for a totally different side of Maui. Verify park/trail status before going.','idea'),
('Waihou Spring Trail','Hidden Find · Hike','Upcountry forest walk candidate listed by Hawaiʻi Nā Ala Hele.','idea'),
('Keʻanae Arboretum Walk','Hidden Find · Explore','Low-key Road to Hāna botanical stop candidate listed in the state trail system.','idea'),
('Lahaina Pali Trail','Hidden Find · Hike','Dry, exposed ridge hike candidate with broad West Maui views; only for a conditions-appropriate day.','idea'),
('Haleakalā Ridge Trail','Hidden Find · Hike','State-listed high-country trail candidate for the family to research before choosing.','idea'),
('Boundary Trail','Hidden Find · Hike','Another official Maui Nui trail candidate for the adventure shortlist; research route and conditions before planning.','idea')
)
insert into activities(trip_id,name,category,short_description,status)
select m.id,n.name,n.category,n.short_description,n.status from m cross join new_items n
where not exists (select 1 from activities a where a.trip_id=m.id and a.name=n.name);
