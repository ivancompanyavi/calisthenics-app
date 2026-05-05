import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { db } from '@/db'
import type { Workout, WorkoutBlock, BlockEntry } from '@/models/types'
import { generateId } from '@/lib/utils'

export function useWorkouts() {
  return useQuery({
    queryKey: ['workouts'],
    queryFn: () => db.workouts.orderBy('createdAt').reverse().toArray(),
  })
}

export function useWorkout(id: string | undefined) {
  return useQuery({
    queryKey: ['workouts', id],
    queryFn: () => (id ? db.workouts.get(id) : undefined),
    enabled: !!id,
  })
}

export function useWorkoutBlocks(workoutId: string | undefined) {
  return useQuery({
    queryKey: ['workoutBlocks', workoutId],
    queryFn: async () => {
      if (!workoutId) return []
      return db.workoutBlocks.where('workoutId').equals(workoutId).sortBy('order')
    },
    enabled: !!workoutId,
  })
}

export function useBlockEntries(blockId: string | undefined) {
  return useQuery({
    queryKey: ['blockEntries', blockId],
    queryFn: async () => {
      if (!blockId) return []
      return db.blockEntries.where('blockId').equals(blockId).sortBy('order')
    },
    enabled: !!blockId,
  })
}

export function useAllBlockEntries(blockIds: string[]) {
  return useQuery({
    queryKey: ['blockEntries', 'bulk', blockIds],
    queryFn: async () => {
      if (blockIds.length === 0) return []
      return db.blockEntries.where('blockId').anyOf(blockIds).sortBy('order')
    },
    enabled: blockIds.length > 0,
  })
}

export interface SaveWorkoutData {
  name: string
  restBetweenBlocksSeconds?: number
  blocks: Array<{
    type: 'set' | 'superset'
    rounds: number
    restSeconds: number
    entries: Array<{
      progressionId: string
      mode: 'reps' | 'time' | 'max'
      targetReps?: number
      targetSeconds?: number
      perSide?: boolean
      restSeconds?: number
    }>
  }>
}

export function useSaveWorkout() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: SaveWorkoutData & { id?: string }) => {
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
              mode: entryData.mode,
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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['workouts'] })
      qc.invalidateQueries({ queryKey: ['workoutBlocks'] })
      qc.invalidateQueries({ queryKey: ['blockEntries'] })
    },
  })
}

export function useDeleteWorkout() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['workouts'] })
    },
  })
}
