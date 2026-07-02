import { describe, it, expect } from 'vitest'
import {
  hitsTarget,
  wasCleanHit,
  computeRungDiagnostic,
  deriveRepsSuggestion,
  evaluateExitCriteria,
  DEFAULT_EXIT_CRITERIA,
  STUCK_SESSIONS,
  STUCK_DAYS,
} from '../progression-metrics'
import type { EvalSession } from '../progression-metrics'
import type { ExitCriteria, SetLog } from '@/models/types'

function makeSet(
  overrides: Partial<SetLog> & { id: string; workoutLogId: string; movementId: string },
): SetLog {
  return {
    movementName: '',
    round: 0,
    order: 0,
    ...overrides,
  }
}

// ── hitsTarget ────────────────────────────────────────────────────────────────

describe('hitsTarget', () => {
  it('returns true when actualReps >= targetReps', () => {
    expect(hitsTarget(makeSet({ id: 's1', workoutLogId: 'w1', movementId: 'm1', actualReps: 10, targetReps: 10 }))).toBe(true)
    expect(hitsTarget(makeSet({ id: 's2', workoutLogId: 'w1', movementId: 'm1', actualReps: 11, targetReps: 10 }))).toBe(true)
  })

  it('returns false when actualReps < targetReps', () => {
    expect(hitsTarget(makeSet({ id: 's1', workoutLogId: 'w1', movementId: 'm1', actualReps: 8, targetReps: 10 }))).toBe(false)
  })

  it('returns true when actualSeconds >= targetSeconds', () => {
    expect(hitsTarget(makeSet({ id: 's1', workoutLogId: 'w1', movementId: 'm1', actualSeconds: 30, targetSeconds: 30 }))).toBe(true)
    expect(hitsTarget(makeSet({ id: 's2', workoutLogId: 'w1', movementId: 'm1', actualSeconds: 31, targetSeconds: 30 }))).toBe(true)
  })

  it('returns false when actualSeconds < targetSeconds', () => {
    expect(hitsTarget(makeSet({ id: 's1', workoutLogId: 'w1', movementId: 'm1', actualSeconds: 20, targetSeconds: 30 }))).toBe(false)
  })

  it('returns false when neither reps nor seconds fields are set', () => {
    expect(hitsTarget(makeSet({ id: 's1', workoutLogId: 'w1', movementId: 'm1' }))).toBe(false)
  })

  it('returns false when only one side of reps pair is present', () => {
    expect(hitsTarget(makeSet({ id: 's1', workoutLogId: 'w1', movementId: 'm1', actualReps: 10 }))).toBe(false)
    expect(hitsTarget(makeSet({ id: 's2', workoutLogId: 'w1', movementId: 'm1', targetReps: 10 }))).toBe(false)
  })
})

// ── wasCleanHit ───────────────────────────────────────────────────────────────

describe('wasCleanHit', () => {
  it('returns true when all sets meet their target', () => {
    const sets = [
      makeSet({ id: 's1', workoutLogId: 'w1', movementId: 'm1', targetReps: 5, actualReps: 5 }),
      makeSet({ id: 's2', workoutLogId: 'w1', movementId: 'm1', targetReps: 5, actualReps: 6, order: 1 }),
    ]
    expect(wasCleanHit(sets)).toBe(true)
  })

  it('returns false when any set missed its target', () => {
    const sets = [
      makeSet({ id: 's1', workoutLogId: 'w1', movementId: 'm1', targetReps: 5, actualReps: 5 }),
      makeSet({ id: 's2', workoutLogId: 'w1', movementId: 'm1', targetReps: 5, actualReps: 4, order: 1 }),
    ]
    expect(wasCleanHit(sets)).toBe(false)
  })

  it('returns false when any logged RIR < 2', () => {
    const sets = [
      makeSet({ id: 's1', workoutLogId: 'w1', movementId: 'm1', targetReps: 5, actualReps: 5, rir: 3 }),
      makeSet({ id: 's2', workoutLogId: 'w1', movementId: 'm1', targetReps: 5, actualReps: 5, rir: 1, order: 1 }),
    ]
    expect(wasCleanHit(sets)).toBe(false)
  })

  it('returns true when all logged RIR are exactly 2', () => {
    const sets = [
      makeSet({ id: 's1', workoutLogId: 'w1', movementId: 'm1', targetReps: 5, actualReps: 5, rir: 2 }),
      makeSet({ id: 's2', workoutLogId: 'w1', movementId: 'm1', targetReps: 5, actualReps: 5, rir: 3, order: 1 }),
    ]
    expect(wasCleanHit(sets)).toBe(true)
  })

  it('ignores skipped sets when judging cleanliness', () => {
    const sets = [
      makeSet({ id: 's1', workoutLogId: 'w1', movementId: 'm1', targetReps: 5, actualReps: 5 }),
      makeSet({ id: 's2', workoutLogId: 'w1', movementId: 'm1', skipped: true, order: 1 }),
    ]
    expect(wasCleanHit(sets)).toBe(true)
  })

  it('returns false when all sets are skipped (no qualifying set)', () => {
    const sets = [
      makeSet({ id: 's1', workoutLogId: 'w1', movementId: 'm1', skipped: true }),
    ]
    expect(wasCleanHit(sets)).toBe(false)
  })

  it('treats absent RIR as a non-veto', () => {
    // No rir field → should still clean-hit
    const sets = [
      makeSet({ id: 's1', workoutLogId: 'w1', movementId: 'm1', targetReps: 5, actualReps: 5 }),
    ]
    expect(wasCleanHit(sets)).toBe(true)
  })

  it('returns false on empty input', () => {
    expect(wasCleanHit([])).toBe(false)
  })
})

