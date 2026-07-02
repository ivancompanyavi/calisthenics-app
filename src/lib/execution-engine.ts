import type { SetLog, TempoSpec, GateSpec, MovementFamily, PrepTag } from '@/models/types'
import { generateId } from '@/lib/utils'

export type ExecutionPhase = 'ready' | 'exercise' | 'adjust' | 'resting' | 'complete'

export interface ResolvedEntry {
  progressionId?: string
  // Populated alongside progressionId so display layers can show "via X
  // Progression · Lvl N/M" without needing to re-fetch the progression row.
  progressionName?: string
  progressionCurrentLevel?: number
  progressionLevelCount?: number
  movementId: string
  movementName: string
  movementPhoto?: Blob
  movementSeedImagePath?: string
  movementDescription?: string
  movementCoachingCues?: string
  movementReferenceUrl?: string
  mode: 'reps' | 'time' | 'max'
  targetReps?: number
  targetSeconds?: number
  perSide?: boolean
  restSeconds?: number
  tempo?: TempoSpec
  gate?: GateSpec
  // Movement classification — carried through from seed for warm-up derivation.
  // Optional: user-created movements that have no seed entry omit these.
  movementFamily?: MovementFamily
  movementPrepTags?: PrepTag[]
  // Auto-progression suggestion. Set when last clean hit warrants a bump.
  // Display layers show it alongside targetReps; the execution engine pre-
  // fills the adjust screen with this value when present.
  suggestedReps?: number
  suggestedRepsReason?: string
  // Loadable / banded prescription. Either field absent = the exercise isn't
  // load-tracked (most calisthenics moves). When present, the adjust screen
  // shows a matching input and the SetLog records the actual value.
  targetWeightKg?: number
  targetBandLevel?: number
}

