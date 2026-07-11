// Generic inline SVG sparkline, following the same pattern as the
// bodyweight sparkline in src/pages/BodyweightHistory.tsx (no chart
// library — just a hand-rolled path over normalized points). Reused here
// for the bodyweight and waist-circumference trend cards on the Nutrition
// Trends page.
export interface SparklinePoint {
  x: number
  y: number
}

export function Sparkline({
  points,
  width = 320,
  height = 80,
  padY = 12,
  colorClassName = 'text-primary',
}: {
  points: SparklinePoint[]
  width?: number
  height?: number
  padY?: number
  colorClassName?: string
}) {
  if (points.length < 2) return null

  const values = points.map((p) => p.y)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1

  const xStep = points.length === 1 ? 0 : (width - 16) / (points.length - 1)
  const plotted = points.map((p, i) => {
    const x = 8 + i * xStep
    const norm = (p.y - min) / span
    const y = height - padY - norm * (height - 2 * padY)
    return { x, y }
  })

  const pathD = plotted
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(' ')

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-20" preserveAspectRatio="none">
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
        <circle key={i} cx={p.x} cy={p.y} r="2" className={colorClassName} fill="currentColor" />
      ))}
    </svg>
  )
}
