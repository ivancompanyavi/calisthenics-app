import type { SetLog } from '@/models/types'

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
