# App Improvements

Updated 2026-05-24 after the third build pass.

---

## Shipped — Pass 1 (v2 program enablement)

### A1 — Personal Records ✅
Best `actualReps` and best `actualSeconds` per movement. Trophy chip on Library movement cards.

### A3 — Bodyweight tracking ✅
`BodyweightLog` entity + Saturday-aware Home card.

### A4 — RIR per set ✅
0–4 chip row on `AdjustScreen` (reps mode only).

### N1 — Tempo as first-class field ✅
`TempoSpec` on `BlockEntry`. Chip on `ExerciseDisplay` + `WorkoutDetail`.

### N2 — Active autoregulation gates ✅
`GateSpec` on `BlockEntry`. `GatePrompt` component + `RESYNC_EXERCISE_TIMER` action.

---

## Shipped — Pass 2 (auto-progression + form reference)

### N3 — Auto-suggest next-session reps target ✅
- `workoutLogsRepository.getRepsSuggestions(workoutId, movementIds)` scoped per-workout
- Clean-hit rule: all sets met target AND all logged RIR ≥ 2; RIR-undefined is permissive
- `ResolvedEntry.suggestedReps` + `suggestedRepsReason`
- Execution engine pre-fills `adjustReps` + saves SetLog.targetReps = suggestion (rolls forward)
- Visual indicators on `ExerciseDisplay`, `WorkoutDetail`, `AdjustScreen`
- 9 unit tests

### A2 — Reference URL on movements ✅
- `Movement.referenceUrl?: string` + `SeedMovement.referenceUrl?: string`
- Editable in `MovementForm`
- "Form check" link on `MovementsList` cards and during execution
- Seed policy: fill missing, never overwrite

---

## Shipped — Pass 3 (6-week macrocycle + diagnostics + goals)

### N4 — 6-week macrocycle ✅
- Seed program is now a 42-day cycle: 5 normal weeks + 1 deload-with-test week
- 4 new deload-variant workouts in `seed/workouts.ts`:
  - "Push + Planche Skill (Deload)" — drop a round per main block, skip PPP
  - "Pull A (Skill Only)" — Tue Wk6 light: warmup + lever skill, no heavy 5×2
  - "Legs + Core (Deload)" — drop a round, skip Nordics
  - "Pull B (Deload)" — drop a round, skip negatives + chin hold + biceps
- "Test Day (Week 6)" already existed from Pass 1, now wired in as Thu Wk6
- `ProgramDetail` cycle-progress UI now groups slots by week with "Week N" headers
- No schema change required — existing `cycleLengthDays` field handles 42 fine
- The lazy `ensureCycleProgressShape` upgrades active programs from 7-day to 42-day on next slot fetch

### A12 — Stuck-on-level diagnostic ✅
- `progressionsRepository.getDiagnostics()` returns `{ sessionsAtRung, daysAtRung, stuck }` per progression
- Threshold: stuck = ≥8 sessions OR ≥28 days at current rung without level-up
- Filtered to SetLogs matching `progressionId AND current-rung movementId AND !skipped` so prior-rung work doesn't count
- "Stuck — N sessions / Nd at this rung" amber chip on `ProgressionsList`
- Cache invalidated on level-up + workout save
- 6 new unit tests covering threshold edges + prior-rung filter

### A5 — Goal tracking ✅
- `Goal { id, movementId, targetReps?, targetSeconds?, deadline?, createdAt }`
- Dexie v8 with `goals` table indexed on `movementId`
- `goalsRepository` (CRUD) + `useGoals` hook
- `GoalsCard` on Home: lists active goals with PR-derived progress bars
- Inline goal form: pick movement + reps/seconds toggle + target value + optional deadline
- No explicit completion state — "achieved" is `current >= target` from PRs; user manually deletes when done

---

## Superseded

### A6 — Deload multiplier
SUPERSEDED by N4. Deload variants are explicit workouts in the seed rather than a runtime multiplier. Cleaner mental model, finer control over what to drop.

---

## Deferred

### N5 — Skill snack tracking
Sat/Sun frog stand + planche lean + wrist mob as logged 4th session type. Not blocking; skill snacks currently live outside the app as a daily habit.

### N6 — Test-day flag on ProgramDay
A "PR achieved on a Test Day" badge would be the differential from the existing PR algorithm. Currently the Test Day workout shows up in the calendar like any other workout. Not critical — PR detection already works on any session.

### A7 — Heatmap calendar
Visualization improvement. Defer.

### A8 — Volume balance auditor
Safety net. The v2 plan locks in adequate balance. Defer.

### A9 — Rest timer ±30s
UX polish. Defer.

### A10 — Notes search
Cross-history search. Defer.

### A11 — Workout preview before Start
Tempo + gate + suggestion chips on `WorkoutDetail` already provide preview. Defer.

---

## Data model snapshot (post-Pass 3)

Cumulative additions since v6:
- `Movement.referenceUrl?: string`
- `BlockEntry.tempo?: TempoSpec`, `BlockEntry.gate?: GateSpec`
- `DraftEntry` mirrors above
- `SetLog.rir?: number`
- `BodyweightLog` table (Dexie v7)
- `Goal` table (Dexie v8)
- `ResolvedEntry.suggestedReps?`, `suggestedRepsReason?`, `movementReferenceUrl?` (computed, not persisted)

Actions added:
- `RESYNC_EXERCISE_TIMER` — used by gate-prompt flow
- `SET_ADJUST_RIR`
- `SKIP_EXERCISE` carries optional `reason: string`

Repository additions:
- `workoutLogsRepository.getAllPRs()` → Map<movementId, MovementPR>
- `workoutLogsRepository.getRepsSuggestions(workoutId, movementIds)` → Map<movementId, RepsSuggestion>
- `progressionsRepository.getDiagnostics()` → Map<progressionId, ProgressionDiagnostic>
- `bodyweightRepository` (full CRUD)
- `goalsRepository` (full CRUD)

---

## What's left worth doing

Only minor items remain:

1. **A2-style** seeded reference URLs — populate `referenceUrl` for key skill movements (Frog Stand, Tuck Planche, Front Lever Tuck) once trusted URLs are gathered.
2. **N5** skill snack tracking — once the main program is dialed.
3. **N6** test-day badge — cosmetic differentiator for PRs hit on test days.
4. **A7–A11** — UX polish items, defer until usage data motivates them.

The program v2 is now fully expressible in the app. The 6-week cycle runs without manual intervention.
