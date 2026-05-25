import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { formatTime } from '@/lib/utils'
import { SkipForward } from 'lucide-react'
import { MovementPhoto } from '@/components/movements/MovementPhoto'
import { ExerciseDetailDialog } from '@/components/workouts/ExerciseDetailDialog'
import type { ResolvedBlock, ResolvedEntry } from '@/lib/execution-engine'
import { useWeightUnit } from '@/hooks/useSettings'
import { formatWeight } from '@/lib/units'
import type { WeightUnit } from '@/models/types'

interface RestScreenProps {
  remaining: number
  total: number
  nextEntry?: ResolvedEntry | null
  // The block the next entry belongs to, plus its 0-based index in the
  // workout. Both feed the ExerciseDetailDialog opened from the "Up next"
  // card so the modal can show the rounds/rest/position context.
  nextBlock?: ResolvedBlock | null
  nextBlockIndex?: number | null
  onSkip: () => void
}

function formatTarget(entry: ResolvedEntry, unit: WeightUnit): string {
  const sideLabel = entry.perSide ? ' /side' : ''
  const parts: string[] = []
  if (entry.mode === 'time') {
    parts.push(entry.targetSeconds ? formatTime(entry.targetSeconds) : 'Hold')
  } else if (entry.mode === 'max') {
    parts.push('Max hold')
  } else {
    parts.push(entry.targetReps != null ? `${entry.targetReps} reps${sideLabel}` : 'reps')
  }
  if (entry.targetWeightKg != null) parts.push(formatWeight(entry.targetWeightKg, unit))
  if (entry.targetBandLevel != null) parts.push(`band ${entry.targetBandLevel}`)
  return parts.join(' · ')
}

export function RestScreen({
  remaining,
  total,
  nextEntry,
  nextBlock,
  nextBlockIndex,
  onSkip,
}: RestScreenProps) {
  const elapsed = total - remaining
  const unit = useWeightUnit()
  const circumference = 2 * Math.PI * 72
  const strokeDashoffset = circumference * (1 - elapsed / total)
  const [detailOpen, setDetailOpen] = useState(false)
  // Dialog needs both entry + block to render the block-context strip. If the
  // block is missing (legacy callers, edge cases) we just don't expose tap.
  const canShowDetail = !!nextEntry && !!nextBlock

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
        <button
          type="button"
          onClick={() => canShowDetail && setDetailOpen(true)}
          disabled={!canShowDetail}
          className="w-full max-w-sm rounded-xl border border-border bg-card/50 p-3 text-left transition-colors enabled:hover:bg-card disabled:cursor-default focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
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
              <p className="text-sm text-muted-foreground">{formatTarget(nextEntry, unit)}</p>
            </div>
          </div>
        </button>
      )}

      <Button variant="outline" size="lg" onClick={onSkip}>
        <SkipForward className="h-5 w-5 mr-2" />
        Skip Rest
      </Button>

      <ExerciseDetailDialog
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        entry={nextEntry ?? null}
        block={nextBlock ?? null}
        blockIndex={nextBlockIndex ?? null}
      />
    </div>
  )
}
