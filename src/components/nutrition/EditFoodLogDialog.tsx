import { useState } from 'react'
import { Dialog, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { MealLabelPicker } from '@/components/nutrition/MealLabelPicker'
import { useUpdateFoodLog } from '@/hooks/useFoodLog'
import type { FoodLog, MealLabel } from '@/models/types'

// Editing an existing entry — works for both quickadd and custom-food-sourced
// logs, since FoodLog denormalizes its macros regardless of source.
export function EditFoodLogDialog({
  log,
  onClose,
}: {
  log: FoodLog | null
  onClose: () => void
}) {
  return (
    <Dialog open={!!log} onClose={onClose}>
      {log && (
        <>
          <DialogTitle>Edit entry</DialogTitle>
          {/* Keyed by log.id so the form remounts with fresh initial state
              per entry instead of syncing via an effect. */}
          <EditFoodLogForm key={log.id} log={log} onClose={onClose} />
        </>
      )}
    </Dialog>
  )
}

function EditFoodLogForm({ log, onClose }: { log: FoodLog; onClose: () => void }) {
  const updateFoodLog = useUpdateFoodLog()
  const [name, setName] = useState(log.name)
  const [kcal, setKcal] = useState(String(log.kcal))
  const [proteinG, setProteinG] = useState(String(log.proteinG))
  const [carbG, setCarbG] = useState(String(log.carbG))
  const [fatG, setFatG] = useState(String(log.fatG))
  const [fiberG, setFiberG] = useState(String(log.fiberG))
  const [notes, setNotes] = useState(log.notes ?? '')
  const [mealLabel, setMealLabel] = useState<MealLabel | undefined>(log.mealLabel)

  const valid = name.trim().length > 0 && kcal !== '' && Number.isFinite(Number(kcal))

  const submit = async () => {
    if (!valid) return
    await updateFoodLog.mutateAsync({
      id: log.id,
      changes: {
        name: name.trim(),
        kcal: Number(kcal) || 0,
        proteinG: Number(proteinG) || 0,
        carbG: Number(carbG) || 0,
        fatG: Number(fatG) || 0,
        fiberG: Number(fiberG) || 0,
        notes: notes.trim() || undefined,
        mealLabel,
      },
    })
    onClose()
  }

  return (
    <div className="space-y-3">
      <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Food name" />
      <div className="grid grid-cols-2 gap-2">
        <LabeledNumberInput label="Calories" value={kcal} onChange={setKcal} />
        <LabeledNumberInput label="Protein (g)" value={proteinG} onChange={setProteinG} />
        <LabeledNumberInput label="Carbs (g)" value={carbG} onChange={setCarbG} />
        <LabeledNumberInput label="Fat (g)" value={fatG} onChange={setFatG} />
        <LabeledNumberInput label="Fiber (g)" value={fiberG} onChange={setFiberG} />
      </div>
      <MealLabelPicker value={mealLabel} onChange={setMealLabel} />
      <Textarea placeholder="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} />
      <Button className="w-full" onClick={submit} disabled={!valid || updateFoodLog.isPending}>
        Save changes
      </Button>
    </div>
  )
}

function LabeledNumberInput({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <label className="block">
      <span className="text-xs text-muted-foreground mb-1 block">{label}</span>
      <Input
        type="number"
        inputMode="decimal"
        step="0.1"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  )
}
