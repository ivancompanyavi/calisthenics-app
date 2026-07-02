import { useEffect, useState } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useWorkout, useWorkoutBlocks, useAllBlockEntries } from '@/hooks/useWorkouts'
import { useSaveWorkoutLog } from '@/hooks/useHistory'
import { useWorkoutExecution } from '@/hooks/useWorkoutExecution'
import { useProgressionReadiness, useUpdateCurrentLevel } from '@/hooks/useProgressions'
import { useInProgressWorkout } from '@/hooks/useInProgressWorkout'
import { useMarkSlotDone } from '@/hooks/usePrograms'
import { useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'
import { workoutsRepository, inProgressRepository, progressionsRepository } from '@/repositories'
import { ExerciseDisplay } from '@/components/execution/ExerciseDisplay'
import { RestScreen } from '@/components/execution/RestScreen'
import { AdjustScreen } from '@/components/execution/AdjustScreen'
import { CompleteScreen } from '@/components/execution/CompleteScreen'
import { GatePrompt } from '@/components/execution/GatePrompt'
import { Button } from '@/components/ui/button'
import { useConfirm } from '@/components/ui/confirm-context'
import { Play, X, Flag } from 'lucide-react'

export function WorkoutExecution() {
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const slotParam = searchParams.get('slot')
  const slotFromUrl = slotParam !== null ? Number(slotParam) : undefined

  const { data: workout } = useWorkout(id)
  const { data: blocks } = useWorkoutBlocks(id)
  const blockIds = blocks?.map((b) => b.id) ?? []
  const { data: entries } = useAllBlockEntries(blockIds)
  const saveLog = useSaveWorkoutLog()
  const markSlotDone = useMarkSlotDone()
  const confirm = useConfirm()

  const { data: inProgress } = useInProgressWorkout()
  const updateLevel = useUpdateCurrentLevel()

  // activeProgramDayIndex is finalized below once we know the resume record;
  // pass slotFromUrl here so a fresh start gets the slot persisted from the
  // very first auto-save. (Resume already has it on the record itself.)
  const { state, dispatch, currentEntry, progress, init } = useWorkoutExecution(slotFromUrl)
  const [initialized, setInitialized] = useState(false)
  const [workoutNotes, setWorkoutNotes] = useState('')
  // Track which (blockIndex, round, entryIndex) tuples have already had their
  // gate answered Yes. Each new round re-asks because joint state can change
  // mid-workout. Reset when the workoutId changes — using the React-blessed
  // "store info from previous renders" pattern (setState during render is
  // explicitly OK when conditional and updating a sibling state).
  const [gateAcknowledged, setGateAcknowledged] = useState<Set<string>>(new Set())
  const [previousWorkoutId, setPreviousWorkoutId] = useState(state.workoutId)
  if (previousWorkoutId !== state.workoutId) {
    setPreviousWorkoutId(state.workoutId)
    setGateAcknowledged(new Set())
  }

  const gateKey = `${state.currentBlockIndex}-${state.currentRound}-${state.currentEntryIndex}`
  const showGate =
    state.phase === 'exercise' &&
    !!currentEntry?.gate &&
    !gateAcknowledged.has(gateKey)

  // SetLog now carries progressionId directly, so we can collect the set of
  // progressions this workout exercised without searching block structure.
  const progressionIds = state.phase === 'complete'
    ? [...new Set(state.completedSets.map((s) => s.progressionId).filter((id): id is string => !!id))]
    : []

  const { data: levelUpCandidates = [] } = useProgressionReadiness(
    state.phase === 'complete' ? progressionIds : [],
    state.completedSets
  )

  // Resumed runs carry the original programDayIndex on the in-progress record;
  // fresh runs use whatever the URL specified (if any).
  const resumeData = inProgress?.workoutId === id ? inProgress : null
  const activeProgramDayIndex = resumeData?.programDayIndex ?? slotFromUrl

  useEffect(() => {
    if (!workout || !blocks || !entries || initialized) return

    workoutsRepository.resolveBlocks(blocks, entries).then((resolvedBlocks) => {
      init({
        workoutId: workout.id,
        workoutName: workout.name,
        blocks: resolvedBlocks,
        restBetweenBlocksSeconds: workout.restBetweenBlocksSeconds ?? 0,
        startedAt: resumeData?.startedAt ?? Date.now(),
        currentBlockIndex: resumeData?.currentBlockIndex ?? 0,
        currentRound: resumeData?.currentRound ?? 0,
        currentEntryIndex: resumeData?.currentEntryIndex ?? 0,
        completedSets: resumeData?.completedSets ?? [],
      })
      setInitialized(true)
    })
  }, [workout, blocks, entries, resumeData, id, init, initialized])

  const handleComplete = async () => {
    const logId = await saveLog.mutateAsync({
      workoutId: state.workoutId,
      workoutName: state.workoutName,
      startedAt: state.startedAt,
      notes: workoutNotes || undefined,
      sets: state.completedSets,
    })
    if (activeProgramDayIndex !== undefined) {
      await markSlotDone.mutateAsync({ slotIndex: activeProgramDayIndex, workoutLogId: logId })
    }
    await inProgressRepository.clear()
    // removeQueries (not invalidate): an invalidated cache still returns the
    // stale value to the next observer while a refetch races in. Home would
    // briefly render the InProgressCard for the workout we just finished.
    // removeQueries forces the next observer to fetch from scratch.
    queryClient.removeQueries({ queryKey: queryKeys.inProgress })
    navigate('/')
  }

  const handleLevelUp = async (progressionId: string) => {
    const progression = await progressionsRepository.getById(progressionId)
    if (progression) {
      await updateLevel.mutateAsync({ id: progressionId, currentLevel: progression.currentLevel + 1 })
    }
  }

  const handleQuit = async () => {
    if (!(await confirm({
      title: 'Cancel this workout?',
      description: 'Progress will be lost.',
      confirmLabel: 'Cancel workout',
      cancelLabel: 'Keep going',
      destructive: true,
    }))) return
    await inProgressRepository.clear()
    // removeQueries (not invalidate): an invalidated cache still returns the
    // stale value to the next observer while a refetch races in. Home would
    // briefly render the InProgressCard for the workout we just finished.
    // removeQueries forces the next observer to fetch from scratch.
    queryClient.removeQueries({ queryKey: queryKeys.inProgress })
    navigate('/')
  }

  if (!initialized || state.phase === 'ready') {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center bg-background p-6">
        <h1 className="text-2xl font-bold mb-2">{workout?.name ?? 'Loading...'}</h1>
        <p className="text-muted-foreground mb-8">Ready to start?</p>
        {initialized && (
          <Button size="lg" className="text-lg px-8" onClick={() => dispatch({ type: 'START', now: Date.now() })}>
            <Play className="h-5 w-5 mr-2" />
            {inProgress?.workoutId === id ? 'Resume Workout' : 'Start Workout'}
          </Button>
        )}
      </div>
    )
  }

  const currentBlock = state.blocks[state.currentBlockIndex]

  return (
    <div className="min-h-dvh flex flex-col bg-background safe-top">
      <div className="flex items-center justify-between px-4 py-3">
        <p className="text-sm font-medium text-muted-foreground">{state.workoutName}</p>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs text-muted-foreground"
            onClick={async () => {
              if (!(await confirm({
                title: 'Finish workout early?',
                description: 'Remaining exercises will not be logged.',
                confirmLabel: 'Finish',
              }))) return
              dispatch({ type: 'FINISH_WORKOUT' })
            }}
          >
            <Flag className="h-4 w-4 mr-1" />
            Finish
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleQuit}>
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="h-1 bg-secondary mx-4 rounded-full overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-500 rounded-full"
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      <div className="flex-1 flex flex-col">
        {showGate && currentEntry?.gate && (
          <GatePrompt
            entry={currentEntry}
            onYes={() => {
              setGateAcknowledged((prev) => new Set(prev).add(gateKey))
              // The exercise timer started ticking at entry-transition time,
              // before the user saw the gate. Resync so the user gets the
              // full target window from the moment they tap Yes.
              dispatch({ type: 'RESYNC_EXERCISE_TIMER', now: Date.now() })
            }}
            onNo={() => {
              if (currentEntry.gate?.skipOnNo) {
                dispatch({
                  type: 'SKIP_EXERCISE',
                  now: Date.now(),
                  reason: `Skipped — gate: "${currentEntry.gate.question}" answered No`,
                })
              } else {
                // Non-skip gates just acknowledge and proceed; the warning is
                // its own value (log shows nothing extra).
                setGateAcknowledged((prev) => new Set(prev).add(gateKey))
                dispatch({ type: 'RESYNC_EXERCISE_TIMER', now: Date.now() })
              }
            }}
          />
        )}

        {state.phase === 'exercise' && currentEntry && !showGate && (
          <ExerciseDisplay
            entry={currentEntry}
            timeRemaining={state.exerciseTimeRemaining}
            timeElapsed={state.exerciseTimeElapsed}
            round={state.currentRound + 1}
            totalRounds={currentBlock?.rounds ?? 1}
            onDone={() => dispatch({ type: 'DONE_EXERCISE', now: Date.now() })}
            onDelay={() => dispatch({ type: 'DELAY_EXERCISE', now: Date.now() })}
            onSkip={() => dispatch({ type: 'SKIP_EXERCISE', now: Date.now() })}
          />
        )}

        {state.phase === 'adjust' && currentEntry && (
          <AdjustScreen
            entry={currentEntry}
            adjustReps={state.adjustReps}
            adjustSeconds={state.adjustSeconds}
            adjustNotes={state.adjustNotes}
            adjustRir={state.adjustRir}
            adjustSir={state.adjustSir}
            adjustWeightKg={state.adjustWeightKg}
            adjustBandLevel={state.adjustBandLevel}
            isLastRound={state.currentRound === (currentBlock?.rounds ?? 1) - 1}
            onSetReps={(v) => dispatch({ type: 'SET_ADJUST_REPS', value: v })}
            onSetSeconds={(v) => dispatch({ type: 'SET_ADJUST_SECONDS', value: v })}
            onSetNotes={(v) => dispatch({ type: 'SET_ADJUST_NOTES', value: v })}
            onSetRir={(v) => dispatch({ type: 'SET_ADJUST_RIR', value: v })}
            onSetSir={(v) => dispatch({ type: 'SET_ADJUST_SIR', value: v })}
            onSetWeightKg={(v) => dispatch({ type: 'SET_ADJUST_WEIGHT_KG', value: v })}
            onSetBandLevel={(v) => dispatch({ type: 'SET_ADJUST_BAND_LEVEL', value: v })}
            onConfirm={() => dispatch({ type: 'CONFIRM_ADJUST', now: Date.now() })}
          />
        )}

        {state.phase === 'resting' && (
          <RestScreen
            remaining={state.restRemaining}
            total={state.restTotal}
            nextEntry={currentEntry}
            nextBlock={state.blocks[state.currentBlockIndex] ?? null}
            nextBlockIndex={state.currentBlockIndex}
            onSkip={() => dispatch({ type: 'SKIP_REST', now: Date.now() })}
            onAdjust={(delta) => dispatch({ type: 'ADJUST_REST', delta, now: Date.now() })}
          />
        )}

        {state.phase === 'complete' && (
          <CompleteScreen
            workoutName={state.workoutName}
            startedAt={state.startedAt}
            setsCompleted={state.completedSets.length}
            notes={workoutNotes}
            onSetNotes={setWorkoutNotes}
            levelUpCandidates={levelUpCandidates}
            onLevelUp={handleLevelUp}
            onFinish={handleComplete}
          />
        )}
      </div>
    </div>
  )
}
