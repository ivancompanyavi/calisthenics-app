import { db } from '@/db'
import type { WorkoutLog, SetLog } from '@/models/types'
import { generateId } from '@/lib/utils'
import { deriveRepsSuggestion } from '@/lib/progression-metrics'

// Canonical name of the opt-in Test Day workout in seed. Used to flag
// PRs that were achieved during a dedicated max-testing session.
const TEST_DAY_WORKOUT_NAME = 'Test Day (Week 6)'

// How long a PR counts as evidence of CURRENT form. Entry gates (progression
// unlocks) evaluate against bests inside this window, so a line earned on a
// good day months ago re-locks after a layoff instead of the app programming
// for peak-you forever. All-time bests still exist for display and the Atlas.
export const GATE_EVIDENCE_WINDOW_DAYS = 56 // 8 weeks
export const GATE_EVIDENCE_WINDOW_MS = GATE_EVIDENCE_WINDOW_DAYS * 24 * 60 * 60 * 1000

export interface MovementPR {
  movementId: string
  movementName: string
  bestReps?: number
  bestRepsAt?: number
  // True when the best-reps set was achieved during a Test Day session.
  bestRepsTestDay?: boolean
  bestSeconds?: number
  bestSecondsAt?: number
  // True when the best-seconds set was achieved during a Test Day session.
  bestSecondsTestDay?: boolean
  // Bests within GATE_EVIDENCE_WINDOW of now — "current form" as opposed to
  // the all-time fields above. Sets whose parent log has no completedAt can't
  // prove recency and are excluded. Consumed by the progression entry gate.
  recentBestReps?: number
  recentBestRepsAt?: number
  recentBestSeconds?: number
  recentBestSecondsAt?: number
}

// Auto-progression suggestion for one (workoutId, movementId) tuple. Carries
// the bump direction and a human-readable reason ("clean hit — bump", "missed
// last set", "no history"). Scoped per-workout so Pull A and Pull B don't
// cross-contaminate even though they share Pull-Up Progression at the same
// rung.
export interface RepsSuggestion {
  suggestedReps: number
  reason: string
}

