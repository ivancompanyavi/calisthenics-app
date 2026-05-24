# CLAUDE.md

Quick reference for AI agents. Read **CONTEXT.md** for the full architecture and data model — this file only covers what surprises newcomers or isn't documented there.

## Project nature

Personal PWA. The seed data in `src/db/seed/*.ts` is the owner's _actual_ training program — edits to those files change what they see in the app on next reload. Treat workout/program/progression edits as production changes, not examples.

## Commands

Package manager is **pnpm** (the README says `npm`, but `package.json` pins `pnpm@9.15.4`).

```bash
pnpm dev          # dev server
pnpm build        # tsc -b && vite build
pnpm lint         # eslint
pnpm test         # vitest watch
pnpm test:run     # vitest CI mode
```

Tests live in `src/**/__tests__/*.test.ts`. The state machine in `src/lib/execution-engine.ts` is covered by `src/lib/__tests__/execution-engine.test.ts` — edits to the engine usually touch this file too.

## Seed conventions

**`previousNames` is a rename-migration helper.** When renaming a `SeedMovement` / `SeedWorkout` / `SeedProgram`, add the old name to `previousNames` so existing DB rows get re-linked on the next `seedDatabase()` run (see `src/db/seed.ts`). Do not delete `previousNames` entries casually — old user data still keys off them.

**Block entries can be progression-bound or movement-bound.**

- `{ progression: "X" }` resolves at runtime to whatever movement sits at the progression's `currentLevel`.
- `{ movement: "Y", mode, targetReps }` is locked to that movement.

When advancing a progression's `currentLevel`, audit workouts that _also_ name-reference the next-rung movement directly — they may now duplicate the same exercise.

**Workout-edit hygiene.** When adding/removing block entries, check for cross-day duplication. Recurring drift pattern: leg/calf accessory work creeping onto pull/push days. Pull A is the heavy-CNS pull day — never put eccentrics (e.g. Nordic Hamstring Curl) there.

## Exercise images

Every movement renders an image from `public/exercises/<slug>.webp` where slug is the movement name lowercased + kebab-cased (`movementSlug` in `src/db/seed.ts`). `MovementPhoto` falls back to a `Dumbbell` icon when the file is missing, so missing images don't break anything — they just look inconsistent.

**Whenever you add a new movement to seed:**

1. Add a pose description for it to `scripts/exercise-descriptions.mjs` in the matching family section (slug must match `movementSlug(name)`).
2. Generate the `.webp` via the script:
   ```bash
   node scripts/generate-exercise-images.mjs <slug-1> <slug-2> ...
   # or with no args to fill every missing image
   ```
3. Style is white line-art on dark navy `#0a0a14`, athletic male figure. The script uses OpenAI `gpt-image-1` (needs `OPENAI_API_KEY` in `.env`) and converts PNG → WebP via `cwebp` on `PATH`. Costs API credits per call, so prefer passing the specific slug(s) rather than running on all.

**Costs money** — don't run this autonomously without telling the user. Confirm before each batch.
