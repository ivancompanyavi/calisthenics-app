import { Card } from '@/components/ui/card'
import { TrendingDown, TrendingUp, Minus, Info } from 'lucide-react'
import type { TDEEEstimate, TDEEInsufficientData } from '@/lib/nutrition-trends'

const SUGGESTION_COPY: Record<TDEEEstimate['suggestion'], { label: string; icon: typeof TrendingUp; tone: string }> = {
  raise: { label: 'Consider raising target', icon: TrendingUp, tone: 'text-amber-500' },
  lower: { label: 'Consider lowering target', icon: TrendingDown, tone: 'text-sky-500' },
  hold: { label: 'On track — hold target', icon: Minus, tone: 'text-emerald-500' },
}

export function TDEECard({ result }: { result: TDEEEstimate | TDEEInsufficientData }) {
  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-baseline justify-between">
        <p className="text-sm font-semibold">Estimated maintenance (adaptive)</p>
      </div>

      {result.insufficientData ? (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">
            Not enough data yet — need at least two weeks of logged food and bodyweight readings to
            estimate maintenance calories.
          </p>
          <p className="text-[10px] text-muted-foreground tabular-nums">
            {result.elapsedDays} day{result.elapsedDays === 1 ? '' : 's'} elapsed ·{' '}
            {result.loggedDays} day{result.loggedDays === 1 ? '' : 's'} logged
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold tabular-nums">{Math.round(result.tdee)}</span>
            <span className="text-xs text-muted-foreground">kcal / day</span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <p className="text-muted-foreground">Avg intake</p>
              <p className="font-medium tabular-nums">{Math.round(result.avgKcal)} kcal</p>
            </div>
            <div>
              <p className="text-muted-foreground">Weight change</p>
              <p className="font-medium tabular-nums">
                {result.weightChangeKg > 0 ? '+' : ''}
                {result.weightChangeKg.toFixed(1)} kg over {result.elapsedDays}d
              </p>
            </div>
          </div>

          <SuggestionPill suggestion={result.suggestion} />
        </div>
      )}

      <div className="flex gap-1.5 items-start pt-1 border-t">
        <Info className="h-3 w-3 shrink-0 mt-0.5 text-muted-foreground" />
        <p className="text-[10px] text-muted-foreground leading-snug">
          This is an automatic estimate from recent intake and weight trend, not a prescription — your
          coach makes the final call on any target change.
        </p>
      </div>
    </Card>
  )
}

function SuggestionPill({ suggestion }: { suggestion: TDEEEstimate['suggestion'] }) {
  const { label, icon: Icon, tone } = SUGGESTION_COPY[suggestion]
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${tone}`}>
      <Icon className="h-3.5 w-3.5" />
      {label}
    </span>
  )
}
