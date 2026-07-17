import { useMemo } from 'react'
import { useProgressions, useAllProgressionLevels } from '@/hooks/useProgressions'
import { useMovements } from '@/hooks/useMovements'
import { useMovementPRs } from '@/hooks/useHistory'
import { evaluateProgressionGate } from '@/lib/progression-gate'
import { buildPrereqLabelMaps, labelPrerequisite } from '@/lib/prerequisite-labels'

export interface ResolvedGatePrerequisite {
  met: boolean
  progress: number
  label: string
  detail: string | null
}

export interface ProgressionGate {
  /** Trainable: prerequisites earned OR manually unblocked. */
  unlocked: boolean
  /** Whether the prerequisites are genuinely met (ignores the override). */
  prerequisitesMet: boolean
  /** Unlocked ONLY because the user tapped "unblock anyway". */
  manuallyUnlocked: boolean
  /** Per-prerequisite progress, for the "unlock by:" checklist. */
  prerequisites: ResolvedGatePrerequisite[]
}

// Computes the entry-gate status for every progression, keyed by progression id.
// A progression with no entryPrerequisites resolves to unlocked with an empty
// prerequisite list. Mirrors useSkillAtlas's data sources so gate and atlas stay
// consistent.
export function useProgressionGates(): {
  data: Map<string, ProgressionGate> | null
  isLoading: boolean
} {
  const { data: progressions, isLoading: loadingProgressions } = useProgressions()
  const { data: levels, isLoading: loadingLevels } = useAllProgressionLevels()
  const { data: movements, isLoading: loadingMovements } = useMovements()
  const { data: prs, isLoading: loadingPRs } = useMovementPRs()

  const data = useMemo((): Map<string, ProgressionGate> | null => {
    if (!progressions || !levels || !movements || !prs) return null
    const maps = buildPrereqLabelMaps(progressions, levels, movements)
    const out = new Map<string, ProgressionGate>()
    for (const p of progressions) {
      const gate = evaluateProgressionGate(
        p.entryPrerequisites,
        progressions,
        prs,
        !!p.manuallyUnlockedAt,
      )
      out.set(p.id, {
        unlocked: gate.unlocked,
        prerequisitesMet: gate.prerequisitesMet,
        // Only surface "manual" when the override is actually doing the work
        // (i.e. prerequisites still unmet) — a stale override on a now-earned
        // progression shouldn't read as manually opened.
        manuallyUnlocked: gate.manuallyUnlocked && !gate.prerequisitesMet,
        prerequisites: gate.prerequisites.map((pr) => ({
          met: pr.met,
          progress: pr.progress,
          ...labelPrerequisite(pr.prerequisite, maps),
        })),
      })
    }
    return out
  }, [progressions, levels, movements, prs])

  return {
    data,
    isLoading: loadingProgressions || loadingLevels || loadingMovements || loadingPRs,
  }
}
