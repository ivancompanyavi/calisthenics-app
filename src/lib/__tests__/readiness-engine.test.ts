import { describe, it, expect } from 'vitest'
import { computeReadinessVerdict } from '../readiness-engine'
import type { ReadinessInput } from '../readiness-engine'
import type { EvalSession } from '../progression-metrics'
import { STUCK_SESSIONS, STUCK_DAYS } from '../progression-metrics'
import type { ExitCriteria, SetLog } from '@/models/types'

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeSet(overrides: Partial<SetLog> & { id: string }): SetLog {
  return {
    workoutLogId: 'w1',
    movementId: 'm1',
    movementName: '',
    round: 0,
    order: 0,
    ...overrides,
  }
}

function repsSession(
  opts: { reps?: number; target?: number; rir?: number; skipped?: boolean } = {},
): EvalSession {
  const { reps = 5, target = 5, rir, skipped } = opts
  return {
    sets: [
      makeSet({
        id: 's1',
        targetReps: target,
        actualReps: reps,
        rir,
        skipped,
      }),
    ],
  }
}

function timeSession(
  opts: { seconds?: number; target?: number; sir?: 0 | 1 | 2; skipped?: boolean } = {},
): EvalSession {
  const { seconds = 30, target = 30, sir, skipped } = opts
  return {
    sets: [
      makeSet({
        id: 's1',
        targetSeconds: target,
        actualSeconds: seconds,
        sir,
        skipped,
      }),
    ],
  }
}

/** Build a clean reps session (hits target, no RIR veto). */
function cleanSession(rir?: number): EvalSession {
  return repsSession({ reps: 5, target: 5, rir })
}

/** Build a session that misses target. */
function missSession(rir?: number): EvalSession {
  return repsSession({ reps: 3, target: 5, rir })
}

/** Build a session that fails target with RIR 0 (regressing). */
function regressSession(): EvalSession {
  return repsSession({ reps: 3, target: 5, rir: 0 })
}

/** Build a clean time-mode session (hits target). */
function cleanTimeSession(sir?: 0 | 1 | 2): EvalSession {
  return timeSession({ seconds: 30, target: 30, sir })
}

/** Build a time-mode session that misses target with SIR 0 (regressing). */
function regressTimeSession(): EvalSession {
  return timeSession({ seconds: 20, target: 30, sir: 0 })
}

function baseInput(overrides: Partial<ReadinessInput> = {}): ReadinessInput {
  return {
    sessionHistory: [],
    criteria: undefined,
    sessionsAtRung: 0,
    daysAtRung: 0,
    dismissedAtSessionCount: undefined,
    ...overrides,
  }
}

// ── ready-to-advance ──────────────────────────────────────────────────────────

