import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/ui/page-header'
import { useSettings, useUpdateSettings } from '@/hooks/useSettings'
import type { WeightUnit } from '@/models/types'
import { cn } from '@/lib/utils'

export function Settings() {
  const { data: settings } = useSettings()
  const update = useUpdateSettings()

  const unit = settings?.weightUnit ?? 'kg'
  const setUnit = (next: WeightUnit) => {
    if (next === unit) return
    update.mutate({ weightUnit: next })
  }

  return (
    <div>
      <PageHeader title="Settings" />

      <div className="px-4 space-y-4 pb-8">
        <Card className="p-4">
          <div className="space-y-3">
            <div>
              <h2 className="text-sm font-semibold">Weight unit</h2>
              <p className="text-xs text-muted-foreground">
                Used when logging machine, dumbbell, and bodyweight values. Stored
                internally as kg; the toggle only affects display + input.
              </p>
            </div>
            <div className="flex gap-2">
              <UnitButton active={unit === 'kg'} onClick={() => setUnit('kg')}>
                kg
              </UnitButton>
              <UnitButton active={unit === 'lb'} onClick={() => setUnit('lb')}>
                lb
              </UnitButton>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

function UnitButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <Button
      type="button"
      variant={active ? 'default' : 'outline'}
      onClick={onClick}
      className={cn('flex-1 uppercase tracking-wide', active && 'pointer-events-none')}
    >
      {children}
    </Button>
  )
}
