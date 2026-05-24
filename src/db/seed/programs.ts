import type { SeedProgram } from "./types";

// v2 (2026-05-24): Mobility & Recovery removed from the calendar — mobility is
// now a daily ritual + skill-snack day on Sat. Mobility & Recovery survives
// as an opt-in workout for travel days. Test Day is also opt-in, run manually
// every 6 weeks per workout-improvements v2.
export const SEED_PROGRAMS: SeedProgram[] = [
  {
    name: "Personal Calisthenics",
    totalCycles: 0,
    days: [
      { workout: "Push + Planche Skill" }, // Mon
      { workout: "Pull A (Heavy)" }, // Tue
      { workout: "Legs + Core" }, // Wed
      { workout: "Chest (Planche)" }, // Thu
      { workout: "Pull B (Volume)" }, // Fri
      null, // Sat — skill snacks + weigh-in (handled outside the program)
      null, // Sun — rest
    ],
  },
];
