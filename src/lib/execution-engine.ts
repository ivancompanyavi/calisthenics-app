import type { SetLog } from '@/models/types'
import { generateId } from '@/lib/utils'

export type ExecutionPhase = 'ready' | 'exercise' | 'adjust' | 'resting' | 'complete'

export interface ResolvedEntry {
  progressionId?: string
  movementId: string
  movementName: string
  movementPhoto?: Blob
  movementSeedImagePath?: string
  movementCoachingCues?: string
  mode: 'reps' | 'time' | 'max'
  targetReps?: number
  targetSeconds?: number
  perSide?: boolean
  restSeconds?: number
}

export interface ResolvedBlock {
  type: 'set' | 'superset'
  rounds: number
  restSeconds: number
  entries: ResolvedEntry[]
}

export interface SkippedEntry {
  blockIndex: number
  round: number
  entryIndex: number
}

export interface ExecutionState {
  phase: ExecutionPhase
  workoutId: string
  workoutName: string
  blocks: ResolvedBlock[]
  restBetweenBlocksSeconds: number
  startedAt: number
  currentBlockIndex: number
  currentRound: number
  currentEntryIndex: number
  completedSets: SetLog[]
  skippedEntries: SkippedEntry[]
  cancelledEntries: SkippedEntry[]
  adjustReps: number
  adjustSeconds: number
  adjustNotes: string
  // Display values, derived from timestamps below on each tick.
  restRemaining: number
  restTotal: number
  exerciseTimeRemaining: number
  exerciseTimeElapsed: number
  // Source-of-truth timestamps (ms since epoch). 0 = inactive.
  // Stored so the timer survives the app being backgrounded — on resume we
  // recompute display values from Date.now() instead of relying on interval ticks.
  restEndsAt: number
  exerciseEndsAt: number
  exerciseStartedAt: number
}

export type Action =
  | { type: 'INIT'; payload: {
      workoutId: string
      workoutName: string
      blocks: ResolvedBlock[]
      restBetweenBlocksSeconds?: number
      startedAt: number
      currentBlockIndex: number
      currentRound: number
      currentEntryIndex: number
      completedSets: SetLog[]
    } }
  | { type: 'START'; now: number }
  | { type: 'TICK_EXERCISE'; now: number }
  | { type: 'DONE_EXERCISE'; now: number }
  | { type: 'SET_ADJUST_REPS'; value: number }
  | { type: 'SET_ADJUST_SECONDS'; value: number }
  | { type: 'SET_ADJUST_NOTES'; value: string }
  | { type: 'CONFIRM_ADJUST'; now: number }
  | { type: 'DELAY_EXERCISE'; now: number }
  | { type: 'SKIP_EXERCISE'; now: number }
  | { type: 'FINISH_WORKOUT' }
  | { type: 'TICK_REST'; now: number }
  | { type: 'SKIP_REST'; now: number }

export function getCurrentEntry(state: ExecutionState): ResolvedEntry | null {
  const block = state.blocks[state.currentBlockIndex]
  if (!block) return null
  return block.entries[state.currentEntryIndex] ?? null
}

export function getNextPosition(state: ExecutionState): { blockIndex: number; round: number; entryIndex: number } | null {
  const block = state.blocks[state.currentBlockIndex]
  if (!block) return null

  const nextEntryIndex = state.currentEntryIndex + 1
  if (nextEntryIndex < block.entries.length) {
    return { blockIndex: state.currentBlockIndex, round: state.currentRound, entryIndex: nextEntryIndex }
  }

  const skippedForRound = state.skippedEntries.find(
    (s) => s.blockIndex === state.currentBlockIndex && s.round === state.currentRound
  )
  if (skippedForRound) {
    return { blockIndex: skippedForRound.blockIndex, round: skippedForRound.round, entryIndex: skippedForRound.entryIndex }
  }

  const nextRound = state.currentRound + 1
  if (nextRound < block.rounds) {
    return { blockIndex: state.currentBlockIndex, round: nextRound, entryIndex: 0 }
  }

  const nextBlock = state.currentBlockIndex + 1
  if (nextBlock < state.blocks.length) {
    return { blockIndex: nextBlock, round: 0, entryIndex: 0 }
  }

  return null
}

export function isLastEntryInRestGroup(state: ExecutionState): boolean {
  const block = state.blocks[state.currentBlockIndex]
  if (!block) return true

  if (block.type === 'set') return true

  return state.currentEntryIndex === block.entries.length - 1
}

