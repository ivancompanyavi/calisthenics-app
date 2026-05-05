import { db } from '@/db'
import type { Progression, ProgressionLevel, SetLog, SetMode, LevelUpCandidate } from '@/models/types'
import { generateId } from '@/lib/utils'

export interface LevelInput {
  movementId: string
  mode: SetMode
  defaultTargetReps?: number
  defaultTargetSeconds?: number
  perSide?: boolean
}

export const progressionsRepository = {
  getAll: () => db.progressions.orderBy('name').toArray(),

  getById: (id: string) => db.progressions.get(id),

  getLevels: async (progressionId: string) => {
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

  create: async (data: { name: string; levels: LevelInput[] }) => {
    const progression: Progression = {
      id: generateId(),
      name: data.name,
      currentLevel: 0,
      createdAt: Date.now(),
    }
    const levels: ProgressionLevel[] = data.levels.map((lvl, i) => ({
      id: generateId(),
      progressionId: progression.id,
      movementId: lvl.movementId,
      order: i,
      mode: lvl.mode,
      defaultTargetReps: lvl.defaultTargetReps,
      defaultTargetSeconds: lvl.defaultTargetSeconds,
      perSide: lvl.perSide,
    }))
    await db.transaction('rw', [db.progressions, db.progressionLevels], async () => {
      await db.progressions.add(progression)
      await db.progressionLevels.bulkAdd(levels)
    })
    return progression
  },

  update: async (data: { id: string; name: string; currentLevel?: number; levels: LevelInput[] }) => {
    await db.transaction('rw', [db.progressions, db.progressionLevels], async () => {
      await db.progressions.update(data.id, {
        name: data.name,
        ...(data.currentLevel !== undefined && { currentLevel: data.currentLevel }),
      })
      await db.progressionLevels.where('progressionId').equals(data.id).delete()
      const levels: ProgressionLevel[] = data.levels.map((lvl, i) => ({
        id: generateId(),
        progressionId: data.id,
        movementId: lvl.movementId,
        order: i,
        mode: lvl.mode,
        defaultTargetReps: lvl.defaultTargetReps,
        defaultTargetSeconds: lvl.defaultTargetSeconds,
        perSide: lvl.perSide,
      }))
      await db.progressionLevels.bulkAdd(levels)
    })
  },

  delete: async (id: string) => {
    await db.transaction('rw', [db.progressions, db.progressionLevels], async () => {
      await db.progressions.delete(id)
      await db.progressionLevels.where('progressionId').equals(id).delete()
    })
  },

  updateCurrentLevel: async (id: string, currentLevel: number) => {
    await db.progressions.update(id, { currentLevel })
  },

  checkReadiness: async (progressionIds: string[], currentSets: SetLog[]): Promise<LevelUpCandidate[]> => {
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

      const prevSetLogs = await db.setLogs
        .where('movementId')
        .equals(movement.id)
        .reverse()
        .limit(20)
        .toArray()

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
}
