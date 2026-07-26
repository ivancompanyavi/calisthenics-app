import type { SeedProgression } from "./types";
import type { ExitCriteria } from "@/models/types";

// Exit-criteria factory helpers — per final-build-spec.md §2
const RepAdv = (minReps: number): ExitCriteria => ({
  sessions: 2,
  sets: 3,
  minReps,
  minRIR: 1,
});

const TimeAdv = (minHoldSeconds: number): ExitCriteria => ({
  sessions: 2,
  sets: 4,
  minHoldSeconds,
  minSIR: 2,
});

// Eccentric-bridge rung: 3 clusters × ≥7 s controlled negative
const EccAdv: ExitCriteria = {
  sessions: 2,
  sets: 3,
  minReps: 3,
  minHoldSeconds: 7,
};

export const SEED_PROGRESSIONS: SeedProgression[] = [
  // ── P1 — Push-Up (family: push) ──────────────────────────────────────────
  // Full beginner-to-rings ladder. Rungs 0–2 are true-beginner regressions so
  // an untrained user (Phase 1 / Isa) is never stranded at a full push-up.
  // Rings upper ladder (OG2 L3–8) follows at rungs 3–10.
  {
    name: "Push-Up Progression",
    levels: [
      // rung 0 — true beginner entry
      {
        movement: "Wall Push-Ups",
        mode: "reps",
        defaultTargetReps: 12,
        exitCriteria: RepAdv(12),
      },
      // rung 1
      {
        movement: "Incline Push-Ups",
        mode: "reps",
        defaultTargetReps: 10,
        exitCriteria: RepAdv(10),
      },
      // rung 2
      {
        movement: "Knee Push-Ups",
        mode: "reps",
        defaultTargetReps: 8,
        exitCriteria: RepAdv(8),
      },
      // rung 3 — first full push-up rung (was rung 0 before prepend)
      {
        movement: "Push-Ups",
        mode: "reps",
        defaultTargetReps: 15,
        exitCriteria: RepAdv(15),
      },
      {
        movement: "Diamond Push-Ups",
        mode: "reps",
        defaultTargetReps: 12,
        exitCriteria: RepAdv(12),
      },
      {
        movement: "Rings Wide Push-Up",
        mode: "reps",
        defaultTargetReps: 10,
        exitCriteria: RepAdv(10),
      },
      {
        movement: "Rings Push-Up",
        mode: "reps",
        defaultTargetReps: 10,
        exitCriteria: RepAdv(10),
      },
      {
        movement: "RTO Push-Up",
        mode: "reps",
        defaultTargetReps: 8,
        exitCriteria: RepAdv(8),
      },
      {
        movement: "RTO Archer Push-Up",
        mode: "reps",
        defaultTargetReps: 6,
        perSide: true,
        exitCriteria: RepAdv(6),
      },
      {
        movement: "RTO 40° Lean PPPU",
        mode: "reps",
        defaultTargetReps: 6,
        exitCriteria: RepAdv(6),
      },
      {
        movement: "RTO 60° Lean PPPU",
        mode: "reps",
        defaultTargetReps: 5,
        exitCriteria: RepAdv(5),
      },
    ],
  },

  // ── P2 — One-Arm Push-Up (family: push) ──────────────────────────────────
  {
    name: "One-Arm Push-Up Progression",
    // Chart-adjacent substitution rule: own the full push-up base before the
    // unilateral line (OG2 Ch.3 p.28). [CONVENTION]
    entryPrerequisites: [
      { kind: "progression-level", progression: "Push-Up Progression", levelOrder: 3 },
      { kind: "movement-pr", movement: "Push-Ups", minReps: 20 },
    ],
    levels: [
      {
        movement: "Hands-Elevated One-Arm Push-Up",
        mode: "reps",
        defaultTargetReps: 6,
        perSide: true,
        exitCriteria: RepAdv(6),
      },
      {
        movement: "Straddle One-Arm Push-Up",
        mode: "reps",
        defaultTargetReps: 5,
        perSide: true,
        exitCriteria: RepAdv(5),
      },
      {
        movement: "Rings Straddle One-Arm Push-Up",
        mode: "reps",
        defaultTargetReps: 5,
        perSide: true,
        exitCriteria: RepAdv(5),
      },
      {
        movement: "One Arm Push-Ups",
        mode: "reps",
        defaultTargetReps: 5,
        perSide: true,
        exitCriteria: RepAdv(5),
      },
      {
        movement: "Rings Straight-Body One-Arm Push-Up",
        mode: "reps",
        defaultTargetReps: 5,
        perSide: true,
        exitCriteria: RepAdv(5),
      },
    ],
  },

  // ── P3 — Dip (family: push) — floor/PB ───────────────────────────────────
  {
    name: "Dip Progression",
    levels: [
      {
        movement: "PB Jumping Dips",
        mode: "reps",
        defaultTargetReps: 10,
        exitCriteria: RepAdv(10),
      },
      {
        movement: "Negative Dips",
        mode: "reps",
        defaultTargetReps: 3,
        exitCriteria: EccAdv,
      },
      {
        movement: "Dips",
        mode: "reps",
        defaultTargetReps: 10,
        exitCriteria: RepAdv(10),
      },
      {
        movement: "L-Sit Dip",
        mode: "reps",
        defaultTargetReps: 8,
        exitCriteria: RepAdv(8),
      },
      {
        movement: "45° Forward-Lean Dip",
        mode: "reps",
        defaultTargetReps: 8,
        exitCriteria: RepAdv(8),
      },
      {
        movement: "One-Arm Dip (facing wall)",
        mode: "reps",
        defaultTargetReps: 5,
        perSide: true,
        exitCriteria: RepAdv(5),
      },
      {
        movement: "One-Arm Dip (parallel to wall)",
        mode: "reps",
        defaultTargetReps: 5,
        perSide: true,
        exitCriteria: RepAdv(5),
      },
    ],
  },

  // ── P4 — Rings Dip → Maltese (family: push) ──────────────────────────────
  {
    name: "Rings Dip & Maltese Progression",
    // Stable bar dips before unstable rings dips. [CONVENTION]
    entryPrerequisites: [
      { kind: "progression-level", progression: "Dip Progression", levelOrder: 2 },
    ],
    levels: [
      {
        movement: "Rings Support Hold",
        mode: "time",
        defaultTargetSeconds: 30,
        exitCriteria: TimeAdv(30),
      },
      {
        movement: "RTO Support Hold",
        mode: "time",
        defaultTargetSeconds: 60,
        exitCriteria: TimeAdv(60),
      },
      {
        movement: "Rings Dip Eccentric",
        mode: "reps",
        defaultTargetReps: 3,
        exitCriteria: EccAdv,
      },
      {
        movement: "Ring Dips",
        mode: "reps",
        defaultTargetReps: 8,
        exitCriteria: RepAdv(8),
      },
      {
        movement: "Rings L-Sit Dip",
        mode: "reps",
        defaultTargetReps: 6,
        exitCriteria: RepAdv(6),
      },
      {
        movement: "Rings Wide Dip",
        mode: "reps",
        defaultTargetReps: 6,
        exitCriteria: RepAdv(6),
      },
      {
        movement: "RTO 45° Past-Parallel Dip",
        mode: "reps",
        defaultTargetReps: 6,
        exitCriteria: RepAdv(6),
      },
      {
        movement: "RTO 75° Past-Parallel Dip",
        mode: "reps",
        defaultTargetReps: 6,
        exitCriteria: RepAdv(6),
      },
      {
        movement: "RTO 90° Past-Parallel Dip",
        mode: "reps",
        defaultTargetReps: 5,
        exitCriteria: RepAdv(5),
      },
      {
        movement: "Maltese Lean",
        mode: "time",
        defaultTargetSeconds: 12,
        exitCriteria: TimeAdv(12),
      },
      {
        movement: "Tuck Maltese",
        mode: "time",
        defaultTargetSeconds: 10,
        exitCriteria: TimeAdv(10),
      },
      {
        movement: "Straddle Maltese",
        mode: "time",
        defaultTargetSeconds: 8,
        exitCriteria: TimeAdv(8),
      },
      {
        movement: "Full Maltese",
        mode: "max",
        exitCriteria: TimeAdv(5),
      },
    ],
  },

  // ── P5 — Planche (family: push) ──────────────────────────────────────────
  {
    name: "Planche Progression",
    levels: [
      {
        movement: "Frog Stand",
        mode: "time",
        defaultTargetSeconds: 30,
        exitCriteria: TimeAdv(30),
      },
      {
        movement: "Straight-Arm Frog Stand",
        mode: "time",
        defaultTargetSeconds: 20,
        exitCriteria: TimeAdv(20),
      },
      {
        movement: "Tuck Planche",
        mode: "time",
        defaultTargetSeconds: 15,
        exitCriteria: TimeAdv(15),
      },
      {
        movement: "Advanced Tuck Planche",
        mode: "time",
        defaultTargetSeconds: 15,
        exitCriteria: TimeAdv(15),
      },
      {
        movement: "Straddle Planche",
        mode: "time",
        defaultTargetSeconds: 10,
        exitCriteria: TimeAdv(10),
      },
      {
        movement: "Half-Lay Planche",
        mode: "time",
        defaultTargetSeconds: 8,
        perSide: true,
        exitCriteria: TimeAdv(8),
      },
      {
        movement: "Full Planche",
        mode: "max",
        exitCriteria: TimeAdv(5),
      },
    ],
  },

  // ── P6 — Planche Push-Up (family: push) ──────────────────────────────────
  {
    name: "Planche Push-Up Progression",
    // Must own the static tuck-planche hold before pressing in it — the
    // push-up lags one level behind the isometric. [CONVENTION/SCIENCE]
    entryPrerequisites: [
      { kind: "progression-level", progression: "Planche Progression", levelOrder: 2 },
    ],
    levels: [
      {
        movement: "Tuck Planche Push-Up",
        mode: "reps",
        defaultTargetReps: 8,
        exitCriteria: RepAdv(8),
      },
      {
        movement: "Advanced Tuck Planche Push-Up",
        mode: "reps",
        defaultTargetReps: 6,
        exitCriteria: RepAdv(6),
      },
      {
        movement: "Straddle Planche Push-Up",
        mode: "reps",
        defaultTargetReps: 5,
        exitCriteria: RepAdv(5),
      },
      {
        movement: "Full Planche Push-Up",
        mode: "reps",
        defaultTargetReps: 3,
        exitCriteria: RepAdv(3),
      },
    ],
  },

  // ── P7 — Handstand Push-Up (family: push) ────────────────────────────────
  {
    name: "Handstand Push-Up Progression",
    levels: [
      {
        movement: "Pike Push-Ups",
        mode: "reps",
        defaultTargetReps: 10,
        exitCriteria: RepAdv(10),
      },
      {
        movement: "Box Headstand Push-Up",
        mode: "reps",
        defaultTargetReps: 8,
        exitCriteria: RepAdv(8),
      },
      {
        movement: "Wall HSPU Eccentric",
        mode: "reps",
        defaultTargetReps: 3,
        exitCriteria: EccAdv,
      },
      {
        movement: "Wall Handstand Push-Ups",
        mode: "reps",
        defaultTargetReps: 5,
        exitCriteria: RepAdv(5),
      },
      {
        movement: "Deficit Wall Handstand Push-Ups",
        mode: "reps",
        defaultTargetReps: 5,
        exitCriteria: RepAdv(5),
      },
      {
        movement: "Freestanding Headstand Push-Up",
        mode: "reps",
        defaultTargetReps: 5,
        exitCriteria: RepAdv(5),
      },
      {
        movement: "Freestanding Handstand Push-Ups",
        mode: "reps",
        defaultTargetReps: 3,
        exitCriteria: RepAdv(3),
      },
    ],
  },

  // ── P8 — Straight-Arm Press to Handstand (family: push) ──────────────────
  {
    name: "Straight-Arm Press to Handstand",
    // Own the overhead/inverted position the press lands in first. [SCIENCE]
    // (overhead mobility) + [CONVENTION].
    entryPrerequisites: [
      { kind: "movement-pr", movement: "Wall Handstand Hold", minSeconds: 30 },
    ],
    levels: [
      {
        movement: "Wall Straddle Press Eccentric",
        mode: "reps",
        defaultTargetReps: 3,
        exitCriteria: EccAdv,
      },
      {
        movement: "Elevated Straddle Press to Handstand",
        mode: "reps",
        defaultTargetReps: 5,
        exitCriteria: RepAdv(5),
      },
      {
        movement: "Straddle Press to Handstand",
        mode: "reps",
        defaultTargetReps: 5,
        exitCriteria: RepAdv(5),
      },
      {
        movement: "L-Sit Straddle Press to Handstand",
        mode: "reps",
        defaultTargetReps: 4,
        exitCriteria: RepAdv(4),
      },
      {
        movement: "Pike Press to Handstand",
        mode: "reps",
        defaultTargetReps: 3,
        exitCriteria: RepAdv(3),
      },
    ],
  },

  // ── P9 — Pull-Up / Bar (family: pull) ────────────────────────────────────
  {
    name: "Pull-Up Progression",
    levels: [
      {
        movement: "Scapular Pulls",
        mode: "reps",
        defaultTargetReps: 8,
        exitCriteria: RepAdv(8),
      },
      {
        movement: "Active Hang",
        mode: "reps",
        defaultTargetReps: 8,
        exitCriteria: RepAdv(8),
      },
      {
        movement: "Jumping Pull-Up",
        mode: "reps",
        defaultTargetReps: 8,
        exitCriteria: RepAdv(8),
      },
      {
        movement: "Negative Pull-Ups",
        mode: "reps",
        defaultTargetReps: 3,
        exitCriteria: EccAdv,
      },
      {
        movement: "Pull-Ups",
        mode: "reps",
        defaultTargetReps: 8,
        exitCriteria: RepAdv(8),
      },
      {
        movement: "L-Sit Pull-Ups",
        mode: "reps",
        defaultTargetReps: 6,
        exitCriteria: RepAdv(6),
      },
      {
        movement: "Pullover",
        mode: "reps",
        defaultTargetReps: 6,
        exitCriteria: RepAdv(6),
      },
    ],
  },

  // ── P10 — Weighted Pull-Up (family: pull) — strength axis ────────────────
  {
    name: "Weighted Pull-Up Progression",
    // No external load until a solid bodyweight pull-up base exists. [CONVENTION]
    entryPrerequisites: [
      { kind: "movement-pr", movement: "Pull-Ups", minReps: 8 },
    ],
    levels: [
      {
        movement: "Weighted Pull-Up +25% BW",
        mode: "reps",
        defaultTargetReps: 5,
        exitCriteria: RepAdv(5),
      },
      {
        movement: "Weighted Pull-Up +50% BW",
        mode: "reps",
        defaultTargetReps: 5,
        exitCriteria: RepAdv(5),
      },
      {
        movement: "Weighted Pull-Up +70% BW",
        mode: "reps",
        defaultTargetReps: 5,
        exitCriteria: RepAdv(5),
      },
      {
        movement: "Weighted Pull-Up +90% BW",
        mode: "reps",
        defaultTargetReps: 3,
        exitCriteria: RepAdv(3),
      },
    ],
  },

  // ── P11 — Ring Pull-Up → One-Arm Chin-Up (family: pull) ──────────────────
  {
    name: "Ring Pull-Up & OAC Progression",
    // Pull base + back lever first (connective-tissue safety for the one-arm
    // rungs, OG2 Ch.3 p.28). [CONVENTION]
    entryPrerequisites: [
      { kind: "movement-pr", movement: "Pull-Ups", minReps: 8 },
      { kind: "progression-level", progression: "Back Lever Progression", levelOrder: 6 },
    ],
    levels: [
      {
        movement: "Rings L-Sit Pull-Up",
        mode: "reps",
        defaultTargetReps: 6,
        exitCriteria: RepAdv(6),
      },
      {
        movement: "Rings Wide Grip Pull-Up",
        mode: "reps",
        defaultTargetReps: 6,
        exitCriteria: RepAdv(6),
      },
      {
        movement: "Rings Archer Pull-Up",
        mode: "reps",
        defaultTargetReps: 6,
        perSide: true,
        exitCriteria: RepAdv(6),
      },
      {
        movement: "OAC Eccentric",
        mode: "reps",
        defaultTargetReps: 3,
        perSide: true,
        exitCriteria: EccAdv,
      },
      {
        movement: "One-Arm Chin-Up",
        mode: "reps",
        defaultTargetReps: 3,
        perSide: true,
        exitCriteria: RepAdv(3),
      },
      {
        movement: "OAC +15 lb",
        mode: "reps",
        defaultTargetReps: 3,
        perSide: true,
        exitCriteria: RepAdv(3),
      },
    ],
  },

  // ── P12 — Rowing / Horizontal Pull (family: pull) ────────────────────────
  {
    name: "Rowing Progression",
    levels: [
      {
        movement: "Ring Row Eccentric",
        mode: "reps",
        defaultTargetReps: 3,
        exitCriteria: EccAdv,
      },
      {
        movement: "Ring Row",
        mode: "reps",
        defaultTargetReps: 10,
        exitCriteria: RepAdv(10),
      },
      {
        movement: "Wide Ring Row",
        mode: "reps",
        defaultTargetReps: 8,
        exitCriteria: RepAdv(8),
      },
      {
        movement: "Archer Ring Row",
        mode: "reps",
        defaultTargetReps: 6,
        perSide: true,
        exitCriteria: RepAdv(6),
      },
      {
        movement: "One-Arm Row",
        mode: "reps",
        defaultTargetReps: 6,
        perSide: true,
        exitCriteria: RepAdv(6),
      },
    ],
  },

  // ── P13 — Back Lever (family: pull) ──────────────────────────────────────
  {
    name: "Back Lever Progression",
    // German hang (rung 0) is a deep loaded shoulder-extension position, NOT a
    // universal beginner move — forcing it risks shoulder impingement / biceps
    // tendon strain. Gate on a hang-comfort floor (imperfect proxy for the real
    // shoulder-mobility limiter; "unblock anyway" + a mobility cue cover the
    // gap). OG2 treats a 30s german hang as the mobility safety gate. [CONVENTION]
    entryPrerequisites: [
      { kind: "movement-pr", movement: "Dead Hang", minSeconds: 45 },
    ],
    levels: [
      {
        movement: "German Hang",
        mode: "time",
        defaultTargetSeconds: 30,
        exitCriteria: TimeAdv(30),
      },
      {
        movement: "Skin the Cat",
        mode: "reps",
        defaultTargetReps: 5,
        exitCriteria: RepAdv(5),
      },
      {
        movement: "Tuck Back Lever",
        mode: "time",
        defaultTargetSeconds: 15,
        exitCriteria: TimeAdv(15),
      },
      {
        movement: "Advanced Tuck Back Lever",
        mode: "time",
        defaultTargetSeconds: 15,
        exitCriteria: TimeAdv(15),
      },
      {
        movement: "Straddle Back Lever",
        mode: "time",
        defaultTargetSeconds: 12,
        exitCriteria: TimeAdv(12),
      },
      {
        movement: "Half-Lay Back Lever",
        mode: "time",
        defaultTargetSeconds: 10,
        perSide: true,
        exitCriteria: TimeAdv(10),
      },
      {
        movement: "Back Lever",
        mode: "max",
        exitCriteria: TimeAdv(8),
      },
      {
        movement: "Back Lever Pullout",
        mode: "reps",
        defaultTargetReps: 5,
        exitCriteria: RepAdv(5),
      },
    ],
  },

  // ── P14 — Front Lever (family: pull) ─────────────────────────────────────
  {
    name: "Front Lever Progression",
    // Back lever before front lever (OG2 Ch.3 p.28). Gate on back lever
    // meaningfully underway (advanced tuck), not the full hold. [CONVENTION]
    entryPrerequisites: [
      { kind: "progression-level", progression: "Back Lever Progression", levelOrder: 3 },
    ],
    levels: [
      {
        movement: "Front Lever Tuck Hold",
        mode: "time",
        defaultTargetSeconds: 15,
        exitCriteria: TimeAdv(15),
      },
      {
        movement: "Advanced Tuck Front Lever",
        mode: "time",
        defaultTargetSeconds: 15,
        exitCriteria: TimeAdv(15),
      },
      {
        movement: "Straddle Front Lever",
        mode: "time",
        defaultTargetSeconds: 12,
        exitCriteria: TimeAdv(12),
      },
      {
        movement: "One-Leg Front Lever",
        mode: "time",
        defaultTargetSeconds: 10,
        perSide: true,
        exitCriteria: TimeAdv(10),
      },
      {
        movement: "Front Lever",
        mode: "max",
        exitCriteria: TimeAdv(8),
      },
      {
        movement: "Front Lever Pull to Inverted Hang",
        mode: "reps",
        defaultTargetReps: 5,
        exitCriteria: RepAdv(5),
      },
    ],
  },

  // ── P15 — Front Lever Row (family: pull) — accessory line ────────────────
  {
    name: "Front Lever Row Progression",
    // Own the tuck front-lever hold before rowing in it; transitively inherits
    // the back-lever ordering. levelOrder 1 (past the tuck-hold rung) — NOT 0,
    // which `currentLevel >= 0` satisfies trivially (no-op gate). [CONVENTION]
    entryPrerequisites: [
      { kind: "progression-level", progression: "Front Lever Progression", levelOrder: 1 },
    ],
    levels: [
      {
        movement: "Tuck Front Lever Row",
        mode: "reps",
        defaultTargetReps: 6,
        exitCriteria: RepAdv(6),
      },
      {
        movement: "Straddle Front Lever Row",
        mode: "reps",
        defaultTargetReps: 6,
        exitCriteria: RepAdv(6),
      },
      {
        movement: "Full Front Lever Row",
        mode: "reps",
        defaultTargetReps: 5,
        exitCriteria: RepAdv(5),
      },
    ],
  },

  // ── P16 — Muscle-Up (family: pull) ───────────────────────────────────────
  {
    name: "Muscle-Up Progression",
    // Combined pull-to-support: needs a pull-up base and a ring-dip base.
    // [CONVENTION]
    entryPrerequisites: [
      { kind: "movement-pr", movement: "Pull-Ups", minReps: 8 },
      { kind: "movement-pr", movement: "Ring Dips", minReps: 5 },
    ],
    levels: [
      {
        movement: "False-Grip Hang",
        mode: "time",
        defaultTargetSeconds: 30,
        exitCriteria: TimeAdv(30),
      },
      {
        movement: "Muscle-Up Negative",
        mode: "reps",
        defaultTargetReps: 3,
        exitCriteria: EccAdv,
      },
      {
        movement: "Kipping Muscle-Up",
        mode: "reps",
        defaultTargetReps: 5,
        exitCriteria: RepAdv(5),
      },
      {
        movement: "Muscle-Up",
        mode: "reps",
        defaultTargetReps: 3,
        exitCriteria: RepAdv(3),
      },
      {
        movement: "Bar Muscle-Up",
        mode: "reps",
        defaultTargetReps: 3,
        exitCriteria: RepAdv(3),
      },
      {
        movement: "L-Sit Muscle-Up",
        mode: "reps",
        defaultTargetReps: 3,
        exitCriteria: RepAdv(3),
      },
    ],
  },

  // ── P17 — Iron Cross (family: pull) ──────────────────────────────────────
  {
    name: "Iron Cross Progression",
    // Hard, mandatory gate even for the assisted rung: both levers first, plus
    // deep rings-dip strength and a pull base (OG2 Ch.3 p.28). Rings adv-tuck
    // planche + rings-strap HSPU stay advisory, not hard edges (per skills.ts).
    // [book]
    entryPrerequisites: [
      { kind: "progression-level", progression: "Back Lever Progression", levelOrder: 6 },
      { kind: "progression-level", progression: "Front Lever Progression", levelOrder: 3 },
      { kind: "progression-level", progression: "Rings Dip & Maltese Progression", levelOrder: 7 },
      { kind: "movement-pr", movement: "Pull-Ups", minReps: 8 },
    ],
    levels: [
      {
        movement: "Iron Cross (assisted)",
        mode: "time",
        defaultTargetSeconds: 10,
        exitCriteria: TimeAdv(10),
      },
      {
        movement: "Iron Cross",
        mode: "max",
        exitCriteria: TimeAdv(5),
      },
      {
        movement: "Iron Cross to Back Lever",
        mode: "reps",
        defaultTargetReps: 3,
        exitCriteria: RepAdv(3),
      },
      {
        movement: "Iron Cross Pullout",
        mode: "reps",
        defaultTargetReps: 3,
        exitCriteria: RepAdv(3),
      },
    ],
  },

  // ── P18 — Squat / Pistol (family: legs) ──────────────────────────────────
  {
    name: "Squat Progression",
    levels: [
      {
        movement: "Bodyweight Squats",
        mode: "reps",
        defaultTargetReps: 15,
        exitCriteria: RepAdv(15),
      },
      {
        movement: "Full Squat",
        mode: "reps",
        defaultTargetReps: 15,
        exitCriteria: RepAdv(15),
      },
      {
        movement: "Cossack Squat",
        mode: "reps",
        defaultTargetReps: 10,
        perSide: true,
        exitCriteria: RepAdv(10),
      },
      {
        movement: "Pistol Squats",
        mode: "reps",
        defaultTargetReps: 8,
        perSide: true,
        exitCriteria: RepAdv(8),
      },
      {
        movement: "Weighted Pistol Squat 1.2x BW",
        mode: "reps",
        defaultTargetReps: 5,
        perSide: true,
        exitCriteria: RepAdv(5),
      },
      {
        movement: "Weighted Pistol Squat 1.5x BW",
        mode: "reps",
        defaultTargetReps: 5,
        perSide: true,
        exitCriteria: RepAdv(5),
      },
      {
        movement: "Weighted Pistol Squat 2.0x BW",
        mode: "reps",
        defaultTargetReps: 5,
        perSide: true,
        exitCriteria: RepAdv(5),
      },
    ],
  },

  // ── P19 — Hip Hinge / Nordic (family: legs) ──────────────────────────────
  {
    name: "Hip Hinge & Nordic Progression",
    levels: [
      {
        movement: "Romanian Deadlift",
        mode: "reps",
        defaultTargetReps: 10,
        exitCriteria: RepAdv(10),
      },
      {
        movement: "Single-Leg RDL",
        mode: "reps",
        defaultTargetReps: 10,
        perSide: true,
        exitCriteria: RepAdv(10),
      },
      {
        movement: "Swiss-Ball Leg Curl",
        mode: "reps",
        defaultTargetReps: 10,
        exitCriteria: RepAdv(10),
      },
      {
        movement: "Nordic Hamstring Curl (assisted)",
        mode: "reps",
        defaultTargetReps: 3,
        exitCriteria: EccAdv,
      },
      {
        movement: "Nordic Hamstring Curl",
        mode: "reps",
        defaultTargetReps: 8,
        exitCriteria: RepAdv(8),
      },
    ],
  },

  // ── P20 — Core Anti-Extension / Ab Wheel (family: core) ──────────────────
  {
    name: "Core Anti-Extension Progression",
    levels: [
      {
        movement: "Plank",
        mode: "time",
        defaultTargetSeconds: 60,
        exitCriteria: TimeAdv(60),
      },
      {
        movement: "One-Arm One-Leg Plank",
        mode: "time",
        defaultTargetSeconds: 60,
        perSide: true,
        exitCriteria: TimeAdv(60),
      },
      {
        movement: "Knees Ab Wheel",
        mode: "reps",
        defaultTargetReps: 10,
        exitCriteria: RepAdv(10),
      },
      {
        movement: "Ab Wheel Eccentric",
        mode: "reps",
        defaultTargetReps: 3,
        exitCriteria: EccAdv,
      },
      {
        movement: "Full Ab Wheel",
        mode: "reps",
        defaultTargetReps: 8,
        exitCriteria: RepAdv(8),
      },
      {
        movement: "Ab Wheel +20 lb",
        mode: "reps",
        defaultTargetReps: 6,
        exitCriteria: RepAdv(6),
      },
      {
        movement: "One-Arm Ab Wheel",
        mode: "reps",
        defaultTargetReps: 5,
        perSide: true,
        exitCriteria: RepAdv(5),
      },
    ],
  },

  // ── P21 — Core Flexion / Leg Raise (family: core) ────────────────────────
  {
    name: "Leg Raise Progression",
    levels: [
      {
        movement: "Knee Raises",
        mode: "reps",
        defaultTargetReps: 10,
        exitCriteria: RepAdv(10),
      },
      {
        movement: "Leg Raises",
        mode: "reps",
        defaultTargetReps: 10,
        exitCriteria: RepAdv(10),
      },
      {
        movement: "Toes to Bar",
        mode: "reps",
        defaultTargetReps: 8,
        exitCriteria: RepAdv(8),
      },
      {
        movement: "Tuck Dragon Flag",
        mode: "reps",
        defaultTargetReps: 8,
        exitCriteria: RepAdv(8),
      },
      {
        movement: "Dragon Flag",
        mode: "reps",
        defaultTargetReps: 5,
        exitCriteria: RepAdv(5),
      },
    ],
  },

  // ── P22 — L-Sit → V-Sit → Manna (family: core) — compression chain ───────
  {
    name: "L-Sit Progression",
    levels: [
      {
        movement: "Tucked L-Sit",
        mode: "time",
        defaultTargetSeconds: 30,
        exitCriteria: TimeAdv(30),
      },
      {
        movement: "L-Sit",
        mode: "time",
        defaultTargetSeconds: 20,
        exitCriteria: TimeAdv(20),
      },
      {
        movement: "Straddle L-Sit",
        mode: "time",
        defaultTargetSeconds: 15,
        exitCriteria: TimeAdv(15),
      },
      {
        movement: "RTO L-Sit",
        mode: "time",
        defaultTargetSeconds: 15,
        exitCriteria: TimeAdv(15),
      },
      {
        movement: "45° V-Sit",
        mode: "time",
        defaultTargetSeconds: 10,
        exitCriteria: TimeAdv(10),
      },
      {
        movement: "90° V-Sit",
        mode: "time",
        defaultTargetSeconds: 10,
        exitCriteria: TimeAdv(10),
      },
      {
        movement: "Full V-Sit",
        mode: "time",
        defaultTargetSeconds: 8,
        exitCriteria: TimeAdv(8),
      },
      {
        movement: "Manna",
        mode: "max",
        exitCriteria: TimeAdv(5),
      },
    ],
  },

  // ── P23 — Handstand (family: push — balance/skill) ───────────────────────
  {
    name: "Handstand Progression",
    levels: [
      {
        movement: "Wall Handstand Hold",
        mode: "time",
        defaultTargetSeconds: 30,
        exitCriteria: TimeAdv(30),
      },
      {
        movement: "Freestanding Handstand Hold",
        mode: "max",
        exitCriteria: TimeAdv(60),
      },
      {
        movement: "One-Arm Handstand",
        mode: "max",
        perSide: true,
        exitCriteria: TimeAdv(10),
      },
    ],
  },

  // ── P-EL — Elbow Lever (family: push — balance) ──────────────────────────
  {
    name: "Elbow Lever Progression",
    levels: [
      {
        movement: "Two-Arm Elbow Lever",
        mode: "time",
        defaultTargetSeconds: 10,
        exitCriteria: TimeAdv(10),
      },
      {
        movement: "One-Arm Elbow Lever",
        mode: "max",
        perSide: true,
        exitCriteria: TimeAdv(5),
      },
    ],
  },

  // ── P-HF — Human Flag (family: pull — push/pull couple) ──────────────────
  {
    name: "Human Flag Progression",
    // Pull base to begin the tuck-flag rungs; push-side requirement stays
    // qualitative (no clean single-number movement to key it to). [CONVENTION]
    entryPrerequisites: [
      { kind: "movement-pr", movement: "Pull-Ups", minReps: 8 },
    ],
    levels: [
      {
        movement: "Tuck Human Flag",
        mode: "time",
        defaultTargetSeconds: 8,
        exitCriteria: TimeAdv(8),
      },
      {
        movement: "Straddle Human Flag",
        mode: "time",
        defaultTargetSeconds: 8,
        exitCriteria: TimeAdv(8),
      },
      {
        movement: "Full Human Flag",
        mode: "max",
        exitCriteria: TimeAdv(5),
      },
    ],
  },
];
