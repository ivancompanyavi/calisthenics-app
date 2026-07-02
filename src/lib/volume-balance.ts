import type { MovementFamily, SetLog, WorkoutLog } from '@/models/types'

// ── Thresholds ────────────────────────────────────────────────────────────────

/**
 * Maximum allowed deviation (in percentage points) of a family's weekly share
 * from its own trailing-4-week mean before a family-share drift warning fires.
 */
export const FAMILY_SHARE_DRIFT_THRESHOLD_PP = 15

/**
 * Maximum allowed ratio of "off-dominant-family" sets within a single workout
 * before a cross-day drift warning fires.  0.20 = 20 % of the workout's sets.
 */
export const CROSS_DAY_DRIFT_THRESHOLD_RATIO = 0.2

/** Number of trailing ISO weeks displayed in the family-split chart. */
export const TRAILING_WEEKS_DISPLAY = 8

/**
 * Number of prior weeks (excluding the current/latest week) used when
 * computing the baseline mean for family-share drift detection.
 */
export const TRAILING_WEEKS_FOR_MEAN = 4

// ── Types ─────────────────────────────────────────────────────────────────────

export const FAMILIES: MovementFamily[] = ['push', 'pull', 'legs', 'core']

export interface WeeklyFamilySplit {
  /** ISO Monday of the week, 'YYYY-MM-DD' */
  weekStart: string
  /** Short display label, e.g. '6/30' */
  weekLabel: string
  /** Non-skipped, non-warmup set counts per family (only families with > 0) */
  counts: Partial<Record<MovementFamily, number>>
  /** Total sets with a known family this week */
  total: number
}

export interface FamilyShareWarning {
  kind: 'family-share'
  family: MovementFamily
  currentSharePct: number
  trailingMeanSharePct: number
  deviationPP: number
  text: string
}

export interface CrossDayDriftWarning {
  kind: 'cross-day-drift'
  workoutName: string
  dominantFamily: MovementFamily
  driftRatio: number
  text: string
}

export type VolumeWarning = FamilyShareWarning | CrossDayDriftWarning

// ── Narrow input shapes ───────────────────────────────────────────────────────
// Functions accept minimal picks so they're easy to test with plain objects and
// will keep working once the future `warmup` flag lands on SetLog.

type SetLogInput = Pick<SetLog, 'workoutLogId' | 'movementId' | 'skipped'> & {
  warmup?: boolean
}

type WorkoutLogInput = Pick<WorkoutLog, 'id' | 'completedAt'>
type WorkoutLogWithName = Pick<WorkoutLog, 'id' | 'workoutName' | 'completedAt'>

// ── Internal helpers ──────────────────────────────────────────────────────────

