# Roadmap

The ambition: a life-sim with more depth and variety than BitLife, with
**everything unlocked from the start.**

## Design principle: nothing is behind a paywall

This is the one rule every future update has to respect:

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

## How this roadmap is organized

Two kinds of entries below, both **free**, both shipped the same way (build
it, verify it, commit, push):

- **Core Updates** — systems every character touches no matter how they
  play: the event pool, relationships, money, the world around you,
  character creation, presentation. These are the base game, and they keep
  getting revisited/expanded over time rather than being "finished" once.
- **DLC Packs** — big, self-contained systems in the shape BitLife would
  sell as a paid DLC (Prison Life, Pets, High School, ...): crime, deep
  health/personality, career depth, pets/hobbies, legacy/generations. Here
  they're just **major free updates** — "DLC" is a naming/scoping
  convenience (it tells you "this is a whole new system, big enough to plan
  and ship as one unit"), not a monetization tier. A character who never
  touches a given pack still has a complete, working game without it.

Status markers per item: **done**, **in progress**, or **not started**.

---

## Core Updates

### Update: Foundations — event pool + relationships

**Event pool (in progress).** BitLife's actual gameplay loop is thin — most
of its depth is repeated stat-check popups. The plan to beat that: a much
bigger, better-organized pool of events with real branching choices, split
by category so it can keep growing without turning into a 2000-line file:

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

**Relationships depth (done).** Dating, breakups, a cheating mechanic,
marriage (proposal → wedding as its own beat), divorce, parenting choices,
siblings, grandparents. A real multi-option dating *pool* (choosing between
several potential partners at once, not just one candidate per event) is
still open for later.

**Collapsible relationship rows (done).** The Relationships list
(`PeopleTab.tsx`) used to show every action for every person, all the
time — fine at 5 relationships, already a lot at 15+. Now each row is
collapsed by default (icon, name, relation type, level, chevron) and
expands independently on tap to reveal its action set — a `Set<string>`
of expanded IDs in `PeopleTab`, not an accordion, so any number of rows
can be open at once. A new `RelationshipRow` component owns a rotating
chevron (`Animated.Value`, 0→180deg) and a fade-in (`Animated.timing`,
200ms) on the revealed action row; the action buttons themselves are
unchanged (Spend Time/Talk/Messages for most relations, Messages-only for
exes) — only the reveal mechanism changed. Room to grow the action set
per relation type is still exactly here: an expanded row is where a
"Give a gift," "Have a difficult conversation," or type-specific action
later would go without recluttering the collapsed view.

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

### Update: Money & World

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
this update surfaced and fixed, not new content.

**Debt & credit score (done).** Personal loans and a revolving credit
card, both real interest-bearing debt: `src/data/loans.ts` (catalogs,
gated by age + credit score — a Medium/Large personal loan and the
better card tiers require a real score, not just cash on hand),
`src/engine/debt.ts` (`takeOutLoan`/`openCreditCard`/`chargeCard`/
`payDownLoan`/`tickDebt`), a new "Credit & Loans" card in the Money tab.
Personal loans use the same straight-line simplification the home
mortgage already does, just with real interest baked into the total
(simple interest, spread evenly over the term). The credit card is a
real revolving balance: interest accrues on the outstanding balance
every year, then an automatic minimum payment (5% of balance or $25,
whichever is bigger) gets deducted — same "no bankruptcy system, so
overspending has a real, visible consequence" precedent the mortgage
already set. `creditScore` (300-850, additive-optional field like
`WorldState` on old saves, defaults 650) moves on real signals, not a
hidden roll: +2/year per loan paid on time, -3/year while a card sits
above 70% utilization, +15 on full payoff, -15 the year your money goes
negatively into the red. `netWorth()` now subtracts total loan balance
— verified exactly end to end (a $2,000 loan's balance/payment/payoff
schedule and a credit card's interest-then-minimum-payment math both
matched hand-computed values every year, and the displayed net worth on
screen matched `money + assets - debt` to the dollar).

**Stock market (done).** Six fictional companies (`src/data/stocks.ts`
— no real tickers, no real market data, entirely simulated) with prices
that move every year (`src/engine/stocks.ts`'s `tickMarket`, called
inside `ageUp()`): a modest baseline drift (+2%/yr, like a real index'
long-run average) shifted by the active `WorldState` condition (+6%
boom, -8% recession) plus a random shock scaled to each stock's own
volatility. Prices are **shared, world-level state** (`WorldState.stocks`,
seeded in `createInitialWorldState()`), the same reasoning `WorldState`
itself already uses — everyone in a save watches the same market, and a
future generation (Legacy DLC) will inherit the same ongoing one instead
of a fresh one. `buyStock`/`sellStock` support partial sells (real
cost-basis tracking per holding, for a real gain/loss figure, not just a
current-value number) and are gated to age 18+ (a "too young to open a
brokerage account" message below that, same pattern as the car/home
gates). A new "Investments" card in the Money tab shows owned positions
(shares, current value, gain/loss in green/red) above a market list
(price, this-year's % change in green/red, a quick "Buy $500 worth"
button sized to whatever that buys in whole shares). `totalNetWorth()`
(new composed export in `lifeEngine.ts` — `netWorth()` itself stays
car/home/debt-only, doesn't know stocks exist) adds portfolio value on
top of the existing net worth calculation; `GameOverScreen` and the
Money tab both switched to it. Verified exactly end to end: buy/sell/
partial-sell math down to the dollar, a rejected over-limit sell, and
the displayed net worth on screen matching `money + assets - debt +
portfolio` by hand — including catching and fixing a real bug the first
version of this check surfaced (`portfolioValue()` returned fractional
cents since stock prices carry cents, silently breaking the
whole-dollar convention every other number in the game follows; now
rounds like everything else).

**Income taxes (done).** `src/engine/taxes.ts`'s `incomeTax()` — real
progressive brackets (a simplified, flattened version of actual US
federal single-filer brackets: 10/12/22/24/32/35/37%, each rate only
applying to the income inside that bracket, not the whole salary) —
now actually withheld every year a job pays out, instead of the
pre-tax `effectiveSalary()` figure landing straight in `character.money`
like it used to. The yearly income log line spells out gross/tax/
take-home rather than hiding the math (`$95,000 working as a Nurse —
$16,208 to taxes, $78,792 take-home`, for example). The Career tab
shows both the gross figure per listing (unchanged, still what
`effectiveSalary()`/boom/recession scale) and take-home underneath it,
plus a take-home line on the current-job card. Verified exactly:
$18,000 (crosses 2 brackets) and a $250,000 test salary (crosses every
bracket) both matched hand-computed tax to the dollar. Only wages are
taxed — side hustles, investment windfalls, and stock sale proceeds
stay untouched, the same kind of scope cut the rest of this system
already makes (no real amortization curve on the mortgage either).

**Retirement savings (done).** A real 401(k)-style account
(`src/engine/retirement.ts`, `Character.retirement`): a contribution
rate (0-50%, adjustable in 1% steps in the Money tab) comes off gross
income **pre-tax** — the same pre-tax mechanic a real 401(k) uses,
genuinely tying into the income-tax system built two updates ago rather
than just being flavor, since the contribution actually shrinks the
taxable income `incomeTax()` runs on. The employer matches 50% of the
first 6% contributed (real-world-typical structure), added on top for
free. Growth is tied to the same simulated market everything else
invests in — each year the balance moves by the *average* of that
year's per-stock price change (the same numbers `tickMarket` just
computed), like a simple index fund, rather than its own separate RNG
model. Withdrawing before age 60 costs a real 10% early-withdrawal
penalty; withdrawing after doesn't (withdrawals aren't taxed again on
the way out, unlike a real 401(k) — a deliberate scope cut, not an
oversight, matching how nothing else in this system re-taxes stock
sale proceeds either). `totalNetWorth()` now includes the balance.
Verified exactly: pre-tax contribution shrinking taxable income by the
right amount, employer match staying capped at 6% even at a 20%
contribution rate, growth matching the actual market move that tick to
the dollar, and both withdrawal penalty paths.

