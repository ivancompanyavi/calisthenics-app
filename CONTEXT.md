# Calisthenics Tracker

Personal PWA for tracking calisthenics workouts, progressions, and training history. Dark-mode only, Hevy-inspired design. Single user, no backend.

## Tech Stack

- **UI**: React 19, TypeScript 6, Tailwind CSS 4 (via `@tailwindcss/vite`)
- **Build**: Vite 8
- **Routing**: React Router v7 (BrowserRouter)
- **Data**: Dexie.js (IndexedDB), TanStack React Query for caching/invalidation
- **Icons**: lucide-react
- **Deployment**: Vercel (static), Node 22.x pinned in `engines`
- **PWA**: Handwritten service worker (`public/sw.js`), stale-while-revalidate for assets, network-first for navigation

## Architecture

```
src/
├── pages/          # Route-level components (Home, Workouts, History, Library, WorkoutBuilder, WorkoutExecution)
├── components/     # UI organized by domain (execution/, workouts/, movements/, progressions/, layout/, ui/)
├── hooks/          # React Query wrappers + useWorkoutExecution reducer
├── db/             # Dexie schema (index.ts) + seed/migration logic (seed.ts)
├── models/         # TypeScript interfaces (types.ts)
├── lib/            # Utilities (utils.ts, data-transfer.ts)
└── main.tsx        # Entry point: runs seedDatabase() then mounts App
```

## Data Model

### Core Concept: Everything is a Progression

Workouts never reference movements directly. They reference **progressions**. A progression has ordered levels, each pointing to a movement. The `currentLevel` determines which movement is shown during execution.

Standalone movements (e.g. "Planche Leans") get auto-wrapped as single-level progressions.

### Entities

- **Movement** — name, description, optional photo (Blob)
- **Progression** — name, `currentLevel` (index into its levels)
- **ProgressionLevel** — links a progression to a movement at a given order
- **Workout** — name, optional `restBetweenBlocksSeconds`
- **WorkoutBlock** — belongs to workout, type (`set` | `superset`), rounds, restSeconds, order
- **BlockEntry** — belongs to block, references a progression, mode (`reps` | `time` | `max`), targetReps, targetSeconds, `perSide`, order
- **WorkoutLog** — completed workout record (timestamps)
- **SetLog** — individual set record (target vs actual reps/seconds, perSide, round)
- **InProgressWorkout** — auto-saved state for crash recovery

### Set Modes

- `reps` — target rep count, user confirms actual after each set
- `time` — countdown timer, auto-transitions to adjust screen
- `max` — count-UP stopwatch, user taps "Done" when finished, records elapsed time

### Per-Side

`perSide: true` on a BlockEntry means the rep count is per side (unilateral exercises). Displayed as "10 reps /side" during execution.

## Workout Execution Engine

`useWorkoutExecution.ts` is a `useReducer` state machine:

```
ready → exercise → adjust → resting → exercise → ... → complete
```

- **ready**: waiting for user to tap Start
- **exercise**: showing the current movement (countdown for `time`, count-up for `max`, static display for `reps`)
- **adjust**: user confirms actual reps/seconds performed
- **resting**: countdown timer between rounds (or between blocks if transitioning)
- **complete**: summary screen, saves WorkoutLog + SetLogs

Auto-saves `InProgressWorkout` to IndexedDB after each set for crash recovery.

## Seed System (sync-on-startup)

`seedDatabase()` runs on every app start and ensures all seed data exists:

1. `ensureMovementsExist()` — inserts missing movements by name
2. `ensureProgressionsExist()` — inserts missing progressions + auto-wraps standalone movements
3. `ensureWorkoutsExist()` — inserts missing workouts by name (with blocks + entries)

**To add a new workout**: add it to `SEED_WORKOUTS` in `src/db/seed.ts`. It will appear on next app load without wiping existing data. Reference progressions by name (from `SEED_PROGRESSIONS`) or movements by name (auto-wrapped).

## Data Persistence

- All data lives in browser IndexedDB (Dexie)
- `navigator.storage.persist()` called on startup to prevent eviction
- Export/import JSON available (strips photos from export)
- No cloud sync — data is device-local

## Conventions

- Path alias: `@/` → `src/`
- UI components in `src/components/ui/` use class-variance-authority + tailwind-merge
- IDs generated via `uuid` v14
- No test framework currently configured
- ESLint with TypeScript + React hooks plugins
