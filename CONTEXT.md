# Calisthenics Tracker

Personal PWA for tracking calisthenics workouts, progressions, programs, and training history. Dark-mode only, Hevy-inspired design. Single user, no backend.

## Tech Stack

- **UI**: React 19, TypeScript 6, Tailwind CSS 4 (via `@tailwindcss/vite`)
- **Build**: Vite 8
- **Routing**: React Router v7 (BrowserRouter)
- **Data**: Dexie.js (IndexedDB), TanStack React Query for caching/invalidation
- **Icons**: lucide-react
- **Testing**: Vitest
- **Deployment**: Vercel (static) at `calisthenics.ivan-company.com`
- **PWA**: `vite-plugin-pwa` with Workbox (generateSW), auto-registration

## Architecture

```
src/
├── pages/          # Route-level components (Home, Workouts, History, Library, Programs, WorkoutBuilder, WorkoutExecution, ProgramBuilder, ProgramDetail)
├── components/     # UI organized by domain (execution/, workouts/, movements/, progressions/, programs/, layout/, ui/)
├── hooks/          # React Query wrappers (useMovements, useProgressions, useWorkouts, usePrograms, useWorkoutExecution, useInProgressWorkout, useInsights)
├── repositories/   # Data access layer (movements, progressions, workouts, programs)
├── db/             # Dexie schema (index.ts) + seed/migration logic (seed.ts)
├── models/         # TypeScript interfaces (types.ts)
├── lib/            # Utilities (utils.ts, data-transfer.ts, execution-engine.ts, query-keys.ts, toast.ts)
└── main.tsx        # Entry point: runs seedDatabase() then mounts App
```

### Layered Architecture

```
Pages (route components)
  → Hooks (React Query wrappers, UI state)
    → Repositories (data access, business logic)
      → Dexie (IndexedDB persistence)
```

- **Repositories** encapsulate all IndexedDB queries and mutations. Hooks never call `db` directly.
- **Query Keys** are centralized in `src/lib/query-keys.ts` (factory pattern).
- **Execution Engine** (`src/lib/execution-engine.ts`) is a pure state machine extracted from the React layer, testable independently.

## Data Model

### Core Concepts

- **Movements** are the atomic unit — a single exercise (e.g., "Tuck Planche", "Pull Up").
- **Progressions** are ordered sequences of movements representing difficulty levels. Each level has its own `mode`, `defaultTargetReps`, `defaultTargetSeconds`, and `perSide` settings.
- **Workouts** contain blocks. Each block entry can reference either a progression OR a standalone movement directly.
- **Programs** define multi-day training routines that cycle through workouts on a schedule.

### Entities

- **Movement** — name, description, optional photo (Blob stored in IndexedDB)
- **Progression** — name, `currentLevel` (index into its levels)
- **ProgressionLevel** — links a progression to a movement at a given order; carries `mode`, `defaultTargetReps`, `defaultTargetSeconds`, `perSide`
- **Workout** — name, optional `restBetweenBlocksSeconds`
- **WorkoutBlock** — belongs to workout, type (`set` | `superset`), rounds, restSeconds, order
- **BlockEntry** — belongs to block, references either `progressionId` OR `movementId`, optional `mode` (for standalone movements), targetReps, targetSeconds, `perSide`, restSeconds, order
- **WorkoutLog** — completed workout record (timestamps)
- **SetLog** — individual set record (target vs actual reps/seconds, perSide, round, `skipped` flag)
- **InProgressWorkout** — auto-saved state for crash recovery
- **Program** — name, `cycleLengthDays`, `totalCycles` (0 = infinite), createdAt
- **ProgramDay** — belongs to program, `dayNumber`, optional `workoutId` (absent = rest day)
- **ActiveProgram** — links to a program, tracks `startedAt`, `currentCycle`, `status` (active/completed/abandoned)

### Set Modes

- `reps` — target rep count, user confirms actual after each set
- `time` — countdown timer, auto-transitions to adjust screen
- `max` — count-UP stopwatch, user taps "Done" when finished, records elapsed time

### Per-Side

`perSide: true` on a ProgressionLevel (or BlockEntry for standalone movements) means the rep count is per side (unilateral exercises). Displayed as "10 reps /side" during execution.

## Session Adaptation (what you actually get handed)

A workout is authored once, but what it prescribes changes as the athlete gets stronger. Two things make that work, and both run every time a session is resolved:

**Pattern slots** let a workout say "vertical pull" instead of naming an exercise. At session time the slot picks the hardest version of that pattern the athlete has unlocked. The week's structure never changes; the difficulty underneath it does.

**Locked-slot substitution** answers the question the entry gate can't: "this is locked, so what do I do today?" A locked slot is replaced by the work that unlocks it — Back Lever gated behind a 45-second dead hang becomes a 45-second dead hang — so the gate clears itself simply by training. If that unlock work is already elsewhere in the same session, the slot falls back to the hardest unlocked exercise in the same pattern; if there's nothing distinct left to offer, the slot is dropped. A movement is never prescribed twice in one session.

