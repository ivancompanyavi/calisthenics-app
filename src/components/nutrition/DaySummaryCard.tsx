import { Card } from '@/components/ui/card'
import { NutrientBar } from '@/components/nutrition/NutrientBar'
import type { NutritionTarget } from '@/models/types'
import type { DayTotals } from '@/repositories'

export function DaySummaryCard({
  totals,
  target,
}: {
  totals: DayTotals | undefined
  target: NutritionTarget | undefined
}) {
  const t = totals ?? { kcal: 0, proteinG: 0, carbG: 0, fatG: 0, fiberG: 0 }

  return (
    <Card className="p-4 space-y-3">
      <NutrientBar
        label="Calories"
        value={t.kcal}
        target={target?.kcal}
        unit=" kcal"
        colorClass="bg-primary"
        size="primary"
      />
      <NutrientBar
        label="Protein"
        value={t.proteinG}
        target={target?.proteinG}
        unit="g"
        colorClass="bg-emerald-500"
        size="primary"
      />
      <div className="grid grid-cols-3 gap-3 pt-1">
        <NutrientBar label="Carbs" value={t.carbG} target={target?.carbG} unit="g" colorClass="bg-sky-500" />
        <NutrientBar label="Fat" value={t.fatG} target={target?.fatG} unit="g" colorClass="bg-amber-500" />
        <NutrientBar label="Fiber" value={t.fiberG} target={target?.fiberG} unit="g" colorClass="bg-violet-500" />
      </div>
      {!target && (
        <p className="text-xs text-muted-foreground pt-1">
          No target set — showing totals only.
        </p>
      )}
    </Card>
  )
}
