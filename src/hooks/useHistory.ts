import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { SetLog } from '@/models/types'
import { queryKeys } from '@/lib/query-keys'
import { workoutLogsRepository } from '@/repositories'

export function useWorkoutLogs() {
  return useQuery({
    queryKey: queryKeys.workoutLogs.all,
    queryFn: () => workoutLogsRepository.getAll(),
  })
}

export function useWorkoutLog(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.workoutLogs.detail(id!),
    queryFn: () => workoutLogsRepository.getById(id!),
    enabled: !!id,
  })
}

export function useSetLogs(workoutLogId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.workoutLogs.sets(workoutLogId!),
    queryFn: () => workoutLogsRepository.getSetLogs(workoutLogId!),
    enabled: !!workoutLogId,
  })
}

export function useAllSetLogs(enabled = true) {
  return useQuery({
    queryKey: queryKeys.workoutLogs.allSets,
    queryFn: () => workoutLogsRepository.getAllSetLogs(),
    enabled,
  })
}

export function useDeleteWorkoutLog() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => workoutLogsRepository.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.workoutLogs.all })
      qc.invalidateQueries({ queryKey: ['setLogs'] })
    },
  })
}

export function useSaveWorkoutLog() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { workoutId: string; workoutName: string; startedAt: number; notes?: string; sets: Omit<SetLog, 'id' | 'workoutLogId'>[] }) =>
      workoutLogsRepository.save(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.workoutLogs.all })
      // PRs are derived from set logs; a finished workout may have set a new
      // best, so invalidate so any PR-aware UI re-fetches.
      qc.invalidateQueries({ queryKey: queryKeys.prs })
      // Progression diagnostics also depend on set logs (sessions at rung).
      qc.invalidateQueries({ queryKey: queryKeys.progressions.diagnostics })
    },
  })
}

export function useMovementPRs() {
  return useQuery({
    queryKey: queryKeys.prs,
    queryFn: () => workoutLogsRepository.getAllPRs(),
  })
}
