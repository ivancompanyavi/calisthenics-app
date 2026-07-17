import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'
import { skillsRepository } from '@/repositories'
import { useProgressions, useAllProgressionLevels } from '@/hooks/useProgressions'
import { useMovements } from '@/hooks/useMovements'
import { useMovementPRs } from '@/hooks/useHistory'
import { evaluateSkills } from '@/lib/skill-atlas'
import type { SkillStatus } from '@/lib/skill-atlas'
import { buildPrereqLabelMaps, labelPrerequisite } from '@/lib/prerequisite-labels'
import type { Skill } from '@/models/types'

/** A prerequisite with its progress and human-readable labels resolved. */
export interface ResolvedPrerequisite {
  met: boolean
  progress: number
  /** Primary label, e.g. "Leg Raise Progression" or "Hollow Body Hold". */
  label: string
  /** Secondary detail, e.g. "Reach Leg Raises" or "Hold 30s". */
  detail: string | null
}

export interface ResolvedSkillResult {
  skillId: string
  status: SkillStatus
  prerequisites: ResolvedPrerequisite[]
}

export interface SkillAtlasData {
  skills: Skill[]
  results: ResolvedSkillResult[]
}

function useSkills() {
  return useQuery({
    queryKey: queryKeys.skills,
    queryFn: () => skillsRepository.getAll(),
  })
}

export function useSkillAtlas(): { data: SkillAtlasData | null; isLoading: boolean } {
  const { data: skills, isLoading: loadingSkills } = useSkills()
  const { data: progressions, isLoading: loadingProgressions } = useProgressions()
  const { data: levels, isLoading: loadingLevels } = useAllProgressionLevels()
  const { data: movements, isLoading: loadingMovements } = useMovements()
  const { data: prs, isLoading: loadingPRs } = useMovementPRs()

  const data = useMemo((): SkillAtlasData | null => {
    if (!skills || !progressions || !levels || !movements || !prs) return null

    // progressions from useProgressions() carry an extra `levelCount` field
    // that doesn't affect the evaluator, which only reads `id` and `currentLevel`.
    const results = evaluateSkills(skills, progressions, prs)

    const maps = buildPrereqLabelMaps(progressions, levels, movements)

    const resolved: ResolvedSkillResult[] = results.map((r) => ({
      skillId: r.skillId,
      status: r.status,
      prerequisites: r.prerequisites.map((pr): ResolvedPrerequisite => ({
        met: pr.met,
        progress: pr.progress,
        ...labelPrerequisite(pr.prerequisite, maps),
      })),
    }))

    return { skills, results: resolved }
  }, [skills, progressions, levels, movements, prs])

  return {
    data,
    isLoading:
      loadingSkills || loadingProgressions || loadingLevels || loadingMovements || loadingPRs,
  }
}
