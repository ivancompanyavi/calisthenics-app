// Warm-up prep templates, keyed by the trigger that activates them.
//
// Trigger logic (OR conditions within a slot):
//   - prepTag present on any resolved movement in the session → slot fires
//   - family present on any resolved movement → slot fires (family-level triggers)
//
// Each template maps to an array of { movement, mode, targetReps/targetSeconds }.
// "movement" must be an exact name match in SEED_MOVEMENTS.
//
// Ordering: wrists → shoulders/scap → hips/legs → core.
// Dedupe: each template fires AT MOST ONCE per session regardless of how many
// movements trigger it. The warmup-engine.ts module enforces this.

import type { SetMode } from '@/models/types'

export interface WarmupExercise {
  movement: string
  mode: SetMode
  targetReps?: number
  targetSeconds?: number
  perSide?: boolean
}

export interface WarmupTemplate {
  // Human-readable label (used in tests / debugging).
  label: string
  exercises: WarmupExercise[]
}

// Canonical ordered list of templates. Order here defines the execution order
// in the warm-up block: wrists → upper (pull/push) → hips/legs → core.
//
// Every exercise here is a DEDICATED mobility/activation drill that is never
// used as training in a workout — so the warm-up reads as a warm-up and can
// never duplicate the session.
export const ORDERED_WARMUP_TEMPLATES: WarmupTemplate[] = [
  // ── Wrists (hand-balancing / straight-arm days) ─────────────────────────────
  {
    label: 'wrist',
    exercises: [
      { movement: 'Wrist Circles', mode: 'reps', targetReps: 10 },
      { movement: 'Wrist Rocks', mode: 'reps', targetReps: 10 },
    ],
  },
  // ── Pull days ───────────────────────────────────────────────────────────────
  {
    label: 'pull',
    exercises: [
      { movement: 'Band Pull-Aparts', mode: 'reps', targetReps: 15 },
      { movement: 'Scapular Shrugs', mode: 'reps', targetReps: 10 },
    ],
  },
  // ── Push days ───────────────────────────────────────────────────────────────
  {
    label: 'push',
    exercises: [
      { movement: 'Arm Circles', mode: 'reps', targetReps: 10 },
      { movement: 'Band Dislocates', mode: 'reps', targetReps: 10 },
      { movement: 'Wall Slides', mode: 'reps', targetReps: 8 },
    ],
  },
  // ── Hips / legs ───────────────────────────────────────────────────────────
  {
    label: 'legs',
    exercises: [
      { movement: 'Leg Swings', mode: 'reps', targetReps: 10, perSide: true },
      { movement: 'Hip Circles', mode: 'reps', targetReps: 10, perSide: true },
      { movement: 'Ankle Rocks', mode: 'reps', targetReps: 10, perSide: true },
    ],
  },
  // ── Core ──────────────────────────────────────────────────────────────────
  {
    label: 'core',
    exercises: [
      { movement: 'Cat-Cow', mode: 'reps', targetReps: 10 },
      { movement: 'Bird Dog', mode: 'reps', targetReps: 8, perSide: true },
    ],
  },
]
