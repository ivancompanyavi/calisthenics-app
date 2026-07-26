import type { ResolvedEntry } from '@/hooks/useWorkoutExecution'
import { MovementPhoto } from '@/components/movements/MovementPhoto'
import { Button } from '@/components/ui/button'
import { formatTime, formatTempo } from '@/lib/utils'
import { Check, Clock, X, Video } from 'lucide-react'
import { useWeightUnit } from '@/hooks/useSettings'
import { formatWeight } from '@/lib/units'
import { SubstitutionNote } from '@/components/workouts/SubstitutionNote'

interface ExerciseDisplayProps {
  entry: ResolvedEntry
  timeRemaining: number
  timeElapsed: number
  round: number
  totalRounds: number
  onDone: () => void
  onDelay: () => void
  onSkip: () => void
}

export function ExerciseDisplay({ entry, timeRemaining, timeElapsed, round, totalRounds, onDone, onDelay, onSkip }: ExerciseDisplayProps) {
  const sideLabel = entry.perSide ? ' /side' : ''
  const unit = useWeightUnit()

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 gap-6">
      <MovementPhoto
        photo={entry.movementPhoto}
        seedImagePath={entry.movementSeedImagePath}
        name={entry.movementName}
        size="lg"
        className="h-32 w-32"
      />

      <div className="text-center max-w-md">
        {/* Why this exercise, when the authored one is still locked. */}
        {entry.substitutedFor && (
          <div className="flex justify-center mb-2">
            <SubstitutionNote substitutedFor={entry.substitutedFor} variant="banner" />
          </div>
        )}
        <h2 className="text-2xl font-bold">{entry.movementName}</h2>
        {totalRounds > 1 && (
          <p className="text-sm text-muted-foreground mt-1">
            Round {round} of {totalRounds}
          </p>
        )}
        {entry.tempo && (
          <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-secondary/50 px-3 py-1 text-xs font-mono">
            <span className="text-muted-foreground">Tempo</span>
            <span className="font-semibold tabular-nums">
              {formatTempo(entry.tempo)}
            </span>
          </div>
        )}
        {entry.targetWeightKg != null && (
          <div className="mt-2 ml-1 inline-flex items-center gap-1.5 rounded-full bg-secondary/50 px-3 py-1 text-xs font-mono">
            <span className="text-muted-foreground">Weight</span>
            <span className="font-semibold tabular-nums">
              {formatWeight(entry.targetWeightKg, unit)}
            </span>
          </div>
        )}
        {entry.targetBandLevel != null && (
          <div className="mt-2 ml-1 inline-flex items-center gap-1.5 rounded-full bg-secondary/50 px-3 py-1 text-xs font-mono">
            <span className="text-muted-foreground">Band</span>
            <span className="font-semibold tabular-nums">
              Level {entry.targetBandLevel}
            </span>
          </div>
        )}
        {entry.movementCoachingCues && (
          <p className="text-sm text-muted-foreground mt-2 italic">
            {entry.movementCoachingCues}
          </p>
        )}
        {entry.movementReferenceUrl && (
          <a
            href={entry.movementReferenceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary mt-2 inline-flex items-center gap-1 hover:underline"
          >
            <Video className="h-3 w-3" />
            Form check
          </a>
        )}
      </div>

      {entry.mode === 'max' ? (
        <div className="text-center">
          <p className="text-6xl font-bold font-mono tabular-nums text-primary">
            {formatTime(timeElapsed)}
          </p>
          <p className="text-sm text-muted-foreground mt-2">Max hold</p>
        </div>
      ) : entry.mode === 'time' ? (
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
            {entry.suggestedReps ?? entry.targetReps}
          </p>
          <p className="text-sm text-muted-foreground mt-2">reps{sideLabel}</p>
          {entry.suggestedReps != null && entry.suggestedReps !== entry.targetReps && (
            <p className="text-[11px] text-primary mt-1">
              ↑ bumped from {entry.targetReps} · clean hit last session
            </p>
          )}
        </div>
      )}

      {(entry.mode === 'reps' || entry.mode === 'max') && (
        <Button size="lg" className="text-lg px-12 mt-4" onClick={onDone}>
          <Check className="h-5 w-5 mr-2" />
          Done
        </Button>
      )}

      <div className="flex gap-4 mt-2">
        <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={onDelay}>
          <Clock className="h-4 w-4 mr-1" />
          Delay
        </Button>
        <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={onSkip}>
          <X className="h-4 w-4 mr-1" />
          Skip
        </Button>
      </div>
    </div>
  )
}
