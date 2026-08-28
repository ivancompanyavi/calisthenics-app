import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ArrowUpRight } from 'lucide-react'
import type { UpgradeSuggestion } from '@/lib/session-adaptation'

// The opt-in half of adaptive pattern slots: a harder line is unlocked, but the
// slot keeps training the athlete's current line until THEY step up. Without
// this card the unlock would be invisible; with an auto-swap instead of a card,
// one good day (or an unedited logged target) silently reprograms the session —
// the failure that made the app unusable after a layoff.

interface UpgradeSuggestionCardProps {
  suggestion: UpgradeSuggestion
  /** Athlete opted in — the slot resolves to this line from now on. */
  onAdopt: (progressionId: string) => Promise<void> | void
  /** Snoozed until fresh gate evidence re-earns the offer. */
  onDismiss: (progressionId: string) => Promise<void> | void
}

// "Back Lever Progression" → "Back Lever".
function shortName(name: string): string {
  return name.replace(/\s+Progression$/, '')
}

export function UpgradeSuggestionCard({
  suggestion,
  onAdopt,
  onDismiss,
}: UpgradeSuggestionCardProps) {
  const [busy, setBusy] = useState(false)

  const act = async (fn: (id: string) => Promise<void> | void) => {
    setBusy(true)
    try {
      await fn(suggestion.progressionId)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card className="p-3 border-primary/30 bg-primary/5">
      <div className="flex items-start gap-2">
        <ArrowUpRight className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">
            {shortName(suggestion.progressionName)} is unlocked
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Your recent numbers qualify. Step up when you feel ready — this slot keeps
            your current exercise until you do.
          </p>
          <div className="flex gap-2 mt-2">
            <Button size="sm" disabled={busy} onClick={() => act(onAdopt)}>
              Step up
            </Button>
            <Button size="sm" variant="ghost" disabled={busy} onClick={() => act(onDismiss)}>
              Not yet
            </Button>
          </div>
        </div>
      </div>
    </Card>
  )
}
