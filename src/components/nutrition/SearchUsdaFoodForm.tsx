import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MealLabelPicker } from '@/components/nutrition/MealLabelPicker'
import { useAddFoodLog } from '@/hooks/useFoodLog'
import { searchFoods, type UsdaFood } from '@/lib/food-db'
import type { MealLabel } from '@/models/types'

const DEBOUNCE_MS = 250

// Third logging path: search the bundled offline USDA database, pick a food,
// choose a quantity in grams, and log it with source: 'usda'. Macros are
// scaled from the per-100g asset values and denormalized onto the FoodLog,
// same as the custom-food and quick-add paths.
export function SearchUsdaFoodForm({
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
  const [query, setQuery] = useState('')
  // Track which query the current `results` were computed for, so
  // "searching" can be derived (trimmedQuery !== resultsQuery) instead of
  // requiring a setState call at the start of the debounced effect.
  const [results, setResults] = useState<{ query: string; foods: UsdaFood[] }>({
    query: '',
    foods: [],
  })
  const [selected, setSelected] = useState<UsdaFood | null>(null)
  const [grams, setGrams] = useState('100')

  const trimmedQuery = query.trim()

  useEffect(() => {
    if (!trimmedQuery) return
    let cancelled = false
    const timer = setTimeout(() => {
      searchFoods(trimmedQuery).then((foods) => {
        if (!cancelled) setResults({ query: trimmedQuery, foods })
      })
    }, DEBOUNCE_MS)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [trimmedQuery])

  const isSearching = trimmedQuery !== '' && results.query !== trimmedQuery
  const displayedResults = trimmedQuery && results.query === trimmedQuery ? results.foods : []

  const g = Number(grams)
  const scale = Number.isFinite(g) && g > 0 ? g / 100 : 0

  const round1 = (n: number) => Math.round(n * 10) / 10

  const preview = selected
    ? {
        kcal: round1(selected.kcal * scale),
        proteinG: round1(selected.proteinG * scale),
        carbG: round1(selected.carbG * scale),
        fatG: round1(selected.fatG * scale),
        fiberG: round1(selected.fiberG * scale),
        sodiumMg: selected.sodiumMg != null ? round1(selected.sodiumMg * scale) : undefined,
      }
    : null

  const valid = !!selected && scale > 0

  const submit = async () => {
    if (!valid || !selected || !preview) return
    await addFoodLog.mutateAsync({
      date,
      mealLabel,
      source: 'usda',
      refId: selected.id,
      name: selected.name,
      quantityG: g,
      kcal: preview.kcal,
      proteinG: preview.proteinG,
      carbG: preview.carbG,
      fatG: preview.fatG,
      fiberG: preview.fiberG,
      sodiumMg: preview.sodiumMg,
    })
    onDone()
  }

  return (
    <div className="space-y-3 mt-3">
      {!selected ? (
        <>
          <Input
            placeholder="Search foods (e.g. chicken breast)…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          <div className="space-y-1.5 max-h-64 overflow-y-auto">
            {isSearching && <p className="text-xs text-muted-foreground py-4 text-center">Searching…</p>}
            {!isSearching && trimmedQuery && displayedResults.length === 0 && (
              <p className="text-xs text-muted-foreground py-4 text-center">
                No foods match “{trimmedQuery}”.
              </p>
            )}
            {!isSearching &&
              displayedResults.map((food) => (
                <button
                  key={food.id}
                  type="button"
                  onClick={() => {
                    setSelected(food)
                    setGrams('100')
                  }}
                  className="w-full text-left p-2.5 rounded-lg border border-input hover:bg-accent transition-colors"
                >
                  <p className="text-sm font-medium">{food.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {food.kcal} kcal · {food.proteinG}g protein per 100g
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
          <label className="block">
            <span className="text-xs text-muted-foreground mb-1 block">Grams</span>
            <Input
              type="number"
              inputMode="decimal"
              step="1"
              value={grams}
              onChange={(e) => setGrams(e.target.value)}
            />
          </label>
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
