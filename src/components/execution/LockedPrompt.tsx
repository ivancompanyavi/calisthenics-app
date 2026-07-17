import type { ResolvedEntry } from '@/hooks/useWorkoutExecution'
import type { ResolvedGatePrerequisite } from '@/hooks/useProgressionGates'
import { Button } from '@/components/ui/button'
import { Lock, Check, SkipForward } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LockedPromptProps {
  entry: ResolvedEntry
  prerequisites: ResolvedGatePrerequisite[]
  onUnblock: () => void
  onSkip: () => void
}

// Shown in place of the exercise when a progression-bound entry resolves to a
// still-locked progression. Mirrors GatePrompt's full-screen pre-flight pattern,
// but frames the lock as a goal ("unlock by …") rather than prescribing an
// exercise the athlete hasn't earned. Skip advances past it; "Unblock anyway"
// persists the manual override (same escape hatch as the progression detail).
export function LockedPrompt({ entry, prerequisites, onUnblock, onSkip }: LockedPromptProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 gap-6">
      <div className="h-16 w-16 rounded-full bg-amber-500/15 flex items-center justify-center">
        <Lock className="h-8 w-8 text-amber-500" />
      </div>

      <div className="text-center max-w-sm">
        <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Locked</p>
        <h2 className="text-xl font-semibold mb-1">
          {entry.progressionName ?? entry.movementName}
        </h2>
        <p className="text-sm text-muted-foreground mb-4">Build the base first — unlock by:</p>
        <ul className="space-y-1.5 text-left inline-block">
          {prerequisites.map((pr, i) => (
            <li key={i} className="flex items-center gap-2 text-sm">
              {pr.met ? (
                <Check className="h-3.5 w-3.5 shrink-0 text-green-600" />
              ) : (
                <span className="h-3.5 w-3.5 shrink-0 rounded-full border border-muted-foreground/40" />
              )}
              <span className={cn('flex-1', pr.met && 'text-muted-foreground line-through')}>
                {pr.label}
                {pr.detail ? <span className="text-muted-foreground"> — {pr.detail}</span> : null}
              </span>
              {!pr.met && pr.progress > 0 && (
                <span className="text-xs text-muted-foreground tabular-nums">
                  {Math.round(pr.progress * 100)}%
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>

      <div className="flex gap-4 w-full max-w-xs">
        <Button size="lg" variant="outline" className="flex-1 text-base" onClick={onSkip}>
          <SkipForward className="h-5 w-5 mr-2" />
          Skip
        </Button>
        <Button size="lg" className="flex-1 text-base" onClick={onUnblock}>
          Unblock anyway
        </Button>
      </div>
    </div>
  )
}