export interface ResolvedBlock {
  type: 'set' | 'superset'
  rounds: number
  restSeconds: number
  entries: ResolvedEntry[]
  // When true, all SetLogs produced for this block get warmup=true so they
  // are excluded from PR derivation, progression readiness metrics, and
  // volume accounting.
  isWarmup?: boolean
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
  // Optional RIR for this set. `undefined` = user didn't log RIR. 0–4 range.
  adjustRir?: number
  // Optional SIR for this set. `undefined` = not captured (earlier sets or
  // reps mode). 0 = nothing left, 1 = ~5s left, 2 = 10s+ left.
  adjustSir?: 0 | 1 | 2
  // Adjust-phase weight + band level. Pre-filled from entry.targetWeightKg /
  // targetBandLevel on transition into adjust; undefined means the entry has
  // no load prescription (most calisthenics moves).
  adjustWeightKg?: number
  adjustBandLevel?: number
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
  | { type: 'REORDER_BLOCK_ENTRIES'; blockIndex: number; fromIndex: number; toIndex: number }
  | { type: 'START'; now: number }
  | { type: 'TICK_EXERCISE'; now: number }
  | { type: 'DONE_EXERCISE'; now: number }
  // RESYNC restarts the exercise timer at `now` (max-mode: zero the
  // elapsed counter; time-mode: re-arm the countdown from the target).
  // Used by the gate-prompt flow so timers don't accumulate while the user
  // is answering a readiness question.
  | { type: 'RESYNC_EXERCISE_TIMER'; now: number }
  | { type: 'SET_ADJUST_REPS'; value: number }
  | { type: 'SET_ADJUST_SECONDS'; value: number }
  | { type: 'SET_ADJUST_NOTES'; value: string }
  | { type: 'SET_ADJUST_RIR'; value: number | undefined }
  | { type: 'SET_ADJUST_SIR'; value: 0 | 1 | 2 | undefined }
  | { type: 'SET_ADJUST_WEIGHT_KG'; value: number | undefined }
  | { type: 'SET_ADJUST_BAND_LEVEL'; value: number | undefined }
  | { type: 'CONFIRM_ADJUST'; now: number }
  | { type: 'DELAY_EXERCISE'; now: number }
  | { type: 'SKIP_EXERCISE'; now: number; reason?: string }
  | { type: 'FINISH_WORKOUT' }
  | { type: 'TICK_REST'; now: number; noAutoStart?: boolean }
  | { type: 'SKIP_REST'; now: number }
  | { type: 'ADJUST_REST'; delta: number; now: number }

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
  adjustRir: undefined,
  adjustSir: undefined,
  adjustWeightKg: undefined,
  adjustBandLevel: undefined,
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
        adjustRir: undefined,
        adjustSir: undefined,
        adjustWeightKg: undefined,
        adjustBandLevel: undefined,
        restRemaining: 0,
        restTotal: 0,
        exerciseTimeRemaining: 0,
        exerciseTimeElapsed: 0,
        restEndsAt: 0,
        exerciseEndsAt: 0,
        exerciseStartedAt: 0,
      }

    case 'REORDER_BLOCK_ENTRIES': {
      // Only allowed in ready phase (pre-start). Silently no-ops otherwise so
      // the call site doesn't need to guard the phase.
      if (state.phase !== 'ready') return state
      const { blockIndex, fromIndex, toIndex } = action
      const block = state.blocks[blockIndex]
      if (!block) return state
      if (fromIndex === toIndex) return state
      if (fromIndex < 0 || fromIndex >= block.entries.length) return state
      if (toIndex < 0 || toIndex >= block.entries.length) return state

      const entries = [...block.entries]
      const [moved] = entries.splice(fromIndex, 1)
      entries.splice(toIndex, 0, moved)

      const newBlocks = state.blocks.map((b, i) =>
        i === blockIndex ? { ...b, entries } : b
      )
      return { ...state, blocks: newBlocks }
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
            adjustReps: entry?.suggestedReps ?? entry?.targetReps ?? 0,
            adjustWeightKg: entry?.targetWeightKg,
            adjustBandLevel: entry?.targetBandLevel,
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
        adjustReps: entry?.suggestedReps ?? entry?.targetReps ?? 0,
        adjustSeconds: entry?.mode === 'max' ? elapsed : (entry?.targetSeconds ?? 0),
        adjustWeightKg: entry?.targetWeightKg,
        adjustBandLevel: entry?.targetBandLevel,
      }
    }

    case 'SET_ADJUST_REPS':
      return { ...state, adjustReps: action.value }

    case 'SET_ADJUST_SECONDS':
      return { ...state, adjustSeconds: action.value }

    case 'SET_ADJUST_NOTES':
      return { ...state, adjustNotes: action.value }

    case 'SET_ADJUST_RIR':
      return { ...state, adjustRir: action.value }

    case 'SET_ADJUST_SIR':
      return { ...state, adjustSir: action.value }

    case 'SET_ADJUST_WEIGHT_KG':
      return { ...state, adjustWeightKg: action.value }

    case 'SET_ADJUST_BAND_LEVEL':
      return { ...state, adjustBandLevel: action.value }

    case 'RESYNC_EXERCISE_TIMER': {
      if (state.phase !== 'exercise') return state
      const entry = getCurrentEntry(state)
      return { ...state, ...startExerciseFields(entry, action.now) }
    }

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

      const currentBlockIsWarmup = state.blocks[state.currentBlockIndex]?.isWarmup === true
      const skippedLog: SetLog = {
        id: generateId(),
        workoutLogId: '',
        movementId: entry?.movementId ?? '',
        movementName: entry?.movementName ?? 'Unknown',
        progressionId: entry?.progressionId,
        targetReps: entry?.targetReps,
        targetSeconds: entry?.targetSeconds,
        perSide: entry?.perSide,
        skipped: true,
        round: state.currentRound,
        order: state.completedSets.length,
        notes: action.reason,
        warmup: currentBlockIsWarmup || undefined,
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

      const confirmBlockIsWarmup = state.blocks[state.currentBlockIndex]?.isWarmup === true
      const setLog: SetLog = {
        id: generateId(),
        workoutLogId: '',
        movementId: entry.movementId,
        movementName: entry.movementName,
        progressionId: entry.progressionId,
        // Save the actually-attempted target (suggestion when present, else
        // the entry's prescription). Future auto-suggestions key off this
        // value so the bump rolls forward across sessions.
        targetReps: entry.suggestedReps ?? entry.targetReps,
        actualReps: entry.mode === 'reps' ? state.adjustReps : undefined,
        targetSeconds: entry.targetSeconds,
        actualSeconds: (entry.mode === 'time' || entry.mode === 'max') ? state.adjustSeconds : undefined,
        perSide: entry.perSide,
        notes: state.adjustNotes || undefined,
        round: state.currentRound,
        order: state.completedSets.length,
        rir: state.adjustRir,
        sir: state.adjustSir,
        targetWeightKg: entry.targetWeightKg,
        actualWeightKg: state.adjustWeightKg,
        targetBandLevel: entry.targetBandLevel,
        actualBandLevel: state.adjustBandLevel,
        warmup: confirmBlockIsWarmup || undefined,
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
            adjustRir: undefined,
            adjustSir: undefined,
            adjustWeightKg: undefined,
            adjustBandLevel: undefined,
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
          adjustRir: undefined,
          adjustSir: undefined,
          adjustWeightKg: undefined,
          adjustBandLevel: undefined,
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
        adjustRir: undefined,
        adjustSir: undefined,
        adjustWeightKg: undefined,
        adjustBandLevel: undefined,
        currentEntryIndex: nextEntryIndex,
        ...startExerciseFields(nextEntry, action.now),
      }
    }

    case 'TICK_REST': {
      const endsAt = state.restEndsAt
      // noAutoStart=true: caller handles the transition (tap-to-continue mode).
      // noAutoStart=false/undefined (default): auto-transition when timer expires.
      const noAutoStart = action.noAutoStart ?? false
      if (!noAutoStart && endsAt && action.now >= endsAt) {
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

    case 'ADJUST_REST': {
      if (state.phase !== 'resting') return state
      const newEndsAt = state.restEndsAt + action.delta * 1000
      // When a negative delta puts the deadline in the past, end rest immediately.
      if (newEndsAt <= action.now) {
        const entry = getCurrentEntry(state)
        return {
          ...state,
          phase: 'exercise',
          restRemaining: 0,
          restEndsAt: 0,
          ...startExerciseFields(entry, action.now),
        }
      }
      const newRemaining = Math.ceil((newEndsAt - action.now) / 1000)
      return {
        ...state,
        restEndsAt: newEndsAt,
        restRemaining: newRemaining,
      }
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