This closes out the "money & world" update's whole open list from
three updates ago (stock market, debt/credit, taxes, retirement) — the
connective tissue from here is content, not new systems: more of the
event pool leaning on what already exists (a windfall event offering
"put some in retirement," a side hustle interacting with credit,
etc.), not another financial mechanic.

**World state (done).** A shared, persistent-per-save `WorldState`
(`src/types.ts`, `src/engine/worldState.ts`) ticks inside `ageUp()` —
Recession/Boom/War-Draft/Pandemic, at most one active at a time, each with
a randomized duration. It survives `restart()` and a new `startNewLife()`
unchanged (verified: starting a second life after game-over keeps the
same world year/history), which is the deliberate foundation for the
future Legacy DLC — your kid will inherit the same ongoing world, not a
fresh one. Effects: `effectiveSalary()` scales pay ±15% during
boom/recession (job list + actual income both reflect it);
`investment-tip`/`side-hustle`/`promotion-chance` shift their odds/
thresholds under boom/recession; a passive health tick during pandemic;
four new personal choice events gated on an active condition
(`src/data/events/world.ts`): `draft-notice` (war, age 18-25),
`recession-layoff-scare`, `boom-job-offer`, `pandemic-vaccine`. A "World
News" card on the Home screen shows the active condition and its
elapsed/expected duration — visible, not hidden math, per the whole
point of this update (BitLife's RNG feels arbitrary because you can't see
it coming). `lottery-ticket` deliberately stays untouched (pure luck, not
economically linked) — not every money event needs a world hook.
No job-availability shrinking yet (salary multiplier only) — a
reasonable v1 cut, not an oversight.

**Future tie-in, noted not scoped**: once the Crime & Punishment DLC
exists, tie its laws/penalties to `WorldState` too (a legal-climate
condition mirroring Recession/Boom), so a crime committed during a
"crackdown" carries different stakes than the same crime in an ordinary
year.

### Update: Identity — regional names & appearance

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
model (a new origin field). **Not started.**

### Update: Presentation & the native build

