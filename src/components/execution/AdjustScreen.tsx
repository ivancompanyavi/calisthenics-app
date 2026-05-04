import type { ResolvedEntry } from '@/hooks/useWorkoutExecution'
import { Button } from '@/components/ui/button'
import { Minus, Plus, Check } from 'lucide-react'

interface AdjustScreenProps {
  entry: ResolvedEntry
  adjustReps: number
  adjustSeconds: number
  onSetReps: (v: number) => void
  onSetSeconds: (v: number) => void
  onConfirm: () => void
}

export function AdjustScreen({ entry, adjustReps, adjustSeconds, onSetReps, onSetSeconds, onConfirm }: AdjustScreenProps) {
  const sideLabel = entry.perSide ? ' /side' : ''

  if (entry.mode === 'reps') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-6 gap-6">
        <h2 className="text-xl font-semibold text-muted-foreground">{entry.movementName}</h2>
        <p className="text-sm text-muted-foreground">How many did you do?{sideLabel && ' (per side)'}</p>

        <div className="flex items-center gap-6">
          <Button
            variant="outline"
            size="icon"
            className="h-14 w-14 rounded-full"
            onClick={() => onSetReps(Math.max(0, adjustReps - 1))}
          >
            <Minus className="h-6 w-6" />
          </Button>

          <span className="text-6xl font-bold font-mono tabular-nums min-w-[100px] text-center">
            {adjustReps}
          </span>

          <Button
            variant="outline"
            size="icon"
            className="h-14 w-14 rounded-full"
            onClick={() => onSetReps(adjustReps + 1)}
          >
            <Plus className="h-6 w-6" />
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          Target: {entry.targetReps} reps{sideLabel}
        </p>

        <Button size="lg" className="text-lg px-12 mt-4" onClick={onConfirm}>
          <Check className="h-5 w-5 mr-2" />
          Confirm
        </Button>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 gap-6">
      <h2 className="text-xl font-semibold text-muted-foreground">{entry.movementName}</h2>
      <p className="text-sm text-muted-foreground">How long did you hold?</p>

      <div className="flex items-center gap-6">
        <Button
          variant="outline"
          size="icon"
          className="h-14 w-14 rounded-full"
          onClick={() => onSetSeconds(Math.max(0, adjustSeconds - 5))}
        >
          <Minus className="h-6 w-6" />
        </Button>

        <span className="text-5xl font-bold font-mono tabular-nums min-w-[100px] text-center">
          {adjustSeconds}s
        </span>

        <Button
          variant="outline"
          size="icon"
          className="h-14 w-14 rounded-full"
          onClick={() => onSetSeconds(adjustSeconds + 5)}
        >
          <Plus className="h-6 w-6" />
        </Button>
      </div>

      {entry.mode === 'time' && (
        <p className="text-xs text-muted-foreground">
          Target: {entry.targetSeconds}s
        </p>
      )}

      <Button size="lg" className="text-lg px-12 mt-4" onClick={onConfirm}>
        <Check className="h-5 w-5 mr-2" />
        Confirm
      </Button>
    </div>
  )
}
