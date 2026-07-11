import { useMemo, useState } from 'react'
import { Dialog, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { useConfirm } from '@/components/ui/confirm-context'
import { ArrowLeft, Pencil, Plus, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCustomFoods, useCreateCustomFood, useUpdateCustomFood, useDeleteCustomFood } from '@/hooks/useCustomFoods'
import type { CustomFood } from '@/models/types'

// Manage the custom-foods library: search/list, create, edit, delete. Reused
// by AddFoodDialog's "pick" tab as the source list.
export function CustomFoodsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data: foods } = useCustomFoods()
  const deleteFood = useDeleteCustomFood()
  const confirm = useConfirm()
  const [query, setQuery] = useState('')
  const [editing, setEditing] = useState<CustomFood | 'new' | null>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = foods ?? []
    if (!q) return list
    return list.filter((f) => f.name.toLowerCase().includes(q) || f.brand?.toLowerCase().includes(q))
  }, [foods, query])

  const handleClose = () => {
    setEditing(null)
    setQuery('')
    onClose()
  }

  const handleDelete = async (food: CustomFood) => {
    if (
      await confirm({
        title: 'Delete this food?',
        description: `Remove "${food.name}" from your custom foods? This can't be undone.`,
        confirmLabel: 'Delete',
        destructive: true,
      })
    ) {
      deleteFood.mutate(food.id)
    }
  }

  if (editing) {
    return (
      <Dialog open={open} onClose={handleClose}>
        <div className="flex items-center gap-2 -mt-1 mb-2">
          <button
            onClick={() => setEditing(null)}
            className="p-1 -ml-1 rounded-md text-muted-foreground hover:text-foreground"
            aria-label="Back"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <DialogTitle className="mb-0">{editing === 'new' ? 'New custom food' : 'Edit food'}</DialogTitle>
        </div>
        <CustomFoodForm
          food={editing === 'new' ? undefined : editing}
          onDone={() => setEditing(null)}
        />
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onClose={handleClose}>
      <DialogTitle>Custom foods</DialogTitle>
      <div className="space-y-3">
        <Input placeholder="Search…" value={query} onChange={(e) => setQuery(e.target.value)} />
        <Button variant="secondary" className="w-full" onClick={() => setEditing('new')}>
          <Plus className="h-4 w-4 mr-1" /> New custom food
        </Button>
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {filtered.length === 0 && (
            <p className="text-xs text-muted-foreground py-4 text-center">
              {foods && foods.length > 0 ? 'No foods match your search.' : 'No custom foods yet.'}
            </p>
          )}
          {filtered.map((food) => (
            <Card key={food.id} className="p-3">
              <div className="flex items-center gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{food.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {food.brand ? `${food.brand} · ` : ''}
                    {food.kcal} kcal, P{food.proteinG}/C{food.carbG}/F{food.fatG}{' '}
                    {food.per === 'per100g' ? 'per 100g' : 'per serving'}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  onClick={() => setEditing(food)}
                  aria-label="Edit food"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => handleDelete(food)}
                  aria-label="Delete food"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </Dialog>
  )
}

function CustomFoodForm({ food, onDone }: { food?: CustomFood; onDone: () => void }) {
  const createFood = useCreateCustomFood()
  const updateFood = useUpdateCustomFood()

  const [name, setName] = useState(food?.name ?? '')
  const [brand, setBrand] = useState(food?.brand ?? '')
  const [per, setPer] = useState<'per100g' | 'perServing'>(food?.per ?? 'per100g')
  const [servingGrams, setServingGrams] = useState(food?.servingGrams != null ? String(food.servingGrams) : '')
  const [kcal, setKcal] = useState(food?.kcal != null ? String(food.kcal) : '')
  const [proteinG, setProteinG] = useState(food?.proteinG != null ? String(food.proteinG) : '')
  const [carbG, setCarbG] = useState(food?.carbG != null ? String(food.carbG) : '')
  const [fatG, setFatG] = useState(food?.fatG != null ? String(food.fatG) : '')
  const [fiberG, setFiberG] = useState(food?.fiberG != null ? String(food.fiberG) : '')
  const [sodiumMg, setSodiumMg] = useState(food?.sodiumMg != null ? String(food.sodiumMg) : '')

  const valid = name.trim().length > 0 && kcal !== '' && Number.isFinite(Number(kcal))

  const submit = async () => {
    if (!valid) return
    const data = {
      name: name.trim(),
      brand: brand.trim() || undefined,
      per,
      servingGrams: per === 'perServing' && servingGrams !== '' ? Number(servingGrams) : undefined,
      kcal: Number(kcal) || 0,
      proteinG: Number(proteinG) || 0,
      carbG: Number(carbG) || 0,
      fatG: Number(fatG) || 0,
      fiberG: Number(fiberG) || 0,
      sodiumMg: sodiumMg !== '' ? Number(sodiumMg) : undefined,
    }
    if (food) {
      await updateFood.mutateAsync({ id: food.id, changes: data })
    } else {
      await createFood.mutateAsync(data)
    }
    onDone()
  }

  return (
    <div className="space-y-3">
      <Input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
      <Input placeholder="Brand (optional)" value={brand} onChange={(e) => setBrand(e.target.value)} />

      <div className="flex gap-1.5">
        {(['per100g', 'perServing'] as const).map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => setPer(opt)}
            className={cn(
              'flex-1 px-3 py-2 rounded-lg text-xs font-medium border transition-colors',
              per === opt
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-transparent border-input text-muted-foreground hover:text-foreground'
            )}
          >
            {opt === 'per100g' ? 'Per 100g' : 'Per serving'}
          </button>
        ))}
      </div>

      {per === 'perServing' && (
        <LabeledNumberInput label="Serving size (g, optional)" value={servingGrams} onChange={setServingGrams} />
      )}

      <div className="grid grid-cols-2 gap-2">
        <LabeledNumberInput label="Calories" value={kcal} onChange={setKcal} />
        <LabeledNumberInput label="Protein (g)" value={proteinG} onChange={setProteinG} />
        <LabeledNumberInput label="Carbs (g)" value={carbG} onChange={setCarbG} />
        <LabeledNumberInput label="Fat (g)" value={fatG} onChange={setFatG} />
        <LabeledNumberInput label="Fiber (g)" value={fiberG} onChange={setFiberG} />
        <LabeledNumberInput label="Sodium (mg, optional)" value={sodiumMg} onChange={setSodiumMg} />
      </div>

      <Button className="w-full" onClick={submit} disabled={!valid || createFood.isPending || updateFood.isPending}>
        {food ? 'Save changes' : 'Create food'}
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
