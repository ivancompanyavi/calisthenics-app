import { Card } from '@/components/ui/card'
import type { AdherenceDay } from '@/lib/nutrition-trends'

// Recent daily kcal vs. current target: a bar per logged day, colored by
// whether it landed over/under target, with the target drawn as a
// reference line.
export function AdherenceChart({ days }: { days: AdherenceDay[] }) {
  if (days.length === 0) {
    return (
      <Card className="p-4">
        <p className="text-xs text-muted-foreground">
          Set a target and log a few days to see adherence here.
        </p>
      </Card>
    )
  }

  const W = 320
  const H = 100
  const PAD_Y = 8
  const BAR_GAP = 3

  const targetKcal = days[0].targetKcal
  const max = Math.max(...days.map((d) => d.kcal), targetKcal, 1)
  const barWidth = (W - BAR_GAP * (days.length - 1)) / days.length
  const targetY = H - PAD_Y - (targetKcal / max) * (H - 2 * PAD_Y)

  return (
    <Card className="p-3">
      <div className="flex items-baseline justify-between mb-2">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
          Calories vs target (last {days.length} logged days)
        </p>
        <span className="text-[10px] text-muted-foreground tabular-nums">
          target {Math.round(targetKcal)}
        </span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-28" preserveAspectRatio="none">
        <line
          x1={0}
          x2={W}
          y1={targetY}
          y2={targetY}
          stroke="currentColor"
          strokeWidth="1"
          strokeDasharray="4 3"
          className="text-muted-foreground/50"
        />
        {days.map((d, i) => {
          const barHeight = (d.kcal / max) * (H - 2 * PAD_Y)
          const x = i * (barWidth + BAR_GAP)
          const y = H - PAD_Y - barHeight
          const over = d.kcalDelta > 0
          return (
            <rect
              key={d.date}
              x={x}
              y={y}
              width={barWidth}
              height={barHeight}
              rx={2}
              className={over ? 'fill-amber-500' : 'fill-emerald-500'}
            />
          )
        })}
      </svg>
      <div className="flex items-center gap-3 text-[10px] text-muted-foreground mt-1">
        <span className="inline-flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" /> at/under target
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-amber-500" /> over target
        </span>
      </div>
    </Card>
  )
}
