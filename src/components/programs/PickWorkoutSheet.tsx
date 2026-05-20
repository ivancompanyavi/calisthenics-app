import { Dialog, DialogTitle } from '@/components/ui/dialog'
import { Check, Dumbbell, Moon, ArrowRight, X as XIcon } from 'lucide-react'
import type { CycleSlotView } from '@/repositories/programs.repository'

interface PickWorkoutSheetProps {
  open: boolean
  onClose: () => void
  slots: CycleSlotView[]
  pointerIndex: number | null
  onPick: (slotIndex: number) => void
}

export function PickWorkoutSheet({
  open,
  onClose,
  slots,
  pointerIndex,
  onPick,
}: PickWorkoutSheetProps) {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Pick a workout</DialogTitle>
      <p className="text-sm text-muted-foreground mb-4">
        Pending workouts are tappable. Doing one out of order leaves the pointer where it is —
        the originally-next workout stays next.
      </p>
      <ul className="space-y-2">
        {slots.map((slot, index) => {
          const isPointer = index === pointerIndex
          const isPending = slot.status === 'pending'
          const tappable = isPending
          const Icon = slot.workoutId ? Dumbbell : Moon
          const label = slot.workoutId ? slot.workoutName ?? 'Removed workout' : 'Rest day'

          return (
            <li key={index}>
              <button
                type="button"
                disabled={!tappable}
                onClick={() => {
                  if (tappable) onPick(index)
                }}
                className={[
                  'w-full text-left rounded-lg border p-3 flex items-center gap-3 transition-colors',
                  isPointer && 'border-primary bg-primary/10',
                  !isPointer && isPending && 'border-border bg-card hover:bg-secondary/50',
                  slot.status === 'done' && 'border-border bg-secondary/30 opacity-60 cursor-default',
                  slot.status === 'skipped' && 'border-border bg-secondary/30 opacity-50 cursor-default',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                <span className="text-xs font-medium text-muted-foreground w-8 shrink-0">
                  D{slot.dayNumber}
                </span>
                <Icon className={`h-4 w-4 shrink-0 ${isPointer ? 'text-primary' : 'text-muted-foreground'}`} />
                <span className="flex-1 text-sm font-medium truncate">{label}</span>
                {slot.status === 'done' && <Check className="h-4 w-4 text-green-500 shrink-0" />}
                {slot.status === 'skipped' && <XIcon className="h-4 w-4 text-muted-foreground shrink-0" />}
                {isPointer && isPending && <ArrowRight className="h-4 w-4 text-primary shrink-0" />}
              </button>
            </li>
          )
        })}
      </ul>
    </Dialog>
  )
}
