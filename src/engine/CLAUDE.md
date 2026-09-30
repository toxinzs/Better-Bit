# src/engine/

This directory is the simulation itself — everything in the root
`CLAUDE.md`'s "game rules never live in the store or a screen" rule
applies here first. This file adds conventions specific to the money
system (`assets.ts`, `finance.ts`, `debt.ts`, `stocks.ts`, `taxes.ts`,
`retirement.ts`, and whatever joins them next) that would otherwise get
re-learned (or re-broken) every time a new financial system gets added.

## World-level vs character-level state

Before adding a new field, ask: does this belong to *this one life*, or
to *the save*? `Character` fields (`loans`, `creditScore`, `portfolio`)
are wiped by `restart()`. `WorldState` fields (`activeCondition`,
`stocks`) survive it on purpose — anything that should feel like "the
same shared world" a legacy-system kid would inherit later belongs on
`WorldState`, ticked from its own `tick*(world)` function, not
recomputed per-character. The stock market followed the macro-condition
precedent exactly for this reason: prices are shared, not rolled fresh
per life.

## The additive-optional-field pattern, and where it's used so far

Every new field on `Character` or `WorldState` is optional in the type
(`loans?`, `creditScore?`, `portfolio?`, `WorldState.stocks?`) even
though a freshly-created character/world always has it set. Reason:
`AsyncStorage` persists a raw JSON blob, so a save made before a field
existed comes back from `JSON.parse` genuinely missing that key — the
type says it's there, the runtime value isn't. Never read one of these
fields raw. Use the guard:
- `ensureFinance(c)` (`finance.ts`) → returns `c.loans`, also defaults
  `c.creditScore`.
- `ensureMarket(world)` (`stocks.ts`) → returns `world.stocks`.

Any function that reads the field already calls the guard internally
(`tickDebt`, `tickMarket`, `portfolioValue`, etc.) — call *that*
function, or the guard itself, rather than writing `c.loans ?? []`
inline in a new engine function. UI code reading these fields directly
(not through an engine function) still needs the `?? []` / `?? 650`
fallback, since components don't call engine guards.

## Whole dollars, except stock prices

Every money value in this game is a whole-dollar integer — salaries,
prices, loan balances, `character.money` itself. `Math.round()`
whenever a computed value could produce a fraction. **Stock prices are
the one exception** (`StockState.price` carries cents, like a real
share price) — which means anything *derived* from a price times a
share count (`portfolioValue`, a buy/sell cost) must round back to a
whole dollar before it touches `character.money` or gets displayed.
This bit the first version of `portfolioValue()`: it returned raw
fractional cents, and net worth silently started showing `$999,999.8`
instead of a whole dollar. `Math.round()` at the boundary where a price
turns into a dollar amount, not before.

## Tick order inside `ageUp()`

`lifeEngine.ts`'s `ageUp()` runs ticks in a specific order — read it
before adding a new one rather than guessing where it fits:
`tickWorldState` (macro condition roll) → `tickMarket` (stock prices,
reads *this* year's condition) → `tickRetirementGrowth` (needs that
tick's fresh `prevPrice`/`price` pair, so it has to come right after
`tickMarket`, on the *pre-existing* balance) → character stat drift/
education/income (income includes `applyContribution`, called *before*
`incomeTax` since the contribution is pre-tax — this order matters, see
below) → `tickAssets` (mortgage + car upkeep) → `tickDebt` (loan/card
interest + auto-payment, reads `c.money` *after* assets) → the death
roll → event selection. A new per-year effect almost always belongs
after income and before the death roll, in the same relative position
as `tickAssets`/`tickDebt` (spend/earn first, so the effect has real
money to work with).

**2.x additions to that order** (all in `ageUp()`): `resetStatNotes` (start of
the year, so `changeStat` reasons only ever describe the current year) →
`c.age += 1` → pregnancy → natural stat drift → `tickCharacter`
(personality/quirks/talents, `engine/character.ts`) → `tickWellbeing`
(hidden stress + fitness and what they do) → `tickHealth` (conditions
start/clear, premiums; `engine/health.ts`) → family pocket money → relatives/
kids/exes → education → `tickSchool` (K-12 report card) → `tickHigher` (university grades, fees, student loan, graduation) → income (pay is scaled by `attendanceFactor`, so
poor health costs money) → `tickWork` (part-time pay, experience, resets the
yearly application/gig counters; `engine/jobs.ts`) → `tickAssets` → `tickLocation` (rent, food/bills, property tax, housing market,
eviction; `engine/location.ts`) → `tickDebt`
→ death roll (death odds are multiplied by `conditionMortality`). New
stat movement should go through `changeStat(c, key, delta, reason)`
(`engine/stats.ts`) so the stat screens can show what moved it.

