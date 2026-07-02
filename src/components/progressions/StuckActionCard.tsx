import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Clock, TrendingDown, Shuffle, Plus } from 'lucide-react'
import type { Progression } from '@/models/types'
import type { ReadinessVerdict } from '@/lib/readiness-engine'
import { useDecrementCurrentLevel } from '@/hooks/useProgressions'

export interface StuckActionCardProps {
  progression: Progression
  verdict: ReadinessVerdict
  /** Opens the progression editor so the user can swap to a different variant. */
  onSwapVariant: () => void
}

/**
 * Actionable card for `stuck` verdicts.
 * Replaces the passive stuck chip on the progression card in the Library.
 *
 * Offers three options:
 *  1. Drop a rung  — level-down mutation (decrements currentLevel, floors at 0)
 *  2. Swap variant — opens the progression editor (navigate, no mutation here)
 *  3. Add volume   — informational guidance text only, no mutation
 *
 * No dismiss/snooze on the stuck card: the verdict itself disappears once the
 * user takes an action or accumulates qualifying sessions.
 */
export function StuckActionCard({ progression, verdict, onSwapVariant }: StuckActionCardProps) {
  const decrementLevel = useDecrementCurrentLevel()
  const [showVolumeInfo, setShowVolumeInfo] = useState(false)

  return (
    <Card className="p-3 border-amber-500/30 bg-amber-500/5">
      <div className="flex items-start gap-2 mb-2">
        <Clock className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
        <div className="min-w-0">
          <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
            Stuck — time to change something
          </p>
          <p className="text-sm text-foreground truncate">{progression.name}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{verdict.evidence}</p>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="flex-1 text-xs"
            onClick={() =>
              decrementLevel.mutate({
                id: progression.id,
                currentLevel: progression.currentLevel,
              })
            }
            disabled={decrementLevel.isPending}
          >
            <TrendingDown className="h-3 w-3 mr-1 shrink-0" />
            Drop a rung
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="flex-1 text-xs"
            onClick={onSwapVariant}
          >
            <Shuffle className="h-3 w-3 mr-1 shrink-0" />
            Swap variant
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="flex-1 text-xs"
            onClick={() => setShowVolumeInfo((v) => !v)}
          >
            <Plus className="h-3 w-3 mr-1 shrink-0" />
            Add volume
          </Button>
        </div>
        {showVolumeInfo && (
          <p className="text-xs text-muted-foreground bg-muted/50 rounded p-2">
            Add an extra set or an assistance exercise targeting the same skill (e.g. negatives,
            band-assisted reps, or isometric holds). Aim for 2–3 quality sets per session above
            your current volume. No changes are made automatically — adjust your workout manually.
          </p>
        )}
      </div>
    </Card>
  )
}