// ── computeRungDiagnostic ─────────────────────────────────────────────────────

describe('computeRungDiagnostic', () => {
  const dayMs = 24 * 60 * 60 * 1000
  const now = 1_700_000_000_000

  it('returns zero stats when no relevant sets', () => {
    expect(computeRungDiagnostic([], new Map(), now)).toEqual({
      sessionsAtRung: 0,
      daysAtRung: 0,
      stuck: false,
    })
  })

  it('counts distinct sessions (not individual sets)', () => {
    const sets = [
      makeSet({ id: 's1', workoutLogId: 'w1', movementId: 'm1' }),
      makeSet({ id: 's2', workoutLogId: 'w2', movementId: 'm1', order: 0 }),
      makeSet({ id: 's3', workoutLogId: 'w2', movementId: 'm1', order: 1 }),
    ]
    const completedAt = new Map([
      ['w1', now - 14 * dayMs],
      ['w2', now - 7 * dayMs],
    ])
    const result = computeRungDiagnostic(sets, completedAt, now)
    expect(result.sessionsAtRung).toBe(2)
    expect(result.daysAtRung).toBeGreaterThanOrEqual(13)
    expect(result.stuck).toBe(false)
  })

  it('uses the earliest session to compute daysAtRung', () => {
    const sets = [
      makeSet({ id: 's1', workoutLogId: 'w-early', movementId: 'm1' }),
      makeSet({ id: 's2', workoutLogId: 'w-late', movementId: 'm1', order: 1 }),
    ]
    const completedAt = new Map([
      ['w-early', now - 10 * dayMs],
      ['w-late', now - 2 * dayMs],
    ])
    const result = computeRungDiagnostic(sets, completedAt, now)
    // daysAtRung should reflect the EARLIEST session, not the latest
    expect(result.daysAtRung).toBeGreaterThanOrEqual(9)
  })

  it(`flags stuck when sessionsAtRung >= STUCK_SESSIONS (${STUCK_SESSIONS})`, () => {
    const sets = Array.from({ length: STUCK_SESSIONS }, (_, i) =>
      makeSet({ id: `s${i}`, workoutLogId: `w${i}`, movementId: 'm1' }),
    )
    const completedAt = new Map(sets.map((_, i) => [`w${i}`, now - i * dayMs]))
    const result = computeRungDiagnostic(sets, completedAt, now)
    expect(result.sessionsAtRung).toBe(STUCK_SESSIONS)
    expect(result.stuck).toBe(true)
  })

  it(`flags stuck when daysAtRung >= STUCK_DAYS (${STUCK_DAYS}) even with few sessions`, () => {
    const sets = [makeSet({ id: 's1', workoutLogId: 'w1', movementId: 'm1' })]
    const completedAt = new Map([['w1', now - (STUCK_DAYS + 1) * dayMs]])
    const result = computeRungDiagnostic(sets, completedAt, now)
    expect(result.daysAtRung).toBeGreaterThanOrEqual(STUCK_DAYS)
    expect(result.stuck).toBe(true)
  })

  it('does not flag stuck below both thresholds', () => {
    const sets = [makeSet({ id: 's1', workoutLogId: 'w1', movementId: 'm1' })]
    const completedAt = new Map([['w1', now - 3 * dayMs]])
    const result = computeRungDiagnostic(sets, completedAt, now)
    expect(result.stuck).toBe(false)
  })

  it('returns daysAtRung 0 when no workoutLog timestamps are found in the map', () => {
    const sets = [makeSet({ id: 's1', workoutLogId: 'w-missing', movementId: 'm1' })]
    // completedAt map is empty — simulate a log whose completedAt isn't found
    const result = computeRungDiagnostic(sets, new Map(), now)
    expect(result.daysAtRung).toBe(0)
    expect(result.sessionsAtRung).toBe(1)
  })
})