Visual polish (icons/animations/transitions), sound, then the actual
iOS/Android build once the web version is content-rich. Still free, no
IAP, per the rule at the top of this doc. This update never really
"finishes" — every DLC pack below gets its own presentation pass as it
lands (its own icons, its own screens), same as this one did for the base
game.

**Pulled forward and started early** (2026-09-22) — the plain-dark-cards
look was actively hurting usability well before the rest of this update's
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

**Versioning (done).** A real version number (`src/version.ts`'s
`APP_VERSION`) and an in-game changelog (`CHANGELOG`, newest first),
surfaced via a small "v1.0.0 · What's New" link on the Start screen
that opens `WhatsNewModal`. The point: make this feel like a real,
actively-shipped game with real builds, not a pile of invisible
features. Convention going forward — bump the minor version and add a
changelog entry when a Core Update or DLC pack lands, bump the patch
version for a real fix; the current entry (1.0.0, "The money update")
retroactively covers the whole Money & World push plus the collapsible
relationships UI, since versioning started after those already shipped.

**Still open for later in this update**: a mute/volume toggle (there's no
settings surface at all yet to put one on), and a custom app icon/splash
screen (still Expo's generic defaults).

---

## DLC Packs

Each of these is a whole new system, big enough to design, build, and
verify as its own unit — the "DLC" framing is purely organizational (see
"How this roadmap is organized" above). All free, all unlocked from the
start once built, same as everything else.

### DLC: Crime & Punishment — v1 done, court/lawyers still open

**v1 (done).** A real Crime tab with eight crimes across three tiers
(petty/moderate/serious — `src/data/crimes.ts`), each with a real success
chance (`successChance()` in `src/engine/crime.ts` — your smarts shifts
it, not a flat roll) and a real reward range on success. Getting caught
doesn't auto-resolve: it produces a synthetic "arrest" `LifeEvent` reusing
the exact same `pendingEvent`/`EventModal` machinery `ageUp()` already
uses for random events, so no separate UI was needed for it. The choice
is real — pay the bail amount to settle it with just a record (a real
credit score hit, -25), or can't/won't pay and do the time (inJail=true,
a rolled sentence, a bigger credit hit, -50, and your job is gone). Jail
is its own branch inside `ageUp()`: no job income (naturally, since the
job was cleared), no random civilian events, a dedicated sentence tick
instead (`tickSentence()` — countdown, a 15% parole roll once you've
served half, release), and real hardship (extra happiness loss every
year, a 10% chance of a fight). A criminal record follows you for real:
`data/jobs.ts` gained `requiresCleanRecord` on the trust-based jobs
(teacher, nurse, doctor, lawyer, accountant, bank teller), and
`availableJobs()` filters them out — verified end to end, including that
non-trust jobs (software engineer, electrician, marketing manager) stay
open. Verified exactly (deterministic `Math.random` overrides in test):
success/failure rolls, sentence length matching the roll formula by
hand, bail/jail credit score deltas to the point, and a full 3-year jail
countdown to release.

**Deliberately trimmed for v1, not forgotten**: no court/trial sequence
(bail effectively resolves the case for now — "your lawyer got you a
deal" is the unstated flavor), no lawyer-quality tradeoff, no
`WorldState` crime-wave/crackdown condition yet (still the planned tie-in
once this needs raising the stakes), a criminal record never expires
(no path back to a clean record yet), and prison itself has no activities
beyond the automatic sentence tick (no yard time/library/cellmate
choices). All real next slices for this pack, not a different pack.

### DLC: Mind & Body — not started

Health and personality depth. `Stats.health` already exists as a core
stat (Core Update: Foundations) — this pack is what turns it from a bare
number into real systems: diagnosable conditions instead of an abstract
health number, mental health (therapy, depression/anxiety as their own
arcs, not just flavor text), addiction mechanics, hospital visits with
real choices, and life expectancy that's actually shaped by health
history, not just a dice roll against age.

Also where permanent **personality traits** belong (Introvert,
Short-Tempered, Workaholic, Charismatic, etc.) — rolled or earned through
childhood events, and actually load-bearing: they should shift which
event choices are available, how fast skills grow, and how a character
reacts to trauma, not just be a label. This is a genuine gap in the
current build.

### DLC: Career & Fame — not started

The Career tab and job ladder already exist as part of the base game —
this pack is the depth pass on top: full ladders with real
promotions/demotions/firing, starting your own business, a military path,
fame-track careers (pro athlete, musician, actor, influencer), and school
arcs that are their own multi-year beat (med school, law school, grad
school) instead of one "college" checkbox.

### DLC: Pets & Hobbies — not started

Adoptable pets with their own care loop; hobbies (instrument, sport, art)
that build a skill and can turn into a career path (ties into Career &
Fame above).

### DLC: Legacy — not started

Play as your kid after death (a real family tree across generations), an
achievements/records screen, stats worth bragging about ("longest life,"
"richest," "most kids"). Depends on `WorldState` already surviving across
lives (done, see Money & World above) — that was built specifically so a
new generation inherits the same ongoing world instead of a fresh one.
