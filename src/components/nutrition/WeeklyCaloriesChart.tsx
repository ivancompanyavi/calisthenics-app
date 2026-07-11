import { Card } from '@/components/ui/card'
import type { WeeklyAverage } from '@/lib/nutrition-trends'

// Simple bar chart of weekly-average calories, last N weeks. Hand-rolled SVG
// bars (no chart library), following the sparkline pattern used elsewhere in
// the nutrition/bodyweight pages.
export function WeeklyCaloriesChart({ weeks }: { weeks: WeeklyAverage[] }) {
  if (weeks.length === 0) {
    return (
      <Card className="p-4">
        <p className="text-xs text-muted-foreground">
          No logged weeks yet — log a few days to see your weekly average calories here.
        </p>
      </Card>
    )
  }

  const W = 320
  const H = 100
  const PAD_Y = 8
  const BAR_GAP = 4

  const values = weeks.map((w) => w.avgKcal)
  const max = Math.max(...values, 1)

  const barWidth = (W - BAR_GAP * (weeks.length - 1)) / weeks.length

  return (
    <Card className="p-3">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
        Weekly average calories (last {weeks.length} weeks)
      </p>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-28" preserveAspectRatio="none">
        {weeks.map((w, i) => {
          const barHeight = (w.avgKcal / max) * (H - 2 * PAD_Y)
          const x = i * (barWidth + BAR_GAP)
          const y = H - PAD_Y - barHeight
          return (
            <rect
              key={w.weekStart}
              x={x}
              y={y}
              width={barWidth}
              height={barHeight}
              rx={2}
              className="fill-primary"
              opacity={0.4 + 0.6 * (i + 1) / weeks.length}
            />
          )
        })}
      </svg>
      <div className="flex justify-between text-[10px] text-muted-foreground tabular-nums mt-1">
        <span>{Math.round(weeks[0].avgKcal)} kcal</span>
        <span>{Math.round(weeks[weeks.length - 1].avgKcal)} kcal</span>
      </div>
    </Card>
  )
}
