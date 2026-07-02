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
// in the warm-up block: wrists → shoulders/scap → hips/legs → core.
export const ORDERED_WARMUP_TEMPLATES: WarmupTemplate[] = [
  // ── Wrists ────────────────────────────────────────────────────────────────
  {
    label: 'wrist',
    exercises: [
      { movement: 'Wrist Rocks', mode: 'reps', targetReps: 10 },
      { movement: 'Wrist Push-Up Lean', mode: 'reps', targetReps: 8 },
    ],
  },
  // ── Shoulders / scapular ──────────────────────────────────────────────────
  {
    label: 'scap-pull',
    exercises: [
      { movement: 'Scapular Pulls', mode: 'reps', targetReps: 8 },
      { movement: 'Dead Hang', mode: 'time', targetSeconds: 20 },
    ],
  },
  {
    label: 'heavy-push-overhead',
    exercises: [
      { movement: 'Band Dislocates', mode: 'reps', targetReps: 10 },
      { movement: 'Scapular Push-Ups', mode: 'reps', targetReps: 8 },
    ],
  },
  // ── Hips / legs ───────────────────────────────────────────────────────────
  {
    label: 'legs',
    exercises: [
      { movement: 'Deep Squat Hold', mode: 'time', targetSeconds: 30 },
      { movement: 'Leg Swings', mode: 'reps', targetReps: 10, perSide: true },
    ],
  },
  // ── Core ──────────────────────────────────────────────────────────────────
  {
    label: 'core',
    exercises: [
      { movement: 'Hollow Body Hold', mode: 'time', targetSeconds: 20 },
    ],
  },
]
