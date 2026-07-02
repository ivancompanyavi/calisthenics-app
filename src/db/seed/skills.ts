import type { SeedSkill } from './types'

// Skill-atlas milestone nodes.
//
// Prerequisite edges come in two confidence tiers, sourced in
// docs/coaching-standards.md:
//   • progression-level edges follow the Overcoming Gravity 2 ladder orderings
//     (HIGH confidence, cross-verified against Steven Low's official charts).
//   • movement-PR numeric gates come from individual coaches (chiefly Eric
//     Flag) — reputable but single-source CONVENTION, not established standard.
//     Where coaches disagree (e.g. the muscle-up dip count: 5 vs 12 vs 15) the
//     OG-aligned mid value is used and the disagreement noted inline.
//
// levelOrder is the 0-based `order` of the target rung within its progression.
export const SEED_SKILLS: SeedSkill[] = [
  // ── Pull / posterior skills ───────────────────────────────────────────────
  {
    name: 'Strict Muscle-Up',
    description:
      'Pull explosively above the bar or rings and press out of the transition into a support — no kip. The classic bar/ring milestone that fuses a high pull-up with a deep dip.',
    prerequisites: [
      // OG2: strict bar MU sits above regular muscle-ups — needs a strong full
      // pull-up and dip base. (HIGH — ladder position.)
      { kind: 'progression-level', progression: 'Pull-Up Progression', levelOrder: 8 }, // Pull-Ups
      { kind: 'progression-level', progression: 'Dip Progression', levelOrder: 3 }, // Dips
      // Eric Flag: ~10 strict pull-ups + ~12 straight-bar dips. (MEDIUM — single
      // coach; dip count disputed 5/12/15, using Flag's 12.)
      { kind: 'movement-pr', movement: 'Pull-Ups', minReps: 10 },
      { kind: 'movement-pr', movement: 'Dips', minReps: 12 },
    ],
  },
  {
    name: 'One-Arm Pull-Up',
    description:
      'A strict dead-hang pull-up on a single arm, full extension to chin over the bar. One of the hardest bodyweight pulling feats.',
    prerequisites: [
      // OG2 / consensus: deep into the pull ladder (archer pull-ups) first.
      { kind: 'progression-level', progression: 'Pull-Up Progression', levelOrder: 10 }, // Archer Pull-Ups
      // Convention: a large two-arm rep reserve (~12+) before one-arm work. (MEDIUM.)
      { kind: 'movement-pr', movement: 'Pull-Ups', minReps: 12 },
    ],
  },
  {
    name: 'Full Front Lever',
    description:
      'Hang from a bar with the body held perfectly straight and horizontal, face-up. A straight-arm pulling benchmark.',
    prerequisites: [
      // OG2 Front Lever ladder terminal rung. (HIGH.)
      { kind: 'progression-level', progression: 'Front Lever Progression', levelOrder: 5 }, // Front Lever
    ],
  },
  {
    name: 'Straddle Front Lever',
    description:
      'A front lever with legs spread wide to shorten the lever — the last major step before the full front lever.',
    prerequisites: [
      { kind: 'progression-level', progression: 'Front Lever Progression', levelOrder: 3 }, // Straddle Front Lever
    ],
  },
  {
    name: 'Back Lever',
    description:
      'Hang face-down with the body straight and horizontal. Entered via German hang and skin-the-cat shoulder preparation.',
    prerequisites: [
      // OG2 Back Lever entry: German hang tolerance + skin-the-cat. (HIGH — ladder
      // entry.) No dedicated back-lever progression in seed yet; gate on the
      // skin-the-cat entry movement instead.
      { kind: 'movement-pr', movement: 'Skin the Cat', minReps: 5 },
    ],
  },

  // ── Push / straight-arm press skills ──────────────────────────────────────
  {
    name: 'Full Planche',
    description:
      'A straight-body horizontal hold, arms locked, legs parallel to the ground and feet off the floor. The premier straight-arm pushing static.',
    prerequisites: [
      { kind: 'progression-level', progression: 'Planche Progression', levelOrder: 5 }, // Full Planche
    ],
  },
  {
    name: 'Straddle Planche',
    description:
      'A planche with legs spread to reduce the lever — the gateway between advanced tuck and full planche.',
    prerequisites: [
      { kind: 'progression-level', progression: 'Planche Progression', levelOrder: 4 }, // Straddle Planche
    ],
  },
  {
    name: 'Freestanding Handstand',
    description:
      'A balanced, straight handstand held away from any wall. The foundation for all freestanding pressing and hand-balancing.',
    prerequisites: [
      { kind: 'progression-level', progression: 'Handstand Push-Up Progression', levelOrder: 5 }, // Freestanding Handstand Hold
    ],
  },
  {
    name: 'Freestanding Handstand Push-Up',
    description:
      'A strict full-range overhead press in a freestanding handstand, no wall. Combines pressing strength with balance.',
    prerequisites: [
      // Needs the wall HSPU strength base and a reliable freestanding hold.
      { kind: 'progression-level', progression: 'Handstand Push-Up Progression', levelOrder: 5 }, // Freestanding Handstand Hold
    ],
  },

  // ── Core / lever skills ───────────────────────────────────────────────────
  {
    name: 'Dragon Flag',
    description:
      'Lying on a bench holding an overhead anchor, keep the whole body rigid and lower/raise it as one unit from the shoulders. A total-body core feat.',
    prerequisites: [
      // Eric Flag: ~30s hollow-body hold readiness + a pulling base. (MEDIUM.)
      { kind: 'movement-pr', movement: 'Hollow Body Hold', minSeconds: 30 },
      { kind: 'progression-level', progression: 'Leg Raise Progression', levelOrder: 1 }, // Leg Raises
    ],
  },
  {
    name: 'Human Flag',
    description:
      'Grip a vertical pole and hold the body sideways, fully horizontal — a top-arm pull and bottom-arm press working against each other.',
    prerequisites: [
      // Eric Flag: ~12 pull-ups + ~12 dips + leg-raise comfort before serious
      // flag work. (MEDIUM — single coach.) No dedicated flag progression in seed.
      { kind: 'movement-pr', movement: 'Pull-Ups', minReps: 12 },
      { kind: 'movement-pr', movement: 'Dips', minReps: 12 },
    ],
  },
  {
    name: 'V-Sit',
    description:
      'From an L-sit, raise the legs toward vertical into a V — deep compression and hip-flexor strength beyond the L-sit.',
    prerequisites: [
      // A solid full L-sit is the universally-agreed floor; detailed V-sit
      // prerequisites were NOT found in verified sources (see coaching-standards.md
      // open questions), so this gates only on the L-sit.
      { kind: 'progression-level', progression: 'L-Sit Progression', levelOrder: 2 }, // L-Sit
    ],
  },

  // ── Lower body ────────────────────────────────────────────────────────────
  {
    name: 'Pistol Squat',
    description:
      'A full single-leg squat to depth with the free leg extended forward. The single-leg strength and balance milestone.',
    prerequisites: [
      // OG2 squat ladder: pistol is the rung reached after side-to-side squats. (HIGH.)
      { kind: 'progression-level', progression: 'Squat Progression', levelOrder: 3 }, // Pistol Squats
    ],
  },
]
