import { db } from '@/db'
import type { CustomFood } from '@/models/types'
import { generateId } from '@/lib/utils'

export const customFoodRepository = {
  getAll: () => db.customFoods.orderBy('name').toArray(),

  getById: (id: string) => db.customFoods.get(id),

  create: async (data: Omit<CustomFood, 'id' | 'createdAt'>): Promise<CustomFood> => {
    const food: CustomFood = {
      id: generateId(),
      createdAt: Date.now(),
      ...data,
    }
    await db.customFoods.add(food)
    return food
  },

  update: async (id: string, changes: Partial<Omit<CustomFood, 'id'>>) => {
    await db.customFoods.update(id, changes)
  },

  delete: (id: string) => db.customFoods.delete(id),
}
