import { useReducer, useEffect, useCallback, useRef } from 'react'
import { db } from '@/db'
import type { SetLog, InProgressWorkout } from '@/models/types'
import { generateId } from '@/lib/utils'

export type ExecutionPhase = 'ready' | 'exercise' | 'adjust' | 'resting' | 'complete'

export interface ResolvedEntry {
  progressionId: string
  movementId: string
  movementName: string
  movementPhoto?: Blob
  mode: 'reps' | 'time'
  targetReps?: number
  targetSeconds?: number
}

export interface ResolvedBlock {
  type: 'set' | 'superset'
  rounds: number
  restSeconds: number
  entries: ResolvedEntry[]
}

export interface ExecutionState {
  phase: ExecutionPhase
  workoutId: string
  workoutName: string
  blocks: ResolvedBlock[]
  startedAt: number
  currentBlockIndex: number
  currentRound: number
  currentEntryIndex: number
  completedSets: SetLog[]
  adjustReps: number
  adjustSeconds: number
  restRemaining: number
  exerciseTimeRemaining: number
}

type Action =
  | { type: 'INIT'; payload: Omit<ExecutionState, 'phase' | 'adjustReps' | 'adjustSeconds' | 'restRemaining' | 'exerciseTimeRemaining'> }
  | { type: 'START' }
  | { type: 'TICK_EXERCISE' }
  | { type: 'DONE_EXERCISE' }
  | { type: 'SET_ADJUST_REPS'; value: number }
  | { type: 'SET_ADJUST_SECONDS'; value: number }
  | { type: 'CONFIRM_ADJUST' }
  | { type: 'TICK_REST' }
  | { type: 'SKIP_REST' }

function getCurrentEntry(state: ExecutionState): ResolvedEntry | null {
  const block = state.blocks[state.currentBlockIndex]
  if (!block) return null
  return block.entries[state.currentEntryIndex] ?? null
}

function getNextPosition(state: ExecutionState): { blockIndex: number; round: number; entryIndex: number } | null {
  const block = state.blocks[state.currentBlockIndex]
  if (!block) return null

  const nextEntryIndex = state.currentEntryIndex + 1
  if (nextEntryIndex < block.entries.length) {
    return { blockIndex: state.currentBlockIndex, round: state.currentRound, entryIndex: nextEntryIndex }
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

function isLastEntryInRestGroup(state: ExecutionState): boolean {
  const block = state.blocks[state.currentBlockIndex]
  if (!block) return true

  if (block.type === 'set') return true

  return state.currentEntryIndex === block.entries.length - 1
}

function reducer(state: ExecutionState, action: Action): ExecutionState {
  switch (action.type) {
    case 'INIT':
      return {
        ...action.payload,
        phase: 'ready',
        adjustReps: 0,
        adjustSeconds: 0,
        restRemaining: 0,
        exerciseTimeRemaining: 0,
      }

    case 'START': {
      const entry = getCurrentEntry({ ...state, phase: 'exercise' })
      return {
        ...state,
        phase: 'exercise',
        exerciseTimeRemaining: entry?.mode === 'time' ? (entry.targetSeconds ?? 30) : 0,
      }
    }

    case 'TICK_EXERCISE': {
      if (state.exerciseTimeRemaining <= 1) {
        const entry = getCurrentEntry(state)
        return {
          ...state,
          phase: 'adjust',
          exerciseTimeRemaining: 0,
          adjustSeconds: entry?.targetSeconds ?? 0,
          adjustReps: entry?.targetReps ?? 0,
        }
      }
      return { ...state, exerciseTimeRemaining: state.exerciseTimeRemaining - 1 }
    }

    case 'DONE_EXERCISE': {
      const entry = getCurrentEntry(state)
      return {
        ...state,
        phase: 'adjust',
        adjustReps: entry?.targetReps ?? 0,
        adjustSeconds: entry?.targetSeconds ?? 0,
      }
    }

    case 'SET_ADJUST_REPS':
      return { ...state, adjustReps: action.value }

    case 'SET_ADJUST_SECONDS':
      return { ...state, adjustSeconds: action.value }

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
        actualSeconds: entry.mode === 'time' ? state.adjustSeconds : undefined,
        round: state.currentRound,
        order: state.completedSets.length,
      }

      const newCompletedSets = [...state.completedSets, setLog]
      const block = state.blocks[state.currentBlockIndex]

      if (isLastEntryInRestGroup(state)) {
        const next = getNextPosition(state)
        if (!next) {
          return { ...state, phase: 'complete', completedSets: newCompletedSets }
        }

        if (block.restSeconds > 0) {
          return {
            ...state,
            phase: 'resting',
            completedSets: newCompletedSets,
            restRemaining: block.restSeconds,
            currentBlockIndex: next.blockIndex,
            currentRound: next.round,
            currentEntryIndex: next.entryIndex,
          }
        }

        const nextEntry = state.blocks[next.blockIndex]?.entries[next.entryIndex]
        return {
          ...state,
          phase: 'exercise',
          completedSets: newCompletedSets,
          currentBlockIndex: next.blockIndex,
          currentRound: next.round,
          currentEntryIndex: next.entryIndex,
          exerciseTimeRemaining: nextEntry?.mode === 'time' ? (nextEntry.targetSeconds ?? 30) : 0,
        }
      }

      const nextEntryIndex = state.currentEntryIndex + 1
      const nextEntry = block.entries[nextEntryIndex]
      return {
        ...state,
        phase: 'exercise',
        completedSets: newCompletedSets,
        currentEntryIndex: nextEntryIndex,
        exerciseTimeRemaining: nextEntry?.mode === 'time' ? (nextEntry.targetSeconds ?? 30) : 0,
      }
    }

    case 'TICK_REST': {
      if (state.restRemaining <= 1) {
        const entry = getCurrentEntry(state)
        return {
          ...state,
          phase: 'exercise',
          restRemaining: 0,
          exerciseTimeRemaining: entry?.mode === 'time' ? (entry.targetSeconds ?? 30) : 0,
        }
      }
      return { ...state, restRemaining: state.restRemaining - 1 }
    }

    case 'SKIP_REST': {
      const entry = getCurrentEntry(state)
      return {
        ...state,
        phase: 'exercise',
        restRemaining: 0,
        exerciseTimeRemaining: entry?.mode === 'time' ? (entry.targetSeconds ?? 30) : 0,
      }
    }

    default:
      return state
  }
}

