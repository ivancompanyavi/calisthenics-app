import type { SeedWorkout } from "./types";

export const SEED_WORKOUTS: SeedWorkout[] = [
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
      {
        type: "superset",
        rounds: 3,
        restSeconds: 120,
        entries: [
          { progression: "Planche Progression" },
          { movement: "Planche Leans", mode: "reps", targetReps: 10 },
          { movement: "Planche Lean Hold", mode: "max" },
        ],
      },
      {
        type: "superset",
        rounds: 3,
        restSeconds: 75,
        entries: [
          { movement: "Pseudo Push-Up Hold", mode: "time", targetSeconds: 15 },
          // Push-Up Progression at current level (Archer Push-Ups for Ivan)
          // covers the asymmetric/strength side of pushing.
          { progression: "Push-Up Progression", targetReps: 8 },
          // Wide push-ups for pec stretch + chest-day theme. Distinct fiber
          // loading from archer's narrow asymmetric base.
          { movement: "Wide Push-Ups", mode: "reps", targetReps: 12 },
          // Tempo work: ~30s per rep (see coaching cues on the movement).
          { movement: "Slow Motion Push-Ups", mode: "time", targetSeconds: 30 },
        ],
      },
    ],
  },
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
      {
        type: "set",
        rounds: 4,
        restSeconds: 120,
        entries: [
          {
            movement: "Planche Lean Hold",
            mode: "time",
            targetSeconds: 20,
          },
        ],
      },
      {
        type: "set",
        rounds: 3,
        restSeconds: 120,
        entries: [
          {
            movement: "Pseudo Planche Push-Ups",
            mode: "reps",
            targetReps: 4,
          },
        ],
      },
      {
        type: "set",
        rounds: 3,
        restSeconds: 90,
        entries: [{ progression: "Dip Progression", targetReps: 7 }],
      },
      {
        type: "set",
        rounds: 3,
        restSeconds: 90,
        entries: [{ movement: "Pike Push-Ups", mode: "reps", targetReps: 8 }],
      },
      {
        type: "set",
        rounds: 3,
        restSeconds: 90,
        entries: [
          { progression: "Push-Up Progression", targetReps: 6 },
        ],
      },
    ],
  },
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
        entries: [{ movement: "Scapular Pulls", mode: "reps", targetReps: 10 }],
      },
      {
        type: "set",
        rounds: 4,
        restSeconds: 120,
        entries: [
          { progression: "Front Lever Progression" },
        ],
      },
      {
        type: "set",
        rounds: 5,
        restSeconds: 180,
        entries: [{ progression: "Pull-Up Progression", targetReps: 2 }],
      },
      {
        type: "set",
        rounds: 3,
        restSeconds: 90,
        entries: [
          { movement: "Inverted Rows", mode: "reps", targetReps: 10 },
        ],
      },
    ],
  },
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
        entries: [{ movement: "Scapular Pulls", mode: "reps", targetReps: 10 }],
      },
      {
        type: "set",
        rounds: 4,
        restSeconds: 120,
        entries: [
          { progression: "Front Lever Progression" },
        ],
      },
      {
        type: "set",
        rounds: 3,
        restSeconds: 150,
        entries: [{ progression: "Pull-Up Progression", targetReps: 3 }],
      },
      {
        type: "set",
        rounds: 4,
        restSeconds: 120,
        entries: [
          { movement: "Negative Pull-Ups", mode: "reps", targetReps: 3 },
        ],
      },
      {
        type: "set",
        rounds: 3,
        restSeconds: 90,
        entries: [
          {
            movement: "Inverted Rows",
            mode: "reps",
            targetReps: 12,
          },
        ],
      },
      {
        type: "set",
        rounds: 2,
        restSeconds: 90,
        entries: [{ movement: "Chin-Up Hold", mode: "max" }],
      },
    ],
  },
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
          { progression: "Squat Progression" },
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
          },
        ],
      },
      {
        type: "set",
        rounds: 3,
        restSeconds: 120,
        entries: [
          { movement: "Nordic Hamstring Curl", mode: "reps", targetReps: 5 },
        ],
      },
      {
        type: "set",
        rounds: 3,
        restSeconds: 45,
        entries: [
          {
            movement: "L-Sit Hang on Parallettes",
            mode: "time",
            targetSeconds: 10,
          },
        ],
      },
      {
        type: "set",
        rounds: 3,
        restSeconds: 45,
        entries: [
          {
            movement: "Hollow Body Hold",
            mode: "time",
            targetSeconds: 30,
          },
        ],
      },
      {
        type: "set",
        rounds: 3,
        restSeconds: 45,
        entries: [{ progression: "Leg Raise Progression", targetReps: 10 }],
      },
      {
        type: "set",
        rounds: 3,
        restSeconds: 45,
        entries: [
          { movement: "Pike Compression", mode: "reps", targetReps: 10 },
        ],
      },
      {
        type: "set",
        rounds: 2,
        restSeconds: 45,
        entries: [
          {
            movement: "Arch Body Hold",
            mode: "time",
            targetSeconds: 20,
          },
        ],
      },
    ],
  },
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
          {
            movement: "Band Pull-Aparts",
            mode: "reps",
            targetReps: 15,
          },
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
];
