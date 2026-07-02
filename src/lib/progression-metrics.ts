import type { ExitCriteria, SetLog } from '@/models/types'

// ── Stuck thresholds ──────────────────────────────────────────────────────────

// A progression is "stuck" when the user has trained the current rung for
// >= STUCK_SESSIONS or >= STUCK_DAYS without leveling up. Either trigger fires
// the diagnostic — sessions catches frequent trainers, days catches sparse
// trainers who never quite accumulate enough volume.
export const STUCK_SESSIONS = 8
export const STUCK_DAYS = 28

// ── Hit-target predicate ──────────────────────────────────────────────────────

// Returns true only if a definite target was met. A set with neither
// targetReps/actualReps nor targetSeconds/actualSeconds counts as a miss,
// which matches the behavior expected by checkReadiness.
export function hitsTarget(s: SetLog): boolean {
  if (s.actualReps != null && s.targetReps != null) return s.actualReps >= s.targetReps
  if (s.actualSeconds != null && s.targetSeconds != null) return s.actualSeconds >= s.targetSeconds
  return false
}

// ── Sessions / Days at rung ───────────────────────────────────────────────────

// Given SetLogs pre-filtered to the current rung (by progression + movement,
// non-skipped) and a map of workoutLogId → completedAt, compute the number of
// distinct sessions and elapsed days at the rung, plus whether the progression
// qualifies as "stuck".
export function computeRungDiagnostic(
  relevantSetLogs: SetLog[],
  completedAtById: Map<string, number>,
  now: number,
): { sessionsAtRung: number; daysAtRung: number; stuck: boolean } {
  if (relevantSetLogs.length === 0) {
    return { sessionsAtRung: 0, daysAtRung: 0, stuck: false }
  }
  const dayMs = 24 * 60 * 60 * 1000
  const sessionIds = new Set(relevantSetLogs.map((s) => s.workoutLogId))
  let earliest = Infinity
  for (const id of sessionIds) {
    const at = completedAtById.get(id)
    if (at != null && at < earliest) earliest = at
  }
  const daysAtRung = earliest === Infinity ? 0 : Math.floor((now - earliest) / dayMs)
  const sessionsAtRung = sessionIds.size
  return {
    sessionsAtRung,
    daysAtRung,
    stuck: sessionsAtRung >= STUCK_SESSIONS || daysAtRung >= STUCK_DAYS,
  }
}

// ── Clean-hit detection ───────────────────────────────────────────────────────

// Decide if a session was "clean" enough to warrant a rep bump: all non-skipped
// reps-mode sets met their target AND, where RIR was logged, came in at >= 2.
// RIR absence is treated as a non-veto (we don't punish users for not logging
// it). A single sub-RIR-2 set vetoes the bump.
export function wasCleanHit(sets: SetLog[]): boolean {
  let anyHit = false
  for (const s of sets) {
    if (s.skipped) continue
    if (s.targetReps == null) continue
    if ((s.actualReps ?? 0) < s.targetReps) return false
    if (s.rir != null && s.rir < 2) return false
    anyHit = true
  }
  return anyHit
}

// ── Exit-criteria evaluator ───────────────────────────────────────────────────

// Global fallback: 3 consecutive qualifying sessions. Used for every
// progression level that has no level-specific exitCriteria set.
export const DEFAULT_EXIT_CRITERIA: ExitCriteria = {
  sessions: 3,
}

/**
 * One training session's worth of (non-skipped) SetLog rows for the current
 * progression level's movement. Pass sessions ordered oldest→newest so the
 * evaluator can count the qualifying streak from the tail.
 */
export interface EvalSession {
  sets: SetLog[]
}

/**
 * Returns true when the session meets the given criteria:
 *
 * 1. At least one non-skipped set (empty → not qualifying).
 * 2. If `criteria.sets` is specified: at least that many non-skipped sets.
 * 3. Every non-skipped set hits its target (`hitsTarget`).
 * 4. Per-set minimums (minReps / minHoldSeconds) — checked against each set
 *    of the matching mode.
 * 5. Last-set effort gates:
 *    - Reps mode: last set's RIR, if logged, must be >= minRIR (default 2).
 *    - Time/max mode: last set's SIR, if logged, must be >= minSIR (default 1).
 *    Absent RIR/SIR is always a non-veto (matching wasCleanHit semantics).
 */
