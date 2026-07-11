import { FoodLogRow } from '@/components/nutrition/FoodLogRow'
import { MEAL_TITLES } from '@/lib/nutrition'
import type { FoodLog, MealLabel } from '@/models/types'

export function MealSection({
  meal,
  logs,
  onEdit,
  onDelete,
}: {
  meal: MealLabel | 'unlabeled'
  logs: FoodLog[]
  onEdit: (log: FoodLog) => void
  onDelete: (log: FoodLog) => void
}) {
  if (logs.length === 0) return null

  const kcal = logs.reduce((sum, l) => sum + l.kcal, 0)

  return (
    <section>
      <div className="flex items-baseline justify-between mb-2">
        <h3 className="text-sm font-semibold">{MEAL_TITLES[meal]}</h3>
        <span className="text-xs text-muted-foreground tabular-nums">{Math.round(kcal)} kcal</span>
      </div>
      <div className="space-y-2">
        {logs.map((log) => (
          <FoodLogRow key={log.id} log={log} onEdit={() => onEdit(log)} onDelete={() => onDelete(log)} />
        ))}
      </div>
    </section>
  )
}
