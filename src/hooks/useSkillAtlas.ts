import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'
import { skillsRepository } from '@/repositories'
import { useProgressions } from '@/hooks/useProgressions'
import { useMovementPRs } from '@/hooks/useHistory'
import { evaluateSkills } from '@/lib/skill-atlas'
import type { SkillResult } from '@/lib/skill-atlas'
import type { Skill } from '@/models/types'

export interface SkillAtlasData {
  skills: Skill[]
  results: SkillResult[]
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
  const { data: prs, isLoading: loadingPRs } = useMovementPRs()

  const data = useMemo((): SkillAtlasData | null => {
    if (!skills || !progressions || !prs) return null
    // progressions from useProgressions() carry an extra `levelCount` field
    // that doesn't affect the evaluator, which only reads `id` and `currentLevel`.
    const results = evaluateSkills(skills, progressions, prs)
    return { skills, results }
  }, [skills, progressions, prs])

  return {
    data,
    isLoading: loadingSkills || loadingProgressions || loadingPRs,
  }
}
