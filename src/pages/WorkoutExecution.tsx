import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useWorkout, useWorkoutBlocks, useAllBlockEntries } from '@/hooks/useWorkouts'
import { useSaveWorkoutLog } from '@/hooks/useHistory'
import { useWorkoutExecution, type ResolvedBlock } from '@/hooks/useWorkoutExecution'
import { db } from '@/db'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ExerciseDisplay } from '@/components/execution/ExerciseDisplay'
import { RestScreen } from '@/components/execution/RestScreen'
import { AdjustScreen } from '@/components/execution/AdjustScreen'
import { CompleteScreen } from '@/components/execution/CompleteScreen'
import { Button } from '@/components/ui/button'
import { Play, X } from 'lucide-react'
import type { InProgressWorkout } from '@/models/types'

export function WorkoutExecution() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: workout } = useWorkout(id)
  const { data: blocks } = useWorkoutBlocks(id)
  const blockIds = blocks?.map((b) => b.id) ?? []
  const { data: entries } = useAllBlockEntries(blockIds)
  const saveLog = useSaveWorkoutLog()

  const { data: inProgress } = useQuery({
    queryKey: ['inProgressWorkout'],
    queryFn: async (): Promise<InProgressWorkout | undefined> => {
      const all = await db.inProgressWorkout.toArray()
      return all[0]
    },
  })

  const { state, dispatch, currentEntry, progress, init } = useWorkoutExecution()
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    if (!workout || !blocks || !entries || initialized) return

    const resolveBlocks = async (): Promise<ResolvedBlock[]> => {
      const resolved: ResolvedBlock[] = []
      for (const block of blocks) {
        const blockEntries = entries
          .filter((e) => e.blockId === block.id)
          .sort((a, b) => a.order - b.order)

        const resolvedEntries = await Promise.all(
          blockEntries.map(async (entry) => {
            const progression = await db.progressions.get(entry.progressionId)
            const levels = await db.progressionLevels
              .where('progressionId')
              .equals(entry.progressionId)
              .sortBy('order')
            const currentLevel = progression?.currentLevel ?? 0
            const level = levels[currentLevel] ?? levels[0]
            const movement = level ? await db.movements.get(level.movementId) : undefined

            return {
              progressionId: entry.progressionId,
              movementId: movement?.id ?? '',
              movementName: movement?.name ?? 'Unknown',
              movementPhoto: movement?.photo,
              mode: entry.mode,
              targetReps: entry.targetReps,
              targetSeconds: entry.targetSeconds,
            }
          })
        )

        resolved.push({
          type: block.type,
          rounds: block.rounds,
          restSeconds: block.restSeconds,
          entries: resolvedEntries,
        })
      }
      return resolved
    }

    resolveBlocks().then((resolvedBlocks) => {
      const resumeData = inProgress?.workoutId === id ? inProgress : null

      init({
        workoutId: workout.id,
        workoutName: workout.name,
        blocks: resolvedBlocks,
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
      sets: state.completedSets,
    })
    await db.inProgressWorkout.clear()
    queryClient.invalidateQueries({ queryKey: ['inProgressWorkout'] })
    navigate('/')
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
            round={state.currentRound + 1}
            totalRounds={currentBlock?.rounds ?? 1}
            onDone={() => dispatch({ type: 'DONE_EXERCISE' })}
          />
        )}

        {state.phase === 'adjust' && currentEntry && (
          <AdjustScreen
            entry={currentEntry}
            adjustReps={state.adjustReps}
            adjustSeconds={state.adjustSeconds}
            onSetReps={(v) => dispatch({ type: 'SET_ADJUST_REPS', value: v })}
            onSetSeconds={(v) => dispatch({ type: 'SET_ADJUST_SECONDS', value: v })}
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
            onFinish={handleComplete}
          />
        )}
      </div>
    </div>
  )
}
