// RETIRED SEED CONTENT — the delete half of the seed sync.
//
// The seed is otherwise insert-and-update only: it has no way to express
// "this used to exist and should now be gone". Removing an entry from
// SEED_WORKOUTS / SEED_PROGRAMS therefore does NOT remove it from a device
// that already ran an older seed — the row just becomes an orphan nobody
// manages. Listing the name here is what actually deletes it (see
// pruneRetiredSeedContent in src/db/seed.ts).
//
// ── Rules ──────────────────────────────────────────────────────────────────
// 1. A name listed here MUST NOT also appear as a current seed entry's `name`
//    or in its `previousNames`. The pruner asserts this and skips conflicts, so
//    a mistake can't delete live content, but keep the lists disjoint anyway.
// 2. Include the entry's old `previousNames` alongside its final name — devices
//    that never ran the rename migration still hold the old name.
// 3. Only rows carrying a `seedFingerprint` are deleted, so anything the user
//    created by hand is never touched.
// 4. Never remove a name from these lists. Doing so lets the row come back on
//    a device that hasn't synced since.
//
// ── Retired 2026-07-26 ─────────────────────────────────────────────────────
// The whole pre-adaptive library. "Adaptive — 5 Day" replaces it by design: its
// slots track the athlete's unlocked level, so the fixed Phase 1–4 ladders and
// the hand-tuned 7-day week no longer have a job. Isa's program went with them
// (she is no longer training from the app) — this prune removes it from her
// device too. Logged history is unaffected: WorkoutLog stores the workout name
// and SetLog stores movement name + progression id, so past sessions still
// render with these rows gone.

/** Workout names to delete on sync. Includes former names of retired workouts. */
export const RETIRED_WORKOUT_NAMES: string[] = [
  // ── Original 7-day week (superseded by Adaptive — 5 Day) ──
  "Push + Planche Skill",
  "Pull A (Heavy)",
  "Legs + Core",
  "Core + Compression", // previousName of "Legs + Core"
  "Chest (Planche)",
  "Pull B (Volume)",
  "Pull + Volume Building", // previousName of "Pull B (Volume)"
  "Mobility & Recovery",
  // ── Deload variants of the same week ──
  "Push + Planche Skill (Deload)",
  "Pull A (Skill Only)",
  "Legs + Core (Deload)",
  "Pull B (Deload)",
  // ── Isa's days ──
  "Isa Pull A (Strength)",
  "Isa Balance Day",
  "Isa Pull B (Volume)",
  // ── ATLAS phase ladders (the adaptive slots do this adaptively now) ──
  "Phase 1 — Full Body",
  "Phase 2 — Push",
  "Phase 2 — Pull",
  "Phase 2 — Lower & Core",
  "Phase 2 — Full Body Skill",
  "Phase 3 — Straight Arm Push",
  "Phase 3 — Straight Arm Pull",
  "Phase 3 — Bent Arm Push",
  "Phase 3 — Bent Arm Pull & Lower",
  "Phase 4 — Heavy Push",
  "Phase 4 — Heavy Pull",
  "Phase 4 — Light Push & Skill",
  "Phase 4 — Light Pull & Lower",
];

/** Program names to delete on sync. Includes former names of retired programs. */
export const RETIRED_PROGRAM_NAMES: string[] = [
  "Ivan workout",
  "Personal Calisthenics", // previousName of "Ivan workout"
  "Isa pull-up workout",
  "Phase 1 — Untrained Beginner",
  "Phase 2 — Trained Beginner",
  "Phase 3 — Intermediate",
  "Phase 4 — Advanced",
];
