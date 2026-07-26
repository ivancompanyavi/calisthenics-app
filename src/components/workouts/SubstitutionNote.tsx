import type { SubstitutedFor } from '@/lib/execution-engine'
import { KeyRound, Shuffle } from 'lucide-react'
import { cn } from '@/lib/utils'

// Explains why a slot is showing an exercise the athlete didn't author: its
// progression is still locked, so session adaptation swapped in either the work
// that opens the gate or the best unlocked stand-in. Without this note the swap
// looks like the app losing track of the program.
//
// Shared by the session preview, workout detail, and the execution screen so all
// three describe a substitution identically.

interface SubstitutionNoteProps {
  substitutedFor: SubstitutedFor
  /** 'badge' for dense lists, 'banner' for the full-screen exercise view. */
  variant?: 'badge' | 'banner'
  className?: string
}

// "Back Lever Progression" → "Back Lever". The suffix is noise in a cramped row.
function shortName(name: string): string {
  return name.replace(/\s+Progression$/, '')
}

function substitutionText(substitutedFor: SubstitutedFor): string {
  const target = shortName(substitutedFor.progressionName)
  return substitutedFor.reason === 'unlock'
    ? `Working toward ${target}`
    : `Instead of ${target} — locked`
}

export function SubstitutionNote({
  substitutedFor,
  variant = 'badge',
  className,
}: SubstitutionNoteProps) {
  const Icon = substitutedFor.reason === 'unlock' ? KeyRound : Shuffle
  const text = substitutionText(substitutedFor)

  if (variant === 'banner') {
    return (
      <div
        className={cn(
          'flex items-center justify-center gap-2 rounded-full px-3 py-1 text-xs',
          substitutedFor.reason === 'unlock'
            ? 'bg-amber-500/15 text-amber-500'
            : 'bg-secondary text-muted-foreground',
          className,
        )}
      >
        <Icon className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate">{text}</span>
      </div>
    )
  }

  return (
    <span
      className={cn(
        'text-[10px] flex items-center gap-0.5',
        substitutedFor.reason === 'unlock' ? 'text-amber-500' : 'text-muted-foreground',
        className,
      )}
    >
      <Icon className="h-2.5 w-2.5 shrink-0" />
      <span className="truncate">{text}</span>
    </span>
  )
}
