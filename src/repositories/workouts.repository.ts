import { db } from '@/db'
import type { Movement, Progression, ProgressionLevel, Workout, WorkoutBlock, BlockEntry } from '@/models/types'
import type { ResolvedBlock, ResolvedEntry } from '@/lib/execution-engine'
import { workoutLogsRepository, type RepsSuggestion } from './workout-logs.repository'
import { generateId } from '@/lib/utils'
import type { WorkoutEntryGroup } from '@/lib/advance-audit'

interface SaveEntryShared {
  targetReps?: number
  targetSeconds?: number
  perSide?: boolean
  restSeconds?: number
  targetWeightKg?: number
  targetBandLevel?: number
}

export type SaveEntry =
  | (SaveEntryShared & { kind: 'progression'; progressionId: string })
  | (SaveEntryShared & { kind: 'movement'; movementId: string; mode: 'reps' | 'time' | 'max' })

export interface SaveWorkoutData {
  name: string
  restBetweenBlocksSeconds?: number
  blocks: Array<{
    type: 'set' | 'superset'
    rounds: number
    restSeconds: number
    entries: SaveEntry[]
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
          const shared = {
            id: generateId(),
            blockId: block.id,
            order: j,
            targetReps: entryData.targetReps,
            targetSeconds: entryData.targetSeconds,
            perSide: entryData.perSide,
            restSeconds: entryData.restSeconds,
            targetWeightKg: entryData.targetWeightKg,
            targetBandLevel: entryData.targetBandLevel,
          }
          const entry: BlockEntry = entryData.kind === 'progression'
            ? { ...shared, kind: 'progression', progressionId: entryData.progressionId }
            : { ...shared, kind: 'movement', movementId: entryData.movementId, mode: entryData.mode }
          await db.blockEntries.add(entry)
        }
      }
    })

    return workoutId
  },

  /**
   * Returns every workout paired with its flat list of block entries.
   * Used by the advance-audit to detect movement-kind entries that directly
   * reference a movement the user is about to advance a progression into.
   */
  getWorkoutEntryGroups: async (): Promise<WorkoutEntryGroup[]> => {
    const [workouts, blocks, entries] = await Promise.all([
      db.workouts.toArray(),
      db.workoutBlocks.toArray(),
      db.blockEntries.toArray(),
    ])
    const blockToWorkoutId = new Map(blocks.map((b) => [b.id, b.workoutId]))
    const workoutEntryMap = new Map<string, BlockEntry[]>()
    for (const entry of entries) {
      const workoutId = blockToWorkoutId.get(entry.blockId)
      if (!workoutId) continue
      const arr = workoutEntryMap.get(workoutId) ?? []
      arr.push(entry)
      workoutEntryMap.set(workoutId, arr)
    }
    return workouts.map((w) => ({
      workoutName: w.name,
      entries: workoutEntryMap.get(w.id) ?? [],
    }))
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
    const workoutId = blocks[0]?.workoutId
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

    // Auto-progression suggestions. Scoped per-workout — see
    // workoutLogsRepository.getRepsSuggestions for the rule. Empty when no
    // workoutId yet (draft preview before the workout exists).
    const suggestions = workoutId
      ? await workoutLogsRepository.getRepsSuggestions(workoutId, movementIds)
      : new Map<string, RepsSuggestion>()

    const resolveEntry = (entry: BlockEntry): ResolvedEntry => {
      if (entry.kind === 'movement') {
        const movement = movementMap.get(entry.movementId)
        const movementId = movement?.id ?? entry.movementId
        // Only surface a suggestion when the prescribed mode is reps — for
        // time/max mode auto-progression doesn't have a defined rule yet.
        const suggestion = entry.mode === 'reps' ? suggestions.get(movementId) : undefined
        return {
          progressionId: undefined,
          movementId,
          movementName: movement?.name ?? 'Unknown',
          movementPhoto: movement?.photo,
          movementSeedImagePath: movement?.seedImagePath,
          movementDescription: movement?.description,
          movementCoachingCues: movement?.coachingCues,
          movementReferenceUrl: movement?.referenceUrl,
          mode: entry.mode,
          targetReps: entry.targetReps,
          targetSeconds: entry.targetSeconds,
          perSide: entry.perSide,
          restSeconds: entry.restSeconds,
          tempo: entry.tempo,
          gate: entry.gate,
          suggestedReps: suggestion?.suggestedReps,
          suggestedRepsReason: suggestion?.reason,
          targetWeightKg: entry.targetWeightKg,
          targetBandLevel: entry.targetBandLevel,
        }
      }

      const progression = progressionMap.get(entry.progressionId)
      const levels = levelsByProgression.get(entry.progressionId) ?? []
      const currentLevel = progression?.currentLevel ?? 0
      const level = levels[currentLevel] ?? levels[0]
      const movement = level ? movementMap.get(level.movementId) : undefined
      const movementId = movement?.id ?? ''
      const mode = level?.mode ?? 'reps'
      const suggestion = mode === 'reps' ? suggestions.get(movementId) : undefined

      return {
        progressionId: entry.progressionId,
        progressionName: progression?.name,
        progressionCurrentLevel: currentLevel + 1, // 1-indexed for display
        progressionLevelCount: levels.length,
        movementId,
        movementName: movement?.name ?? 'Unknown',
        movementPhoto: movement?.photo,
        movementSeedImagePath: movement?.seedImagePath,
        movementDescription: movement?.description,
        movementCoachingCues: movement?.coachingCues,
        movementReferenceUrl: movement?.referenceUrl,
        mode,
        targetReps: entry.targetReps ?? level?.defaultTargetReps,
        targetSeconds: entry.targetSeconds ?? level?.defaultTargetSeconds,
        perSide: entry.perSide ?? level?.perSide,
        restSeconds: entry.restSeconds,
        tempo: entry.tempo,
        gate: entry.gate,
        suggestedReps: suggestion?.suggestedReps,
        suggestedRepsReason: suggestion?.reason,
        targetWeightKg: entry.targetWeightKg,
        targetBandLevel: entry.targetBandLevel,
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
