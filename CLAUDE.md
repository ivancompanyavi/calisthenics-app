# CLAUDE.md

Quick reference for AI agents. Read **CONTEXT.md** for the full architecture and data model — this file only covers what surprises newcomers or isn't documented there.

## Project nature

Personal PWA. The seed data in `src/db/seed/*.ts` is the owner's _actual_ training program — edits to those files change what they see in the app on next reload. Treat workout/program/progression edits as production changes, not examples.

## GitHub account (this repo is the odd one out)

This is a **personal** project on the `ivancompanyavi` GitHub account. The rest of this laptop uses a work account (`ivan-company`), which is the `gh` default — so anything that resolves through the wrong account fails confusingly.

```bash
gh auth switch -u ivancompanyavi     # before gh api calls against the private data repo
gh auth switch -u ivan-company       # switch back when done
```

What actually needs which:

| Operation | Account |
| --- | --- |
| `git push`, `gh pr create` on `calisthenics-app` | either — the work account has access |
| `gh api` against the **private** `ivancompanyavi/calisthenics-data` | **`ivancompanyavi` only** — the work account gets a bare 404, which reads like "repo doesn't exist" rather than "wrong identity" |

The private repo is the training-data mirror the `training-coach` skill reads. If it 404s, check the active account *before* concluding the mirror isn't set up.

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

**Retiring seed content requires `src/db/seed/retired.ts`.** The seed only inserts and updates — deleting an entry from `SEED_WORKOUTS` / `SEED_PROGRAMS` leaves an orphan row on every device that already synced. List the name (plus its old `previousNames`) in `retired.ts` as well; `pruneRetiredSeedContent()` deletes it. Never remove a name from those lists, and never let a name appear in both the live seed and the retired list — a test enforces this.

**Block entries come in three kinds.**

- `{ progression: "X" }` resolves at runtime to whatever movement sits at the progression's `currentLevel`.
- `{ movement: "Y", mode, targetReps }` is locked to that movement.
- `{ pattern: "vertical-pull" }` is an adaptive slot — resolves to the hardest *unlocked* progression in the pattern's chain. This is what the only shipped program uses.

When advancing a progression's `currentLevel`, audit workouts that _also_ name-reference the next-rung movement directly — they may now duplicate the same exercise.

**Workout-edit hygiene.** When adding/removing block entries, check for cross-day duplication. Recurring drift pattern: leg/calf *accessory* work creeping onto pull/push days. The `squat` slot on `Adaptive — Push` is the one sanctioned exception — a deliberate second weekly leg exposure, since the pattern library only has two leg patterns and one leg day caps the week at ~9 sets. Anything beyond that belongs on `Adaptive — Legs & Core`.

**Slot order must survive the degraded case.** A pattern slot whose whole chain is locked degrades to the exercise that unlocks it, which can be a completely different demand — a lever slot becomes a long dead hang. So don't lead a day with a slot whose unlock work would pre-fatigue that day's main lift (this is why `Adaptive — Pull` opens with the pull-up slot, not the lever slot).

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