/** Local-clock YYYY-MM-DD string from a millisecond timestamp. */
function toDateKey(ts: number): string {
  const d = new Date(ts)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/**
 * Returns a new Date set to local midnight of the Monday of the ISO week
 * containing `ts`.  ISO weeks start on Monday.
 */
function getMondayOfWeek(ts: number): Date {
  const d = new Date(ts)
  d.setHours(0, 0, 0, 0)
  // getDay() → 0 = Sun, 1 = Mon, …, 6 = Sat
  // Steps back to Monday: Sun → 6, Mon → 0, Tue → 1, …, Sat → 5
  const toMonday = d.getDay() === 0 ? 6 : d.getDay() - 1
  d.setDate(d.getDate() - toMonday)
  return d
}

/** Short 'M/D' label for a Monday Date, e.g. '6/30'. */
function toWeekLabel(monday: Date): string {
  return `${monday.getMonth() + 1}/${monday.getDate()}`
}

/** Whether a set should be counted (not skipped, not a warmup). */
function isCounted(sl: SetLogInput): boolean {
  if (sl.skipped) return false
  if (sl.warmup === true) return false
  return true
}

// ── Core aggregation ──────────────────────────────────────────────────────────

/**
 * Build a weekly family split for the trailing `weeksBack` ISO weeks
 * (oldest → newest, current/partial week last).
 *
 * @param setLogs            All set logs to consider
 * @param workoutLogs        All workout logs to consider
 * @param familyByMovement   Map<movementId, MovementFamily>;
 *                           movements not in the map are skipped
 * @param weeksBack          How many trailing ISO weeks to include (default 8)
 * @param now                Reference timestamp (default Date.now())
 */
export function computeWeeklyFamilySplit(
  setLogs: SetLogInput[],
  workoutLogs: WorkoutLogInput[],
  familyByMovement: Map<string, MovementFamily>,
  weeksBack = TRAILING_WEEKS_DISPLAY,
  now = Date.now(),
): WeeklyFamilySplit[] {
  // Build week slots oldest → newest
  const currentMonday = getMondayOfWeek(now)
  const slots: WeeklyFamilySplit[] = []
  for (let i = weeksBack - 1; i >= 0; i--) {
    const monday = new Date(currentMonday)
    monday.setDate(monday.getDate() - i * 7)
    slots.push({
      weekStart: toDateKey(monday.getTime()),
      weekLabel: toWeekLabel(monday),
      counts: {},
      total: 0,
    })
  }

  // Map each workout log id to a slot index (if within the window)
  const logIdToSlot = new Map<string, number>()
  for (const wl of workoutLogs) {
    const monday = getMondayOfWeek(wl.completedAt)
    const key = toDateKey(monday.getTime())
    const idx = slots.findIndex((s) => s.weekStart === key)
    if (idx !== -1) logIdToSlot.set(wl.id, idx)
  }

  // Aggregate set counts into slots
  for (const sl of setLogs) {
    if (!isCounted(sl)) continue
    const family = familyByMovement.get(sl.movementId)
    if (!family) continue
    const slotIdx = logIdToSlot.get(sl.workoutLogId)
    if (slotIdx === undefined) continue
    const slot = slots[slotIdx]
    slot.counts[family] = (slot.counts[family] ?? 0) + 1
    slot.total++
  }

  return slots
}

// ── Warning 1: family-share drift ────────────────────────────────────────────

/**
 * For the most recent week in `splits`, emit a warning for any family whose
 * share deviates more than FAMILY_SHARE_DRIFT_THRESHOLD_PP percentage points
 * from its own trailing-TRAILING_WEEKS_FOR_MEAN-week mean.
 *
 * Only weeks with at least one set contribute to the trailing mean.
 * The current week is always excluded from the mean calculation.
 */
export function computeFamilyShareWarnings(
  splits: WeeklyFamilySplit[],
): FamilyShareWarning[] {
  if (splits.length < 2) return []

  const current = splits[splits.length - 1]
  if (current.total === 0) return []

  // Prior N weeks, excluding current
  const priorWeeks = splits.slice(
    Math.max(0, splits.length - 1 - TRAILING_WEEKS_FOR_MEAN),
    splits.length - 1,
  )
  if (priorWeeks.length === 0) return []

  const warnings: FamilyShareWarning[] = []

  for (const family of FAMILIES) {
    const currentShare = ((current.counts[family] ?? 0) / current.total) * 100

    // Trailing mean — only include weeks that had any sets
    const weeklyShares = priorWeeks
      .filter((w) => w.total > 0)
      .map((w) => ((w.counts[family] ?? 0) / w.total) * 100)

    if (weeklyShares.length === 0) continue

    const trailingMean =
      weeklyShares.reduce((acc, v) => acc + v, 0) / weeklyShares.length
    const deviation = Math.abs(currentShare - trailingMean)

    if (deviation > FAMILY_SHARE_DRIFT_THRESHOLD_PP) {
      const dir = currentShare > trailingMean ? 'higher' : 'lower'
      warnings.push({
        kind: 'family-share',
        family,
        currentSharePct: Math.round(currentShare),
        trailingMeanSharePct: Math.round(trailingMean),
        deviationPP: Math.round(deviation),
        text: `${capitalize(family)} volume ${dir} than usual (${Math.round(currentShare)}% vs ${Math.round(trailingMean)}% 4-wk avg)`,
      })
    }
  }

  return warnings
}

// ── Warning 2: cross-day drift ────────────────────────────────────────────────

/**
 * For each workout log in the trailing-8-week window, check whether the sets
 * from non-dominant families exceed CROSS_DAY_DRIFT_THRESHOLD_RATIO of that
 * workout's counted sets.  Emit one warning per offending workout.
 *
 * "Dominant family" = family with the most counted sets in that workout.
 * Ties are broken by FAMILIES order (push > pull > legs > core).
 */
export function computeCrossDayDriftWarnings(
  setLogs: SetLogInput[],
  workoutLogs: WorkoutLogWithName[],
  familyByMovement: Map<string, MovementFamily>,
  now = Date.now(),
): CrossDayDriftWarning[] {
  // Window: the same trailing-8-week range used for the split chart
  const currentMonday = getMondayOfWeek(now)
  const windowStart = new Date(currentMonday)
  windowStart.setDate(windowStart.getDate() - (TRAILING_WEEKS_DISPLAY - 1) * 7)

  const warnings: CrossDayDriftWarning[] = []

  for (const wl of workoutLogs) {
    if (wl.completedAt < windowStart.getTime()) continue

    // Collect counted sets with a known family for this workout
    const workoutSets = setLogs.filter(
      (sl) => sl.workoutLogId === wl.id && isCounted(sl) && familyByMovement.has(sl.movementId),
    )
    if (workoutSets.length === 0) continue

    // Count sets per family
    const familyCounts = new Map<MovementFamily, number>()
    for (const sl of workoutSets) {
      const f = familyByMovement.get(sl.movementId)!
      familyCounts.set(f, (familyCounts.get(f) ?? 0) + 1)
    }

    // Dominant family (most sets; ties broken by FAMILIES order)
    let dominantFamily: MovementFamily = FAMILIES[0]
    let dominantCount = 0
    for (const f of FAMILIES) {
      const count = familyCounts.get(f) ?? 0
      if (count > dominantCount) {
        dominantCount = count
        dominantFamily = f
      }
    }

    const totalSets = workoutSets.length
    const offFamilySets = totalSets - dominantCount
    const driftRatio = offFamilySets / totalSets

    if (driftRatio > CROSS_DAY_DRIFT_THRESHOLD_RATIO) {
      const driftPct = Math.round(driftRatio * 100)
      warnings.push({
        kind: 'cross-day-drift',
        workoutName: wl.workoutName,
        dominantFamily,
        driftRatio,
        text: `"${wl.workoutName}" has ${driftPct}% off-family sets (dominant: ${dominantFamily})`,
      })
    }
  }

  return warnings
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}