**Pre-tax vs post-tax ordering, concretely**: `retirement.ts`'s
`applyContribution(c, grossIncome)` returns `taxableIncome` (gross minus
the contribution) — `incomeTax()` must run on *that*, not on
`grossIncome` directly, or the contribution stops being pre-tax and the
whole point of a 401(k)-style account (it lowers what you're taxed on)
silently breaks. If a future system needs the same treatment
(pre-tax vs. post-tax), follow this same shape: the deduction function
returns the adjusted taxable figure, tax is computed on that return
value, not on the original gross.

## Testing pitfall: don't hold a reference across a mutating call

Every engine function that mutates a `Loan` or `PortfolioHolding`
mutates the object **in place** (`loan.balance -= x`), not by replacing
it. A test (or any code) that captures `const loan = c.loans.find(...)`
and then calls a mutating function will find `loan.balance` has *already
changed* when read afterward — it's the same object, not a snapshot.
Capture the primitive you need to compare (`const before = loan.balance`)
before the mutating call, not the object reference. This has already
caused two false "bug" readings while verifying the debt and stock
systems — both were test-script mistakes, not product bugs, but it'll
happen again on the next system if this isn't kept in mind.

## Where you live (v2.4)

`Character.originRegion` means the country you live in *now* (the name is
historic; `birthRegion` is where you were born). `Character.residence.city` is a
key into `data/cities.ts`; read it through `cityOf(c)` (`engine/where.ts`), never
raw, so old saves fall back to the country's default city. `ensureLocation(c)`
backfills everything (called at creation, hydrate and each `tickLocation`).

Three "index" numbers, don't mix them up: `priceIndex(region)` (0.35/1/1.1) is for
medical bills; `livingIndex(region)` follows the country's wage level and prices
rent, food and homes; `city.cost` / `city.wage` are per-city multipliers on top.
Pay goes through `effectiveSalary(job, world, region, cityWage(c))` - pass the
city wage everywhere pay is shown or paid.

Money into and out of the year is noted on `c.budget` (`noteIncome` for pay,
`tickLocation` fills rent/living/upkeep) for the Budget screen. Housing rules to
keep: minors are always `family`; an owned home is `own` and is sold when you move
(`moveTo` calls `sellHome`); running out of money downsizes you to a shared room
first, then evicts (`family` if a parent is alive, else `homeless`); homeless
people can be taken in by a friend or relative, or rent again once they can afford
a deposit - nobody stays on the street forever by accident.

## Across borders (v2.5)

`Character.citizenships` is the passports you hold; `isAbroad(c)` means you live
somewhere you're not a citizen, and then `c.immigration` (status, since, expires,
years) says why you may stay. Never write `originRegion` directly to move someone
country: use `emigrate` / `returnTo` / `familyEmigrate` (`engine/immigration.ts`),
which also sell the home, drop jobs, fix credit and relationships, and set the
rental. `tickAbroad(c, world)` runs after income and before `tickWork`: it decides
a pending `visaApp`, then handles language immersion, integration, expiry, renewal,
overstay and deportation. Routes return a `RouteCheck` (requirement list, fee,
funds, odds, wait) so UI and engine share one source of truth; `apply()` refuses
unless every requirement is met. Languages live in `c.languages[key]` (0-100);
`ensureAbroad` backfills them deterministically for old saves.

## Working life (v2.6)