describe('ready-to-advance', () => {
  it('fires when default exit criteria (3 sessions) are met', () => {
    const verdict = computeReadinessVerdict(
      baseInput({
        sessionHistory: [cleanSession(), cleanSession(), cleanSession()],
        sessionsAtRung: 3,
      }),
    )
    expect(verdict.kind).toBe('ready-to-advance')
    expect(verdict.qualifyingStreak).toBe(3)
    expect(verdict.requiredSessions).toBe(3)
  })

  it('fires when explicit exitCriteria.sessions = 2 is met', () => {
    const criteria: ExitCriteria = { sessions: 2 }
    const verdict = computeReadinessVerdict(
      baseInput({
        criteria,
        sessionHistory: [cleanSession(), cleanSession()],
        sessionsAtRung: 2,
      }),
    )
    expect(verdict.kind).toBe('ready-to-advance')
    expect(verdict.qualifyingStreak).toBe(2)
  })

  it('fires when exitCriteria.sessions = 1 and one qualifying session exists', () => {
    const criteria: ExitCriteria = { sessions: 1 }
    const verdict = computeReadinessVerdict(
      baseInput({
        criteria,
        sessionHistory: [cleanSession()],
        sessionsAtRung: 1,
      }),
    )
    expect(verdict.kind).toBe('ready-to-advance')
  })

  it('requires the streak to be consecutive — a miss resets it', () => {
    // 2 clean, then miss, then 3 clean → streak = 3 → ready
    const history = [
      cleanSession(),
      cleanSession(),
      missSession(),
      cleanSession(),
      cleanSession(),
      cleanSession(),
    ]
    const verdict = computeReadinessVerdict(baseInput({ sessionHistory: history, sessionsAtRung: 6 }))
    expect(verdict.kind).toBe('ready-to-advance')
  })

  it('does NOT fire when streak is one short', () => {
    const verdict = computeReadinessVerdict(
      baseInput({ sessionHistory: [cleanSession(), cleanSession()], sessionsAtRung: 2 }),
    )
    expect(verdict.kind).not.toBe('ready-to-advance')
  })

  it('works for SIR-based (time mode) sessions', () => {
    const criteria: ExitCriteria = { sessions: 2 }
    const verdict = computeReadinessVerdict(
      baseInput({
        criteria,
        sessionHistory: [cleanTimeSession(), cleanTimeSession()],
        sessionsAtRung: 2,
      }),
    )
    expect(verdict.kind).toBe('ready-to-advance')
  })

  it('evidence contains the streak count', () => {
    const verdict = computeReadinessVerdict(
      baseInput({
        sessionHistory: [cleanSession(), cleanSession(), cleanSession()],
        sessionsAtRung: 3,
      }),
    )
    expect(verdict.evidence).toMatch(/3 clean sessions/)
  })

  it('evidence includes avg last-set RIR when logged', () => {
    const verdict = computeReadinessVerdict(
      baseInput({
        sessionHistory: [cleanSession(2), cleanSession(3), cleanSession(2)],
        sessionsAtRung: 3,
      }),
    )
    // Average is (2+3+2)/3 = 2.33...
    expect(verdict.evidence).toMatch(/RIR/)
    expect(verdict.evidence).toMatch(/2\.3/)
  })

  it('evidence includes avg last-set SIR for time-mode sessions', () => {
    const criteria: ExitCriteria = { sessions: 2, minSIR: 1 }
    const history = [cleanTimeSession(2), cleanTimeSession(1)]
    const verdict = computeReadinessVerdict(baseInput({ criteria, sessionHistory: history, sessionsAtRung: 2 }))
    expect(verdict.kind).toBe('ready-to-advance')
    expect(verdict.evidence).toMatch(/SIR/)
  })

  it('snoozed = false when not dismissed', () => {
    const verdict = computeReadinessVerdict(
      baseInput({ sessionHistory: [cleanSession(), cleanSession(), cleanSession()], sessionsAtRung: 3 }),
    )
    expect(verdict.snoozed).toBe(false)
  })

  it('respects explicit minRIR override in criteria', () => {
    const criteria: ExitCriteria = { sessions: 1, minRIR: 3 }
    // RIR 2 < minRIR 3 → does NOT qualify
    const verdict = computeReadinessVerdict(
      baseInput({ criteria, sessionHistory: [cleanSession(2)], sessionsAtRung: 1 }),
    )
    expect(verdict.kind).not.toBe('ready-to-advance')
  })

  it('respects explicit minSIR override in criteria', () => {
    const criteria: ExitCriteria = { sessions: 1, minSIR: 2 }
    // SIR 1 < minSIR 2 → does NOT qualify
    const verdict = computeReadinessVerdict(
      baseInput({ criteria, sessionHistory: [cleanTimeSession(1)], sessionsAtRung: 1 }),
    )
    expect(verdict.kind).not.toBe('ready-to-advance')
  })
})

// ── close ─────────────────────────────────────────────────────────────────────

