@AGENTS.md

## Project: Better Bit

A life-simulation game (BitLife-style: birth to death, random events,
school, careers, relationships, money), built with Expo/React Native so
the same codebase targets web now and iOS/Android later.

**Standing rule, applies to all future work**: nothing is ever behind a
paywall. No premium currency, no ads, no subscription tier gating
content, no loot boxes. Every career/activity/relationship/cosmetic is
unlocked by playing, never by paying. Full reasoning and the content
roadmap live in `ROADMAP.md` — read that before adding a system, it's the
source of truth for what's next and why. It's organized into **Core
Updates** (systems every character touches — events, relationships, money,
world state, identity, presentation) and **DLC Packs** (big standalone
systems in the shape BitLife would sell as paid DLC — crime, deep
health/personality, career depth, pets/hobbies, legacy — except free,
same as everything else here; "DLC" is a scoping label, not a
monetization tier).

### Architecture

**Standing rule**: game rules never live in the store or a screen. Every
number/effect belongs in `src/engine/lifeEngine.ts` (or an `events/*.ts`
file) as a plain function taking a `Character` — no React, no zustand, no
UI. `gameStore.ts` only wires those functions to reactive state and
persistence; it should never contain a stat number or a rule of its own.
Screens only render and call store actions. If you're about to write
`character.stats.x = ...` inside `gameStore.ts` or a screen, that logic
belongs in the engine instead.

- `src/types.ts` — core data shapes (`Character`, `Stats`, `LifeEvent`,
  `WorldState`, etc).
- `src/engine/lifeEngine.ts` — the simulation: character creation, aging,
  education/salary progression, death rolls, random event selection,
  activities, job application.
