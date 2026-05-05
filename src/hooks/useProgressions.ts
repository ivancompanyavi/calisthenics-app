import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { SetLog } from '@/models/types'
import { queryKeys } from '@/lib/query-keys'
import { progressionsRepository, type LevelInput } from '@/repositories'

export function useProgressions() {
  return useQuery({
    queryKey: queryKeys.progressions.all,
    queryFn: () => progressionsRepository.getAll(),
  })
}

export function useProgression(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.progressions.detail(id!),
    queryFn: () => progressionsRepository.getById(id!),
    enabled: !!id,
  })
}

export function useProgressionLevels(progressionId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.progressions.levels(progressionId!),
    queryFn: () => progressionsRepository.getLevels(progressionId!),
    enabled: !!progressionId,
  })
}

export function useCreateProgression() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { name: string; levels: LevelInput[] }) =>
      progressionsRepository.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.progressions.all })
    },
  })
}

export function useUpdateProgression() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { id: string; name: string; currentLevel?: number; levels: LevelInput[] }) =>
      progressionsRepository.update(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.progressions.all })
      qc.invalidateQueries({ queryKey: ['progressionLevels'] })
    },
  })
}

export function useDeleteProgression() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => progressionsRepository.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.progressions.all })
    },
  })
}

export function useUpdateCurrentLevel() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, currentLevel }: { id: string; currentLevel: number }) => {
      await progressionsRepository.updateCurrentLevel(id, currentLevel)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.progressions.all })
    },
  })
}

/**
 * Checks which progressions are ready to level up.
 * A progression is ready if it hit targets in the current session AND
 * the most recent previous session for the same movement.
 */
export function useProgressionReadiness(progressionIds: string[], currentSets: SetLog[]) {
  return useQuery({
    queryKey: queryKeys.progressions.readiness(progressionIds, currentSets.length),
    queryFn: () => progressionsRepository.checkReadiness(progressionIds, currentSets),
    enabled: progressionIds.length > 0,
  })
}
