import { useState } from 'react'
import type { ResolvedEntry } from '@/hooks/useWorkoutExecution'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Minus, Plus, Check } from 'lucide-react'
import { useWeightUnit } from '@/hooks/useSettings'
import { EffortChipRow } from './EffortChipRow'
import { WeightBandInput } from './WeightBandInput'
import { AdjustNotesField } from './AdjustNotesField'

interface AdjustScreenProps {
  entry: ResolvedEntry
  adjustReps: number
  adjustSeconds: number
  adjustNotes: string
  adjustRir?: number
  adjustSir?: 0 | 1 | 2
  adjustWeightKg?: number
  adjustBandLevel?: number
  isLastRound: boolean
  onSetReps: (v: number) => void
  onSetSeconds: (v: number) => void
  onSetNotes: (v: string) => void
  onSetRir: (v: number | undefined) => void
  onSetSir: (v: 0 | 1 | 2 | undefined) => void
  onSetWeightKg: (v: number | undefined) => void
  onSetBandLevel: (v: number | undefined) => void
  onConfirm: () => void
}

const RIR_OPTIONS = [
  { value: 0, label: '0' },
  { value: 1, label: '1' },
  { value: 2, label: '2' },
  { value: 3, label: '3' },
  { value: 4, label: '4' },
]

const SIR_OPTIONS = [
  { value: 0, label: '0' },
  { value: 1, label: '~5s' },
  { value: 2, label: '10s+' },
]

export function AdjustScreen({
  entry, adjustReps, adjustSeconds, adjustNotes,
  adjustRir, adjustSir, adjustWeightKg, adjustBandLevel,
  isLastRound,
  onSetReps, onSetSeconds, onSetNotes, onSetRir, onSetSir,
  onSetWeightKg, onSetBandLevel, onConfirm,
}: AdjustScreenProps) {
  const sideLabel = entry.perSide ? ' /side' : ''
  const unit = useWeightUnit()

  // RIR is a reps concept; SIR is a hold concept, shown only on the final set.
  const showRir = entry.mode === 'reps'
  const showSir = (entry.mode === 'time' || entry.mode === 'max') && isLastRound

  // Tap-to-edit state for the seconds display (max / time mode adjust).
  const [editingSeconds, setEditingSeconds] = useState(false)
  const [secondsDraft, setSecondsDraft] = useState('')
  const commitSecondsDraft = () => {
    const num = parseInt(secondsDraft, 10)
    if (Number.isFinite(num) && num >= 0) onSetSeconds(num)
    setEditingSeconds(false)
  }

  if (entry.mode === 'reps') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-6 gap-6">
        <h2 className="text-xl font-semibold text-muted-foreground">{entry.movementName}</h2>
        <p className="text-sm text-muted-foreground">How many did you do?{sideLabel && ' (per side)'}</p>

        <div className="flex items-center gap-6">
          <Button variant="outline" size="icon" className="h-14 w-14 rounded-full"
            onClick={() => onSetReps(Math.max(0, adjustReps - 1))}>
            <Minus className="h-6 w-6" />
          </Button>
          <span className="text-6xl font-bold font-mono tabular-nums min-w-[100px] text-center">
            {adjustReps}
          </span>
          <Button variant="outline" size="icon" className="h-14 w-14 rounded-full"
            onClick={() => onSetReps(adjustReps + 1)}>
            <Plus className="h-6 w-6" />
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          Target: {entry.suggestedReps ?? entry.targetReps} reps{sideLabel}
          {entry.suggestedReps != null && entry.suggestedReps !== entry.targetReps && (
            <span className="text-primary ml-1">(↑ from {entry.targetReps})</span>
          )}
        </p>

        <WeightBandInput entry={entry} weightKg={adjustWeightKg} bandLevel={adjustBandLevel}
          unit={unit} onWeightKg={onSetWeightKg} onBandLevel={onSetBandLevel} />
        {showRir && (
          <EffortChipRow label="RIR (reps in reserve)" options={RIR_OPTIONS}
            selected={adjustRir} onSelect={(v) => onSetRir(v)} />
        )}
        <AdjustNotesField notes={adjustNotes} onChange={onSetNotes} />

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
        <Button variant="outline" size="icon" className="h-14 w-14 rounded-full"
          onClick={() => onSetSeconds(Math.max(0, adjustSeconds - 1))}>
          <Minus className="h-6 w-6" />
        </Button>

        {editingSeconds ? (
          <Input
            type="number" inputMode="numeric" step="1" min={0}
            value={secondsDraft}
            onChange={(e) => setSecondsDraft(e.target.value)}
            onBlur={commitSecondsDraft}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitSecondsDraft()
              if (e.key === 'Escape') setEditingSeconds(false)
            }}
            autoFocus
            className="w-32 h-16 text-center text-5xl font-bold font-mono tabular-nums"
          />
        ) : (
          <button
            type="button"
            onClick={() => { setSecondsDraft(String(adjustSeconds)); setEditingSeconds(true) }}
            className="text-5xl font-bold font-mono tabular-nums min-w-[100px] text-center hover:opacity-70 transition-opacity"
            aria-label="Edit hold time"
          >
            {adjustSeconds}s
          </button>
        )}

        <Button variant="outline" size="icon" className="h-14 w-14 rounded-full"
          onClick={() => onSetSeconds(adjustSeconds + 1)}>
          <Plus className="h-6 w-6" />
        </Button>
      </div>

      {entry.mode === 'time' && (
        <p className="text-xs text-muted-foreground">Target: {entry.targetSeconds}s</p>
      )}

      <WeightBandInput entry={entry} weightKg={adjustWeightKg} bandLevel={adjustBandLevel}
        unit={unit} onWeightKg={onSetWeightKg} onBandLevel={onSetBandLevel} />
      {showSir && (
        <EffortChipRow label="SIR (seconds in reserve)" options={SIR_OPTIONS}
          selected={adjustSir} onSelect={(v) => onSetSir(v as 0 | 1 | 2 | undefined)} />
      )}
      <AdjustNotesField notes={adjustNotes} onChange={onSetNotes} />

      <Button size="lg" className="text-lg px-12 mt-4" onClick={onConfirm}>
        <Check className="h-5 w-5 mr-2" />
        Confirm
      </Button>
    </div>
  )
}
