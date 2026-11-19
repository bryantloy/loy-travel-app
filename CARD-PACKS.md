# Loy Cards — earned packs (v0.16)

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
| 🚙 Explorer | Road to Hāna day, Tue 11/24 |
| 🔎 Quest | Find 5 Maui Quest targets (silly finds don't count) |
| 🏆 Quest II | Find 10 Maui Quest targets (silly finds don't count) |
| 👀 Spotter | Score 15 Quest points |
| 🔭 Sharp Eyes | Score 35 Quest points |
| 🧭 Island Tracker | Score 60 Quest points |
| 👑 Maui Legend | Score 90 Quest points |
| 🐠 Wildlife | Find 4 animal or ocean Quest targets |
| 📸 Family Memory | The family uploads 5 trip photos (shared count) |
| 🏄 Surf | Dad awards it if surf happens |
| 🍧 Shave Ice Judge | Dad awards it |
| 🎁 Dad Bonus | Dad awards it, as many as he likes, with an optional reason |

Day packs unlock on that Hawaiʻi date whether or not the plan holds, so weather never costs anyone a pack. Missed packs stay ready until opened. That's about 14 packs (56 cards) per traveler over the trip, plus any bonus packs.

**Dad's Pack Desk:** unlock the 🔒 All view with the admin code, then pick a traveler and a pack (Surf, Shave Ice Judge or Bonus) and tap Give. It appears ready to open on their profile.

Maui Quest finds are now saved per traveler on each phone (they were shared by everyone on the same phone), so each person's Quest packs are their own.

### Quest points

There are 42 finds worth 113 points in all. Big wildlife is worth the most: monk seal 12, spinner dolphins 10, humpback whale 10, octopus 8, reef shark 8, nēnē 6, honu 5, humuhumu 5. Twelve silly finds (grass, the ocean, the sun, a pool, a shaped cloud, sand in your shoe, a lost slipper, a rental Jeep, Spam musubi, a shaka, a brain freeze, Dad stopping for one more photo) are 1 point each. They count toward points packs only, so they can't unlock the find-5 and find-10 packs on day one. New finds use a big emoji tile instead of a photo. Unticking a find takes its points back, but a pack that was already opened stays opened.

## Pack odds

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
