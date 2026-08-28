import { useMemo, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { Settings as SettingsIcon } from 'lucide-react'
import { useWorkouts, useUpgradeSuggestions } from '@/hooks/useWorkouts'
import { progressionsRepository } from '@/repositories'
import { queryKeys } from '@/lib/query-keys'
import { UpgradeSuggestionCard } from '@/components/workouts/UpgradeSuggestionCard'
import { useWorkoutLogs } from '@/hooks/useHistory'
import { useInProgressWorkout, useDiscardInProgress } from '@/hooks/useInProgressWorkout'
import { useCurrentSlot, useMarkSlotDone } from '@/hooks/usePrograms'
import { useProgressions, useProgressionVerdicts } from '@/hooks/useProgressions'
import { ProgramCompleteCard } from '@/components/programs/ProgramCompleteCard'
import { PickWorkoutSheet } from '@/components/programs/PickWorkoutSheet'
import { PageHeader } from '@/components/ui/page-header'
import { InProgressCard } from '@/components/home/InProgressCard'
import { ProgramSlotCard } from '@/components/home/ProgramSlotCard'
import { WorkoutsList } from '@/components/home/WorkoutsList'
import { RecentActivityList } from '@/components/home/RecentActivityList'
import { DataIOSection } from '@/components/home/DataIOSection'
import { GoalsCard } from '@/components/home/GoalsCard'
import { AdvanceSuggestionCard } from '@/components/progressions/AdvanceSuggestionCard'

export function Home() {
  const navigate = useNavigate()
  const { data: workouts } = useWorkouts()
  const { data: recentLogs } = useWorkoutLogs()
  const { data: inProgress } = useInProgressWorkout()
  const discardInProgress = useDiscardInProgress()
  const { data: currentSlot } = useCurrentSlot()
  const markSlotDone = useMarkSlotDone()
  const { data: progressions } = useProgressions()
  const { data: verdicts } = useProgressionVerdicts()
  const [dismissedCompletion, setDismissedCompletion] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)

  // Progressions that are ready to advance and not snoozed, most-stale first.
  const readyToAdvance = useMemo(() => {
    if (!progressions || !verdicts) return []
    return progressions
      .filter((p) => {
        const v = verdicts.get(p.id)
        return v?.kind === 'ready-to-advance' && !v.snoozed
      })
      .sort((a, b) => {
        const va = verdicts.get(a.id)!
        const vb = verdicts.get(b.id)!
        return (vb.daysAtRung - va.daysAtRung) || (vb.sessionsAtRung - va.sessionsAtRung)
      })
  }, [progressions, verdicts])

  // Step-up offers for today's scheduled workout. Home is where sessions
  // usually start (it navigates straight into execution, skipping the workout
  // preview), so the opt-in cards must be visible here too.
  const queryClient = useQueryClient()
  const todayWorkoutId =
    currentSlot?.pointerIndex != null
      ? currentSlot.cycleSlots[currentSlot.pointerIndex]?.workoutId
      : undefined
  const { data: upgradeSuggestions } = useUpgradeSuggestions(todayWorkoutId)
  const onUpgradeAction = async (
    action: (id: string) => Promise<void>,
    progressionId: string,
  ) => {
    await action(progressionId)
    // Also refreshes the suggestion query — its key nests under progressions.
    await queryClient.invalidateQueries({ queryKey: queryKeys.progressions.all })
  }

  const startWorkoutForSlot = (workoutId: string, slotIndex: number) => {
    setPickerOpen(false)
    navigate(`/execute/${workoutId}?slot=${slotIndex}`)
  }

  // Home shows only the workouts of the program you're currently on (the phase
  // you're at), not the whole catalog — the full list lives on the Workouts
  // tab ("View All"). Falls back to all workouts when no program is active.
  const programWorkoutIds = useMemo(() => {
    if (!currentSlot?.cycleSlots) return null
    const ids = new Set<string>()
    for (const slot of currentSlot.cycleSlots) {
      if (slot.workoutId) ids.add(slot.workoutId)
    }
    return ids.size > 0 ? ids : null
  }, [currentSlot])

  const shownWorkouts = useMemo(() => {
    if (!workouts) return []
    if (!programWorkoutIds) return workouts
    return workouts.filter((w) => programWorkoutIds.has(w.id))
  }, [workouts, programWorkoutIds])

  return (
    <div>
      <PageHeader title="Calisthenics">
        <Link
          to="/settings"
          aria-label="Settings"
          className="p-2 -mr-2 rounded-md text-muted-foreground hover:text-foreground touch-manipulation"
        >
          <SettingsIcon className="h-5 w-5" />
        </Link>
      </PageHeader>

      <div className="px-4 space-y-6 pb-8">
        {inProgress && (
          <InProgressCard
            inProgress={inProgress}
            onDiscard={() => discardInProgress.mutate()}
          />
        )}

        {readyToAdvance.length > 0 && (
          <div className="space-y-2">
            {readyToAdvance.map((progression) => {
              const verdict = verdicts!.get(progression.id)!
              return (
                <AdvanceSuggestionCard
                  key={progression.id}
                  progression={progression}
                  verdict={verdict}
                />
              )
            })}
          </div>
        )}

        {upgradeSuggestions && upgradeSuggestions.length > 0 && (
          <div className="space-y-2">
            {upgradeSuggestions.map((suggestion) => (
              <UpgradeSuggestionCard
                key={suggestion.progressionId}
                suggestion={suggestion}
                onAdopt={(id) => onUpgradeAction(progressionsRepository.adopt, id)}
                onDismiss={(id) => onUpgradeAction(progressionsRepository.dismissUpgrade, id)}
              />
            ))}
          </div>
        )}

        {currentSlot?.programCompleted && !dismissedCompletion && (
          <ProgramCompleteCard
            programId={currentSlot.programId}
            programName={currentSlot.programName}
            cyclesCompleted={currentSlot.currentCycle}
            onDismiss={() => setDismissedCompletion(true)}
          />
        )}

        {currentSlot && !currentSlot.programCompleted && (
          <ProgramSlotCard
            currentSlot={currentSlot}
            onMarkRestDayDone={() => markSlotDone.mutate({ slotIndex: currentSlot.pointerIndex! })}
            onOpenPicker={() => setPickerOpen(true)}
            onStartWorkout={startWorkoutForSlot}
          />
        )}

        {currentSlot && (
          <PickWorkoutSheet
            open={pickerOpen}
            onClose={() => setPickerOpen(false)}
            slots={currentSlot.cycleSlots}
            pointerIndex={currentSlot.pointerIndex}
            onPick={(slotIndex) => {
              const slot = currentSlot.cycleSlots[slotIndex]
              if (!slot.workoutId) {
                // Picked a rest day from the sheet — mark it done directly.
                markSlotDone.mutate({ slotIndex })
                setPickerOpen(false)
                return
              }
              startWorkoutForSlot(slot.workoutId, slotIndex)
            }}
          />
        )}

        <GoalsCard />
        <WorkoutsList
          workouts={shownWorkouts}
          title={programWorkoutIds ? currentSlot?.programName ?? 'This Program' : 'Your Workouts'}
        />
        <RecentActivityList logs={recentLogs?.slice(0, 3) ?? []} />
        <DataIOSection />
      </div>
    </div>
  )
}
