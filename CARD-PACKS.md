# Loy Cards — earned packs (v0.16)

How the boys earn and open card packs on the Maui trip. Code: `packs.js` (rules and storage) and the card section of `app.js` (screens). Tuning numbers all live in `CONFIG` at the top of `packs.js`.

## Who collects

Bryant, Bryson, Bennett and Brooks. Grandpa Rick and Guest don't collect (Guest still sees the full showcase).

Each traveler can pull their own personal cards plus Dad, Family, Pets/Finn and Maui cards. Brothers' personal cards stay private, the same as before.

## How packs are earned

Everyone starts with their existing **Starter Pack** (unchanged). Then each traveler can earn these, once each:

| Pack | How it unlocks |
|---|---|
| 🌺 Aloha Arrival | Arrival day, Thu 11/19 |
| 🌋 Haleakalā | Sunrise day, Sat 11/21 |
| 🐢 Ocean | Pride of Maui day, Mon 11/23 |
| 🚙 Explorer | Road to Hāna day, Tue 11/24 |
| 🔎 Quest | Find 5 Maui Quest targets |
| 🏆 Quest II | Find 10 Maui Quest targets |
| 🐠 Wildlife | Find 4 animal or ocean Quest targets |
| 📸 Family Memory | The family uploads 5 trip photos (shared count) |
| 🏄 Surf | Dad awards it if surf happens |
| 🍧 Shave Ice Judge | Dad awards it |
| 🎁 Dad Bonus | Dad awards it, as many as he likes, with an optional reason |

Day packs unlock on that Hawaiʻi date whether or not the plan holds, so weather never costs anyone a pack. Missed packs stay ready until opened. That's about 10 packs (30 cards) per traveler over the trip, plus any bonus packs.

**Dad's Pack Desk:** unlock the 🔒 All view with the admin code, then pick a traveler and a pack (Surf, Shave Ice Judge or Bonus) and tap Give. It appears ready to open on their profile.

Maui Quest finds are now saved per traveler on each phone (they were shared by everyone on the same phone), so each person's Quest packs are their own.

## Pack odds

3 cards per pack. Each slot rolls a rarity first, then a card within that rarity:

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

## What a trip looks like (simulation, 11 packs each)

From `node tools/simulate-packs.js 11`, averaged over 20,000 trips:

- Per boy: about 14 common, 7 bronze, 5 uncommon, 4.6 rare, 0.8 gold, 1 epic and 0.2 legendary.
- About 28 different cards and 4 to 5 duplicates.
- About 6 in 10 packs have a rare or better.
- Almost every boy gets 1 to 2 gold/epic/legendary cards; about 1 in 5 boys pulls a legendary.
- Each boy has about a 60% chance at his own gold card, about 17–21% at each of his own epics, and about 9–11% at each shared epic.

## Storage

- **Shared (after the SQL runs):** `SUPABASE-v016-CARD-PACKS.sql` adds the `earned_packs` table (one row per pack, with the 3 card ids) and a `card_collections` view (one row per card pulled). Each pack can only open once per traveler, even across phones. Additive only; nothing existing changes.
- **Before the SQL runs:** packs save on the phone (`loy-packs-v016` in localStorage) and copy up automatically the first time the app sees the table.
- Starter packs keep their old flag (`loy-starter-opened-<name>`) and are also saved as a `starter` row.

## New cards

The catalog is now 100 cards. 26 are new and marked `"art": "pending"`: the 8 from the handoff batch (Bear Nose Bandits is the new legendary) and 18 Maui trip cards tied to real stops. They lean common, bronze and uncommon (6 common, 5 bronze, 7 uncommon, 6 rare, 1 epic, 1 legendary). Until art is uploaded they show a designed placeholder face. Prompts and filenames are in `CARD-ART-PROMPTS.md`.
