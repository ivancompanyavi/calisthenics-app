import { db } from '@/db'
import type { Workout, WorkoutBlock, BlockEntry } from '@/models/types'
import type { ResolvedBlock } from '@/lib/execution-engine'
import { generateId } from '@/lib/utils'

export interface SaveWorkoutData {
  name: string
  restBetweenBlocksSeconds?: number
  blocks: Array<{
    type: 'set' | 'superset'
    rounds: number
    restSeconds: number
    entries: Array<{
      progressionId: string
      targetReps?: number
      targetSeconds?: number
      perSide?: boolean
      restSeconds?: number
    }>
  }>
}

export const workoutsRepository = {
  getAll: () => db.workouts.orderBy('createdAt').reverse().toArray(),

  getById: (id: string) => db.workouts.get(id),

  getBlocks: (workoutId: string) =>
    db.workoutBlocks.where('workoutId').equals(workoutId).sortBy('order'),

  getEntries: (blockId: string) =>
    db.blockEntries.where('blockId').equals(blockId).sortBy('order'),

  getEntriesBulk: (blockIds: string[]) =>
    db.blockEntries.where('blockId').anyOf(blockIds).sortBy('order'),

  save: async (data: SaveWorkoutData & { id?: string }) => {
    const workoutId = data.id ?? generateId()

    await db.transaction('rw', [db.workouts, db.workoutBlocks, db.blockEntries], async () => {
      if (data.id) {
        await db.workouts.update(workoutId, {
          name: data.name,
          restBetweenBlocksSeconds: data.restBetweenBlocksSeconds,
        })
        const existingBlocks = await db.workoutBlocks.where('workoutId').equals(workoutId).toArray()
        const blockIds = existingBlocks.map((b) => b.id)
        if (blockIds.length > 0) {
          await db.blockEntries.where('blockId').anyOf(blockIds).delete()
        }
        await db.workoutBlocks.where('workoutId').equals(workoutId).delete()
      } else {
        const workout: Workout = {
          id: workoutId,
          name: data.name,
          restBetweenBlocksSeconds: data.restBetweenBlocksSeconds,
          createdAt: Date.now(),
        }
        await db.workouts.add(workout)
      }

      for (let i = 0; i < data.blocks.length; i++) {
        const blockData = data.blocks[i]
        const block: WorkoutBlock = {
          id: generateId(),
          workoutId,
          type: blockData.type,
          order: i,
          rounds: blockData.rounds,
          restSeconds: blockData.restSeconds,
        }
        await db.workoutBlocks.add(block)

        for (let j = 0; j < blockData.entries.length; j++) {
          const entryData = blockData.entries[j]
          const entry: BlockEntry = {
            id: generateId(),
            blockId: block.id,
            progressionId: entryData.progressionId,
            targetReps: entryData.targetReps,
            targetSeconds: entryData.targetSeconds,
            perSide: entryData.perSide,
            restSeconds: entryData.restSeconds,
            order: j,
          }
          await db.blockEntries.add(entry)
        }
      }
    })

    return workoutId
  },

  delete: async (id: string) => {
    await db.transaction('rw', [db.workouts, db.workoutBlocks, db.blockEntries], async () => {
      const blocks = await db.workoutBlocks.where('workoutId').equals(id).toArray()
      const blockIds = blocks.map((b) => b.id)
      if (blockIds.length > 0) {
        await db.blockEntries.where('blockId').anyOf(blockIds).delete()
      }
      await db.workoutBlocks.where('workoutId').equals(id).delete()
      await db.workouts.delete(id)
    })
  },

  resolveBlocks: async (blocks: WorkoutBlock[], entries: BlockEntry[]): Promise<ResolvedBlock[]> => {
    const resolved: ResolvedBlock[] = []
    for (const block of blocks) {
      const blockEntries = entries
        .filter((e) => e.blockId === block.id)
        .sort((a, b) => a.order - b.order)

      const resolvedEntries = await Promise.all(
        blockEntries.map(async (entry) => {
          const progression = await db.progressions.get(entry.progressionId)
          const levels = await db.progressionLevels
            .where('progressionId')
            .equals(entry.progressionId)
            .sortBy('order')
          const currentLevel = progression?.currentLevel ?? 0
          const level = levels[currentLevel] ?? levels[0]
          const movement = level ? await db.movements.get(level.movementId) : undefined

          return {
            progressionId: entry.progressionId,
            movementId: movement?.id ?? '',
            movementName: movement?.name ?? 'Unknown',
            movementPhoto: movement?.photo,
            mode: level?.mode ?? 'reps',
            targetReps: entry.targetReps ?? level?.defaultTargetReps,
            targetSeconds: entry.targetSeconds ?? level?.defaultTargetSeconds,
            perSide: entry.perSide ?? level?.perSide,
            restSeconds: entry.restSeconds,
          }
        })
      )

      resolved.push({
        type: block.type,
        rounds: block.rounds,
        restSeconds: block.restSeconds,
        entries: resolvedEntries,
      })
    }
    return resolved
  },
}
