import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { nutritionTargetRepository } from '@/repositories'
import type { NutritionTarget } from '@/models/types'
import { queryKeys } from '@/lib/query-keys'
import { requestSync } from '@/lib/sync-scheduler'

export function useNutritionTargets() {
  return useQuery({
    queryKey: queryKeys.nutritionTargets.all,
    queryFn: () => nutritionTargetRepository.getAll(),
  })
}

export function useCurrentNutritionTarget() {
  return useQuery({
    queryKey: queryKeys.nutritionTargets.current,
    queryFn: () => nutritionTargetRepository.getCurrent(),
  })
}

export function useSetNutritionTarget() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Omit<NutritionTarget, 'id'>) => nutritionTargetRepository.setTarget(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.nutritionTargets.all })
      qc.invalidateQueries({ queryKey: queryKeys.nutritionTargets.current })
      // Coach sync (GitHub mirror): fire-and-forget, see useHistory.ts's
      // useSaveWorkoutLog for the same pattern/rationale.
      void requestSync('nutrition').finally(() => {
        qc.invalidateQueries({ queryKey: queryKeys.settings })
      })
    },
  })
}

export function useDeleteNutritionTarget() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => nutritionTargetRepository.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.nutritionTargets.all })
      qc.invalidateQueries({ queryKey: queryKeys.nutritionTargets.current })
      void requestSync('nutrition').finally(() => {
        qc.invalidateQueries({ queryKey: queryKeys.settings })
      })
    },
  })
}
