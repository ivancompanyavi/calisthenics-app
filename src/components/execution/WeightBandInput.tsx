import { useState } from 'react'
import type { ResolvedEntry } from '@/hooks/useWorkoutExecution'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { Minus, Plus } from 'lucide-react'
import type { WeightUnit } from '@/models/types'
import { fromKg, toKg } from '@/lib/units'

const BAND_LEVEL_OPTIONS = [1, 2, 3, 4, 5]

interface WeightBandInputProps {
  entry: ResolvedEntry
  weightKg?: number
  bandLevel?: number
  unit: WeightUnit
  onWeightKg: (v: number | undefined) => void
  onBandLevel: (v: number | undefined) => void
}

// Renders weight and/or band-level controls when the entry carries a prescription.
// Internal state stays in kg; visible values convert via the user's unit preference.
export function WeightBandInput({ entry, weightKg, bandLevel, unit, onWeightKg, onBandLevel }: WeightBandInputProps) {
  const showWeight = entry.targetWeightKg != null
  const showBand = entry.targetBandLevel != null

  const displayWeight = weightKg != null ? fromKg(weightKg, unit) : 0
  const weightStep = unit === 'lb' ? 5 : 2.5
  const [editingWeight, setEditingWeight] = useState(false)
  const [weightDraft, setWeightDraft] = useState('')

  const bumpWeight = (delta: number) => {
    const next = Math.max(0, displayWeight + delta)
    onWeightKg(next === 0 ? 0 : toKg(next, unit))
  }
  const commitWeightDraft = () => {
    const num = parseFloat(weightDraft)
    if (Number.isFinite(num) && num >= 0) {
      onWeightKg(num === 0 ? 0 : toKg(num, unit))
    }
    setEditingWeight(false)
  }

  return (
    <>
      {showWeight && (
        <div className="w-full max-w-xs">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 text-center">
            Weight
          </p>
          <div className="flex items-center justify-center gap-3">
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 rounded-full"
              onClick={() => bumpWeight(-weightStep)}
            >
              <Minus className="h-4 w-4" />
            </Button>
            {editingWeight ? (
              <Input
                type="number"
                inputMode="decimal"
                step="0.1"
                min={0}
                value={weightDraft}
                onChange={(e) => setWeightDraft(e.target.value)}
                onBlur={commitWeightDraft}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commitWeightDraft()
                  if (e.key === 'Escape') setEditingWeight(false)
                }}
                autoFocus
                className="w-28 h-10 text-center text-2xl font-bold font-mono tabular-nums"
              />
            ) : (
              <button
                type="button"
                onClick={() => {
                  setWeightDraft(String(displayWeight))
                  setEditingWeight(true)
                }}
                className="text-2xl font-bold font-mono tabular-nums min-w-[5rem] text-center hover:opacity-70 transition-opacity"
                aria-label="Edit weight value"
              >
                {displayWeight} <span className="text-sm text-muted-foreground">{unit}</span>
              </button>
            )}
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 rounded-full"
              onClick={() => bumpWeight(weightStep)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {showBand && (
        <div className="w-full max-w-xs">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 text-center">
            Band level
          </p>
          <div className="flex justify-center gap-1.5">
            {BAND_LEVEL_OPTIONS.map((value) => {
              const active = bandLevel === value
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => onBandLevel(active ? undefined : value)}
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
      )}
    </>
  )
}
