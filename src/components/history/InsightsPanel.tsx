import { useInsights } from '@/hooks/useInsights'
import { Card } from '@/components/ui/card'
import { Flame, TrendingUp, TrendingDown } from 'lucide-react'

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

function MiniTrendLine({ data, improving }: { data: { value: number }[]; improving: boolean }) {
  if (data.length < 2) return null
  const max = Math.max(...data.map((d) => d.value))
  const min = Math.min(...data.map((d) => d.value))
  const range = max - min || 1
  const width = 120
  const height = 32
  const padding = 2

  const points = data.map((d, i) => {
    const x = padding + (i / (data.length - 1)) * (width - padding * 2)
    const y = height - padding - ((d.value - min) / range) * (height - padding * 2)
    return `${x},${y}`
  }).join(' ')

  return (
    <svg width={width} height={height} className="flex-shrink-0">
      <polyline
        points={points}
        fill="none"
        stroke={improving ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))'}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
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

      {insights.progressionTrends.length > 0 && (
        <Card className="p-3 space-y-3">
          <p className="text-xs font-medium text-muted-foreground">Progression trends</p>
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
