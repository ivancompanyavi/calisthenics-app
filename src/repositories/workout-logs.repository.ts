import { db } from '@/db'
import type { WorkoutLog, SetLog } from '@/models/types'
import { generateId } from '@/lib/utils'

export interface MovementPR {
  movementId: string
  movementName: string
  bestReps?: number
  bestRepsAt?: number
  bestSeconds?: number
  bestSecondsAt?: number
}

export const workoutLogsRepository = {
  getAll: () => db.workoutLogs.orderBy('completedAt').reverse().toArray(),

  getById: (id: string) => db.workoutLogs.get(id),

  getSetLogs: (workoutLogId: string) =>
    db.setLogs.where('workoutLogId').equals(workoutLogId).sortBy('order'),

  getAllSetLogs: () => db.setLogs.toArray(),

  // Compute personal records (best reps and best hold time) per movement.
  // Skipped sets and zero-value rows are ignored — a zero-rep "logged" set is
  // not a PR. The completedAt timestamp comes from the parent WorkoutLog.
  getAllPRs: async (): Promise<Map<string, MovementPR>> => {
    const [sets, logs] = await Promise.all([
      db.setLogs.toArray(),
      db.workoutLogs.toArray(),
    ])
    const logById = new Map(logs.map((l) => [l.id, l]))
    const prs = new Map<string, MovementPR>()
    for (const set of sets) {
      if (set.skipped) continue
      const log = logById.get(set.workoutLogId)
      const at = log?.completedAt
      const existing = prs.get(set.movementId) ?? {
        movementId: set.movementId,
        movementName: set.movementName,
      }
      const reps = set.actualReps ?? 0
      const secs = set.actualSeconds ?? 0
      if (reps > 0 && (existing.bestReps == null || reps > existing.bestReps)) {
        existing.bestReps = reps
        existing.bestRepsAt = at
      }
      if (secs > 0 && (existing.bestSeconds == null || secs > existing.bestSeconds)) {
        existing.bestSeconds = secs
        existing.bestSecondsAt = at
      }
      // Keep the most recent movementName in case the movement was renamed.
      existing.movementName = set.movementName
      prs.set(set.movementId, existing)
    }
    return prs
  },

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
