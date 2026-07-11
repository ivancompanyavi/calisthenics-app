import { db } from '@/db'
import type { NutritionTarget } from '@/models/types'
import { generateId } from '@/lib/utils'

export const nutritionTargetRepository = {
  getAll: () => db.nutritionTargets.orderBy('effectiveDate').reverse().toArray(),

  // Targets are dated, not mutated in place — a change inserts a new row.
  // The "current" target is whichever row has the latest effectiveDate.
  setTarget: async (data: Omit<NutritionTarget, 'id'>): Promise<NutritionTarget> => {
    const target: NutritionTarget = { id: generateId(), ...data }
    await db.nutritionTargets.add(target)
    return target
  },

  getCurrent: async (): Promise<NutritionTarget | undefined> => {
    return db.nutritionTargets.orderBy('effectiveDate').reverse().first()
  },

  delete: (id: string) => db.nutritionTargets.delete(id),
}
