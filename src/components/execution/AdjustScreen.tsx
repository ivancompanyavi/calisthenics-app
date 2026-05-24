import { useState } from 'react'
import type { ResolvedEntry } from '@/hooks/useWorkoutExecution'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { Minus, Plus, Check, StickyNote } from 'lucide-react'

interface AdjustScreenProps {
  entry: ResolvedEntry
  adjustReps: number
  adjustSeconds: number
  adjustNotes: string
  adjustRir?: number
  onSetReps: (v: number) => void
  onSetSeconds: (v: number) => void
  onSetNotes: (v: string) => void
  onSetRir: (v: number | undefined) => void
  onConfirm: () => void
}

// RIR captures reps-in-reserve at end of set. The program targets RIR 2-3
// (conservative) so we render those values prominently in the middle of the
// scale; 0 (failure) and 4+ (very easy) are de-emphasized.
const RIR_OPTIONS: number[] = [0, 1, 2, 3, 4]

export function AdjustScreen({ entry, adjustReps, adjustSeconds, adjustNotes, adjustRir, onSetReps, onSetSeconds, onSetNotes, onSetRir, onConfirm }: AdjustScreenProps) {
  const sideLabel = entry.perSide ? ' /side' : ''
  const [showNotes, setShowNotes] = useState(!!adjustNotes)
  // Hold/max-mode sets don't get an RIR — RIR is a reps concept. Skip rendering.
  const showRir = entry.mode === 'reps'

  const rirRow = showRir ? (
    <div className="w-full max-w-xs">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 text-center">
        RIR (reps in reserve)
      </p>
      <div className="flex justify-center gap-1.5">
        {RIR_OPTIONS.map((value) => {
          const active = adjustRir === value
          return (
            <button
              key={value}
              type="button"
              onClick={() => onSetRir(active ? undefined : value)}
              className={cn(
                'h-8 w-8 rounded-full text-sm font-mono tabular-nums border transition-colors',
                active
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border text-muted-foreground hover:bg-secondary/50',
              )}
            >
              {value}
            </button>
          )
        })}
      </div>
    </div>
  ) : null

  const notesSection = (
    <div className="w-full max-w-xs">
      {showNotes ? (
        <Textarea
          value={adjustNotes}
          onChange={(e) => onSetNotes(e.target.value)}
          placeholder="Note for this set..."
          className="h-16 resize-none"
        />
      ) : (
        <button
          type="button"
          className="text-xs text-muted-foreground flex items-center gap-1 mx-auto"
          onClick={() => setShowNotes(true)}
        >
          <StickyNote className="h-3 w-3" />
          Add note
        </button>
      )}
    </div>
  )

  if (entry.mode === 'reps') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-6 gap-6">
        <h2 className="text-xl font-semibold text-muted-foreground">{entry.movementName}</h2>
        <p className="text-sm text-muted-foreground">How many did you do?{sideLabel && ' (per side)'}</p>

        <div className="flex items-center gap-6">
          <Button
            variant="outline"
            size="icon"
            className="h-14 w-14 rounded-full"
            onClick={() => onSetReps(Math.max(0, adjustReps - 1))}
          >
            <Minus className="h-6 w-6" />
          </Button>

          <span className="text-6xl font-bold font-mono tabular-nums min-w-[100px] text-center">
            {adjustReps}
          </span>

          <Button
            variant="outline"
            size="icon"
            className="h-14 w-14 rounded-full"
            onClick={() => onSetReps(adjustReps + 1)}
          >
            <Plus className="h-6 w-6" />
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          Target: {entry.targetReps} reps{sideLabel}
        </p>

        {rirRow}
        {notesSection}

        <Button size="lg" className="text-lg px-12 mt-4" onClick={onConfirm}>
          <Check className="h-5 w-5 mr-2" />
          Confirm
        </Button>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 gap-6">
      <h2 className="text-xl font-semibold text-muted-foreground">{entry.movementName}</h2>
      <p className="text-sm text-muted-foreground">How long did you hold?</p>

      <div className="flex items-center gap-6">
        <Button
          variant="outline"
          size="icon"
          className="h-14 w-14 rounded-full"
          onClick={() => onSetSeconds(Math.max(0, adjustSeconds - 5))}
        >
          <Minus className="h-6 w-6" />
        </Button>

        <span className="text-5xl font-bold font-mono tabular-nums min-w-[100px] text-center">
          {adjustSeconds}s
        </span>

        <Button
          variant="outline"
          size="icon"
          className="h-14 w-14 rounded-full"
          onClick={() => onSetSeconds(adjustSeconds + 5)}
        >
          <Plus className="h-6 w-6" />
        </Button>
      </div>

      {entry.mode === 'time' && (
        <p className="text-xs text-muted-foreground">
          Target: {entry.targetSeconds}s
        </p>
      )}

      {notesSection}

      <Button size="lg" className="text-lg px-12 mt-4" onClick={onConfirm}>
        <Check className="h-5 w-5 mr-2" />
        Confirm
      </Button>
    </div>
  )
}
