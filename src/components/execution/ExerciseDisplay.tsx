import type { ResolvedEntry } from '@/hooks/useWorkoutExecution'
import { MovementPhoto } from '@/components/movements/MovementPhoto'
import { Button } from '@/components/ui/button'
import { formatTime } from '@/lib/utils'
import { Check } from 'lucide-react'

interface ExerciseDisplayProps {
  entry: ResolvedEntry
  timeRemaining: number
  round: number
  totalRounds: number
  onDone: () => void
}

export function ExerciseDisplay({ entry, timeRemaining, round, totalRounds, onDone }: ExerciseDisplayProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 gap-6">
      <MovementPhoto
        photo={entry.movementPhoto}
        name={entry.movementName}
        size="lg"
        className="h-32 w-32"
      />

      <div className="text-center">
        <h2 className="text-2xl font-bold">{entry.movementName}</h2>
        {totalRounds > 1 && (
          <p className="text-sm text-muted-foreground mt-1">
            Round {round} of {totalRounds}
          </p>
        )}
      </div>

      {entry.mode === 'time' ? (
        <div className="text-center">
          <p className="text-6xl font-bold font-mono tabular-nums text-primary">
            {formatTime(timeRemaining)}
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Target: {formatTime(entry.targetSeconds ?? 0)}
          </p>
        </div>
      ) : (
        <div className="text-center">
          <p className="text-6xl font-bold font-mono tabular-nums">
            {entry.targetReps}
          </p>
          <p className="text-sm text-muted-foreground mt-2">reps</p>
        </div>
      )}

      {entry.mode === 'reps' && (
        <Button size="lg" className="text-lg px-12 mt-4" onClick={onDone}>
          <Check className="h-5 w-5 mr-2" />
          Done
        </Button>
      )}
    </div>
  )
}
