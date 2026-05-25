import { TrendingDown, TrendingUp, ArrowDown, ArrowUp } from 'lucide-react'
import type { BodyweightAnnotation as Annotation } from '@/lib/bodyweight-trend'
import { fromKg, formatWeight } from '@/lib/units'
import { useWeightUnit } from '@/hooks/useSettings'

interface BodyweightAnnotationProps {
  annotation: Annotation | null
  // The "small" variant is for the Home card (single dense line). The default
  // variant is for the History page where we have room to breathe.
  small?: boolean
}

// Renders a one-line auto-observation about the current bodyweight trajectory:
// directional 3-week trends and 6-week extremes. Returns null when there's
// nothing notable to surface — calling sites can render it unconditionally.
export function BodyweightAnnotation({ annotation, small }: BodyweightAnnotationProps) {
  const unit = useWeightUnit()
  if (!annotation) return null

  const baseClass = small
    ? 'text-[11px] inline-flex items-center gap-1 tabular-nums'
    : 'text-xs inline-flex items-center gap-1 tabular-nums'

  if (annotation.kind === 'extreme-high') {
    return (
      <span className={`${baseClass} text-amber-500`}>
        <ArrowUp className="h-3 w-3" />
        Heaviest in {Math.round(annotation.windowDays / 7)} weeks
        <span className="text-muted-foreground ml-1">
          ({formatWeight(annotation.kg, unit)})
        </span>
      </span>
    )
  }
  if (annotation.kind === 'extreme-low') {
    return (
      <span className={`${baseClass} text-emerald-500`}>
        <ArrowDown className="h-3 w-3" />
        Lightest in {Math.round(annotation.windowDays / 7)} weeks
        <span className="text-muted-foreground ml-1">
          ({formatWeight(annotation.kg, unit)})
        </span>
      </span>
    )
  }
  // Trend deltas: convert into the user's unit. We pass the raw kg through
  // fromKg with no rounding twice — the round-to-half is fine here too.
  const displayDelta = fromKg(annotation.deltaKg, unit)
  const weeks = Math.round(annotation.windowDays / 7)
  if (annotation.kind === 'trend-up') {
    return (
      <span className={`${baseClass} text-amber-500`}>
        <TrendingUp className="h-3 w-3" />
        +{displayDelta} {unit} over {weeks} weeks
      </span>
    )
  }
  return (
    <span className={`${baseClass} text-emerald-500`}>
      <TrendingDown className="h-3 w-3" />
      −{displayDelta} {unit} over {weeks} weeks
    </span>
  )
}
