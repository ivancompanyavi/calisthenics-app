import type { SeedWorkout } from "./types";

// Tempo shorthand. Convention: eccentric - bottom pause - concentric - top
// pause, in seconds. `X` (max-speed concentric, explosive intent) is encoded
// as concentric: 0 with the coaching cue carrying the explosive intent — the
// timer can't enforce "as fast as possible" but the data still records that
// no specific concentric duration was prescribed.
const T = (
  eccentric: number,
  bottomPause: number,
  concentric: number,
  topPause: number,
) => ({ eccentric, bottomPause, concentric, topPause });

// Pre-flight autoregulation gates. Reused across the planche/PPP family on
// push days — wrist/elbow health gates the skill exposure, not the strength
// pieces (the strength pieces have their own ladder progression).
const GATE_WRIST_ELBOW = {
  question: "Wrists and elbows feel good today?",
  skipOnNo: true,
};
const GATE_PLANCHE_LEAN_QUALITY = {
  question: "Did your planche lean feel solid today?",
  skipOnNo: true,
};

export const SEED_WORKOUTS: SeedWorkout[] = [
  // ============================================================
  // Mon — Push A + Planche Skill (~65 min)
  // Skill exposure when fresh. Anterior-loaded movement gated by wrists.
  // ============================================================
  {
    name: "Push + Planche Skill",
    restBetweenBlocksSeconds: 120,
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
      // Activation superset: posterior-shoulder + scap before forward-loaded
      // planche work (M4 elbow prehab + G7 push-day activation).
      {
        type: "superset",
        rounds: 2,
        restSeconds: 30,
        entries: [
          { movement: "Wall Slides", mode: "reps", targetReps: 10 },
          { movement: "Band Pull-Aparts", mode: "reps", targetReps: 15 },
        ],
      },
      // Wrist conditioning (G2). Progressive extension-tolerance load on a
      // straight forearm-to-hand line — bridges into floor PPP.
      {
        type: "set",
        rounds: 2,
        restSeconds: 60,
        entries: [
          {
            movement: "Knuckle Push-Up Hold",
            mode: "time",
            targetSeconds: 30,
          },
        ],
      },
      // Planche skill. Gated — first contact with wrist load this session.
      {
        type: "set",
        rounds: 4,
        restSeconds: 120,
        entries: [
          {
            progression: "Planche Progression",
            gate: GATE_WRIST_ELBOW,
          },
        ],
      },
      {
        type: "set",
        rounds: 3,
        restSeconds: 90,
        entries: [
          { movement: "Planche Lean Hold", mode: "time", targetSeconds: 20 },
        ],
      },
      // Skill-strength (PPP). Quality-gated — skip on bad-lean days per the
      // existing PPP coaching rule (movements.ts).
      {
        type: "set",
        rounds: 3,
        restSeconds: 120,
        entries: [
          {
            movement: "Pseudo Planche Push-Ups",
            mode: "reps",
            targetReps: 4,
            tempo: T(3, 1, 1, 0),
            gate: GATE_PLANCHE_LEAN_QUALITY,
          },
        ],
      },
      // Vertical press (G1). Movement-bound — HSPU Progression mixes modes
      // so progression-binding it would break character at the wall-handstand
      // rung (see CLAUDE.md note).
      {
        type: "set",
        rounds: 3,
        restSeconds: 120,
        entries: [
          {
            movement: "Pike Push-Ups",
            mode: "reps",
            targetReps: 8,
            tempo: T(3, 1, 1, 0),
          },
        ],
      },
      // Dips (G4 first exposure). Progression-bound — clean reps ladder.
      {
        type: "set",
        rounds: 3,
        restSeconds: 90,
        entries: [
          {
            progression: "Dip Progression",
            targetReps: 7,
            tempo: T(3, 1, 1, 0),
          },
        ],
      },
      // Push-up family (asymmetric strength at Ivan's current rung = Archer).
      {
        type: "set",
        rounds: 3,
        restSeconds: 90,
        entries: [
          {
            progression: "Push-Up Progression",
            targetReps: 6,
            tempo: T(3, 0, 1, 0),
          },
        ],
      },
    ],
  },

  // ============================================================
  // Tue — Pull A (Heavy / Neural) (~60 min)
  // Max pull-up strength, lever as strength (not volume). Pronated grip.
  // ============================================================
  {
    name: "Pull A (Heavy)",
    restBetweenBlocksSeconds: 120,
    blocks: [
      {
        type: "set",
        rounds: 2,
        restSeconds: 30,
        entries: [{ movement: "Dead Hang", mode: "time", targetSeconds: 30 }],
      },
      {
        type: "set",
        rounds: 2,
        restSeconds: 30,
        entries: [
          {
            movement: "Scapular Pulls",
            mode: "reps",
            targetReps: 10,
            tempo: T(2, 0, 2, 0),
          },
        ],
      },
      // Front lever as strength (M6): fewer sets, sub-max holds at ~80% best.
      {
        type: "set",
        rounds: 3,
        restSeconds: 120,
        entries: [{ progression: "Front Lever Progression" }],
      },
      // Heavy pull. 5×2 straight sets, pronated, near-max strength. Concentric
      // tempo X (encoded 0) = explosive intent — the coaching cue carries it.
      {
        type: "set",
        rounds: 5,
        restSeconds: 180,
        entries: [
          {
            progression: "Pull-Up Progression",
            targetReps: 2,
            tempo: T(3, 1, 0, 0),
          },
        ],
      },
      // Horizontal pull, pronated. Tempo controlled both ways.
      {
        type: "set",
        rounds: 3,
        restSeconds: 90,
        entries: [
          {
            movement: "Inverted Rows",
            mode: "reps",
            targetReps: 8,
            tempo: T(3, 0, 1, 0),
          },
        ],
      },
      // Direct biceps (M3). Accelerator for novice pull-up max.
      {
        type: "set",
        rounds: 2,
        restSeconds: 60,
        entries: [
          {
            movement: "Banded Biceps Curl",
            mode: "reps",
            targetReps: 12,
            tempo: T(2, 0, 1, 0),
          },
        ],
      },
    ],
  },

  // ============================================================
  // Wed — Legs + Core (~65 min)
  // Posterior chain for planche line + hip flexor strength + core for skills.
  // ============================================================
  {
    name: "Legs + Core",
    previousNames: ["Core + Compression"],
    restBetweenBlocksSeconds: 90,
    blocks: [
      {
        type: "set",
        rounds: 3,
        restSeconds: 120,
        entries: [
          {
            progression: "Squat Progression",
            tempo: T(3, 0, 1, 0),
          },
        ],
      },
      {
        type: "set",
        rounds: 3,
        restSeconds: 60,
        entries: [
          {
            movement: "Single-Leg Glute Bridge",
            mode: "reps",
            targetReps: 10,
            perSide: true,
            tempo: T(2, 1, 1, 0),
          },
        ],
      },
      // Bilateral hip-dominant (M10). Banded Good Morning is the bodyweight
      // primary; swap to Hip Thrust at the gym for heavier load.
      {
        type: "set",
        rounds: 3,
        restSeconds: 90,
        entries: [
          {
            movement: "Banded Good Morning",
            mode: "reps",
            targetReps: 12,
            tempo: T(2, 0, 1, 1),
          },
        ],
      },
      // Nordic: dosed conservative per M11 — 2×6 starting, ramp to 3×8 over
      // the 5-week accumulation. 6s eccentric is the load.
      {
        type: "set",
        rounds: 2,
        restSeconds: 120,
        entries: [
          {
            movement: "Nordic Hamstring Curl",
            mode: "reps",
            targetReps: 6,
            tempo: T(6, 0, 0, 0),
          },
        ],
      },
      // Hip flexor strength (gates L-sit + leg raise progression per memory).
      {
        type: "set",
        rounds: 3,
        restSeconds: 60,
        entries: [
          {
            movement: "Seated Single Leg Raise",
            mode: "reps",
            targetReps: 8,
            perSide: true,
            tempo: T(2, 1, 1, 0),
          },
        ],
      },
      // L-Sit Progression — finally wired in (M7). Currently Tucked L-Sit.
      {
        type: "set",
        rounds: 3,
        restSeconds: 60,
        entries: [{ progression: "L-Sit Progression" }],
      },
      // Hollow ↔ Arch superset (G5 consolidation). Was 2 separate blocks.
      {
        type: "superset",
        rounds: 3,
        restSeconds: 45,
        entries: [
          {
            movement: "Hollow Body Hold",
            mode: "time",
            targetSeconds: 30,
          },
          { movement: "Arch Body Hold", mode: "time", targetSeconds: 30 },
        ],
      },
      {
        type: "set",
        rounds: 3,
        restSeconds: 45,
        entries: [
          {
            progression: "Leg Raise Progression",
            targetReps: 10,
            tempo: T(2, 1, 2, 0),
          },
        ],
      },
    ],
  },

  // ============================================================
  // Thu — Chest (Planche) (~75 min)
  // Planche skill second exposure, horizontal push hypertrophy density.
  // ============================================================
  {
    name: "Chest (Planche)",
    restBetweenBlocksSeconds: 120,
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
      // Scap protraction isolator (G3). Directly trains the serratus
      // quality planche needs.
      {
        type: "set",
        rounds: 2,
        restSeconds: 30,
        entries: [
          {
            movement: "Scapular Push-Ups",
            mode: "reps",
            targetReps: 15,
            tempo: T(2, 0, 2, 0),
          },
        ],
      },
      // Planche skill superset (existing structure, now gated).
      {
        type: "superset",
        rounds: 3,
        restSeconds: 120,
        entries: [
          {
            progression: "Planche Progression",
            gate: GATE_WRIST_ELBOW,
          },
          { movement: "Planche Leans", mode: "reps", targetReps: 10 },
          { movement: "Planche Lean Hold", mode: "max" },
        ],
      },
      // Vertical press (G1 second exposure). Movement-bound.
      {
        type: "set",
        rounds: 3,
        restSeconds: 120,
        entries: [
          {
            movement: "Pike Push-Ups",
            mode: "reps",
            targetReps: 8,
            tempo: T(3, 1, 1, 0),
          },
        ],
      },
      // Dips (G4 second exposure) — brings dips to 6 sets/wk.
      {
        type: "set",
        rounds: 3,
        restSeconds: 120,
        entries: [
          {
            progression: "Dip Progression",
            targetReps: 8,
            tempo: T(3, 1, 1, 0),
          },
        ],
      },
      // Chest density superset — existing intentional density block (per
      // program-design-rationale memory: 75s rest is intentional, don't fix).
      {
        type: "superset",
        rounds: 3,
        restSeconds: 75,
        entries: [
          { movement: "Pseudo Push-Up Hold", mode: "time", targetSeconds: 15 },
          { progression: "Push-Up Progression", targetReps: 8 },
          { movement: "Wide Push-Ups", mode: "reps", targetReps: 12 },
          { movement: "Slow Motion Push-Ups", mode: "time", targetSeconds: 30 },
        ],
      },
      // End-of-session wrist conditioning (G2, M6 flexor balance). Fingertip
      // work loads forearm flexors — antagonist to the extension dominance.
      {
        type: "set",
        rounds: 2,
        restSeconds: 60,
        entries: [
          {
            movement: "Fingertip Push-Up Hold",
            mode: "time",
            targetSeconds: 20,
          },
        ],
      },
    ],
  },

  // ============================================================
  // Fri — Pull B (Volume / Supinated) (~70 min)
  // Pull-up volume, lever as volume, grip variation (M5). Supinated grip.
  // ============================================================
  {
    name: "Pull B (Volume)",
    previousNames: ["Pull + Volume Building"],
    restBetweenBlocksSeconds: 90,
    blocks: [
      {
        type: "set",
        rounds: 2,
        restSeconds: 30,
        entries: [{ movement: "Dead Hang", mode: "time", targetSeconds: 40 }],
      },
      {
        type: "set",
        rounds: 2,
        restSeconds: 30,
        entries: [
          {
            movement: "Scapular Pulls",
            mode: "reps",
            targetReps: 10,
            tempo: T(2, 0, 2, 0),
          },
        ],
      },
      // Front lever as volume (M6): more sets, sub-max holds at ~60-70% best.
      {
        type: "set",
        rounds: 4,
        restSeconds: 120,
        entries: [{ progression: "Front Lever Progression" }],
      },
      // Volume pull, supinated. 3×3 cluster — see Pull-Ups coaching cue.
      {
        type: "set",
        rounds: 3,
        restSeconds: 150,
        entries: [{ progression: "Pull-Up Progression", targetReps: 3 }],
      },
      // Eccentric overload. 6s descent is the load.
      {
        type: "set",
        rounds: 4,
        restSeconds: 120,
        entries: [
          {
            movement: "Negative Pull-Ups",
            mode: "reps",
            targetReps: 3,
            tempo: T(6, 0, 0, 0),
          },
        ],
      },
      // Horizontal pull, supinated (M5 grip-balance volume).
      {
        type: "set",
        rounds: 3,
        restSeconds: 90,
        entries: [
          {
            movement: "Inverted Rows",
            mode: "reps",
            targetReps: 12,
            tempo: T(3, 0, 1, 0),
          },
        ],
      },
      {
        type: "set",
        rounds: 2,
        restSeconds: 90,
        entries: [{ movement: "Chin-Up Hold", mode: "max" }],
      },
      // Direct biceps (M3 second exposure, higher rep range for volume day).
      {
        type: "set",
        rounds: 2,
        restSeconds: 60,
        entries: [
          {
            movement: "Banded Biceps Curl",
            mode: "reps",
            targetReps: 15,
            tempo: T(2, 0, 1, 0),
          },
        ],
      },
    ],
  },

  // ============================================================
  // Opt-in: Mobility & Recovery (not in the active program calendar).
  // Per workout-improvements v2: kept as opt-in workout for travel days
  // or extra recovery sessions. Daily mobility is a separate habit.
  // ============================================================
  {
    name: "Mobility & Recovery",
    restBetweenBlocksSeconds: 30,
    blocks: [
      {
        type: "set",
        rounds: 2,
        restSeconds: 0,
        entries: [
          {
            movement: "Hip Flexor Stretch",
            mode: "time",
            targetSeconds: 120,
            perSide: true,
          },
        ],
      },
      {
        type: "set",
        rounds: 2,
        restSeconds: 0,
        entries: [
          {
            movement: "Seated Forward Fold",
            mode: "time",
            targetSeconds: 120,
            perSide: true,
          },
        ],
      },
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
      {
        type: "set",
        rounds: 3,
        restSeconds: 30,
        entries: [
          { movement: "Band Pull-Aparts", mode: "reps", targetReps: 15 },
        ],
      },
      {
        type: "set",
        rounds: 2,
        restSeconds: 0,
        entries: [
          {
            movement: "Chest & Shoulder Stretch",
            mode: "time",
            targetSeconds: 90,
            perSide: true,
          },
        ],
      },
    ],
  },

  // ============================================================
  // Opt-in: Test Day (Week 6). Run manually every 6 weeks per v2 plan.
  // PRs from this session calibrate the next cycle's prescriptions.
  // ============================================================
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
  {
    name: "Push + Planche Skill (Deload)",
    restBetweenBlocksSeconds: 120,
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
      // Cut activation in half — body knows the pattern by week 6.
      {
        type: "superset",
        rounds: 1,
        restSeconds: 30,
        entries: [
          { movement: "Wall Slides", mode: "reps", targetReps: 10 },
          { movement: "Band Pull-Aparts", mode: "reps", targetReps: 15 },
        ],
      },
      {
        type: "set",
        rounds: 1,
        restSeconds: 60,
        entries: [
          {
            movement: "Knuckle Push-Up Hold",
            mode: "time",
            targetSeconds: 30,
          },
        ],
      },
      // Skill stays, slightly trimmed.
      {
        type: "set",
        rounds: 2,
        restSeconds: 120,
        entries: [
          {
            progression: "Planche Progression",
            gate: GATE_WRIST_ELBOW,
          },
        ],
      },
      {
        type: "set",
        rounds: 2,
        restSeconds: 90,
        entries: [
          { movement: "Planche Lean Hold", mode: "time", targetSeconds: 20 },
        ],
      },
      // PPP dropped this week — CNS-heavy skill-strength belongs in
      // accumulation weeks, not deload.
      {
        type: "set",
        rounds: 2,
        restSeconds: 120,
        entries: [
          {
            movement: "Pike Push-Ups",
            mode: "reps",
            targetReps: 8,
            tempo: T(3, 1, 1, 0),
          },
        ],
      },
      {
        type: "set",
        rounds: 2,
        restSeconds: 90,
        entries: [
          {
            progression: "Dip Progression",
            targetReps: 7,
            tempo: T(3, 1, 1, 0),
          },
        ],
      },
      {
        type: "set",
        rounds: 2,
        restSeconds: 90,
        entries: [
          {
            progression: "Push-Up Progression",
            targetReps: 6,
            tempo: T(3, 0, 1, 0),
          },
        ],
      },
    ],
  },

  // Tue Week 6 — Pull A (Skill Only). Light: warmup + lever skill only, no
  // heavy pull strength. Per the v2 plan "skill only, no straight sets".
  {
    name: "Pull A (Skill Only)",
    restBetweenBlocksSeconds: 90,
    blocks: [
      {
        type: "set",
        rounds: 2,
        restSeconds: 30,
        entries: [{ movement: "Dead Hang", mode: "time", targetSeconds: 30 }],
      },
      {
        type: "set",
        rounds: 2,
        restSeconds: 30,
        entries: [
          {
            movement: "Scapular Pulls",
            mode: "reps",
            targetReps: 10,
            tempo: T(2, 0, 2, 0),
          },
        ],
      },
      // Lever skill at ~60% — keeping the pattern grooved without taxing.
      {
        type: "set",
        rounds: 2,
        restSeconds: 120,
        entries: [{ progression: "Front Lever Progression" }],
      },
      // Light grip work as cooldown.
      {
        type: "set",
        rounds: 2,
        restSeconds: 30,
        entries: [
          { movement: "Active Hang", mode: "time", targetSeconds: 20 },
        ],
      },
    ],
  },

  // Wed Week 6 — Legs + Core (Deload)
  {
    name: "Legs + Core (Deload)",
    restBetweenBlocksSeconds: 90,
    blocks: [
      {
        type: "set",
        rounds: 2,
        restSeconds: 120,
        entries: [
          {
            progression: "Squat Progression",
            tempo: T(3, 0, 1, 0),
          },
        ],
      },
      {
        type: "set",
        rounds: 2,
        restSeconds: 60,
        entries: [
          {
            movement: "Single-Leg Glute Bridge",
            mode: "reps",
            targetReps: 10,
            perSide: true,
            tempo: T(2, 1, 1, 0),
          },
        ],
      },
      {
        type: "set",
        rounds: 2,
        restSeconds: 90,
        entries: [
          {
            movement: "Banded Good Morning",
            mode: "reps",
            targetReps: 12,
            tempo: T(2, 0, 1, 1),
          },
        ],
      },
      // Nordics dropped this week — heavy eccentrics fight deload intent.
      {
        type: "set",
        rounds: 2,
        restSeconds: 60,
        entries: [
          {
            movement: "Seated Single Leg Raise",
            mode: "reps",
            targetReps: 8,
            perSide: true,
            tempo: T(2, 1, 1, 0),
          },
        ],
      },
      {
        type: "set",
        rounds: 2,
        restSeconds: 60,
        entries: [{ progression: "L-Sit Progression" }],
      },
      {
        type: "superset",
        rounds: 2,
        restSeconds: 45,
        entries: [
          {
            movement: "Hollow Body Hold",
            mode: "time",
            targetSeconds: 30,
          },
          { movement: "Arch Body Hold", mode: "time", targetSeconds: 30 },
        ],
      },
      {
        type: "set",
        rounds: 2,
        restSeconds: 45,
        entries: [
          {
            progression: "Leg Raise Progression",
            targetReps: 10,
            tempo: T(2, 1, 2, 0),
          },
        ],
      },
    ],
  },

  // Fri Week 6 — Pull B (Deload)
  {
    name: "Pull B (Deload)",
    restBetweenBlocksSeconds: 90,
    blocks: [
      {
        type: "set",
        rounds: 2,
        restSeconds: 30,
        entries: [{ movement: "Dead Hang", mode: "time", targetSeconds: 40 }],
      },
      {
        type: "set",
        rounds: 2,
        restSeconds: 30,
        entries: [
          {
            movement: "Scapular Pulls",
            mode: "reps",
            targetReps: 10,
            tempo: T(2, 0, 2, 0),
          },
        ],
      },
      {
        type: "set",
        rounds: 2,
        restSeconds: 120,
        entries: [{ progression: "Front Lever Progression" }],
      },
      {
        type: "set",
        rounds: 2,
        restSeconds: 150,
        entries: [{ progression: "Pull-Up Progression", targetReps: 3 }],
      },
      // Negatives dropped — eccentric overload fights deload intent.
      {
        type: "set",
        rounds: 2,
        restSeconds: 90,
        entries: [
          {
            movement: "Inverted Rows",
            mode: "reps",
            targetReps: 12,
            tempo: T(3, 0, 1, 0),
          },
        ],
      },
      // Chin-Up Hold dropped this week. Biceps dropped this week.
    ],
  },
];
