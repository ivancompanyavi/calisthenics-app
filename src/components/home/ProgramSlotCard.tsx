import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import {
  AlertTriangle,
  CalendarDays,
  Check,
  Dumbbell,
  Moon,
  PartyPopper,
  Play,
  Shuffle,
} from 'lucide-react'
import type { CurrentSlot } from '@/repositories/programs.repository'

interface ProgramSlotCardProps {
  currentSlot: CurrentSlot
  onMarkRestDayDone: () => void
  onOpenPicker: () => void
  onStartWorkout: (workoutId: string, slotIndex: number) => void
}

export function ProgramSlotCard({
  currentSlot,
  onMarkRestDayDone,
  onOpenPicker,
  onStartWorkout,
}: ProgramSlotCardProps) {
  const navigate = useNavigate()

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <CalendarDays className="h-5 w-5 text-primary" />
          {currentSlot.programName}
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          {currentSlot.pointerIndex !== null && (
            <>Day {currentSlot.pointerIndex + 1}/{currentSlot.cycleLengthDays}</>
          )}
          {currentSlot.totalCycles > 0 && (
            <> &middot; Cycle {currentSlot.currentCycle + 1}/{currentSlot.totalCycles}</>
          )}
        </p>
      </CardHeader>
      <CardContent>
        {currentSlot.didActivityToday ? (
          <ActivityDoneToday currentSlot={currentSlot} onOpenPicker={onOpenPicker} />
        ) : currentSlot.pointerIndex === null ? (
          <p className="text-sm text-muted-foreground">Cycle complete — starting the next one.</p>
        ) : currentSlot.pointerIsRestDay ? (
          <RestDayPrompt onMarkDone={onMarkRestDayDone} onOpenPicker={onOpenPicker} />
        ) : currentSlot.pointerWorkoutId && !currentSlot.pointerWorkoutName ? (
          <MissingWorkoutWarning programId={currentSlot.programId} onEdit={() => navigate(`/programs/${currentSlot.programId}/edit`)} />
        ) : (
          <PointerWorkoutPrompt
            workoutName={currentSlot.pointerWorkoutName!}
            onStart={() => onStartWorkout(currentSlot.pointerWorkoutId!, currentSlot.pointerIndex!)}
            onOpenPicker={onOpenPicker}
          />
        )}
      </CardContent>
    </Card>
  )
}

function ActivityDoneToday({ currentSlot, onOpenPicker }: {
  currentSlot: CurrentSlot
  onOpenPicker: () => void
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        {currentSlot.todayActivityWasRest ? (
          <Moon className="h-5 w-5 text-primary" />
        ) : (
          <PartyPopper className="h-5 w-5 text-primary" />
        )}
        <div>
          <p className="text-sm font-semibold">
            {currentSlot.todayActivityWasRest
              ? 'Rest day taken'
              : `${currentSlot.todayActivityName} completed`}
          </p>
          <p className="text-xs text-muted-foreground">
            {currentSlot.todayActivityWasRest
              ? 'Enjoy the recovery — see you tomorrow.'
              : 'Good work today. See you tomorrow.'}
          </p>
        </div>
      </div>
      <Button
        size="sm"
        variant="ghost"
        className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
        onClick={onOpenPicker}
      >
        <Shuffle className="h-3.5 w-3.5 mr-1" />
        Add another workout
      </Button>
    </div>
  )
}

function RestDayPrompt({ onMarkDone, onOpenPicker }: {
  onMarkDone: () => void
  onOpenPicker: () => void
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Moon className="h-4 w-4 text-muted-foreground" />
        <p className="text-sm font-medium">Today is a rest day</p>
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={onMarkDone}>
          <Check className="h-4 w-4 mr-1" />
          Mark Done
        </Button>
        <Button size="sm" variant="outline" onClick={onOpenPicker}>
          <Shuffle className="h-4 w-4 mr-1" />
          Do a workout instead
        </Button>
      </div>
    </div>
  )
}

function MissingWorkoutWarning({ programId: _programId, onEdit }: {
  programId: string
  onEdit: () => void
}) {
  return (
    <div className="flex items-center gap-2">
      <AlertTriangle className="h-4 w-4 text-destructive" />
      <div>
        <p className="text-sm font-medium text-destructive">Workout removed</p>
        <p className="text-xs text-muted-foreground">
          Update your program to assign a new workout.
        </p>
      </div>
      <Button size="sm" variant="outline" onClick={onEdit}>
        Edit
      </Button>
    </div>
  )
}

function PointerWorkoutPrompt({ workoutName, onStart, onOpenPicker }: {
  workoutName: string
  onStart: () => void
  onOpenPicker: () => void
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <Dumbbell className="h-4 w-4 text-primary shrink-0" />
          <p className="text-sm font-medium truncate">{workoutName}</p>
        </div>
        <Button size="sm" onClick={onStart}>
          <Play className="h-4 w-4 mr-1" />
          Start
        </Button>
      </div>
      <Button
        size="sm"
        variant="ghost"
        className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
        onClick={onOpenPicker}
      >
        <Shuffle className="h-3.5 w-3.5 mr-1" />
        Pick a different workout
      </Button>
    </div>
  )
}
