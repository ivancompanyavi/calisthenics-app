import { db } from '@/db'
import type { InProgressWorkout } from '@/models/types'

// Singleton record — the app only ever has one in-progress workout. We pin it
// to a fixed key so reads are O(1) and writes can't accidentally create a
// second row.
const SINGLETON_ID = 'current'

export const inProgressRepository = {
  get: (): Promise<InProgressWorkout | undefined> =>
    db.inProgressWorkout.get(SINGLETON_ID),

  save: (progress: InProgressWorkout) =>
    db.inProgressWorkout.put({ ...progress, id: SINGLETON_ID }),

  clear: () => db.inProgressWorkout.clear(),
}
