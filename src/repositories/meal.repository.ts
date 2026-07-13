import { db } from '@/db'
import type { Meal, FoodLog, MealLabel } from '@/models/types'
import { generateId } from '@/lib/utils'
import { foodLogRepository } from './foodLog.repository'

export const mealRepository = {
  getAll: () => db.meals.orderBy('name').toArray(),

  getById: (id: string) => db.meals.get(id),

  create: async (data: Omit<Meal, 'id' | 'createdAt'>): Promise<Meal> => {
    const meal: Meal = { id: generateId(), createdAt: Date.now(), ...data }
    await db.meals.add(meal)
    return meal
  },

  update: async (id: string, changes: Partial<Omit<Meal, 'id'>>) => {
    await db.meals.update(id, changes)
  },

  delete: (id: string) => db.meals.delete(id),

  // Expands a meal into one FoodLog per ingredient on the given day. Each entry
  // is written through foodLogRepository.add (same path as manual logging and
  // copyDay) so id-generation / date-normalization stay centralized. All
  // entries share one label: the explicit `mealLabel` argument if given, else
  // the meal's own default. Item macros are already scaled (snapshotted), so
  // they're written verbatim.
  logMeal: async (
    mealId: string,
    date: number,
    mealLabel?: MealLabel,
  ): Promise<FoodLog[]> => {
    const meal = await db.meals.get(mealId)
    if (!meal) return []
    const label = mealLabel ?? meal.mealLabel
    const created: FoodLog[] = []
    for (const item of meal.items) {
      const log = await foodLogRepository.add({
        date,
        mealLabel: label,
        source: item.source,
        refId: item.refId,
        name: item.name,
        quantityG: item.quantityG,
        servings: item.servings,
        kcal: item.kcal,
        proteinG: item.proteinG,
        carbG: item.carbG,
        fatG: item.fatG,
        fiberG: item.fiberG,
      })
      created.push(log)
    }
    return created
  },
}