- `src/engine/worldState.ts` — the shared, persistent-per-save macro-event
  layer (Recession/Boom/War/Pandemic). Ticks inside `ageUp()`, not as a
  separate call — see `ROADMAP.md`'s "Money & World" update.
  `LifeEvent`/`EventChoice`
  functions all take `(c: Character, world: WorldState)`; existing events
  that don't care about world state just don't declare the second param
  (TS allows a function with fewer params to satisfy a type expecting
  more, so this never requires touching events that don't use it).
- `src/data/events/` — the event pool, split by life-stage/category (see
  `ROADMAP.md`'s "Foundations" update). Each event is age-gated and either
  auto-applies or presents real choices with distinct consequences.
- `src/engine/relationships.ts` — texting/calling/booty-call/gift actions
  and ambient message generation (`ambientMessageTick`, called inside
  `ageUp()`). A `Relationship`'s `type` changes to `"ex"` on breakup/
  divorce/caught-cheating instead of `alive: false` — `alive` means "this
  person is dead," not "this relationship ended"; don't conflate the two
  again. `Relationship.messages` is optional (same additive-field pattern
  as `WorldState` on old saves) and capped at 40 entries.
- `src/data/textLines.ts` — flavor message content banks (ex texts/calls/
  booty-calls, ambient exchanges per relation type). Add variety here, not
  inline in `relationships.ts`.
- `src/data/jobs.ts` — the career ladder, gated by age/smarts/college degree.
- `src/data/assets.ts` / `src/engine/assets.ts` — same data/engine split as
  jobs: car/home catalogs are data, `buyCar`/`sellCar`/`buyHome`/`sellHome`/
  `netWorth`/`tickAssets` are engine logic. `tickAssets` (mortgage payment +
  car upkeep) runs inside `ageUp()`. `netWorth()` is the real number to
  show anywhere "how rich is this character" comes up — it accounts for
  car value and home equity, not just `character.money`; don't display
  raw `money` as net worth again (`GameOverScreen` did before this system
  existed — already fixed, don't reintroduce it in a new screen).
- `src/data/loans.ts` / `src/engine/finance.ts` / `src/engine/debt.ts` —
  personal loans + a revolving credit card, gated by age + credit score.
  `netWorth()` in `assets.ts` subtracts total loan balance. `tickDebt`
  runs inside `ageUp()` right after `tickAssets`.
- `src/data/stocks.ts` / `src/engine/stocks.ts` — a small simulated
  stock market (fictional companies, no real market data), shared
  world-level state like `WorldState`'s macro conditions rather than
  per-character. `tickMarket` runs inside `ageUp()`. `totalNetWorth()`
  (in `lifeEngine.ts`) is `netWorth() + portfolioValue()` — use it, not
  bare `netWorth()`, anywhere a screen shows "how rich is this
  character," now that a character's wealth can include a portfolio
  and a retirement balance.
- `src/engine/taxes.ts` — real progressive income tax brackets, withheld
  automatically wherever `ageUp()` pays out job income (not a separate
  tick — it's part of the existing income step). `incomeTax(gross)` /
  `takeHomePay(gross)` are pure functions of a salary number, no
  `Character` involved, so any screen showing a salary (`CareerTab`'s
  job listings) can show real take-home pay without touching the engine.
- `src/engine/retirement.ts` — a 401(k)-style account. `applyContribution`
  runs inside the income step in `lifeEngine.ts` **before** `incomeTax` —
  the contribution is pre-tax, so it has to shrink taxable income before
  tax gets computed, not after. `tickRetirementGrowth` runs right after
  `tickMarket` (needs that tick's fresh `prevPrice`/`price` pair) and
  ties the balance's growth to the *average* price change across
  `world.stocks` that year, rather than its own separate RNG — one less
  random model to keep consistent with the rest of the economy.
- **`src/engine/CLAUDE.md`** — money-system-specific conventions (the
  world-vs-character state split, the additive-optional-field guards,
  the whole-dollar-except-stock-prices rule, `ageUp()`'s exact tick
  order, a testing pitfall that's already bitten twice). Read it before
  adding to `assets.ts`/`finance.ts`/`debt.ts`/`stocks.ts` or a sibling
  (taxes/retirement) — it's more detail than belongs in this file.
- `src/state/gameStore.ts` — zustand store wiring the engine to the UI,
  persists to `AsyncStorage`. **`worldState` is never reset by `restart()`**
  — it's the one field that deliberately survives a new life. `persist()`
  takes `worldState` as a required third argument specifically so a new
  call site can't silently forget to carry it forward.
- `src/screens/` — Start (character creation), Home (main play loop,
  a thin shell: header + tab bar + persistent Age Up button — see
  `src/screens/tabs/`), Game Over (life summary + full life log).
- `src/screens/tabs/` — `LifeTab` (stats, activities, this year, world
  news), `PeopleTab` (relationships), `CareerTab` (jobs), `AssetsTab`
  (net worth, car, home). `HomeScreen` owns which tab is active and the
  two modals (`EventModal`, `TextThreadModal`) since those overlay
  regardless of tab; each tab otherwise reads the store directly rather
  than being handed props. A new top-level section is a new tab here, not
  a new card stacked onto an existing one — the whole point of splitting
  this up was to stop the single-scroll-of-cards layout from growing
  without bound.

### Design system

- `src/theme.ts` — every color/spacing/radius/font-size token. Never hardcode
  a hex color or raw px value in a screen/component's `StyleSheet` — import
  from here. Font family is Nunito (`fonts.regular/semiBold/bold/extraBold`,
  loaded via `@expo-google-fonts/nunito` in `App.tsx` behind the same
  loading gate as `hydrated`); icons are `@expo/vector-icons`'s `Ionicons`,
  never raw emoji in interactive UI chrome (tab bar, buttons, headers) —
  emoji are still fine inside generated flavor/content text (event copy,
  text-message bodies) since that's content, not chrome.
- `src/components/Card.tsx` / `Button.tsx` — the two reusable primitives.
  A new screen's card-shaped sections use `<Card>`, not a bespoke
  `StyleSheet` block; a new button uses `<Button variant="primary|
  secondary|danger|ghost">`, not a raw `TouchableOpacity`+`Text` pair,
  unless the layout genuinely doesn't fit either (e.g. a tab bar item).
- Event/dialogue choice buttons are deliberately **not** color-coded by
  variant (no green vs. red choices) — that would imply which option is
  "correct," and choices in this game are meant to be morally/practically
  neutral trade-offs. Keep new choice UI neutral (bordered `surfaceRaised`
  rows), not `primary`/`danger` colored.
- Sound is presentation, not a game rule — it's wired at the UI layer
  (`HomeScreen.tsx`'s action handlers), not inside `gameStore.ts` or the
  engine, same reasoning as animations. `src/sound.ts`'s `playSound(key)`
  is fire-and-forget and never throws (every failure is swallowed) — sound
  must never be able to break gameplay. All four cues
  (`assets/sounds/*.wav`) are synthesized tones generated by
  `scripts/generate-sounds.mjs` (re-run it after editing the note
  definitions in that file to regenerate) rather than sourced externally —
  zero network dependency, zero licensing risk. There's no mute toggle yet
  (noted in `ROADMAP.md`'s "Presentation" update) since there's no settings
  surface to put one on.
- `Animated.Value`s that should reflect a prop change (a stat bar's fill,
  the age-up pulse) need a `useRef` + `useEffect` pair keyed on that prop,
  not a plain animation fired once on mount — see `StatBar.tsx` for the
  pattern. `useNativeDriver: true` prints a harmless console warning under
  react-native-web ("native animated module is missing... falling back to
  JS-based animation") — expected on web, irrelevant on a real native
  build, not a bug to chase.
- Collapsible list rows (see `PeopleTab.tsx`'s `RelationshipRow`): expanded
  state lives in the parent as a `Set<string>` of ids, not a single
  "which one's open" value — that's what makes rows expand independently
  instead of accordion-style. Each row owns its own chevron-rotate and
  content-fade `Animated.Value`s locally (not lifted to the parent), fired
  from a local `handleToggle` that also calls the parent's `onToggle`.
  Reuse this pattern for the next collapsed-by-default list (e.g. a future
  Bag/inventory or job-history list) rather than re-inventing it.

### Testing notes

- `TouchableOpacity` doesn't get `role="button"` in react-native-web
  unless `accessibilityRole="button"` is set explicitly — every
  interactive button in this codebase has it, both for real accessibility
  and so Playwright's `getByRole('button')` can find them.
- The most reliable way to verify game logic end-to-end (not just that it
  compiles) is running the web build via `npx expo start --web`, then
  driving `useGameStore` directly through a headless browser rather than
  simulating clicks — the store's actions (`startNewLife`, `ageUp`,
  `chooseEventOption`, etc.) are the real surface to exercise. Don't leave
  a `window.__store` test hook committed; wire it up temporarily, verify,
  then remove it before committing.
