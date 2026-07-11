import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { foodLogRepository } from '@/repositories'
import type { FoodLog } from '@/models/types'
import { queryKeys } from '@/lib/query-keys'
import { requestSync } from '@/lib/sync-scheduler'

export function useFoodLogsForDay(date: number) {
  return useQuery({
    queryKey: queryKeys.foodLogs.day(date),
    queryFn: () => foodLogRepository.getByDay(date),
  })
}

export function useRecentFoodLogs(n: number) {
  return useQuery({
    queryKey: queryKeys.foodLogs.recent(n),
    queryFn: () => foodLogRepository.getRecent(n),
  })
}

export function useDayTotals(date: number) {
  return useQuery({
    queryKey: queryKeys.foodLogs.dayTotals(date),
    queryFn: () => foodLogRepository.dayTotals(date),
  })
}

// Every mutation invalidates the whole foodLogs key space (rather than just
// the affected day) — cheap given expected data volumes, and avoids missing
// a stale day/dayTotals/recent cache entry when a log's date changes.
function invalidateFoodLogs(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: queryKeys.foodLogs.all })
}

export function useAddFoodLog() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (
      data: Omit<FoodLog, 'id' | 'date' | 'loggedAt'> & { date?: number; loggedAt?: number },
    ) => foodLogRepository.add(data),
    onSuccess: () => {
      invalidateFoodLogs(qc)
      // Coach sync (GitHub mirror): fire-and-forget, see useHistory.ts's
      // useSaveWorkoutLog for the same pattern/rationale.
      void requestSync('nutrition').finally(() => {
        qc.invalidateQueries({ queryKey: queryKeys.settings })
      })
    },
  })
}

export function useUpdateFoodLog() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, changes }: { id: string; changes: Partial<Omit<FoodLog, 'id'>> }) =>
      foodLogRepository.update(id, changes),
    onSuccess: () => {
      invalidateFoodLogs(qc)
      void requestSync('nutrition').finally(() => {
        qc.invalidateQueries({ queryKey: queryKeys.settings })
      })
    },
  })
}

export function useDeleteFoodLog() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => foodLogRepository.delete(id),
    onSuccess: () => {
      invalidateFoodLogs(qc)
      void requestSync('nutrition').finally(() => {
        qc.invalidateQueries({ queryKey: queryKeys.settings })
      })
    },
  })
}
