# Workout / Program Improvements — v2 (Perfect Routine)

This replaces v1. Incorporates all v1 gaps (G1–G9), the pro-audit follow-up (M1–M13), and the design decisions resolved during the planning interview.

---

## Framework (decisions locked)

| Decision | Value | Why |
|---|---|---|
| Session length | 60–75 min | Recovery floor (6h sleep) + novice training age |
| Training days | 5 + 2 rest | Mobility drops as a workout, becomes a daily 10-min ritual |
| Split | 2 Push / 2 Pull / 1 Legs+Core | Keep current structure; absorb new work into existing days |
| Equipment | BW first, gym for accessory | Curls, RDL/hip thrust, reverse hyper, weighted ramp use gym; main lifts stay BW |
| Goal target | Tuck planche held + steady lever, 6-month horizon | Drives skill volume and frequency |
| Bodyweight | Maintaining | Stable leverage baseline |
| Injuries | Clean slate | Prehab is preventive, not rehab |
| RIR target | 2–3 (conservative) | Novice + 6h sleep + clean slate skill phase |
| Cycle | 6 weeks: 5 accumulation + 1 deload-with-test (Thu) | Re-test cadence M2 baked in |
| Skill snacks | Sat + Sun, ~5 min | Frog stand + planche lean + wrist mob; non-training days only |
| Weekly weigh-in | Saturday | Decode pull-up regressions (mass vs recovery vs program) |
| Tempo | First-class data on block entries | M1 resolved at data-model level |
| Autoregulation gates | Active prompt with auto-skip | M13 resolved; app-enforced |
| Progression model | Auto-suggest +1 rep on hit, hold on miss | Updates the deferred "progression-rule automation" item |

---

## The 6-week macrocycle

```
Week 1–5: Accumulation. Each session, app auto-suggests +1 rep to the lowest set
          of any movement where target was hit cleanly last session.
Week 6:   Deload + Test
          - Mon/Wed/Fri at ~60% volume (drop a set per block, keep target reps)
          - Tue: light pull (skill only, no straight sets)
          - Thu: TEST DAY — fresh from Wed's reduced load
                  - Max strict pull-ups (single set)
                  - Longest Frog Stand hold (best of 2)
                  - Longest Planche Lean Hold (best of 2)
                  - Longest Front Lever Tuck Hold (best of 2)
                  - Max Archer Push-Ups per side (single set)
          - Fri: light pull volume only
Next cycle begins Mon. App auto-updates progression baselines from PRs.
```

---

## Weekly Schedule

### Mon — Push A + Planche Skill
**Intent:** Skill exposure when freshest. Anterior-loaded movement gated by wrists.

