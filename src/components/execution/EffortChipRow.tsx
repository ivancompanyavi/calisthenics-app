import { cn } from '@/lib/utils'

interface ChipOption {
  value: number
  label: string
}

interface EffortChipRowProps {
  label: string
  options: ChipOption[]
  selected?: number
  onSelect: (v: number | undefined) => void
}

// Generic numeric chip row shared by RIR (reps) and SIR (time/max) effort capture.
// Tapping the active chip de-selects it (toggles off).
export function EffortChipRow({ label, options, selected, onSelect }: EffortChipRowProps) {
  return (
    <div className="w-full max-w-xs">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 text-center">
        {label}
      </p>
      <div className="flex justify-center gap-1.5">
        {options.map(({ value, label: chipLabel }) => {
          const active = selected === value
          return (
            <button
              key={value}
              type="button"
              onClick={() => onSelect(active ? undefined : value)}
              className={cn(
                'px-2.5 h-8 rounded-full text-xs font-mono tabular-nums border transition-colors',
                active
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border text-muted-foreground hover:bg-secondary/50',
              )}
            >
              {chipLabel}
            </button>
          )
        })}
      </div>
    </div>
  )
}
