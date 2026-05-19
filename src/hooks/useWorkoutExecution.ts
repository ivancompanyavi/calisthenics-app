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

// Wraps navigator.wakeLock so a workout keeps the screen on (and JS un-throttled).
function useScreenWakeLock(active: boolean) {
  const sentinelRef = useRef<WakeLockSentinel | null>(null)

  useEffect(() => {
    if (!active) return
    let cancelled = false

    const request = async () => {
      const wakeLock = navigator.wakeLock
      if (!wakeLock) return
      try {
        const sentinel = await wakeLock.request('screen')
        if (cancelled) {
          sentinel.release().catch(() => {})
          return
        }
        sentinelRef.current = sentinel
        sentinel.addEventListener('release', () => {
          if (sentinelRef.current === sentinel) sentinelRef.current = null
        })
      } catch {
        // User denied, browser doesn't support it, or some other transient failure.
        // Workout still runs — timestamps already make the timer correct on return.
      }
    }

    request()

    // Re-acquire if the page becomes visible again (browsers drop the lock on hide).
    const onVisibility = () => {
      if (document.visibilityState === 'visible' && !sentinelRef.current) request()
    }
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', onVisibility)
      const sentinel = sentinelRef.current
      sentinelRef.current = null
      sentinel?.release().catch(() => {})
    }
  }, [active])
}

export function useWorkoutExecution() {
  const [state, dispatch] = useReducer(executionReducer, initialState)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const workoutActive =
    state.phase !== 'ready' && state.phase !== 'complete' && !!state.workoutId
  useScreenWakeLock(workoutActive)

  useEffect(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }

    const entry = getCurrentEntry(state)
    const needsExerciseTick =
      state.phase === 'exercise' && (state.exerciseTimeRemaining > 0 || entry?.mode === 'max')
    const needsRestTick = state.phase === 'resting' && state.restRemaining > 0

    if (!needsExerciseTick && !needsRestTick) return

    const tick = () => {
      if (needsExerciseTick) {
        dispatch({ type: 'TICK_EXERCISE', now: Date.now() })
      } else {
        dispatch({ type: 'TICK_REST', now: Date.now() })
      }
    }

    timerRef.current = setInterval(tick, 1000)

    // When the app becomes visible again, fire an immediate tick so the
    // display catches up (background intervals on iOS/Android are throttled
    // or paused entirely; the reducer is timestamp-driven so one tick is
    // enough to resync — and may transition phases if the timer elapsed).
    const onVisibility = () => {
      if (document.visibilityState === 'visible') tick()
    }
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('focus', tick)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('focus', tick)
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
  const nonSkippedSets = state.completedSets.filter((s) => !s.skipped).length
  const progress = computeProgress(nonSkippedSets, totalSets, state.cancelledEntries.length)
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
