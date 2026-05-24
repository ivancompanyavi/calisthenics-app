# App Improvements

Updated 2026-05-24 after the second build pass. **DONE** items shipped; **DEFERRED** items wait for a third pass.

---

## Shipped (Pass 1 — v2 program enablement)

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

## Shipped (Pass 2 — auto-progression + form reference)

### N3 — Auto-suggest next-session reps target ✅
- `workoutLogsRepository.getRepsSuggestions(workoutId, movementIds)` reads the most recent session for each movement scoped to the workout (so Pull A and Pull B keep independent histories) and suggests `max(actualReps) + 1` on clean hit
- "Clean hit" = all sets met target AND all logged RIR ≥ 2 (RIR undefined doesn't veto — RIR is optional)
- `ResolvedEntry.suggestedReps` + `suggestedRepsReason` populated at resolve time
- Execution engine pre-fills `adjustReps` from suggestion + saves SetLog.targetReps = suggestion (so the bump rolls forward)
- Visual indicators: `ExerciseDisplay` shows "↑ bumped from X · clean hit last session"; `WorkoutDetail` and `AdjustScreen` show the suggestion next to the original prescription
- 9 new unit tests in `workout-logs.repository.test.ts` cover hit/miss/RIR/skip/cross-workout edge cases

### A2 — Reference URL on movements ✅
- `Movement.referenceUrl?: string` + `SeedMovement.referenceUrl?: string`
- Editable in `MovementForm` (URL input below description)
- "Form check" link rendered on `MovementsList` cards (target=_blank)
- Same link exposed during execution on `ExerciseDisplay`
- Seed reconciliation policy: seed fills in when user hasn't set one, never overwrites — mirrors `coachingCues` policy

---

## Superseded

### A6 — Deload multiplier
v2 uses explicit deload workouts in week 6. Will be replaced by N4 (phases) when built.

---

## Deferred (next pass)

### N4 — 6-week macrocycle / phases support
`cycleLengthDays: 42` with week-6 deload day variants, OR a new `ProgramPhase[]` concept. Currently the 6-week cycle is manual: Ivan runs Personal Calisthenics 5 weeks then swaps to the opt-in `Test Day (Week 6)` workout. **Next-pass priority #1.**

### N6 — Test-day flag on ProgramDay
Mark week-6 Thu as a special PR-scoring session. Depends on N4 (phases). The PR algorithm already auto-detects best-ever from any session, so this is mostly cosmetic — a "PR achieved on a Test Day" badge would be the differential. Defer with N4.

### N5 — Skill snack tracking
Sat/Sun frog stand + planche lean + wrist mob as a logged 4th session type. Currently the seed has no surface for these. Defer.

### A5 — Goal tracking
"30s tuck planche by Aug 1." Now that A1 (PRs) is in, a Goal layer is small additional work. Defer.

### A7 — Heatmap calendar
Visualization improvement. Defer.

### A8 — Volume balance auditor
Safety net. Defer.

### A9 — Rest timer ±30s
UX polish. Defer.

### A10 — Notes search
Cross-history search. RIR + gate-skip notes are now also signal — slightly more valuable than before. Still defer.

### A11 — Workout preview before Start
UX polish. Tempo + gate + suggestion chips on `WorkoutDetail` already cover the preview need at the list level. Defer.

### A12 — Stuck-on-level diagnostic
Compute "days since last level-up vs days since first set on current rung." Useful complement to N3. Defer.

---

## Data model snapshot (post-Pass 2)

Cumulative changes since v6:
- `Movement.referenceUrl?: string` (new)
- `BlockEntry.tempo?: TempoSpec`
- `BlockEntry.gate?: GateSpec`
- `DraftEntry.tempo?`, `DraftEntry.gate?` (mirrors)
- `SetLog.rir?: number`
- `BodyweightLog { id, date, kg, notes? }` table (Dexie v7)
- `ResolvedEntry.suggestedReps?`, `suggestedRepsReason?`, `movementReferenceUrl?` (computed-only, not persisted)

Actions:
- `RESYNC_EXERCISE_TIMER` (new) — gate-prompt flow uses it to restart timers after acknowledgement
- `SKIP_EXERCISE` carries optional `reason: string` that lands on SetLog.notes
- `SET_ADJUST_RIR` (new) — sets the RIR for the current adjust phase

Repository additions:
- `workoutLogsRepository.getAllPRs()` → Map<movementId, MovementPR>
- `workoutLogsRepository.getRepsSuggestions(workoutId, movementIds)` → Map<movementId, RepsSuggestion>
- `bodyweightRepository` — full CRUD on `BodyweightLog`

---

## Top of "deferred" list to revisit next

After 1–2 cycles of running the new program with auto-suggest in play:

1. **N4 + N6 (phases + test-day flag)** — makes the 6-week cycle a first-class concept. Eliminates the "manually swap to Test Day" step.
2. **A12 (stuck-on-level diagnostic)** — pairs naturally with N3 to surface "you've been bumping reps for 8 sessions, time to level up the progression."
3. **A5 (goal tracking)** — cheap given A1.
4. **N5 (skill snack tracking)** — once the main program is dialed.
