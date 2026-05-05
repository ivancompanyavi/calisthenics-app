import { db } from '@/db'
import type { WorkoutLog, SetLog } from '@/models/types'
import { generateId } from '@/lib/utils'

export const workoutLogsRepository = {
  getAll: () => db.workoutLogs.orderBy('completedAt').reverse().toArray(),

  getById: (id: string) => db.workoutLogs.get(id),

  getSetLogs: (workoutLogId: string) =>
    db.setLogs.where('workoutLogId').equals(workoutLogId).sortBy('order'),

  getAllSetLogs: () => db.setLogs.toArray(),

  save: async (data: {
    workoutId: string
    workoutName: string
    startedAt: number
    notes?: string
    sets: Omit<SetLog, 'id' | 'workoutLogId'>[]
  }) => {
    const logId = generateId()
    const log: WorkoutLog = {
      id: logId,
      workoutId: data.workoutId,
      workoutName: data.workoutName,
      startedAt: data.startedAt,
      completedAt: Date.now(),
      notes: data.notes || undefined,
    }
    const setLogs: SetLog[] = data.sets.map((s, i) => ({
      ...s,
      id: generateId(),
      workoutLogId: logId,
      order: i,
    }))
    await db.transaction('rw', [db.workoutLogs, db.setLogs], async () => {
      await db.workoutLogs.add(log)
      await db.setLogs.bulkAdd(setLogs)
    })
    return logId
  },

  delete: async (id: string) => {
    await db.transaction('rw', [db.workoutLogs, db.setLogs], async () => {
      await db.setLogs.where('workoutLogId').equals(id).delete()
      await db.workoutLogs.delete(id)
    })
  },
}
