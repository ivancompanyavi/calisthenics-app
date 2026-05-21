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

export function useWorkoutExecution(programDayIndex?: number) {
  const [state, dispatch] = useReducer(executionReducer, initialState)

  const workoutActive =
    state.phase !== 'ready' && state.phase !== 'complete' && !!state.workoutId
  useScreenWakeLock(workoutActive)

  const currentEntry = getCurrentEntry(state)
  const needsExerciseTick =
    state.phase === 'exercise' && (state.exerciseTimeRemaining > 0 || currentEntry?.mode === 'max')
  const needsRestTick = state.phase === 'resting' && state.restRemaining > 0

  useEffect(() => {
    if (!needsExerciseTick && !needsRestTick) return

    const tick = () => {
      if (needsExerciseTick) {
        dispatch({ type: 'TICK_EXERCISE', now: Date.now() })
      } else {
        dispatch({ type: 'TICK_REST', now: Date.now() })
      }
    }

    // Self-rescheduling setTimeout aligned to the next wall-clock second avoids
    // the drift you'd accumulate with setInterval(_, 1000). The reducer is
    // timestamp-driven so a missed tick just means a one-shot resync.
    let timeoutId: ReturnType<typeof setTimeout> | null = null
    const scheduleNext = () => {
      const delay = 1000 - (Date.now() % 1000)
      timeoutId = setTimeout(() => {
        tick()
        scheduleNext()
      }, delay)
    }
    scheduleNext()

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
      if (timeoutId) clearTimeout(timeoutId)
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('focus', tick)
    }
  }, [needsExerciseTick, needsRestTick])

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
        programDayIndex,
      }
      await inProgressRepository.save(progress)
    }
    save()
    // The "save" trigger is pointer-advance or new set, not every state mutation.
    // workoutId/workoutName/startedAt are set once at INIT and never change;
    // completedSets is referenced via .length to detect new sets without
    // re-firing on every reducer cycle that returns a new array reference.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.currentBlockIndex, state.currentRound, state.currentEntryIndex, state.completedSets.length, state.phase, programDayIndex])

  const totalSets = computeTotalSets(state.blocks)
  const nonSkippedSets = state.completedSets.filter((s) => !s.skipped).length
  const progress = computeProgress(nonSkippedSets, totalSets, state.cancelledEntries.length)

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