// ── deriveRepsSuggestion ──────────────────────────────────────────────────────

describe('deriveRepsSuggestion', () => {
  it('returns null for empty input', () => {
    expect(deriveRepsSuggestion([])).toBeNull()
  })

  it('returns null when session was not a clean hit (missed rep)', () => {
    const sets = [
      makeSet({ id: 's1', workoutLogId: 'w1', movementId: 'm1', targetReps: 5, actualReps: 4 }),
    ]
    expect(deriveRepsSuggestion(sets)).toBeNull()
  })

  it('returns null when session had low RIR veto', () => {
    const sets = [
      makeSet({ id: 's1', workoutLogId: 'w1', movementId: 'm1', targetReps: 5, actualReps: 5, rir: 1 }),
    ]
    expect(deriveRepsSuggestion(sets)).toBeNull()
  })

  it('returns suggestedReps = max(actualReps) + 1 on clean hit', () => {
    const sets = [
      makeSet({ id: 's1', workoutLogId: 'w1', movementId: 'm1', targetReps: 5, actualReps: 5 }),
      makeSet({ id: 's2', workoutLogId: 'w1', movementId: 'm1', targetReps: 5, actualReps: 6, order: 1 }),
    ]
    const result = deriveRepsSuggestion(sets)
    expect(result?.suggestedReps).toBe(7) // max(5, 6) + 1
    expect(result?.reason).toContain('bump from 6')
  })

  it('includes the clean-hit phrase in the reason string', () => {
    const sets = [
      makeSet({ id: 's1', workoutLogId: 'w1', movementId: 'm1', targetReps: 3, actualReps: 3 }),
    ]
    const result = deriveRepsSuggestion(sets)
    expect(result?.reason).toContain('clean hit')
  })
})

// ── evaluateExitCriteria ──────────────────────────────────────────────────────

// Helpers for building EvalSession fixtures
function repsSet(
  id: string,
  opts: { targetReps: number; actualReps: number; rir?: number; skipped?: boolean },
): SetLog {
  return makeSet({ id, workoutLogId: 'w1', movementId: 'm1', ...opts })
}

function timeSet(
  id: string,
  opts: { targetSeconds: number; actualSeconds: number; sir?: 0 | 1 | 2; skipped?: boolean },
): SetLog {
  return makeSet({ id, workoutLogId: 'w1', movementId: 'm1', ...opts })
}

function session(sets: SetLog[]): EvalSession {
  return { sets }
}

// A session that passes the default criteria: all reps sets hit target, no RIR veto.
function passingRepsSession(n = 1): EvalSession {
  return session(
    Array.from({ length: n }, (_, i) =>
      repsSet(`s${i}`, { targetReps: 5, actualReps: 5 }),
    ),
  )
}

// A session that misses its target (fails on hitsTarget gate).
function failingSession(): EvalSession {
  return session([repsSet('s1', { targetReps: 5, actualReps: 4 })])
}

describe('DEFAULT_EXIT_CRITERIA', () => {
  it('requires 3 sessions', () => {
    expect(DEFAULT_EXIT_CRITERIA.sessions).toBe(3)
  })
})

