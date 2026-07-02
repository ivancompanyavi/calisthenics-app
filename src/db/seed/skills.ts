import type { SeedSkill } from './types'

// Starter skill nodes for the atlas. Prerequisite values are provisional —
// the full content pass (exit-criteria tuning, additional skills, richer
// descriptions) is a separate HITL ticket.
export const SEED_SKILLS: SeedSkill[] = [
  {
    name: 'Strict Muscle-Up',
    description: 'A combined pulling and pushing movement: pull yourself above the bar or rings and transition into a dip to press out at the top.',
    prerequisites: [
      // provisional — refined in atlas content pass
      { kind: 'progression-level', progression: 'Pull-Up Progression', levelOrder: 8 },
      // provisional — refined in atlas content pass
      { kind: 'progression-level', progression: 'Dip Progression', levelOrder: 3 },
    ],
  },
  {
    name: 'Full Planche',
    description: 'A straight-body horizontal hold with arms fully extended, legs parallel to the ground and feet off the floor.',
    prerequisites: [
      // provisional — refined in atlas content pass
      { kind: 'progression-level', progression: 'Planche Progression', levelOrder: 4 },
    ],
  },
  {
    name: 'Full Front Lever',
    description: 'A horizontal hang from a bar or rings with the body held perfectly straight and parallel to the ground.',
    prerequisites: [
      // provisional — refined in atlas content pass
      { kind: 'progression-level', progression: 'Front Lever Progression', levelOrder: 4 },
    ],
  },
  {
    name: 'Freestanding Handstand Push-Up',
    description: 'A strict overhead press performed in a freestanding handstand without wall support.',
    prerequisites: [
      // provisional — refined in atlas content pass
      { kind: 'progression-level', progression: 'Handstand Push-Up Progression', levelOrder: 5 },
    ],
  },
  {
    name: 'One-Arm Pull-Up',
    description: 'A strict dead-hang pull-up performed with a single arm, from full extension to chin above the bar.',
    prerequisites: [
      // provisional — refined in atlas content pass
      { kind: 'progression-level', progression: 'Pull-Up Progression', levelOrder: 10 },
      // provisional — refined in atlas content pass
      { kind: 'movement-pr', movement: 'Pull-Ups', minReps: 10 },
    ],
  },
]
