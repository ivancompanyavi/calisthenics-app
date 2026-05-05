import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'
import { inProgressRepository } from '@/repositories'

export function useInProgressWorkout() {
  return useQuery({
    queryKey: queryKeys.inProgress,
    queryFn: () => inProgressRepository.get(),
  })
}

export function useDiscardInProgress() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => inProgressRepository.clear(),
    onSuccess: () => {
      qc.removeQueries({ queryKey: queryKeys.inProgress })
    },
  })
}
