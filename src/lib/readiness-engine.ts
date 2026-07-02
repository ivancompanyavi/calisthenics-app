/**
 * Readiness engine — pure module.
 *
 * Accepts pre-loaded data (session history, diagnostic numbers, snooze state)
 * and produces a single ReadinessVerdict per progression. No DB access here —
 * IO lives in the repository / hook layer.
 */
import type { ExitCriteria } from '@/models/types'
import {
  evaluateExitCriteria,
  sessionQualifies,
  DEFAULT_EXIT_CRITERIA,
  STUCK_SESSIONS,
  STUCK_DAYS,
  hitsTarget,
} from './progression-metrics'
import type { EvalSession } from './progression-metrics'

// ── Types ─────────────────────────────────────────────────────────────────────

export type ReadinessVerdictKind =
  | 'ready-to-advance'
  | 'close'
  | 'regressing'
  | 'stuck'
  | 'steady'

export interface ReadinessVerdict {
  kind: ReadinessVerdictKind
  /** Human-readable summary, e.g. "3 clean sessions, avg last-set RIR 2.3" */
  evidence: string
  // Structured numbers so the UI can render without recomputing
  qualifyingStreak: number
  requiredSessions: number
  sessionsAtRung: number
  daysAtRung: number
  /**
   * Total count of qualifying sessions at this rung (not just the streak tail).
   * Stored as `dismissedAtSessionCount` on the Progression when snoozed;
   * the card re-surfaces when this value exceeds the stored count.
   */
  qualifyingSessionCount: number
  /**
   * True when the progression is `ready-to-advance` but the user dismissed the
   * suggest-and-confirm card and no new qualifying session has occurred since.
   * The UI should hide the card (but the verdict kind stays `ready-to-advance`
   * so callers can still distinguish snoozed-ready from not-ready).
   */
  snoozed: boolean
}

export interface ReadinessInput {
  /** Sessions for the current rung's movement, oldest → newest. */
  sessionHistory: EvalSession[]
  /** Level-specific exit criteria; `undefined` → global default (3 sessions). */
  criteria: ExitCriteria | undefined
  /** Pre-computed from computeRungDiagnostic. */
  sessionsAtRung: number
  daysAtRung: number
  /**
   * The total qualifying-session count stored at dismiss time.
   * When set and current count ≤ stored count, the card is snoozed.
   */
  dismissedAtSessionCount: number | undefined
}

// ── Internal helpers ──────────────────────────────────────────────────────────

/**
 * Counts how many ExitCriteria-specific gate groups fail for a session,
 * but ONLY if the session first passes the baseline "all sets hit target"
 * check.  A session that misses the target entirely is not "close" — it
 * represents a genuine shortfall, not a supplementary-gate failure.
 *
 * Returns 99 for any session that fails the hit-target baseline (or has no
 * active sets), so the caller can safely check `=== 1`.
 *
 * ExitCriteria gate groups (each counts as 1 regardless of how many sets):
 *   1. Minimum set count (criteria.sets)
 *   2. minReps per reps-mode set
 *   3. minHoldSeconds per time-mode set
 *   4. Last-set RIR gate
 *   5. Last-set SIR gate
 */
function countGateFailures(session: EvalSession, criteria: ExitCriteria): number {
  const activeSets = session.sets.filter((s) => !s.skipped)
  if (activeSets.length === 0) return 99 // empty → treat as all failed

  // Baseline: all sets must hit their target; if not, this is a fundamental
  // miss — not a "one gate away" scenario.
  if (!activeSets.every(hitsTarget)) return 99

  let count = 0

  // Gate 1: minimum set count
  if (criteria.sets != null && activeSets.length < criteria.sets) count++

  // Gate 2: minReps across reps-mode sets
  if (criteria.minReps != null) {
    const fails = activeSets.some(
      (s) => s.targetReps != null && (s.actualReps ?? 0) < criteria.minReps!,
    )
    if (fails) count++
  }

  // Gate 3: minHoldSeconds across time-mode sets
  if (criteria.minHoldSeconds != null) {
    const fails = activeSets.some(
      (s) => s.targetSeconds != null && (s.actualSeconds ?? 0) < criteria.minHoldSeconds!,
    )
    if (fails) count++
  }

  const lastSet = activeSets[activeSets.length - 1]
  const minRIR = criteria.minRIR ?? 2
  const minSIR = criteria.minSIR ?? 1

  // Gate 4: last-set RIR (only when present; absent = non-veto)
  if (lastSet.targetReps != null && lastSet.rir != null && lastSet.rir < minRIR) count++

  // Gate 5: last-set SIR (only when present; absent = non-veto)
  if (lastSet.targetSeconds != null && lastSet.sir != null && lastSet.sir < minSIR) count++

  return count
}

/**
 * A session is "regressing" when it was below target AND the last active set
 * had RIR 0 (reps) or SIR 0 (time/max).  Absent RIR/SIR does NOT trigger
 * regression (user just didn't log it).
 */
function isSessionRegressing(session: EvalSession): boolean {
  const activeSets = session.sets.filter((s) => !s.skipped)
  if (activeSets.length === 0) return false

  // Must be below target (at least one set missed)
  if (activeSets.every(hitsTarget)) return false

  const lastSet = activeSets[activeSets.length - 1]
  if (lastSet.targetReps != null && lastSet.rir === 0) return true
  if (lastSet.targetSeconds != null && lastSet.sir === 0) return true

  return false
}

