import type { SeedPattern } from './types'

// ADAPTIVE PATTERN SLOTS — the primitive for a structure/difficulty-decoupled
// program. A workout slot names a movement PATTERN ("vertical-pull") instead of
// a fixed progression; it resolves at runtime to the unlocked progression in
// its candidate chain the athlete is ENGAGED with — most recently trained,
// adopted, or manually unlocked — falling back to the easiest unlocked one.
// Harder unlocked lines are offered as opt-in step-up cards, never applied
// automatically (see src/lib/pattern-resolver.ts).
//
// Candidate order is HARDEST → EASIEST, grounded in the OG2 progression charts
// (2e book pp.30-33): each chart column is a progression line and its FIG level
// (row) is the cross-skill difficulty coordinate, so higher-level lines sit
// earlier in the chain.
//
// INVARIANT (enforced by src/db/seed/__tests__/patterns.test.ts): a
// non-`optional` pattern's LAST candidate must be an ungated foundational
// progression, so the slot always resolves to something a beginner can train.
// `optional` patterns (skill/static work) resolve to nothing until engaged —
// unlocked-but-unstarted chains degrade to gate-maintenance work, fully locked
// ones to unlock work, so the session never loses content.

export const SEED_PATTERNS: SeedPattern[] = [
  // ── PULL ────────────────────────────────────────────────────────────────
  {
    key: 'vertical-pull',
    label: 'Vertical Pull',
    group: 'pull',
    candidates: [
      'Ring Pull-Up & OAC Progression',
      'Weighted Pull-Up Progression',
      'Pull-Up Progression', // ungated base
    ],
  },
  {
    key: 'horizontal-pull',
    label: 'Horizontal Pull',
    group: 'pull',
    candidates: [
      'Front Lever Row Progression',
      'Rowing Progression', // ungated base
    ],
  },
  {
    key: 'pull-static',
    label: 'Static Pull (Levers)',
    group: 'pull',
    optional: true,
    candidates: [
      'Iron Cross Progression',
      'Front Lever Progression',
      'Back Lever Progression',
    ],
  },
  {
    key: 'muscle-up',
    label: 'Muscle-Up',
    group: 'pull',
    optional: true,
    candidates: ['Muscle-Up Progression'],
  },

  // ── PUSH ────────────────────────────────────────────────────────────────
  {
    key: 'horizontal-push',
    label: 'Horizontal Push',
    group: 'push',
    candidates: [
      'Planche Push-Up Progression',
      'One-Arm Push-Up Progression',
      'Push-Up Progression', // ungated base
    ],
  },
  {
    key: 'dip',
    label: 'Dip',
    group: 'push',
    candidates: [
      'Rings Dip & Maltese Progression',
      'Dip Progression', // ungated base
    ],
  },
  {
    key: 'overhead-press',
    label: 'Overhead Press',
    group: 'push',
    candidates: [
      'Straight-Arm Press to Handstand',
      'Handstand Push-Up Progression', // ungated base
    ],
  },
  {
    key: 'planche',
    label: 'Planche',
    group: 'push',
    // Base (Frog Stand) is a legitimate beginner prep rung, so non-optional.
    candidates: ['Planche Progression'],
  },

  // ── LEGS ────────────────────────────────────────────────────────────────
  {
    key: 'squat',
    label: 'Squat',
    group: 'legs',
    candidates: ['Squat Progression'],
  },
  {
    key: 'hinge',
    label: 'Hip Hinge',
    group: 'legs',
    candidates: ['Hip Hinge & Nordic Progression'],
  },

  // ── CORE ────────────────────────────────────────────────────────────────
  {
    key: 'core-anti-extension',
    label: 'Core — Anti-Extension',
    group: 'core',
    candidates: ['Core Anti-Extension Progression'],
  },
  {
    key: 'core-compression',
    label: 'Core — Compression',
    group: 'core',
    candidates: ['L-Sit Progression'],
  },
  {
    key: 'core-flexion',
    label: 'Core — Flexion',
    group: 'core',
    candidates: ['Leg Raise Progression'],
  },

  // ── SKILL ───────────────────────────────────────────────────────────────
  {
    key: 'handstand',
    label: 'Handstand',
    group: 'skill',
    candidates: ['Handstand Progression'],
  },
  {
    key: 'elbow-lever',
    label: 'Elbow Lever',
    group: 'skill',
    candidates: ['Elbow Lever Progression'],
  },
  {
    key: 'flag',
    label: 'Human Flag',
    group: 'skill',
    optional: true,
    candidates: ['Human Flag Progression'],
  },
]