This matters because gates read *logged* PRs. Without substitution, a beginner (or anyone who hasn't logged a prerequisite) gets a session of dead ends instead of a workout — which is exactly what happened before this existed.

| Module | Job |
| --- | --- |
| `src/lib/progression-gate.ts` | "May I train this?" — pure gate evaluation |
| `src/lib/pattern-resolver.ts` | "Which difficulty of this pattern?" |
| `src/lib/gate-substitution.ts` | "It's locked — what instead?" (single slot) |
| `src/lib/session-adaptation.ts` | Applies both across a whole session, enforcing no-duplicates |

All four are pure. `workoutsRepository.resolveBlocks` fetches the data snapshots and calls `adaptSessionEntries`, so every surface (execution, session preview, workout detail) sees the same adapted session. A substituted slot carries `substitutedFor` for display — `SubstitutionNote` renders the "Working toward Back Lever" / "Instead of Back Lever — locked" label. Substitution is display/session-time only: it never rewrites the stored workout.

Coverage lives in `src/lib/__tests__/session-adaptation.test.ts`, which runs against the **real seed program** rather than fixtures — the failure being guarded is a property of the actual prerequisite graph.

## Workout Execution Engine

`src/lib/execution-engine.ts` is a pure reducer state machine (wrapped by `useWorkoutExecution.ts`):

```
ready → exercise → adjust → resting → exercise → ... → complete
```

- **ready**: waiting for user to tap Start
- **exercise**: showing the current movement (countdown for `time`, count-up for `max`, static display for `reps`)
- **adjust**: user confirms actual reps/seconds performed
- **resting**: countdown timer between rounds (or between blocks if transitioning)
- **complete**: summary screen, saves WorkoutLog + SetLogs

### Actions

- **DELAY_EXERCISE**: moves the current exercise to the end of the queue (do it later)
- **SKIP_EXERCISE**: permanently skips the exercise, marks its sets as `skipped`
- **FINISH_WORKOUT**: ends the workout immediately, skipping all remaining exercises

Auto-saves `InProgressWorkout` to IndexedDB after each set for crash recovery.

## Programs

Programs define repeating training schedules:

- A program has N days in its cycle (e.g., 7 for weekly)
- Each day is either a workout day (linked to a workout) or a rest day
- Programs can run for a fixed number of cycles or repeat indefinitely
- Only one program can be active at a time
- The Home page shows today's scheduled workout based on the active program
- Program detail page includes a calendar grid and history of past runs

## Seed System (sync-on-startup)

`seedDatabase()` runs on every app start and ensures all seed data exists:

1. `ensureMovementsExist()` — inserts missing movements by name
2. `ensureProgressionsExist()` — inserts missing progressions with per-level mode config
3. `ensureWorkoutsExist()` — inserts missing workouts by name (entries can reference progressions by name or movements directly)
4. `ensureProgramsExist()` — inserts missing programs with day schedules
5. `pruneRetiredSeedContent()` — deletes retired content (runs last)

**To add a new workout**: add it to `SEED_WORKOUTS` in `src/db/seed/workouts.ts`. Reference progressions by name (from `SEED_PROGRESSIONS`), movements by name with a `mode` specified, or a pattern key from `SEED_PATTERNS` for an adaptive slot.

**To remove one**: deleting it from the seed is not enough. Steps 1–4 only insert and update, so a removed entry survives as an orphan on every device that already synced — still visible in the app, but no longer managed. Add its name (and any old `previousNames`) to `src/db/seed/retired.ts`; step 5 deletes it, cascading to blocks/entries for a workout and to days/active runs for a program.

The pruner is deliberately narrow. It only deletes rows that (a) are named on a retired list, (b) carry a `seedFingerprint`, meaning seed created them — anything hand-built survives even if it shares the name, and (c) are not claimed by a live seed entry, so a list that contradicts the seed skips and warns rather than deleting real content. Logged history is never touched: `WorkoutLog` and `SetLog` store the names they display. A user program day pointing at a retired workout is blanked, not deleted along with their program. Covered by `src/db/__tests__/seed-prune.test.ts`.

## Data Persistence

- All data lives in browser IndexedDB (Dexie)
- `navigator.storage.persist()` called on startup to prevent eviction
- Export/import JSON available (strips photos from export), format version 2
- No cloud sync — data is device-local

## Conventions

- Path alias: `@/` → `src/`
- UI components in `src/components/ui/` use class-variance-authority + tailwind-merge
- Toast notifications via `src/lib/toast.ts` + `src/components/ui/toast.tsx`
- IDs generated via `uuid` v14
- ESLint with TypeScript + React hooks plugins
- Dexie schema version: 4 (additive migrations for new tables, destructive wipes for schema changes to existing tables)
