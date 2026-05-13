import type { SeedWorkout } from "./types";

export const SEED_WORKOUTS: SeedWorkout[] = [
  {
    name: "Chest (Planche)",
    restBetweenBlocksSeconds: 120,
    blocks: [
      {
        type: "superset",
        rounds: 3,
        restSeconds: 60,
        entries: [
          { progression: "Planche Progression" },
          { movement: "Planche Leans", mode: "reps", targetReps: 10 },
          { movement: "Planche Lean Hold", mode: "max" },
        ],
      },
      {
        type: "superset",
        rounds: 3,
        restSeconds: 60,
        entries: [
          { movement: "Pseudo Push-Up Hold", mode: "time", targetSeconds: 15 },
          { progression: "Push-Up Progression", targetReps: 8 },
          {
            movement: "Knee Archer Push-Ups",
            mode: "reps",
            targetReps: 10,
            perSide: true,
          },
          { movement: "Slow Motion Push-Ups", mode: "reps", targetReps: 1 },
        ],
      },
    ],
  },
  {
    name: "Pull Day",
    restBetweenBlocksSeconds: 90,
    blocks: [
      {
        type: "set",
        rounds: 4,
        restSeconds: 90,
        entries: [{ progression: "Pull-Up Progression", targetSeconds: 30 }],
      },
      {
        type: "superset",
        rounds: 3,
        restSeconds: 60,
        entries: [
          { progression: "Front Lever Progression" },
          { progression: "Leg Raise Progression", targetReps: 12 },
        ],
      },
      {
        type: "set",
        rounds: 3,
        restSeconds: 60,
        entries: [{ progression: "L-Sit Progression" }],
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
        restSeconds: 60,
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
        restSeconds: 90,
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
        entries: [
          { movement: "Pike Push-Ups", mode: "reps", targetReps: 8 },
        ],
      },
      {
        type: "set",
        rounds: 3,
        restSeconds: 90,
        entries: [{ movement: "Dips", mode: "reps", targetReps: 7 }],
      },
      {
        type: "set",
        rounds: 2,
        restSeconds: 60,
        entries: [
          { movement: "Diamond Push-Ups", mode: "reps", targetReps: 12 },
        ],
      },
    ],
  },
  {
    name: "Pull + Volume Building",
    restBetweenBlocksSeconds: 90,
    blocks: [
      {
        type: "set",
        rounds: 3,
        restSeconds: 60,
        entries: [
          { movement: "Scapular Pulls", mode: "reps", targetReps: 10 },
        ],
      },
      {
        type: "set",
        rounds: 3,
        restSeconds: 60,
        entries: [
          { movement: "Dead Hang", mode: "time", targetSeconds: 40 },
        ],
      },
      {
        type: "set",
        rounds: 3,
        restSeconds: 90,
        entries: [{ movement: "Pull-Ups", mode: "reps", targetReps: 3 }],
      },
      {
        type: "set",
        rounds: 4,
        restSeconds: 90,
        entries: [
          { movement: "Negative Pull-Ups", mode: "reps", targetReps: 3 },
        ],
      },
      {
        type: "set",
        rounds: 3,
        restSeconds: 60,
        entries: [
          {
            movement: "Australian Pull-Ups",
            mode: "reps",
            targetReps: 12,
          },
        ],
      },
      {
        type: "set",
        rounds: 2,
        restSeconds: 60,
        entries: [{ movement: "Chin-Up Hold", mode: "max" }],
      },
    ],
  },
  {
    name: "Core + Compression",
    restBetweenBlocksSeconds: 60,
    blocks: [
      {
        type: "set",
        rounds: 4,
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
            movement: "Seated Single Leg Raise",
            mode: "reps",
            targetReps: 10,
            perSide: true,
          },
        ],
      },
      {
        type: "set",
        rounds: 4,
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
        restSeconds: 60,
        entries: [
          { movement: "Leg Raises", mode: "reps", targetReps: 10 },
        ],
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
        rounds: 3,
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
