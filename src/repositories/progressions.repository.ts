import { db } from '@/db'
import type { Movement, Progression, ProgressionLevel, SetLog, SetMode, LevelUpCandidate, WorkoutLog } from '@/models/types'
import { generateId } from '@/lib/utils'

// "Hit target" predicate, shared between the current-workout check and the
// prior-workout check. Returns true only if a definite target was met — a
// set with neither targetReps/actualReps nor targetSeconds/actualSeconds
// counts as a miss (which matches the old behavior).
function hitsTarget(s: SetLog): boolean {
  if (s.actualReps != null && s.targetReps != null) return s.actualReps >= s.targetReps
  if (s.actualSeconds != null && s.targetSeconds != null) return s.actualSeconds >= s.targetSeconds
  return false
}

export interface LevelInput {
  movementId: string
  mode: SetMode
  defaultTargetReps?: number
  defaultTargetSeconds?: number
  perSide?: boolean
}

// Heuristic: a progression is "stuck" when the user has trained the current
// rung for >= STUCK_SESSIONS or >= STUCK_DAYS without leveling up. Either
// trigger fires the diagnostic — sessions catches frequent trainers, days
// catches sparse trainers who never quite accumulate volume.
const STUCK_SESSIONS = 8
const STUCK_DAYS = 28

export interface ProgressionDiagnostic {
  sessionsAtRung: number
  daysAtRung: number
  stuck: boolean
}

