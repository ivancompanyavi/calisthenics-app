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

// ── Phase routine week templates ──────────────────────────────────────────
// Phase 1: 3 days/week full body (M/W/F). 48 h min spacing, 72 h after 3rd.
const phase1Week: SeedProgram["days"] = [
  { workout: "Phase 1 — Full Body" }, // Mon
  null,                                 // Tue rest
  { workout: "Phase 1 — Full Body" }, // Wed
  null,                                 // Thu rest
  { workout: "Phase 1 — Full Body" }, // Fri
  null,                                 // Sat rest
  null,                                 // Sun rest
];

// Phase 2: 4 days/week Push / Pull / Lower+Core / Full-Body-Skill.
// Mon push, Tue pull, Thu lower+core, Sat full-body.
const phase2Week: SeedProgram["days"] = [
  { workout: "Phase 2 — Push" },             // Mon
  { workout: "Phase 2 — Pull" },             // Tue
  null,                                       // Wed rest
  { workout: "Phase 2 — Lower & Core" },    // Thu
  null,                                       // Fri rest
  { workout: "Phase 2 — Full Body Skill" }, // Sat
  null,                                       // Sun rest
];

// Phase 3: 4 days/week straight-arm/lever + bent-arm/press split.
// Mon straight-arm push, Tue straight-arm pull, Thu bent-arm push+core,
// Sat bent-arm pull+lower.
const phase3Week: SeedProgram["days"] = [
  { workout: "Phase 3 — Straight Arm Push" },     // Mon
  { workout: "Phase 3 — Straight Arm Pull" },     // Tue
  null,                                             // Wed rest
  { workout: "Phase 3 — Bent Arm Push" },         // Thu
  null,                                             // Fri rest
  { workout: "Phase 3 — Bent Arm Pull & Lower" }, // Sat
  null,                                             // Sun rest
];

// Phase 4: 4 days/week DUP heavy/light push-pull.
// Mon heavy push, Tue heavy pull, Thu light push+skill, Sat light pull+lower.
const phase4Week: SeedProgram["days"] = [
  { workout: "Phase 4 — Heavy Push" },      // Mon
  { workout: "Phase 4 — Heavy Pull" },      // Tue
  null,                                      // Wed rest
  { workout: "Phase 4 — Light Push & Skill" }, // Thu
  null,                                      // Fri rest
  { workout: "Phase 4 — Light Pull & Lower" }, // Sat
  null,                                      // Sun rest
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

  // ── ATLAS Phase Routines ───────────────────────────────────────────────────
  // 4 OG2-tier programs. Repeating single-week cycles. Athlete transitions
  // between phases on progression-method exhaustion, not calendar. All
  // progression slots auto-evolve with currentLevel.

  {
    name: "Phase 1 — Untrained Beginner",
    description: "3 days/week full-body. Deload every 4–8 weeks: one easier week at reduced volume.",
    totalCycles: 0,
    days: phase1Week,
  },
  {
    name: "Phase 2 — Trained Beginner",
    description: "4 days/week push/pull/lower/skill split. Deload every 4–8 weeks: one easier week at reduced volume.",
    totalCycles: 0,
    days: phase2Week,
  },
  {
    name: "Phase 3 — Intermediate",
    description: "4 days/week straight-arm/bent-arm split. Deload every 4–8 weeks: one easier week at reduced volume.",
    totalCycles: 0,
    days: phase3Week,
  },
  {
    name: "Phase 4 — Advanced",
    description: "4–5 days/week DUP heavy/light push-pull. Deload every 4–8 weeks: one easier week at reduced volume.",
    totalCycles: 0,
    days: phase4Week,
  },
];
