import { useState } from 'react'

// Generic inline SVG sparkline, following the same pattern as the
// bodyweight sparkline in src/pages/BodyweightHistory.tsx (no chart
// library — just a hand-rolled path over normalized points). Reused here
// for the bodyweight and waist-circumference trend cards on the Nutrition
// Trends page.
//
// Interactive: hover (desktop) or tap/drag (touch) snaps to the nearest data
// point and shows a tooltip with the exact value and its date. A first/last
// date row anchors the x-axis so the window is legible without hovering.
export interface SparklinePoint {
  /** X value — a timestamp (ms); used for the date axis and tooltip. */
  x: number
  /** Y value — the plotted quantity (kg, cm, …). */
  y: number
}

const defaultFormatDate = (x: number) =>
  new Date(x).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })

export function Sparkline({
  points,
  width = 320,
  height = 80,
  padY = 12,
  colorClassName = 'text-primary',
  formatValue = (y) => String(y),
  formatDate = defaultFormatDate,
}: {
  points: SparklinePoint[]
  width?: number
  height?: number
  padY?: number
  colorClassName?: string
  formatValue?: (y: number) => string
  formatDate?: (x: number) => string
}) {
  const [active, setActive] = useState<number | null>(null)

  if (points.length < 2) return null

  const values = points.map((p) => p.y)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1

  const xStep = (width - 16) / (points.length - 1)
  const plotted = points.map((p, i) => {
    const x = 8 + i * xStep
    const norm = (p.y - min) / span
    const y = height - padY - norm * (height - 2 * padY)
    return { x, y }
  })

  const pathD = plotted
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(' ')

  // Map a pointer position to the nearest data point. The SVG stretches to the
  // container width (preserveAspectRatio="none"), so convert the pointer's
  // fractional x into viewBox units before snapping to the closest index.
  const handlePointer = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    if (rect.width === 0) return
    const vbX = ((e.clientX - rect.left) / rect.width) * width
    const idx = Math.round((vbX - 8) / xStep)
    setActive(Math.max(0, Math.min(points.length - 1, idx)))
  }

  const activePoint = active != null ? plotted[active] : null
  const activeData = active != null ? points[active] : null
  // Clamp the tooltip anchor so it doesn't overflow the card at the edges, and
  // flip it to the emptier half so it never sits on top of the active point.
  const tipLeft = activePoint ? Math.min(90, Math.max(10, (activePoint.x / width) * 100)) : 0
  const tipAtBottom = activePoint ? activePoint.y < height / 2 : false

  return (
    <div>
      <div
        className="relative touch-pan-y"
        onPointerMove={handlePointer}
        onPointerDown={handlePointer}
        onPointerLeave={() => setActive(null)}
      >
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-20" preserveAspectRatio="none">
          {activePoint && (
            <line
              x1={activePoint.x}
              y1={0}
              x2={activePoint.x}
              y2={height}
              stroke="currentColor"
              strokeWidth="1"
              strokeDasharray="3 3"
              className="text-muted-foreground"
              vectorEffect="non-scaling-stroke"
            />
          )}
          <path
            d={pathD}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className={colorClassName}
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
          {plotted.map((p, i) => (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r={i === active ? 3.5 : 2}
              className={colorClassName}
              fill="currentColor"
            />
          ))}
        </svg>

        {activeData && (
          <div
            className={`pointer-events-none absolute z-10 -translate-x-1/2 whitespace-nowrap rounded-md border border-border bg-popover px-1.5 py-0.5 text-[10px] text-popover-foreground shadow-md ${
              tipAtBottom ? 'bottom-0' : 'top-0'
            }`}
            style={{ left: `${tipLeft}%` }}
          >
            <span className="font-medium tabular-nums">{formatValue(activeData.y)}</span>
            <span className="ml-1 text-muted-foreground tabular-nums">{formatDate(activeData.x)}</span>
          </div>
        )}
      </div>

      {/* x-axis: first & last dates of the plotted window */}
      <div className="mt-1 flex justify-between text-[10px] text-muted-foreground tabular-nums">
        <span>{formatDate(points[0].x)}</span>
        <span>{formatDate(points[points.length - 1].x)}</span>
      </div>
    </div>
  )
}
