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

  const soundCues = settings?.soundCues ?? true
  const setSoundCues = (next: boolean) => {
    if (next === soundCues) return
    update.mutate({ soundCues: next })
  }

  const waitAfterRest = settings?.waitAfterRest ?? false
  const setWaitAfterRest = (next: boolean) => {
    if (next === waitAfterRest) return
    update.mutate({ waitAfterRest: next })
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

        <Card className="p-4">
          <div className="space-y-3">
            <div>
              <h2 className="text-sm font-semibold">Sound &amp; haptic cues</h2>
              <p className="text-xs text-muted-foreground">
                Beeps and vibration at T&#8209;3 / T&#8209;2 / T&#8209;1 and end of rest and
                time&#8209;mode exercise countdowns. Silenced during count&#8209;up (max) sets.
              </p>
            </div>
            <div className="flex gap-2">
              <UnitButton active={soundCues} onClick={() => setSoundCues(true)}>
                On
              </UnitButton>
              <UnitButton active={!soundCues} onClick={() => setSoundCues(false)}>
                Off
              </UnitButton>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="space-y-3">
            <div>
              <h2 className="text-sm font-semibold">Wait for tap after rest</h2>
              <p className="text-xs text-muted-foreground">
                When on, the rest timer freezes at 0:00 and waits for you to tap
                before starting the next exercise. When off (default), rest
                reaching zero automatically moves into the next exercise and
                starts its timer for time / max&#8209;hold sets.
              </p>
            </div>
            <div className="flex gap-2">
              <UnitButton active={waitAfterRest} onClick={() => setWaitAfterRest(true)}>
                On
              </UnitButton>
              <UnitButton active={!waitAfterRest} onClick={() => setWaitAfterRest(false)}>
                Off
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
