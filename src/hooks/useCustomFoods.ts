import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { customFoodRepository } from '@/repositories'
import type { CustomFood } from '@/models/types'
import { queryKeys } from '@/lib/query-keys'
import { requestSync } from '@/lib/sync-scheduler'

export function useCustomFoods() {
  return useQuery({
    queryKey: queryKeys.customFoods,
    queryFn: () => customFoodRepository.getAll(),
  })
}

export function useCustomFood(id: string | undefined) {
  return useQuery({
    queryKey: [...queryKeys.customFoods, id] as const,
    queryFn: () => customFoodRepository.getById(id!),
    enabled: !!id,
  })
}

export function useCreateCustomFood() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Omit<CustomFood, 'id' | 'createdAt'>) => customFoodRepository.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.customFoods })
      // Coach sync (GitHub mirror): fire-and-forget, see useHistory.ts's
      // useSaveWorkoutLog for the same pattern/rationale.
      void requestSync('nutrition').finally(() => {
        qc.invalidateQueries({ queryKey: queryKeys.settings })
      })
    },
  })
}

export function useUpdateCustomFood() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, changes }: { id: string; changes: Partial<Omit<CustomFood, 'id'>> }) =>
      customFoodRepository.update(id, changes),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.customFoods })
      void requestSync('nutrition').finally(() => {
        qc.invalidateQueries({ queryKey: queryKeys.settings })
      })
    },
  })
}

export function useDeleteCustomFood() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => customFoodRepository.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.customFoods })
      void requestSync('nutrition').finally(() => {
        qc.invalidateQueries({ queryKey: queryKeys.settings })
      })
    },
  })
}
