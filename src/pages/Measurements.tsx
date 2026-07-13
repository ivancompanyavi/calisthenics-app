import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/ui/page-header'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useConfirm } from '@/components/ui/confirm-context'
import { ArrowLeft, Trash2, Ruler } from 'lucide-react'
import { useMeasurements, useLogMeasurement, useDeleteMeasurement } from '@/hooks/useMeasurements'
import { toLocalDateKey, fromLocalDateKey } from '@/lib/heatmap'
import type { Measurement } from '@/models/types'

const FIELDS: { key: keyof Omit<Measurement, 'id' | 'date' | 'source' | 'notes'>; label: string }[] = [
  { key: 'waistCm', label: 'Waist (cm)' },
  { key: 'neckCm', label: 'Neck (cm)' },
  { key: 'chestCm', label: 'Chest (cm)' },
  { key: 'leftArmCm', label: 'Left arm (cm)' },
  { key: 'rightArmCm', label: 'Right arm (cm)' },
  { key: 'leftThighCm', label: 'Left thigh (cm)' },
  { key: 'rightThighCm', label: 'Right thigh (cm)' },
  { key: 'hipsCm', label: 'Hips (cm)' },
  { key: 'leftCalfCm', label: 'Left calf (cm)' },
  { key: 'rightCalfCm', label: 'Right calf (cm)' },
  { key: 'bodyFatPct', label: 'Body fat (%)' },
]

export function Measurements() {
  const navigate = useNavigate()
  const { data: logs } = useMeasurements()
  const logMeasurement = useLogMeasurement()
  const deleteMeasurement = useDeleteMeasurement()
  const confirm = useConfirm()

  const [form, setForm] = useState<Record<string, string>>({})
  const [logging, setLogging] = useState(false)
  // Which day this measurement is for. Defaults to today but can be backdated
  // (e.g. a scale/tape reading you didn't get around to entering same-day).
  // Snapshot "now" once per mount — Date.now() in render is impure.
  const [todayKey] = useState(() => toLocalDateKey(Date.now()))
  const [dateKey, setDateKey] = useState(todayKey)

  const hasAnyValue = Object.values(form).some((v) => v.trim() !== '')

  const submit = async () => {
    const data: Omit<Measurement, 'id' | 'date'> = {}
    for (const { key } of FIELDS) {
      const raw = form[key]
      if (raw && raw.trim() !== '' && Number.isFinite(Number(raw))) {
        ;(data as Record<string, number>)[key] = Number(raw)
      }
    }
    await logMeasurement.mutateAsync({ data, date: dateKey ? fromLocalDateKey(dateKey) : undefined })
    setForm({})
    setDateKey(todayKey)
    setLogging(false)
  }

  const handleDelete = async (m: Measurement) => {
    if (
      await confirm({
        title: 'Delete this entry?',
        description: `Remove the measurement from ${formatDate(m.date)}? This can't be undone.`,
        confirmLabel: 'Delete',
        destructive: true,
      })
    ) {
      deleteMeasurement.mutate(m.id)
    }
  }

  return (
    <div>
      <PageHeader title="Measurements">
        <Button variant="ghost" size="sm" onClick={() => navigate('/nutrition')}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
      </PageHeader>

      <div className="px-4 space-y-4 pb-8">
        {!logging ? (
          <Card className="p-3">
            <button
              type="button"
              className="w-full flex items-center gap-3 text-left"
              onClick={() => setLogging(true)}
            >
              <Ruler className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Log a new measurement</span>
            </button>
          </Card>
        ) : (
          <Card className="p-4 space-y-3">
            <p className="text-sm font-medium">New measurement</p>
            <label className="block">
              <span className="text-xs text-muted-foreground mb-1 block">Date</span>
              <Input
                type="date"
                value={dateKey}
                max={todayKey}
                onChange={(e) => setDateKey(e.target.value)}
              />
            </label>
            <div className="grid grid-cols-2 gap-2">
              {FIELDS.map(({ key, label }) => (
                <label key={key} className="block">
                  <span className="text-xs text-muted-foreground mb-1 block">{label}</span>
                  <Input
                    type="number"
                    inputMode="decimal"
                    step="0.1"
                    value={form[key] ?? ''}
                    onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                  />
                </label>
              ))}
            </div>
            <div className="flex gap-2">
              <Button className="flex-1" onClick={submit} disabled={!hasAnyValue || logMeasurement.isPending}>
                Save
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setLogging(false)
                  setForm({})
                  setDateKey(todayKey)
                }}
              >
                Cancel
              </Button>
            </div>
          </Card>
        )}

        <section>
          <h3 className="text-sm font-semibold mb-2">History {logs && logs.length > 0 ? `(${logs.length})` : ''}</h3>
          {!logs || logs.length === 0 ? (
            <Card className="p-6 text-center">
              <p className="text-sm text-muted-foreground">No measurements logged yet.</p>
            </Card>
          ) : (
            <div className="space-y-2">
              {logs.map((m) => (
                <MeasurementRow key={m.id} measurement={m} onDelete={() => handleDelete(m)} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

function MeasurementRow({ measurement, onDelete }: { measurement: Measurement; onDelete: () => void }) {
  const entries = FIELDS.filter(({ key }) => measurement[key] != null)
  return (
    <Card className="p-3">
      <div className="flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground mb-1">{formatDate(measurement.date)}</p>
          {entries.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">No values recorded</p>
          ) : (
            <p className="text-sm tabular-nums">
              {entries.map(({ key, label }) => `${label.split(' (')[0]}: ${measurement[key]}`).join(' · ')}
            </p>
          )}
          {measurement.notes && (
            <p className="text-xs italic text-muted-foreground mt-0.5">{measurement.notes}</p>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-destructive"
          onClick={onDelete}
          aria-label="Delete entry"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  )
}

function formatDate(date: number): string {
  return new Date(date).toLocaleDateString(undefined, {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}