Pay is stored in **baseline dollars** on `job.salary`; what you actually get is
always `effectiveSalary(job, world, region, cityWage)`. Never store an already
scaled figure back on the job (v2.1-v2.5 did, and scaled it twice at payday).
Career state lives on the `Job` itself (`rung`, `perf`, `rapport`, `since`, `pip`,
`review`) and on the character (`fieldYears`, `network`, `workMode`, `unemp`,
`retired`, `business`, `rentals`); `ensureRole(c)` backfills old saves. A job that
ends any way other than the player quitting should go through `loseJob(c, cause,
world)` so severance and benefits happen. Tick order: income -> `tickCareer` ->
`tickBusiness` -> `tickAbroad` -> `tickWork`. Country tax, benefit and pension
numbers are all in `data/economy.ts`; `incomeTax(gross, region, credit)` divides by
the country's jobMultiplier before applying brackets. `inflation(c)` (2%/yr since
20) scales rent, living costs and house prices; keep raises near it.

## Body, habits and hobbies (v2.7)

Hidden state: `bmi`, `fitness`, `stress` (v2.0), `addictions[]` (dependence 0-100 per
key; `>= hook` means it runs itself yearly), `hobbies{}` (level, active, milestones
done). Use `ensureBody(c)` before reading `routine`/`diet`/`bmi`. New illness risk
goes through `bodyRisk(c, key)` (weight, fitness) and `addictionRisk(c, key)`
(smoking, drinking, drugs), both multiplied into `tickHealth`'s onset chance. An event
that pushes the player into a substance calls `use(c, key, true)` (`force` skips the age
and money gates); never construct a copy of the character to bypass them. Tick order:
`tickWellbeing` -> `tickBody` -> `tickAddictions` -> `tickMind` -> `tickHobbies` ->
`tickHealth`; `tickAchievements` runs near the end of the year, after the money ticks.
Achievements are pure predicates on the character in `data/achievements.ts`; keep them
cheap and never throw (the engine catches, but a throwing test never unlocks).

## Headline notices (v2.8)

Anything important should reach the player as a popup, not only as a line in the year
log. Don't build a popup per feature: write a normal `c.yearLog.push(...)` line and, if
it's a big moment, add a rule to `RULES` in `engine/notify.ts` (regex, title, icon, tone).
`harvestNotices` runs at the end of `ageUp` and after every store action and event
choice, turns matching lines into `c.notices`, and the store drops those lines from the
plain result popup so nothing shows twice. For something with no log line, call
`notify(c, title, text, icon, tone)` directly. A new important log line must match its
rule's regex exactly, so change the wording and the rule together.

## Fame and social media (v2.9)

A creator is a character with `c.social` (`SocialState`: `channels[]`, `fame`, `image`,
`privacy`, `burnout`, `team`, `deals[]`, `inbox[]`, `feed[]`). It is absent for everyone
else, so always read it through `c.social?.` or `ensureSocial(c)` (never create it
outside `openChannel`/`ensureSocial(c, true)`). Files: `creatorCore.ts` (pure numbers:
`qualityParts`, `potential`/`carrying`, `computeFame`, ranks, comments), `creatorPlay.ts`
(`addFollowers`, `viralGain`, `runCollab`, `makePost`), `creator.ts` (open/plan/actions/
team/buy followers, `tickCreator`), `inbox.ts` (`tickInbox` generates mail, `answerInbox`
resolves it; items are plain data, never closures), `socialWorld.ts` (`tickSocialWorld`
on `world.social`: platform popularity, hot niches, "biggest names").

Growth per channel per year: `organic = followers * rate * room + seed`, plus a heavy
tailed viral roll whose size scales with the niche's carrying capacity, minus churn.
`rate` has a size decay, so doubling gets harder as you grow; `appeal` (hidden, 0.45-2.2,
rolled when the channel opens) and `luck` spread outcomes. One-off moves (`doAction`)
use the same size damping, so spamming them can't outrun the yearly tick. If you retune
any of it, rerun `node --import ./scripts/register-ts.mjs scripts/sim-creator-growth.mjs`
(20-year archetypes) and `sim-creator-lives.mjs` (full lives, checks for NaN and
exceptions), and `test-creator-events.mjs` (runs every creator event choice). Tick order:
`tickBusiness` -> `tickCreator` -> `tickAbroad`. Money from content is taxed as the
marginal income on top of any salary; one-offs (`s.oneOff`) are paid at once and taxed in
the year's tick. Use `record(c, text)` (not a bare `yearLog.push`) for lines that should
also enter the life story, since achievements read `fullLog`. New notable log lines need a
rule in `notify.ts`. Ages: platforms 13+ (Podcast 14), hiring 18+, buying followers 16+;
minors keep 60% of earnings (a trust) and pay no tax.
