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

Dating, breakups, a cheating mechanic, marriage (proposal → wedding as its
own beat), divorce, parenting choices, siblings, grandparents — all
**done** (this phase plus the initial event-pool pass). A real multi-option
dating *pool* (choosing between several potential partners at once, not
just one candidate per event) is still open for later.

**Open, not started**: the Relationships list (`PeopleTab`) currently
shows every action for every person, all the time — fine at 5 relationships,
already a lot at 15+. Should become collapsed rows by default (name,
relation, level) that expand on tap to reveal the action set — same
actions as today, just not all visible at once. Room to grow the action
set per relation type once it expands (right now family/friends only get
Spend Time/Talk/Messages; an expanded row is exactly where a "Give a
gift," "Have a difficult conversation," or type-specific action later
would go without recluttering the collapsed view).

**Exes + texting (done).** BitLife just deletes an ex from your life the
moment you break up (`alive: false`) — a real bug in our own earlier code
too, now fixed: breaking up, getting caught cheating, or divorcing changes
`Relationship.type` to `"ex"` instead of killing the relationship, so they
stick around as a real, contactable person (`src/data/events/romance.ts`).
Exes get their own action set — Text, Call, Booty Call, Send a Gift
(`src/engine/relationships.ts`) — each with randomized outcomes/flavor
lines (`src/data/textLines.ts`) and real relationship/happiness/money
effects; a relationship level of 75+ reconciles an ex back to `"partner"`
automatically (as long as you don't already have one), so "hitting them
up" can genuinely go somewhere, not just flavor text.

**Texts, for everyone (done).** Every relationship — not just exes — has
a message thread (`Relationship.messages`, capped at 40, oldest trimmed)
viewable via a real iPhone-style thread modal (`TextThreadModal.tsx`:
bubbles, contact header, age-stamped). Populated by whatever you send
*plus* **ambient texts** that appear on their own (a small per-year chance
per relationship, `ambientMessageTick()` inside `ageUp()`) so there's
always something to scroll through even for people you never explicitly
contact — funny/messy/scandalous flavor, not always plot-relevant, per the
BitLife vibe.

**Explicitly deferred** (per direct ask): NPCs *initiating* contact
unprompted (an incoming call/text that demands a response, rather than
ambient flavor sitting in a thread you check on your own time) — that's a
real interactive system, not just content, and needs its own design pass.
Email, similarly — noted, not started.

## Phase 3 — money & assets, plus a real world state

**Cars & real estate (done).** A real net worth beyond cash-in-hand:
`src/data/assets.ts` (catalogs — 5 car tiers, 5 home tiers, age-gated) and
`src/engine/assets.ts` (`buyCar`/`sellCar`/`buyHome`/`sellHome`/
`netWorth`/`tickAssets`) as their own new "Assets" tab
(`AssetsTab.tsx`). Buying a home is a real 20%-down mortgage amortized
straight-line over 15 years, deducted automatically inside `ageUp()`
alongside a flat yearly car-upkeep cost — both can push money negative
(no bankruptcy/foreclosure system yet, so overspending has a real, visible
consequence instead of being clamped away). `netWorth()` counts car value
and home equity, not just cash — verified exactly: net worth was
identical before and after a $65k car + $340k home purchase, since the
cash spent is offset by the asset value gained. Selling a car returns 65%
of its value (depreciation); selling a home returns the actual equity
(value minus remaining mortgage). Two pre-existing flavor events that
used to fire regardless of reality now check it: `car-repair` requires
actually owning a car, `rent-increase` requires *not* owning a home (you
can't get a rent hike on a mortgage) — both were live inconsistencies
this phase surfaced and fixed, not new content.

**Still open**: a simple stock-market mechanic, debt/loans beyond a
mortgage, credit score, taxes, retirement savings. All the money events
from Phase 1 remain the connective tissue for those.

**World state (done).** A shared, persistent-per-save `WorldState`

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

**Pulled forward and started early** (2026-09-22) — the plain-dark-cards
look was actively hurting usability well before the rest of this phase's
turn, so the first slice landed now rather than waiting: a real design
system (`src/theme.ts` — color/spacing/radius/type tokens), a proper
font (Nunito, self-hosted via Google Fonts, loaded behind the same gate
as save hydration so nothing renders in the fallback face), real vector
icons (`@expo/vector-icons`) replacing raw emoji everywhere in
interactive chrome, and two reusable primitives (`Card`, `Button`)
applied across every screen and modal.

**Next slice (done)**: real animations — `StatBar` fill eases via
`Animated.timing` instead of snapping, with a value-pulse on change; tab
switches cross-fade; the age number pulses on `ageUp()`; the Age Up
button and every `Button` press spring-scale down; `EventModal` enters
with a scale+fade spring (remounts per-event via a `key={event.id}` so
the entrance replays every time, not just the first). A first sound pass
landed alongside it: four short tones synthesized by
`scripts/generate-sounds.mjs` (self-generated, zero network/licensing
dependency) played via `expo-audio` — Age Up, an event choice, any ex
action (text/call/booty-call/gift), and game over (which pre-empts the
Age Up cue on the turn a character actually dies).

**Still open for later in this phase**: a mute/volume toggle (there's no
settings surface at all yet to put one on), and a custom app icon/splash
screen (still Expo's generic defaults).

## Phase 10 — identity: regional names & appearance

Character creation today is bare: a gender picker and two free-text name
fields, defaulting to one small, culturally narrow hardcoded pool
(`src/data/names.ts` — about a dozen first names per gender, 15 last
names total) with no concept of where a character is *from*. The ask:
add a real **country/region of origin** to character creation, then make
two things actually depend on it —
- **Names**: hundreds of real, region-appropriate first/last names per
  culture, not one pool reused for everyone regardless of origin.
- **Appearance**: `Stats.looks` is currently just a 0-100 number with no
  description behind it at all — no appearance system exists yet, visual
  or textual. Whatever gets built (starting with descriptive flavor text
  tied to origin, since there's no avatar/portrait system to hang a visual
  version on yet) needs to be demographically plausible for the chosen
  region, not randomized independent of it.

This is a real content-research phase, not a quick data add — doing
regional naming conventions and appearance respectfully means actually
sourcing accurate per-region data, not guessing. Touches character
creation UI (a region/country picker on `StartScreen`) and the `Character`
model (a new origin field). Not started.