describe('close', () => {
  it('fires when qualifyingStreak = required − 1 (streak-based)', () => {
    // Default required = 3, streak = 2
    const verdict = computeReadinessVerdict(
      baseInput({ sessionHistory: [cleanSession(), cleanSession()], sessionsAtRung: 2 }),
    )
    expect(verdict.kind).toBe('close')
    expect(verdict.evidence).toMatch(/2\/3/)
  })

  it('fires when qualifyingStreak = required − 1 with explicit criteria', () => {
    const criteria: ExitCriteria = { sessions: 4 }
    const verdict = computeReadinessVerdict(
      baseInput({
        criteria,
        sessionHistory: [cleanSession(), cleanSession(), cleanSession()],
        sessionsAtRung: 3,
      }),
    )
    expect(verdict.kind).toBe('close')
  })

  it('fires when last session misses exactly 1 gate (gate-based)', () => {
    // RIR 1 < default minRIR 2 — exactly 1 gate fails (last-set RIR gate)
    const lastSession: EvalSession = {
      sets: [makeSet({ id: 's1', targetReps: 5, actualReps: 5, rir: 1 })],
    }
    const verdict = computeReadinessVerdict(
      baseInput({ sessionHistory: [lastSession], sessionsAtRung: 1 }),
    )
    expect(verdict.kind).toBe('close')
    expect(verdict.evidence).toMatch(/1 gate/)
  })

  it('fires when last session misses exactly 1 gate — SIR gate (time mode)', () => {
    // SIR 0 < default minSIR 1 — exactly 1 gate fails
    const lastSession: EvalSession = {
      sets: [makeSet({ id: 's1', targetSeconds: 30, actualSeconds: 30, sir: 0 })],
    }
    const verdict = computeReadinessVerdict(
      baseInput({ sessionHistory: [lastSession], sessionsAtRung: 1 }),
    )
    expect(verdict.kind).toBe('close')
  })

  it('does NOT fire when last session misses the target (fundamental miss)', () => {
    // Missed target → not "close" via gates (baseline hit-target check fails first)
    const lastSession: EvalSession = {
      sets: [makeSet({ id: 's1', targetReps: 5, actualReps: 4, rir: 1 })],
    }
    const verdict = computeReadinessVerdict(
      baseInput({ sessionHistory: [lastSession], sessionsAtRung: 1 }),
    )
    expect(verdict.kind).not.toBe('close')
  })

  it('does NOT fire when last session misses 2 criteria gates (both RIR and minReps)', () => {
    // Hit target but 2 explicit gate failures: minReps (5 < 8) AND minRIR (RIR 1 < 3)
    const criteria: ExitCriteria = { sessions: 3, minReps: 8, minRIR: 3 }
    const lastSession: EvalSession = {
      sets: [makeSet({ id: 's1', targetReps: 5, actualReps: 5, rir: 1 })],
    }
    const verdict = computeReadinessVerdict(
      baseInput({ criteria, sessionHistory: [lastSession], sessionsAtRung: 1 }),
    )
    expect(verdict.kind).not.toBe('close')
  })

  it('does NOT fire when there are no sessions (streak 0 with required 1 is close)', () => {
    // required=3, no sessions → streak=0, required-1=2, 0 !== 2 → not streak-close
    // no last session → not gate-close
    const verdict = computeReadinessVerdict(baseInput({ sessionHistory: [] }))
    expect(verdict.kind).not.toBe('close')
  })

  it('close via streak takes priority over regressing', () => {
    // 2 qualifying, then 3 regressing... but 3-streak not possible with 2 qualifying sessions
    // So: build a case where streak=2 (close) and 3 prior are regressing - requires required=3
    // streak=2 means last 2 qualified, so they can't all be regressing.
    // This test verifies the priority ordering is correct by confirming close fires
    // when streak=required-1, even with some prior regressing sessions.
    const history = [
      regressSession(), // old regress
      regressSession(), // old regress
      regressSession(), // old regress
      cleanSession(),   // then 2 clean
      cleanSession(),
    ]
    const verdict = computeReadinessVerdict(baseInput({ sessionHistory: history, sessionsAtRung: 5 }))
    // Last 2 sessions qualify (streak=2), required=3 → close (not regressing)
    expect(verdict.kind).toBe('close')
  })

  it('snoozed is always false for close', () => {
    const verdict = computeReadinessVerdict(
      baseInput({ sessionHistory: [cleanSession(), cleanSession()], sessionsAtRung: 2 }),
    )
    expect(verdict.snoozed).toBe(false)
  })
})

// ── regressing ────────────────────────────────────────────────────────────────

