import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { measurementRepository } from '@/repositories'
import type { Measurement } from '@/models/types'
import { queryKeys } from '@/lib/query-keys'
import { requestSync } from '@/lib/sync-scheduler'

export function useMeasurements() {
  return useQuery({
    queryKey: queryKeys.measurements,
    queryFn: () => measurementRepository.getAll(),
  })
}

export function useMostRecentMeasurement() {
  return useQuery({
    queryKey: [...queryKeys.measurements, 'recent'] as const,
    queryFn: () => measurementRepository.getMostRecent(),
  })
}

export function useLogMeasurement() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ data, date }: { data: Omit<Measurement, 'id' | 'date'>; date?: number }) =>
      measurementRepository.log(data, date),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.measurements })
      // Coach sync (GitHub mirror): fire-and-forget, see useHistory.ts's
      // useSaveWorkoutLog for the same pattern/rationale.
      void requestSync('measurements').finally(() => {
        qc.invalidateQueries({ queryKey: queryKeys.settings })
      })
    },
  })
}

export function useDeleteMeasurement() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => measurementRepository.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.measurements })
      void requestSync('measurements').finally(() => {
        qc.invalidateQueries({ queryKey: queryKeys.settings })
      })
    },
  })
}
