import { useMemo, useState } from 'react'
import { Dialog, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { MealLabelPicker } from '@/components/nutrition/MealLabelPicker'
import { SearchUsdaFoodForm } from '@/components/nutrition/SearchUsdaFoodForm'
import { BarcodeScanForm } from '@/components/nutrition/BarcodeScanForm'
import { RecentFoodsQuickPick } from '@/components/nutrition/RecentFoodsQuickPick'
import { Card } from '@/components/ui/card'
import { useCustomFoods, useCreateCustomFood } from '@/hooks/useCustomFoods'
import { useAddFoodLog } from '@/hooks/useFoodLog'
import { Check } from 'lucide-react'
import { useMeals, useLogMeal } from '@/hooks/useMeals'
import type { CustomFood, MealLabel } from '@/models/types'

// Three logging paths, tabbed:
//  - Quick add: freeform name + macros, source: 'quickadd'
//  - From custom foods: search saved foods, scale by grams or servings,
//    source: 'custom' with refId pointing back to the CustomFood.
//  - Search foods: search the bundled offline USDA database, scale by
//    grams, source: 'usda' with refId pointing back to the fdcId.
export function AddFoodDialog({
  open,
  onClose,
  date,
}: {
  open: boolean
  onClose: () => void
  date: number
}) {
  const [tab, setTab] = useState<'quick' | 'pick' | 'search' | 'scan' | 'meals'>('quick')
  const [mealLabel, setMealLabel] = useState<MealLabel | undefined>(undefined)

  const handleClose = () => {
    setTab('quick')
    setMealLabel(undefined)
    onClose()
  }

  return (
    <Dialog open={open} onClose={handleClose}>
      <DialogTitle>Add food</DialogTitle>
      <RecentFoodsQuickPick date={date} mealLabel={mealLabel} onDone={handleClose} />
      <Tabs value={tab} onChange={(v) => setTab(v as 'quick' | 'pick' | 'search' | 'scan' | 'meals')}>
        <TabsList>
          <TabsTrigger value="quick">Quick add</TabsTrigger>
          <TabsTrigger value="pick">From custom foods</TabsTrigger>
          <TabsTrigger value="search">Search foods</TabsTrigger>
          <TabsTrigger value="scan">Scan</TabsTrigger>
          <TabsTrigger value="meals">Meals</TabsTrigger>
        </TabsList>
        <TabsContent value="quick">
          <QuickAddForm date={date} mealLabel={mealLabel} setMealLabel={setMealLabel} onDone={handleClose} />
        </TabsContent>
        <TabsContent value="pick">
          <PickCustomFoodForm date={date} mealLabel={mealLabel} setMealLabel={setMealLabel} onDone={handleClose} />
        </TabsContent>
        <TabsContent value="search">
          <SearchUsdaFoodForm date={date} mealLabel={mealLabel} setMealLabel={setMealLabel} onDone={handleClose} />
        </TabsContent>
        <TabsContent value="scan">
          <BarcodeScanForm date={date} mealLabel={mealLabel} setMealLabel={setMealLabel} onDone={handleClose} />
        </TabsContent>
        <TabsContent value="meals">
          <LogMealForm date={date} mealLabel={mealLabel} setMealLabel={setMealLabel} onDone={handleClose} />
        </TabsContent>
      </Tabs>
    </Dialog>
  )
}

// Logs a whole meal in one tap: expands the chosen meal into one FoodLog per
// ingredient. The AddFoodDialog's meal-label override (if set) wins; otherwise
// the meal's own default label is used.
function LogMealForm({
  date,
  mealLabel,
  setMealLabel,
  onDone,
}: {
  date: number
  mealLabel: MealLabel | undefined
  setMealLabel: (v: MealLabel | undefined) => void
  onDone: () => void
}) {
  const { data: meals } = useMeals()
  const logMeal = useLogMeal()

  const log = async (mealId: string) => {
    await logMeal.mutateAsync({ mealId, date, mealLabel })
    onDone()
  }

  return (
    <div className="space-y-3 mt-3">
      <MealLabelPicker value={mealLabel} onChange={setMealLabel} />
      <p className="text-[11px] text-muted-foreground">
        Tap a meal to log all its ingredients at once. Leave the label unset to use each meal's own default.
      </p>
      <div className="space-y-2 max-h-72 overflow-y-auto">
        {(!meals || meals.length === 0) && (
          <p className="text-xs text-muted-foreground py-4 text-center">
            No meals yet. Build one from the Meals screen.
          </p>
        )}
        {(meals ?? []).map((meal) => {
          const total = meal.items.reduce((a, it) => a + it.kcal, 0)
          return (
            <Card key={meal.id} className="p-0">
              <button
                type="button"
                disabled={logMeal.isPending || meal.items.length === 0}
                onClick={() => log(meal.id)}
                className="w-full text-left p-3 disabled:opacity-50"
              >
                <p className="text-sm font-medium">{meal.name}</p>
                <p className="text-xs text-muted-foreground">
                  {meal.items.length} item{meal.items.length === 1 ? '' : 's'} · {Math.round(total)} kcal
                </p>
              </button>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

function QuickAddForm({
  date,
  mealLabel,
  setMealLabel,
  onDone,
}: {
  date: number
  mealLabel: MealLabel | undefined
  setMealLabel: (v: MealLabel | undefined) => void
  onDone: () => void
}) {
  const addFoodLog = useAddFoodLog()
  const createCustomFood = useCreateCustomFood()
  const { data: customFoods } = useCustomFoods()
  const [name, setName] = useState('')
  const [kcal, setKcal] = useState('')
  const [proteinG, setProteinG] = useState('')
  const [carbG, setCarbG] = useState('')
  const [fatG, setFatG] = useState('')
  const [fiberG, setFiberG] = useState('')
  const [sodiumMg, setSodiumMg] = useState('')
  const [notes, setNotes] = useState('')
  const [saveToLibrary, setSaveToLibrary] = useState(false)

  const valid = name.trim().length > 0 && Number.isFinite(Number(kcal)) && kcal !== ''

  // A quick add has no captured quantity — its macros are the portion eaten —
  // so a library copy is stored as a one-serving custom food. Name match
  // (case-insensitive) stops the same food being saved twice.
  const inLibrary = useMemo(() => {
    const n = name.trim().toLowerCase()
    if (!n) return false
    return (customFoods ?? []).some((f) => f.name.trim().toLowerCase() === n)
  }, [customFoods, name])

  const submit = async () => {
    if (!valid) return
    if (saveToLibrary && !inLibrary) {
      await createCustomFood.mutateAsync({
        name: name.trim(),
        per: 'perServing',
        kcal: Number(kcal) || 0,
        proteinG: Number(proteinG) || 0,
        carbG: Number(carbG) || 0,
        fatG: Number(fatG) || 0,
        fiberG: Number(fiberG) || 0,
        sodiumMg: sodiumMg !== '' ? Number(sodiumMg) : undefined,
      })
    }
    await addFoodLog.mutateAsync({
      date,
      mealLabel,
      source: 'quickadd',
      name: name.trim(),
      kcal: Number(kcal) || 0,
      proteinG: Number(proteinG) || 0,
      carbG: Number(carbG) || 0,
      fatG: Number(fatG) || 0,
      fiberG: Number(fiberG) || 0,
      sodiumMg: sodiumMg !== '' ? Number(sodiumMg) : undefined,
      notes: notes.trim() || undefined,
    })
    onDone()
  }

  return (
    <div className="space-y-3 mt-3">
      <Input placeholder="Food name" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
      <div className="grid grid-cols-2 gap-2">
        <LabeledNumberInput label="Calories" value={kcal} onChange={setKcal} />
        <LabeledNumberInput label="Protein (g)" value={proteinG} onChange={setProteinG} />
        <LabeledNumberInput label="Carbs (g)" value={carbG} onChange={setCarbG} />
        <LabeledNumberInput label="Fat (g)" value={fatG} onChange={setFatG} />
        <LabeledNumberInput label="Fiber (g)" value={fiberG} onChange={setFiberG} />
        <LabeledNumberInput label="Sodium (mg, optional)" value={sodiumMg} onChange={setSodiumMg} />
      </div>
      <MealLabelPicker value={mealLabel} onChange={setMealLabel} />
      <Textarea placeholder="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} />
      {inLibrary ? (
        <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Check className="h-3.5 w-3.5" /> Already in your food library
        </p>
      ) : (
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={saveToLibrary}
            onChange={(e) => setSaveToLibrary(e.target.checked)}
          />
          Save to my food library (log it in one tap next time)
        </label>
      )}
      <Button className="w-full" onClick={submit} disabled={!valid || addFoodLog.isPending}>
        Add food
      </Button>
    </div>
  )
}

function PickCustomFoodForm({
  date,
  mealLabel,
  setMealLabel,
  onDone,
}: {
  date: number
  mealLabel: MealLabel | undefined
  setMealLabel: (v: MealLabel | undefined) => void
  onDone: () => void
}) {
  const { data: foods } = useCustomFoods()
  const addFoodLog = useAddFoodLog()
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<CustomFood | null>(null)
  const [amount, setAmount] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return foods ?? []
    return (foods ?? []).filter(
      (f) => f.name.toLowerCase().includes(q) || f.brand?.toLowerCase().includes(q)
    )
  }, [foods, query])

  const scale = useMemo(() => {
    if (!selected) return 0
    const n = Number(amount)
    if (!Number.isFinite(n) || n <= 0) return 0
    return selected.per === 'per100g' ? n / 100 : n
  }, [selected, amount])

  const preview = selected
    ? {
        kcal: selected.kcal * scale,
        proteinG: selected.proteinG * scale,
        carbG: selected.carbG * scale,
        fatG: selected.fatG * scale,
        fiberG: selected.fiberG * scale,
        sodiumMg: selected.sodiumMg != null ? selected.sodiumMg * scale : undefined,
      }
    : null

  const valid = !!selected && scale > 0

  const submit = async () => {
    if (!valid || !selected) return
    const quantityG = selected.per === 'per100g' ? Number(amount) : undefined
    const servings = selected.per === 'perServing' ? Number(amount) : undefined
    await addFoodLog.mutateAsync({
      date,
      mealLabel,
      source: 'custom',
      refId: selected.id,
      name: selected.name,
      quantityG,
      servings,
      kcal: preview!.kcal,
      proteinG: preview!.proteinG,
      carbG: preview!.carbG,
      fatG: preview!.fatG,
      fiberG: preview!.fiberG,
      sodiumMg: preview!.sodiumMg,
    })
    onDone()
  }

  return (
    <div className="space-y-3 mt-3">
      {!selected ? (
        <>
          <Input
            placeholder="Search custom foods…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          <div className="space-y-1.5 max-h-64 overflow-y-auto">
            {filtered.length === 0 && (
              <p className="text-xs text-muted-foreground py-4 text-center">
                No custom foods match. Create one from the Custom Foods screen.
              </p>
            )}
            {filtered.map((food) => (
              <button
                key={food.id}
                type="button"
                onClick={() => {
                  setSelected(food)
                  setAmount(food.per === 'per100g' ? '100' : '1')
                }}
                className="w-full text-left p-2.5 rounded-lg border border-input hover:bg-accent transition-colors"
              >
                <p className="text-sm font-medium">{food.name}</p>
                <p className="text-xs text-muted-foreground">
                  {food.brand ? `${food.brand} · ` : ''}
                  {food.kcal} kcal {food.per === 'per100g' ? 'per 100g' : 'per serving'}
                </p>
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">{selected.name}</p>
            <button
              type="button"
              className="text-xs text-muted-foreground underline"
              onClick={() => setSelected(null)}
            >
              Change
            </button>
          </div>
          <LabeledNumberInput
            label={selected.per === 'per100g' ? 'Grams' : 'Servings'}
            value={amount}
            onChange={setAmount}
          />
          {preview && (
            <p className="text-xs text-muted-foreground tabular-nums">
              {Math.round(preview.kcal)} kcal · P{Math.round(preview.proteinG)} · C
              {Math.round(preview.carbG)} · F{Math.round(preview.fatG)} · Fiber{' '}
              {Math.round(preview.fiberG)}
            </p>
          )}
          <MealLabelPicker value={mealLabel} onChange={setMealLabel} />
          <Button className="w-full" onClick={submit} disabled={!valid || addFoodLog.isPending}>
            Add food
          </Button>
        </>
      )}
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
