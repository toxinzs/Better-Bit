# Better Bit

A life-simulation game in the BitLife vein — birth to death, random events,
school, careers, relationships, money — built with a real choice-and-consequence
event system instead of one-line stat popups.

Built with [Expo](https://expo.dev) (React Native), so the same codebase
targets web now and iOS/Android later without a rewrite.

## Stack

- **Expo SDK 57** / React Native / TypeScript
- **react-native-web** for the browser target
- **zustand** for game state
- **@react-native-async-storage/async-storage** for save/load (works on web and native)

## Running it

```bash
npm install
npm run web      # browser, via react-native-web
npm run ios       # requires macOS/Xcode, or the Expo Go app
npm run android   # requires Android Studio, or the Expo Go app
```

## How the game works

- `src/types.ts` — the core data shapes (`Character`, `Stats`, `LifeEvent`, etc).
- `src/engine/lifeEngine.ts` — the actual simulation: character creation, aging,
  education/salary progression, death rolls, and random event selection.
- `src/data/events.ts` — the event pool. Each event is age-gated and either
  applies automatically or presents real choices with distinct consequences
  (stat changes, money, relationships). This is the main lever for "better
  than BitLife": richer, more varied, more meaningfully branching events.
- `src/data/jobs.ts` — the career ladder, gated by age/smarts/college degree.
- `src/state/gameStore.ts` — the zustand store wiring the engine to the UI and
  persisting the save to `AsyncStorage`.
- `src/screens/` — Start (character creation), Home (the main play loop), and
  Game Over (life summary + full life log).

## Status

Early MVP: one full playable life loop (birth → aging → school → career →
relationships → death → summary), ~25 events across every life stage, and a
persisted save. Not yet built: bigger event pool, assets/real estate, crime,
more relationship depth (dating pool, breakups, marriage/divorce), and a
mobile-native pass (haptics, native navigation, etc).
