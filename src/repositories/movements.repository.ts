import { db } from '@/db'
import type { Movement } from '@/models/types'
import { generateId } from '@/lib/utils'

export const movementsRepository = {
  getAll: () => db.movements.orderBy('name').toArray(),

  getById: (id: string) => db.movements.get(id),

  create: async (data: Omit<Movement, 'id' | 'createdAt'>) => {
    const movement: Movement = {
      ...data,
      id: generateId(),
      createdAt: Date.now(),
    }
    await db.movements.add(movement)
    return movement
  },

  update: async (id: string, data: Partial<Omit<Movement, 'id' | 'createdAt'>>) => {
    await db.movements.update(id, data)
  },

  delete: async (id: string) => {
    await db.transaction('rw', [db.movements, db.progressionLevels], async () => {
      await db.movements.delete(id)
      await db.progressionLevels.where('movementId').equals(id).delete()
    })
  },
}