| Block | Sets×Reps | Tempo | Rest | Notes |
|---|---|---|---|---|
| Wrist Mobility Routine | 1×5min | – | – | Non-negotiable. Daily anyway. |
| **Activation (M7):** Wall Slides ↔ Band Pull-Aparts | 2×10 / 2×15 | – | 30s | Posterior delts before forward-loaded planche |
| **Wrist conditioning (G2):** Knuckle Push-Up Hold | 2×30s | – | 60s | Progressive wrist loading |
| Planche skill: Frog Stand (Planche Progression) | 4×max | – | 120s | **Gated:** "wrists/elbows feel good?" auto-skip if No |
| Planche Lean Hold | 3×20s | – | 90s | Skill carryover |
| **Pseudo PPU (skill-strength)** | 3×4 | 3-1-1-0 | 120s | Gated. Skip on bad-wrist days. |
| **Vertical press (G1):** Pike Push-Ups | 3×8 | 3-1-1-0 | 120s | **Movement-bound** (don't progression-bind HSPU — see CLAUDE.md note on mixed modes) |
| **Dip Progression** | 3×7 | 3-1-1-0 | 90s | First weekly exposure |
| Push-Up Progression (Archer Push-Ups currently) | 3×6 | 3-0-1-0 | 90s | Per-side |

Session target: ~65 min.

---

### Tue — Pull A (Heavy / Neural)
**Intent:** Max pull-up strength, lever as strength (not volume).

| Block | Sets×Reps | Tempo | Rest | Notes |
|---|---|---|---|---|
| Dead Hang | 2×30s | – | 30s | Warm-up |
| Scapular Pulls | 2×10 | 2-0-2-0 | 30s | Warm-up |
| **Front Lever (strength, M6):** Front Lever Progression | 3×max @ ~80% best hold | – | 120s | Distinct from Fri (volume). Sub-max but heavy. |
| **Main lift:** Pull-Up Progression, pronated | 5×2 @ RIR 2 | 3-1-X-0 | 180s | Clean and explosive. Concentric = X (max speed). |
| Inverted Rows, pronated | 3×8 @ RIR 2 | 3-0-1-0 | 90s | Horizontal pull |
| **Biceps (M3):** Banded Curls or Gym Curls | 2×12 @ RIR 2 | 2-0-1-0 | 60s | Direct elbow flexor work — accelerator for pull-up max |

Session target: ~60 min.

---

### Wed — Legs + Core
**Intent:** Posterior chain for planche line + hip flexor strength + core for skills.

| Block | Sets×Reps | Tempo | Rest | Notes |
|---|---|---|---|---|
| Squat Progression (Pistol Squats currently) | 3×5/side | 3-0-1-0 | 120s | Unilateral knee-dom |
| Single-Leg Glute Bridge | 3×10/side | 2-1-1-0 | 60s | Unilateral hip-dom |
| **Bilateral hip-dom (M10):** Banded Good Morning OR Hip Thrust (gym) | 3×12 | 2-0-1-1 | 90s | Closes the bilateral hip-dom gap |
| **Nordic Hamstring Curl (M11 conservative dose)** | 2×6 | 6-0-0-0 | 120s | Down from 3×5. 5-week ramp to 3×8 |
| **Hip flexor strength block:** Seated Single Leg Raise | 3×8/side | 2-1-1-0 | 60s | Memory-flagged weakness; gates L-sit/leg raise progression |
| **L-Sit Progression (M7 wiring)** | 3×max | – | 60s | Currently Tucked L-Sit (was unused) |
| Hollow Body ↔ Arch Body superset (G5 consolidated) | 3× (30s + 30s) | – | 45s | Was 2 separate blocks |
| Leg Raise Progression | 3×10 | 2-1-2-0 | 45s | Hanging variant |

Session target: ~65 min. **Block count dropped from 8 to 8 but each is leaner**; Pike Compression removed (overlaps with Sat seated forward fold + L-sit position itself).

---

### Thu — Push B / Chest (Planche)
**Intent:** Planche skill second exposure, horizontal push hypertrophy density.

| Block | Sets×Reps | Tempo | Rest | Notes |
|---|---|---|---|---|
| Wrist Mobility Routine | 1×5min | – | – | |
| **Scap protraction (G3):** Scapular Push-Ups | 2×15 | 2-0-2-0 | 30s | Isolates the exact serratus quality planche needs |
| Planche Skill Superset 3×: Planche Progression + Planche Leans 10 + Planche Lean Hold max | 3 rounds | – | 120s | Gated |
| **Vertical press (G1, second exposure):** Pike Push-Ups | 3×8 | 3-1-1-0 | 120s | Second weekly dose — matches dip volume |
| **Dip Progression (G4, second exposure)** | 3×8 | 3-1-1-0 | 120s | Brings dips to 6 sets/wk |
| Chest density superset 3×: Pseudo Push-Up Hold 15s + Push-Up Progression 8 + Wide Push-Ups 12 + Slow Motion Push-Ups (1 rep @ ~30s) | 3 rounds | – | 75s | Existing block, intentional density (per memo) |
| **Wrist conditioning end-of-session (G2):** Fingertip Push-Up Hold | 2×20s | – | 60s | Tendons load when fatigued — eccentric-style adaptation |

Session target: ~75 min.

---

### Fri — Pull B (Volume) — Supinated
**Intent:** Pull-up volume, lever as volume, grip variation (M5).

| Block | Sets×Reps | Tempo | Rest | Notes |
|---|---|---|---|---|
| Dead Hang | 2×40s | – | 30s | |
| Scapular Pulls | 2×10 | 2-0-2-0 | 30s | |
| **Front Lever (volume, M6):** Front Lever Progression | 4×max @ ~60–70% best | – | 120s | Sub-max, accumulate time-under-tension |
| **Main lift:** Pull-Up Progression, **supinated/chin-up grip** (M5) | 3×3 cluster (2+2+2 with 20s inside) | controlled | 150s | Grip variation = medial epicondyle relief |
| Negative Pull-Ups | 4×3 | 6s descent | 120s | Eccentric overload |
| Inverted Rows, **supinated** (M5) | 3×12 | 3-0-1-0 | 90s | Grip-balance volume |
| Chin-Up Hold | 2×max | – | 90s | Existing |
| **Biceps (M3, second exposure):** Banded Curls or Gym Cable Curls | 2×15 @ RIR 2 | 2-0-1-0 | 60s | Volume day = higher rep |

Session target: ~70 min.

---

### Sat — Skill Snacks + Weigh-In
**Not a workout. ~10 min ritual.**

- Step on scale, log weight (app prompts).
- Wrist Mobility Routine (5 min).
- Frog Stand 2×max, 60s rest (skill exposure, low fatigue).
- Planche Lean Hold 2×20s, 60s rest.
- Front Lever Tuck Hold 2×max, 60s rest.

### Sun — Rest
- Optional: hip flexor stretch + chest/shoulder stretch (the existing Sat Mobility & Recovery block, opt-in).
- Otherwise complete rest.

---

## Gap resolution map

### v1 Gaps (G1–G9)
| Gap | Resolved by |
|---|---|
| G1 Vertical pressing starved | Pike Push-Ups on both push days (Mon + Thu) — 6 sets/wk |
| G2 Wrist conditioning missing | Knuckle PU Hold (Mon) + Fingertip PU Hold (Thu) |
| G3 Scap protraction undertrained | Scapular Push-Ups 2×15 on Thu |
| G4 Dips under-prescribed | Dips on both push days — 6 sets/wk |
| G5 Wed too dense | Hollow↔Arch consolidated, Pike Compression dropped |
| G6 Pull A & B lever identical | Pull A = strength (3×80%), Pull B = volume (4×60–70%) |
| G7 Push-day activation implicit | Wall Slides + Band Pull-Aparts before planche skill |
| G8 Skill progression markers absent | Test-day PRs become explicit level-up benchmarks |
| G9 No deload | Week 6 = deload + test, repeats |

### Pro-audit follow-ups (M1–M13)
| Item | Resolved by |
|---|---|
| M1 Tempo not first-class | Added `tempo: { ecc, bottomPause, con, topPause }` to BlockEntry (app change) |
| M2 No re-test cadence | Thu of week 6 = explicit test session |
| M3 Direct biceps work | Banded/cable curls on both pull days |
| M4 Elbow prehab | Wall slides + band pull-aparts + wrist conditioning + bias on push days |
| M5 Grip variation | Tue pronated / Fri supinated for pull-ups AND inverted rows |
| M6 Forearm flexor balance | Fingertip Push-Up Hold + supinated pull volume on Fri |
| M7 L-Sit Progression unused | Wired into Wed (3×max Tucked L-Sit, progresses to one-leg → full) |
| M8 Volume progression undefined | Auto-suggest +1 rep on clean target hit (app feature) |
| M9 Skill vs strength frequency | Skill = 2×/wk gym + 2×/wk skill snacks (4 exposures); strength = 1–2×/wk |
| M10 Bilateral hip-dom missing | Banded Good Morning or Hip Thrust on Wed |
| M11 Nordic over-dosed | Reduced 3×5 → 2×6 with 5-week ramp to 3×8 |
| M12 Session ordering | Mon Push → Tue Pull A (heavy) is the riskiest stack — but 24h between skill and heavy pull is enough at novice volume. Watch for accumulated fatigue. |
| M13 Autoregulation gates passive | Active gates with auto-skip on PPP, Planche skill, Pseudo PU Hold, Deficit HSPU |

---

## New movements to add to the seed

| Movement | Why | Used in |
|---|---|---|
| Wall Slides | Posterior delt/scap activation pre-push | Mon |
| Knuckle Push-Up Hold | Wrist conditioning (extension load) | Mon |
| Fingertip Push-Up Hold | Wrist conditioning (flexor balance / M6) | Thu |
| Scapular Push-Ups | Scap protraction strength (G3) | Thu |
| Banded Good Morning | Bilateral hip-dom (M10) | Wed |
| Hip Thrust (BW or weighted) | Alt bilateral hip-dom | Wed |
| Banded Biceps Curl | Direct biceps (M3) | Tue / Fri |
| (gym) Cable Biceps Curl | Heavier biceps alternative | Tue / Fri |

---

## App changes required to support this plan

These are workout-side, not purely UX (those stay in `app-improvements.md`):

1. **6-week macrocycle support** — Program model currently has `cycleLengthDays: 7`. Either extend to `cycleLengthDays: 42` with explicit week-6 deload variants, OR add a `phases: ProgramPhase[]` concept where weeks 1–5 use one workout-day map and week 6 uses another.
2. **Tempo as first-class data** — Add `tempo?: { eccentric, bottomPause, concentric, topPause }` to `BlockEntry`. Render as "3-1-1-0" in execution. Optional countdown of eccentric phase during exercise state.
3. **Active gates on entries** — Add `gate?: { question: string, skipOnNo: boolean }` to `BlockEntry`. Execution engine shows the prompt before transitioning into the exercise phase; auto-skips on No and logs reason.
4. **Auto-suggested targets** — Repository query: "last clean hit of this entry's movement at this rung." If hit, suggest `targetReps + 1` on lowest set. New `suggestedTargetReps` overlay in execution UI.
5. **RIR field on SetLog** — Optional 0–4 integer. Chip row on AdjustScreen.
6. **Test-day flag on Program day** — Mark week-6-Thu as a special session that scores PRs. PRs become first-class entities (`MovementPR { movementId, bestReps?, bestSeconds?, achievedAt, workoutLogId }`).
7. **Bodyweight log + weekly prompt** — `BodyweightLog` table, prompt on Saturday open, overlay on pull-up trend.
8. **Skill snack tracking** — Either as a 4th workout type or a separate `SkillSnack` log entity. Sat/Sun has a one-tap "did skill snack" check.

---

## Open questions / coach watch-points

These aren't decisions to make now but things to monitor over the first 6-week cycle and revisit:

- **CNS load Mon→Tue.** Skill day followed by heavy pull. At novice volume this is fine; if pull-up max stalls in cycles 2–3, consider inserting a rest day between Mon and Tue.
- **Pull-up volume per week.** Tue (5×2 = 10) + Fri (3×3 cluster = 18) + negatives (4×3 = 12) = 40 sets of pull-related movement per week. High for a novice. If shoulder/elbow tightness appears, drop the negatives first.
- **Wrist tolerance.** Two wrist-loaded conditioning days (Mon knuckle, Thu fingertip) plus planche skill on both = 4 exposures. Watch for ache in week 3–4; pull back fingertip work first if needed.
- **Nordic ramp-up cadence.** 2×6 → 2×8 → 3×6 → 3×8 over the first 4 cycle-weeks. If hamstring DOMS persists >72h, hold the rung longer.
- **Hip flexor strength gating L-sit progression.** Tucked L-Sit → One-Leg L-Sit unlocks only when seated single-leg raise hits 3×10/side clean.

---

## Top 3 actions to ship first

1. **Update the seed** — new workouts (Pull A, Push A, Wed, Thu, Pull B as detailed above), new movements (Wall Slides, Knuckle PU Hold, Fingertip PU Hold, Scapular PU, Banded Good Morning, Hip Thrust, Banded Curl). Keep existing Mobility & Recovery as opt-in. Old "Personal Calisthenics" program can be retired or kept as v1 archive.
2. **Add tempo + gate to BlockEntry** — Smallest data model change that unlocks the most prescription quality. App changes #2 and #3.
3. **Wire test-day + PR tracking** — App change #6. The 6-week cycle has no payoff signal without it.