export const initialState: ExecutionState = {
  phase: 'ready',
  workoutId: '',
  workoutName: '',
  blocks: [],
  restBetweenBlocksSeconds: 0,
  startedAt: 0,
  currentBlockIndex: 0,
  currentRound: 0,
  currentEntryIndex: 0,
  completedSets: [],
  skippedEntries: [],
  cancelledEntries: [],
  adjustReps: 0,
  adjustSeconds: 0,
  adjustNotes: '',
  restRemaining: 0,
  restTotal: 0,
  exerciseTimeRemaining: 0,
  exerciseTimeElapsed: 0,
  restEndsAt: 0,
  exerciseEndsAt: 0,
  exerciseStartedAt: 0,
}

function startExerciseFields(entry: ResolvedEntry | null, now: number): Pick<
  ExecutionState,
  'exerciseTimeRemaining' | 'exerciseTimeElapsed' | 'exerciseEndsAt' | 'exerciseStartedAt'
> {
  if (!entry) {
    return { exerciseTimeRemaining: 0, exerciseTimeElapsed: 0, exerciseEndsAt: 0, exerciseStartedAt: 0 }
  }
  if (entry.mode === 'time') {
    const seconds = entry.targetSeconds ?? 30
    return {
      exerciseTimeRemaining: seconds,
      exerciseTimeElapsed: 0,
      exerciseEndsAt: now + seconds * 1000,
      exerciseStartedAt: 0,
    }
  }
  if (entry.mode === 'max') {
    return {
      exerciseTimeRemaining: 0,
      exerciseTimeElapsed: 0,
      exerciseEndsAt: 0,
      exerciseStartedAt: now,
    }
  }
  return { exerciseTimeRemaining: 0, exerciseTimeElapsed: 0, exerciseEndsAt: 0, exerciseStartedAt: 0 }
}

function startRestFields(durationSeconds: number, now: number): Pick<
  ExecutionState,
  'restRemaining' | 'restTotal' | 'restEndsAt'
> {
  return {
    restRemaining: durationSeconds,
    restTotal: durationSeconds,
    restEndsAt: now + durationSeconds * 1000,
  }
}

