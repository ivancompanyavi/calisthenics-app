import type { SeedProgram } from "./types";

// ONE program, by design.
//
// This used to hold six: a hand-tuned 6-week macrocycle, Isa's first-pull-up
// program, and the four OG2 phase ladders (Phase 1 → 4). All are retired
// (src/db/seed/retired.ts) because the adaptive program makes them redundant:
// its slots name a movement PATTERN rather than an exercise, so difficulty
// tracks the athlete instead of the calendar. There is no "graduate to the next
// phase" step to schedule — the slots do it.
//
// If a second program is ever added, check it against the retired list first:
// reusing a retired name would have the pruner delete it on the next sync.

// Adaptive 5-day week (Mon–Fri, weekend rest). Every day is built from PATTERN
// slots that resolve to the athlete's hardest unlocked progression, so the
// week's shape stays fixed while the movements upgrade underneath it. A slot
// whose whole chain is locked degrades to the work that unlocks it rather than
// disappearing — see CONTEXT.md "Session Adaptation".
const adaptiveWeek: SeedProgram["days"] = [
  { workout: "Adaptive — Push" }, // Mon
  { workout: "Adaptive — Pull" }, // Tue
  { workout: "Adaptive — Legs & Core" }, // Wed
  { workout: "Adaptive — Skill & Push" }, // Thu
  { workout: "Adaptive — Pull & Core" }, // Fri
  null, // Sat rest
  null, // Sun rest
];

export const SEED_PROGRAMS: SeedProgram[] = [
  {
    name: "Adaptive — 5 Day",
    description:
      "One program that grows with you. Each slot auto-selects the hardest movement you've unlocked, so you never outgrow it and never get handed something you haven't earned — set your ladder levels, then just train. 5 days/week (Mon–Fri). Skill/lever slots appear as you unlock them.",
    totalCycles: 0,
    days: adaptiveWeek,
  },
];
