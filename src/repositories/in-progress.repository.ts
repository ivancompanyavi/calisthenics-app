import { db } from '@/db'
import type { InProgressWorkout } from '@/models/types'

export const inProgressRepository = {
  get: async (): Promise<InProgressWorkout | undefined> => {
    const all = await db.inProgressWorkout.toArray()
    return all[0]
  },

  save: (progress: InProgressWorkout) => db.inProgressWorkout.put(progress),

  clear: () => db.inProgressWorkout.clear(),
}
