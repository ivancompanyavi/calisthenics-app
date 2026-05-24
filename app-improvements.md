# App Improvements

Updated 2026-05-24 after the v2 build pass. Items marked **DONE** were shipped this pass; **DEFERRED** items wait for a second pass.

---

## Shipped this pass

### A1 — Personal Records (PR) per movement ✅ DONE
Best `actualReps` and best `actualSeconds` per movement, computed from non-skipped SetLogs. Rendered as a Trophy chip on the movements list in Library.
- `workoutLogsRepository.getAllPRs()` (new)
- `useMovementPRs()` hook
- Trophy badge on `MovementsList`
- PR query invalidates on `useSaveWorkoutLog` success

### A3 — Bodyweight tracking ✅ DONE
Saturday prompt + ad-hoc log surface on Home. Same-day entries overwrite (no clutter from multiple morning weigh-ins).
- `BodyweightLog` entity + Dexie table (schema v7)
- `bodyweightRepository`
- `useBodyweightLogs`, `useMostRecentBodyweight`, `useLogBodyweight`, `useDeleteBodyweight`
- `BodyweightCard` on Home, prompts on Saturdays or when last entry is >7 days old

### A4 — RIR per set ✅ DONE
Optional `rir?: number` on `SetLog`. RIR chip row 0–4 on `AdjustScreen` (reps-mode only — RIR is a reps concept). Tap-to-toggle; second tap clears.

### N1 — Tempo as first-class field on BlockEntry ✅ DONE
`TempoSpec { eccentric, bottomPause, concentric, topPause }` on `BlockEntry`, `DraftEntry`, `SeedEntryDef`. Format helper `formatTempo()` in `lib/utils`. Tempo chip rendered:
- on `ExerciseDisplay` during execution
- on `WorkoutDetail` entry rows for pre-workout preview

### N2 — Active autoregulation gates ✅ DONE
`GateSpec { question, skipOnNo }` on `BlockEntry`. UI-layer interception:
- `GatePrompt` component renders before `ExerciseDisplay` when entry has a gate and the current (block,round,entry) tuple isn't acknowledged yet
- "No" answers with `skipOnNo: true` auto-dispatch `SKIP_EXERCISE` with a reason note that lands in the SetLog
- New engine action `RESYNC_EXERCISE_TIMER` so max/time-mode timers don't accumulate while the user is reading the gate question

---

## Superseded

### A6 — Deload multiplier (SUPERSEDED)
Original proposal: multiply targets by 0.6× during deload week. The v2 plan uses explicit deload workouts in week 6, which gives finer control (different rest periods, different exercise selection) than a flat multiplier. Will be replaced by N4 (phases) when built.

---

## Deferred (next pass)

### N3 — Auto-suggest next-session targets
Read history → suggest +1 rep on the lowest set if last session hit target cleanly. Closes the M8 gap from the pro audit. Next-pass priority #1.

### N4 — 6-week macrocycle / phases support
`ProgramPhase[]` concept where weeks 1–5 use one workout-day map and week 6 uses another. Currently the 6-week cycle is manual: Ivan runs Personal Calisthenics 5 weeks then manually swaps to the opt-in `Test Day (Week 6)` workout. Next-pass priority #2.

### N5 — Skill snack tracking
Sat/Sun frog stand + planche lean + wrist mob logged as a 4th "session type". Light feature. Defer.

### N6 — Test-day flag on ProgramDay
Mark week-6 Thu as a special PR-scoring session. Depends on N4 (phases). Defer.

### A2 — Reference URL on movements
Form-check via video URL. Cheap, but not gating program execution. Defer.

### A5 — Goal tracking
"30s tuck planche by Aug 1." PRs make this nearly automatic — once A1 is in, a Goals layer is a small additional step. Defer.

### A7 — Heatmap calendar
Visualization improvement. Defer.

### A8 — Volume balance auditor
The v2 plan locks in adequate volume balance per muscle group; auditor would be a safety net. Defer.

### A9 — Rest timer ±30s
UX polish. Defer.

### A10 — Notes search
Cross-history search. Now slightly more valuable since RIR + gate-skip notes are also searchable signal. Still defer.

### A11 — Workout preview before Start
UX polish. Tempo + gate chips on `WorkoutDetail` already provide a partial preview path. Defer.

### A12 — Stuck-on-level diagnostic
Related to but distinct from N3 (auto-suggest). Defer with N3.

---

## Data model snapshot (post-v7)

New since v6:
- `BlockEntry.tempo?: TempoSpec`
- `BlockEntry.gate?: GateSpec`
- `DraftEntry.tempo?`, `DraftEntry.gate?` (mirrors)
- `SetLog.rir?: number`
- `BodyweightLog { id, date, kg, notes? }` table

New action: `RESYNC_EXERCISE_TIMER`
Modified action: `SKIP_EXERCISE` now carries optional `reason: string` that lands on the skipped SetLog's notes.

---

## Top of "deferred" list to revisit next

After 1–2 cycles of running the new program, the highest-leverage next items remain:

1. **N3 (auto-suggest targets)** — removes prescription guesswork session-to-session.
2. **N4 + N6 (phases + test-day)** — makes the 6-week cycle a first-class concept.
3. **A2 (reference URL)** — cheapest form-check unlock.
