import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Scale, Check, X, ChevronRight } from 'lucide-react'
import { useMostRecentBodyweight, useLogBodyweight, useBodyweightLogs } from '@/hooks/useBodyweight'
import { useWeightUnit } from '@/hooks/useSettings'
import { fromKg, toKg, formatWeight } from '@/lib/units'
import { analyzeBodyweightTrend } from '@/lib/bodyweight-trend'
import { BodyweightAnnotation } from '@/components/bodyweight/BodyweightAnnotation'
import { toLocalDateKey, fromLocalDateKey } from '@/lib/heatmap'

// Saturday weigh-in card. The program prescribes weekly weigh-ins to decode
// pull-up regressions (mass-vs-recovery-vs-programming). Surfaces:
//   - the most recent entry as a quick context line
//   - a prompt if no entry in the last 7 days (or it's Saturday and there's
//     no entry from today yet)
//   - a one-tap inline input to log a new value
export function BodyweightCard() {
  const { data: recent } = useMostRecentBodyweight()
  const { data: allLogs } = useBodyweightLogs()
  const logBw = useLogBodyweight()
  const unit = useWeightUnit()
  const [draft, setDraft] = useState('')
  const [editing, setEditing] = useState(false)
  const annotation = analyzeBodyweightTrend(allLogs ?? [])

  // Snapshot "now" once per mount. A Home view rarely lives long enough for
  // the prompt to need re-evaluation (e.g., crossing midnight), and re-running
  // Date.now() on every render is impure under React's rules.
  const [now] = useState(() => Date.now())
  const todayKey = toLocalDateKey(now)
  // Which calendar day this weigh-in is for. Defaults to today; a scale that
  // logged the value earlier lets you backdate to the day you actually weighed.
  const [dateKey, setDateKey] = useState(todayKey)
  const oneWeekMs = 7 * 24 * 60 * 60 * 1000
  const isSaturday = new Date(now).getDay() === 6
  const recentDate = recent?.date
  const overdue = !recentDate || now - recentDate >= oneWeekMs
  const todayIsLogDay = isSaturday && (!recentDate || !sameCalendarDay(recentDate, now))

  const shouldPrompt = overdue || todayIsLogDay

  const submit = async () => {
    const value = Number(draft)
    if (!Number.isFinite(value) || value <= 0) return
    // User types in their preferred unit; storage is always kg.
    const kg = toKg(value, unit)
    const date = dateKey ? fromLocalDateKey(dateKey) : now
    await logBw.mutateAsync({ kg, date })
    setDraft('')
    setDateKey(todayKey)
    setEditing(false)
  }

  if (!editing && !shouldPrompt && !recent) {
    // No prior data, not Saturday, not overdue — render a minimal seed CTA.
    return (
      <Card className="p-3">
        <button
          type="button"
          className="w-full flex items-center gap-3 text-left"
          onClick={() => setEditing(true)}
        >
          <Scale className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Log your bodyweight</span>
        </button>
      </Card>
    )
  }

  return (
    <Card className="p-3">
      <div className="flex items-center gap-3">
        <Scale className={shouldPrompt ? 'h-4 w-4 text-amber-500' : 'h-4 w-4 text-muted-foreground'} />
        <div className="flex-1 min-w-0">
          {editing ? (
            <div className="flex flex-col gap-2">
              <div className="flex gap-2 items-center">
                <Input
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder={unit}
                  className="h-8 text-sm w-20"
                  autoFocus
                />
                <Input
                  type="date"
                  value={dateKey}
                  max={todayKey}
                  onChange={(e) => setDateKey(e.target.value)}
                  aria-label="Weigh-in date"
                  className="h-8 text-sm flex-1 min-w-0"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button size="sm" className="h-8" onClick={submit} disabled={!draft}>
                  <Check className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8"
                  onClick={() => {
                    setEditing(false)
                    setDraft('')
                    setDateKey(todayKey)
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              className="w-full text-left"
              onClick={() => {
                setDraft(recent?.kg != null ? String(fromKg(recent.kg, unit)) : '')
                setEditing(true)
              }}
            >
              {recent ? (
                <>
                  <p className="text-sm">
                    <span className="font-semibold tabular-nums">{formatWeight(recent.kg, unit)}</span>
                    <span className="text-muted-foreground text-xs ml-2">
                      {formatRelative(recent.date, now)}
                    </span>
                  </p>
                  {annotation && !shouldPrompt && (
                    <div className="mt-0.5">
                      <BodyweightAnnotation annotation={annotation} small />
                    </div>
                  )}
                  {shouldPrompt && (
                    <p className="text-xs text-amber-500 mt-0.5">
                      {todayIsLogDay ? "Saturday weigh-in" : "Weekly weigh-in overdue"} — tap to log
                    </p>
                  )}
                </>
              ) : (
                <p className="text-sm text-amber-500">Log your weekly bodyweight</p>
              )}
            </button>
          )}
        </div>
        {/* History affordance — only when there's something to look at and the
            user isn't mid-edit, so we don't crowd the inline form. */}
        {!editing && recent && (
          <Link
            to="/bodyweight"
            aria-label="View bodyweight history"
            className="p-1 -mr-1 rounded-md text-muted-foreground hover:text-foreground"
          >
            <ChevronRight className="h-4 w-4" />
          </Link>
        )}
      </div>
    </Card>
  )
}

function sameCalendarDay(a: number, b: number): boolean {
  const da = new Date(a)
  const db = new Date(b)
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  )
}

function formatRelative(timestamp: number, now: number = Date.now()): string {
  const diffMs = now - timestamp
  const day = 24 * 60 * 60 * 1000
  if (diffMs < day) return 'today'
  const days = Math.floor(diffMs / day)
  if (days === 1) return 'yesterday'
  if (days < 7) return `${days}d ago`
  const weeks = Math.floor(days / 7)
  if (weeks === 1) return 'a week ago'
  return `${weeks}w ago`
}
