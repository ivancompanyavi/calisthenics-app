import './setup'
import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '@/db'
import { workoutLogsRepository } from '@/repositories/workout-logs.repository'
import { clearAllTables } from './setup'
import type { WorkoutLog, SetLog } from '@/models/types'

// Build a workout log row with sensible defaults.
function makeLog(
  id: string,
  workoutId: string,
  completedAt: number,
): WorkoutLog {
  return {
    id,
    workoutId,
    workoutName: 'W',
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
