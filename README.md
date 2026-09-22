# Better Bit

A life-simulation game in the BitLife vein — birth to death, random events,
school, careers, relationships, money, crime — built with a real
choice-and-consequence event system instead of one-line stat popups.
**Nothing is ever behind a paywall** — no premium currency, no ads, no
subscription tier gating content (see `ROADMAP.md` for the full rule).

Built with [Expo](https://expo.dev) (React Native), so the same codebase
targets web now and iOS/Android later without a rewrite.

## Play it

**[toxinzs.github.io/better-bit](https://toxinzs.github.io/better-bit/)**
— deployed automatically from `main` via GitHub Actions
(`.github/workflows/deploy.yml`). Check the in-game "What's New" link on the
Start screen for the current version and changelog.

## Stack

- **Expo SDK 57** / React Native / TypeScript
- **react-native-web** for the browser target
- **zustand** for game state
- **@react-native-async-storage/async-storage** for save/load (works on web and native)

## Running it locally

```bash
npm install
npm run web      # browser, via react-native-web
npm run ios       # requires macOS/Xcode, or the Expo Go app
npm run android   # requires Android Studio, or the Expo Go app
```

## How the game works

See `CLAUDE.md` for the full architecture breakdown (it's kept current as
the source of truth for how each system fits together). The short version:

- `src/types.ts` — the core data shapes (`Character`, `Stats`, `LifeEvent`,
  `WorldState`, etc).
- `src/engine/` — the simulation itself: `lifeEngine.ts` (aging, education,
  death rolls, event selection), plus one module per system — `worldState.ts`
  (shared macro-economic conditions), `assets.ts`/`debt.ts`/`stocks.ts`/
  `taxes.ts`/`retirement.ts` (the money system), `crime.ts` (crime & the
  court system), `relationships.ts`.
- `src/data/` — everything that's content, not logic: the event pool
  (`data/events/`, split by life stage/category), jobs, cars/homes, loans,
  stocks, crimes.
- `src/state/gameStore.ts` — the zustand store wiring the engine to the UI
  and persisting the save to `AsyncStorage`.
- `src/screens/` — Start (character creation), Home (the main play loop,
  tabbed: Life/People/Career/Money/Crime), Game Over (life summary).
- `src/version.ts` — the app version + in-game changelog.

## Status

A full playable life loop with real depth: birth → school → career →
relationships (dating, marriage, divorce, exes you can still contact) →
a real money system (debt/credit score, a simulated stock market,
progressive income tax, 401(k) retirement) → crime (real trial choices,
prison as its own life stage, expungement) → death → life summary.
`ROADMAP.md` is the source of truth for what's done and what's next —
it's organized into **Core Updates** (systems every character touches)
and **DLC Packs** (big standalone systems, all free). See it for the
full picture rather than this file going stale again.
