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
  // Priority lift (5×2 heavy pull-ups) goes first when fresh — Front Lever
  // moved after the heavy pull. Sub-max FL at 80% best after max-CNS pull
  // work is fine; reverse order risked stealing a rep on the last heavy set.
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
      // Heavy pull (priority lift). 5×2 straight sets, pronated, near-max
      // strength. Concentric tempo X (encoded 0) = explosive intent — the
      // coaching cue carries it.
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
      // Front lever as strength (M6): fewer sets, sub-max holds at ~80% best.
      // Sub-max effort allows it to follow heavy pull-ups without compromise.
      {
        type: "set",
        rounds: 3,
        restSeconds: 120,
        entries: [{ progression: "Front Lever Progression" }],
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
      // Direct biceps. Elbow-flexor accessory — supports max pull-up rep
      // capacity by directly loading the prime mover.
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
            targetBandLevel: 3,
          },
        ],
      },
      // Face Pull — rear delt + external rotation. Antagonist to all the
      // internal-rotation-dominant pulling and planche pushing through the
      // week. Light, slow. Lives on pull days because Mon/Thu push days are
      // already crowded with skill + strength.
      {
        type: "set",
        rounds: 2,
        restSeconds: 60,
        entries: [
          {
            movement: "Face Pull",
            mode: "reps",
            targetReps: 12,
            tempo: T(2, 1, 2, 0),
            targetWeight: 15,
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
            targetBandLevel: 3,
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
            targetBandLevel: 3,
          },
        ],
      },
      // Face Pull — second exposure of the week, higher volume on the
      // volume day. Same rear-delt / external-rotation rationale as Pull A.
      {
        type: "set",
        rounds: 3,
        restSeconds: 60,
        entries: [
          {
            movement: "Face Pull",
            mode: "reps",
            targetReps: 15,
            tempo: T(2, 1, 2, 0),
            targetWeight: 15,
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
            targetBandLevel: 3,
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
      // Face Pull kept at minimum volume — shoulder-health maintenance
      // shouldn't take a week off even on deload.
      {
        type: "set",
        rounds: 1,
        restSeconds: 60,
        entries: [
          {
            movement: "Face Pull",
            mode: "reps",
            targetReps: 15,
            tempo: T(2, 1, 2, 0),
            targetWeight: 15,
          },
        ],
      },
    ],
  },

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
  {
    name: "Isa Pull A (Strength)",
    restBetweenBlocksSeconds: 90,
    blocks: [
      // Warm-up: scap activation + grip prep.
      {
        type: "set",
        rounds: 2,
        restSeconds: 30,
        entries: [
          { movement: "Active Hang", mode: "time", targetSeconds: 20 },
        ],
      },
      {
        type: "set",
        rounds: 2,
        restSeconds: 30,
        entries: [
          {
            movement: "Scapular Pulls",
            mode: "reps",
            targetReps: 8,
            tempo: T(2, 0, 2, 0),
          },
        ],
      },
      // Gated chin-up attempt. Fresh, post-warmup. Most weeks she answers No
      // and skips; when she feels ready, she answers Yes and the app records
      // her max effort (could be 0 = bar attempts, or 1+ once she gets there).
      {
        type: "set",
        rounds: 1,
        restSeconds: 180,
        entries: [
          {
            movement: "Chin-Ups",
            mode: "max",
            gate: {
              // Earn-it criterion: only attempt when she's hit 3 clean
              // negatives (5s descent) for 2 sessions in a row. Otherwise
              // failed attempts erode motivation without building strength.
              question:
                "Want to attempt a chin-up today? (Only if you've hit 3 clean negatives — 5s descent — for 2 sessions in a row.)",
              skipOnNo: true,
            },
          },
        ],
      },
      // Main strength block — resolves to her current rung. No tempo here:
      // the correct tempo varies per rung (hold for hangs, 5s descent for
      // negatives, controlled for assisted/full chin-ups). The movement's
      // coachingCues carry rung-appropriate tempo guidance.
      {
        type: "set",
        rounds: 3,
        restSeconds: 120,
        entries: [{ progression: "Pull-Up Progression" }],
      },
      // Heavy concentric — lat pulldown. Pull A is the heavy day; Pull B
      // does the same exercise lighter for volume. Rep range 8 to keep load
      // sub-maximal until pattern + scap stability are dialed (first 4–6
      // weeks). Drop to 6 reps with heavier load once she's hit her first
      // chin-up and the foundation is solid. Supinated during chin-up phase,
      // pronated when training the pull-up.
      {
        type: "set",
        rounds: 3,
        restSeconds: 90,
        entries: [
          {
            movement: "Lat Pulldown",
            mode: "reps",
            targetReps: 8,
            tempo: T(3, 0, 1, 0),
            targetWeight: 30,
          },
        ],
      },
      // Horizontal pull. Inverted Rows cue covers grip selection per phase.
      {
        type: "set",
        rounds: 3,
        restSeconds: 75,
        entries: [
          {
            movement: "Inverted Rows",
            mode: "reps",
            targetReps: 8,
            tempo: T(3, 0, 1, 0),
          },
        ],
      },
      // Direct biceps — accelerator for novice chin-up max.
      {
        type: "set",
        rounds: 2,
        restSeconds: 60,
        entries: [
          {
            movement: "Dumbbell Biceps Curl",
            mode: "reps",
            targetReps: 10,
            tempo: T(2, 0, 1, 0),
            targetWeight: 10,
          },
        ],
      },
      // Core — hollow body builds the pull-up shape (anti-extension trunk
      // position). Hit on every pulling day + Balance Day = 3×/week.
      {
        type: "set",
        rounds: 2,
        restSeconds: 30,
        entries: [
          { movement: "Hollow Body Hold", mode: "time", targetSeconds: 30 },
        ],
      },
      // Max Dead Hang at the END — grip benchmark without compromising
      // upstream pulling work. Count-up timer, single max effort.
      {
        type: "set",
        rounds: 1,
        restSeconds: 0,
        entries: [{ movement: "Dead Hang", mode: "max" }],
      },
    ],
  },

  // Wed — Isa Balance Day ~40 min
  // Push + legs + core. Breaks up pull volume, supports recovery.
  {
    name: "Isa Balance Day",
    restBetweenBlocksSeconds: 90,
    blocks: [
      // Shoulder warm-up superset.
      {
        type: "superset",
        rounds: 2,
        restSeconds: 30,
        entries: [
          { movement: "Wall Slides", mode: "reps", targetReps: 10 },
          { movement: "Band Pull-Aparts", mode: "reps", targetReps: 15 },
        ],
      },
      // Push — progression-bound, will resolve to her current rung. Likely
      // starts at Knee Push-Ups (currentLevel 2) or earlier.
      {
        type: "set",
        rounds: 3,
        restSeconds: 90,
        entries: [
          {
            progression: "Push-Up Progression",
            targetReps: 8,
            tempo: T(3, 0, 1, 0),
          },
        ],
      },
      // Squat — progression-bound, starts at Bodyweight Squats. Defer to
      // the progression's per-rung default rep target (15 at Bodyweight,
      // 10 at split-squat / pistol). No override.
      {
        type: "set",
        rounds: 3,
        restSeconds: 90,
        entries: [
          {
            progression: "Squat Progression",
            tempo: T(3, 0, 1, 0),
          },
        ],
      },
      // Posterior chain — glute strength.
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
      // Face Pull — rear delt + external rotation antagonist to all the
      // internal-rotation-dominant pulling on Pull A/B. Shoulder health
      // insurance. Light weight, slow.
      {
        type: "set",
        rounds: 3,
        restSeconds: 60,
        entries: [
          {
            movement: "Face Pull",
            mode: "reps",
            targetReps: 12,
            tempo: T(2, 1, 2, 0),
          },
        ],
      },
      // Core — hollow body builds the trunk shape needed for a clean pull-up.
      {
        type: "set",
        rounds: 3,
        restSeconds: 30,
        entries: [
          { movement: "Hollow Body Hold", mode: "time", targetSeconds: 30 },
        ],
      },
      {
        type: "set",
        rounds: 2,
        restSeconds: 30,
        entries: [
          {
            movement: "Side Plank",
            mode: "time",
            targetSeconds: 30,
            perSide: true,
          },
        ],
      },
    ],
  },

  // Fri — Isa Pull B (Volume) ~45 min
  // Supinated bias, more sets at the rung, horizontal pull volume.
  {
    name: "Isa Pull B (Volume)",
    restBetweenBlocksSeconds: 90,
    blocks: [
      {
        type: "set",
        rounds: 2,
        restSeconds: 30,
        entries: [
          { movement: "Active Hang", mode: "time", targetSeconds: 20 },
        ],
      },
      {
        type: "set",
        rounds: 2,
        restSeconds: 30,
        entries: [
          {
            movement: "Scapular Pulls",
            mode: "reps",
            targetReps: 8,
            tempo: T(2, 0, 2, 0),
          },
        ],
      },
      // Main block — same progression, more rounds for volume. No tempo
      // here (see Pull A comment) — movement cues carry rung-appropriate
      // tempo. Band-Assisted Chin-Ups isn't a separate accessory block on
      // purpose: when Isa reaches rung 5, her main block IS band-assisted.
      {
        type: "set",
        rounds: 4,
        restSeconds: 120,
        entries: [{ progression: "Pull-Up Progression" }],
      },
      // Concentric volume — lighter weight than Pull A, higher rep range.
      {
        type: "set",
        rounds: 3,
        restSeconds: 75,
        entries: [
          {
            movement: "Lat Pulldown",
            mode: "reps",
            targetReps: 10,
            tempo: T(2, 0, 1, 0),
            targetWeight: 25,
          },
        ],
      },
      // Horizontal pull — supinated, controlled tempo.
      {
        type: "set",
        rounds: 3,
        restSeconds: 75,
        entries: [
          {
            movement: "Inverted Rows",
            mode: "reps",
            targetReps: 10,
            tempo: T(3, 0, 1, 0),
          },
        ],
      },
      // Unilateral row — lat thickness + asymmetry correction.
      {
        type: "set",
        rounds: 2,
        restSeconds: 60,
        entries: [
          {
            movement: "Dumbbell Row",
            mode: "reps",
            targetReps: 10,
            perSide: true,
            tempo: T(2, 0, 1, 0),
            targetWeight: 10,
          },
        ],
      },
      // Volume biceps.
      {
        type: "set",
        rounds: 2,
        restSeconds: 60,
        entries: [
          {
            movement: "Dumbbell Biceps Curl",
            mode: "reps",
            targetReps: 12,
            tempo: T(2, 0, 1, 0),
            targetWeight: 10,
          },
        ],
      },
      // Core to close.
      {
        type: "set",
        rounds: 3,
        restSeconds: 30,
        entries: [
          { movement: "Hollow Body Hold", mode: "time", targetSeconds: 30 },
        ],
      },
    ],
  },

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
  {
    name: "Phase 1 — Full Body",
    restBetweenBlocksSeconds: 90,
    blocks: [
      // Push: P1 Push-Up Progression
      {
        type: "set",
        rounds: 3,
        restSeconds: 90,
        entries: [
          { progression: "Push-Up Progression", targetReps: 10 },
        ],
      },
      // Pull: P9 Pull-Up Progression
      {
        type: "set",
        rounds: 3,
        restSeconds: 90,
        entries: [
          { progression: "Pull-Up Progression", targetReps: 8 },
        ],
      },
      // Dip: P3 Dip Progression
      {
        type: "set",
        rounds: 3,
        restSeconds: 90,
        entries: [
          { progression: "Dip Progression", targetReps: 8 },
        ],
      },
      // Horizontal pull: P12 Rowing Progression
      {
        type: "set",
        rounds: 3,
        restSeconds: 90,
        entries: [
          { progression: "Rowing Progression", targetReps: 8 },
        ],
      },
      // Legs: P18 Squat Progression
      {
        type: "set",
        rounds: 3,
        restSeconds: 90,
        entries: [
          { progression: "Squat Progression", targetReps: 12 },
        ],
      },
      // Hip hinge: P19 Hip Hinge & Nordic Progression
      {
        type: "set",
        rounds: 3,
        restSeconds: 90,
        entries: [
          { progression: "Hip Hinge & Nordic Progression", targetReps: 10 },
        ],
      },
      // Core anti-ext: P20
      {
        type: "set",
        rounds: 3,
        restSeconds: 60,
        entries: [
          { progression: "Core Anti-Extension Progression" },
        ],
      },
      // Core flexion: P21
      {
        type: "set",
        rounds: 3,
        restSeconds: 60,
        entries: [
          { progression: "Leg Raise Progression", targetReps: 8 },
        ],
      },
      // Skill: Wall Handstand — 5–10 min practice, no load gate
      {
        type: "set",
        rounds: 4,
        restSeconds: 60,
        entries: [
          { progression: "Handstand Progression" },
        ],
      },
    ],
  },

  // ── PHASE 2 — Trained Beginner ─────────────────────────────────────────
  // 4 days/week: Push / Pull / Lower+Core / Full-Body(skill).
  // Levels 5–6. Introduces statics, rings, lever lead-ins, L-sit, MU prep.
  // Limit 2–3 concurrent skill goals.

  // Phase 2 Day A — Push
  {
    name: "Phase 2 — Push",
    restBetweenBlocksSeconds: 120,
    blocks: [
      // Planche skill (tuck/adv-tuck): P5
      {
        type: "set",
        rounds: 4,
        restSeconds: 120,
        entries: [
          { progression: "Planche Progression" },
        ],
      },
      // HSPU press: P7
      {
        type: "set",
        rounds: 3,
        restSeconds: 120,
        entries: [
          { progression: "Handstand Push-Up Progression", targetReps: 5 },
        ],
      },
      // Push-up ladder: P1
      {
        type: "set",
        rounds: 3,
        restSeconds: 90,
        entries: [
          { progression: "Push-Up Progression", targetReps: 8 },
        ],
      },
      // Dip: P3
      {
        type: "set",
        rounds: 3,
        restSeconds: 90,
        entries: [
          { progression: "Dip Progression", targetReps: 8 },
        ],
      },
      // Rings dip entry: P4
      {
        type: "set",
        rounds: 3,
        restSeconds: 90,
        entries: [
          { progression: "Rings Dip & Maltese Progression" },
        ],
      },
      // Straight-arm press entry: P8
      {
        type: "set",
        rounds: 3,
        restSeconds: 120,
        entries: [
          { progression: "Straight-Arm Press to Handstand", targetReps: 5 },
        ],
      },
      // Handstand skill: P23
      {
        type: "set",
        rounds: 4,
        restSeconds: 60,
        entries: [
          { progression: "Handstand Progression" },
        ],
      },
    ],
  },

  // Phase 2 Day B — Pull
  {
    name: "Phase 2 — Pull",
    restBetweenBlocksSeconds: 120,
    blocks: [
      // Back Lever (German hang gated): P13
      {
        type: "set",
        rounds: 4,
        restSeconds: 120,
        entries: [
          { progression: "Back Lever Progression" },
        ],
      },
      // Front Lever tuck entry: P14
      {
        type: "set",
        rounds: 3,
        restSeconds: 120,
        entries: [
          { progression: "Front Lever Progression" },
        ],
      },
      // Pull-up ladder: P9
      {
        type: "set",
        rounds: 3,
        restSeconds: 120,
        entries: [
          { progression: "Pull-Up Progression", targetReps: 5 },
        ],
      },
      // Weighted pull-up entry: P10
      {
        type: "set",
        rounds: 3,
        restSeconds: 120,
        entries: [
          { progression: "Weighted Pull-Up Progression", targetReps: 5 },
        ],
      },
      // Rowing: P12
      {
        type: "set",
        rounds: 3,
        restSeconds: 90,
        entries: [
          { progression: "Rowing Progression", targetReps: 8 },
        ],
      },
      // Muscle-up lead-in (false grip / negatives): P16
      {
        type: "set",
        rounds: 3,
        restSeconds: 120,
        entries: [
          { progression: "Muscle-Up Progression" },
        ],
      },
    ],
  },

  // Phase 2 Day C — Lower + Core
  {
    name: "Phase 2 — Lower & Core",
    restBetweenBlocksSeconds: 90,
    blocks: [
      // Squat/Pistol: P18
      {
        type: "set",
        rounds: 3,
        restSeconds: 90,
        entries: [
          { progression: "Squat Progression", targetReps: 8 },
        ],
      },
      // Nordic (legs day — NOT pull day per project rule): P19
      {
        type: "set",
        rounds: 3,
        restSeconds: 90,
        entries: [
          { progression: "Hip Hinge & Nordic Progression", targetReps: 8 },
        ],
      },
      // L-Sit / V-Sit chain: P22
      {
        type: "set",
        rounds: 4,
        restSeconds: 60,
        entries: [
          { progression: "L-Sit Progression" },
        ],
      },
      // Core anti-extension: P20
      {
        type: "set",
        rounds: 3,
        restSeconds: 60,
        entries: [
          { progression: "Core Anti-Extension Progression" },
        ],
      },
      // Core flexion / leg raise: P21
      {
        type: "set",
        rounds: 3,
        restSeconds: 60,
        entries: [
          { progression: "Leg Raise Progression", targetReps: 8 },
        ],
      },
    ],
  },

  // Phase 2 Day D — Full Body / Skill
  {
    name: "Phase 2 — Full Body Skill",
    restBetweenBlocksSeconds: 90,
    blocks: [
      // Planche (second weekly exposure): P5
      {
        type: "set",
        rounds: 3,
        restSeconds: 120,
        entries: [
          { progression: "Planche Progression" },
        ],
      },
      // Front lever (second exposure): P14
      {
        type: "set",
        rounds: 3,
        restSeconds: 120,
        entries: [
          { progression: "Front Lever Progression" },
        ],
      },
      // Push: P1
      {
        type: "set",
        rounds: 3,
        restSeconds: 90,
        entries: [
          { progression: "Push-Up Progression", targetReps: 8 },
        ],
      },
      // Pull: P9
      {
        type: "set",
        rounds: 3,
        restSeconds: 90,
        entries: [
          { progression: "Pull-Up Progression", targetReps: 5 },
        ],
      },
      // L-Sit: P22 (second exposure)
      {
        type: "set",
        rounds: 3,
        restSeconds: 60,
        entries: [
          { progression: "L-Sit Progression" },
        ],
      },
      // Squat: P18
      {
        type: "set",
        rounds: 3,
        restSeconds: 90,
        entries: [
          { progression: "Squat Progression", targetReps: 8 },
        ],
      },
    ],
  },

  // ── PHASE 3 — Intermediate ─────────────────────────────────────────────
  // 4–5 days/week. Straight-arm / lever split + bent-arm / press split.
  // Levels 7–9. Paired: Planche ↔ Front Lever; OAC prep 1–2×/wk.

  // Phase 3 Day A — Straight-Arm / Lever Push
  {
    name: "Phase 3 — Straight Arm Push",
    restBetweenBlocksSeconds: 120,
    blocks: [
      // Planche (adv-tuck → straddle): P5
      {
        type: "set",
        rounds: 5,
        restSeconds: 120,
        entries: [
          { progression: "Planche Progression" },
        ],
      },
      // Planche push-up accessory: P6
      {
        type: "set",
        rounds: 3,
        restSeconds: 120,
        entries: [
          { progression: "Planche Push-Up Progression", targetReps: 5 },
        ],
      },
      // HSPU (freestanding track): P7
      {
        type: "set",
        rounds: 3,
        restSeconds: 120,
        entries: [
          { progression: "Handstand Push-Up Progression", targetReps: 5 },
        ],
      },
      // Straight-arm press to HS: P8
      {
        type: "set",
        rounds: 3,
        restSeconds: 120,
        entries: [
          { progression: "Straight-Arm Press to Handstand", targetReps: 5 },
        ],
      },
      // One-arm push-up track: P2
      {
        type: "set",
        rounds: 3,
        restSeconds: 90,
        entries: [
          { progression: "One-Arm Push-Up Progression", targetReps: 5, perSide: true },
        ],
      },
      // Handstand skill: P23
      {
        type: "set",
        rounds: 4,
        restSeconds: 60,
        entries: [
          { progression: "Handstand Progression" },
        ],
      },
    ],
  },

  // Phase 3 Day B — Straight-Arm / Lever Pull
  {
    name: "Phase 3 — Straight Arm Pull",
    restBetweenBlocksSeconds: 120,
    blocks: [
      // Front Lever (straddle → full paired with planche): P14
      {
        type: "set",
        rounds: 5,
        restSeconds: 120,
        entries: [
          { progression: "Front Lever Progression" },
        ],
      },
      // Front Lever Rows: P15
      {
        type: "set",
        rounds: 4,
        restSeconds: 120,
        entries: [
          { progression: "Front Lever Row Progression", targetReps: 6 },
        ],
      },
      // Back lever maintenance: P13
      {
        type: "set",
        rounds: 3,
        restSeconds: 120,
        entries: [
          { progression: "Back Lever Progression" },
        ],
      },
      // OAC eccentrics (1–2×/wk, assisted only): P11
      {
        type: "set",
        rounds: 3,
        restSeconds: 120,
        entries: [
          { progression: "Ring Pull-Up & OAC Progression" },
        ],
      },
      // Weighted pull-up: P10
      {
        type: "set",
        rounds: 3,
        restSeconds: 120,
        entries: [
          { progression: "Weighted Pull-Up Progression", targetReps: 5 },
        ],
      },
    ],
  },

  // Phase 3 Day C — Bent-Arm Push + Core
  {
    name: "Phase 3 — Bent Arm Push",
    restBetweenBlocksSeconds: 120,
    blocks: [
      // Push-up ladder (upper volume): P1
      {
        type: "set",
        rounds: 4,
        restSeconds: 90,
        entries: [
          { progression: "Push-Up Progression", targetReps: 6 },
        ],
      },
      // Rings dip ladder: P4
      {
        type: "set",
        rounds: 4,
        restSeconds: 90,
        entries: [
          { progression: "Rings Dip & Maltese Progression" },
        ],
      },
      // Dip: P3
      {
        type: "set",
        rounds: 3,
        restSeconds: 90,
        entries: [
          { progression: "Dip Progression", targetReps: 8 },
        ],
      },
      // Elbow lever: P-EL
      {
        type: "set",
        rounds: 3,
        restSeconds: 90,
        entries: [
          { progression: "Elbow Lever Progression" },
        ],
      },
      // L-Sit / V-Sit: P22
      {
        type: "set",
        rounds: 4,
        restSeconds: 60,
        entries: [
          { progression: "L-Sit Progression" },
        ],
      },
      // Core anti-extension: P20
      {
        type: "set",
        rounds: 3,
        restSeconds: 60,
        entries: [
          { progression: "Core Anti-Extension Progression" },
        ],
      },
    ],
  },

  // Phase 3 Day D — Bent-Arm Pull + Lower
  {
    name: "Phase 3 — Bent Arm Pull & Lower",
    restBetweenBlocksSeconds: 90,
    blocks: [
      // Pull-up: P9
      {
        type: "set",
        rounds: 4,
        restSeconds: 120,
        entries: [
          { progression: "Pull-Up Progression", targetReps: 5 },
        ],
      },
      // Muscle-up: P16
      {
        type: "set",
        rounds: 3,
        restSeconds: 120,
        entries: [
          { progression: "Muscle-Up Progression", targetReps: 3 },
        ],
      },
      // Rowing: P12
      {
        type: "set",
        rounds: 3,
        restSeconds: 90,
        entries: [
          { progression: "Rowing Progression", targetReps: 6 },
        ],
      },
      // Human flag: P-HF
      {
        type: "set",
        rounds: 3,
        restSeconds: 90,
        entries: [
          { progression: "Human Flag Progression" },
        ],
      },
      // Weighted pistol: P18
      {
        type: "set",
        rounds: 3,
        restSeconds: 90,
        entries: [
          { progression: "Squat Progression", targetReps: 5, perSide: true },
        ],
      },
      // Nordic (legs day): P19
      {
        type: "set",
        rounds: 3,
        restSeconds: 90,
        entries: [
          { progression: "Hip Hinge & Nordic Progression", targetReps: 8 },
        ],
      },
      // Core flexion: P21
      {
        type: "set",
        rounds: 3,
        restSeconds: 60,
        entries: [
          { progression: "Leg Raise Progression", targetReps: 6 },
        ],
      },
    ],
  },

  // ── PHASE 4 — Advanced / Elite SAC ────────────────────────────────────
  // 4–5 days/week. DUP / push-pull heavy-light. Levels 10+.
  // Focus: one push goal OR one pull goal at a time. IC, Maltese, Manna.

  // Phase 4 Day A — Heavy Push (Planche / Maltese track)
  {
    name: "Phase 4 — Heavy Push",
    restBetweenBlocksSeconds: 180,
    blocks: [
      // Planche at working max: P5 — maintained or advancing to full
      {
        type: "set",
        rounds: 5,
        restSeconds: 180,
        entries: [
          { progression: "Planche Progression" },
        ],
      },
      // Planche push-up accessory: P6
      {
        type: "set",
        rounds: 4,
        restSeconds: 180,
        entries: [
          { progression: "Planche Push-Up Progression", targetReps: 3 },
        ],
      },
      // One-arm push-up: P2
      {
        type: "set",
        rounds: 3,
        restSeconds: 150,
        entries: [
          { progression: "One-Arm Push-Up Progression", targetReps: 5, perSide: true },
        ],
      },
      // Maltese progression (full-planche gated): P4
      {
        type: "set",
        rounds: 4,
        restSeconds: 180,
        entries: [
          { progression: "Rings Dip & Maltese Progression" },
        ],
      },
      // Straight-arm press: P8
      {
        type: "set",
        rounds: 3,
        restSeconds: 120,
        entries: [
          { progression: "Straight-Arm Press to Handstand", targetReps: 3 },
        ],
      },
    ],
  },

  // Phase 4 Day B — Heavy Pull (Iron Cross / OAC track)
  {
    name: "Phase 4 — Heavy Pull",
    restBetweenBlocksSeconds: 180,
    blocks: [
      // Iron Cross (assisted → block pullouts → weighted): P17
      {
        type: "set",
        rounds: 5,
        restSeconds: 180,
        entries: [
          { progression: "Iron Cross Progression" },
        ],
      },
      // OAC / Ring pull-up track: P11
      {
        type: "set",
        rounds: 4,
        restSeconds: 180,
        entries: [
          { progression: "Ring Pull-Up & OAC Progression", targetReps: 3, perSide: true },
        ],
      },
      // Weighted pull-up at high %BW: P10
      {
        type: "set",
        rounds: 3,
        restSeconds: 180,
        entries: [
          { progression: "Weighted Pull-Up Progression", targetReps: 3 },
        ],
      },
      // Front Lever rows at full intensity: P15
      {
        type: "set",
        rounds: 4,
        restSeconds: 150,
        entries: [
          { progression: "Front Lever Row Progression", targetReps: 5 },
        ],
      },
      // Front lever maintenance: P14
      {
        type: "set",
        rounds: 3,
        restSeconds: 120,
        entries: [
          { progression: "Front Lever Progression" },
        ],
      },
    ],
  },

  // Phase 4 Day C — Light Push + Manna / Skill
  {
    name: "Phase 4 — Light Push & Skill",
    restBetweenBlocksSeconds: 120,
    blocks: [
      // Manna / V-Sit / compression: P22 (flexibility-gated)
      {
        type: "set",
        rounds: 5,
        restSeconds: 90,
        entries: [
          { progression: "L-Sit Progression" },
        ],
      },
      // Planche at 5–8 rep range (light-day DUP): P5
      {
        type: "set",
        rounds: 4,
        restSeconds: 120,
        entries: [
          { progression: "Planche Progression" },
        ],
      },
      // FSPU or freestanding HS (maintained): P7
      {
        type: "set",
        rounds: 3,
        restSeconds: 120,
        entries: [
          { progression: "Handstand Push-Up Progression", targetReps: 3 },
        ],
      },
      // Handstand skill: P23
      {
        type: "set",
        rounds: 4,
        restSeconds: 60,
        entries: [
          { progression: "Handstand Progression" },
        ],
      },
      // Core anti-extension: P20
      {
        type: "set",
        rounds: 3,
        restSeconds: 60,
        entries: [
          { progression: "Core Anti-Extension Progression" },
        ],
      },
    ],
  },

  // Phase 4 Day D — Light Pull + Lower
  {
    name: "Phase 4 — Light Pull & Lower",
    restBetweenBlocksSeconds: 120,
    blocks: [
      // Back lever maintenance + IC lead-in: P13
      {
        type: "set",
        rounds: 4,
        restSeconds: 120,
        entries: [
          { progression: "Back Lever Progression" },
        ],
      },
      // Muscle-up (L-sit MU / volume): P16
      {
        type: "set",
        rounds: 3,
        restSeconds: 120,
        entries: [
          { progression: "Muscle-Up Progression", targetReps: 3 },
        ],
      },
      // Pull-up volume: P9
      {
        type: "set",
        rounds: 3,
        restSeconds: 120,
        entries: [
          { progression: "Pull-Up Progression", targetReps: 5 },
        ],
      },
      // Weighted pistol (toward 1.5–2× BW): P18
      {
        type: "set",
        rounds: 3,
        restSeconds: 90,
        entries: [
          { progression: "Squat Progression", targetReps: 5, perSide: true },
        ],
      },
      // Nordic (legs day, not pull day): P19
      {
        type: "set",
        rounds: 3,
        restSeconds: 90,
        entries: [
          { progression: "Hip Hinge & Nordic Progression", targetReps: 8 },
        ],
      },
      // Core flexion: P21
      {
        type: "set",
        rounds: 3,
        restSeconds: 60,
        entries: [
          { progression: "Leg Raise Progression", targetReps: 5 },
        ],
      },
    ],
  },
];