/** Average last-set RIR across a list of sessions (null if none logged). */
function avgLastSetRIR(sessions: EvalSession[]): number | null {
  const rirs: number[] = []
  for (const session of sessions) {
    const active = session.sets.filter((s) => !s.skipped)
    const last = active[active.length - 1]
    if (last?.rir != null) rirs.push(last.rir)
  }
  if (rirs.length === 0) return null
  return rirs.reduce((a, b) => a + b, 0) / rirs.length
}

/** Average last-set SIR across a list of sessions (null if none logged). */
function avgLastSetSIR(sessions: EvalSession[]): number | null {
  const sirs: number[] = []
  for (const session of sessions) {
    const active = session.sets.filter((s) => !s.skipped)
    const last = active[active.length - 1]
    if (last?.sir != null) sirs.push(last.sir)
  }
  if (sirs.length === 0) return null
  return sirs.reduce((a, b) => a + b, 0) / sirs.length
}

function effortNote(sessions: EvalSession[]): string {
  const rirAvg = avgLastSetRIR(sessions)
  const sirAvg = avgLastSetSIR(sessions)
  const parts: string[] = []
  if (rirAvg != null) parts.push(`avg last-set RIR ${rirAvg.toFixed(1)}`)
  if (sirAvg != null) parts.push(`avg last-set SIR ${sirAvg.toFixed(1)}`)
  return parts.length > 0 ? `, ${parts.join(', ')}` : ''
}

// ── Main export ───────────────────────────────────────────────────────────────

/**
 * Pure verdict computation.  No side effects, no DB access.
 *
 * Priority order (first match wins):
 *   1. ready-to-advance — exit criteria met
 *   2. close            — streak = required − 1, OR last session missed 1 gate
 *   3. regressing       — 3 consecutive sessions below target at RIR/SIR 0
 *   4. stuck            — ≥8 sessions or ≥28 days at rung
 *   5. steady           — none of the above
 */
export function computeReadinessVerdict(input: ReadinessInput): ReadinessVerdict {
  const { sessionHistory, criteria, sessionsAtRung, daysAtRung, dismissedAtSessionCount } = input
  const effective = criteria ?? DEFAULT_EXIT_CRITERIA
  const required = effective.sessions

  const { met, qualifyingStreak } = evaluateExitCriteria(criteria, sessionHistory)

  // Total qualifying sessions (used for snooze gating)
  const qualifyingSessionCount = sessionHistory.filter((s) => sessionQualifies(s, effective)).length

  // 1. ready-to-advance
  if (met) {
    const qualifyingSessions = sessionHistory.slice(-qualifyingStreak)
    const snoozed =
      dismissedAtSessionCount != null && qualifyingSessionCount <= dismissedAtSessionCount
    return {
      kind: 'ready-to-advance',
      evidence: `${qualifyingStreak} clean sessions${effortNote(qualifyingSessions)}`,
      qualifyingStreak,
      requiredSessions: required,
      sessionsAtRung,
      daysAtRung,
      qualifyingSessionCount,
      snoozed,
    }
  }

  const lastSession = sessionHistory.length > 0 ? sessionHistory[sessionHistory.length - 1] : null
  const gateFailures = lastSession != null ? countGateFailures(lastSession, effective) : 0

  // 2. close: streak = required − 1 OR last session failed exactly 1 gate
  const isStreakClose = qualifyingStreak === required - 1
  const isGateClose = lastSession != null && gateFailures === 1
  if (isStreakClose || isGateClose) {
    const reason = isStreakClose
      ? `${qualifyingStreak}/${required} qualifying sessions`
      : 'last session missed 1 gate'
    return {
      kind: 'close',
      evidence: reason,
      qualifyingStreak,
      requiredSessions: required,
      sessionsAtRung,
      daysAtRung,
      qualifyingSessionCount,
      snoozed: false,
    }
  }

  // 3. regressing: 3 most recent sessions all below target at RIR/SIR 0
  if (sessionHistory.length >= 3) {
    const recent = sessionHistory.slice(-3)
    if (recent.every(isSessionRegressing)) {
      return {
        kind: 'regressing',
        evidence: '3 consecutive sessions below target at failure',
        qualifyingStreak,
        requiredSessions: required,
        sessionsAtRung,
        daysAtRung,
        qualifyingSessionCount,
        snoozed: false,
      }
    }
  }

  // 4. stuck: ≥ STUCK_SESSIONS or ≥ STUCK_DAYS at rung (and not ready/close)
  if (sessionsAtRung >= STUCK_SESSIONS || daysAtRung >= STUCK_DAYS) {
    return {
      kind: 'stuck',
      evidence: `${sessionsAtRung} sessions / ${daysAtRung}d at this rung`,
      qualifyingStreak,
      requiredSessions: required,
      sessionsAtRung,
      daysAtRung,
      qualifyingSessionCount,
      snoozed: false,
    }
  }

  // 5. steady
  return {
    kind: 'steady',
    evidence: `${qualifyingStreak}/${required} qualifying sessions`,
    qualifyingStreak,
    requiredSessions: required,
    sessionsAtRung,
    daysAtRung,
    qualifyingSessionCount,
    snoozed: false,
  }
}
