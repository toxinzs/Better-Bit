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
in Phase 1 are the connective tissue that leads here. **Not built yet.**

**World state (done).** A shared, persistent-per-save `WorldState`
(`src/types.ts`, `src/engine/worldState.ts`) ticks inside `ageUp()` —
Recession/Boom/War-Draft/Pandemic, at most one active at a time, each with
a randomized duration. It survives `restart()` and a new `startNewLife()`
unchanged (verified: starting a second life after game-over keeps the
same world year/history), which is the deliberate foundation for the
future Phase 8 legacy system — your kid will inherit the same ongoing
world, not a fresh one. Effects: `effectiveSalary()` scales pay ±15%
during boom/recession (job list + actual income both reflect it);
`investment-tip`/`side-hustle`/`promotion-chance` shift their odds/
thresholds under boom/recession; a passive health tick during pandemic;
four new personal choice events gated on an active condition
(`src/data/events/world.ts`): `draft-notice` (war, age 18-25),
`recession-layoff-scare`, `boom-job-offer`, `pandemic-vaccine`. A "World
News" card on the Home screen shows the active condition and its
elapsed/expected duration — visible, not hidden math, per the whole
point of this phase (BitLife's RNG feels arbitrary because you can't see
it coming). `lottery-ticket` deliberately stays untouched (pure luck, not
economically linked) — not every money event needs a world hook.
No job-availability shrinking yet (salary multiplier only) — a
reasonable v1 cut, not an oversight.

## Phase 4 — crime & law

Petty crime → serious crime branches, getting caught, court/lawyers,
prison as its own mini life-inside-a-life, parole, a criminal record that
follows you into future job applications. Opt-in via in-fiction choices,
never gated behind anything.

Once this phase and the world-state system (Phase 3) both exist, tie them
together: laws/penalties that actually change over time (a `WorldState`-
driven legal-climate condition, mirroring how Recession/Boom already
work), so a crime committed during a "crackdown" carries different stakes
than the same crime in an ordinary year. Noted here so it isn't lost —
not scoped until both halves exist.

## Phase 5 — health & aging depth, plus personality traits

Real diagnosable conditions instead of an abstract health number, mental
health (therapy, depression/anxiety as their own arcs, not just flavor
text), addiction mechanics, hospital visits with real choices, and life
expectancy that's actually shaped by health history, not just a dice roll
against age.

Also where permanent **personality traits** belong (Introvert,
Short-Tempered, Workaholic, Charismatic, etc.) — rolled or earned through
childhood events, and actually load-bearing: they should shift which
event choices are available, how fast skills grow, and how a character
reacts to trauma, not just be a label. This is a genuine gap in the
current build, not yet started.

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
