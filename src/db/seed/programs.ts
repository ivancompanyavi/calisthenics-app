import type { SeedProgram } from "./types";

// 6-week macrocycle (42 days):
//   Weeks 1-5: 5 main workouts Mon-Fri + Sat/Sun rest (mobility is a daily
//              ritual, weigh-in on Sat — both handled outside the program).
//   Week 6:    Deload variants Mon/Wed/Fri + light skill Tue + Test Day Thu.
//
// After 42 days the cycle restarts. PRs from Week 6 Thu naturally bubble up
// via the existing PR algorithm — no test-day flag needed yet (deferred N6).

// Build one normal training week. Same pattern repeats weeks 1-5.
const normalWeek: SeedProgram["days"] = [
  { workout: "Push + Planche Skill" },
  { workout: "Pull A (Heavy)" },
  { workout: "Legs + Core" },
  { workout: "Chest (Planche)" },
  { workout: "Pull B (Volume)" },
  null,
  null,
];

const deloadWeek: SeedProgram["days"] = [
  { workout: "Push + Planche Skill (Deload)" },
  { workout: "Pull A (Skill Only)" },
  { workout: "Legs + Core (Deload)" },
  { workout: "Test Day (Week 6)" },
  { workout: "Pull B (Deload)" },
  null,
  null,
];

// Isa's first-pull-up program. Simple weekly cycle, repeats forever.
// Mon/Wed/Fri active, weekend rest. Tuned for early novice (~10–20s dead
// hang baseline). See workouts.ts for tuning notes.
const isaWeek: SeedProgram["days"] = [
  { workout: "Isa Pull A (Strength)" },
  null,
  { workout: "Isa Balance Day" },
  null,
  { workout: "Isa Pull B (Volume)" },
  null,
  null,
];

export const SEED_PROGRAMS: SeedProgram[] = [
  {
    name: "Ivan workout",
    previousNames: ["Personal Calisthenics"],
    totalCycles: 0,
    days: [
      ...normalWeek, // Week 1
      ...normalWeek, // Week 2
      ...normalWeek, // Week 3
      ...normalWeek, // Week 4
      ...normalWeek, // Week 5
      ...deloadWeek, // Week 6 (deload + test)
    ],
  },
  {
    name: "Isa pull-up workout",
    totalCycles: 0,
    days: isaWeek,
  },
];
