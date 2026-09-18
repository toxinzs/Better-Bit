@AGENTS.md

## Project: Better Bit

A life-simulation game (BitLife-style: birth to death, random events,
school, careers, relationships, money), built with Expo/React Native so
the same codebase targets web now and iOS/Android later.

**Standing rule, applies to all future work**: nothing is ever behind a
paywall. No premium currency, no ads, no subscription tier gating
content, no loot boxes. Every career/activity/relationship/cosmetic is
unlocked by playing, never by paying. Full reasoning and the phase-by-phase
content roadmap live in `ROADMAP.md` — read that before adding a system,
it's the source of truth for what's next and why.

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
  separate call — see `ROADMAP.md` Phase 3. `LifeEvent`/`EventChoice`
  functions all take `(c: Character, world: WorldState)`; existing events
  that don't care about world state just don't declare the second param
  (TS allows a function with fewer params to satisfy a type expecting
  more, so this never requires touching events that don't use it).
- `src/data/events/` — the event pool, split by life-stage/category (see
  `ROADMAP.md` Phase 1). Each event is age-gated and either auto-applies
  or presents real choices with distinct consequences.
- `src/data/jobs.ts` — the career ladder, gated by age/smarts/college degree.
- `src/state/gameStore.ts` — zustand store wiring the engine to the UI,
  persists to `AsyncStorage`. **`worldState` is never reset by `restart()`**
  — it's the one field that deliberately survives a new life. `persist()`
  takes `worldState` as a required third argument specifically so a new
  call site can't silently forget to carry it forward.
- `src/screens/` — Start (character creation), Home (main play loop),
  Game Over (life summary + full life log).

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
