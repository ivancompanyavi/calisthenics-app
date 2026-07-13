import { useMemo, useState } from 'react'
import { Dialog, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { MealLabelPicker } from '@/components/nutrition/MealLabelPicker'
import { useConfirm } from '@/components/ui/confirm-context'
import { ArrowLeft, Pencil, Plus, Trash2, X } from 'lucide-react'
import { useMeals, useCreateMeal, useUpdateMeal, useDeleteMeal } from '@/hooks/useMeals'
import { useCustomFoods } from '@/hooks/useCustomFoods'
import type { Meal, MealItem, MealLabel, CustomFood } from '@/models/types'

// Sum an item list into a totals object (rounded for display).
function mealTotals(items: MealItem[]) {
  return items.reduce(
    (acc, it) => ({
      kcal: acc.kcal + it.kcal,
      proteinG: acc.proteinG + it.proteinG,
      carbG: acc.carbG + it.carbG,
      fatG: acc.fatG + it.fatG,
      fiberG: acc.fiberG + it.fiberG,
    }),
    { kcal: 0, proteinG: 0, carbG: 0, fatG: 0, fiberG: 0 },
  )
}

// Manage meal templates: a meal is a named set of snapshotted ingredients that
// logs as one FoodLog per item. Reused as the source list by AddFoodDialog's
// "Meals" tab.
export function MealsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data: meals } = useMeals()
  const deleteMeal = useDeleteMeal()
  const confirm = useConfirm()
  const [query, setQuery] = useState('')
  const [editing, setEditing] = useState<Meal | 'new' | null>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = meals ?? []
    if (!q) return list
    return list.filter((m) => m.name.toLowerCase().includes(q))
  }, [meals, query])

  const handleClose = () => {
    setEditing(null)
    setQuery('')
    onClose()
  }

  const handleDelete = async (meal: Meal) => {
    if (
      await confirm({
        title: 'Delete this meal?',
        description: `Remove "${meal.name}"? Food already logged from it is not affected.`,
        confirmLabel: 'Delete',
        destructive: true,
      })
    ) {
      deleteMeal.mutate(meal.id)
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
          <DialogTitle className="mb-0">{editing === 'new' ? 'New meal' : 'Edit meal'}</DialogTitle>
        </div>
        <MealForm meal={editing === 'new' ? undefined : editing} onDone={() => setEditing(null)} />
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onClose={handleClose}>
      <DialogTitle>Meals</DialogTitle>
      <div className="space-y-3">
        <Input placeholder="Search…" value={query} onChange={(e) => setQuery(e.target.value)} />
        <Button variant="secondary" className="w-full" onClick={() => setEditing('new')}>
          <Plus className="h-4 w-4 mr-1" /> New meal
        </Button>
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {filtered.length === 0 && (
            <p className="text-xs text-muted-foreground py-4 text-center">
              {meals && meals.length > 0 ? 'No meals match your search.' : 'No meals yet. Build one from your foods.'}
            </p>
          )}
          {filtered.map((meal) => {
            const t = mealTotals(meal.items)
            return (
              <Card key={meal.id} className="p-3">
                <div className="flex items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{meal.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {meal.items.length} item{meal.items.length === 1 ? '' : 's'} · {Math.round(t.kcal)} kcal · P
                      {Math.round(t.proteinG)}/C{Math.round(t.carbG)}/F{Math.round(t.fatG)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    onClick={() => setEditing(meal)}
                    aria-label="Edit meal"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => handleDelete(meal)}
                    aria-label="Delete meal"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>
      </div>
    </Dialog>
  )
}

function MealForm({ meal, onDone }: { meal?: Meal; onDone: () => void }) {
  const createMeal = useCreateMeal()
  const updateMeal = useUpdateMeal()

  const [name, setName] = useState(meal?.name ?? '')
  const [mealLabel, setMealLabel] = useState<MealLabel | undefined>(meal?.mealLabel)
  const [items, setItems] = useState<MealItem[]>(meal?.items ?? [])

  const totals = mealTotals(items)
  const valid = name.trim().length > 0 && items.length > 0

  const submit = async () => {
    if (!valid) return
    const data = { name: name.trim(), mealLabel, items }
    if (meal) {
      await updateMeal.mutateAsync({ id: meal.id, changes: data })
    } else {
      await createMeal.mutateAsync(data)
    }
    onDone()
  }

  return (
    <div className="space-y-3">
      <Input placeholder="Meal name (e.g. Breakfast bowl)" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
      <MealLabelPicker value={mealLabel} onChange={setMealLabel} />

      <div>
        <p className="text-xs font-medium text-muted-foreground mb-1.5">Ingredients</p>
        {items.length === 0 ? (
          <p className="text-xs text-muted-foreground py-2">No ingredients yet — add some below.</p>
        ) : (
          <div className="space-y-1.5">
            {items.map((it, i) => (
              <div key={i} className="flex items-center gap-2 rounded-lg border border-input p-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{it.name}</p>
                  <p className="text-[11px] text-muted-foreground tabular-nums">
                    {it.quantityG != null ? `${it.quantityG}g · ` : it.servings != null ? `${it.servings}×serv · ` : ''}
                    {Math.round(it.kcal)} kcal · P{Math.round(it.proteinG)}/C{Math.round(it.carbG)}/F{Math.round(it.fatG)}
                  </p>
                </div>
                <button
                  type="button"
                  className="p-1 rounded-md text-muted-foreground hover:text-destructive"
                  onClick={() => setItems((prev) => prev.filter((_, idx) => idx !== i))}
                  aria-label="Remove ingredient"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <AddIngredient onAdd={(item) => setItems((prev) => [...prev, item])} />

      {items.length > 0 && (
        <p className="text-xs text-muted-foreground tabular-nums border-t border-border pt-2">
          Total: {Math.round(totals.kcal)} kcal · P{Math.round(totals.proteinG)} · C{Math.round(totals.carbG)} · F
          {Math.round(totals.fatG)} · Fiber {Math.round(totals.fiberG)}
        </p>
      )}

      <Button className="w-full" onClick={submit} disabled={!valid || createMeal.isPending || updateMeal.isPending}>
        {meal ? 'Save meal' : 'Create meal'}
      </Button>
    </div>
  )
}

// Inline ingredient adder — two sources: an existing custom food (scaled), or a
// free quick-add (name + macros). Produces a snapshotted MealItem.
function AddIngredient({ onAdd }: { onAdd: (item: MealItem) => void }) {
  const [tab, setTab] = useState<'pick' | 'quick'>('pick')
  return (
    <div className="rounded-lg border border-dashed border-input p-2.5">
      <Tabs value={tab} onChange={(v) => setTab(v as 'pick' | 'quick')}>
        <TabsList>
          <TabsTrigger value="pick">From foods</TabsTrigger>
          <TabsTrigger value="quick">Quick add</TabsTrigger>
        </TabsList>
        <TabsContent value="pick">
          <PickFoodIngredient onAdd={onAdd} />
        </TabsContent>
        <TabsContent value="quick">
          <QuickAddIngredient onAdd={onAdd} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function PickFoodIngredient({ onAdd }: { onAdd: (item: MealItem) => void }) {
  const { data: foods } = useCustomFoods()
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<CustomFood | null>(null)
  const [amount, setAmount] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return foods ?? []
    return (foods ?? []).filter((f) => f.name.toLowerCase().includes(q) || f.brand?.toLowerCase().includes(q))
  }, [foods, query])

  const scale = useMemo(() => {
    if (!selected) return 0
    const n = Number(amount)
    if (!Number.isFinite(n) || n <= 0) return 0
    return selected.per === 'per100g' ? n / 100 : n
  }, [selected, amount])

  const add = () => {
    if (!selected || scale <= 0) return
    onAdd({
      name: selected.name,
      source: 'custom',
      refId: selected.id,
      quantityG: selected.per === 'per100g' ? Number(amount) : undefined,
      servings: selected.per === 'perServing' ? Number(amount) : undefined,
      kcal: selected.kcal * scale,
      proteinG: selected.proteinG * scale,
      carbG: selected.carbG * scale,
      fatG: selected.fatG * scale,
      fiberG: selected.fiberG * scale,
      sodiumMg: selected.sodiumMg != null ? selected.sodiumMg * scale : undefined,
    })
    setSelected(null)
    setAmount('')
    setQuery('')
  }

  if (selected) {
    return (
      <div className="space-y-2 mt-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">{selected.name}</p>
          <button type="button" className="text-xs text-muted-foreground underline" onClick={() => setSelected(null)}>
            Change
          </button>
        </div>
        <label className="block">
          <span className="text-xs text-muted-foreground mb-1 block">
            {selected.per === 'per100g' ? 'Grams' : 'Servings'}
          </span>
          <Input type="number" inputMode="decimal" step="0.1" value={amount} onChange={(e) => setAmount(e.target.value)} autoFocus />
        </label>
        <Button size="sm" className="w-full" onClick={add} disabled={scale <= 0}>
          <Plus className="h-4 w-4 mr-1" /> Add ingredient
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-2 mt-2">
      <Input placeholder="Search your foods…" value={query} onChange={(e) => setQuery(e.target.value)} />
      <div className="space-y-1 max-h-40 overflow-y-auto">
        {filtered.length === 0 && (
          <p className="text-[11px] text-muted-foreground py-2 text-center">No foods match.</p>
        )}
        {filtered.map((food) => (
          <button
            key={food.id}
            type="button"
            onClick={() => {
              setSelected(food)
              setAmount(food.per === 'per100g' ? '100' : '1')
            }}
            className="w-full text-left p-2 rounded-md border border-input hover:bg-accent transition-colors"
          >
            <p className="text-sm">{food.name}</p>
            <p className="text-[11px] text-muted-foreground">
              {food.kcal} kcal {food.per === 'per100g' ? 'per 100g' : 'per serving'}
            </p>
          </button>
        ))}
      </div>
    </div>
  )
}

function QuickAddIngredient({ onAdd }: { onAdd: (item: MealItem) => void }) {
  const [name, setName] = useState('')
  const [kcal, setKcal] = useState('')
  const [proteinG, setProteinG] = useState('')
  const [carbG, setCarbG] = useState('')
  const [fatG, setFatG] = useState('')
  const [fiberG, setFiberG] = useState('')

  const valid = name.trim().length > 0 && kcal !== '' && Number.isFinite(Number(kcal))

  const add = () => {
    if (!valid) return
    onAdd({
      name: name.trim(),
      source: 'quickadd',
      kcal: Number(kcal) || 0,
      proteinG: Number(proteinG) || 0,
      carbG: Number(carbG) || 0,
      fatG: Number(fatG) || 0,
      fiberG: Number(fiberG) || 0,
    })
    setName('')
    setKcal('')
    setProteinG('')
    setCarbG('')
    setFatG('')
    setFiberG('')
  }

  return (
    <div className="space-y-2 mt-2">
      <Input placeholder="Ingredient name" value={name} onChange={(e) => setName(e.target.value)} />
      <div className="grid grid-cols-2 gap-2">
        <SmallNumber label="Calories" value={kcal} onChange={setKcal} />
        <SmallNumber label="Protein (g)" value={proteinG} onChange={setProteinG} />
        <SmallNumber label="Carbs (g)" value={carbG} onChange={setCarbG} />
        <SmallNumber label="Fat (g)" value={fatG} onChange={setFatG} />
        <SmallNumber label="Fiber (g)" value={fiberG} onChange={setFiberG} />
      </div>
      <Button size="sm" className="w-full" onClick={add} disabled={!valid}>
        <Plus className="h-4 w-4 mr-1" /> Add ingredient
      </Button>
    </div>
  )
}

function SmallNumber({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="text-[11px] text-muted-foreground mb-1 block">{label}</span>
      <Input type="number" inputMode="decimal" step="0.1" value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  )
}