function sessionQualifies(session: EvalSession, criteria: ExitCriteria): boolean {
  const activeSets = session.sets.filter((s) => !s.skipped)
  if (activeSets.length === 0) return false

  // Gate: minimum set count
  if (criteria.sets != null && activeSets.length < criteria.sets) return false

  // Gate: all sets must hit their target
  if (!activeSets.every(hitsTarget)) return false

  // Gate: per-set minimums
  for (const s of activeSets) {
    if (criteria.minReps != null && s.targetReps != null) {
      if ((s.actualReps ?? 0) < criteria.minReps) return false
    }
    if (criteria.minHoldSeconds != null && s.targetSeconds != null) {
      if ((s.actualSeconds ?? 0) < criteria.minHoldSeconds) return false
    }
  }

  // Gate: last-set effort (RIR for reps mode, SIR for time/max mode)
  const lastSet = activeSets[activeSets.length - 1]
  const minRIR = criteria.minRIR ?? 2
  const minSIR = criteria.minSIR ?? 1

  if (lastSet.targetReps != null) {
    // Absent RIR is a non-veto; present RIR below threshold vetoes.
    if (lastSet.rir != null && lastSet.rir < minRIR) return false
  }
  if (lastSet.targetSeconds != null) {
    // Absent SIR is a non-veto; present SIR below threshold vetoes.
    if (lastSet.sir != null && lastSet.sir < minSIR) return false
  }

  return true
}

/**
 * Evaluates whether a progression level's exit criteria have been met.
 *
 * @param criteria - Level-specific exit criteria. When `undefined`, the
 *   global DEFAULT_EXIT_CRITERIA is used (3 consecutive qualifying sessions).
 * @param sessionHistory - Sessions ordered oldest→newest; each element holds
 *   the pre-filtered, non-skipped SetLog array for the movement at this rung.
 *   Callers are responsible for filtering to the correct movementId and
 *   ordering by completedAt.
 *
 * @returns `met` — whether the required streak is reached;
 *   `qualifyingStreak` — consecutive qualifying sessions from the most recent
 *   session backwards;
 *   `detail` — human-readable progress string (e.g. "2/3 qualifying sessions").
 */
export function evaluateExitCriteria(
  criteria: ExitCriteria | undefined,
  sessionHistory: EvalSession[],
): { met: boolean; qualifyingStreak: number; detail: string } {
  const effective = criteria ?? DEFAULT_EXIT_CRITERIA

  // Count consecutive qualifying sessions from the most recent backwards.
  let streak = 0
  for (let i = sessionHistory.length - 1; i >= 0; i--) {
    if (sessionQualifies(sessionHistory[i], effective)) {
      streak++
    } else {
      break
    }
  }

  const required = effective.sessions
  const met = streak >= required
  const detail = met
    ? `Ready to advance: ${streak}/${required} qualifying sessions`
    : `${streak}/${required} qualifying sessions`

  return { met, qualifyingStreak: streak, detail }
}

// ── Reps suggestion derivation ────────────────────────────────────────────────

// Given the non-skipped, reps-mode sets from the most recent session for a
// movement, return a rep-bump suggestion when the session was a clean hit.
// Returns null when the session missed, had a low RIR veto, or the set list
// is empty — the caller should fall back to the entry's prescribed target.
export function deriveRepsSuggestion(
  repsSets: SetLog[],
): { suggestedReps: number; reason: string } | null {
  if (repsSets.length === 0) return null
  if (!wasCleanHit(repsSets)) return null
  const max = Math.max(...repsSets.map((s) => s.actualReps ?? 0))
  return {
    suggestedReps: max + 1,
    reason: `Last session: clean hit — bump from ${max}`,
  }
}
