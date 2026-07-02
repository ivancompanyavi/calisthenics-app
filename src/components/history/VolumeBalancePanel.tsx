import { TriangleAlert } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { useVolumeBalance } from '@/hooks/useVolumeBalance'
import { FAMILIES } from '@/lib/volume-balance'
import type { MovementFamily } from '@/models/types'
import type { VolumeWarning, WeeklyFamilySplit } from '@/lib/volume-balance'

// ── Family colour map ─────────────────────────────────────────────────────────
// Consistent colours across chart segments and the legend.
const FAMILY_COLOR: Record<MovementFamily, string> = {
  push: '#3b82f6',  // blue-500
  pull: '#22c55e',  // green-500
  legs: '#f97316',  // orange-500
  core: '#a855f7',  // purple-500
}

const FAMILY_LABEL: Record<MovementFamily, string> = {
  push: 'Push',
  pull: 'Pull',
  legs: 'Legs',
  core: 'Core',
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Legend() {
  return (
    <div className="flex flex-wrap gap-x-3 gap-y-1">
      {FAMILIES.map((f) => (
        <span key={f} className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <span
            className="inline-block w-2.5 h-2.5 rounded-sm flex-shrink-0"
            style={{ backgroundColor: FAMILY_COLOR[f] }}
          />
          {FAMILY_LABEL[f]}
        </span>
      ))}
    </div>
  )
}

function StackedBar({ split }: { split: WeeklyFamilySplit }) {
  const BAR_HEIGHT = 56

  if (split.total === 0) {
    return (
      <div className="flex-1 flex flex-col items-center gap-1">
        <div
          className="w-full rounded-t-sm bg-muted/30"
          style={{ height: `${BAR_HEIGHT}px` }}
        />
        <span className="text-[9px] text-muted-foreground leading-none">{split.weekLabel}</span>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col items-center gap-1">
      {/* Stacked segments — rendered bottom-to-top via flex-col-reverse */}
      <div
        className="w-full flex flex-col-reverse rounded-t-sm overflow-hidden"
        style={{ height: `${BAR_HEIGHT}px` }}
      >
        {FAMILIES.map((f) => {
          const count = split.counts[f] ?? 0
          if (count === 0) return null
          const heightPx = (count / split.total) * BAR_HEIGHT
          return (
            <div
              key={f}
              style={{
                height: `${heightPx}px`,
                backgroundColor: FAMILY_COLOR[f],
                flexShrink: 0,
              }}
            />
          )
        })}
      </div>
      <span className="text-[9px] text-muted-foreground leading-none">{split.weekLabel}</span>
    </div>
  )
}

function WarningChip({ warning }: { warning: VolumeWarning }) {
  return (
    <div className="flex items-start gap-1.5 text-[11px] text-amber-400 leading-snug">
      <TriangleAlert className="h-3.5 w-3.5 flex-shrink-0 mt-[1px]" />
      <span>{warning.text}</span>
    </div>
  )
}

// ── Main export ───────────────────────────────────────────────────────────────

export function VolumeBalancePanel() {
  const { data, isLoading } = useVolumeBalance()

  if (isLoading || !data) return null

  // Only render if there is at least some data
  const hasAnySets = data.splits.some((s) => s.total > 0)
  if (!hasAnySets) return null

  return (
    <Card className="p-3 space-y-2">
      <div className="flex items-baseline justify-between">
        <p className="text-xs font-medium text-muted-foreground">Volume split by family</p>
        <Legend />
      </div>

      {/* Stacked bar chart */}
      <div className="flex items-end gap-1">
        {data.splits.map((split) => (
          <StackedBar key={split.weekStart} split={split} />
        ))}
      </div>

      {/* Drift warnings */}
      {data.warnings.length > 0 && (
        <div className="pt-1 space-y-1 border-t border-border/50">
          {data.warnings.map((w, i) => (
            <WarningChip key={i} warning={w} />
          ))}
        </div>
      )}
    </Card>
  )
}
