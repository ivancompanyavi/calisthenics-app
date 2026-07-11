import { cn } from '@/lib/utils'
import type { MealLabel } from '@/models/types'

const OPTIONS: { value: MealLabel | undefined; label: string }[] = [
  { value: undefined, label: 'None' },
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'dinner', label: 'Dinner' },
  { value: 'snack', label: 'Snack' },
]

export function MealLabelPicker({
  value,
  onChange,
}: {
  value: MealLabel | undefined
  onChange: (v: MealLabel | undefined) => void
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {OPTIONS.map((opt) => (
        <button
          key={opt.label}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            'px-3 py-1.5 rounded-full text-xs font-medium border transition-colors touch-manipulation',
            value === opt.value
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-transparent border-input text-muted-foreground hover:text-foreground'
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
