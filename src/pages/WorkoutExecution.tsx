import { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useWorkout, useWorkoutBlocks, useAllBlockEntries } from '@/hooks/useWorkouts'
import { useSaveWorkoutLog } from '@/hooks/useHistory'
import { useWorkoutExecution } from '@/hooks/useWorkoutExecution'
import {
  useProgressionReadiness,
  useProgressions,
  useProgressionVerdicts,
  useSetManuallyUnlocked,
} from '@/hooks/useProgressions'
import { useProgressionGates } from '@/hooks/useProgressionGates'
import { useAdvanceWithAudit } from '@/hooks/useAdvanceWithAudit'
import { useInProgressWorkout } from '@/hooks/useInProgressWorkout'
import { useMarkSlotDone } from '@/hooks/usePrograms'
import { useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'
import { workoutsRepository, inProgressRepository, progressionsRepository } from '@/repositories'
import { useSettings, useUpdateSettings } from '@/hooks/useSettings'
import { ExerciseDisplay } from '@/components/execution/ExerciseDisplay'
import { RestScreen } from '@/components/execution/RestScreen'
import { AdjustScreen } from '@/components/execution/AdjustScreen'
import { CompleteScreen } from '@/components/execution/CompleteScreen'
import { GatePrompt } from '@/components/execution/GatePrompt'
import { LockedPrompt } from '@/components/execution/LockedPrompt'
import { SessionPreviewScreen } from '@/components/execution/SessionPreviewScreen'
import { Button } from '@/components/ui/button'
import { useConfirm } from '@/components/ui/confirm-context'
import { X, Flag } from 'lucide-react'
import { buildWarmupBlock } from '@/lib/warmup-engine'
import { db } from '@/db'
import type { ResolvedBlock } from '@/hooks/useWorkoutExecution'

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
  const { advance: advanceLevel } = useAdvanceWithAudit()

  // activeProgramDayIndex is finalized below once we know the resume record;
  // pass slotFromUrl here so a fresh start gets the slot persisted from the
  // very first auto-save. (Resume already has it on the record itself.)
  const { state, dispatch, currentEntry, progress, init } = useWorkoutExecution(slotFromUrl)
  const [initialized, setInitialized] = useState(false)
  const [workoutNotes, setWorkoutNotes] = useState('')
  const [workoutSaved, setWorkoutSaved] = useState(false)

  // ─── Warm-up state ────────────────────────────────────────────────────────
  // Persisted preference (defaults to true = enabled).
  const { data: settings } = useSettings()
  const updateSettings = useUpdateSettings()
  // Local override — starts at undefined (= use persisted setting), then
  // flips when the user taps the toggle on the preview screen.
  const [warmupOverride, setWarmupOverride] = useState<boolean | undefined>(undefined)
  const warmupEnabled = warmupOverride ?? settings?.warmupEnabled ?? true

  // Pre-built warm-up block, derived once from the resolved blocks.
  // null = nothing to warm up for this session.
  const [warmupBlock, setWarmupBlock] = useState<ResolvedBlock | null>(null)

  const handleToggleWarmup = (enabled: boolean) => {
    setWarmupOverride(enabled)
    // Fire-and-forget — persist so the next session starts with the same choice.
    updateSettings.mutate({ warmupEnabled: enabled })
    // Re-init so the warm-up block is added/removed before the user taps Start.
    // Only safe in the 'ready' phase (before any sets are logged).
    if (state.phase === 'ready') {
      setInitialized(false)
    }
  }

  // For post-workout readiness cards (after save).
  const { data: allProgressions } = useProgressions()
  const { data: verdicts } = useProgressionVerdicts()
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

  // Entry-gate lock: if the current entry is progression-bound and that
  // progression is still locked, show the LockedPrompt instead of prescribing
  // the exercise. Takes precedence over the readiness gate.
  const { data: gates } = useProgressionGates()
  const setUnlocked = useSetManuallyUnlocked()
  const currentGate = currentEntry?.progressionId
    ? gates?.get(currentEntry.progressionId)
    : undefined
  const showLock = state.phase === 'exercise' && !!currentGate && !currentGate.unlocked

  const gateKey = `${state.currentBlockIndex}-${state.currentRound}-${state.currentEntryIndex}`
  const showGate =
    state.phase === 'exercise' &&
    !!currentEntry?.gate &&
    !gateAcknowledged.has(gateKey) &&
    !showLock

  // SetLog now carries progressionId directly, so we can collect the set of
  // progressions this workout exercised without searching block structure.
  const progressionIds = state.phase === 'complete'
    ? [...new Set(state.completedSets.map((s) => s.progressionId).filter((id): id is string => !!id))]
    : []

  const { data: levelUpCandidates = [] } = useProgressionReadiness(
    state.phase === 'complete' ? progressionIds : [],
    state.completedSets
  )

  // After the workout is saved (workoutSaved=true), verdicts are invalidated and
  // refetched. Filter to progressions trained in this session that are now
  // ready-to-advance (and not snoozed). Sort most-stale first.
  const readyVerdicts = useMemo(() => {
    if (!workoutSaved || !allProgressions || !verdicts) return []
    return progressionIds
      .flatMap((pid) => {
        const progression = allProgressions.find((p) => p.id === pid)
        const verdict = verdicts.get(pid)
        if (!progression || !verdict || verdict.kind !== 'ready-to-advance' || verdict.snoozed) return []
        return [{ progression, verdict }]
      })
      .sort(
        (a, b) =>
          (b.verdict.daysAtRung - a.verdict.daysAtRung) ||
          (b.verdict.sessionsAtRung - a.verdict.sessionsAtRung),
      )
  // progressionIds is recomputed each render from state; stable when phase=complete.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workoutSaved, allProgressions, verdicts])

  // Resumed runs carry the original programDayIndex on the in-progress record;
  // fresh runs use whatever the URL specified (if any).
  const resumeData = inProgress?.workoutId === id ? inProgress : null
  const activeProgramDayIndex = resumeData?.programDayIndex ?? slotFromUrl

  useEffect(() => {
    if (!workout || !blocks || !entries || initialized) return

    // When crash-recovering from a run that used a custom entry order, use the
    // persisted blocks directly. Falls back to fresh resolution for old records
    // and brand-new runs (resumeData?.blocks is undefined in both cases).
    //
    // Note: resume records may already include a warm-up block (isWarmup=true)
    // if the user started with warmup enabled. We preserve that so mid-warmup
    // crash recovery works correctly.
    const resolvePromise = resumeData?.blocks
      ? Promise.resolve(resumeData.blocks)
      : workoutsRepository.resolveBlocks(blocks, entries)

    resolvePromise.then(async (resolvedBlocks) => {
      // Derive the warm-up block from the resolved movements.
      // Skip derivation when this is a crash-recovery resume — the saved blocks
      // already contain (or don't contain) the warm-up block from the original run.
      if (!resumeData?.blocks) {
        // Collect all movement inputs from the resolved blocks.
        const movementInputs = resolvedBlocks
          .flatMap((b) => b.entries)
          .map((e) => ({
            movementId: e.movementId,
            movementName: e.movementName,
            family: e.movementFamily,
            prepTags: e.movementPrepTags,
          }))

        // Build a lookup map from movement name → {id, seedImagePath}.
        // Query all movements by name so warm-up template names resolve correctly.
        const allMovements = await db.movements.toArray()
        const movementNameMap = new Map(
          allMovements.map((m) => [m.name, { id: m.id, name: m.name, seedImagePath: m.seedImagePath }]),
        )

        // Movements already in the session — the warm-up must not duplicate them.
        const sessionMovementIds = new Set(movementInputs.map((m) => m.movementId))
        const builtWarmupBlock = buildWarmupBlock(
          movementInputs,
          movementNameMap,
          sessionMovementIds,
        )
        setWarmupBlock(builtWarmupBlock)

        // Prepend warm-up block if enabled and present.
        const blocksForInit =
          builtWarmupBlock && warmupEnabled
            ? [{ ...builtWarmupBlock, isWarmup: true as const }, ...resolvedBlocks]
            : resolvedBlocks

        init({
          workoutId: workout.id,
          workoutName: workout.name,
          blocks: blocksForInit,
          restBetweenBlocksSeconds: workout.restBetweenBlocksSeconds ?? 0,
          startedAt: resumeData?.startedAt ?? Date.now(),
          currentBlockIndex: resumeData?.currentBlockIndex ?? 0,
          currentRound: resumeData?.currentRound ?? 0,
          currentEntryIndex: resumeData?.currentEntryIndex ?? 0,
          completedSets: resumeData?.completedSets ?? [],
        })
      } else {
        // Crash recovery: use the persisted blocks as-is (warm-up state included).
        init({
          workoutId: workout.id,
          workoutName: workout.name,
          blocks: resolvedBlocks,
          restBetweenBlocksSeconds: workout.restBetweenBlocksSeconds ?? 0,
          startedAt: resumeData.startedAt,
          currentBlockIndex: resumeData.currentBlockIndex,
          currentRound: resumeData.currentRound,
          currentEntryIndex: resumeData.currentEntryIndex,
          completedSets: resumeData.completedSets,
        })
      }

      setInitialized(true)
    })
  // warmupEnabled intentionally omitted: the warm-up choice is baked in at
  // initialization time. The toggle on the ready screen re-inits via
  // handleToggleWarmup → setWarmupOverride → triggers a re-init below.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workout, blocks, entries, resumeData, id, init, initialized])

  // Phase 1: persist the workout log and flip workoutSaved so CompleteScreen can
  // show post-save readiness cards (the verdict query is invalidated by
  // useSaveWorkoutLog and will refetch to include this session).
  const handleSave = async () => {
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
    setWorkoutSaved(true)
  }

  // Phase 2: navigate home (called after the user has reviewed readiness cards).
  const handleFinish = () => {
    navigate('/')
  }

  const handleLevelUp = async (progressionId: string) => {
    const progression = await progressionsRepository.getById(progressionId)
    if (progression) {
      await advanceLevel(progressionId, progression.currentLevel, progression.currentLevel + 1)
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
      <SessionPreviewScreen
        workoutName={workout?.name ?? 'Loading...'}
        blocks={state.blocks}
        isLoading={!initialized}
        isResume={inProgress?.workoutId === id}
        warmupEnabled={warmupEnabled}
        warmupBlockPresent={warmupBlock !== null}
        onToggleWarmup={handleToggleWarmup}
        onStart={() => dispatch({ type: 'START', now: Date.now() })}
        onBack={() => navigate(-1)}
        onReorderEntry={(blockIndex, fromIndex, toIndex) =>
          dispatch({ type: 'REORDER_BLOCK_ENTRIES', blockIndex, fromIndex, toIndex })
        }
      />
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
        {showLock && currentEntry && currentGate && (
          <LockedPrompt
            entry={currentEntry}
            prerequisites={currentGate.prerequisites}
            onUnblock={() => {
              if (currentEntry.progressionId) setUnlocked.mutate(currentEntry.progressionId)
            }}
            onSkip={() =>
              dispatch({
                type: 'SKIP_EXERCISE',
                now: Date.now(),
                reason: 'Skipped — progression locked',
              })
            }
          />
        )}

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

        {state.phase === 'exercise' && currentEntry && !showGate && !showLock && (
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
            onSave={handleSave}
            onFinish={handleFinish}
            isSaving={saveLog.isPending}
            saved={workoutSaved}
            readyVerdicts={readyVerdicts}
          />
        )}
      </div>
    </div>
  )
}
