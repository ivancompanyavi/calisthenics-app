import { useReducer, useEffect, useCallback, useRef } from 'react'
import type { InProgressWorkout } from '@/models/types'
import { inProgressRepository } from '@/repositories'
import {
  executionReducer,
  initialState,
  getCurrentEntry,
  computeTotalSets,
  computeProgress,
  type Action,
  type ExecutionState,
  type ResolvedBlock,
  type ResolvedEntry,
  type ExecutionPhase,
  type SkippedEntry,
} from '@/lib/execution-engine'

export type { ExecutionState, ResolvedBlock, ResolvedEntry, ExecutionPhase, SkippedEntry }

export function useWorkoutExecution() {
  const [state, dispatch] = useReducer(executionReducer, initialState)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }

    const entry = getCurrentEntry(state)
    const needsTick = state.phase === 'exercise' && (state.exerciseTimeRemaining > 0 || entry?.mode === 'max')
    if (needsTick) {
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
  }, [state.phase, state.exerciseTimeRemaining > 0, state.restRemaining > 0, state.currentEntryIndex, state.currentBlockIndex])

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
      await inProgressRepository.save(progress)
    }
    save()
  }, [state.currentBlockIndex, state.currentRound, state.currentEntryIndex, state.completedSets.length, state.phase])

  const totalSets = computeTotalSets(state.blocks)
  const progress = computeProgress(state.completedSets.length, totalSets)
  const currentEntry = getCurrentEntry(state)

  type InitPayload = Extract<Action, { type: 'INIT' }>['payload']
  const init = useCallback((payload: InitPayload) => {
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
