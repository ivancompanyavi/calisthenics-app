// Pure nutrition-trend helpers for Phase 2 (fast logging + trends). No Dexie
// imports here — everything takes plain arrays so it's trivially unit
// testable and reusable from both the app and (eventually) reporting scripts.
//
// Day-grouping convention: FoodLog.date is already normalized to
// start-of-day-local by foodLogRepository.add (see startOfDay there). These
// helpers trust that invariant rather than re-deriving it, matching how the
// rest of the app reads FoodLog.date.

import type { BodyweightLog, FoodLog, NutritionTarget } from '@/models/types'

const DAY_MS = 24 * 60 * 60 * 1000
const WEEK_MS = 7 * DAY_MS
// Standard energy-density-of-fat approximation, matching scripts/coach-report.mjs.
const KCAL_PER_KG = 7700

export interface DayMacroTotals {
  date: number
  kcal: number
  proteinG: number
  carbG: number
  fatG: number
  fiberG: number
}

// Per-day macro totals across every day that has at least one logged entry.
// Sorted ascending by date. Empty input yields an empty array.
export function dailyTotals(foodLogs: FoodLog[]): DayMacroTotals[] {
  const byDay = new Map<number, DayMacroTotals>()
  for (const log of foodLogs) {
    const existing = byDay.get(log.date)
    if (existing) {
      existing.kcal += log.kcal
      existing.proteinG += log.proteinG
      existing.carbG += log.carbG
      existing.fatG += log.fatG
      existing.fiberG += log.fiberG
    } else {
      byDay.set(log.date, {
        date: log.date,
        kcal: log.kcal,
        proteinG: log.proteinG,
        carbG: log.carbG,
        fatG: log.fatG,
        fiberG: log.fiberG,
      })
    }
  }
  return [...byDay.values()].sort((a, b) => a.date - b.date)
}

export interface WeeklyAverage {
  weekStart: number
  avgKcal: number
  avgProtein: number
  loggedDays: number
}

// Per-ISO-week averages over the most recent `weeks` weeks (default 8),
// anchored to `now`. Averages are computed over logged days only within each
// week — an unlogged day doesn't dilute the average toward zero. Weeks with
// zero logged days are omitted entirely. Sorted ascending by weekStart.
export function weeklyAverages(foodLogs: FoodLog[], weeks: number = 8, now: number = Date.now()): WeeklyAverage[] {
  const totals = dailyTotals(foodLogs)
  if (totals.length === 0) return []

  // Anchor week boundaries to the ISO week (Monday start) containing `now`,
  // so "this week so far" is always the last bucket rather than a partial
  // window drifting with the data's own date range.
  const nowWeekStart = startOfIsoWeek(now)
  const windowStart = nowWeekStart - (weeks - 1) * WEEK_MS

  const byWeek = new Map<number, { kcalSum: number; proteinSum: number; loggedDays: number }>()
  for (const day of totals) {
    if (day.date < windowStart) continue
    if (day.date >= nowWeekStart + WEEK_MS) continue
    const weekStart = startOfIsoWeek(day.date)
    const bucket = byWeek.get(weekStart) ?? { kcalSum: 0, proteinSum: 0, loggedDays: 0 }
    bucket.kcalSum += day.kcal
    bucket.proteinSum += day.proteinG
    bucket.loggedDays += 1
    byWeek.set(weekStart, bucket)
  }

  return [...byWeek.entries()]
    .map(([weekStart, b]) => ({
      weekStart,
      avgKcal: b.kcalSum / b.loggedDays,
      avgProtein: b.proteinSum / b.loggedDays,
      loggedDays: b.loggedDays,
    }))
    .sort((a, b) => a.weekStart - b.weekStart)
}

function startOfIsoWeek(date: number): number {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  // getDay(): 0 = Sunday … 6 = Saturday. ISO week starts Monday, so Sunday
  // needs to roll back 6 days rather than 0.
  const day = d.getDay()
  const diffToMonday = day === 0 ? 6 : day - 1
  d.setDate(d.getDate() - diffToMonday)
  return d.getTime()
}

export interface AdherenceDay {
  date: number
  kcal: number
  proteinG: number
  targetKcal: number
  targetProteinG: number
  kcalDelta: number
  proteinDelta: number
}

