import type { ResolvedEntry } from '@/hooks/useWorkoutExecution'
import { Button } from '@/components/ui/button'
import { Check, X, ShieldAlert } from 'lucide-react'

interface GatePromptProps {
  entry: ResolvedEntry
  onYes: () => void
  onNo: () => void
}

// Pre-flight autoregulation gate. Renders as a full-screen prompt before the
// gated exercise starts. The intent is to make "skip on bad days" structural
// rather than a coaching cue users skim past.
export function GatePrompt({ entry, onYes, onNo }: GatePromptProps) {
  if (!entry.gate) return null

  const skipBehavior = entry.gate.skipOnNo
    ? 'Tap No to skip this exercise.'
    : 'Tap No to log the warning and continue anyway.'

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 gap-6">
      <div className="h-16 w-16 rounded-full bg-amber-500/15 flex items-center justify-center">
        <ShieldAlert className="h-8 w-8 text-amber-500" />
      </div>

      <div className="text-center max-w-sm">
        <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
          Readiness check
        </p>
        <h2 className="text-xl font-semibold mb-3">{entry.movementName}</h2>
        <p className="text-lg">{entry.gate.question}</p>
        <p className="text-xs text-muted-foreground mt-3">{skipBehavior}</p>
      </div>

      <div className="flex gap-4 w-full max-w-xs">
        <Button
          size="lg"
          variant="outline"
          className="flex-1 text-base"
          onClick={onNo}
        >
          <X className="h-5 w-5 mr-2" />
          No
        </Button>
        <Button size="lg" className="flex-1 text-base" onClick={onYes}>
          <Check className="h-5 w-5 mr-2" />
          Yes
        </Button>
      </div>
    </div>
  )
}