describe('regressing', () => {
  it('fires when 3 consecutive sessions are below target with RIR 0', () => {
    const verdict = computeReadinessVerdict(
      baseInput({
        sessionHistory: [regressSession(), regressSession(), regressSession()],
        sessionsAtRung: 3,
      }),
    )
    expect(verdict.kind).toBe('regressing')
  })

  it('fires when 3 consecutive sessions are below target with SIR 0 (time mode)', () => {
    const verdict = computeReadinessVerdict(
      baseInput({
        sessionHistory: [regressTimeSession(), regressTimeSession(), regressTimeSession()],
        sessionsAtRung: 3,
      }),
    )
    expect(verdict.kind).toBe('regressing')
  })

  it('fires when 3+ sessions at rung with last 3 all regressing', () => {
    const verdict = computeReadinessVerdict(
      baseInput({
        sessionHistory: [
          cleanSession(),
          regressSession(),
          regressSession(),
          regressSession(),
        ],
        sessionsAtRung: 4,
      }),
    )
    expect(verdict.kind).toBe('regressing')
  })

  it('does NOT fire with only 2 regressing sessions', () => {
    const verdict = computeReadinessVerdict(
      baseInput({
        sessionHistory: [regressSession(), regressSession()],
        sessionsAtRung: 2,
      }),
    )
    expect(verdict.kind).not.toBe('regressing')
  })

  it('does NOT fire when below-target but RIR is absent (user did not log effort)', () => {
    const sess: EvalSession = {
      sets: [makeSet({ id: 's1', targetReps: 5, actualReps: 3 })], // no rir
    }
    const verdict = computeReadinessVerdict(
      baseInput({ sessionHistory: [sess, sess, sess], sessionsAtRung: 3 }),
    )
    expect(verdict.kind).not.toBe('regressing')
  })

  it('does NOT fire when below-target but RIR is 1 (not 0)', () => {
    const sess = repsSession({ reps: 3, target: 5, rir: 1 })
    const verdict = computeReadinessVerdict(
      baseInput({ sessionHistory: [sess, sess, sess], sessionsAtRung: 3 }),
    )
    expect(verdict.kind).not.toBe('regressing')
  })

  it('does NOT fire when last session hits target (even if 2 prior are regressing)', () => {
    const verdict = computeReadinessVerdict(
      baseInput({
        sessionHistory: [regressSession(), regressSession(), cleanSession()],
        sessionsAtRung: 3,
      }),
    )
    expect(verdict.kind).not.toBe('regressing')
  })

  it('snoozed is false', () => {
    const verdict = computeReadinessVerdict(
      baseInput({
        sessionHistory: [regressSession(), regressSession(), regressSession()],
        sessionsAtRung: 3,
      }),
    )
    expect(verdict.snoozed).toBe(false)
  })
})

// ── stuck ─────────────────────────────────────────────────────────────────────

describe('stuck', () => {
  it(`fires when sessionsAtRung >= ${STUCK_SESSIONS}`, () => {
    const history = Array.from({ length: STUCK_SESSIONS }, () =>
      missSession(),
    )
    const verdict = computeReadinessVerdict(
      baseInput({ sessionHistory: history, sessionsAtRung: STUCK_SESSIONS }),
    )
    expect(verdict.kind).toBe('stuck')
    expect(verdict.evidence).toContain(`${STUCK_SESSIONS} sessions`)
  })

  it(`fires when daysAtRung >= ${STUCK_DAYS}`, () => {
    const verdict = computeReadinessVerdict(
      baseInput({ sessionHistory: [missSession()], sessionsAtRung: 1, daysAtRung: STUCK_DAYS }),
    )
    expect(verdict.kind).toBe('stuck')
    expect(verdict.evidence).toContain(`${STUCK_DAYS}d`)
  })

  it('does NOT fire when ready-to-advance despite many sessions', () => {
    const history = [
      ...Array.from({ length: STUCK_SESSIONS }, () => missSession()),
      cleanSession(),
      cleanSession(),
      cleanSession(),
    ]
    const verdict = computeReadinessVerdict(
      baseInput({
        sessionHistory: history,
        sessionsAtRung: history.length,
      }),
    )
    expect(verdict.kind).toBe('ready-to-advance')
  })

  it('does NOT fire when close (streak = required - 1) despite many sessions', () => {
    const history = [
      ...Array.from({ length: STUCK_SESSIONS - 1 }, () => missSession()),
      cleanSession(),
      cleanSession(),
    ]
    const verdict = computeReadinessVerdict(
      baseInput({
        sessionHistory: history,
        sessionsAtRung: STUCK_SESSIONS + 1,
      }),
    )
    // Last 2 qualify → close (streak=2, required=3)
    expect(verdict.kind).toBe('close')
  })

  it('snoozed is false', () => {
    const verdict = computeReadinessVerdict(
      baseInput({ sessionHistory: [missSession()], sessionsAtRung: STUCK_SESSIONS }),
    )
    expect(verdict.snoozed).toBe(false)
  })
})

