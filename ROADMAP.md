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

**A result popup after every effectful action (done).** Not just event
choices — every button-press action in the game. `gameStore.ts`'s
`applyToCharacter()`/`applyToCharacterWithWorld()`/`applyChained()` wrap
every action (venues, lessons, dating, jobs, crime, assets, relationship
actions, School's roster actions, all of it): each captures whatever new
lines the engine call pushed to `yearLog` and surfaces them via a new
`actionResultLines` store field, rendered by `ActionResultModal.tsx` — a
dismissible "here's what happened" popup, instead of the player having to
go check the Life tab's log. `chooseEventOption` shows the same popup for
an ordinary (non-chained) event's `resultText`, which already existed but
was only ever shown for the Crime chain sequence before — every event
choice gets it now. Deliberately **not** shown after `ageUp()` itself
(the "This year" card already covers a natural year passing) or while a
`pendingEvent` chain continues (the next `EventModal` screen covers that
instead) — `applyChained()` is what several actions beyond crime now use
for a real multi-step choice, see Activities' Hookup redesign below.

**Still to build in this update** (not started):

- **Full stat visibility on any character**, not just your own — tapping
  into a relationship should show their real name, age, and the same stat
  sliders (smarts/health/looks/money/sanity/generosity/religiousness)
  your own character has, not just a relationship-level number.
- **Relationship action menus that actually vary by type and closeness** —
  more options per relationship type (what you can do with a parent vs. a
  coworker vs. a romantic partner should look different), and some actions
  gated behind a minimum relationship level instead of everything being
  available from day one.
- **Friends you actually choose** — right now a friend, once implied by
  school/work/activities, would just exist; add a real prompt ("Do you
  want to be friends with [name]?") instead of auto-adding them.
- **Family depth** — actually being *in* the parents' house growing up
  (play, tend the garden, sibling interactions that matter), step-parents
  and step-siblings when a parent remarries, and eventually extended
  family (grandparents, aunts/uncles, cousins) once that layer of the
  family tree exists.
- **Teenage life content** — sleepovers, throwing/attending parties,
  sneaking out, sneaking someone in, and a teen-pregnancy branch once
  age-appropriate — new events in `data/events/teen.ts`.

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

**Jobs and assets, made real (not started).** Two things this update
deliberately left thin, now scoped for a follow-up pass:

- **Real hiring** — an actual short interview scene (a few dialogue-style
  choices, odds shaped by smarts/looks/the relevant skill from an
  Activities lesson) instead of a flat success roll, and a real contract
  shown on offer (salary, at-will vs. term, benefits) instead of a job
  just appearing in a list. More job variety generally. Salary and
  availability keep pulling from `effectiveSalary()`/`WorldState`, now
  additionally shaped by the region system below once it exists. If the
  character rushed a Greek house (School, For Real below) and the
  interviewer happens to be from the same one, a real shot at getting
  hired on the spot, bypassing the normal odds entirely — a genuine
  "who you know" mechanic, not just flavor.
- **Multiple jobs, real hours** — `Character.job: Job | null` becomes
  `Character.jobs: { job: Job; hoursPerWeek: number }[]`, a real
  architecture change. A weekly-hours view lets a character split time
  across more than one job (a hard cap around 80hrs/week total); stacking
  hours past a real threshold starts draining happiness/health — the
  "juggling three jobs is rough" experience, not just a bigger paycheck
  for free. Minimum working age varying by *where* the character is
  (the real child-labor-law variance by state/country) is exactly what
  the region system below is for — this item is what actually consumes
  that once it exists, not a separate thing to build.
- **Real cars and homes** — actual makes/models/years replacing the
  current 5-tier abstraction, new-vs-used pricing, mileage that
  accumulates and maintenance that's a real recurring cost (and can
  trigger a breakdown event), and actually taking a car out for a drive
  as its own Activities entry. Housing gets more real variety
  (apartment/condo/house, not just a price tier) with property tax pulled
  from the region system below.

### Update: Where You're From — region, names, appearance, law & economy (v1 slice done)

**v1 slice shipped**: five real regions — US, UK, Nigeria, Japan, Brazil
(`src/data/regions.ts`) — each a real, load-bearing `RegionDef`, not
flavor text. `src/data/names.ts` restructured from one 14-name generic
pool into `NAME_POOLS`, a region-keyed pool of first/last names per
culture (real, respectfully-sourced names, not invented); the same
restructure directly fixed the "unnamed sibling/friend" bug (below), since
those event sites now generate real names instead of a hardcoded
placeholder phrase. A new region picker sits on `StartScreen` alongside
gender; `Character.originRegion` (optional, so old saves default cleanly
to `"us"` via `getRegion(undefined)`) threads through: starting family
wealth (`startingWealthRange` per region), a real state/local tax layer
stacked multiplicatively on top of `taxes.ts`'s federal-shaped brackets
(Japan's real flat local inhabitant tax, the US's blended state average,
UK/Nigeria/Brazil's real "no separate regional income tax" structure), a
job-market multiplier stacked on top of (never replacing) `WorldState`'s
existing boom/recession multiplier, and real regional drinking/gambling
ages gating the Bar/Club/Casino venues in Activities (`data/activities.ts`
already had a comment anticipating exactly this seam). Every numeric
approximation carries an inline comment marking it as a game-flavor
approximation, not a tax/legal citation. **Explicit decision, not an
oversight**: each region's real age of consent is stored in the data for
completeness but deliberately never wired into any gameplay gate — the
lowest one in a 5-region table would otherwise open romantic/hookup
content at an inappropriate age depending on where a character happens to
be born, which is the wrong call regardless of factual accuracy; every
actual age-gate in the game stays hardcoded at 18 regardless of region.
Verified via Playwright: real region-appropriate names/starting wealth,
identical salaries netting different take-home pay by region (local tax +
job multiplier both landing correctly), a UK character able to drink at
18 where a US character couldn't, and an old-format save with no
`originRegion` field loading cleanly.

**Deferred to a later slice**, matching the original scope cut below:
moving/immigrating as an adult, region-specific school-system shape (K-12
vs. tracked/vocational), per-region job tables in `data/jobs.ts` (the job
multiplier is the whole lever for now), per-substance drug legality
(single `drugsIllegal` flag today), driving-age/marriage-age retrofits
into existing event flows (only the Activities venue gate uses legal ages
so far), and expanding past 5 regions. A real appearance system beyond
region-derived skin tone (the new `Avatar` component, see the Presentation
update below) and `appearanceFlavor` text is still open too.

Original ask, for reference:

Character creation was bare: a gender picker and two free-text name
fields, defaulting to one small, culturally narrow hardcoded pool
(`src/data/names.ts` — about a dozen first names per gender, 15 last
names total) with no concept of where a character is *from*. The ask, now
broadened past just cosmetics: add a real **country/region of origin** to
character creation, and make it a load-bearing piece of the sim, not
flavor —

- **Names**: hundreds of real, region-appropriate first/last names per
  culture, not one pool reused for everyone regardless of origin.
- **Appearance**: `Stats.looks` is currently just a 0-100 number with no
  description behind it at all — no appearance system exists yet, visual
  or textual. Whatever gets built (starting with descriptive flavor text
  tied to origin, since there's no avatar/portrait system yet) needs to
  be demographically plausible for the chosen region, not randomized
  independent of it.
- **Cost of living & starting wealth** — the region a character is born
  into sets a cost-of-living tier (cheap/mid/expensive) that shapes
  starting family wealth and everyday prices; being born into a poor
  region and a rich one shouldn't feel the same.
- **Taxes** — a real jurisdiction layer on top of `src/engine/taxes.ts`'s
  existing federal-style brackets: a state/region tax rate stacked on top
  (some regions genuinely have none), and eventually sales tax on
  activities/shopping. US-shaped first (federal + state), generalized to
  other countries' flat/different systems as more regions get built out.
- **Law** — drinking age, smoking age, gambling age, driving age, age of
  consent, marriage age, and what's even illegal (drug legality
  especially) all vary by region — this is the piece that makes the
  Crime & Punishment DLC and the Activities update below (bars, casinos)
  region-aware instead of one hardcoded ruleset for everyone.
- **Job market** — average income and job availability shift by region,
  layered on top of (not replacing) `WorldState`'s existing boom/
  recession multiplier, so a recession hits a poor region harder than a
  rich one.
- **School system shape** — feeds directly into the "School, For Real"
  update below: US-style K-12 + 4-year college vs. other countries'
  tracked/vocational structures.
- Later: actually **moving/immigrating** as an adult — a visa/citizenship
  process, a new region's cost-of-living and laws applying going forward,
  leaving family behind.

This is a real content-research phase, not a quick data add — doing
regional naming, appearance, tax, and legal data respectfully means
actually sourcing accurate per-region information, not guessing, and it
can genuinely ship in slices (start with 4-5 real regions covering a
range of cost-of-living/tax/law, expand the list over time) rather than
needing every country on day one. Touches character creation UI (a
region/country picker on `StartScreen`), the `Character` model (a new
origin field), and becomes a required input to `taxes.ts`,
`worldState.ts`'s salary multiplier, and the Activities/School/Crime
updates around it. **v1 slice done, see above; full scope remains open.**

### Update: Activities — something to actually do (done)

The single biggest fix for "it's boring": a real panel of places to go
and things to do on a given year, instead of Age Up being close to the
only button that matters. `src/data/activities.ts` (catalog) /
`src/engine/activities.ts` (engine logic) split, same pattern as
`assets.ts`/`jobs.ts`, surfaced as a new "Activities" tab
(`ActivitiesTab.tsx`) between Life and People. The old 3-button Gym/
Library/Doctor row on the Life tab is gone — Gym and Library are now two
of the real venues below (same numbers as before), and Doctor moved into
this tab as its own quick action.

- **Venues (13)**: Park, Beach, Place of Worship, Library, Museum, Gym,
  Movies, Mall, Concert, Spa, Bar, Club, Casino — each with a flat age
  gate and real stat effects (health/happiness/smarts/looks, whichever
  fit), most free or a flat cost. Bar has a 15% rough-hangover chance on
  top of its base effect; Casino is a real gamble (45% win, payout
  1.2-3x the buy-in, 55% lose it all) — both resolve their random branch
  immediately, no separate event needed. Age gates are a flat number for
  now (`VENUES` in the catalog), same placeholder-until-real-regions
  reasoning as `lifeStage.ts` always used — real per-region drinking/
  gambling ages land with "Where You're From." **Scope cut**: no new
  `religiousness`/`sanity`/`generosity` stats yet (Worship's effect is
  happiness-only, described narratively) — those are a bigger surgery
  touching `StatBar`/`GameOverScreen`/every event, belongs to a
  dedicated stat-expansion pass, not bundled into this one.
- **Lessons (5)**: Music, Singing, Art, Martial Arts, Acting — each adds
  to a new `Character.skills` map (`SkillKey` in `types.ts`), shown with
  the existing `StatBar` component (it already falls back to a generic
  color/icon for a label it doesn't recognize, so no new UI component
  was needed). A 10% chance per lesson of a bonus "breakthrough" for
  extra skill. These skills don't do anything yet beyond display — they're
  real infrastructure for Fame & Flashbulbs' special careers, not wired
  to a payoff until that pack exists.
- **Dating**: "Browse Dating App" generates a real pool of 3 candidates
  (`generateDatingCandidates()` — random name, a flavor "vibe" line, an
  appeal score) to choose between, finally landing the "a real multi-
  option dating pool" item Foundations had flagged as deferred; pursuing
  one rolls a match chance off their appeal and creates a real partner
  relationship on success. Blind Date is the same single-candidate coin
  flip the old random event used, now player-initiated instead of waiting
  on the dice. All three gate at 18+. **Scope cut**: no STD risk modeled
  — noted, not built.
- **Hookup (revised)**: now a real two-step choice instead of resolving
  instantly — "Use protection" or not comes first (`buildHookupProtectionEvent`
  in `engine/activities.ts`, the same chained-`LifeEvent` pattern
  `commitCrime`'s arrest sequence set the precedent for), *then* the
  existing outcome (single: a small happiness swing either way; partnered:
  the real cheating mechanic, 50/50 caught-or-not). Going unprotected
  while fertile rolls a real 14% pregnancy chance per encounter.
- **Fertility and pregnancy, made real**. A real `usingBirthControl`
  toggle and a permanent `sterilized` flag (vasectomy/tubal ligation,
  $800, one-time), both on `Character`. Every path that can start a
  pregnancy — Hookup going unprotected, the `have-a-kid`/`unplanned-
  pregnancy` events, and IVF/Insemination/Donor (`tryConception`) — now
  funnels into one shared `Character.pregnant` flag instead of a baby
  appearing the instant a choice is made. `unplanned-pregnancy` is a
  real reveal moment with a genuine choice, **"Keep it" or "It's not the
  right time"** — the latter ends the pregnancy with a real, non-graphic
  emotional consequence (no baby), handled the same plain, stated-not-
  dramatized way the game already treats death and jail; termination
  itself isn't depicted, matching how nothing else sensitive in this game
  gets graphic either. The birth itself happens the *following* `ageUp()`
  — a real child relationship is created immediately (so events that look
  for a kid don't break) with a placeholder name, and `Character.pendingBabyId`
  holds up a new `NameBabyModal` (a real text-input prompt, blocking
  further play the same way `EventModal` does) before the game continues
  — no more nameless "Your child" appearing out of nowhere.
- **Vacations**: three tiers (Weekend Getaway/Beach/International) with
  real cost and a happiness/health boost scaled to tier; if the
  character has any alive family (partner, kids, or parents), the trip
  boosts their relationship levels too, which is what "family trips"
  from the original ask turned into — a variant of the same system
  rather than a separate one, since there's no parents'-house/childhood-
  activity system yet for a kid-taking-a-trip-with-their-parents version
  of this. **Scope cut**: cost doesn't scale by destination/region yet
  (flat per tier) — real distance/cost-of-living scaling is explicitly
  blocked on the region system in "Where You're From" below, which
  didn't exist when this was built (it exists now as a v1 slice, but this
  hasn't been wired up to it yet).
- **Surrender** (done): a real, confirmed voluntary end-of-life choice —
  a new "End of the Road" card at the bottom of Activities. Built as a
  chained `LifeEvent` (`engine/surrender.ts`, same pattern Hookup's
  protection choice uses): "Are you sure you want to end things here?
  This can't be undone." with "No, keep going" / "Yes, I'm sure", and
  only the latter sets `alive = false`. Stated plainly in the log, never
  depicted — same tasteful register as death, jail, and pregnancy-
  termination above. Building this surfaced a real gap: `chooseEventOption`
  in `gameStore.ts` had no `character.alive` check after resolving a
  choice (the only two prior death paths, `ageUp` and `attack`, each had
  their own bespoke check) — without the fix, "Yes, I'm sure" would have
  left a dead character stuck on the home screen instead of reaching Game
  Over. Fixed to mirror `attack()`'s existing check exactly.

Playwright-verified end to end (temporary `window.__store` driving, no
UI-only bugs found): every venue's cost/effect, Bar's hangover branch,
Casino's win and lose branches, a lesson raising `skills`, both Dating
App and Blind Date match/no-match branches, birth control toggling,
sterilization blocking conception, and a vacation boosting family
relationship levels. Re-verified after the pregnancy revision: the full
protection-choice → pregnancy-reveal → "Keep it" chain through the real
UI, `tryConception` setting `pregnant` on success instead of an instant
child, `have-a-kid`'s result now showing "You're expecting" as a popup
instead of resolving silently, and the birth → `pendingBabyId` →
`NameBabyModal` → a real chosen name landing on the child relationship,
also through the real UI end to end.

### Update: School, For Real (done)

Education today is an abstraction — grades happen off-screen, there's no
one to interact with. This update makes it a real place, four real
stages each with its own event pool, plus infrastructure a few other
systems now lean on. Deliberately scoped to K-12 + undergrad —
professional/grad school (med school, law school) stays where it already
lives, as its own multi-year beat inside Fame & Flashbulbs below, since
those are career-track detours more than a base-game stage everyone goes
through. Shape of each stage (school system, working-age gates) varies by
the region system above once it exists.

**New infrastructure this update needs:**

- `Character.gpa` (0.0–4.0) — starts tracking once elementary begins,
  genuinely consequential from middle school on (shifts tryout/club odds,
  later feeds college admission and academic probation).
- `Character.clique` — set at a specific middle-school event, can shift
  in high school.
- `Character.schoolActivities: string[]` — clubs/sports/teams currently
  enrolled in; a club tied to an existing Activities-lesson skill (Band →
  Music, Art Club → Art) actually boosts that skill, not flavor-only.
- Two new `RelationType`s, `"classmate"` and `"teacher"` — real named
  NPCs (2-3 classmates + 1 teacher/professor per stage), generated on
  entering each stage. A **School tab roster** lists them separately
  from the main People tab so they don't get lost among family/friends/
  exes as the list grows; when a stage ends, a classmate you were close
  to (`level` high) graduates into a regular `friend` relationship, the
  rest just fade off the roster rather than cluttering it forever.
  **Faculty-only actions**: Suck Up (relationship up, small chance of a
  real grade nudge), Insult (relationship craters, real chance of
  detention or getting reported yourself), Report — someone or something
  (a classmate cheating/bullying, a party, a fight) — helps your standing
  with whoever you reported to, costs you with whoever you reported and
  their friends. A real trade, not a free action.
- `Character.flags: string[]` — a genuinely generic "remember what
  happened" store any event in any life stage can set or check
  (`"rushed-kappa"`, `"expelled-once"`, `"reported-a-friend"`). This is
  bigger than School — it's the same shape of system the Zau Region
  project uses for its story beats — but School is what actually needs
  it first (a rush choice echoing in a job interview years later, a
  clique choice changing how a later event reads), so it gets built here
  and becomes standing infrastructure for every system after it.
- **Fighting** — a new "Attack" action on any NPC card, not School-
  exclusive. Rolls off `health` as the physical-capability proxy (no
  dedicated Strength stat yet); branches into a clean win, a real back-
  and-forth (both take a health hit), or it gets broken up first.
  Consequences scale with age and severity, and on a rare tail-end roll
  it can escalate to real tragedy — the other person dies (a manslaughter
  charge through Crime & Punishment, see its juvenile-justice addition
  below) or you do (ends the life like any other death, cause "killed in
  a fight") — handled the same plain, non-dramatized way the game
  already treats death and jail.
- **Design rule for this whole update**: anything a character can
  initiate on their own (skip class, throw a party, start a fight) is
  also something an NPC can invite/drag them into via a random event —
  build both entry points, not one or the other.

All 52 events built across `src/data/events/school-elementary.ts`/
`school-middle.ts`/`school-high.ts`/`school-college.ts`, `src/data/school.ts`
(college/major/housing/club/greek catalogs), and `src/engine/school.ts`
(roster generation/retirement, GPA, clubs, faculty actions, college
enroll/change-major/drop-out/graduate, seduction). `src/engine/fighting.ts`
holds the new Attack action. New `SchoolTab.tsx` between Activities and
People. Playwright-verified end to end (temporary `window.__store`
driving): elementary/middle/high/college rosters generate real named
classmates + a teacher/professor on stage entry and correctly retire on
exit; `clique` gets set from Lunch Table; club-join raises the tied
skill; every fighting branch (win/lose/broken-up, plus a forced tragedy
roll and a forced assault charge); juvenile arrest → capped sentence →
release onto a real ankle monitor → the record auto-sealing at 18, all
with real numbers matching by hand; college enroll/change-major/rush →
hazing → a real `greekHouse`/seduce-faculty/multiple degrees stacking
correctly across a second enrollment.

**Elementary (ages 5-10)** — 10 events: First Day of School (make a
friend right away / stick close to the wall), Show and Tell (bring
something cool / forget it's your day), Recess Pushed (push back / tell
the teacher), Spelling Bee (study hard / wing it), Class Pet Duty (accept
/ decline), Birthday Party Invite (go / can't go), The Quiz Peek (cheat,
a real caught-or-not branch / don't), Someone's Getting Picked On (step
in / look away), Lost Tooth (pure flavor), Field Trip (museum/zoo/farm,
flavor plus a small stat bump).

**Middle School (ages 11-13)** — 12 events: Lunch Table (the one that
actually sets `clique` — Jocks/Nerds/Artsy/Loners), First Crush, Group
Project Slacker, The Group Chat (speak up / stay quiet), Tryouts (sets a
real `schoolActivities` entry on success), Pick a Club (Band/Art/Chess/
Drama/Robotics), Growing Pains (soft, non-graphic), First Phone/First
Account (flavor now, real infrastructure for the future social-media
layer in Fame & Flashbulbs), Detention, Clique Pressure (go along /
refuse), Middle School Dance, Report Card (auto-effect — this is where
`gpa` starts being a real tracked number).

**High School (ages 14-17)** — 16 events: Where You Land Freshman Year,
Varsity Tryouts (boosted odds if the matching middle-school club/sport
happened), Run for Student Council, Ask Someone to Prom, Prom Night,
Homecoming, Sneaking Out, Parents Are Out of Town (a real party — a
button, not just a random event, per the dual-entry-point rule), Cheating
on a Test (real GPA stakes), Skip Class (button + invite, same rule),
Bullying (escalated version, either side of it), Guidance Counselor Talk
(foreshadows college, sets a soft preference flag), Job vs. Clubs (a real
tradeoff against the existing part-time-job jobs), A Teacher Notices You
(good or bad, a real `teacher` relationship), Senioritis, Graduation Day
(`once: true`, GPA decides honors, closes the stage).

**College (ages 18+)** — real menus first, not pop-ups: pick a school
(Community/State/Private/Ivy-tier, real cost + prestige + a harder GPA
bar to stay in the higher you go), pick a major, pick housing (dorm/
Greek house/off-campus apartment/commute). **Multiple degrees are real**
— `Character.degrees: { school; major; online }[]` instead of one slot,
so going back for a second one at any adult age is a genuine option;
**online/remote** is a real modifier, not strictly worse — cheaper, no
housing cost, can hold a job at the same time, trades off the on-campus
event set (no roommate/rush/dorm-life beats) instead of being purely
inferior.

14 events: Roommate Luck, Rush Week, A Hazing Moment (a real risky choice
inside rush), All-Nighter Before Finals, Office Hours (a real mentor
relationship with a professor), Group Project (college stakes), Spring
Break (its own flavor trip here, not literally calling into the
Activities module — a scope simplification, not a hookup between the
two systems), Failed a Class (retake / drop), Change Your Major (real
time/money cost), Thinking About Dropping Out (a genuine fork — closes
`educationStage` with no degree), Academic Probation (low GPA — improve,
or the next event is real expulsion, inline, distinct wording from
voluntarily dropping out), Campus Party, Internship Offer (a taste of
the future Career depth — a real, smaller-scale version of the
Greek-house hiring edge lives here directly, boosting the offer's own
odds; the bigger one described in "Jobs and assets, made real" above,
for every real job interview, is still unbuilt), Graduation. Plus
**Seduce/Hookup with a Dean or Professor** — 18+ (everyone in college
is), built the same way the Activities Hookup already is: no graphic
content, just real outcome-driven consequences — it can genuinely help
(favoritism, a grade break) or become a real scandal risk depending on
the roll.

**A real pacing bug this update's own testing caught**: Graduation was
originally `once: true` and gated on raw age (18+) — with multiple
degrees now real, `once` would have silently blocked a second
enrollment's graduation from ever firing again, and the raw-age gate let
it win the very first eligible year almost every time, skipping most of
the other 13 events. Fixed by gating on real years enrolled
(`Character.collegeStartAge`, ≥3 years in) instead of age, dropping
`once` (re-enrolling clears `inCollege`, which is what actually stops it
from repeating within one enrollment), and tuning its weight down to
match Rush Week's rather than dominating the draw.

**Scope cuts, honestly**: Attack lives on the School tab's own roster
for now (classmates/teachers), not yet on the People tab's family/friend
cards — extending it there is a fast follow, not built in this pass.
Report only ever targets a random current classmate, not a specific
picked one or a non-person incident. Roommate Luck/Rush Week/A Hazing
Moment stay `once: true` globally, so a second college enrollment later
in life doesn't replay them — multiple degrees deliver on "you can go
back," not "every beat replays identically each time."

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

**Next slice (done)**: the "major UI improvement" pass, part of the same
batch that shipped the region system and Surrender above. Real character
representation for the first time — `components/Avatar.tsx`, an original,
simple layered SVG portrait (circle head, rounded-rect shoulders, a preset
hair silhouette, dot eyes; deliberately geometric rather than
photorealistic, so it needs no external art and carries no copyright risk
— the alternative to using BitLife's actual assets, which was explicitly
declined). Skin tone comes from the character's region's palette
(`data/regions.ts`, flavor only, not a demographic assignment), hair
style/color from the frozen `avatarSeed` rolled at creation, so the look
is stable across reloads. Mounted on `HomeScreen`'s header (was just
text), `GameOverScreen`'s badge (replacing a static flower icon), and a
live preview on `StartScreen` that updates as the gender/region pickers
change. New dependency `react-native-svg`, verified compatible with the
real Expo *web export* specifically (not just the dev server) via a full
production build + static serve + Playwright pass, per this project's own
"a production build is worth re-checking" convention. Also: the four
near-duplicate modals (`EventModal`/`ActionResultModal`/`NameBabyModal`/
`WhatsNewModal`) got consolidated onto a shared `components/ModalBase.tsx`
(one place for the overlay/card/badge/entrance-animation chrome instead of
four copy-pasted ones — `NameBabyModal` picked up a real entrance
animation for free as a result), the `shadow` token that had existed in
`theme.ts` since the first restyle but was never actually applied got
spread into `Card`/`ModalBase` for real elevation, and every tab's
section headers were formalized onto the shared icon+title `headerRow`
shape with a real per-tab accent color pulled from the stat-color palette
(health/happiness/smarts/looks) instead of defaulting to primary green
everywhere.

**Still open for later in this update**: a mute/volume toggle (there's no
settings surface at all yet to put one on), a custom app icon/splash
screen (still Expo's generic defaults), and a deeper visual pass beyond
this slice — more avatar variety (only a few hair presets/skin tones
exist per region so far), and richer per-screen layout beyond the
mechanical headerRow/accent-color pass.

---

## DLC Packs

Each of these is a whole new system, big enough to design, build, and
verify as its own unit — the "DLC" framing is purely organizational (see
"How this roadmap is organized" above). All free, all unlocked from the
start once built, same as everything else.

### DLC: Crime & Punishment — v1, v2 + juvenile justice done, prison activities still open

**v1 (done).** A real Crime tab with eight crimes across three tiers
(petty/moderate/serious — `src/data/crimes.ts`), each with a real success
chance (`successChance()` in `src/engine/crime.ts` — your smarts shifts
it, not a flat roll) and a real reward range on success. Getting caught
doesn't auto-resolve: it produces a synthetic "arrest" `LifeEvent` reusing
the exact same `pendingEvent`/`EventModal` machinery `ageUp()` already
uses for random events, so no separate UI was needed for it. Jail is its
own branch inside `ageUp()`: no job income (naturally, since the job was
cleared), no random civilian events, a dedicated sentence tick instead
(`tickSentence()` — countdown, a 15% parole roll once you've served half,
release), and real hardship (extra happiness loss every year, a 10%
chance of a fight). A criminal record follows you for real: `data/jobs.ts`
gained `requiresCleanRecord` on the trust-based jobs (teacher, nurse,
doctor, lawyer, accountant, bank teller), and `availableJobs()` filters
them out.

**v2 — the court/lawyers pass (done).** What v1 punted on. The arrest
choice is now a real two-step court sequence instead of a single "pay
bail" screen: **plead guilty** for a certain, halved sentence, or **fight
the charges**, which chains a second choice screen — *"who's defending
you?"* — Public Defender (free, worse odds), Hired Lawyer, or Top Lawyer
(both cost real money scaled to the crime's tier, and shift the
conviction-avoidance chance), each filtered out of the list entirely if
you can't afford it. The trial verdict is a real roll (crime tier + lawyer
quality + your smarts + whether a `crackdown` is active), landing on
either full acquittal (no record, a happiness boost) or conviction at the
*full*, unreduced sentence — meaningfully worse than taking the guilty-
plea deal, which is the actual risk/reward the choice is built on.

This needed a real engine capability that didn't exist before: **chained
choice events**. `EventChoice.effect` can now optionally return a
follow-up `LifeEvent` (`void | LifeEvent`, so all ~100 existing events
are untouched — they just don't return anything), and `resolveEvent`
passes it back up so the store sets it as the *next* `pendingEvent`
instead of clearing it. Same `EventModal`, next screen. This is now the
standing pattern for any future player-initiated action that needs a
real multi-step choice, not just crime.

A `WorldState` **crackdown** condition joined Recession/Boom/War/Pandemic
(same shape, `src/engine/worldState.ts`) — while active, both the
initial success chance to commit a crime *and* the trial's conviction
chance get worse, the stakes-raising tie-in v1 had noted as planned.
**Expungement** closes the loop v1 left open: `recordCleanYears` ticks up
every year outside jail (naturally starts counting from release, not
conviction, since the tick is skipped while `c.inJail`), resets to 0 on
any new conviction, and once it hits 7, a "Petition to expunge" action
appears in the Crime tab (a real filing fee, a real smarts-shifted
success chance) that can clear the record for good.

Verified exactly (deterministic `Math.random` overrides): the guilty-plea
sentence math, the chained trial event appearing with the right
crime-tier-scaled lawyer costs, conviction/acquittal credit-score deltas,
lawyer-tier affordability filtering down to just the Public Defender,
expungement's exact fee and gating, and the clean-years clock ticking
correctly outside jail.

**Still open, not forgotten**: prison itself still has no activities
beyond the automatic sentence tick (no yard time/library/cellmate
choices) — the next natural slice for this pack whenever it's picked
back up.

**Juvenile justice (done, built alongside School, For Real).** An arrest
used to be identical for a 15-year-old and a 40-year-old — same court/
lawyer/prison sequence, same record. `buildArrestEvent()` (now exported
from `engine/crime.ts`) caps the rolled sentence at 3 years and sets
`isJuvenileRecord` for anyone under 18, in both the guilty-plea and the
trial-conviction path — computed once at the top before any label text
is built, so what's shown always matches what's applied. `tickSentence`
gives a juvenile release a real 50% shot at coming out on an **ankle
monitor** instead of walking free (`onAnkleMonitor`/`monitorYearsLeft`,
ticked every non-jail year by `tickAnkleMonitor` — mostly counts down,
an 8% curfew-violation chance adds time back on). `tickJuvenileRecordClear`
seals the record automatically at 18, instead of needing the adult
path's 7 clean years. The main on-ramp is the new Fighting action from
School, For Real — a bad high school fight escalating into an assault
charge is the intended way a player actually reaches this system, not a
cold "commit a crime" menu pick. Fighting's rare tail-end death outcome
(`engine/fighting.ts`) routes through the *adult* manslaughter/murder
branch of this same system regardless of the fighter's age (via two
synthetic `CrimeDef`s reusing the exact same arrest/trial/lawyer
machinery, the standing pattern this file already noted for exactly this
kind of reuse), since that's the one outcome too serious for the
juvenile track's lighter handling to make sense. Verified exactly: a
forced assault charge on a 16-year-old capped the sentence, flagged it
juvenile, released onto a real ankle monitor, and sealed itself at 18 —
all matching by hand.

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

### DLC: Fame & Flashbulbs (formerly "Career & Fame") — not started

The Career tab and job ladder already exist as part of the base game —
this pack is the depth pass on top: full ladders with real
promotions/demotions/firing, starting your own business, and school arcs
that are their own multi-year beat (med school, law school, grad school)
instead of one "college" checkbox (the base-game "School, For Real"
update covers K-12 and undergrad; this is where the professional-track
detours live). The military path that used to live in this list is now
its own pack, **Enlisted**, below.

The renamed half of this pack is the fame track: real special careers —
actor, musician, pro fighter/boxer, athlete, influencer, gamer,
streamer — each built out with its own progression when its turn comes,
not just a job title with a bigger paycheck. Built on top of the
Activities update's lessons (a music/acting/art lesson skill is the real
gate into the matching fame career, not a coin flip). **Social media**
slots in here too, as its own slow-build layer once picked up: posting,
follower counts, going viral (good or bad), feeding back into the fame
track rather than existing on its own.

### DLC: Enlisted — not started

A real military path: enlisting, ranking up, deployment, and the
consequences of a full-length service career — pulled out of Fame &
Flashbulbs into its own pack since it's a different shape of career
(rank/duty/deployment beats promotion/firing), and it already has a real
hook to build on: the War/Draft `WorldState` condition (Money & World
update above) currently only produces a single draft-notice event — this
pack is what actually gives enlisting somewhere to go once you're in.

### DLC: The Hill — not started

Politics as a real career track: city council, mayor, state/national
office, all the way up — campaigns, scandals, approval rating, the
works. A genuinely different shape of career from a normal job ladder
(you're elected, not hired/fired), which is why it's its own pack rather
than a line item in Fame & Flashbulbs.

### DLC: Paws (formerly "Pets & Hobbies") — not started

Adoptable pets with their own real care loop (feeding, vet visits,
breeding, losing them) — rescoped down to just pets now that hobbies has
a home elsewhere: building a skill through a lesson lives in the base
Activities update, and turning that skill into a career lives in Fame &
Flashbulbs. Renamed so the pack name actually says what it is.

### DLC: 'Til Death — not started

The deeper relationship-lifecycle pack: weddings as their own real beat
(not just a "you got married" line), a divorce that can actually turn
into a custody battle over the kids, and a real will/inheritance system
for when a character dies — who gets the money and the house, and
whether that's contested. (Fertility — birth control, IVF, insemination,
a donor, vasectomy/tubal ligation — already lives in the base Activities
update, not here, since it's a during-life choice rather than an
end-of-life one.) Connects directly into Legacy below: a will is what a
next generation actually inherits.

### DLC: Legacy — not started

Play as your kid after death (a real family tree across generations), an
achievements/records screen, stats worth bragging about ("longest life,"
"richest," "most kids"). Depends on `WorldState` already surviving across
lives (done, see Money & World above) — that was built specifically so a
new generation inherits the same ongoing world instead of a fresh one.
Also depends on 'Til Death's will/inheritance system above — what your
character leaves behind is what the next generation actually starts
with.
