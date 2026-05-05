import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { db } from '@/db'
import type { WorkoutLog, SetLog } from '@/models/types'
import { generateId } from '@/lib/utils'

export function useWorkoutLogs() {
  return useQuery({
    queryKey: ['workoutLogs'],
    queryFn: () => db.workoutLogs.orderBy('completedAt').reverse().toArray(),
  })
}

export function useWorkoutLog(id: string | undefined) {
  return useQuery({
    queryKey: ['workoutLogs', id],
    queryFn: () => (id ? db.workoutLogs.get(id) : undefined),
    enabled: !!id,
  })
}

export function useSetLogs(workoutLogId: string | undefined) {
  return useQuery({
    queryKey: ['setLogs', workoutLogId],
    queryFn: async () => {
      if (!workoutLogId) return []
      return db.setLogs.where('workoutLogId').equals(workoutLogId).sortBy('order')
    },
    enabled: !!workoutLogId,
  })
}

export function useDeleteWorkoutLog() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await db.transaction('rw', [db.workoutLogs, db.setLogs], async () => {
        await db.setLogs.where('workoutLogId').equals(id).delete()
        await db.workoutLogs.delete(id)
      })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['workoutLogs'] })
      qc.invalidateQueries({ queryKey: ['setLogs'] })
    },
  })
}

export function useSaveWorkoutLog() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: { workoutId: string; workoutName: string; startedAt: number; notes?: string; sets: Omit<SetLog, 'id' | 'workoutLogId'>[] }) => {
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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['workoutLogs'] })
    },
  })
}
