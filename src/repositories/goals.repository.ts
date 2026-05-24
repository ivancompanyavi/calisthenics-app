import { db } from '@/db'
import type { Goal } from '@/models/types'
import { generateId } from '@/lib/utils'

export const goalsRepository = {
  getAll: () => db.goals.orderBy('createdAt').reverse().toArray(),

  getForMovement: (movementId: string) =>
    db.goals.where('movementId').equals(movementId).toArray(),

  create: async (data: Omit<Goal, 'id' | 'createdAt'>): Promise<Goal> => {
    const goal: Goal = {
      id: generateId(),
      createdAt: Date.now(),
      ...data,
    }
    await db.goals.add(goal)
    return goal
  },

  update: async (id: string, changes: Partial<Omit<Goal, 'id'>>) => {
    await db.goals.update(id, changes)
  },

  delete: (id: string) => db.goals.delete(id),
}
