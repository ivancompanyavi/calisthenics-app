import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { bodyweightRepository } from '@/repositories'
import { queryKeys } from '@/lib/query-keys'
import { requestSync } from '@/lib/sync-scheduler'

export function useBodyweightLogs() {
  return useQuery({
    queryKey: queryKeys.bodyweight,
    queryFn: () => bodyweightRepository.getAll(),
  })
}

export function useMostRecentBodyweight() {
  return useQuery({
    queryKey: [...queryKeys.bodyweight, 'recent'] as const,
    queryFn: () => bodyweightRepository.getMostRecent(),
  })
}

export function useLogBodyweight() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ kg, notes, date }: { kg: number; notes?: string; date?: number }) =>
      bodyweightRepository.log(kg, notes, date),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.bodyweight })
      // Insights overlays bodyweight on the lift trends — keep it in sync.
      qc.invalidateQueries({ queryKey: queryKeys.insights })
      // Coach sync (GitHub mirror): fire-and-forget, see useHistory.ts's
      // useSaveWorkoutLog for the same pattern/rationale.
      void requestSync('bodyweight').finally(() => {
        qc.invalidateQueries({ queryKey: queryKeys.settings })
      })
    },
  })
}

export function useDeleteBodyweight() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => bodyweightRepository.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.bodyweight })
      // Insights overlays bodyweight on the lift trends — keep it in sync.
      qc.invalidateQueries({ queryKey: queryKeys.insights })
    },
  })
}
