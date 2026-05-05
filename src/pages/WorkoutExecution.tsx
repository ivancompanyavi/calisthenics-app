import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useWorkout, useWorkoutBlocks, useAllBlockEntries } from '@/hooks/useWorkouts'
import { useSaveWorkoutLog } from '@/hooks/useHistory'
import { useWorkoutExecution } from '@/hooks/useWorkoutExecution'
import { useProgressionReadiness, useUpdateCurrentLevel } from '@/hooks/useProgressions'
import { useInProgressWorkout } from '@/hooks/useInProgressWorkout'
import { useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'
import { workoutsRepository, inProgressRepository, progressionsRepository } from '@/repositories'
import { ExerciseDisplay } from '@/components/execution/ExerciseDisplay'
import { RestScreen } from '@/components/execution/RestScreen'
import { AdjustScreen } from '@/components/execution/AdjustScreen'
import { CompleteScreen } from '@/components/execution/CompleteScreen'
import { Button } from '@/components/ui/button'
import { Play, X } from 'lucide-react'

export function WorkoutExecution() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: workout } = useWorkout(id)
  const { data: blocks } = useWorkoutBlocks(id)
  const blockIds = blocks?.map((b) => b.id) ?? []
  const { data: entries } = useAllBlockEntries(blockIds)
  const saveLog = useSaveWorkoutLog()

  const { data: inProgress } = useInProgressWorkout()
  const updateLevel = useUpdateCurrentLevel()

  const { state, dispatch, currentEntry, progress, init } = useWorkoutExecution()
  const [initialized, setInitialized] = useState(false)
  const [workoutNotes, setWorkoutNotes] = useState('')

  const progressionIds = state.phase === 'complete'
    ? [...new Set(state.completedSets.map((s) => {
        const block = state.blocks.find((b) =>
          b.entries.some((e) => e.movementId === s.movementId)
        )
        const entry = block?.entries.find((e) => e.movementId === s.movementId)
        return entry?.progressionId ?? ''
      }).filter(Boolean))]
    : []

  const { data: levelUpCandidates = [] } = useProgressionReadiness(
    state.phase === 'complete' ? progressionIds : [],
    state.completedSets
  )

  useEffect(() => {
    if (!workout || !blocks || !entries || initialized) return

    workoutsRepository.resolveBlocks(blocks, entries).then((resolvedBlocks) => {
      const resumeData = inProgress?.workoutId === id ? inProgress : null

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
  }, [workout, blocks, entries, inProgress, id, init, initialized])

  const handleComplete = async () => {
    await saveLog.mutateAsync({
      workoutId: state.workoutId,
      workoutName: state.workoutName,
      startedAt: state.startedAt,
      notes: workoutNotes || undefined,
      sets: state.completedSets,
    })
    await inProgressRepository.clear()
    queryClient.invalidateQueries({ queryKey: queryKeys.inProgress })
    navigate('/')
  }

  const handleLevelUp = async (progressionId: string) => {
    const progression = await progressionsRepository.getById(progressionId)
    if (progression) {
      await updateLevel.mutateAsync({ id: progressionId, currentLevel: progression.currentLevel + 1 })
    }
  }

  const handleQuit = async () => {
    if (!confirm('Quit this workout? Progress will be saved.')) return
    navigate('/')
  }

  if (!initialized || state.phase === 'ready') {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center bg-background p-6">
        <h1 className="text-2xl font-bold mb-2">{workout?.name ?? 'Loading...'}</h1>
        <p className="text-muted-foreground mb-8">Ready to start?</p>
        {initialized && (
          <Button size="lg" className="text-lg px-8" onClick={() => dispatch({ type: 'START' })}>
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
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleQuit}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      <div className="h-1 bg-secondary mx-4 rounded-full overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-500 rounded-full"
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      <div className="flex-1 flex flex-col">
        {state.phase === 'exercise' && currentEntry && (
          <ExerciseDisplay
            entry={currentEntry}
            timeRemaining={state.exerciseTimeRemaining}
            timeElapsed={state.exerciseTimeElapsed}
            round={state.currentRound + 1}
            totalRounds={currentBlock?.rounds ?? 1}
            onDone={() => dispatch({ type: 'DONE_EXERCISE' })}
            onSkip={() => dispatch({ type: 'SKIP_EXERCISE' })}
          />
        )}

        {state.phase === 'adjust' && currentEntry && (
          <AdjustScreen
            entry={currentEntry}
            adjustReps={state.adjustReps}
            adjustSeconds={state.adjustSeconds}
            adjustNotes={state.adjustNotes}
            onSetReps={(v) => dispatch({ type: 'SET_ADJUST_REPS', value: v })}
            onSetSeconds={(v) => dispatch({ type: 'SET_ADJUST_SECONDS', value: v })}
            onSetNotes={(v) => dispatch({ type: 'SET_ADJUST_NOTES', value: v })}
            onConfirm={() => dispatch({ type: 'CONFIRM_ADJUST' })}
          />
        )}

        {state.phase === 'resting' && (
          <RestScreen
            remaining={state.restRemaining}
            total={currentBlock?.restSeconds ?? 60}
            onSkip={() => dispatch({ type: 'SKIP_REST' })}
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
