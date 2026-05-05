import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { db } from '@/db'
import type { Progression, ProgressionLevel, SetLog } from '@/models/types'
import { generateId } from '@/lib/utils'
import type { LevelUpCandidate } from '@/components/execution/CompleteScreen'

export function useProgressions() {
  return useQuery({
    queryKey: ['progressions'],
    queryFn: () => db.progressions.orderBy('name').toArray(),
  })
}

export function useProgression(id: string | undefined) {
  return useQuery({
    queryKey: ['progressions', id],
    queryFn: () => (id ? db.progressions.get(id) : undefined),
    enabled: !!id,
  })
}

export function useProgressionLevels(progressionId: string | undefined) {
  return useQuery({
    queryKey: ['progressionLevels', progressionId],
    queryFn: async () => {
      if (!progressionId) return []
      const levels = await db.progressionLevels
        .where('progressionId')
        .equals(progressionId)
        .sortBy('order')
      const movementIds = levels.map((l) => l.movementId)
      const movements = await db.movements.bulkGet(movementIds)
      return levels.map((level, i) => ({
        ...level,
        movement: movements[i],
      }))
    },
    enabled: !!progressionId,
  })
}

export function useCreateProgression() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: { name: string; movementIds: string[] }) => {
      const progression: Progression = {
        id: generateId(),
        name: data.name,
        currentLevel: 0,
        createdAt: Date.now(),
      }
      const levels: ProgressionLevel[] = data.movementIds.map((movementId, i) => ({
        id: generateId(),
        progressionId: progression.id,
        movementId,
        order: i,
      }))
      await db.transaction('rw', [db.progressions, db.progressionLevels], async () => {
        await db.progressions.add(progression)
        await db.progressionLevels.bulkAdd(levels)
      })
      return progression
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['progressions'] })
    },
  })
}

export function useUpdateProgression() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: { id: string; name: string; currentLevel?: number; movementIds: string[] }) => {
      await db.transaction('rw', [db.progressions, db.progressionLevels], async () => {
        await db.progressions.update(data.id, {
          name: data.name,
          ...(data.currentLevel !== undefined && { currentLevel: data.currentLevel }),
        })
        await db.progressionLevels.where('progressionId').equals(data.id).delete()
        const levels: ProgressionLevel[] = data.movementIds.map((movementId, i) => ({
          id: generateId(),
          progressionId: data.id,
          movementId,
          order: i,
        }))
        await db.progressionLevels.bulkAdd(levels)
      })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['progressions'] })
      qc.invalidateQueries({ queryKey: ['progressionLevels'] })
    },
  })
}

export function useDeleteProgression() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await db.transaction('rw', [db.progressions, db.progressionLevels], async () => {
        await db.progressions.delete(id)
        await db.progressionLevels.where('progressionId').equals(id).delete()
      })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['progressions'] })
    },
  })
}

export function useUpdateCurrentLevel() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, currentLevel }: { id: string; currentLevel: number }) => {
      await db.progressions.update(id, { currentLevel })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['progressions'] })
    },
  })
}

/**
 * Checks which progressions are ready to level up.
 * A progression is ready if it hit targets in the current session AND
 * the most recent previous session for the same movement.
 */
export function useProgressionReadiness(progressionIds: string[], currentSets: SetLog[]) {
  return useQuery({
    queryKey: ['progressionReadiness', progressionIds, currentSets.length],
    queryFn: async (): Promise<LevelUpCandidate[]> => {
      const candidates: LevelUpCandidate[] = []

      for (const progressionId of progressionIds) {
        const progression = await db.progressions.get(progressionId)
        if (!progression) continue

        const levels = await db.progressionLevels
          .where('progressionId')
          .equals(progressionId)
          .sortBy('order')

        const currentLevel = progression.currentLevel
        if (currentLevel >= levels.length - 1) continue

        const level = levels[currentLevel]
        if (!level) continue

        const movement = await db.movements.get(level.movementId)
        if (!movement) continue

        const setsForMovement = currentSets.filter((s) => s.movementId === movement.id)
        const allHitTargetCurrent = setsForMovement.length > 0 && setsForMovement.every((s) => {
          if (s.actualReps != null && s.targetReps != null) return s.actualReps >= s.targetReps
          if (s.actualSeconds != null && s.targetSeconds != null) return s.actualSeconds >= s.targetSeconds
          return false
        })

        if (!allHitTargetCurrent) continue

        // Check the most recent previous session
        const prevSetLogs = await db.setLogs
          .where('movementId')
          .equals(movement.id)
          .reverse()
          .limit(20)
          .toArray()

        // Filter to logs from a different workout session
        const prevWorkoutLogIds = [...new Set(prevSetLogs.map((s) => s.workoutLogId))]
        let hitTargetPrevious = false
        for (const logId of prevWorkoutLogIds) {
          const prevSets = prevSetLogs.filter((s) => s.workoutLogId === logId)
          const allHit = prevSets.every((s) => {
            if (s.actualReps != null && s.targetReps != null) return s.actualReps >= s.targetReps
            if (s.actualSeconds != null && s.targetSeconds != null) return s.actualSeconds >= s.targetSeconds
            return false
          })
          if (allHit) {
            hitTargetPrevious = true
            break
          }
        }

        if (!hitTargetPrevious) continue

        const nextLevel = levels[currentLevel + 1]
        const nextMovement = nextLevel ? await db.movements.get(nextLevel.movementId) : undefined

        candidates.push({
          progressionId,
          progressionName: progression.name,
          nextMovementName: nextMovement?.name ?? 'Next level',
        })
      }

      return candidates
    },
    enabled: progressionIds.length > 0,
  })
}
