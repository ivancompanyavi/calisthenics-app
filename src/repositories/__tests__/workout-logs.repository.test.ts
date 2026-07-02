import './setup'
import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '@/db'
import { workoutLogsRepository } from '@/repositories/workout-logs.repository'
import { clearAllTables } from './setup'
import type { WorkoutLog, SetLog, Workout } from '@/models/types'

// Build a workout log row with sensible defaults.
function makeLog(
  id: string,
  workoutId: string,
  completedAt: number,
  workoutName = 'W',
): WorkoutLog {
  return {
    id,
    workoutId,
    workoutName,
    startedAt: completedAt - 1000,
    completedAt,
  }
}

function makeSet(
  id: string,
  workoutLogId: string,
  movementId: string,
  overrides: Partial<SetLog> = {},
): SetLog {
  return {
    id,
    workoutLogId,
    movementId,
    movementName: 'Movement',
    round: 0,
    order: 0,
    ...overrides,
  }
}

function makeWorkout(id: string, name: string): Workout {
  return { id, name, createdAt: 0 }
}

describe('workoutLogsRepository.getRepsSuggestions', () => {
  beforeEach(async () => {
    await clearAllTables()
  })

  it('returns empty map when no history exists', async () => {
    const result = await workoutLogsRepository.getRepsSuggestions('w1', ['m1'])
    expect(result.size).toBe(0)
  })

  it('suggests +1 from max actualReps when last session was a clean hit', async () => {
    const log = makeLog('log1', 'w1', 100)
    await db.workoutLogs.add(log)
    await db.setLogs.bulkAdd([
      makeSet('s1', 'log1', 'm1', { targetReps: 5, actualReps: 5 }),
      makeSet('s2', 'log1', 'm1', { targetReps: 5, actualReps: 6, order: 1 }),
    ])

    const result = await workoutLogsRepository.getRepsSuggestions('w1', ['m1'])
    const suggestion = result.get('m1')
    expect(suggestion?.suggestedReps).toBe(7) // max(5,6)+1
  })

  it('holds (no suggestion) when last session had a missed set', async () => {
    const log = makeLog('log1', 'w1', 100)
    await db.workoutLogs.add(log)
    await db.setLogs.bulkAdd([
      makeSet('s1', 'log1', 'm1', { targetReps: 5, actualReps: 5 }),
      makeSet('s2', 'log1', 'm1', { targetReps: 5, actualReps: 4, order: 1 }),
    ])

    const result = await workoutLogsRepository.getRepsSuggestions('w1', ['m1'])
    expect(result.has('m1')).toBe(false)
  })

  it('holds when any logged RIR is below 2 (close to failure)', async () => {
    const log = makeLog('log1', 'w1', 100)
    await db.workoutLogs.add(log)
    await db.setLogs.bulkAdd([
      makeSet('s1', 'log1', 'm1', { targetReps: 5, actualReps: 5, rir: 3 }),
      makeSet('s2', 'log1', 'm1', { targetReps: 5, actualReps: 5, rir: 1, order: 1 }),
    ])

    const result = await workoutLogsRepository.getRepsSuggestions('w1', ['m1'])
    expect(result.has('m1')).toBe(false)
  })

  it('bumps when all logged RIR are >= 2', async () => {
    const log = makeLog('log1', 'w1', 100)
    await db.workoutLogs.add(log)
    await db.setLogs.bulkAdd([
      makeSet('s1', 'log1', 'm1', { targetReps: 5, actualReps: 5, rir: 3 }),
      makeSet('s2', 'log1', 'm1', { targetReps: 5, actualReps: 5, rir: 2, order: 1 }),
    ])

    const result = await workoutLogsRepository.getRepsSuggestions('w1', ['m1'])
    expect(result.get('m1')?.suggestedReps).toBe(6)
  })

  it('ignores skipped sets when judging cleanliness', async () => {
    const log = makeLog('log1', 'w1', 100)
    await db.workoutLogs.add(log)
    await db.setLogs.bulkAdd([
      makeSet('s1', 'log1', 'm1', { targetReps: 5, actualReps: 5 }),
      makeSet('s2', 'log1', 'm1', { skipped: true, order: 1 }),
    ])

    const result = await workoutLogsRepository.getRepsSuggestions('w1', ['m1'])
    expect(result.get('m1')?.suggestedReps).toBe(6)
  })

  it('uses only the most recent session per movement', async () => {
    await db.workoutLogs.bulkAdd([
      makeLog('old', 'w1', 100),
      makeLog('new', 'w1', 200),
    ])
    await db.setLogs.bulkAdd([
      makeSet('s1', 'old', 'm1', { targetReps: 5, actualReps: 10 }),
      makeSet('s2', 'new', 'm1', { targetReps: 5, actualReps: 5 }),
    ])

    const result = await workoutLogsRepository.getRepsSuggestions('w1', ['m1'])
    // Most recent (the "new" log) had a clean hit at 5 — bump to 6, not 11.
    expect(result.get('m1')?.suggestedReps).toBe(6)
  })

  it('does not cross-contaminate across workouts', async () => {
    // Both workouts have the same movement, but Pull A's bump shouldn't
    // affect Pull B's suggestion or vice versa.
    await db.workoutLogs.bulkAdd([
      makeLog('logA', 'pull-a', 100),
      makeLog('logB', 'pull-b', 200),
    ])
    await db.setLogs.bulkAdd([
      makeSet('sA', 'logA', 'm1', { targetReps: 2, actualReps: 2 }),
      makeSet('sB', 'logB', 'm1', { targetReps: 3, actualReps: 3 }),
    ])

    const resultA = await workoutLogsRepository.getRepsSuggestions('pull-a', ['m1'])
    const resultB = await workoutLogsRepository.getRepsSuggestions('pull-b', ['m1'])
    expect(resultA.get('m1')?.suggestedReps).toBe(3)
    expect(resultB.get('m1')?.suggestedReps).toBe(4)
  })

  it('returns no suggestion for movements only logged in max/time mode', async () => {
    const log = makeLog('log1', 'w1', 100)
    await db.workoutLogs.add(log)
    await db.setLogs.add(
      // No actualReps — only actualSeconds (a max-mode session).
      makeSet('s1', 'log1', 'm1', { actualSeconds: 30 }),
    )

    const result = await workoutLogsRepository.getRepsSuggestions('w1', ['m1'])
    expect(result.has('m1')).toBe(false)
  })
})

