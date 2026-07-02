import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { TrendingDown } from 'lucide-react'
import type { Progression } from '@/models/types'
import type { ReadinessVerdict } from '@/lib/readiness-engine'
import { useDecrementCurrentLevel, useDismissVerdictCard } from '@/hooks/useProgressions'

export interface RegressingSuggestionCardProps {
  progression: Progression
  verdict: ReadinessVerdict
}

/**
 * Suggest-and-confirm card for `regressing` verdicts.
 * Shown on the Library progressions list when 3 consecutive sessions
 * have been below target at RIR/SIR 0.
 *
 * "Drop a rung" decrements currentLevel (floored at 0).
 * "Dismiss" snoozes the card until a new session is logged at this rung —
 * it stores sessionsAtRung in dismissedAtSessionCount so the engine wakes
 * the card as soon as sessionsAtRung exceeds the stored value.
 */
export function RegressingSuggestionCard({ progression, verdict }: RegressingSuggestionCardProps) {
  const decrementLevel = useDecrementCurrentLevel()
  const dismissVerdict = useDismissVerdictCard()

  return (
    <Card className="p-3 border-red-500/30 bg-red-500/5">
      <div className="flex items-start gap-2 mb-2">
        <TrendingDown className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
        <div className="min-w-0">
          <p className="text-sm font-medium text-red-600 dark:text-red-400">
            Consider dropping a rung
          </p>
          <p className="text-sm text-foreground truncate">{progression.name}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{verdict.evidence}</p>
        </div>
      </div>
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="destructive"
          className="flex-1"
          onClick={() =>
            decrementLevel.mutate({
              id: progression.id,
              currentLevel: progression.currentLevel,
            })
          }
          disabled={decrementLevel.isPending}
        >
          Drop a rung
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            dismissVerdict.mutate({
              progressionId: progression.id,
              // Store sessionsAtRung so the card wakes after the next session
              // at this rung (not after a new qualifying session, which may
              // never happen while the user is regressing).
              qualifyingSessionCount: verdict.sessionsAtRung,
            })
          }
          disabled={dismissVerdict.isPending}
        >
          Dismiss
        </Button>
      </div>
    </Card>
  )
}
