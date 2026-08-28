// Pure progression-entry gate: decides whether a progression is "unlocked"
// (trainable) for the athlete given its entry prerequisites and the current
// data snapshots. Reuses the skill-atlas prerequisite evaluator so gating and
// the Atlas map agree on how progress toward a prerequisite is measured.
//
// A progression with no entry prerequisites is always unlocked. The
// `manuallyUnlocked` flag models the "unblock anyway" escape hatch: the athlete
// can choose to train a still-gated progression, in which case `unlocked` is
// true but `prerequisitesMet` stays false so the UI can flag that it was opened
// manually rather than earned.
//
// This module is pure: no I/O, no mutation. The persisted override that feeds
// `manuallyUnlocked` lives in the progressions repository, not here.

import { evaluatePrerequisites, type PrerequisiteResult } from '@/lib/skill-atlas'
import type { SkillPrerequisite, Progression } from '@/models/types'
import type { MovementPR } from '@/repositories/workout-logs.repository'

export interface ProgressionGateResult {
  // Whether the progression may be trained: prerequisites earned OR manually
  // unblocked.
  unlocked: boolean
  // Whether the prerequisites are genuinely met (ignores the manual override).
  prerequisitesMet: boolean
  // Whether `unlocked` is true only because of the manual "unblock anyway"
  // override rather than earned prerequisites.
  manuallyUnlocked: boolean
  // Per-prerequisite progress, for rendering "you need X" checklists. Empty
  // when the progression has no entry prerequisites.
  prerequisites: PrerequisiteResult[]
}

export function evaluateProgressionGate(
  prerequisites: SkillPrerequisite[] | undefined,
  progressions: Progression[],
  movementPRs: Map<string, MovementPR>,
  manuallyUnlocked = false,
): ProgressionGateResult {
  // 'recent' evidence: unlocked means trainable NOW, so the gate judges
  // current form (bests inside GATE_EVIDENCE_WINDOW), not all-time bests.
  // A line earned before a layoff re-locks when its evidence goes stale.
  // The Skill Atlas keeps all-time evidence — achievements don't expire.
  const results =
    prerequisites && prerequisites.length > 0
      ? evaluatePrerequisites(
          prerequisites,
          new Map(progressions.map((p) => [p.id, p])),
          movementPRs,
          'recent',
        )
      : []
  // every() on an empty list is true — a prerequisite-free progression is met.
  const prerequisitesMet = results.every((r) => r.met)
  return {
    unlocked: prerequisitesMet || manuallyUnlocked,
    prerequisitesMet,
    manuallyUnlocked,
    prerequisites: results,
  }
}
