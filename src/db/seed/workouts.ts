import type { SeedWorkout } from "./types";

export const SEED_WORKOUTS: SeedWorkout[] = [
  // ── OPT-IN: TEST DAY ──────────────────────────────────────────────────────
  // Run manually every ~6 weeks. Its whole job is to put PRs on the record:
  // the entry gates and adaptive slots read LOGGED PRs, so an untested max is
  // an invisible one. Referenced BY NAME in
  // src/repositories/workout-logs.repository.ts to flag PRs set here — do not
  // rename without updating TEST_DAY_WORKOUT_NAME.
  {
    name: "Test Day (Week 6)",
    restBetweenBlocksSeconds: 180,
    blocks: [
      {
        type: "set",
        rounds: 1,
        restSeconds: 0,
        entries: [
          {
            movement: "Wrist Mobility Routine",
            mode: "time",
            targetSeconds: 300,
          },
        ],
      },
      // Warm-up only — keep test execution fresh.
      {
        type: "set",
        rounds: 2,
        restSeconds: 30,
        entries: [{ movement: "Dead Hang", mode: "time", targetSeconds: 20 }],
      },
      {
        type: "set",
        rounds: 1,
        restSeconds: 180,
        entries: [
          { movement: "Frog Stand", mode: "max" },
        ],
      },
      {
        type: "set",
        rounds: 1,
        restSeconds: 180,
        entries: [
          { movement: "Planche Lean Hold", mode: "max" },
        ],
      },
      {
        type: "set",
        rounds: 1,
        restSeconds: 180,
        entries: [
          { movement: "Front Lever Tuck Hold", mode: "max" },
        ],
      },
      // Max strict pull-ups. Single all-out set. 180s rest before → fresh CNS.
      {
        type: "set",
        rounds: 1,
        restSeconds: 0,
        entries: [
          { movement: "Pull-Ups", mode: "max" },
        ],
      },
      // Max Archer Push-Ups per side. Last because least CNS-limited.
      {
        type: "set",
        rounds: 1,
        restSeconds: 0,
        entries: [
          {
            movement: "Archer Push-Ups",
            mode: "max",
            perSide: true,
          },
        ],
      },
    ],
  },

  // ============================================================
  // WEEK 6 DELOAD VARIANTS
  // Per workout-improvements v2: "Mon/Wed/Fri at ~60% volume (drop a set
  // per block, keep target reps). Tue: light pull (skill only, no straight
  // sets). Thu: TEST DAY." These workouts only appear on days 36-40 of the
  // program cycle; weeks 1-5 use the non-deload variants above.
  //
  // Maintenance rule: when changing a main workout's prescription, mirror
  // the change here (or accept that deload diverges). Keep target reps the
  // same as main — only the round count drops.
  // ============================================================

  // Mon Week 6 — Push + Planche Skill (Deload)

  // Tue Week 6 — Pull A (Skill Only). Light: warmup + lever skill only, no
  // heavy pull strength. Per the v2 plan "skill only, no straight sets".

  // Wed Week 6 — Legs + Core (Deload)

  // Fri Week 6 — Pull B (Deload)

  // ============================================================
  // ISA — First pull-up program (~45 min sessions, 3 days/week).
  //
  // Designed for early-novice baseline: ~10–20s dead hang, no negatives yet.
  // Targets first chin-up (rung 6 of Pull-Up Progression) then first pull-up
  // (rung 9). One Pull-Up Progression covers the whole journey via
  // currentLevel auto-advance.
  //
  // CURRENT TUNING: rungs 0–3 (Dead Hang → Inverted Rows).
  //
  // When Isa crosses into rung 4+ (Negative Chin-Ups), swap in Band-Assisted
  // Chin-Ups and Assisted Pull-Up Machine on Pull B for full-ROM concentric
  // exposure. The main Pull-Up Progression block resolves automatically.
  //
  // No tempo prescribed on the progression-bound main blocks — the right
  // tempo depends on the rung (slow descent on negatives, controlled on
  // rows, just hold for hangs). Tempo guidance lives on the movement
  // coachingCues instead. This is the trade-off the data model imposes when
  // a single block must span a multi-rung journey.
  // ============================================================

  // Mon — Isa Pull A (Strength) ~45 min
  // Supinated-grip bias, low rep / high effort. Max Dead Hang at the END
  // (grip-failure protected from compromising main pulling work).

  // Wed — Isa Balance Day ~40 min
  // Push + legs + core. Breaks up pull volume, supports recovery.

  // Fri — Isa Pull B (Volume) ~45 min
  // Supinated bias, more sets at the rung, horizontal pull volume.

  // ============================================================
  // PHASE ROUTINES — 4 OG2-tier phase programs.
  // Prefix "Phase [N]" on all names so they don't collide with Ivan/Isa
  // workouts. Blocks are progression-bound (auto-evolve with currentLevel).
  // Sets×reps follow spec §4 per-phase defaults.
  // NOT on Pull A: Nordic Hamstring Curl per project rule (CLAUDE.md).
  // ============================================================

  // ── PHASE 1 — Untrained Beginner ───────────────────────────────────────
  // 3 days/week full-body (M/W/F). Levels 1–4.
  // All eight base progressions, linear 3×(5→15). Wall HS skill 5–10 min.
  // No upper-level statics — connective-tissue building phase.

  // ── PHASE 2 — Trained Beginner ─────────────────────────────────────────
  // 4 days/week: Push / Pull / Lower+Core / Full-Body(skill).
  // Levels 5–6. Introduces statics, rings, lever lead-ins, L-sit, MU prep.
  // Limit 2–3 concurrent skill goals.

  // Phase 2 Day A — Push

  // Phase 2 Day B — Pull

  // Phase 2 Day C — Lower + Core

  // Phase 2 Day D — Full Body / Skill

  // ── PHASE 3 — Intermediate ─────────────────────────────────────────────
  // 4–5 days/week. Straight-arm / lever split + bent-arm / press split.
  // Levels 7–9. Paired: Planche ↔ Front Lever; OAC prep 1–2×/wk.

  // Phase 3 Day A — Straight-Arm / Lever Push

  // Phase 3 Day B — Straight-Arm / Lever Pull

  // Phase 3 Day C — Bent-Arm Push + Core

  // Phase 3 Day D — Bent-Arm Pull + Lower

  // ── PHASE 4 — Advanced / Elite SAC ────────────────────────────────────
  // 4–5 days/week. DUP / push-pull heavy-light. Levels 10+.
  // Focus: one push goal OR one pull goal at a time. IC, Maltese, Manna.

  // Phase 4 Day A — Heavy Push (Planche / Maltese track)

  // Phase 4 Day B — Heavy Pull (Iron Cross / OAC track)

  // Phase 4 Day C — Light Push + Manna / Skill

  // Phase 4 Day D — Light Pull + Lower

  // ── ADAPTIVE PROGRAM (pattern-slot days) ──────────────────────────────────
  // The only program in seed. Every entry is a PATTERN slot that resolves at
  // runtime to the hardest progression the athlete has unlocked
  // (src/db/seed/patterns.ts), so the week's structure is fixed while its
  // difficulty tracks the athlete. A slot whose whole chain is still locked
  // degrades to the work that unlocks it rather than disappearing — see
  // src/lib/session-adaptation.ts and CONTEXT.md "Session Adaptation".
  //
  // Slot ORDER assumes the degraded case too: don't lead a day with a slot
  // whose unlock work would pre-fatigue the day's main lift.
  {
    name: "Adaptive — Push",
    restBetweenBlocksSeconds: 120,
    blocks: [
      { type: "set", rounds: 4, restSeconds: 120, entries: [{ pattern: "horizontal-push" }] },
      { type: "set", rounds: 3, restSeconds: 120, entries: [{ pattern: "dip" }] },
      { type: "set", rounds: 3, restSeconds: 120, entries: [{ pattern: "overhead-press" }] },
      // Anti-extension core closes the day — it's the trunk demand the planche
      // and HSPU lines both cash in on. Core only, never leg accessory work.
      { type: "set", rounds: 3, restSeconds: 60, entries: [{ pattern: "core-anti-extension" }] },
    ],
  },
  {
    name: "Adaptive — Pull",
    restBetweenBlocksSeconds: 120,
    blocks: [
      // Vertical pull leads, NOT the lever slot. When `pull-static` is still
      // locked it degrades to its unlock work — currently a long dead hang —
      // and 4 sets of grip work before pull-ups would wreck the main lift.
      // Lever holds in slot 2 are still fresh enough.
      { type: "set", rounds: 4, restSeconds: 120, entries: [{ pattern: "vertical-pull" }] },
      { type: "set", rounds: 4, restSeconds: 120, entries: [{ pattern: "pull-static" }] },
      { type: "set", rounds: 3, restSeconds: 90, entries: [{ pattern: "horizontal-pull" }] },
      // Compression core — the hollow position the lever lines are built on.
      { type: "set", rounds: 3, restSeconds: 60, entries: [{ pattern: "core-compression" }] },
    ],
  },
  {
    name: "Adaptive — Legs & Core",
    restBetweenBlocksSeconds: 90,
    blocks: [
      { type: "set", rounds: 3, restSeconds: 120, entries: [{ pattern: "squat" }] },
      { type: "set", rounds: 3, restSeconds: 90, entries: [{ pattern: "hinge" }] },
      { type: "set", rounds: 3, restSeconds: 60, entries: [{ pattern: "core-anti-extension" }] },
      { type: "set", rounds: 3, restSeconds: 60, entries: [{ pattern: "core-flexion" }] },
    ],
  },
  {
    name: "Adaptive — Skill & Push",
    restBetweenBlocksSeconds: 90,
    blocks: [
      // Balance + straight-arm skill up front (fresh).
      { type: "set", rounds: 4, restSeconds: 60, entries: [{ pattern: "handstand" }] },
      { type: "set", rounds: 4, restSeconds: 90, entries: [{ pattern: "planche" }] },
      { type: "set", rounds: 3, restSeconds: 90, entries: [{ pattern: "horizontal-push" }] },
      { type: "set", rounds: 3, restSeconds: 120, entries: [{ pattern: "dip" }] },
    ],
  },
  {
    name: "Adaptive — Pull & Core",
    restBetweenBlocksSeconds: 120,
    blocks: [
      { type: "set", rounds: 4, restSeconds: 120, entries: [{ pattern: "vertical-pull" }] },
      // Muscle-up + flag optional — appear once their bases are unlocked.
      { type: "set", rounds: 3, restSeconds: 120, entries: [{ pattern: "muscle-up" }] },
      { type: "set", rounds: 3, restSeconds: 90, entries: [{ pattern: "horizontal-pull" }] },
      { type: "set", rounds: 4, restSeconds: 60, entries: [{ pattern: "core-compression" }] },
      { type: "set", rounds: 3, restSeconds: 90, entries: [{ pattern: "flag" }] },
    ],
  },
];
