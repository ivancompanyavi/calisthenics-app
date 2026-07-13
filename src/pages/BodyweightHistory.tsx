import { useNavigate } from 'react-router-dom'
import { useBodyweightLogs, useDeleteBodyweight } from '@/hooks/useBodyweight'
import { useWeightUnit } from '@/hooks/useSettings'
import { formatWeight, fromKg } from '@/lib/units'
import { analyzeBodyweightTrend } from '@/lib/bodyweight-trend'
import { BodyweightAnnotation } from '@/components/bodyweight/BodyweightAnnotation'
import { PageHeader } from '@/components/ui/page-header'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useConfirm } from '@/components/ui/confirm-context'
import { ArrowLeft, Trash2, TrendingDown, TrendingUp, Minus } from 'lucide-react'
import type { BodyweightLog } from '@/models/types'

export function BodyweightHistory() {
  const navigate = useNavigate()
  const { data: logs } = useBodyweightLogs()
  const deleteBw = useDeleteBodyweight()
  const unit = useWeightUnit()
  const confirm = useConfirm()

  const handleDelete = async (id: string, when: string) => {
    if (
      await confirm({
        title: 'Delete this entry?',
        description: `Remove the weigh-in from ${when}? This can't be undone.`,
        confirmLabel: 'Delete',
        destructive: true,
      })
    ) {
      deleteBw.mutate(id)
    }
  }

  return (
    <div>
      <PageHeader title="Bodyweight">
        <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
      </PageHeader>

      <div className="px-4 space-y-4 pb-8">
        {!logs || logs.length === 0 ? (
          <Card className="p-6 text-center">
            <p className="text-sm text-muted-foreground">
              No weigh-ins yet. Log one from the Nutrition page to start tracking.
            </p>
          </Card>
        ) : (
          <>
            <SparklineCard logs={logs} unit={unit} />

            {(() => {
              const annotation = analyzeBodyweightTrend(logs)
              if (!annotation) return null
              return (
                <Card className="p-3">
                  <BodyweightAnnotation annotation={annotation} />
                </Card>
              )
            })()}

            <section>
              <h3 className="text-sm font-semibold mb-2">
                History ({logs.length})
              </h3>
              <div className="space-y-2">
                {logs.map((log, i) => {
                  // `logs` comes from the repo ordered newest-first. The
                  // *next* entry in the array is the previous weigh-in —
                  // delta is current minus previous.
                  const previous = logs[i + 1]
                  const deltaKg = previous ? log.kg - previous.kg : null
                  return (
                    <BodyweightRow
                      key={log.id}
                      log={log}
                      deltaKg={deltaKg}
                      unit={unit}
                      onDelete={() =>
                        handleDelete(log.id, formatRowDate(log.date))
                      }
                    />
                  )
                })}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  )
}

// Inline SVG sparkline — last 12 entries (or all if fewer). Plotted in
// reverse chronological order so the most recent point is on the right.
function SparklineCard({
  logs,
  unit,
}: {
  logs: BodyweightLog[]
  unit: 'kg' | 'lb'
}) {
  // Display newest-to-right by reversing the newest-first array.
  const recent = logs.slice(0, 12).reverse()
  if (recent.length < 2) {
    return (
      <Card className="p-4">
        <p className="text-xs text-muted-foreground">
          Need at least 2 entries to draw a trend.
        </p>
      </Card>
    )
  }

  const W = 320
  const H = 80
  const PAD_Y = 12

  const values = recent.map((l) => l.kg)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1

  const xStep = recent.length === 1 ? 0 : (W - 16) / (recent.length - 1)
  const points = recent.map((l, i) => {
    const x = 8 + i * xStep
    const norm = (l.kg - min) / span
    // Invert y so higher kg is higher on screen.
    const y = H - PAD_Y - norm * (H - 2 * PAD_Y)
    return { x, y, kg: l.kg, date: l.date }
  })

  const pathD = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(' ')

  const first = recent[0]
  const last = recent[recent.length - 1]
  const totalDelta = last.kg - first.kg

  return (
    <Card className="p-3">
      <div className="flex items-baseline justify-between mb-2">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
          Last {recent.length} weigh-ins
        </p>
        <DeltaPill kg={totalDelta} unit={unit} />
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-20"
        preserveAspectRatio="none"
      >
        <path
          d={pathD}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-primary"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
        {points.map((p) => (
          <circle
            key={p.date}
            cx={p.x}
            cy={p.y}
            r="2"
            className="fill-primary"
          />
        ))}
      </svg>
      <div className="flex justify-between text-[10px] text-muted-foreground tabular-nums mt-1">
        <span>{formatWeight(min, unit)}</span>
        <span>{formatWeight(max, unit)}</span>
      </div>
    </Card>
  )
}

function BodyweightRow({
  log,
  deltaKg,
  unit,
  onDelete,
}: {
  log: BodyweightLog
  deltaKg: number | null
  unit: 'kg' | 'lb'
  onDelete: () => void
}) {
  return (
    <Card className="p-3">
      <div className="flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <span className="font-semibold tabular-nums">
              {formatWeight(log.kg, unit)}
            </span>
            {deltaKg != null && <DeltaPill kg={deltaKg} unit={unit} small />}
          </div>
          <p className="text-xs text-muted-foreground">
            {formatRowDate(log.date)}
          </p>
          {log.notes && (
            <p className="text-xs italic text-muted-foreground mt-0.5">
              {log.notes}
            </p>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-destructive"
          onClick={onDelete}
          aria-label="Delete entry"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  )
}

function DeltaPill({
  kg,
  unit,
  small = false,
}: {
  kg: number
  unit: 'kg' | 'lb'
  small?: boolean
}) {
  // Round before zero-checking so a swing < 0.05 kg (or <1 lb) reads as flat.
  const rounded = fromKg(Math.abs(kg), unit)
  if (rounded === 0) {
    return (
      <span
        className={`inline-flex items-center gap-1 text-muted-foreground ${
          small ? 'text-[10px]' : 'text-xs'
        }`}
      >
        <Minus className="h-3 w-3" /> 0 {unit}
      </span>
    )
  }
  const positive = kg > 0
  const Icon = positive ? TrendingUp : TrendingDown
  const tone = positive ? 'text-amber-500' : 'text-emerald-500'
  return (
    <span
      className={`inline-flex items-center gap-1 ${tone} ${
        small ? 'text-[10px]' : 'text-xs'
      }`}
    >
      <Icon className="h-3 w-3" />
      {positive ? '+' : '−'}
      {rounded} {unit}
    </span>
  )
}

function formatRowDate(date: number): string {
  return new Date(date).toLocaleDateString(undefined, {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}