export const progressionsRepository = {
  getAll: async () => {
    const progressions = await db.progressions.orderBy('name').toArray()
    const allLevels = await db.progressionLevels.toArray()
    const levelCounts = new Map<string, number>()
    for (const level of allLevels) {
      levelCounts.set(level.progressionId, (levelCounts.get(level.progressionId) ?? 0) + 1)
    }
    return progressions.map((p) => ({ ...p, levelCount: levelCounts.get(p.id) ?? 0 }))
  },

  // For each progression, compute how many sessions and days have been spent
  // at the current rung. "At the current rung" = SetLogs where progressionId
  // matches AND the SetLog's movementId equals the current level's movementId
  // (so prior-rung work doesn't count even if it carried the same progression
  // pointer at the time).
  getDiagnostics: async (): Promise<Map<string, ProgressionDiagnostic>> => {
    const [progressions, levels, allSetLogs, workoutLogs] = await Promise.all([
      db.progressions.toArray(),
      db.progressionLevels.toArray(),
      db.setLogs.toArray(),
      db.workoutLogs.toArray(),
    ])
    // Filter in memory rather than relying on an indexed range query, which
    // can behave inconsistently across browsers when the indexed field is
    // optional and many rows have it unset.
    const setLogs = allSetLogs.filter((s) => s.progressionId != null)

    const levelsByProgression = new Map<string, ProgressionLevel[]>()
    for (const lvl of levels) {
      const arr = levelsByProgression.get(lvl.progressionId) ?? []
      arr.push(lvl)
      levelsByProgression.set(lvl.progressionId, arr)
    }
    for (const arr of levelsByProgression.values()) arr.sort((a, b) => a.order - b.order)

    const completedAtById = new Map(workoutLogs.map((l) => [l.id, l.completedAt]))
    const now = Date.now()
    const dayMs = 24 * 60 * 60 * 1000

    const diagnostics = new Map<string, ProgressionDiagnostic>()
    for (const prog of progressions) {
      const progLevels = levelsByProgression.get(prog.id) ?? []
      const currentMovementId = progLevels[prog.currentLevel]?.movementId
      if (!currentMovementId) continue

      const relevant = setLogs.filter(
        (s) =>
          s.progressionId === prog.id &&
          s.movementId === currentMovementId &&
          !s.skipped,
      )
      if (relevant.length === 0) {
        diagnostics.set(prog.id, { sessionsAtRung: 0, daysAtRung: 0, stuck: false })
        continue
      }

      const sessionIds = new Set(relevant.map((s) => s.workoutLogId))
      let earliest = Infinity
      for (const id of sessionIds) {
        const at = completedAtById.get(id)
        if (at != null && at < earliest) earliest = at
      }
      const daysAtRung = earliest === Infinity ? 0 : Math.floor((now - earliest) / dayMs)
      const sessionsAtRung = sessionIds.size
      diagnostics.set(prog.id, {
        sessionsAtRung,
        daysAtRung,
        stuck: sessionsAtRung >= STUCK_SESSIONS || daysAtRung >= STUCK_DAYS,
      })
    }
    return diagnostics
  },

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

  // Returns the progressions where the user just hit every target in the
  // current workout AND hit every target in the most recent PRIOR workout
  // that touched that movement.
  //
  // Algorithm:
  //   1. Pre-fetch all progressions, their levels, current+next movements,
  //      and historical setLogs for the relevant movements — bounded by N+1
  //      where N is constant in the number of progressions, not entries.
  //   2. For each progression, check current-workout pass.
  //   3. For passing progressions, find the most recent prior workoutLog
  //      that contains sets for the current-level movement (sorted by
  //      completedAt — not by setLog insertion order, which was the old bug).
  //   4. Return candidates where both checks pass.
  checkReadiness: async (progressionIds: string[], currentSets: SetLog[]): Promise<LevelUpCandidate[]> => {
    if (progressionIds.length === 0) return []

    const progressions = (await db.progressions.bulkGet(progressionIds)).filter(
      (p): p is Progression => !!p,
    )
    if (progressions.length === 0) return []

    const validIds = progressions.map((p) => p.id)
    const allLevels = await db.progressionLevels
      .where('progressionId')
      .anyOf(validIds)
      .sortBy('order')

    const levelsByProgression = new Map<string, ProgressionLevel[]>()
    for (const lvl of allLevels) {
      const arr = levelsByProgression.get(lvl.progressionId) ?? []
      arr.push(lvl)
      levelsByProgression.set(lvl.progressionId, arr)
    }

    // For each progression, identify the current movement we'd need to pass
    // and the next movement we'd promote to. Skip progressions already at
    // the top of the ladder.
    const checks = progressions
      .map((progression) => {
        const levels = levelsByProgression.get(progression.id) ?? []
        if (progression.currentLevel >= levels.length - 1) return null
        const currentLevel = levels[progression.currentLevel]
        if (!currentLevel) return null
        const nextLevel = levels[progression.currentLevel + 1]
        return {
          progression,
          currentMovementId: currentLevel.movementId,
          nextMovementId: nextLevel?.movementId,
        }
      })
      .filter((c): c is NonNullable<typeof c> => c !== null)

    if (checks.length === 0) return []

    const movementIds = [
      ...new Set(
        checks.flatMap((c) => [c.currentMovementId, c.nextMovementId].filter(Boolean) as string[]),
      ),
    ]
    const movementsArr = await db.movements.bulkGet(movementIds)
    const movementById = new Map<string, Movement>()
    for (const m of movementsArr) {
      if (m) movementById.set(m.id, m)
    }

    // Pull all historical setLogs for the relevant movements in one query.
    // We then group by movementId so the per-progression loop below is
    // pure-functional over already-loaded data.
    const currentMovementIds = checks.map((c) => c.currentMovementId)
    const allHistorical = currentMovementIds.length > 0
      ? await db.setLogs.where('movementId').anyOf(currentMovementIds).toArray()
      : []
    const historicalByMovement = new Map<string, SetLog[]>()
    for (const s of allHistorical) {
      const arr = historicalByMovement.get(s.movementId) ?? []
      arr.push(s)
      historicalByMovement.set(s.movementId, arr)
    }

    // Bulk-fetch every workoutLog referenced by the historical sets so we can
    // order prior workouts by completedAt, not by setLog insertion order.
    const allLogIds = [...new Set(allHistorical.map((s) => s.workoutLogId))]
    const workoutLogs = allLogIds.length > 0 ? await db.workoutLogs.bulkGet(allLogIds) : []
    const workoutLogById = new Map<string, WorkoutLog>()
    for (const w of workoutLogs) {
      if (w) workoutLogById.set(w.id, w)
    }

    const candidates: LevelUpCandidate[] = []

    for (const { progression, currentMovementId, nextMovementId } of checks) {
      const movement = movementById.get(currentMovementId)
      if (!movement) continue

      // Check 1: every set for this movement in the current workout hit its
      // target. Empty (movement wasn't trained this workout) → not a candidate.
      const currentSetsForMovement = currentSets.filter((s) => s.movementId === movement.id)
      if (currentSetsForMovement.length === 0) continue
      if (!currentSetsForMovement.every(hitsTarget)) continue

      // Check 2: find the most recent prior workout that contained any sets
      // for this movement, and verify all of its sets for that movement also
      // hit target. "Most recent" is by workoutLog.completedAt — not by
      // setLog id or index order.
      const historical = historicalByMovement.get(movement.id) ?? []
      const setsByLog = new Map<string, SetLog[]>()
      for (const s of historical) {
        const arr = setsByLog.get(s.workoutLogId) ?? []
        arr.push(s)
        setsByLog.set(s.workoutLogId, arr)
      }

      let mostRecentLog: WorkoutLog | undefined
      for (const logId of setsByLog.keys()) {
        const log = workoutLogById.get(logId)
        if (!log) continue
        if (!mostRecentLog || log.completedAt > mostRecentLog.completedAt) {
          mostRecentLog = log
        }
      }
      if (!mostRecentLog) continue

      const priorSets = setsByLog.get(mostRecentLog.id) ?? []
      if (priorSets.length === 0 || !priorSets.every(hitsTarget)) continue

      const nextMovement = nextMovementId ? movementById.get(nextMovementId) : undefined
      candidates.push({
        progressionId: progression.id,
        progressionName: progression.name,
        nextMovementName: nextMovement?.name ?? 'Next level',
      })
    }

    return candidates
  },
}
