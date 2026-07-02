import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { TrendingUp } from 'lucide-react'
import type { Progression } from '@/models/types'
import type { ReadinessVerdict } from '@/lib/readiness-engine'
import { useUpdateCurrentLevel, useDismissVerdictCard } from '@/hooks/useProgressions'

export interface AdvanceSuggestionCardProps {
  progression: Progression
  verdict: ReadinessVerdict
}

/**
 * Shared suggest-and-confirm card for "ready to advance" verdicts.
 * Used on the Library (progressions list), Home, and post-workout summary.
 *
 * Cross-surface dismissal is automatic: snooze is persisted on the Progression
 * row (dismissedAt / dismissedAtSessionCount), so all surfaces share the same
 * snoozed state via the same useProgressionVerdicts query key.
 */
export function AdvanceSuggestionCard({ progression, verdict }: AdvanceSuggestionCardProps) {
  const advanceLevel = useUpdateCurrentLevel()
  const dismissVerdict = useDismissVerdictCard()

  return (
    <Card className="p-3 border-green-500/30 bg-green-500/5">
      <div className="flex items-start gap-2 mb-2">
        <TrendingUp className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
        <div className="min-w-0">
          <p className="text-sm font-medium text-green-600 dark:text-green-400">
            Ready to advance
          </p>
          <p className="text-sm text-foreground truncate">{progression.name}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{verdict.evidence}</p>
        </div>
      </div>
      <div className="flex gap-2">
        <Button
          size="sm"
          className="flex-1"
          onClick={() =>
            advanceLevel.mutate({
              id: progression.id,
              currentLevel: progression.currentLevel + 1,
            })
          }
          disabled={advanceLevel.isPending}
        >
          Advance
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            dismissVerdict.mutate({
              progressionId: progression.id,
              qualifyingSessionCount: verdict.qualifyingSessionCount,
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
