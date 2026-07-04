import type { SeedSkill } from './types'

// ATLAS SKILLS — 17 milestone nodes over the 25-progression system.
//
// Source: docs/reference/final-build-spec.md §3, cross-referenced against
// docs/reference/movement-name-map.md for exact seed names.
//
// Prerequisite edge kinds:
//   progression-level: { kind, progression, levelOrder }
//     levelOrder = 0-based index into the progression's `levels` array
//     (matches spec §2 rung `#` − 1 since spec numbers from 1).
//   movement-pr: { kind, movement, minReps?, minSeconds? }
//
// Every progression name and movement name here must EXACTLY match an entry
// in progressions.ts / movements.ts — the resolver silently drops unknowns.
//
// Build order: German Hang → Full Back Lever → {Full Front Lever, OAC};
// Straddle Planche → Full Planche → Maltese;
// Freestanding HS → {FSPU → One-Arm HS};
// L-Sit → V-Sit → Manna;
// {Full Back Lever + Half-Lay FL + Rings Adv Tuck Planche} → Iron Cross.

export const SEED_SKILLS: SeedSkill[] = [
  // ── #1  Muscle-Up (strict ring) ──────────────────────────────────────────
  // Spec §3 #1. Limiter = false grip + transition, not raw pulling strength.
  // Ring MU (strict) sits at P16 levelOrder 3 (Muscle-Up, the strict ring
  // variant in the merged bar/ring progression).
  {
    name: 'Muscle-Up',
    description:
      'Pull through a false-grip ring hang above the rings and press out into a support. The classic ring milestone fusing a chest-to-bar pull with a deep ring dip.',
    prerequisites: [
      // Prereq: strict ring MU rung in the muscle-up progression. [book]
      { kind: 'progression-level', progression: 'Muscle-Up Progression', levelOrder: 3 },
      // Prereq: 5 chest-to-bar pull-ups [book: 5 C2R pull] — transition speed gate.
      { kind: 'movement-pr', movement: 'Chest-to-Bar Pull-Up', minReps: 5 },
      // Prereq: 5 strict ring dips [book: 5 ring dips]. False grip + dip = full MU.
      { kind: 'movement-pr', movement: 'Ring Dips', minReps: 5 },
    ],
  },

  // ── #2  Full Planche ──────────────────────────────────────────────────────
  // Spec §3 #2. P5 levelOrder 6 = Full Planche (index 6, the terminal rung).
  {
    name: 'Full Planche',
    description:
      'Full straight-body planche hold — arms locked, body horizontal, toes pointed. The premier straight-arm push static.',
    prerequisites: [
      // Terminal rung of Planche Progression. [book]
      { kind: 'progression-level', progression: 'Planche Progression', levelOrder: 6 },
      // Straddle press to HS feeds the shoulder-position needed for full planche. [book]
      { kind: 'progression-level', progression: 'Straight-Arm Press to Handstand', levelOrder: 2 },
    ],
  },

  // ── #3  Straddle Planche ──────────────────────────────────────────────────
  // Spec §3 #3. P5 levelOrder 4 = Straddle Planche.
  {
    name: 'Straddle Planche',
    description:
      'Planche with legs spread wide to reduce the lever — the gateway step between advanced tuck and full planche.',
    prerequisites: [
      // P5 rung 4 (0-based) = Straddle Planche. [book]
      { kind: 'progression-level', progression: 'Planche Progression', levelOrder: 4 },
      // RTO 60° Lean PPPU builds isolated straddle-planche shoulder position. [book]
      { kind: 'movement-pr', movement: 'RTO 60° Lean PPPU', minReps: 5 },
    ],
  },

  // ── #4  Full Front Lever ──────────────────────────────────────────────────
  // Spec §3 #4. P14 levelOrder 4 = Front Lever (terminal hold rung).
  {
    name: 'Full Front Lever',
    description:
      'Full-body front lever held horizontal — face up, arms straight, toes pointed. Requires ~70–80 % BW pulling strength.',
    prerequisites: [
      // P14 index 4 = Front Lever. [book]
      { kind: 'progression-level', progression: 'Front Lever Progression', levelOrder: 4 },
      // +70-80 % BW weighted pull-up is the empirical anchor. [book]
      { kind: 'movement-pr', movement: 'Weighted Pull-Up +70% BW', minReps: 5 },
      // Full back lever must be owned first — same shoulder-girdle demand. [book]
      { kind: 'progression-level', progression: 'Back Lever Progression', levelOrder: 6 },
    ],
  },

  // ── #5  Straddle Front Lever ──────────────────────────────────────────────
  // Spec §3 #5. P14 levelOrder 2 = Straddle Front Lever.
  {
    name: 'Straddle Front Lever',
    description:
      'Straddle front lever hold — legs spread to shorten lever. Posterior-shoulder limiter; Manna work accelerates this.',
    prerequisites: [
      // P14 index 2 = Straddle Front Lever. [book]
      { kind: 'progression-level', progression: 'Front Lever Progression', levelOrder: 2 },
      // +50 % BW pull-up ≈ full back lever / straddle FL anchor. [book]
      { kind: 'movement-pr', movement: 'Weighted Pull-Up +50% BW', minReps: 5 },
    ],
  },

  // ── #6  Full Back Lever ───────────────────────────────────────────────────
  // Spec §3 #6. P13 levelOrder 6 = Back Lever (terminal hold rung).
  {
    name: 'Full Back Lever',
    description:
      'Full-body back lever, supinated grip — body parallel to ground, face down. Safety gate: must own German hang and skin-the-cat first.',
    prerequisites: [
      // P13 index 6 = Back Lever. [book]
      { kind: 'progression-level', progression: 'Back Lever Progression', levelOrder: 6 },
      // 30 s German Hang clears the shoulder-mobility safety gate. [book]
      { kind: 'movement-pr', movement: 'German Hang', minSeconds: 30 },
      // 5 smooth skin-the-cats confirm the shoulder rotation is ready. [book]
      { kind: 'movement-pr', movement: 'Skin the Cat', minReps: 5 },
    ],
  },

  // ── #7  Freestanding Handstand ────────────────────────────────────────────
  // Spec §3 #7. P23 levelOrder 1 = Freestanding Handstand Hold.
  {
    name: 'Freestanding Handstand',
    description:
      'Free-balance handstand ≥ 60 s away from any wall. Foundation for all freestanding pressing and one-arm hand-balancing.',
    prerequisites: [
      // P23 index 1 = Freestanding Handstand Hold. [book]
      { kind: 'progression-level', progression: 'Handstand Progression', levelOrder: 1 },
      // 30 s straight-body wall handstand establishes the pressing position. [book]
      { kind: 'movement-pr', movement: 'Wall Handstand Hold', minSeconds: 30 },
    ],
  },

  // ── #8  Freestanding Handstand Push-Up ───────────────────────────────────
  // Spec §3 #8. P7 levelOrder 6 = Freestanding Handstand Push-Ups.
  {
    name: 'Freestanding Handstand Push-Up',
    description:
      'Full-range overhead press in a freestanding handstand, no wall. ≈ 85–95 % BW press. Combines pressing strength with balance mastery.',
    prerequisites: [
      // Terminal pressing rung of HSPU progression. [book]
      { kind: 'progression-level', progression: 'Handstand Push-Up Progression', levelOrder: 6 },
      // Freestanding HS balance is the platform skill that enables the press. [book]
      { kind: 'progression-level', progression: 'Handstand Progression', levelOrder: 1 },
      // 5 wall HSPU as pressing-strength floor. [pub]
      { kind: 'movement-pr', movement: 'Wall Handstand Push-Ups', minReps: 5 },
    ],
  },

  // ── #9  One-Arm Chin-Up ───────────────────────────────────────────────────
  // Spec §3 #9. P11 levelOrder 4 = One-Arm Chin-Up.
  {
    name: 'One-Arm Chin-Up',
    description:
      'Strict dead-hang single-arm chin-up, full extension to chin over bar. ≈ 80–90 % BW pulling strength. One of the hardest bar feats.',
    prerequisites: [
      // P11 index 4 = One-Arm Chin-Up. [book]
      { kind: 'progression-level', progression: 'Ring Pull-Up & OAC Progression', levelOrder: 4 },
      // +50 % BW weighted pull-up as strength floor. [book]
      { kind: 'movement-pr', movement: 'Weighted Pull-Up +50% BW', minReps: 1 },
      // 15 strict pull-up PR — large concentric reserve before one-arm. [book]
      { kind: 'movement-pr', movement: 'Pull-Ups', minReps: 15 },
      // Full back lever is the standard skill prerequisite companion. [book]
      { kind: 'progression-level', progression: 'Back Lever Progression', levelOrder: 6 },
    ],
  },

  // ── #10  One-Arm Handstand ────────────────────────────────────────────────
  // Spec §3 #10. P23 levelOrder 2 = One-Arm Handstand.
  {
    name: 'One-Arm Handstand',
    description:
      'Single-arm freestanding handstand. Years of dedicated balance practice after the two-arm handstand is owned. Strict prerequisites.',
    prerequisites: [
      // P23 index 2 = One-Arm Handstand. [book]
      { kind: 'progression-level', progression: 'Handstand Progression', levelOrder: 2 },
      // 60 s freestanding hold is the standard one-arm gate. [book]
      { kind: 'movement-pr', movement: 'Freestanding Handstand Hold', minSeconds: 60 },
      // FSPU balance-strength is the recommended companion. [book]
      { kind: 'progression-level', progression: 'Handstand Push-Up Progression', levelOrder: 6 },
    ],
  },

  // ── #11  Human Flag ───────────────────────────────────────────────────────
  // Spec §3 #11. P-HF levelOrder 2 = Full Human Flag. OG2 levels uncalibrated.
  {
    name: 'Human Flag',
    description:
      'Full horizontal side-hold on a vertical pole — one arm pushes, one arm pulls. A push/pull strength couple over the whole trunk.',
    prerequisites: [
      // P-HF index 2 = Full Human Flag. [book~: OG2 levels inconsistent]
      { kind: 'progression-level', progression: 'Human Flag Progression', levelOrder: 2 },
      // ~10–15 strict pull-ups as pulling base. [pub]
      { kind: 'movement-pr', movement: 'Pull-Ups', minReps: 10 },
    ],
  },

  // ── #12  V-Sit ────────────────────────────────────────────────────────────
  // Spec §3 #12. P22 levelOrder 4 = 45° V-Sit (entry into the V-sit tier).
  {
    name: 'V-Sit',
    description:
      'From an L-sit, raise the legs toward vertical into a V — deep hip-flexor compression well beyond the L-sit.',
    prerequisites: [
      // P22 index 4 = 45° V-Sit, the first V-sit rung. [book]
      { kind: 'progression-level', progression: 'L-Sit Progression', levelOrder: 4 },
      // Solid L-sit is the universal agreed floor. [pub]
      { kind: 'progression-level', progression: 'L-Sit Progression', levelOrder: 1 },
    ],
  },

  // ── #13  Manna ────────────────────────────────────────────────────────────
  // Spec §3 #13. P22 levelOrder 7 = Manna (terminal rung).
  {
    name: 'Manna',
    description:
      'Hips-above-shoulders straight-arm hold — the most demanding compression static. Flexibility-gated. Also improves straddle front-lever posterior shoulder.',
    prerequisites: [
      // P22 index 7 = Manna. [book]
      { kind: 'progression-level', progression: 'L-Sit Progression', levelOrder: 7 },
      // L-Sit is the hard prerequisite for the whole chain. [pub]
      { kind: 'progression-level', progression: 'L-Sit Progression', levelOrder: 1 },
    ],
  },

  // ── #14  Dragon Flag ─────────────────────────────────────────────────────
  // Spec §3 #14. P21 levelOrder 4 = Dragon Flag (terminal rung). OG2 external.
  {
    name: 'Dragon Flag',
    description:
      'Straight-body reverse crunch — shoulders anchored, rigid body lowered and raised as one unit. Total-body anti-extension core feat.',
    prerequisites: [
      // P21 index 4 = Dragon Flag. [pub: OG2 omits this progression]
      { kind: 'progression-level', progression: 'Leg Raise Progression', levelOrder: 4 },
      // 10 hanging leg raises as pulling-hip-flexor floor. [pub]
      { kind: 'movement-pr', movement: 'Leg Raises', minReps: 10 },
    ],
  },

  // ── #15  Pistol Squat ────────────────────────────────────────────────────
  // Spec §3 #15. P18 levelOrder 3 = Pistol Squats.
  {
    name: 'Pistol Squat',
    description:
      'Full single-leg squat to depth, free leg extended forward. The single-leg strength, ankle mobility, and balance milestone.',
    prerequisites: [
      // P18 index 3 = Pistol Squats. [book]
      { kind: 'progression-level', progression: 'Squat Progression', levelOrder: 3 },
      // 20 full squats = depth and volume readiness. [pub]
      { kind: 'movement-pr', movement: 'Full Squat', minReps: 20 },
      // Cossack squat (P18-2) is the direct pistol-prep rung. [book]
      { kind: 'progression-level', progression: 'Squat Progression', levelOrder: 2 },
    ],
  },

  // ── #16  Iron Cross ───────────────────────────────────────────────────────
  // Spec §3 #16. P17 levelOrder 1 = Iron Cross (hold). Hard gate — all prereqs
  // are mandatory per OG2. [book]
  {
    name: 'Iron Cross',
    description:
      'Straight-arm rings cross hold. CoP B; distal-biceps loading is the injury risk. Full back lever, half-lay front lever, rings adv-tuck planche, and RTO ~75° dips are all mandatory gates.',
    prerequisites: [
      // P17 index 1 = Iron Cross (hold). [book]
      { kind: 'progression-level', progression: 'Iron Cross Progression', levelOrder: 1 },
      // Full back lever — mandatory [book]
      { kind: 'progression-level', progression: 'Back Lever Progression', levelOrder: 6 },
      // Half-lay front lever (P14 index 3) — mandatory [book]
      { kind: 'progression-level', progression: 'Front Lever Progression', levelOrder: 3 },
      // RTO 75° past-parallel dip (P4 index 7) — mandatory [book]
      { kind: 'progression-level', progression: 'Rings Dip & Maltese Progression', levelOrder: 7 },
      // 8–10 strict pull-ups as pulling base. [pub]
      { kind: 'movement-pr', movement: 'Pull-Ups', minReps: 8 },
    ],
  },

  // ── #17  Maltese ─────────────────────────────────────────────────────────
  // Spec §3 #17. P4 levelOrder 12 = Full Maltese (OG2 L17 — beyond the 16-grid).
  {
    name: 'Maltese',
    description:
      'Straight-arm push cross — rings held wide of the body, beyond the dip position. Full Planche + Iron Cross skill base required.',
    prerequisites: [
      // P4 index 12 = Full Maltese. [book: L17 — elite beyond-grid rung]
      { kind: 'progression-level', progression: 'Rings Dip & Maltese Progression', levelOrder: 12 },
      // Full Planche is the primary push-strength gate. [pub-fix: hard gate]
      { kind: 'progression-level', progression: 'Planche Progression', levelOrder: 6 },
      // Straddle Planche must be held 10–15 s — strength complement. [pub-fix]
      { kind: 'progression-level', progression: 'Planche Progression', levelOrder: 4 },
      // Full back lever completes the push/pull pair. [pub]
      { kind: 'progression-level', progression: 'Back Lever Progression', levelOrder: 6 },
    ],
  },
]
