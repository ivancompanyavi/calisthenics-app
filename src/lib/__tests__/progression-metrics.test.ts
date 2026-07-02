import { describe, it, expect } from 'vitest'
import {
  hitsTarget,
  wasCleanHit,
  computeRungDiagnostic,
  deriveRepsSuggestion,
  STUCK_SESSIONS,
  STUCK_DAYS,
} from '../progression-metrics'
import type { SetLog } from '@/models/types'

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
