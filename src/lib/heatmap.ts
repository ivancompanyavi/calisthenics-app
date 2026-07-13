import type { WorkoutLog, SetLog } from '@/models/types'

export type HeatmapIntensity = 0 | 1 | 2 | 3 | 4

export interface HeatmapDay {
  /** YYYY-MM-DD local date */
  date: string
  /** Number of completed (non-skipped) sets on this day */
  setCount: number
  intensity: HeatmapIntensity
}

/**
 * 52-column × 7-row grid. weeks[col][row] where col 0 is oldest, col 51 is
 * the current week. Row 0 = Monday, row 6 = Sunday. Cells that fall after
 * `today` are null (future).
 */
export interface HeatmapGrid {
  weeks: (HeatmapDay | null)[][]
  /** YYYY-MM-DD of the first cell in the grid (Monday of week 0) */
  startDate: string
  /** YYYY-MM-DD of today */
  endDate: string
}

/**
 * Convert a timestamp (ms) or Date to a local-date string (YYYY-MM-DD).
 *
 * IMPORTANT: we intentionally use getFullYear/getMonth/getDate (local-clock
 * methods) instead of toISOString().slice(0, 10) which gives a UTC date.
 * Near midnight, UTC and local dates diverge by one day — local is what the
 * user sees on their device, so that's the correct bucket.
 */
export function toLocalDateKey(d: Date | number): string {
  const date = d instanceof Date ? d : new Date(d)
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/**
 * Inverse of toLocalDateKey: parse a YYYY-MM-DD key (e.g. from an
 * <input type="date">) to a timestamp at LOCAL midnight.
 *
 * IMPORTANT: uses the numeric Date constructor (local time) rather than
 * new Date('YYYY-MM-DD'), which parses the string as UTC midnight and can
 * land on the wrong local calendar day for users west of UTC.
 */
export function fromLocalDateKey(key: string): number {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d).getTime()
}

/**
 * Map a completed-set count to a display-intensity bucket.
 *
 * Bucket thresholds are calibrated to typical calisthenics volumes
 * (a full workout is ~20-35 sets):
 *   0  → 0 sets (empty)
 *   1  → 1–9 sets
 *   2  → 10–19 sets
 *   3  → 20–29 sets
 *   4  → 30+ sets
 */
export function toIntensity(count: number): HeatmapIntensity {
  if (count === 0) return 0
  if (count < 10) return 1
  if (count < 20) return 2
  if (count < 30) return 3
  return 4
}

/**
 * Build the 52-week heatmap grid from raw DB rows.
 *
 * @param logs    All WorkoutLog rows (order doesn't matter)
 * @param setLogs All SetLog rows (order doesn't matter)
 * @param today   Anchor date — defaults to `new Date()`. Override in tests to
 *                pin the grid to a known date without mocking system time.
 */
export function buildHeatmapGrid(
  logs: Pick<WorkoutLog, 'id' | 'completedAt'>[],
  setLogs: Pick<SetLog, 'workoutLogId' | 'skipped'>[],
  today: Date = new Date(),
): HeatmapGrid {
  // --- Step 1: count completed (non-skipped) sets per local date ---
  const logCompletedAt = new Map(logs.map((l) => [l.id, l.completedAt]))

  const setCountByDate = new Map<string, number>()
  for (const s of setLogs) {
    if (s.skipped) continue
    const completedAt = logCompletedAt.get(s.workoutLogId)
    if (completedAt == null) continue
    const key = toLocalDateKey(completedAt)
    setCountByDate.set(key, (setCountByDate.get(key) ?? 0) + 1)
  }

  // --- Step 2: compute grid boundaries ---
  // ISO day-of-week: Mon=0 … Sun=6
  const todayDow = (today.getDay() + 6) % 7

  // Monday of today's week (start of the last column)
  const lastColMonday = new Date(today)
  lastColMonday.setDate(today.getDate() - todayDow)
  lastColMonday.setHours(0, 0, 0, 0)

  // Monday of the first column (51 full weeks before the last column)
  const gridStart = new Date(lastColMonday)
  gridStart.setDate(lastColMonday.getDate() - 51 * 7)

  const todayKey = toLocalDateKey(today)

  // --- Step 3: fill the grid ---
  const weeks: (HeatmapDay | null)[][] = []

  for (let col = 0; col < 52; col++) {
    const week: (HeatmapDay | null)[] = []
    for (let row = 0; row < 7; row++) {
      const cellDate = new Date(gridStart)
      cellDate.setDate(gridStart.getDate() + col * 7 + row)
      const dateKey = toLocalDateKey(cellDate)

      if (dateKey > todayKey) {
        // Future day — render as empty/null
        week.push(null)
      } else {
        const setCount = setCountByDate.get(dateKey) ?? 0
        week.push({ date: dateKey, setCount, intensity: toIntensity(setCount) })
      }
    }
    weeks.push(week)
  }

  return {
    weeks,
    startDate: toLocalDateKey(gridStart),
    endDate: todayKey,
  }
}
