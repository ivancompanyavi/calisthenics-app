import { cn } from '@/lib/utils'

// A single labeled progress bar: "Protein  84 / 160g". Used for both the
// primary metrics (kcal, protein — larger, bolder) and secondary ones
// (carbs, fat, fiber — smaller, muted) on the day summary card.
export function NutrientBar({
  label,
  value,
  target,
  unit,
  colorClass = 'bg-primary',
  size = 'secondary',
}: {
  label: string
  value: number
  target?: number
  unit: string
  colorClass?: string
  size?: 'primary' | 'secondary'
}) {
  const pct = target && target > 0 ? Math.min(100, (value / target) * 100) : null
  const over = target != null && value > target

  return (
    <div>
      <div
        className={cn(
          'flex items-baseline justify-between mb-1',
          size === 'primary' ? 'text-sm' : 'text-xs'
        )}
      >
        <span className={cn('font-medium', size === 'primary' && 'font-semibold')}>{label}</span>
        <span className={cn('tabular-nums', size === 'primary' ? 'text-sm' : 'text-xs text-muted-foreground')}>
          {Math.round(value)}
          {target != null ? ` / ${Math.round(target)}` : ''}
          {unit}
        </span>
      </div>
      <div
        className={cn(
          'w-full rounded-full bg-secondary overflow-hidden',
          size === 'primary' ? 'h-2.5' : 'h-1.5'
        )}
      >
        <div
          className={cn('h-full rounded-full transition-all', over ? 'bg-amber-500' : colorClass)}
          style={{ width: pct != null ? `${pct}%` : value > 0 ? '100%' : '0%' }}
        />
      </div>
    </div>
  )
}
