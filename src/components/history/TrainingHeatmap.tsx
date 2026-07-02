import { useRef, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import type { HeatmapGrid, HeatmapDay } from '@/lib/heatmap'

// Row labels: Mon … Sun
const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

// Only show labels for Mon / Wed / Fri to reduce clutter (same rows GitHub
// uses in their contribution chart, adapted for Mon-start week).
const LABELED_ROWS = new Set([0, 2, 4])

/** Tailwind bg-* classes per intensity bucket (dark-mode greens). */
const INTENSITY_CLASS: Record<0 | 1 | 2 | 3 | 4, string> = {
  0: 'bg-zinc-800',
  1: 'bg-green-900',
  2: 'bg-green-700',
  3: 'bg-green-500',
  4: 'bg-green-400',
}

interface Props {
  grid: HeatmapGrid
  /** Currently selected date (YYYY-MM-DD), or null */
  selectedDate: string | null
  /** Called with the date key when a cell is tapped; null clears the selection */
  onDaySelect: (date: string | null) => void
}

function monthLabelColumns(weeks: HeatmapGrid['weeks']): Map<number, string> {
  // Return a map of col → month-label (e.g. "Jan") for the first column in
  // which each new month begins. We scan the first non-null cell per column
  // to determine the column's month.
  const labels = new Map<number, string>()
  let lastMonth: number | null = null

  for (let col = 0; col < weeks.length; col++) {
    const firstCell = weeks[col].find((d): d is HeatmapDay => d !== null)
    if (!firstCell) continue
    const month = new Date(firstCell.date + 'T00:00:00').getMonth()
    if (month !== lastMonth) {
      labels.set(col, new Date(firstCell.date + 'T00:00:00').toLocaleString('default', { month: 'short' }))
      lastMonth = month
    }
  }
  return labels
}

export function TrainingHeatmap({ grid, selectedDate, onDaySelect }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const monthLabels = monthLabelColumns(grid.weeks)

  // Scroll to the right end on mount so the most recent weeks are visible.
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth
    }
  }, [])

  function handleCellClick(day: HeatmapDay) {
    // Toggle: tapping the already-selected date clears the filter.
    onDaySelect(day.date === selectedDate ? null : day.date)
  }

  return (
    <div>
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
        Training heatmap
      </h3>
      <Card className="p-3 overflow-hidden">
        {/* Scrollable container — scrolls right on mount */}
        <div
          ref={scrollRef}
          className="overflow-x-auto"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          <div className="flex gap-1 min-w-max">
            {/* Day-of-week label column */}
            <div className="flex flex-col gap-[3px] mr-1">
              {/* Spacer that aligns with the month-label row */}
              <div className="h-4" />
              {DAY_LABELS.map((label, i) => (
                <div
                  key={i}
                  className="h-3 w-3 flex items-center justify-center"
                >
                  {LABELED_ROWS.has(i) ? (
                    <span className="text-[9px] text-muted-foreground leading-none">
                      {label}
                    </span>
                  ) : null}
                </div>
              ))}
            </div>

            {/* Week columns */}
            {grid.weeks.map((week, col) => (
              <div key={col} className="flex flex-col gap-[3px]">
                {/* Month label — only the first col of each new month */}
                <div className="h-4 flex items-center">
                  {monthLabels.has(col) ? (
                    <span className="text-[9px] text-muted-foreground whitespace-nowrap leading-none">
                      {monthLabels.get(col)}
                    </span>
                  ) : null}
                </div>

                {/* 7 day cells */}
                {week.map((day, row) => {
                  if (day === null) {
                    // Future date — render empty placeholder
                    return (
                      <div
                        key={row}
                        className="h-3 w-3 rounded-[2px] bg-transparent"
                      />
                    )
                  }

                  const isSelected = day.date === selectedDate
                  return (
                    <button
                      key={row}
                      title={`${day.date}: ${day.setCount} set${day.setCount !== 1 ? 's' : ''}`}
                      aria-label={`${day.date}: ${day.setCount} completed set${day.setCount !== 1 ? 's' : ''}`}
                      aria-pressed={isSelected}
                      onClick={() => handleCellClick(day)}
                      className={[
                        'h-3 w-3 rounded-[2px] cursor-pointer transition-all',
                        INTENSITY_CLASS[day.intensity],
                        isSelected
                          ? 'ring-2 ring-offset-1 ring-offset-card ring-primary scale-110'
                          : 'hover:scale-110 hover:brightness-125',
                      ].join(' ')}
                    />
                  )
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-1.5 mt-2 justify-end">
          <span className="text-[9px] text-muted-foreground">Less</span>
          {([0, 1, 2, 3, 4] as const).map((level) => (
            <div
              key={level}
              className={`h-3 w-3 rounded-[2px] ${INTENSITY_CLASS[level]}`}
            />
          ))}
          <span className="text-[9px] text-muted-foreground">More</span>
        </div>
      </Card>

      {/* Active filter banner */}
      {selectedDate && (
        <div className="mt-2 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Showing{' '}
            <span className="text-foreground font-medium">
              {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
          </p>
          <button
            onClick={() => onDaySelect(null)}
            className="text-xs text-primary underline-offset-2 hover:underline"
          >
            Clear
          </button>
        </div>
      )}
    </div>
  )
}
