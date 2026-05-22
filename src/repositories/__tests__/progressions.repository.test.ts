import './setup'
import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '@/db'
import { progressionsRepository } from '@/repositories/progressions.repository'
import { clearAllTables } from './setup'
import type { Movement, Progression, ProgressionLevel, SetLog, WorkoutLog } from '@/models/types'

function makeMovement(id: string, name: string): Movement {
  return { id, name, createdAt: 0 }
}

function makeProgression(id: string, name: string, currentLevel = 0): Progression {
  return { id, name, currentLevel, createdAt: 0 }
}

function makeLevel(
  id: string,
  progressionId: string,
  movementId: string,
  order: number,
): ProgressionLevel {
  return { id, progressionId, movementId, order, mode: 'reps', defaultTargetReps: 10 }
}

function makeWorkoutLog(id: string, completedAt: number): WorkoutLog {
  return { id, workoutId: 'w-any', workoutName: 'Any', startedAt: completedAt - 60_000, completedAt }
}

function makeSetLog(overrides: Partial<SetLog> & { id: string; workoutLogId: string; movementId: string }): SetLog {
  return {
    movementName: '',
    round: 0,
    order: 0,
    targetReps: 10,
    actualReps: 10,
    ...overrides,
  }
}

describe('progressionsRepository.checkReadiness', () => {
  beforeEach(async () => {
    await clearAllTables()
  })

  it('returns no candidates when current workout missed target', async () => {
    await db.movements.add(makeMovement('mv-cur', 'Tuck Planche'))
    await db.progressions.add(makeProgression('p1', 'Planche'))
    await db.progressionLevels.bulkAdd([
      makeLevel('lvl-0', 'p1', 'mv-cur', 0),
      makeLevel('lvl-1', 'p1', 'mv-next', 1),
    ])

    const currentSets: SetLog[] = [
      makeSetLog({ id: 's1', workoutLogId: 'wl-current', movementId: 'mv-cur', actualReps: 5, targetReps: 10 }),
    ]

    const candidates = await progressionsRepository.checkReadiness(['p1'], currentSets)
    expect(candidates).toHaveLength(0)
  })

  it('returns no candidates when there is no prior workout for the movement', async () => {
    await db.movements.add(makeMovement('mv-cur', 'Tuck Planche'))
    await db.progressions.add(makeProgression('p1', 'Planche'))
    await db.progressionLevels.bulkAdd([
      makeLevel('lvl-0', 'p1', 'mv-cur', 0),
      makeLevel('lvl-1', 'p1', 'mv-next', 1),
    ])
    // No prior setLogs in db.

    const currentSets: SetLog[] = [
      makeSetLog({ id: 's1', workoutLogId: 'wl-current', movementId: 'mv-cur' }),
    ]
    const candidates = await progressionsRepository.checkReadiness(['p1'], currentSets)
    expect(candidates).toHaveLength(0)
  })

  it('returns candidate when current AND most-recent-prior workouts both hit target', async () => {
    await db.movements.bulkAdd([
      makeMovement('mv-cur', 'Tuck Planche'),
      makeMovement('mv-next', 'Advanced Tuck Planche'),
    ])
    await db.progressions.add(makeProgression('p1', 'Planche'))
    await db.progressionLevels.bulkAdd([
      makeLevel('lvl-0', 'p1', 'mv-cur', 0),
      makeLevel('lvl-1', 'p1', 'mv-next', 1),
    ])
    // Prior workout: all sets hit target.
    await db.workoutLogs.add(makeWorkoutLog('wl-prev', 1_700_000_000_000))
    await db.setLogs.bulkAdd([
      makeSetLog({ id: 'p1', workoutLogId: 'wl-prev', movementId: 'mv-cur' }),
      makeSetLog({ id: 'p2', workoutLogId: 'wl-prev', movementId: 'mv-cur' }),
    ])

    const currentSets: SetLog[] = [
      makeSetLog({ id: 's1', workoutLogId: 'wl-current', movementId: 'mv-cur' }),
      makeSetLog({ id: 's2', workoutLogId: 'wl-current', movementId: 'mv-cur' }),
    ]
    const candidates = await progressionsRepository.checkReadiness(['p1'], currentSets)
    expect(candidates).toHaveLength(1)
    expect(candidates[0].progressionName).toBe('Planche')
    expect(candidates[0].nextMovementName).toBe('Advanced Tuck Planche')
  })

  it('uses workoutLog.completedAt to pick the most recent prior workout (not setLog id order)', async () => {
    // This guards against the old bug where "last 20 setlogs by index order"
    // could pick the wrong workout. Here we set up two prior workouts:
    //   - wl-older (completedAt earlier): all sets hit target
    //   - wl-newer (completedAt later):   one set MISSED target
    // The correct behavior is to pick wl-newer (most recent) and reject.
    await db.movements.add(makeMovement('mv-cur', 'Tuck Planche'))
    await db.progressions.add(makeProgression('p1', 'Planche'))
    await db.progressionLevels.bulkAdd([
      makeLevel('lvl-0', 'p1', 'mv-cur', 0),
      makeLevel('lvl-1', 'p1', 'mv-next', 1),
    ])

    await db.workoutLogs.bulkAdd([
      makeWorkoutLog('wl-newer', 1_700_000_100_000),
      makeWorkoutLog('wl-older', 1_700_000_000_000),
    ])
    await db.setLogs.bulkAdd([
      // Use lexicographically LARGER id on the older workout, so the old
      // .reverse().limit(20) ordering would have surfaced this one first.
      makeSetLog({ id: 'zzz-older', workoutLogId: 'wl-older', movementId: 'mv-cur', actualReps: 10, targetReps: 10 }),
      makeSetLog({ id: 'aaa-newer', workoutLogId: 'wl-newer', movementId: 'mv-cur', actualReps: 3, targetReps: 10 }),
    ])

    const currentSets: SetLog[] = [
      makeSetLog({ id: 's1', workoutLogId: 'wl-current', movementId: 'mv-cur', actualReps: 10, targetReps: 10 }),
    ]
    const candidates = await progressionsRepository.checkReadiness(['p1'], currentSets)
    // Most recent workout (wl-newer) missed → not ready, even though the
    // older one passed.
    expect(candidates).toHaveLength(0)
  })

  it('skips progressions already at the top level', async () => {
    await db.movements.add(makeMovement('mv-top', 'Full Planche'))
    await db.progressions.add(makeProgression('p1', 'Planche', /*currentLevel*/ 0))
    await db.progressionLevels.add(makeLevel('lvl-0', 'p1', 'mv-top', 0))

    const currentSets: SetLog[] = [
      makeSetLog({ id: 's1', workoutLogId: 'wl-current', movementId: 'mv-top' }),
    ]
    const candidates = await progressionsRepository.checkReadiness(['p1'], currentSets)
    expect(candidates).toHaveLength(0)
  })

  it('handles multiple progressions in a single pass without extra round-trips', async () => {
    await db.movements.bulkAdd([
      makeMovement('mv-a', 'Move A'),
      makeMovement('mv-a-next', 'Move A Next'),
      makeMovement('mv-b', 'Move B'),
      makeMovement('mv-b-next', 'Move B Next'),
    ])
    await db.progressions.bulkAdd([
      makeProgression('pa', 'Prog A'),
      makeProgression('pb', 'Prog B'),
    ])
    await db.progressionLevels.bulkAdd([
      makeLevel('la0', 'pa', 'mv-a', 0),
      makeLevel('la1', 'pa', 'mv-a-next', 1),
      makeLevel('lb0', 'pb', 'mv-b', 0),
      makeLevel('lb1', 'pb', 'mv-b-next', 1),
    ])
    await db.workoutLogs.add(makeWorkoutLog('wl-prev', 1_700_000_000_000))
    await db.setLogs.bulkAdd([
      makeSetLog({ id: 'pa1', workoutLogId: 'wl-prev', movementId: 'mv-a' }),
      makeSetLog({ id: 'pb1', workoutLogId: 'wl-prev', movementId: 'mv-b' }),
    ])

    const currentSets: SetLog[] = [
      makeSetLog({ id: 'a1', workoutLogId: 'wl-current', movementId: 'mv-a' }),
      makeSetLog({ id: 'b1', workoutLogId: 'wl-current', movementId: 'mv-b' }),
    ]
    const candidates = await progressionsRepository.checkReadiness(['pa', 'pb'], currentSets)
    expect(candidates.map((c) => c.progressionName).sort()).toEqual(['Prog A', 'Prog B'])
  })
})
