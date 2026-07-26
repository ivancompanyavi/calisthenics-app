import '@/repositories/__tests__/setup'
import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '@/db'
import { clearAllTables } from '@/repositories/__tests__/setup'
import { seedDatabase } from '@/db/seed'
import { SEED_WORKOUTS } from '@/db/seed/workouts'
import { SEED_PROGRAMS } from '@/db/seed/programs'
import { RETIRED_WORKOUT_NAMES, RETIRED_PROGRAM_NAMES } from '@/db/seed/retired'
import type { Workout, WorkoutBlock, Program, ProgramDay, ActiveProgram } from '@/models/types'

// The prune step is the only part of the seed that DELETES rows, and it runs on
// every app start against the owner's real training data. These tests pin down
// both halves of that contract: retired content actually goes away (on a device
// that already has it), and nothing else is touched.

const SEED_FINGERPRINT = 'stale-fingerprint'

function makeWorkout(id: string, name: string, seedOwned: boolean): Workout {
  return {
    id,
    name,
    createdAt: 0,
    ...(seedOwned ? { seedFingerprint: SEED_FINGERPRINT } : {}),
  }
}

function makeProgram(id: string, name: string, seedOwned: boolean): Program {
  return {
    id,
    name,
    cycleLengthDays: 7,
    totalCycles: 0,
    createdAt: 0,
    ...(seedOwned ? { seedFingerprint: SEED_FINGERPRINT } : {}),
  }
}

describe('retired seed content', () => {
  it('never lists a name the live seed still claims', () => {
    // A collision here would mean the pruner deletes current content — it
    // guards against that at runtime, but the lists should agree by construction.
    const liveWorkouts = new Set(
      SEED_WORKOUTS.flatMap((w) => [w.name, ...(w.previousNames ?? [])]),
    )
    const livePrograms = new Set(
      SEED_PROGRAMS.flatMap((p) => [p.name, ...(p.previousNames ?? [])]),
    )
    expect(RETIRED_WORKOUT_NAMES.filter((n) => liveWorkouts.has(n))).toEqual([])
    expect(RETIRED_PROGRAM_NAMES.filter((n) => livePrograms.has(n))).toEqual([])
  })

  it('has no duplicate entries', () => {
    expect(new Set(RETIRED_WORKOUT_NAMES).size).toBe(RETIRED_WORKOUT_NAMES.length)
    expect(new Set(RETIRED_PROGRAM_NAMES).size).toBe(RETIRED_PROGRAM_NAMES.length)
  })
})

describe('seedDatabase — pruning retired content', () => {
  beforeEach(async () => {
    await clearAllTables()
  })

  it('leaves only the live seed programs and workouts', async () => {
    await seedDatabase()
    const workouts = (await db.workouts.toArray()).map((w) => w.name).sort()
    const programs = (await db.programs.toArray()).map((p) => p.name).sort()
    expect(workouts).toEqual(SEED_WORKOUTS.map((w) => w.name).sort())
    expect(programs).toEqual(SEED_PROGRAMS.map((p) => p.name).sort())
  })

  it('deletes a retired workout left over from an older seed, with its blocks', async () => {
    const retiredName = RETIRED_WORKOUT_NAMES[0]
    await db.workouts.add(makeWorkout('old-w', retiredName, true))
    const block: WorkoutBlock = {
      id: 'old-b',
      workoutId: 'old-w',
      type: 'set',
      order: 0,
      rounds: 3,
      restSeconds: 60,
    }
    await db.workoutBlocks.add(block)
    await db.blockEntries.add({
      id: 'old-e',
      blockId: 'old-b',
      order: 0,
      kind: 'movement',
      movementId: 'mv',
      mode: 'reps',
    })

    await seedDatabase()

    expect(await db.workouts.get('old-w')).toBeUndefined()
    expect(await db.workoutBlocks.get('old-b')).toBeUndefined()
    expect(await db.blockEntries.get('old-e')).toBeUndefined()
  })

  it('deletes a retired program with its days and any active run', async () => {
    const retiredName = RETIRED_PROGRAM_NAMES[0]
    await db.programs.add(makeProgram('old-p', retiredName, true))
    const day: ProgramDay = { id: 'old-d', programId: 'old-p', dayNumber: 1 }
    await db.programDays.add(day)
    const run: ActiveProgram = {
      id: 'old-run',
      programId: 'old-p',
      startedAt: 0,
      currentCycle: 1,
      status: 'active',
      cycleProgress: [],
    }
    await db.activePrograms.add(run)

    await seedDatabase()

    expect(await db.programs.get('old-p')).toBeUndefined()
    expect(await db.programDays.get('old-d')).toBeUndefined()
    expect(await db.activePrograms.get('old-run')).toBeUndefined()
  })

  it('never deletes a user-created row, even one named like retired content', async () => {
    // No seedFingerprint = the athlete built it by hand. Sacred.
    await db.workouts.add(makeWorkout('mine-w', RETIRED_WORKOUT_NAMES[0], false))
    await db.programs.add(makeProgram('mine-p', RETIRED_PROGRAM_NAMES[0], false))

    await seedDatabase()

    expect(await db.workouts.get('mine-w')).toBeDefined()
    expect(await db.programs.get('mine-p')).toBeDefined()
  })

  it('blanks a user program day that pointed at a retired workout', async () => {
    // Deleting their whole program would be overreach — just clear the slot.
    await db.workouts.add(makeWorkout('old-w', RETIRED_WORKOUT_NAMES[0], true))
    await db.programs.add(makeProgram('mine-p', 'My Own Program', false))
    await db.programDays.add({
      id: 'mine-d',
      programId: 'mine-p',
      dayNumber: 1,
      workoutId: 'old-w',
    })

    await seedDatabase()

    expect(await db.programs.get('mine-p')).toBeDefined()
    expect((await db.programDays.get('mine-d'))?.workoutId).toBeUndefined()
  })

  it('does not touch logged history', async () => {
    // Logs denormalize the names they display, so retiring a workout must not
    // erase the sessions performed against it.
    await db.workoutLogs.add({
      id: 'log1',
      workoutId: 'old-w',
      workoutName: RETIRED_WORKOUT_NAMES[0],
      startedAt: 0,
      completedAt: 1000,
    })
    await db.workouts.add(makeWorkout('old-w', RETIRED_WORKOUT_NAMES[0], true))

    await seedDatabase()

    const log = await db.workoutLogs.get('log1')
    expect(log).toBeDefined()
    expect(log!.workoutName).toBe(RETIRED_WORKOUT_NAMES[0])
  })

  it('is idempotent — a second run changes nothing', async () => {
    await seedDatabase()
    const before = {
      workouts: (await db.workouts.toArray()).map((w) => w.id).sort(),
      programs: (await db.programs.toArray()).map((p) => p.id).sort(),
    }
    await seedDatabase()
    expect((await db.workouts.toArray()).map((w) => w.id).sort()).toEqual(before.workouts)
    expect((await db.programs.toArray()).map((p) => p.id).sort()).toEqual(before.programs)
  })
})
