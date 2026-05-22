import type { SeedProgression } from "./types";

export const SEED_PROGRESSIONS: SeedProgression[] = [
  {
    name: "Push-Up Progression",
    levels: [
      { movement: "Wall Push-Ups", mode: "reps", defaultTargetReps: 15 },
      { movement: "Incline Push-Ups", mode: "reps", defaultTargetReps: 12 },
      { movement: "Knee Push-Ups", mode: "reps", defaultTargetReps: 12 },
      { movement: "Push-Ups", mode: "reps", defaultTargetReps: 10 },
      { movement: "Diamond Push-Ups", mode: "reps", defaultTargetReps: 10 },
      {
        movement: "Archer Push-Ups",
        mode: "reps",
        defaultTargetReps: 8,
        perSide: true,
      },
      // Bridge between archer and floor PPU. Reduces shoulder load via
      // elevation; progress by lowering the surface (chair → bench → low
      // paralettes → floor).
      {
        movement: "Incline Pseudo Planche Push-Ups",
        mode: "reps",
        defaultTargetReps: 6,
      },
      {
        movement: "Pseudo Planche Push-Ups",
        mode: "reps",
        defaultTargetReps: 8,
      },
      {
        movement: "One Arm Push-Ups",
        mode: "reps",
        defaultTargetReps: 5,
        perSide: true,
      },
    ],
  },
  {
    name: "Pull-Up Progression",
    levels: [
      { movement: "Dead Hang", mode: "time", defaultTargetSeconds: 30 },
      { movement: "Scapular Pulls", mode: "reps", defaultTargetReps: 10 },
      { movement: "Inverted Rows", mode: "reps", defaultTargetReps: 12 },
      { movement: "Negative Pull-Ups", mode: "reps", defaultTargetReps: 8 },
      {
        movement: "Band-Assisted Pull-Ups",
        mode: "reps",
        defaultTargetReps: 8,
      },
      { movement: "Pull-Ups", mode: "reps", defaultTargetReps: 8 },
      { movement: "L-Sit Pull-Ups", mode: "reps", defaultTargetReps: 6 },
      {
        movement: "Archer Pull-Ups",
        mode: "reps",
        defaultTargetReps: 5,
        perSide: true,
      },
    ],
  },
  {
    name: "Dip Progression",
    levels: [
      {
        movement: "Parallel Bar Support Hold",
        mode: "time",
        defaultTargetSeconds: 30,
      },
      { movement: "Negative Dips", mode: "reps", defaultTargetReps: 8 },
      { movement: "Band-Assisted Dips", mode: "reps", defaultTargetReps: 10 },
      { movement: "Dips", mode: "reps", defaultTargetReps: 10 },
      { movement: "Ring Dips", mode: "reps", defaultTargetReps: 8 },
      { movement: "Weighted Dips", mode: "reps", defaultTargetReps: 8 },
    ],
  },
  {
    name: "Handstand Push-Up Progression",
    levels: [
      { movement: "Pike Push-Ups", mode: "reps", defaultTargetReps: 12 },
      {
        movement: "Elevated Pike Push-Ups",
        mode: "reps",
        defaultTargetReps: 10,
      },
      {
        movement: "Wall Handstand Hold",
        mode: "time",
        defaultTargetSeconds: 30,
      },
      {
        movement: "Wall Handstand Push-Ups",
        mode: "reps",
        defaultTargetReps: 8,
      },
      {
        movement: "Freestanding Handstand Push-Ups",
        mode: "reps",
        defaultTargetReps: 5,
      },
    ],
  },
  {
    name: "L-Sit Progression",
    levels: [
      { movement: "Tucked L-Sit", mode: "time", defaultTargetSeconds: 20 },
      { movement: "One Leg L-Sit", mode: "time", defaultTargetSeconds: 15 },
      { movement: "L-Sit", mode: "time", defaultTargetSeconds: 15 },
    ],
  },
  {
    name: "Squat Progression",
    levels: [
      { movement: "Assisted Squats", mode: "reps", defaultTargetReps: 15 },
      { movement: "Bodyweight Squats", mode: "reps", defaultTargetReps: 15 },
      {
        movement: "Bulgarian Split Squats",
        mode: "reps",
        defaultTargetReps: 10,
        perSide: true,
      },
      {
        movement: "Shrimp Squats",
        mode: "reps",
        defaultTargetReps: 8,
        perSide: true,
      },
      {
        movement: "Pistol Squats",
        mode: "reps",
        defaultTargetReps: 5,
        perSide: true,
      },
    ],
  },
  {
    name: "Leg Raise Progression",
    levels: [
      { movement: "Knee Raises", mode: "reps", defaultTargetReps: 12 },
      { movement: "Leg Raises", mode: "reps", defaultTargetReps: 10 },
      { movement: "Toes to Bar", mode: "reps", defaultTargetReps: 8 },
      { movement: "Windshield Wipers", mode: "reps", defaultTargetReps: 6 },
    ],
  },
  {
    name: "Planche Progression",
    levels: [
      {
        movement: "Pseudo Planche Push-Ups",
        mode: "reps",
        defaultTargetReps: 10,
      },
      // Frog stand is the canonical prerequisite for tuck planche — trains
      // scap protraction + hand balance + forward weight shift simultaneously.
      // Benchmark: 30-45s clean hold before attempting tuck planche.
      { movement: "Frog Stand", mode: "max" },
      // Bridge from frog stand to a full tuck hold: brief tuck planche entry,
      // controlled lower. The eccentric is where the strength gets built.
      { movement: "Tuck Planche Negatives", mode: "reps", defaultTargetReps: 3 },
      { movement: "Tuck Planche", mode: "max" },
      { movement: "Advanced Tuck Planche", mode: "max" },
      { movement: "Straddle Planche", mode: "max" },
      { movement: "Full Planche", mode: "max" },
    ],
  },
  {
    name: "Front Lever Progression",
    levels: [
      { movement: "Active Hang", mode: "time", defaultTargetSeconds: 30 },
      { movement: "Skin the Cat", mode: "reps", defaultTargetReps: 8 },
      { movement: "Front Lever Tuck Hold", mode: "max" },
      { movement: "Front Lever", mode: "max" },
    ],
  },
];