export const workoutLogsRepository = {
  getAll: () => db.workoutLogs.orderBy('completedAt').reverse().toArray(),

  getById: (id: string) => db.workoutLogs.get(id),

  getSetLogs: (workoutLogId: string) =>
    db.setLogs.where('workoutLogId').equals(workoutLogId).sortBy('order'),

  getAllSetLogs: () => db.setLogs.toArray(),

  // For a given workout, return a per-movement next-session reps suggestion
  // based on that workout's last completed run. Rule: if last session was a
  // clean hit (all sets met target, all logged RIR >= 2), suggest max
  // actualReps + 1. Otherwise no suggestion (caller falls back to the entry's
  // prescribed target). Scoped to workoutId so Pull A's history doesn't leak
  // into Pull B even though they share the same movement.
  getRepsSuggestions: async (
    workoutId: string,
    movementIds: string[],
  ): Promise<Map<string, RepsSuggestion>> => {
    if (movementIds.length === 0) return new Map()
    // Most-recent first. Dexie's sortBy returns ascending; reverse in-array
    // since chaining .reverse() before sortBy() doesn't reorder the sort key.
    const logs = await db.workoutLogs
      .where('workoutId')
      .equals(workoutId)
      .sortBy('completedAt')
    if (logs.length === 0) return new Map()
    logs.reverse()

    const logIds = logs.map((l) => l.id)
    const allSets = await db.setLogs
      .where('workoutLogId')
      .anyOf(logIds)
      .toArray()

    // Group sets by (logId, movementId).
    const byLogMovement = new Map<string, SetLog[]>()
    for (const s of allSets) {
      const k = `${s.workoutLogId}::${s.movementId}`
      const arr = byLogMovement.get(k) ?? []
      arr.push(s)
      byLogMovement.set(k, arr)
    }

    const suggestions = new Map<string, RepsSuggestion>()
    for (const movementId of movementIds) {
      for (const log of logs) {
        const sets = byLogMovement.get(`${log.id}::${movementId}`)
        if (!sets || sets.length === 0) continue
        // Found the most recent session that included this movement.
        const repsSets = sets.filter((s) => !s.skipped && s.actualReps != null)
        if (repsSets.length === 0) break // movement was only logged as max/time mode — no rep suggestion

        const suggestion = deriveRepsSuggestion(repsSets)
        if (suggestion) {
          suggestions.set(movementId, suggestion)
        }
        // No suggestion on miss/non-clean — UI falls back to entry.targetReps.
        break
      }
    }
    return suggestions
  },

  // Compute personal records (best reps and best hold time) per movement.
  // Skipped sets and zero-value rows are ignored — a zero-rep "logged" set is
  // not a PR. The completedAt timestamp comes from the parent WorkoutLog.
  // Each PR carries a testDay flag indicating whether the PR-setting set came
  // from a Test Day session (match by workout id; name fallback for old logs).
  getAllPRs: async (): Promise<Map<string, MovementPR>> => {
    const [sets, logs, workouts] = await Promise.all([
      db.setLogs.toArray(),
      db.workoutLogs.toArray(),
      db.workouts.toArray(),
    ])

    // Collect DB ids of Test Day workouts for the primary id-based match.
    const testDayWorkoutIds = new Set(
      workouts
        .filter((w) => w.name === TEST_DAY_WORKOUT_NAME)
        .map((w) => w.id),
    )

    const logById = new Map(logs.map((l) => [l.id, l]))

    // Is this workout log a Test Day session?
    // Primary: workout id match (works for all seeded logs).
    // Fallback: name match for logs predating the id link (e.g., after a DB
    // wipe + reseed that assigned the workout a fresh id).
    const isTestDayLog = (log: WorkoutLog): boolean =>
      testDayWorkoutIds.has(log.workoutId) ||
      log.workoutName === TEST_DAY_WORKOUT_NAME

    const recentCutoff = Date.now() - GATE_EVIDENCE_WINDOW_MS

    const prs = new Map<string, MovementPR>()
    for (const set of sets) {
      if (set.skipped) continue
      // Warm-up sets are not training sets — exclude from PRs.
      if (set.warmup) continue
      const log = logById.get(set.workoutLogId)
      const at = log?.completedAt
      const testDay = log != null && isTestDayLog(log)
      const existing = prs.get(set.movementId) ?? {
        movementId: set.movementId,
        movementName: set.movementName,
      }
      const reps = set.actualReps ?? 0
      const secs = set.actualSeconds ?? 0
      if (reps > 0 && (existing.bestReps == null || reps > existing.bestReps)) {
        existing.bestReps = reps
        existing.bestRepsAt = at
        existing.bestRepsTestDay = testDay
      }
      if (secs > 0 && (existing.bestSeconds == null || secs > existing.bestSeconds)) {
        existing.bestSeconds = secs
        existing.bestSecondsAt = at
        existing.bestSecondsTestDay = testDay
      }
      // Windowed bests: only sets that can PROVE recency (timestamped parent
      // log inside the window) count as current form.
      if (at != null && at >= recentCutoff) {
        if (reps > 0 && (existing.recentBestReps == null || reps > existing.recentBestReps)) {
          existing.recentBestReps = reps
          existing.recentBestRepsAt = at
        }
        if (secs > 0 && (existing.recentBestSeconds == null || secs > existing.recentBestSeconds)) {
          existing.recentBestSeconds = secs
          existing.recentBestSecondsAt = at
        }
      }
      // Keep the most recent movementName in case the movement was renamed.
      existing.movementName = set.movementName
      prs.set(set.movementId, existing)
    }
    return prs
  },

  // When each progression was last actually trained: progressionId → the most
  // recent completedAt of a session containing a non-skipped working set logged
  // under it. Feeds pattern resolution — "the line you've been training" —
  // so adaptive slots follow demonstrated engagement, not just unlock state.
  getLastTrainedByProgression: async (): Promise<Map<string, number>> => {
    const [sets, logs] = await Promise.all([db.setLogs.toArray(), db.workoutLogs.toArray()])
    const completedAtByLog = new Map(
      logs.filter((l) => l.completedAt != null).map((l) => [l.id, l.completedAt as number]),
    )
    const lastTrained = new Map<string, number>()
    for (const set of sets) {
      if (set.skipped || set.warmup || !set.progressionId) continue
      const at = completedAtByLog.get(set.workoutLogId)
      if (at == null) continue
      const prev = lastTrained.get(set.progressionId)
      if (prev == null || at > prev) lastTrained.set(set.progressionId, at)
    }
    return lastTrained
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
