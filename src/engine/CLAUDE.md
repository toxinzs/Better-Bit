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
