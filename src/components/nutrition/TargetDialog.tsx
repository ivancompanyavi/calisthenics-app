import { useState } from 'react'
import { Dialog, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useCurrentNutritionTarget, useSetNutritionTarget } from '@/hooks/useNutritionTargets'
import type { NutritionTarget } from '@/models/types'

// Setting a target always inserts a new dated row (never mutates in place —
// see nutritionTargetRepository.setTarget), so "editing" the current target
// really means superseding it with a new one effective today.
export function TargetDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data: current, isLoading } = useCurrentNutritionTarget()

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{current ? 'Update target' : 'Set target'}</DialogTitle>
      {/* Gated on `open` so the form mounts fresh (and re-primes from
          `current`) each time the dialog opens, instead of syncing via an
          effect. isLoading guards the brief window before the query
          resolves so we don't prime from a stale `undefined`. */}
      {open && !isLoading && <TargetDialogForm current={current} onClose={onClose} />}
    </Dialog>
  )
}

function TargetDialogForm({
  current,
  onClose,
}: {
  current: NutritionTarget | undefined
  onClose: () => void
}) {
  const setTarget = useSetNutritionTarget()

  const [kcal, setKcal] = useState(current ? String(current.kcal) : '')
  const [proteinG, setProteinG] = useState(current ? String(current.proteinG) : '')
  const [carbG, setCarbG] = useState(current?.carbG != null ? String(current.carbG) : '')
  const [fatG, setFatG] = useState(current?.fatG != null ? String(current.fatG) : '')
  const [fiberG, setFiberG] = useState(current?.fiberG != null ? String(current.fiberG) : '')
  const [notes, setNotes] = useState(current?.notes ?? '')

  const valid =
    kcal !== '' && Number.isFinite(Number(kcal)) && proteinG !== '' && Number.isFinite(Number(proteinG))

  const submit = async () => {
    if (!valid) return
    await setTarget.mutateAsync({
      effectiveDate: Date.now(),
      kcal: Number(kcal),
      proteinG: Number(proteinG),
      carbG: carbG !== '' ? Number(carbG) : undefined,
      fatG: fatG !== '' ? Number(fatG) : undefined,
      fiberG: fiberG !== '' ? Number(fiberG) : undefined,
      setBy: 'user',
      notes: notes.trim() || undefined,
    })
    onClose()
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <LabeledNumberInput label="Calories" value={kcal} onChange={setKcal} required />
        <LabeledNumberInput label="Protein (g)" value={proteinG} onChange={setProteinG} required />
        <LabeledNumberInput label="Carbs (g, optional)" value={carbG} onChange={setCarbG} />
        <LabeledNumberInput label="Fat (g, optional)" value={fatG} onChange={setFatG} />
        <LabeledNumberInput label="Fiber (g, optional)" value={fiberG} onChange={setFiberG} />
      </div>
      <Input placeholder="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} />
      <Button className="w-full" onClick={submit} disabled={!valid || setTarget.isPending}>
        {current ? 'Save new target' : 'Set target'}
      </Button>
    </div>
  )
}

function LabeledNumberInput({
  label,
  value,
  onChange,
  required,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  required?: boolean
}) {
  return (
    <label className="block">
      <span className="text-xs text-muted-foreground mb-1 block">
        {label}
        {required && ' *'}
      </span>
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
