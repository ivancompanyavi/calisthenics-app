import { useReducer, useEffect, useCallback, useRef } from 'react'
import type { InProgressWorkout } from '@/models/types'
import { inProgressRepository } from '@/repositories'
import { useSettings } from '@/hooks/useSettings'
import { CuePlayer, decideCue, type CueSnapshot } from '@/lib/cue-player'
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

  // ─── Settings ────────────────────────────────────────────────────────────────
  // Read here (above the tick effect) so the tick closure captures a stable
  // value from the current render — avoids temporal-dead-zone errors.

  const { data: settings } = useSettings()
  // Default to enabled while settings load (avoids a silent first workout).
  const cuesEnabled = settings?.soundCues ?? true
  // Default false: rest auto-advances at zero (original behavior). Opt-in
  // true freezes the rest screen at 0:00 until the user taps.
  const waitAfterRest = settings?.waitAfterRest ?? false

  // ─────────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!needsExerciseTick && !needsRestTick) return

    const tick = () => {
      if (needsExerciseTick) {
        dispatch({ type: 'TICK_EXERCISE', now: Date.now() })
      } else {
        // Default (waitAfterRest=false): auto-advance at zero, as the original
        // reducer did — this also fires the end-of-rest cue on the transition.
        // Opt-in (waitAfterRest=true): freeze at 0:00 and wait for a tap.
        dispatch({ type: 'TICK_REST', now: Date.now(), noAutoStart: waitAfterRest })
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
  }, [needsExerciseTick, needsRestTick, waitAfterRest])

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

  // ─── Audio + Haptic Cues ────────────────────────────────────────────────────

  // CuePlayer lives for the lifetime of this hook instance.
  const cuePlayerRef = useRef<CuePlayer | null>(null)
  if (cuePlayerRef.current === null) {
    cuePlayerRef.current = new CuePlayer()
  }

  // Dispose the CuePlayer when this hook unmounts (workout screen exits).
  useEffect(() => {
    return () => {
      cuePlayerRef.current?.dispose()
    }
  }, [])

  // Tracks the "previous" timer snapshot so the cue effect can detect
  // transitions. A SINGLE effect reads and writes this ref (one reader, one
  // writer) — splitting rest and exercise cues across two effects that share
  // this ref creates an ordering hazard where the first effect stomps the
  // `phase` the second reads as its `prev`, killing the time-mode end tone.
  const cueSnapshotRef = useRef<CueSnapshot>({
    phase: state.phase,
    restRemaining: state.restRemaining,
    exerciseRemaining: state.exerciseTimeRemaining,
    exerciseMode: currentEntry?.mode,
  })

  // CUES: countdown beeps at 3 / 2 / 1 and a distinct end tone at 0, for both
  // rest countdowns and time-mode exercise holds. The pure `decideCue` decides
  // what (if anything) to play; `max` (count-up) and `reps` are always silent.
  useEffect(() => {
    const prev = cueSnapshotRef.current
    const curr: CueSnapshot = {
      phase: state.phase,
      restRemaining: state.restRemaining,
      exerciseRemaining: state.exerciseTimeRemaining,
      exerciseMode: currentEntry?.mode,
    }
    // Write the ref exactly once, up front, so the next run always sees this
    // run's `curr` as its `prev` regardless of early return.
    cueSnapshotRef.current = curr

    if (!cuesEnabled) return
    const cue = decideCue(prev, curr)
    if (cue !== null) cuePlayerRef.current?.cue(cue)
  }, [state.phase, state.restRemaining, state.exerciseTimeRemaining, currentEntry?.mode, cuesEnabled])

  // Wrap dispatch so we can unlock the AudioContext on the START tap (user
  // gesture) without requiring the calling component to know about cues.
  const wrappedDispatch = useCallback(
    (action: Action) => {
      if (action.type === 'START') {
        cuePlayerRef.current?.unlock()
      }
      dispatch(action)
    },
    [],
  )

  // ────────────────────────────────────────────────────────────────────────────

  const totalSets = computeTotalSets(state.blocks)
  const nonSkippedSets = state.completedSets.filter((s) => !s.skipped).length
  const progress = computeProgress(nonSkippedSets, totalSets, state.cancelledEntries.length)

  type InitPayload = Extract<Action, { type: 'INIT' }>['payload']
  const init = useCallback((payload: InitPayload) => {
    dispatch({ type: 'INIT', payload })
  }, [])

  return {
    state,
    dispatch: wrappedDispatch,
    currentEntry,
    progress,
    totalSets,
    init,
  }
}
