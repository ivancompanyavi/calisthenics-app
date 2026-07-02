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
      // Clear any stale snooze so the new rung starts fresh.
      await progressionsRepository.clearDismissal(id)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.progressions.all })
      // Diagnostics depend on currentLevel; bumping it clears the stuck state.
      qc.invalidateQueries({ queryKey: queryKeys.progressions.diagnostics })
      // Re-compute readiness verdicts after the level change.
      qc.invalidateQueries({ queryKey: queryKeys.progressions.verdicts })
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

export function useProgressionDiagnostics() {
  return useQuery({
    queryKey: queryKeys.progressions.diagnostics,
    queryFn: () => progressionsRepository.getDiagnostics(),
  })
}

/**
 * Readiness verdicts for all progressions.
 * Returns a Map<progressionId, ReadinessVerdict>.
 */
export function useProgressionVerdicts() {
  return useQuery({
    queryKey: queryKeys.progressions.verdicts,
    queryFn: () => progressionsRepository.getVerdicts(),
  })
}

/**
 * Dismiss (snooze) the ready-to-advance card for a progression.
 * Re-surfaces automatically after the next qualifying session.
 */
export function useDismissVerdictCard() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      progressionId,
      qualifyingSessionCount,
    }: {
      progressionId: string
      qualifyingSessionCount: number
    }) => progressionsRepository.dismissVerdict(progressionId, qualifyingSessionCount),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.progressions.verdicts })
    },
  })
}
