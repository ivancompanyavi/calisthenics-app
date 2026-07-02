import { useMemo, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Settings as SettingsIcon } from 'lucide-react'
import { useWorkouts } from '@/hooks/useWorkouts'
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
import { BodyweightCard } from '@/components/home/BodyweightCard'
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

  const startWorkoutForSlot = (workoutId: string, slotIndex: number) => {
    setPickerOpen(false)
    navigate(`/execute/${workoutId}?slot=${slotIndex}`)
  }

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

        <BodyweightCard />
        <GoalsCard />
        <WorkoutsList workouts={workouts ?? []} />
        <RecentActivityList logs={recentLogs?.slice(0, 3) ?? []} />
        <DataIOSection />
      </div>
    </div>
  )
}
