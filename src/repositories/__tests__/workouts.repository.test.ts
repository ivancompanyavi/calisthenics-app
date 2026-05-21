import './setup'
import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '@/db'
import { workoutsRepository } from '@/repositories/workouts.repository'
import { clearAllTables } from './setup'
import type { Movement, Progression, ProgressionLevel, Workout, WorkoutBlock, BlockEntry } from '@/models/types'

// Helper: build a movement row with sensible defaults so tests stay readable.
function makeMovement(overrides: Partial<Movement> & { id: string; name: string }): Movement {
  return { createdAt: 0, ...overrides }
}

function makeProgression(overrides: Partial<Progression> & { id: string; name: string }): Progression {
  return { currentLevel: 0, createdAt: 0, ...overrides }
}

function makeLevel(overrides: Partial<ProgressionLevel> & {
  id: string
  progressionId: string
  movementId: string
  order: number
  mode: ProgressionLevel['mode']
}): ProgressionLevel {
  return { ...overrides }
}

function makeWorkout(overrides: Partial<Workout> & { id: string; name: string }): Workout {
  return { createdAt: 0, ...overrides }
}

describe('workoutsRepository', () => {
  beforeEach(async () => {
    await clearAllTables()
  })

  describe('save (create)', () => {
    it('persists a movement-kind entry with mode + targets', async () => {
      const movement = makeMovement({ id: 'm1', name: 'Push-Up' })
      await db.movements.add(movement)

      const workoutId = await workoutsRepository.save({
        name: 'Test Workout',
        blocks: [
          {
            type: 'set',
            rounds: 3,
            restSeconds: 60,
            entries: [
              { kind: 'movement', movementId: 'm1', mode: 'reps', targetReps: 10 },
            ],
          },
        ],
      })

      const blocks = await workoutsRepository.getBlocks(workoutId)
      expect(blocks).toHaveLength(1)
      const entries = await workoutsRepository.getEntries(blocks[0].id)
      expect(entries).toHaveLength(1)
      const entry = entries[0]
      expect(entry.kind).toBe('movement')
      if (entry.kind === 'movement') {
        expect(entry.movementId).toBe('m1')
        expect(entry.mode).toBe('reps')
        expect(entry.targetReps).toBe(10)
      }
    })

    it('persists a progression-kind entry without movementId/mode', async () => {
      await db.progressions.add(makeProgression({ id: 'p1', name: 'Pull' }))

      const workoutId = await workoutsRepository.save({
        name: 'Pull Day',
        blocks: [
          {
            type: 'set',
            rounds: 4,
            restSeconds: 120,
            entries: [{ kind: 'progression', progressionId: 'p1' }],
          },
        ],
      })

      const blocks = await workoutsRepository.getBlocks(workoutId)
      const entries = await workoutsRepository.getEntries(blocks[0].id)
      const entry = entries[0]
      expect(entry.kind).toBe('progression')
      if (entry.kind === 'progression') {
        expect(entry.progressionId).toBe('p1')
        expect(entry.movementId).toBeUndefined()
        expect(entry.mode).toBeUndefined()
      }
    })
  })

  describe('resolveBlocks', () => {
    it('resolves a progression entry against its current level movement', async () => {
      // Movements: tuck planche (level 0), straddle planche (level 1)
      await db.movements.bulkAdd([
        makeMovement({ id: 'mv-tuck', name: 'Tuck Planche' }),
        makeMovement({ id: 'mv-straddle', name: 'Straddle Planche' }),
      ])
      await db.progressions.add(makeProgression({ id: 'prog-planche', name: 'Planche', currentLevel: 1 }))
      await db.progressionLevels.bulkAdd([
        makeLevel({
          id: 'lvl-0', progressionId: 'prog-planche', movementId: 'mv-tuck', order: 0,
          mode: 'time', defaultTargetSeconds: 20,
        }),
        makeLevel({
          id: 'lvl-1', progressionId: 'prog-planche', movementId: 'mv-straddle', order: 1,
          mode: 'time', defaultTargetSeconds: 15,
        }),
      ])
      await db.workouts.add(makeWorkout({ id: 'w1', name: 'Planche Day' }))

      const block: WorkoutBlock = {
        id: 'b1', workoutId: 'w1', type: 'set', order: 0, rounds: 3, restSeconds: 90,
      }
      await db.workoutBlocks.add(block)
      const entry: BlockEntry = {
        id: 'e1', blockId: 'b1', order: 0, kind: 'progression', progressionId: 'prog-planche',
      }
      await db.blockEntries.add(entry)

      const resolved = await workoutsRepository.resolveBlocks([block], [entry])

      expect(resolved).toHaveLength(1)
      expect(resolved[0].entries).toHaveLength(1)
      const resolvedEntry = resolved[0].entries[0]
      // currentLevel=1 should pick the straddle movement, not tuck.
      expect(resolvedEntry.movementId).toBe('mv-straddle')
      expect(resolvedEntry.movementName).toBe('Straddle Planche')
      expect(resolvedEntry.progressionId).toBe('prog-planche')
      expect(resolvedEntry.mode).toBe('time')
      expect(resolvedEntry.targetSeconds).toBe(15)
    })

    it('resolves a movement-kind entry using entry-level fields', async () => {
      await db.movements.add(makeMovement({ id: 'mv-1', name: 'Bulgarian Split Squat' }))
      await db.workouts.add(makeWorkout({ id: 'w1', name: 'Legs' }))

      const block: WorkoutBlock = {
        id: 'b1', workoutId: 'w1', type: 'set', order: 0, rounds: 4, restSeconds: 60,
      }
      await db.workoutBlocks.add(block)
      const entry: BlockEntry = {
        id: 'e1', blockId: 'b1', order: 0,
        kind: 'movement', movementId: 'mv-1', mode: 'reps', targetReps: 8, perSide: true,
      }
      await db.blockEntries.add(entry)

      const resolved = await workoutsRepository.resolveBlocks([block], [entry])
      const resolvedEntry = resolved[0].entries[0]

      expect(resolvedEntry.movementId).toBe('mv-1')
      expect(resolvedEntry.movementName).toBe('Bulgarian Split Squat')
      expect(resolvedEntry.progressionId).toBeUndefined()
      expect(resolvedEntry.mode).toBe('reps')
      expect(resolvedEntry.targetReps).toBe(8)
      expect(resolvedEntry.perSide).toBe(true)
    })

    it('issues at most 3 IDB lookups regardless of entry count (no N+1)', async () => {
      // Build a workout with 10 entries against 2 progressions. The old
      // resolveBlocks would have done O(entries) lookups; the batched
      // version does 3 (progressions, levels, movements).
      await db.movements.bulkAdd([
        makeMovement({ id: 'mv-a', name: 'A' }),
        makeMovement({ id: 'mv-b', name: 'B' }),
      ])
      await db.progressions.bulkAdd([
        makeProgression({ id: 'p-a', name: 'Prog A' }),
        makeProgression({ id: 'p-b', name: 'Prog B' }),
      ])
      await db.progressionLevels.bulkAdd([
        makeLevel({ id: 'la', progressionId: 'p-a', movementId: 'mv-a', order: 0, mode: 'reps', defaultTargetReps: 10 }),
        makeLevel({ id: 'lb', progressionId: 'p-b', movementId: 'mv-b', order: 0, mode: 'reps', defaultTargetReps: 8 }),
      ])

      const block: WorkoutBlock = {
        id: 'b1', workoutId: 'w1', type: 'set', order: 0, rounds: 1, restSeconds: 30,
      }
      const entries: BlockEntry[] = Array.from({ length: 10 }, (_, i) => ({
        id: `e${i}`, blockId: 'b1', order: i,
        kind: 'progression' as const,
        progressionId: i % 2 === 0 ? 'p-a' : 'p-b',
      }))

      const resolved = await workoutsRepository.resolveBlocks([block], entries)
      expect(resolved[0].entries).toHaveLength(10)
      // Each progression-A entry resolved to mv-a, each progression-B to mv-b.
      resolved[0].entries.forEach((e, i) => {
        expect(e.movementId).toBe(i % 2 === 0 ? 'mv-a' : 'mv-b')
      })
    })
  })

  describe('save (update)', () => {
    it('replaces blocks/entries while preserving workout id', async () => {
      await db.movements.add(makeMovement({ id: 'm1', name: 'Push-Up' }))

      const workoutId = await workoutsRepository.save({
        name: 'Initial',
        blocks: [
          {
            type: 'set', rounds: 1, restSeconds: 30,
            entries: [{ kind: 'movement', movementId: 'm1', mode: 'reps', targetReps: 5 }],
          },
        ],
      })

      // Update: change name + add a second entry.
      await workoutsRepository.save({
        id: workoutId,
        name: 'Updated',
        blocks: [
          {
            type: 'set', rounds: 2, restSeconds: 45,
            entries: [
              { kind: 'movement', movementId: 'm1', mode: 'reps', targetReps: 10 },
              { kind: 'movement', movementId: 'm1', mode: 'time', targetSeconds: 30 },
            ],
          },
        ],
      })

      const workout = await workoutsRepository.getById(workoutId)
      expect(workout?.name).toBe('Updated')
      const blocks = await workoutsRepository.getBlocks(workoutId)
      expect(blocks).toHaveLength(1)
      expect(blocks[0].rounds).toBe(2)
      const entries = await workoutsRepository.getEntries(blocks[0].id)
      expect(entries).toHaveLength(2)
      // Old entries are gone; only the new set is present.
      const ids = entries.map((e) => e.id)
      expect(new Set(ids).size).toBe(2)
    })
  })
})
