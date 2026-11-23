# Loy Cards — earned packs (v0.18)

How the boys earn and open card packs on the Maui trip. Code: `packs.js` (rules and storage) and the card section of `app.js` (screens). Tuning numbers all live in `CONFIG` at the top of `packs.js`.

## Who collects

Bryant, Bryson, Bennett and Brooks. Grandpa Rick and Guest don't collect (Guest still sees the full showcase).

Each traveler can pull their own personal cards plus Dad, Family, Pets/Finn and Maui cards. Brothers' personal cards stay private, the same as before.

## How packs are earned

Everyone starts with one **Starter Pack** of 4 cards. Then each traveler can earn these, once each:

| Pack | How it unlocks |
|---|---|
| 🌺 Aloha Arrival | Arrival day, Thu 11/19 |
| 🌋 Haleakalā | Sunrise day, Sat 11/21 |
| 🐢 Ocean | Pride of Maui day, Mon 11/23 |
| 🤿 Snorkel | Molokini snorkel day, Mon 11/23. Gives all 5 Snorkel cards (Molokini Reef Rush, Honu Guardian, Pride of Maui Adventure, Spinner Dolphin Flyby, Octo Hideaway), outside the normal pull rules |
| 🚙 Explorer | Road to Hāna day, Tue 11/24 |
| 🔎 Quest | Find 5 Maui Quest targets (silly finds don't count) |
| 🏆 Quest II | Find 10 Maui Quest targets (silly finds don't count) |
| 🧭 Quest III | Find 20 Maui Quest targets over the trip |
| 👑 Quest Master | Find 35 Maui Quest targets over the trip |
| ⭐ Points Pack | One every 15 Quest points (15, 30, 45, ...), no limit |
| 💯 100 Point Bonus | Extra pack for reaching 100 Quest points |
| 🐠 Wildlife | Find 4 animal or ocean Quest targets |
| 🐋 Wildlife II | Find 12 animal or ocean Quest targets over the trip |
| 📸 Family Memory | The family uploads 5 trip photos (shared count) |
| 🏄 Surf | Dad awards it if surf happens |
| 🍧 Shave Ice Judge | Dad awards it |
| 🎁 Dad Bonus | Dad awards it, as many as he likes, with an optional reason |

Day packs unlock on that Hawaiʻi date whether or not the plan holds, so weather never costs anyone a pack. Missed packs stay ready until opened. Finds reset each Hawaiʻi day, so the counts above add up over the whole trip. Each boy's packs pull from all 102 cards (his own are still more likely), so a full set is the starter plus 25 packs. About 14 come from day, quest, wildlife, photo, Dad and bonus packs; the rest is about 165 points, roughly 24 a day. Dad's Bonus packs can close any gap. Bryant's packs use the 61 shared cards.

**Dad's Pack Desk:** unlock the 🔒 All view with the admin code, then pick a traveler and a pack (Surf, Shave Ice Judge or Bonus) and tap Give. It appears ready to open on their profile.

Maui Quest finds are saved per traveler, per day, on each phone. Every find can be claimed once a day and resets the next morning. The Quest screen shows found today, points today and trip points.

### Quest points

There are 81 finds. Big wildlife is worth the most: monk seal 12, spinner dolphins 10, humpback whale 10, octopus 8, reef shark 8, eagle ray 8, nēnē 6, honu 5, humuhumu 5, double rainbow 5. New in v0.18 is a 🍽️ Food group (shave ice, chicken tenders, kalua pulled pork, pizza, banana bread, poke, malasada, açaí bowl, fish tacos, pineapple, coconut drink, loco moco, huli huli chicken, plate lunch, pineapple soft serve, macadamia nuts), plus sunset, sunrise, starry sky, any waterfall, tide pool, toes in the sand, another island, surfer, outrigger, hula, sea urchin, Moorish idol, hermit crab, cardinal and cattle egret. Silly finds (now 19, like sunburn, a Dad joke, a car nap and socks with sandals) are 1 point each and count toward points packs only. Unticking a find takes today's points back, but a pack that was already opened stays opened.

## Trip memory cards (v0.19)

Cards made from real trip photos have `"memory": true` in `card-catalog.json` (22 cards as of Nov 23). Until a traveler owns all of them, every pack has at least one (`memoryPerPack` in packs.js), and they are 3x as likely as other cards everywhere else (`memoryWeight`). A full set still takes the same number of packs; the memory cards just come sooner. In simulation a boy gets about 13 memory cards in his first 10 packs (was about 4) and has them all by about pack 14 (was about 28).

To make a new card a memory card, add `"memory": true` to its catalog entry.

New cards added after a boy finishes the set go straight into his next pack: the collection roll only draws cards he is missing, so a boy who owned everything gets the new cards first (all four Nov 23 cards land in one pack).

## Bonus points (v0.19)

Shown in a Bonus points box at the top of Maui Quest > Finds. All of it counts toward points packs (every 15) and the 100 point bonus, and is saved per traveler on the phone, like finds.

- **Daily 3:** a Hawaiʻi day with 3 or more finds (silly ones count) gives +3, then +1 more for each day in a row before it, up to +6.
- **Brother team-up (boys only):** on a find logged today, tap 🤝 when brothers found it together: 2 brothers +2, all 3 +3, up to 5 team-ups a day. Honor system: each boy taps it on his own phone.
- **Trip day photo finds:** 5 Pride of Maui finds from Mon 11/23 and 6 Road to Hāna finds from Tue 11/24 (2 to 4 points). They stay open after their day in case plans move, and each counts once over the trip.
- **Favorite memory vote:** from Wed 11/25 through Fri 11/27, each traveler picks a favorite trip memory card for +5 (once; the vote can be changed).

## Pack odds

**Collect first (v0.18):** until a traveler owns every card in their pool, every pack is 4 cards they don't have yet. The rarity is still rolled by the odds below, weighted by how many of that rarity they're missing, so big cards still feel rare early. **Own cards first:** until a traveler has all of their own cards, every pack holds at least 2 of them, so each boy has all 14 of his own within his first 7 packs. Once the set is complete, packs go back to the normal rules below and can give duplicates.

4 cards per pack. Each slot rolls a rarity first, then a card within that rarity:

| Common | Bronze | Uncommon | Rare | Gold | Epic | Legendary |
|---|---|---|---|---|---|---|
| 40% | 20% | 15% | 15% | 4% | 5% | 1% |

Rules that keep high cards special:

- **One hit per pack:** at most one card that's rare or better in any pack.
- **Cooldown:** after pulling a gold, epic or legendary, the next 2 packs can't roll one.
- **Pity:** 4 packs in a row with nothing rare+ means the next pack has a rare+. 6 packs in a row with no gold/epic/legendary means the next pack has one. Nobody goes the whole trip without a big card.
- **Duplicates are allowed** and counted (×2, ×3).
- **Reachable good cards:** within a rarity, cards you don't own yet are 2.5× as likely, and your own personal cards are 2× as likely as shared ones.
- If someone's pool has no card at a rolled rarity (Bryant has no gold), it steps down to the next rarity that has one.

## What a trip looks like (simulation, 14 packs of 4 each)

From `node tools/simulate-packs.js 14`, averaged over 20,000 trips:

- Per boy: about 25 common, 12 bronze, 9 uncommon, 7 rare, 1.1 gold, 1.4 epic and 0.3 legendary.
- About 41 different cards and 14 duplicates.
- About 7 in 10 packs have a rare or better (still never more than one per pack).
- Every boy gets at least one gold/epic/legendary card, about 2.3 on average; about 1 in 4 boys pulls a legendary.
- Each boy has about a 74% chance at his own gold card, about 23–28% at each of his own epics, and about 12–15% at each shared epic.

## Storage

- **Shared (after the SQL runs):** `SUPABASE-v016-CARD-PACKS.sql` adds the `earned_packs` table (one row per pack, with the 3 card ids) and a `card_collections` view (one row per card pulled). Each pack can only open once per traveler, even across phones. Additive only; nothing existing changes.
- **Before the SQL runs:** packs save on the phone (`loy-packs-v016` in localStorage) and copy up automatically the first time the app sees the table.
- Starter packs keep their old flag (`loy-starter-opened-<name>`) and are also saved as a `starter` row.

## New cards

The catalog is now 108 cards. 34 are new and marked `"art": "pending"`: the 8 from the handoff batch (Bear Nose Bandits is the new legendary), 8 from Bryant's photos (Optic Blast Dad, Marching Mako, Trail Blazer Bryson, Web Warrior Bennett, Shark Run Finisher, Selfie Squad, Sheriff Brooks, Captain Number 5) and 18 Maui trip cards tied to real stops. They lean low: 6 common, 6 bronze, 10 uncommon, 9 rare, 2 epic, 1 legendary. Until art is uploaded they show a designed placeholder face.

- `CARD-ART-SETS.md`: the first 28 to make, in 7 copy-paste prompts of 4 cards each.
- `CARD-ART-PROMPTS.md`: a prompt and filename for every pending card.

## Shared cards

A card can belong to two boys: its `owner` is one boy and `"also": ["<other boy>"]` adds it to the other boy's pool (and his Dad's Pack Desk view). Pirate Island Duo is Bennett's and Brooks's.

Set `boysPullAll:false` in packs.js CONFIG to go back to each boy pulling only his own cards plus shared ones.