describe('workoutLogsRepository.getAllPRs — testDay flag', () => {
  beforeEach(async () => {
    await clearAllTables()
  })

  it('flags bestRepsTestDay when the PR-setting set came from a Test Day session (id match)', async () => {
    // Seed the Test Day workout in the DB so the id-based lookup works.
    const testDayWorkout = makeWorkout('td-id', 'Test Day (Week 6)')
    await db.workouts.add(testDayWorkout)

    const log = makeLog('log1', 'td-id', 100)
    await db.workoutLogs.add(log)
    await db.setLogs.add(makeSet('s1', 'log1', 'm1', { actualReps: 10 }))

    const prs = await workoutLogsRepository.getAllPRs()
    expect(prs.get('m1')?.bestReps).toBe(10)
    expect(prs.get('m1')?.bestRepsTestDay).toBe(true)
  })

  it('does not flag bestRepsTestDay for a regular session', async () => {
    const log = makeLog('log1', 'regular-workout-id', 100)
    await db.workoutLogs.add(log)
    await db.setLogs.add(makeSet('s1', 'log1', 'm1', { actualReps: 8 }))

    const prs = await workoutLogsRepository.getAllPRs()
    expect(prs.get('m1')?.bestReps).toBe(8)
    expect(prs.get('m1')?.bestRepsTestDay).toBe(false)
  })

  it('falls back to name match for old logs predating the id link', async () => {
    // No workout row in the DB — simulates a DB-wipe reseed where the old log
    // still carries the old workoutId but matches by workoutName.
    const log = makeLog('log1', 'stale-id', 100, 'Test Day (Week 6)')
    await db.workoutLogs.add(log)
    await db.setLogs.add(makeSet('s1', 'log1', 'm1', { actualSeconds: 45 }))

    const prs = await workoutLogsRepository.getAllPRs()
    expect(prs.get('m1')?.bestSeconds).toBe(45)
    expect(prs.get('m1')?.bestSecondsTestDay).toBe(true)
  })

  it('flag follows the current best value (regular PR later beats the Test Day PR)', async () => {
    const testDayWorkout = makeWorkout('td-id', 'Test Day (Week 6)')
    await db.workouts.add(testDayWorkout)

    await db.workoutLogs.bulkAdd([
      makeLog('log1', 'td-id', 100),        // Test Day: 8 reps
      makeLog('log2', 'regular-id', 200),   // Regular: 10 reps (new best)
    ])
    await db.setLogs.bulkAdd([
      makeSet('s1', 'log1', 'm1', { actualReps: 8 }),
      makeSet('s2', 'log2', 'm1', { actualReps: 10 }),
    ])

    const prs = await workoutLogsRepository.getAllPRs()
    // The current best (10 reps) came from a regular session → not test day.
    expect(prs.get('m1')?.bestReps).toBe(10)
    expect(prs.get('m1')?.bestRepsTestDay).toBe(false)
  })

  it('flag follows the current best value (Test Day PR later beats the regular PR)', async () => {
    const testDayWorkout = makeWorkout('td-id', 'Test Day (Week 6)')
    await db.workouts.add(testDayWorkout)

    await db.workoutLogs.bulkAdd([
      makeLog('log1', 'regular-id', 100),  // Regular: 6 reps
      makeLog('log2', 'td-id', 200),       // Test Day: 9 reps (new best)
    ])
    await db.setLogs.bulkAdd([
      makeSet('s1', 'log1', 'm1', { actualReps: 6 }),
      makeSet('s2', 'log2', 'm1', { actualReps: 9 }),
    ])

    const prs = await workoutLogsRepository.getAllPRs()
    // The current best (9 reps) came from Test Day → is test day.
    expect(prs.get('m1')?.bestReps).toBe(9)
    expect(prs.get('m1')?.bestRepsTestDay).toBe(true)
  })

  it('tracks reps and seconds testDay flags independently', async () => {
    const testDayWorkout = makeWorkout('td-id', 'Test Day (Week 6)')
    await db.workouts.add(testDayWorkout)

    // Regular session: best reps. Test Day: best hold.
    await db.workoutLogs.bulkAdd([
      makeLog('log1', 'regular-id', 100),
      makeLog('log2', 'td-id', 200),
    ])
    await db.setLogs.bulkAdd([
      makeSet('s1', 'log1', 'm1', { actualReps: 12 }),
      makeSet('s2', 'log2', 'm1', { actualSeconds: 60 }),
    ])

    const prs = await workoutLogsRepository.getAllPRs()
    expect(prs.get('m1')?.bestReps).toBe(12)
    expect(prs.get('m1')?.bestRepsTestDay).toBe(false)
    expect(prs.get('m1')?.bestSeconds).toBe(60)
    expect(prs.get('m1')?.bestSecondsTestDay).toBe(true)
  })
})