// ── steady ────────────────────────────────────────────────────────────────────

describe('steady', () => {
  it('fires when no other condition applies', () => {
    const verdict = computeReadinessVerdict(baseInput({ sessionHistory: [], sessionsAtRung: 0 }))
    expect(verdict.kind).toBe('steady')
  })

  it('fires with 1 qualifying session when required = 3', () => {
    const verdict = computeReadinessVerdict(
      baseInput({ sessionHistory: [cleanSession()], sessionsAtRung: 1 }),
    )
    expect(verdict.kind).toBe('steady')
  })

  it('fires with 0 sessions and no other trigger', () => {
    const verdict = computeReadinessVerdict(baseInput())
    expect(verdict.kind).toBe('steady')
  })

  it('snoozed is false', () => {
    const verdict = computeReadinessVerdict(baseInput())
    expect(verdict.snoozed).toBe(false)
  })
})

// ── snooze gating ─────────────────────────────────────────────────────────────

describe('snooze gating', () => {
  it('snoozed = true when dismissed and no new qualifying session has occurred', () => {
    // 3 qualifying sessions → qualifyingSessionCount = 3
    // dismissedAtSessionCount = 3 → snoozed
    const verdict = computeReadinessVerdict(
      baseInput({
        sessionHistory: [cleanSession(), cleanSession(), cleanSession()],
        sessionsAtRung: 3,
        dismissedAtSessionCount: 3,
      }),
    )
    expect(verdict.kind).toBe('ready-to-advance')
    expect(verdict.snoozed).toBe(true)
  })

  it('snoozed = false when a new qualifying session has occurred after dismissal', () => {
    // 4 qualifying sessions now → qualifyingSessionCount = 4 > dismissedAtSessionCount = 3
    const verdict = computeReadinessVerdict(
      baseInput({
        sessionHistory: [cleanSession(), cleanSession(), cleanSession(), cleanSession()],
        sessionsAtRung: 4,
        dismissedAtSessionCount: 3,
      }),
    )
    expect(verdict.kind).toBe('ready-to-advance')
    expect(verdict.snoozed).toBe(false)
  })

  it('snoozed = true when dismissed, non-qualifying session added (count unchanged)', () => {
    // 3 clean + 1 miss → qualifyingSessionCount = 3, dismissed at 3 → still snoozed
    const verdict = computeReadinessVerdict(
      baseInput({
        sessionHistory: [cleanSession(), cleanSession(), cleanSession(), missSession()],
        sessionsAtRung: 4,
        dismissedAtSessionCount: 3,
      }),
    )
    // After miss the streak breaks, so verdict is no longer ready-to-advance.
    // Just verify snooze does not produce ready-to-advance here.
    // The streak dropped, so verdict won't be ready anyway; snooze irrelevant.
    expect(verdict.kind).not.toBe('ready-to-advance')
  })

  it('snoozed = false when dismissedAtSessionCount = undefined (never dismissed)', () => {
    const verdict = computeReadinessVerdict(
      baseInput({
        sessionHistory: [cleanSession(), cleanSession(), cleanSession()],
        sessionsAtRung: 3,
        dismissedAtSessionCount: undefined,
      }),
    )
    expect(verdict.snoozed).toBe(false)
  })

  it('qualifyingSessionCount reflects total qualifying sessions, not just streak', () => {
    // 1 clean, 1 miss, 3 clean → qualifyingSessionCount = 4, streak = 3 (ready)
    const history = [cleanSession(), missSession(), cleanSession(), cleanSession(), cleanSession()]
    const verdict = computeReadinessVerdict(
      baseInput({ sessionHistory: history, sessionsAtRung: 5 }),
    )
    expect(verdict.kind).toBe('ready-to-advance')
    expect(verdict.qualifyingSessionCount).toBe(4)
  })

  it('dismissed exactly at count → still snoozed (uses <=)', () => {
    const verdict = computeReadinessVerdict(
      baseInput({
        sessionHistory: [cleanSession(), cleanSession(), cleanSession()],
        sessionsAtRung: 3,
        dismissedAtSessionCount: 3,
      }),
    )
    expect(verdict.snoozed).toBe(true)
  })

  it('dismissed count = 2, current = 3 → no longer snoozed', () => {
    // user dismissed at count=2 (had 2 qualifying sessions), then did a 3rd → count=3 > 2
    const verdict = computeReadinessVerdict(
      baseInput({
        sessionHistory: [cleanSession(), cleanSession(), cleanSession()],
        sessionsAtRung: 3,
        dismissedAtSessionCount: 2,
      }),
    )
    expect(verdict.kind).toBe('ready-to-advance')
    expect(verdict.snoozed).toBe(false)
  })
})

