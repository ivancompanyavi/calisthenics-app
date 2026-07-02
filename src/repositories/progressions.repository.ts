import { db } from '@/db'
import type { Movement, Progression, ProgressionLevel, SetLog, SetMode, LevelUpCandidate, WorkoutLog } from '@/models/types'
import { generateId } from '@/lib/utils'
import { hitsTarget, computeRungDiagnostic } from '@/lib/progression-metrics'
import { computeReadinessVerdict } from '@/lib/readiness-engine'
import type { ReadinessVerdict } from '@/lib/readiness-engine'
import type { EvalSession } from '@/lib/progression-metrics'

export interface LevelInput {
  movementId: string
  mode: SetMode
  defaultTargetReps?: number
  defaultTargetSeconds?: number
  perSide?: boolean
}

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
      diagnostics.set(prog.id, computeRungDiagnostic(relevant, completedAtById, now))
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

  /**
   * Decrement currentLevel by 1, flooring at 0 (never goes below the first rung).
   */
  decrementCurrentLevel: async (id: string, currentLevel: number): Promise<void> => {
    const newLevel = Math.max(0, currentLevel - 1)
    await db.progressions.update(id, { currentLevel: newLevel })
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

  // ── Readiness verdicts ─────────────────────────────────────────────────────

  /**
   * Compute a ReadinessVerdict for every progression.
   *
   * Session history derivation:
   *   1. Load all SetLogs whose progressionId matches and movementId matches
   *      the current level's movement — only non-skipped sets (same filter as
   *      getDiagnostics so sessionsAtRung stays consistent).
   *   2. Group by workoutLogId, sort groups by workoutLog.completedAt
   *      oldest → newest.
   *   3. Each group becomes one EvalSession.
   */
  getVerdicts: async (): Promise<Map<string, ReadinessVerdict>> => {
    const [progressions, levels, allSetLogs, workoutLogs] = await Promise.all([
      db.progressions.toArray(),
      db.progressionLevels.toArray(),
      db.setLogs.toArray(),
      db.workoutLogs.toArray(),
    ])

    // Index levels by progression
    const levelsByProgression = new Map<string, ProgressionLevel[]>()
    for (const lvl of levels) {
      const arr = levelsByProgression.get(lvl.progressionId) ?? []
      arr.push(lvl)
      levelsByProgression.set(lvl.progressionId, arr)
    }
    for (const arr of levelsByProgression.values()) arr.sort((a, b) => a.order - b.order)

    // Index setLogs by progressionId → movementId (pre-filtered non-skipped)
    const relevantSets = allSetLogs.filter((s) => s.progressionId != null && !s.skipped)

    // Index workoutLog timestamps for sorting and diagnostic
    const completedAtById = new Map(workoutLogs.map((l) => [l.id, l.completedAt]))
    const now = Date.now()

    const verdicts = new Map<string, ReadinessVerdict>()

    for (const prog of progressions) {
      const progLevels = levelsByProgression.get(prog.id) ?? []
      const currentLevelObj = progLevels[prog.currentLevel]
      if (!currentLevelObj) continue

      const currentMovementId = currentLevelObj.movementId

      // Sets for this progression at the current rung
      const rungSets = relevantSets.filter(
        (s) => s.progressionId === prog.id && s.movementId === currentMovementId,
      )

      // Compute diagnostic (sessionsAtRung, daysAtRung, stuck) — same logic as getDiagnostics
      const { sessionsAtRung, daysAtRung } = computeRungDiagnostic(rungSets, completedAtById, now)

      // Build session history: group by workoutLogId, sorted oldest → newest
      const setsByLog = new Map<string, SetLog[]>()
      for (const s of rungSets) {
        const arr = setsByLog.get(s.workoutLogId) ?? []
        arr.push(s)
        setsByLog.set(s.workoutLogId, arr)
      }

      // Sort workoutLog ids by completedAt, oldest first
      const sortedLogIds = [...setsByLog.keys()].sort((a, b) => {
        const ta = completedAtById.get(a) ?? 0
        const tb = completedAtById.get(b) ?? 0
        return ta - tb
      })

      const sessionHistory: EvalSession[] = sortedLogIds.map((logId) => ({
        sets: setsByLog.get(logId) ?? [],
      }))

      verdicts.set(
        prog.id,
        computeReadinessVerdict({
          sessionHistory,
          criteria: currentLevelObj.exitCriteria,
          sessionsAtRung,
          daysAtRung,
          dismissedAtSessionCount: prog.dismissedAtSessionCount,
          // Max-mode rungs (planche, lever, handstand holds) have no target to
          // hit, so they use the relative-to-own-best hold rule.
          holdMode: currentLevelObj.mode === 'max',
        }),
      )
    }

    return verdicts
  },

  /**
   * Persist the snooze state for a progression's advance-suggestion card.
   * Non-indexed fields → no Dexie version bump needed.
   */
  dismissVerdict: async (progressionId: string, dismissedAtSessionCount: number): Promise<void> => {
    await db.progressions.update(progressionId, {
      dismissedAt: Date.now(),
      dismissedAtSessionCount,
    })
  },

  /**
   * Clear the snooze state (called after the user advances, so a fresh
   * verdict on the new rung starts without a stale dismissedAtSessionCount).
   */
  clearDismissal: async (progressionId: string): Promise<void> => {
    await db.progressions.update(progressionId, {
      dismissedAt: undefined,
      dismissedAtSessionCount: undefined,
    })
  },
}
