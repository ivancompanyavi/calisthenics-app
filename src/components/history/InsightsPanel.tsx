import { useInsights } from '@/hooks/useInsights'
import { Card } from '@/components/ui/card'
import { Flame, TrendingUp, TrendingDown } from 'lucide-react'
import { VolumeBalancePanel } from '@/components/history/VolumeBalancePanel'

function MiniBarChart({ data }: { data: { week: string; count: number }[] }) {
  const max = Math.max(...data.map((d) => d.count), 1)
  const barHeight = 60

  return (
    <div className="flex items-end gap-1 h-[80px]">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div
            className="w-full bg-primary/80 rounded-t-sm min-h-[2px] transition-all"
            style={{ height: `${(d.count / max) * barHeight}px` }}
          />
          <span className="text-[9px] text-muted-foreground">{d.week}</span>
        </div>
      ))}
    </div>
  )
}

function MiniTrendLine({
  data,
  improving,
}: {
  data: { value: number; bodyweightKg?: number }[]
  improving: boolean
}) {
  if (data.length < 2) return null
  const width = 120
  const height = 32
  const padding = 2

  // Each series is normalized to its own [min, max] so both span the chart
  // height regardless of unit scale. We only care about correlation in
  // shape here — absolute axes belong on a fuller chart.
  const normalize = (
    values: number[],
  ): ((v: number) => number) => {
    const max = Math.max(...values)
    const min = Math.min(...values)
    const range = max - min || 1
    return (v) => height - padding - ((v - min) / range) * (height - padding * 2)
  }

  const xAt = (i: number) =>
    padding + (i / (data.length - 1)) * (width - padding * 2)

  const liftY = normalize(data.map((d) => d.value))
  const liftPoints = data.map((d, i) => `${xAt(i)},${liftY(d.value)}`).join(' ')

  const bwValues = data
    .map((d) => d.bodyweightKg)
    .filter((v): v is number => v != null)
  // Only draw the bodyweight overlay when we have at least 2 readings across
  // the visible window — otherwise it'd be a single dot, which says nothing.
  const hasBodyweight = bwValues.length >= 2
  const bwY = hasBodyweight ? normalize(bwValues) : null
  const bwPoints = hasBodyweight
    ? data
        .map((d, i) =>
          d.bodyweightKg != null && bwY ? `${xAt(i)},${bwY(d.bodyweightKg)}` : null,
        )
        .filter((p): p is string => p != null)
        .join(' ')
    : null

  return (
    <svg width={width} height={height} className="flex-shrink-0">
      {bwPoints && (
        <polyline
          points={bwPoints}
          fill="none"
          stroke="hsl(var(--muted-foreground))"
          strokeWidth="1.5"
          strokeDasharray="2 2"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.6}
        />
      )}
      <polyline
        points={liftPoints}
        fill="none"
        stroke={improving ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))'}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function hasBodyweightOverlay(
  trends: { data: { bodyweightKg?: number }[] }[],
): boolean {
  return trends.some(
    (t) => t.data.filter((d) => d.bodyweightKg != null).length >= 2,
  )
}

export function InsightsPanel() {
  const { data: insights, isLoading } = useInsights()

  if (isLoading || !insights) return null

  const hasData = insights.weeklyVolume.some((w) => w.count > 0)
  if (!hasData) return null

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
        Insights
      </h3>

      <div className="grid grid-cols-3 gap-2">
        <Card className="p-3 text-center">
          <Flame className="h-4 w-4 text-orange-500 mx-auto mb-1" />
          <p className="text-xl font-bold">{insights.streak}</p>
          <p className="text-[10px] text-muted-foreground">week streak</p>
        </Card>
        <Card className="p-3 text-center">
          <p className="text-xl font-bold">{insights.totalSetsThisWeek}</p>
          <p className="text-[10px] text-muted-foreground">sets this week</p>
        </Card>
        <Card className="p-3 text-center">
          <p className="text-xl font-bold">{insights.totalSetsLastWeek}</p>
          <p className="text-[10px] text-muted-foreground">sets last week</p>
        </Card>
      </div>

      <Card className="p-3">
        <p className="text-xs font-medium text-muted-foreground mb-2">Workouts per week</p>
        <MiniBarChart data={insights.weeklyVolume} />
      </Card>

      <VolumeBalancePanel />

      {insights.progressionTrends.length > 0 && (
        <Card className="p-3 space-y-3">
          <div className="flex items-baseline justify-between">
            <p className="text-xs font-medium text-muted-foreground">Progression trends</p>
            {hasBodyweightOverlay(insights.progressionTrends) && (
              <p className="text-[10px] text-muted-foreground inline-flex items-center gap-2">
                <span className="inline-flex items-center gap-1">
                  <span className="inline-block w-3 h-[2px] bg-primary rounded-full" />
                  lift
                </span>
                <span className="inline-flex items-center gap-1">
                  <span
                    className="inline-block w-3 h-[2px] rounded-full opacity-60"
                    style={{
                      backgroundImage:
                        'repeating-linear-gradient(90deg, hsl(var(--muted-foreground)) 0 2px, transparent 2px 4px)',
                    }}
                  />
                  bw
                </span>
              </p>
            )}
          </div>
          {insights.progressionTrends.map((trend) => (
            <div key={trend.movementName} className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                {trend.improving ? (
                  <TrendingUp className="h-3 w-3 text-green-500 flex-shrink-0" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                )}
                <span className="text-xs truncate">{trend.movementName}</span>
              </div>
              <MiniTrendLine data={trend.data} improving={trend.improving} />
            </div>
          ))}
        </Card>
      )}
    </div>
  )
}
