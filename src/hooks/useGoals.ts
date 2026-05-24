import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { goalsRepository } from '@/repositories'
import { queryKeys } from '@/lib/query-keys'
import type { Goal } from '@/models/types'

export function useGoals() {
  return useQuery({
    queryKey: queryKeys.goals,
    queryFn: () => goalsRepository.getAll(),
  })
}

export function useCreateGoal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Omit<Goal, 'id' | 'createdAt'>) => goalsRepository.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.goals }),
  })
}

export function useDeleteGoal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => goalsRepository.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.goals }),
  })
}