// Recent per-day kcal & protein vs. a fixed target, for the trailing `days`
// window (default 14) ending at `now`. Only days with at least one logged
// entry are included — this is a logged-day series, not a padded calendar.
export function adherenceSeries(
  foodLogs: FoodLog[],
  target: Pick<NutritionTarget, 'kcal' | 'proteinG'> | undefined,
  days: number = 14,
  now: number = Date.now(),
): AdherenceDay[] {
  if (!target) return []
  const totals = dailyTotals(foodLogs)
  const windowStart = now - days * DAY_MS
  return totals
    .filter((d) => d.date >= windowStart && d.date <= now)
    .map((d) => ({
      date: d.date,
      kcal: d.kcal,
      proteinG: d.proteinG,
      targetKcal: target.kcal,
      targetProteinG: target.proteinG,
      kcalDelta: d.kcal - target.kcal,
      proteinDelta: d.proteinG - target.proteinG,
    }))
}

export type TDEESuggestion = 'raise' | 'lower' | 'hold'

export interface TDEEEstimate {
  tdee: number
  avgKcal: number
  weightChangeKg: number
  elapsedDays: number
  suggestion: TDEESuggestion
  insufficientData?: never
}

export interface TDEEInsufficientData {
  insufficientData: true
  elapsedDays: number
  loggedDays: number
}

const TDEE_MIN_LOGGED_DAYS = 10

// Mirrors the adaptive-TDEE formula in scripts/coach-report.mjs: over a
// trailing window anchored to two real bodyweight readings (not a fixed
// calendar window — a sparser weigh-in cadence just widens it),
//   estimatedTDEE = avgDailyKcal - (weightChangeKg * 7700 / elapsedDays)
// Requires >= windowDays elapsed between the reference and latest bodyweight
// reading AND >= 10 logged food-days inside that span; otherwise returns
// { insufficientData: true } with whatever partial context is available.
// currentTargetKcal (optional) drives the raise/lower/hold suggestion using a
// ±100 kcal band, same as the coach report's "roughly matches" threshold.
export function estimateTDEE(
  foodLogs: FoodLog[],
  bodyweightLogs: BodyweightLog[],
  windowDays: number = 14,
  currentTargetKcal?: number,
  now: number = Date.now(),
): TDEEEstimate | TDEEInsufficientData {
  const totals = dailyTotals(foodLogs)
  const byDay = new Map(totals.map((d) => [d.date, d]))
  const sortedDayKeys = [...byDay.keys()].sort((a, b) => a - b)

  const sortedBW = [...bodyweightLogs].sort((a, b) => a.date - b.date)
  if (sortedBW.length === 0) {
    return { insufficientData: true, elapsedDays: 0, loggedDays: 0 }
  }

  const windowStart = now - windowDays * DAY_MS
  const before = sortedBW.filter((l) => l.date <= windowStart)
  const reference = before.length > 0 ? before[before.length - 1] : sortedBW[0]
  const latest = sortedBW[sortedBW.length - 1]
  const elapsedDays = (latest.date - reference.date) / DAY_MS
  const loggedDayKeysInWindow = sortedDayKeys.filter((d) => d >= reference.date && d <= latest.date)

  if (elapsedDays < windowDays || loggedDayKeysInWindow.length < TDEE_MIN_LOGGED_DAYS) {
    return {
      insufficientData: true,
      elapsedDays: Math.round(elapsedDays),
      loggedDays: loggedDayKeysInWindow.length,
    }
  }

  const totalKcalInWindow = loggedDayKeysInWindow.reduce((sum, d) => sum + (byDay.get(d)?.kcal ?? 0), 0)
  const avgKcal = totalKcalInWindow / elapsedDays
  const weightChangeKg = latest.kg - reference.kg
  const tdee = avgKcal - (weightChangeKg * KCAL_PER_KG) / elapsedDays

  let suggestion: TDEESuggestion = 'hold'
  if (currentTargetKcal !== undefined) {
    const delta = tdee - currentTargetKcal
    if (delta > 100) suggestion = 'raise'
    else if (delta < -100) suggestion = 'lower'
  }

  return {
    tdee,
    avgKcal,
    weightChangeKg,
    elapsedDays: Math.round(elapsedDays),
    suggestion,
  }
}
