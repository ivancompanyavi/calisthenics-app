import type { BodyweightLog } from '@/models/types'

// One auto-flagged observation about the current bodyweight trajectory.
// At most one is surfaced at a time — the first matching rule in the order
// "extreme over the longer window" → "directional trend over 3 weeks" wins.
// Each kind is its own variant so the discriminator narrows cleanly at use
// sites.
export type BodyweightAnnotation =
  | { kind: 'extreme-high'; kg: number; windowDays: number }
  | { kind: 'extreme-low'; kg: number; windowDays: number }
  | { kind: 'trend-up'; deltaKg: number; windowDays: number }
  | { kind: 'trend-down'; deltaKg: number; windowDays: number }

const DAY_MS = 24 * 60 * 60 * 1000

// 3 weeks. The Saturday cadence makes 21 days the natural "this Saturday vs
// the one 3 ago" comparison. Slightly larger lookbacks make a single skipped
// weigh-in too easy to trigger; smaller is too noisy.
const TREND_WINDOW_DAYS = 21
// Below this delta, even a 3-week move isn't worth annotating — within the
// daily-fluctuation band for most adults.
const TREND_MIN_DELTA_KG = 0.5
// Lookback for "highest / lowest in N weeks". 6 weeks matches the macro-cycle
// length in the existing program, so the annotation aligns with re-test days.
const EXTREME_WINDOW_DAYS = 6 * 7
// Don't flag an extreme on the very first entry of the window — need a few
// readings to make "highest" / "lowest" mean anything.
const EXTREME_MIN_ENTRIES = 4

// Pure: given a newest-first list of weigh-ins, return the most salient
// trend observation or null if there isn't enough data / nothing notable.
export function analyzeBodyweightTrend(
  logsNewestFirst: BodyweightLog[],
  now: number = Date.now(),
): BodyweightAnnotation | null {
  if (logsNewestFirst.length === 0) return null
  const latest = logsNewestFirst[0]

  // Extreme check first — a fresh high/low is more novel than a slow drift.
  const extremeCutoff = now - EXTREME_WINDOW_DAYS * DAY_MS
  const extremeWindow = logsNewestFirst.filter((l) => l.date >= extremeCutoff)
  if (extremeWindow.length >= EXTREME_MIN_ENTRIES) {
    const max = Math.max(...extremeWindow.map((l) => l.kg))
    const min = Math.min(...extremeWindow.map((l) => l.kg))
    if (latest.kg === max && max !== min) {
      return { kind: 'extreme-high', kg: latest.kg, windowDays: EXTREME_WINDOW_DAYS }
    }
    if (latest.kg === min && max !== min) {
      return { kind: 'extreme-low', kg: latest.kg, windowDays: EXTREME_WINDOW_DAYS }
    }
  }

  // 3-week trend: find the entry nearest to TREND_WINDOW_DAYS ago.
  const targetDate = latest.date - TREND_WINDOW_DAYS * DAY_MS
  // Need ≥1 entry older than latest to compare against at all.
  if (logsNewestFirst.length < 2) return null
  let nearest = logsNewestFirst[1]
  let nearestDelta = Math.abs(nearest.date - targetDate)
  for (let i = 2; i < logsNewestFirst.length; i++) {
    const d = Math.abs(logsNewestFirst[i].date - targetDate)
    if (d < nearestDelta) {
      nearest = logsNewestFirst[i]
      nearestDelta = d
    }
  }
  // The nearest entry has to actually be reasonably close to the window —
  // a one-month-old gap shouldn't masquerade as a 3-week trend. Allow ±10
  // days of slack to absorb skipped Saturdays.
  if (nearestDelta > 10 * DAY_MS) return null
  const delta = latest.kg - nearest.kg
  if (Math.abs(delta) < TREND_MIN_DELTA_KG) return null
  return {
    kind: delta > 0 ? 'trend-up' : 'trend-down',
    deltaKg: Math.abs(delta),
    windowDays: TREND_WINDOW_DAYS,
  }
}
