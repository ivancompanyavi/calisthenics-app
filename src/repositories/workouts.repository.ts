import { db } from '@/db'
import type { Movement, Progression, ProgressionLevel, Workout, WorkoutBlock, BlockEntry } from '@/models/types'
import type { ResolvedBlock, ResolvedEntry } from '@/lib/execution-engine'
import { generateId } from '@/lib/utils'

export interface SaveWorkoutData {
  name: string
  restBetweenBlocksSeconds?: number
  blocks: Array<{
    type: 'set' | 'superset'
    rounds: number
    restSeconds: number
    entries: Array<{
      progressionId?: string
      movementId?: string
      mode?: 'reps' | 'time' | 'max'
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
      // Dexie's behavior on undefined updates is version-dependent; coerce to 0
      // since the reducer treats both equivalently as "no rest between blocks".
      const restBetweenBlocksSeconds = data.restBetweenBlocksSeconds ?? 0
      if (data.id) {
        await db.workouts.update(workoutId, {
          name: data.name,
          restBetweenBlocksSeconds,
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
          restBetweenBlocksSeconds,
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
            movementId: entryData.movementId,
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
    // Two pre-fetch passes avoid an N+1: pull all progressions + their levels
    // first (the levels tell us which extra movements we need), then bulk-fetch
    // every movement referenced by either a direct entry or a progression level.
    const progressionIds = [...new Set(entries.map((e) => e.progressionId).filter(Boolean) as string[])]
    const [progressions, allLevels] = await Promise.all([
      progressionIds.length > 0 ? db.progressions.bulkGet(progressionIds) : Promise.resolve([] as (Progression | undefined)[]),
      progressionIds.length > 0
        ? db.progressionLevels.where('progressionId').anyOf(progressionIds).sortBy('order')
        : Promise.resolve([] as ProgressionLevel[]),
    ])

    const progressionMap = new Map<string, Progression>()
    for (const p of progressions) {
      if (p) progressionMap.set(p.id, p)
    }
    const levelsByProgression = new Map<string, ProgressionLevel[]>()
    for (const lvl of allLevels) {
      const arr = levelsByProgression.get(lvl.progressionId) ?? []
      arr.push(lvl)
      levelsByProgression.set(lvl.progressionId, arr)
    }

    const movementIdsFromEntries = entries.map((e) => e.movementId).filter(Boolean) as string[]
    const movementIdsFromLevels = allLevels.map((l) => l.movementId)
    const movementIds = [...new Set([...movementIdsFromEntries, ...movementIdsFromLevels])]
    const movements = movementIds.length > 0 ? await db.movements.bulkGet(movementIds) : []
    const movementMap = new Map<string, Movement>()
    for (const m of movements) {
      if (m) movementMap.set(m.id, m)
    }

    const resolveEntry = (entry: BlockEntry): ResolvedEntry => {
      if (entry.movementId) {
        const movement = movementMap.get(entry.movementId)
        return {
          progressionId: undefined,
          movementId: movement?.id ?? entry.movementId,
          movementName: movement?.name ?? 'Unknown',
          movementPhoto: movement?.photo,
          movementSeedImagePath: movement?.seedImagePath,
          movementCoachingCues: movement?.coachingCues,
          mode: entry.mode ?? 'reps',
          targetReps: entry.targetReps,
          targetSeconds: entry.targetSeconds,
          perSide: entry.perSide,
          restSeconds: entry.restSeconds,
        }
      }

      const progression = progressionMap.get(entry.progressionId!)
      const levels = levelsByProgression.get(entry.progressionId!) ?? []
      const currentLevel = progression?.currentLevel ?? 0
      const level = levels[currentLevel] ?? levels[0]
      const movement = level ? movementMap.get(level.movementId) : undefined

      return {
        progressionId: entry.progressionId,
        movementId: movement?.id ?? '',
        movementName: movement?.name ?? 'Unknown',
        movementPhoto: movement?.photo,
        movementSeedImagePath: movement?.seedImagePath,
        movementCoachingCues: movement?.coachingCues,
        mode: level?.mode ?? 'reps',
        targetReps: entry.targetReps ?? level?.defaultTargetReps,
        targetSeconds: entry.targetSeconds ?? level?.defaultTargetSeconds,
        perSide: entry.perSide ?? level?.perSide,
        restSeconds: entry.restSeconds,
      }
    }

    return blocks.map((block) => {
      const blockEntries = entries
        .filter((e) => e.blockId === block.id)
        .sort((a, b) => a.order - b.order)
      return {
        type: block.type,
        rounds: block.rounds,
        restSeconds: block.restSeconds,
        entries: blockEntries.map(resolveEntry),
      }
    })
  },
}