const initialState: ExecutionState = {
  phase: 'ready',
  workoutId: '',
  workoutName: '',
  blocks: [],
  startedAt: 0,
  currentBlockIndex: 0,
  currentRound: 0,
  currentEntryIndex: 0,
  completedSets: [],
  adjustReps: 0,
  adjustSeconds: 0,
  restRemaining: 0,
  exerciseTimeRemaining: 0,
}

export function useWorkoutExecution() {
  const [state, dispatch] = useReducer(reducer, initialState)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }

    if (state.phase === 'exercise' && state.exerciseTimeRemaining > 0) {
      timerRef.current = setInterval(() => {
        dispatch({ type: 'TICK_EXERCISE' })
      }, 1000)
    } else if (state.phase === 'resting' && state.restRemaining > 0) {
      timerRef.current = setInterval(() => {
        dispatch({ type: 'TICK_REST' })
      }, 1000)
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [state.phase, state.exerciseTimeRemaining > 0, state.restRemaining > 0])

  useEffect(() => {
    if (state.phase === 'ready' || state.phase === 'complete' || !state.workoutId) return

    const save = async () => {
      const progress: InProgressWorkout = {
        id: 'current',
        workoutId: state.workoutId,
        workoutName: state.workoutName,
        startedAt: state.startedAt,
        currentBlockIndex: state.currentBlockIndex,
        currentRound: state.currentRound,
        currentEntryIndex: state.currentEntryIndex,
        completedSets: state.completedSets,
      }
      await db.inProgressWorkout.put(progress)
    }
    save()
  }, [state.currentBlockIndex, state.currentRound, state.currentEntryIndex, state.completedSets.length, state.phase])

  const totalSets = state.blocks.reduce((sum, block) => {
    return sum + block.entries.length * block.rounds
  }, 0)

  const progress = totalSets > 0 ? state.completedSets.length / totalSets : 0

  const currentEntry = getCurrentEntry(state)

  const init = useCallback((payload: Omit<ExecutionState, 'phase' | 'adjustReps' | 'adjustSeconds' | 'restRemaining' | 'exerciseTimeRemaining'>) => {
    dispatch({ type: 'INIT', payload })
  }, [])

  return {
    state,
    dispatch,
    currentEntry,
    progress,
    totalSets,
    init,
  }
}
