import { useState } from 'react'
import { useRecentFoods, useAddFoodLog } from '@/hooks/useFoodLog'
import type { MealLabel } from '@/models/types'

// One-tap re-log of a recently-logged food: taps its most-recent portion +
// macros straight through the existing add path, using whatever meal label is
// currently selected in the dialog. Renders nothing while recents are loading
// or empty so it never pushes the rest of the dialog around when there's
// nothing to show.
export function RecentFoodsQuickPick({
  date,
  mealLabel,
  onDone,
}: {
  date: number
  mealLabel: MealLabel | undefined
  onDone: () => void
}) {
  const { data: recents } = useRecentFoods(12)
  const addFoodLog = useAddFoodLog()
  const [loggingKey, setLoggingKey] = useState<string | null>(null)

  if (!recents || recents.length === 0) return null

  const logFood = async (food: (typeof recents)[number]) => {
    if (loggingKey) return
    setLoggingKey(food.key)
    try {
      await addFoodLog.mutateAsync({
        date,
        mealLabel,
        source: food.source,
        refId: food.refId,
        name: food.name,
        quantityG: food.quantityG,
        servings: food.servings,
        kcal: food.kcal,
        proteinG: food.proteinG,
        carbG: food.carbG,
        fatG: food.fatG,
        fiberG: food.fiberG,
        sodiumMg: food.sodiumMg,
      })
      onDone()
    } finally {
      setLoggingKey(null)
    }
  }

  return (
    <div className="space-y-1.5 mt-3">
      <span className="text-xs text-muted-foreground">Recent</span>
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-0.5 px-0.5">
        {recents.map((food) => (
          <button
            key={food.key}
            type="button"
            onClick={() => logFood(food)}
            disabled={loggingKey !== null}
            className="shrink-0 text-left p-2.5 rounded-lg border border-input hover:bg-accent transition-colors disabled:opacity-50 min-w-[8rem] max-w-[10rem]"
          >
            <p className="text-sm font-medium truncate">{food.name}</p>
            <p className="text-xs text-muted-foreground tabular-nums">{Math.round(food.kcal)} kcal</p>
          </button>
        ))}
      </div>
    </div>
  )
}