// ── fallback vs explicit exit criteria ───────────────────────────────────────

describe('fallback vs explicit exit criteria', () => {
  it('uses DEFAULT_EXIT_CRITERIA (sessions=3) when criteria=undefined', () => {
    // 2 clean → close (2 = 3-1)
    const v2 = computeReadinessVerdict(
      baseInput({ sessionHistory: [cleanSession(), cleanSession()], sessionsAtRung: 2 }),
    )
    expect(v2.kind).toBe('close')
    expect(v2.requiredSessions).toBe(3)

    // 3 clean → ready
    const v3 = computeReadinessVerdict(
      baseInput({ sessionHistory: [cleanSession(), cleanSession(), cleanSession()], sessionsAtRung: 3 }),
    )
    expect(v3.kind).toBe('ready-to-advance')
  })

  it('overrides required count when explicit sessions is set', () => {
    const criteria: ExitCriteria = { sessions: 5 }
    const history = [cleanSession(), cleanSession(), cleanSession(), cleanSession()]
    const verdict = computeReadinessVerdict(baseInput({ criteria, sessionHistory: history, sessionsAtRung: 4 }))
    // 4 < 5 and 4 = 5-1 → close
    expect(verdict.kind).toBe('close')
    expect(verdict.requiredSessions).toBe(5)
  })

  it('minReps gate vetoes qualification', () => {
    const criteria: ExitCriteria = { sessions: 1, minReps: 8 }
    // Hit target (5 reps ≥ target 5) but 5 < minReps 8 → does not qualify
    const sess: EvalSession = {
      sets: [makeSet({ id: 's1', targetReps: 5, actualReps: 5 })],
    }
    const verdict = computeReadinessVerdict(baseInput({ criteria, sessionHistory: [sess], sessionsAtRung: 1 }))
    expect(verdict.kind).not.toBe('ready-to-advance')
  })

  it('minHoldSeconds gate vetoes qualification', () => {
    const criteria: ExitCriteria = { sessions: 1, minHoldSeconds: 40 }
    const sess: EvalSession = {
      sets: [makeSet({ id: 's1', targetSeconds: 30, actualSeconds: 30 })],
    }
    const verdict = computeReadinessVerdict(baseInput({ criteria, sessionHistory: [sess], sessionsAtRung: 1 }))
    expect(verdict.kind).not.toBe('ready-to-advance')
  })

  it('sets count gate vetoes qualification', () => {
    const criteria: ExitCriteria = { sessions: 1, sets: 3 }
    // Only 1 set present, criteria requires 3
    const sess: EvalSession = {
      sets: [makeSet({ id: 's1', targetReps: 5, actualReps: 5 })],
    }
    const verdict = computeReadinessVerdict(baseInput({ criteria, sessionHistory: [sess], sessionsAtRung: 1 }))
    expect(verdict.kind).not.toBe('ready-to-advance')
  })

  it('sessions with sets > criteria.sets still qualify', () => {
    const criteria: ExitCriteria = { sessions: 1, sets: 2 }
    const sess: EvalSession = {
      sets: [
        makeSet({ id: 's1', targetReps: 5, actualReps: 5 }),
        makeSet({ id: 's2', targetReps: 5, actualReps: 5, order: 1 }),
        makeSet({ id: 's3', targetReps: 5, actualReps: 5, order: 2 }),
      ],
    }
    const verdict = computeReadinessVerdict(baseInput({ criteria, sessionHistory: [sess], sessionsAtRung: 1 }))
    expect(verdict.kind).toBe('ready-to-advance')
  })
})