export function executionReducer(state: ExecutionState, action: Action): ExecutionState {
  switch (action.type) {
    case 'INIT':
      return {
        ...action.payload,
        restBetweenBlocksSeconds: action.payload.restBetweenBlocksSeconds ?? 0,
        phase: 'ready',
        skippedEntries: [],
        cancelledEntries: [],
        adjustReps: 0,
        adjustSeconds: 0,
        adjustNotes: '',
        restRemaining: 0,
        restTotal: 0,
        exerciseTimeRemaining: 0,
        exerciseTimeElapsed: 0,
        restEndsAt: 0,
        exerciseEndsAt: 0,
        exerciseStartedAt: 0,
      }

    case 'START': {
      const entry = getCurrentEntry({ ...state, phase: 'exercise' })
      return {
        ...state,
        phase: 'exercise',
        ...startExerciseFields(entry, action.now),
      }
    }

    case 'TICK_EXERCISE': {
      const entry = getCurrentEntry(state)
      if (entry?.mode === 'max') {
        const startedAt = state.exerciseStartedAt || action.now
        return {
          ...state,
          exerciseStartedAt: startedAt,
          exerciseTimeElapsed: Math.max(0, Math.floor((action.now - startedAt) / 1000)),
        }
      }
      if (entry?.mode === 'time') {
        const endsAt = state.exerciseEndsAt
        if (endsAt && action.now >= endsAt) {
          return {
            ...state,
            phase: 'adjust',
            exerciseTimeRemaining: 0,
            exerciseEndsAt: 0,
            adjustSeconds: entry?.targetSeconds ?? 0,
            adjustReps: entry?.targetReps ?? 0,
          }
        }
        const remaining = endsAt
          ? Math.max(0, Math.ceil((endsAt - action.now) / 1000))
          : state.exerciseTimeRemaining
        return { ...state, exerciseTimeRemaining: remaining }
      }
      return state
    }

    case 'DONE_EXERCISE': {
      const entry = getCurrentEntry(state)
      const elapsed = entry?.mode === 'max' && state.exerciseStartedAt
        ? Math.max(0, Math.floor((action.now - state.exerciseStartedAt) / 1000))
        : state.exerciseTimeElapsed
      return {
        ...state,
        phase: 'adjust',
        exerciseTimeElapsed: elapsed,
        exerciseStartedAt: 0,
        exerciseEndsAt: 0,
        adjustReps: entry?.targetReps ?? 0,
        adjustSeconds: entry?.mode === 'max' ? elapsed : (entry?.targetSeconds ?? 0),
      }
    }

    case 'SET_ADJUST_REPS':
      return { ...state, adjustReps: action.value }

    case 'SET_ADJUST_SECONDS':
      return { ...state, adjustSeconds: action.value }

    case 'SET_ADJUST_NOTES':
      return { ...state, adjustNotes: action.value }

    case 'DELAY_EXERCISE': {
      const block = state.blocks[state.currentBlockIndex]
      if (!block) return state

      const skipped: SkippedEntry = {
        blockIndex: state.currentBlockIndex,
        round: state.currentRound,
        entryIndex: state.currentEntryIndex,
      }
      const newSkipped = [...state.skippedEntries, skipped]

      const nextEntryIndex = state.currentEntryIndex + 1
      if (nextEntryIndex < block.entries.length) {
        const nextEntry = block.entries[nextEntryIndex]
        return {
          ...state,
          skippedEntries: newSkipped,
          currentEntryIndex: nextEntryIndex,
          ...startExerciseFields(nextEntry, action.now),
        }
      }

      const nextRound = state.currentRound + 1
      if (nextRound < block.rounds) {
        const firstEntry = block.entries[0]
        return {
          ...state,
          skippedEntries: newSkipped,
          currentRound: nextRound,
          currentEntryIndex: 0,
          ...startExerciseFields(firstEntry, action.now),
        }
      }

      const nextBlockIndex = state.currentBlockIndex + 1
      if (nextBlockIndex < state.blocks.length) {
        const nextBlock = state.blocks[nextBlockIndex]
        const firstEntry = nextBlock.entries[0]
        const restDuration = state.restBetweenBlocksSeconds > 0
          ? state.restBetweenBlocksSeconds
          : block.restSeconds

        if (restDuration > 0) {
          return {
            ...state,
            phase: 'resting',
            skippedEntries: newSkipped,
            ...startRestFields(restDuration, action.now),
            currentBlockIndex: nextBlockIndex,
            currentRound: 0,
            currentEntryIndex: 0,
          }
        }

        return {
          ...state,
          skippedEntries: newSkipped,
          currentBlockIndex: nextBlockIndex,
          currentRound: 0,
          currentEntryIndex: 0,
          ...startExerciseFields(firstEntry, action.now),
        }
      }

      return state
    }

    case 'SKIP_EXERCISE': {
      const block = state.blocks[state.currentBlockIndex]
      if (!block) return state

      const entry = getCurrentEntry(state)
      const cancelled: SkippedEntry = {
        blockIndex: state.currentBlockIndex,
        round: state.currentRound,
        entryIndex: state.currentEntryIndex,
      }
      const newCancelled = [...state.cancelledEntries, cancelled]

      const skippedLog: SetLog = {
        id: generateId(),
        workoutLogId: '',
        movementId: entry?.movementId ?? '',
        movementName: entry?.movementName ?? 'Unknown',
        targetReps: entry?.targetReps,
        targetSeconds: entry?.targetSeconds,
        perSide: entry?.perSide,
        skipped: true,
        round: state.currentRound,
        order: state.completedSets.length,
      }
      const newCompletedSets = [...state.completedSets, skippedLog]

      const nextEntryIndex = state.currentEntryIndex + 1
      if (nextEntryIndex < block.entries.length) {
        const nextEntry = block.entries[nextEntryIndex]
        return {
          ...state,
          cancelledEntries: newCancelled,
          completedSets: newCompletedSets,
          currentEntryIndex: nextEntryIndex,
          ...startExerciseFields(nextEntry, action.now),
        }
      }

      const nextRound = state.currentRound + 1
      if (nextRound < block.rounds) {
        const firstEntry = block.entries[0]
        return {
          ...state,
          cancelledEntries: newCancelled,
          completedSets: newCompletedSets,
          currentRound: nextRound,
          currentEntryIndex: 0,
          ...startExerciseFields(firstEntry, action.now),
        }
      }

      const nextBlockIndex = state.currentBlockIndex + 1
      if (nextBlockIndex < state.blocks.length) {
        const nextBlock = state.blocks[nextBlockIndex]
        const firstEntry = nextBlock.entries[0]
        const restDuration = state.restBetweenBlocksSeconds > 0
          ? state.restBetweenBlocksSeconds
          : block.restSeconds

        if (restDuration > 0) {
          return {
            ...state,
            phase: 'resting',
            cancelledEntries: newCancelled,
            completedSets: newCompletedSets,
            ...startRestFields(restDuration, action.now),
            currentBlockIndex: nextBlockIndex,
            currentRound: 0,
            currentEntryIndex: 0,
          }
        }

        return {
          ...state,
          cancelledEntries: newCancelled,
          completedSets: newCompletedSets,
          currentBlockIndex: nextBlockIndex,
          currentRound: 0,
          currentEntryIndex: 0,
          ...startExerciseFields(firstEntry, action.now),
        }
      }

      return { ...state, phase: 'complete', cancelledEntries: newCancelled, completedSets: newCompletedSets }
    }

    case 'FINISH_WORKOUT': {
      return { ...state, phase: 'complete' }
    }

    case 'CONFIRM_ADJUST': {
      const entry = getCurrentEntry(state)
      if (!entry) return state

      const setLog: SetLog = {
        id: generateId(),
        workoutLogId: '',
        movementId: entry.movementId,
        movementName: entry.movementName,
        targetReps: entry.targetReps,
        actualReps: entry.mode === 'reps' ? state.adjustReps : undefined,
        targetSeconds: entry.targetSeconds,
        actualSeconds: (entry.mode === 'time' || entry.mode === 'max') ? state.adjustSeconds : undefined,
        perSide: entry.perSide,
        notes: state.adjustNotes || undefined,
        round: state.currentRound,
        order: state.completedSets.length,
      }

      const newCompletedSets = [...state.completedSets, setLog]
      const newSkipped = state.skippedEntries.filter(
        (s) => !(s.blockIndex === state.currentBlockIndex && s.round === state.currentRound && s.entryIndex === state.currentEntryIndex)
      )
      const block = state.blocks[state.currentBlockIndex]

      if (isLastEntryInRestGroup(state)) {
        const stateWithSkips = { ...state, skippedEntries: newSkipped }
        const next = getNextPosition(stateWithSkips)
        if (!next) {
          return { ...state, phase: 'complete', completedSets: newCompletedSets, skippedEntries: newSkipped, adjustNotes: '' }
        }

        const isBlockTransition = next.blockIndex !== state.currentBlockIndex
        const restDuration = isBlockTransition && state.restBetweenBlocksSeconds > 0
          ? state.restBetweenBlocksSeconds
          : (entry.restSeconds ?? block.restSeconds)

        if (restDuration > 0) {
          return {
            ...state,
            phase: 'resting',
            completedSets: newCompletedSets,
            skippedEntries: newSkipped,
            adjustNotes: '',
            ...startRestFields(restDuration, action.now),
            currentBlockIndex: next.blockIndex,
            currentRound: next.round,
            currentEntryIndex: next.entryIndex,
          }
        }

        const nextEntry = state.blocks[next.blockIndex]?.entries[next.entryIndex] ?? null
        return {
          ...state,
          phase: 'exercise',
          completedSets: newCompletedSets,
          skippedEntries: newSkipped,
          adjustNotes: '',
          currentBlockIndex: next.blockIndex,
          currentRound: next.round,
          currentEntryIndex: next.entryIndex,
          ...startExerciseFields(nextEntry, action.now),
        }
      }

      const nextEntryIndex = state.currentEntryIndex + 1
      const nextEntry = block.entries[nextEntryIndex] ?? null
      return {
        ...state,
        phase: 'exercise',
        completedSets: newCompletedSets,
        skippedEntries: newSkipped,
        adjustNotes: '',
        currentEntryIndex: nextEntryIndex,
        ...startExerciseFields(nextEntry, action.now),
      }
    }

    case 'TICK_REST': {
      const endsAt = state.restEndsAt
      if (endsAt && action.now >= endsAt) {
        const entry = getCurrentEntry(state)
        return {
          ...state,
          phase: 'exercise',
          restRemaining: 0,
          restEndsAt: 0,
          ...startExerciseFields(entry, action.now),
        }
      }
      const remaining = endsAt
        ? Math.max(0, Math.ceil((endsAt - action.now) / 1000))
        : state.restRemaining
      return { ...state, restRemaining: remaining }
    }

    case 'SKIP_REST': {
      const entry = getCurrentEntry(state)
      return {
        ...state,
        phase: 'exercise',
        restRemaining: 0,
        restEndsAt: 0,
        ...startExerciseFields(entry, action.now),
      }
    }

    default:
      return state
  }
}

export function computeTotalSets(blocks: ResolvedBlock[]): number {
  return blocks.reduce((sum, block) => sum + block.entries.length * block.rounds, 0)
}

export function computeProgress(completedSets: number, totalSets: number, cancelledSets: number): number {
  const effectiveTotal = totalSets - cancelledSets
  return effectiveTotal > 0 ? completedSets / effectiveTotal : 0
}
