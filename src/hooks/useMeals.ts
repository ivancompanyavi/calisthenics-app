import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { mealRepository } from '@/repositories'
import type { Meal, MealLabel } from '@/models/types'
import { queryKeys } from '@/lib/query-keys'
import { requestSync } from '@/lib/sync-scheduler'

export function useMeals() {
  return useQuery({
    queryKey: queryKeys.meals,
    queryFn: () => mealRepository.getAll(),
  })
}

export function useMeal(id: string | undefined) {
  return useQuery({
    queryKey: [...queryKeys.meals, id] as const,
    queryFn: () => (id ? mealRepository.getById(id) : undefined),
    enabled: !!id,
  })
}

// Coach sync (GitHub mirror): fire-and-forget after each mutation, matching the
// pattern in useFoodLog / useCustomFoods.
function syncNutrition(qc: ReturnType<typeof useQueryClient>) {
  void requestSync('nutrition').finally(() => {
    qc.invalidateQueries({ queryKey: queryKeys.settings })
  })
}

export function useCreateMeal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Omit<Meal, 'id' | 'createdAt'>) => mealRepository.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.meals })
      syncNutrition(qc)
    },
  })
}

export function useUpdateMeal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, changes }: { id: string; changes: Partial<Omit<Meal, 'id'>> }) =>
      mealRepository.update(id, changes),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.meals })
      syncNutrition(qc)
    },
  })
}

export function useDeleteMeal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => mealRepository.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.meals })
      syncNutrition(qc)
    },
  })
}

// Logging a meal writes multiple FoodLogs, so invalidate the whole foodLogs key
// space (like useAddFoodLog does).
export function useLogMeal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ mealId, date, mealLabel }: { mealId: string; date: number; mealLabel?: MealLabel }) =>
      mealRepository.logMeal(mealId, date, mealLabel),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.foodLogs.all })
      syncNutrition(qc)
    },
  })
}
