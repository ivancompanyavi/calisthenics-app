import type { SeedProgram } from "./types";

export const SEED_PROGRAMS: SeedProgram[] = [
  {
    name: "Calisthenics Fundamentals",
    totalCycles: 4,
    days: [
      { workout: "Chest (Planche)" },
      null,
      { workout: "Full Body A" },
      null,
      { workout: "Pull Day" },
      { workout: "Chest (Planche)" },
      null,
    ],
  },
  {
    name: "Personal Calisthenics",
    totalCycles: 0,
    days: [
      { workout: "Push + Planche Skill" },
      { workout: "Pull + Volume Building" },
      { workout: "Core + Compression" },
      { workout: "Push + Planche Skill" },
      { workout: "Pull + Volume Building" },
      { workout: "Mobility & Recovery" },
      null,
    ],
  },
];
