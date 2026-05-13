import { Button } from '@/components/ui/button'
import { formatTime } from '@/lib/utils'
import { SkipForward } from 'lucide-react'
import { MovementPhoto } from '@/components/movements/MovementPhoto'
import type { ResolvedEntry } from '@/lib/execution-engine'

interface RestScreenProps {
  remaining: number
  total: number
  nextEntry?: ResolvedEntry | null
  onSkip: () => void
}

function formatTarget(entry: ResolvedEntry): string {
  const sideLabel = entry.perSide ? ' /side' : ''
  if (entry.mode === 'time') {
    return entry.targetSeconds ? `${formatTime(entry.targetSeconds)}` : 'Hold'
  }
  if (entry.mode === 'max') {
    return 'Max hold'
  }
  return entry.targetReps != null ? `${entry.targetReps} reps${sideLabel}` : 'reps'
}

export function RestScreen({ remaining, total, nextEntry, onSkip }: RestScreenProps) {
  const elapsed = total - remaining
  const circumference = 2 * Math.PI * 72
  const strokeDashoffset = circumference * (1 - elapsed / total)

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 gap-6">
      <p className="text-lg font-semibold text-muted-foreground">Rest</p>

      <div className="relative h-48 w-48">
        <svg className="h-48 w-48 -rotate-90" viewBox="0 0 160 160">
          <circle
            cx="80"
            cy="80"
            r="72"
            fill="none"
            stroke="currentColor"
            strokeWidth="6"
            className="text-secondary"
          />
          <circle
            cx="80"
            cy="80"
            r="72"
            fill="none"
            stroke="currentColor"
            strokeWidth="6"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="text-primary transition-all duration-1000 ease-linear"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-5xl font-bold font-mono tabular-nums">
            {formatTime(remaining)}
          </span>
        </div>
      </div>

      {nextEntry && (
        <div className="w-full max-w-sm rounded-xl border border-border bg-card/50 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Up next
          </p>
          <div className="flex items-center gap-3">
            <MovementPhoto
              photo={nextEntry.movementPhoto}
              seedImagePath={nextEntry.movementSeedImagePath}
              name={nextEntry.movementName}
              size="md"
            />
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">{nextEntry.movementName}</p>
              <p className="text-sm text-muted-foreground">{formatTarget(nextEntry)}</p>
            </div>
          </div>
        </div>
      )}

      <Button variant="outline" size="lg" onClick={onSkip}>
        <SkipForward className="h-5 w-5 mr-2" />
        Skip Rest
      </Button>
    </div>
  )
}