describe('evaluateExitCriteria', () => {
  // ── Basic streak counting ────────────────────────────────────────────────────

  it('returns streak 0 and met false for empty history', () => {
    const result = evaluateExitCriteria(undefined, [])
    expect(result.qualifyingStreak).toBe(0)
    expect(result.met).toBe(false)
  })

  it('returns streak 1 and met false when only one qualifying session (need 3)', () => {
    const result = evaluateExitCriteria(undefined, [passingRepsSession()])
    expect(result.qualifyingStreak).toBe(1)
    expect(result.met).toBe(false)
  })

  it('returns met true when streak exactly equals required sessions', () => {
    const history = [passingRepsSession(), passingRepsSession(), passingRepsSession()]
    const result = evaluateExitCriteria(undefined, history)
    expect(result.qualifyingStreak).toBe(3)
    expect(result.met).toBe(true)
  })

  it('returns met true when streak exceeds required sessions', () => {
    const history = [
      passingRepsSession(),
      passingRepsSession(),
      passingRepsSession(),
      passingRepsSession(),
    ]
    const result = evaluateExitCriteria(undefined, history)
    expect(result.qualifyingStreak).toBe(4)
    expect(result.met).toBe(true)
  })

  it('counts streak from the tail — early failure does not break a trailing streak', () => {
    // Sessions: fail, pass, pass, pass → streak = 3 from the end
    const history = [
      failingSession(),
      passingRepsSession(),
      passingRepsSession(),
      passingRepsSession(),
    ]
    const result = evaluateExitCriteria(undefined, history)
    expect(result.qualifyingStreak).toBe(3)
    expect(result.met).toBe(true)
  })

  it('resets streak on any failing session within the trailing run', () => {
    // Sessions: pass, pass, fail, pass → streak = 1 (only the last pass)
    const history = [
      passingRepsSession(),
      passingRepsSession(),
      failingSession(),
      passingRepsSession(),
    ]
    const result = evaluateExitCriteria(undefined, history)
    expect(result.qualifyingStreak).toBe(1)
    expect(result.met).toBe(false)
  })

  it('returns met false when the most recent session fails', () => {
    const history = [passingRepsSession(), passingRepsSession(), failingSession()]
    const result = evaluateExitCriteria(undefined, history)
    expect(result.qualifyingStreak).toBe(0)
    expect(result.met).toBe(false)
  })

  // ── Custom criteria ───────────────────────────────────────────────────────────

  it('respects a custom session count', () => {
    const criteria: ExitCriteria = { sessions: 2 }
    const history = [passingRepsSession(), passingRepsSession()]
    const result = evaluateExitCriteria(criteria, history)
    expect(result.met).toBe(true)
    expect(result.qualifyingStreak).toBe(2)
  })

  it('uses the default fallback when criteria is undefined', () => {
    // Same as the DEFAULT_EXIT_CRITERIA test above but explicitly checks the
    // passed-in undefined path.
    const result = evaluateExitCriteria(undefined, [
      passingRepsSession(),
      passingRepsSession(),
    ])
    expect(result.met).toBe(false) // needs 3, only 2
  })

  // ── RIR gate ─────────────────────────────────────────────────────────────────

  it('vetoes a session when last-set RIR is present and below 2 (default minRIR)', () => {
    const s = session([
      repsSet('s1', { targetReps: 5, actualReps: 5, rir: 3 }),
      repsSet('s2', { targetReps: 5, actualReps: 5, rir: 1 }), // last set RIR=1
    ])
    const result = evaluateExitCriteria(undefined, [s, s, s])
    expect(result.qualifyingStreak).toBe(0)
    expect(result.met).toBe(false)
  })

  it('passes when last-set RIR equals exactly the threshold (2)', () => {
    const s = session([
      repsSet('s1', { targetReps: 5, actualReps: 5, rir: 2 }), // last set RIR=2
    ])
    const result = evaluateExitCriteria(undefined, [s, s, s])
    expect(result.qualifyingStreak).toBe(3)
    expect(result.met).toBe(true)
  })

  it('passes when last-set RIR is above the threshold', () => {
    const s = session([repsSet('s1', { targetReps: 5, actualReps: 5, rir: 4 })])
    const result = evaluateExitCriteria(undefined, [s, s, s])
    expect(result.met).toBe(true)
  })

  it('treats absent RIR as a non-veto (missing effort data)', () => {
    // No rir field on any set → should still qualify.
    const s = session([repsSet('s1', { targetReps: 5, actualReps: 5 })])
    const result = evaluateExitCriteria(undefined, [s, s, s])
    expect(result.qualifyingStreak).toBe(3)
    expect(result.met).toBe(true)
  })

  it('respects a custom minRIR override', () => {
    const criteria: ExitCriteria = { sessions: 1, minRIR: 3 }
    // last-set RIR = 2 → below custom threshold of 3 → should veto
    const s = session([repsSet('s1', { targetReps: 5, actualReps: 5, rir: 2 })])
    expect(evaluateExitCriteria(criteria, [s]).met).toBe(false)

    // last-set RIR = 3 → meets custom threshold
    const s2 = session([repsSet('s2', { targetReps: 5, actualReps: 5, rir: 3 })])
    expect(evaluateExitCriteria(criteria, [s2]).met).toBe(true)
  })

  it('only applies the RIR gate to the last set, not intermediate sets', () => {
    // First set has RIR=1, last set has no RIR → should not veto
    const s = session([
      repsSet('s1', { targetReps: 5, actualReps: 5, rir: 1 }),
      repsSet('s2', { targetReps: 5, actualReps: 5 }), // last set — no RIR
    ])
    const result = evaluateExitCriteria(undefined, [s, s, s])
    expect(result.met).toBe(true)
  })

  // ── SIR gate (time/max mode) ──────────────────────────────────────────────────

  it('vetoes a time-mode session when last-set SIR is 0 (below default minSIR=1)', () => {
    const s = session([timeSet('s1', { targetSeconds: 30, actualSeconds: 30, sir: 0 })])
    const result = evaluateExitCriteria(undefined, [s, s, s])
    expect(result.qualifyingStreak).toBe(0)
    expect(result.met).toBe(false)
  })

  it('passes when last-set SIR equals exactly the threshold (1)', () => {
    const s = session([timeSet('s1', { targetSeconds: 30, actualSeconds: 30, sir: 1 })])
    const result = evaluateExitCriteria(undefined, [s, s, s])
    expect(result.qualifyingStreak).toBe(3)
    expect(result.met).toBe(true)
  })

  it('passes when last-set SIR is above the threshold', () => {
    const s = session([timeSet('s1', { targetSeconds: 30, actualSeconds: 30, sir: 2 })])
    expect(evaluateExitCriteria(undefined, [s, s, s]).met).toBe(true)
  })

  it('treats absent SIR as a non-veto in time mode (missing effort data)', () => {
    const s = session([timeSet('s1', { targetSeconds: 30, actualSeconds: 30 })])
    const result = evaluateExitCriteria(undefined, [s, s, s])
    expect(result.qualifyingStreak).toBe(3)
    expect(result.met).toBe(true)
  })

  it('respects a custom minSIR override', () => {
    const criteria: ExitCriteria = { sessions: 1, minSIR: 2 }
    // SIR=1 → below custom threshold of 2
    const s = session([timeSet('s1', { targetSeconds: 30, actualSeconds: 30, sir: 1 })])
    expect(evaluateExitCriteria(criteria, [s]).met).toBe(false)
    // SIR=2 → meets custom threshold
    const s2 = session([timeSet('s2', { targetSeconds: 30, actualSeconds: 30, sir: 2 })])
    expect(evaluateExitCriteria(criteria, [s2]).met).toBe(true)
  })

  // ── Mixed-mode levels ─────────────────────────────────────────────────────────

  it('applies both RIR and SIR gates when a session has sets of each mode', () => {
    // Session with one reps set (RIR ok) and one time set (SIR veto)
    const mixed = session([
      repsSet('sr', { targetReps: 5, actualReps: 5, rir: 3 }),
      timeSet('st', { targetSeconds: 30, actualSeconds: 30, sir: 0 }), // last set — SIR veto
    ])
    const result = evaluateExitCriteria(undefined, [mixed, mixed, mixed])
    expect(result.met).toBe(false)
  })

  it('qualifies a mixed-mode session when all effort gates pass', () => {
    const mixed = session([
      repsSet('sr', { targetReps: 5, actualReps: 5 }),
      timeSet('st', { targetSeconds: 30, actualSeconds: 30, sir: 1 }), // last set — ok
    ])
    const result = evaluateExitCriteria(undefined, [mixed, mixed, mixed])
    expect(result.met).toBe(true)
  })

  // ── Volume gates ──────────────────────────────────────────────────────────────

  it('vetoes when set count is below criteria.sets', () => {
    const criteria: ExitCriteria = { sessions: 1, sets: 3 }
    const s = session([
      repsSet('s1', { targetReps: 5, actualReps: 5 }),
      repsSet('s2', { targetReps: 5, actualReps: 5 }),
    ]) // only 2 sets
    expect(evaluateExitCriteria(criteria, [s]).met).toBe(false)
  })

  it('passes when set count meets criteria.sets', () => {
    const criteria: ExitCriteria = { sessions: 1, sets: 2 }
    const s = session([
      repsSet('s1', { targetReps: 5, actualReps: 5 }),
      repsSet('s2', { targetReps: 5, actualReps: 5 }),
    ])
    expect(evaluateExitCriteria(criteria, [s]).met).toBe(true)
  })

  it('vetoes when actualReps is below minReps even though target is hit', () => {
    // target 5, actual 5 — but minReps = 8
    const criteria: ExitCriteria = { sessions: 1, minReps: 8 }
    const s = session([repsSet('s1', { targetReps: 5, actualReps: 5 })])
    expect(evaluateExitCriteria(criteria, [s]).met).toBe(false)
  })

  it('passes minReps gate when all sets are at or above minReps', () => {
    const criteria: ExitCriteria = { sessions: 1, minReps: 5 }
    const s = session([
      repsSet('s1', { targetReps: 5, actualReps: 6 }),
      repsSet('s2', { targetReps: 5, actualReps: 5 }),
    ])
    expect(evaluateExitCriteria(criteria, [s]).met).toBe(true)
  })

  it('vetoes when actualSeconds is below minHoldSeconds', () => {
    const criteria: ExitCriteria = { sessions: 1, minHoldSeconds: 40 }
    const s = session([timeSet('s1', { targetSeconds: 30, actualSeconds: 30 })])
    expect(evaluateExitCriteria(criteria, [s]).met).toBe(false)
  })

  it('passes minHoldSeconds gate when hold meets the minimum', () => {
    const criteria: ExitCriteria = { sessions: 1, minHoldSeconds: 30 }
    const s = session([timeSet('s1', { targetSeconds: 30, actualSeconds: 35 })])
    expect(evaluateExitCriteria(criteria, [s]).met).toBe(true)
  })

  // ── Skipped sets ──────────────────────────────────────────────────────────────

  it('ignores skipped sets and still qualifies when remaining sets pass', () => {
    const s = session([
      repsSet('s1', { targetReps: 5, actualReps: 5 }),
      repsSet('s2', { targetReps: 5, actualReps: 5, skipped: true }),
    ])
    const result = evaluateExitCriteria(undefined, [s, s, s])
    expect(result.met).toBe(true)
  })

  it('vetoes a session where all sets are skipped (no active sets)', () => {
    const s = session([repsSet('s1', { targetReps: 5, actualReps: 5, skipped: true })])
    const result = evaluateExitCriteria(undefined, [s, s, s])
    expect(result.qualifyingStreak).toBe(0)
    expect(result.met).toBe(false)
  })

  // ── Target-miss gates ─────────────────────────────────────────────────────────

  it('vetoes when any set misses its reps target', () => {
    const s = session([
      repsSet('s1', { targetReps: 5, actualReps: 5 }),
      repsSet('s2', { targetReps: 5, actualReps: 4 }), // miss
    ])
    expect(evaluateExitCriteria(undefined, [s, s, s]).met).toBe(false)
  })

  it('vetoes when any set misses its time target', () => {
    const s = session([timeSet('s1', { targetSeconds: 30, actualSeconds: 25 })])
    expect(evaluateExitCriteria(undefined, [s, s, s]).met).toBe(false)
  })

  // ── detail string ──────────────────────────────────────────────────────────────

  it('includes streak and required in the detail string', () => {
    const result = evaluateExitCriteria(undefined, [passingRepsSession()])
    expect(result.detail).toContain('1/3')
  })

  it('detail string signals readiness when met', () => {
    const history = [passingRepsSession(), passingRepsSession(), passingRepsSession()]
    const result = evaluateExitCriteria(undefined, history)
    expect(result.detail.toLowerCase()).toContain('ready')
  })
})
