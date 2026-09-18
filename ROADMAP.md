# Roadmap

The ambition: a life-sim with more depth and variety than BitLife, with
**everything unlocked from the start.**

## Design principle: nothing is behind a paywall

This is the one rule every future phase has to respect:

- No premium currency, no "energy"/lives system, no ads, no subscription
  tier that unlocks content (BitLife's "Bitizenship" gates extra careers,
  activities, save slots, and removes ads — none of that exists here).
- No loot boxes / gacha for cosmetics, stat boosts, or rerolls.
- Every career, activity, relationship type, dungeon^Wcity, and cosmetic is
  unlocked by playing the game, never by paying for it.
- If a "support the game" mechanism ever gets added, it has to be
  cosmetic-only and never gate content. Default is no monetization at all.

Any future PR/change that adds a paywall, ad-gate, or pay-to-skip mechanic
is out of scope by default — that needs an explicit, separate ask from the
user, not an assumption.

## Phase 1 (in progress) — the event pool

BitLife's actual gameplay loop is thin — most of its depth is repeated
stat-check popups. The plan to beat that: a much bigger, better-organized
pool of events with real branching choices, split by category so it can
keep growing without turning into a 2000-line file:

- `src/data/events/childhood.ts` — ages 0-12
- `src/data/events/teen.ts` — 13-17
- `src/data/events/romance.ts` — dating, breakups, marriage, divorce
- `src/data/events/family.ts` — siblings, parents, kids, extended family
- `src/data/events/health.ts` — illness, mental health, accidents
- `src/data/events/money.ts` — windfalls, scams, bills, side hustles
- `src/data/events/career.ts` — workplace drama, interviews, promotions
- `src/data/events/random.ts` — random luck, weird encounters
- `src/data/events/senior.ts` — retirement, legacy, aging
- `src/data/events/index.ts` — combines them into the `EVENTS` pool the
  engine actually draws from

Target for this pass: roughly triple the pool (25 → ~90+ events).
Long-term target: 150-200+, matched to how much life-stage breadth the
game has (more systems below = more events per stage).

## Phase 2 — relationships depth

A real dating pool (multiple potential partners, not just "you met
someone"), breakups, a cheating mechanic, marriage (proposal → wedding as
its own beat, not a single popup), divorce with an asset split, parenting
choices that actually affect how a kid turns out, siblings, grandparents,
friendships that can sour into rivalries.

## Phase 3 — money & assets, plus a real world state

Cars, houses/real estate (buy/rent/sell), a simple stock-market mechanic,
debt/loans, credit score, taxes, retirement savings. All the money events
in Phase 1 are the connective tissue that leads here.

This is also where a **world state** layer belongs — right now every life
runs in total isolation; nothing shared exists between playthroughs or
even within one. The gap: `ageUp()` already does character ticks → filter
eligible events → hand back a choice (the real engine loop), but there's
no step before that for shared conditions — a recession year that cuts
salaries/job openings, a scripted "global event" flavor beat, that kind of
thing. Add it as its own tick inside `ageUp()`, feeding into event
eligibility and the job market, not as a separate system bolted on after.

## Phase 4 — crime & law

Petty crime → serious crime branches, getting caught, court/lawyers,
prison as its own mini life-inside-a-life, parole, a criminal record that
follows you into future job applications. Opt-in via in-fiction choices,
never gated behind anything.

## Phase 5 — health & aging depth

Real diagnosable conditions instead of an abstract health number, mental
health (therapy, depression/anxiety as their own arcs, not just flavor
text), addiction mechanics, hospital visits with real choices, and life
expectancy that's actually shaped by health history, not just a dice roll
against age.

## Phase 6 — careers depth

Full ladders with real promotions/demotions/firing, starting your own
business, a military path, fame-track careers (pro athlete, musician,
actor, influencer), and school arcs that are their own multi-year beat
(med school, law school, grad school) instead of one "college" checkbox.

## Phase 7 — pets & hobbies

Adoptable pets with their own care loop; hobbies (instrument, sport, art)
that build a skill and can turn into a career path (Phase 6 tie-in).

## Phase 8 — legacy & replay value

Play as your kid after death (a real family tree across generations),
an achievements/records screen, stats worth bragging about ("longest
life," "richest," "most kids").

## Phase 9 — presentation & the native build

Visual polish (icons/animations/transitions), sound, then the actual
iOS/Android build once the web version is content-rich. Still free, no
IAP, per the rule at the top of this doc.
