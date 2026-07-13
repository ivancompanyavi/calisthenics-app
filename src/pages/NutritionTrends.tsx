import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/ui/page-header'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'
import { useFoodLogsInRange } from '@/hooks/useFoodLog'
import { useCurrentNutritionTarget } from '@/hooks/useNutritionTargets'
import { useBodyweightLogs } from '@/hooks/useBodyweight'
import { useMeasurements } from '@/hooks/useMeasurements'
import { weeklyAverages, adherenceSeries, estimateTDEE } from '@/lib/nutrition-trends'
import { WeeklyCaloriesChart } from '@/components/nutrition/WeeklyCaloriesChart'
import { AdherenceChart } from '@/components/nutrition/AdherenceChart'
import { TDEECard } from '@/components/nutrition/TDEECard'
import { Sparkline } from '@/components/nutrition/Sparkline'
import { formatWeight } from '@/lib/units'
import { useWeightUnit } from '@/hooks/useSettings'

// Trends windows are bounded (8 weeks for weekly averages, 14 days for the
// adaptive TDEE), so we load a fixed day-range that comfortably covers them
// rather than an arbitrary row cap — a heavy logger's older entries never get
// silently dropped from the windows.
const LOOKBACK_DAYS = 90

export function NutritionTrends() {
  const navigate = useNavigate()
  const unit = useWeightUnit()

  // Captured once at mount via a useState lazy initializer (the repo's
  // sanctioned pattern for Date.now(), vs. an impure call during render) — also
  // keeps the query key stable across re-renders.
  const [range] = useState(() => {
    const now = Date.now()
    return { start: now - LOOKBACK_DAYS * 24 * 60 * 60 * 1000, end: now }
  })
  const { data: foodLogs } = useFoodLogsInRange(range.start, range.end)
  const { data: target } = useCurrentNutritionTarget()
  const { data: bodyweightLogs } = useBodyweightLogs()
  const { data: measurements } = useMeasurements()

  const weeks = useMemo(() => weeklyAverages(foodLogs ?? [], 8), [foodLogs])
  const adherence = useMemo(
    () => adherenceSeries(foodLogs ?? [], target ? { kcal: target.kcal, proteinG: target.proteinG } : undefined, 14),
    [foodLogs, target],
  )
  const tdee = useMemo(
    () => estimateTDEE(foodLogs ?? [], bodyweightLogs ?? [], 14, target?.kcal),
    [foodLogs, bodyweightLogs, target],
  )

  // Bodyweight sparkline: same "last 12, oldest-to-newest" windowing as
  // BodyweightHistory.tsx's SparklineCard.
  const bwPoints = useMemo(() => {
    const recent = (bodyweightLogs ?? []).slice(0, 12).reverse()
    return recent.map((l) => ({ x: l.date, y: l.kg }))
  }, [bodyweightLogs])

  // Waist sparkline: measurements are also newest-first; filter to entries
  // that actually recorded a waist measurement before windowing.
  const waistPoints = useMemo(() => {
    const withWaist = (measurements ?? []).filter(
      (m): m is typeof m & { waistCm: number } => m.waistCm != null,
    )
    const recent = withWaist.slice(0, 12).reverse()
    return recent.map((m) => ({ x: m.date, y: m.waistCm }))
  }, [measurements])

  return (
    <div>
      <PageHeader title="Nutrition Trends">
        <Button variant="ghost" size="sm" onClick={() => navigate('/nutrition')}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
      </PageHeader>

      <div className="px-4 space-y-4 pb-8">
        <section>
          <h3 className="text-sm font-semibold mb-2">Weekly calories</h3>
          <WeeklyCaloriesChart weeks={weeks} />
        </section>

        <section>
          <h3 className="text-sm font-semibold mb-2">Bodyweight</h3>
          {bwPoints.length < 2 ? (
            <Card className="p-4">
              <p className="text-xs text-muted-foreground">
                Need at least 2 weigh-ins to draw a trend.
              </p>
            </Card>
          ) : (
            <Card className="p-3">
              <Sparkline points={bwPoints} formatValue={(y) => formatWeight(y, unit)} />
              <div className="flex justify-between text-[10px] text-muted-foreground tabular-nums mt-1">
                <span>{formatWeight(Math.min(...bwPoints.map((p) => p.y)), unit)}</span>
                <span>{formatWeight(Math.max(...bwPoints.map((p) => p.y)), unit)}</span>
              </div>
            </Card>
          )}
        </section>

        <section>
          <h3 className="text-sm font-semibold mb-2">Waist circumference</h3>
          {waistPoints.length < 2 ? (
            <Card className="p-4">
              <p className="text-xs text-muted-foreground">
                Log at least 2 measurements with a waist reading to draw a trend.
              </p>
            </Card>
          ) : (
            <Card className="p-3">
              <Sparkline points={waistPoints} colorClassName="text-sky-500" formatValue={(y) => `${y.toFixed(1)} cm`} />
              <div className="flex justify-between text-[10px] text-muted-foreground tabular-nums mt-1">
                <span>{Math.min(...waistPoints.map((p) => p.y)).toFixed(1)} cm</span>
                <span>{Math.max(...waistPoints.map((p) => p.y)).toFixed(1)} cm</span>
              </div>
            </Card>
          )}
        </section>

        <section>
          <h3 className="text-sm font-semibold mb-2">Adherence</h3>
          {!target ? (
            <Card className="p-4">
              <p className="text-xs text-muted-foreground">
                Set a nutrition target from the Nutrition page to see adherence here.
              </p>
            </Card>
          ) : (
            <AdherenceChart days={adherence} />
          )}
        </section>

        <section>
          <TDEECard result={tdee} />
        </section>
      </div>
    </div>
  )
}
