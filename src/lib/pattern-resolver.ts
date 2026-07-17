// Pure adaptive-pattern resolver: given a pattern's candidate chain (hardest →
// easiest) and the current data snapshots, return the hardest progression whose
// entry gate is unlocked. Reuses the progression-gate evaluator so a pattern
// slot and a directly-gated progression agree on what "unlocked" means.
//
// Returns null when nothing in the chain is unlocked. For a non-`optional`
// pattern this never happens — its last candidate is an ungated foundational
// progression (invariant enforced by the seed patterns test) — so the slot
// always resolves. For an `optional` pattern, null means "omit this slot until
// something is earned".

import { evaluateProgressionGate } from '@/lib/progression-gate'
import type { Progression } from '@/models/types'
import type { MovementPR } from '@/repositories/workout-logs.repository'

export interface PatternResolution {
  progressionId: string | null
  progressionName: string | null
}

export function resolvePattern(
  candidates: string[],
  progressions: Progression[],
  movementPRs: Map<string, MovementPR>,
): PatternResolution {
  const byName = new Map(progressions.map((p) => [p.name, p]))
  for (const name of candidates) {
    const prog = byName.get(name)
    if (!prog) continue
    const gate = evaluateProgressionGate(
      prog.entryPrerequisites,
      progressions,
      movementPRs,
      !!prog.manuallyUnlockedAt,
    )
    if (gate.unlocked) {
      return { progressionId: prog.id, progressionName: prog.name }
    }
  }
  return { progressionId: null, progressionName: null }
}
