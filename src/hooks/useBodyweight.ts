import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { bodyweightRepository } from '@/repositories'
import { queryKeys } from '@/lib/query-keys'

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
    mutationFn: ({ kg, notes }: { kg: number; notes?: string }) =>
      bodyweightRepository.log(kg, notes),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.bodyweight })
      // Insights overlays bodyweight on the lift trends — keep it in sync.
      qc.invalidateQueries({ queryKey: queryKeys.insights })
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