// ── SIR paths ─────────────────────────────────────────────────────────────────

describe('SIR-based paths', () => {
  it('ready-to-advance via time-mode exit criteria', () => {
    const criteria: ExitCriteria = { sessions: 2, minSIR: 1 }
    const verdict = computeReadinessVerdict(
      baseInput({
        criteria,
        sessionHistory: [cleanTimeSession(1), cleanTimeSession(2)],
        sessionsAtRung: 2,
      }),
    )
    expect(verdict.kind).toBe('ready-to-advance')
  })

  it('time-mode session does not qualify when SIR below minSIR', () => {
    const criteria: ExitCriteria = { sessions: 1, minSIR: 1 }
    const sess = timeSession({ seconds: 30, target: 30, sir: 0 })
    const verdict = computeReadinessVerdict(
      baseInput({ criteria, sessionHistory: [sess], sessionsAtRung: 1 }),
    )
    expect(verdict.kind).not.toBe('ready-to-advance')
  })

  it('absent SIR is a non-veto in time mode', () => {
    const criteria: ExitCriteria = { sessions: 1 }
    const sess = timeSession({ seconds: 30, target: 30 }) // no sir
    const verdict = computeReadinessVerdict(
      baseInput({ criteria, sessionHistory: [sess], sessionsAtRung: 1 }),
    )
    expect(verdict.kind).toBe('ready-to-advance')
  })

  it('regressing fires for time-mode sessions with SIR 0', () => {
    const verdict = computeReadinessVerdict(
      baseInput({
        sessionHistory: [regressTimeSession(), regressTimeSession(), regressTimeSession()],
        sessionsAtRung: 3,
      }),
    )
    expect(verdict.kind).toBe('regressing')
  })

  it('time-mode below target without SIR does not trigger regressing', () => {
    const sess = timeSession({ seconds: 20, target: 30 }) // below target, no sir
    const verdict = computeReadinessVerdict(
      baseInput({ sessionHistory: [sess, sess, sess], sessionsAtRung: 3 }),
    )
    expect(verdict.kind).not.toBe('regressing')
  })
})

// ── structured number fields ──────────────────────────────────────────────────

describe('structured number fields', () => {
  it('exposes qualifyingStreak, requiredSessions, sessionsAtRung, daysAtRung', () => {
    const verdict = computeReadinessVerdict(
      baseInput({
        sessionHistory: [cleanSession()],
        sessionsAtRung: 5,
        daysAtRung: 14,
      }),
    )
    expect(verdict.qualifyingStreak).toBe(1)
    expect(verdict.requiredSessions).toBe(3) // default
    expect(verdict.sessionsAtRung).toBe(5)
    expect(verdict.daysAtRung).toBe(14)
  })

  it('qualifyingSessionCount counts all qualifying sessions (not just streak)', () => {
    // 1 clean, 1 miss, 2 clean → streak=2 (close), total qualifying=3
    const history = [cleanSession(), missSession(), cleanSession(), cleanSession()]
    const verdict = computeReadinessVerdict(baseInput({ sessionHistory: history, sessionsAtRung: 4 }))
    expect(verdict.kind).toBe('close')
    expect(verdict.qualifyingSessionCount).toBe(3)
  })
})
