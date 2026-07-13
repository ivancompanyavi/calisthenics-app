import { describe, it, expect } from 'vitest'
import {
  toLocalDateKey,
  fromLocalDateKey,
  toIntensity,
  buildHeatmapGrid,
  type HeatmapDay,
} from '../heatmap'

// ---------------------------------------------------------------------------
// fromLocalDateKey — parses a date-input value to local midnight
// ---------------------------------------------------------------------------

describe('fromLocalDateKey', () => {
  it('parses YYYY-MM-DD to a timestamp at LOCAL midnight, not UTC midnight', () => {
    const ts = fromLocalDateKey('2024-01-15')
    const d = new Date(ts)
    expect(d.getFullYear()).toBe(2024)
    expect(d.getMonth()).toBe(0)
    expect(d.getDate()).toBe(15)
    expect(d.getHours()).toBe(0)
    expect(d.getMinutes()).toBe(0)
  })

  it('round-trips with toLocalDateKey', () => {
    for (const key of ['2023-12-31', '2025-03-05', '2024-02-29']) {
      expect(toLocalDateKey(fromLocalDateKey(key))).toBe(key)
    }
  })

  it('lands on the correct local calendar day (guards against UTC-parse drift)', () => {
    // new Date('2024-01-15') would parse as UTC midnight; west of UTC that is
    // still Jan 14 locally. fromLocalDateKey must give the local Jan 15 bucket.
    expect(toLocalDateKey(fromLocalDateKey('2024-01-15'))).toBe('2024-01-15')
  })
})

// ---------------------------------------------------------------------------
// toLocalDateKey — timezone-safety
// ---------------------------------------------------------------------------

describe('toLocalDateKey', () => {
  it('returns YYYY-MM-DD using local date fields, not UTC', () => {
    // Create a Date that is 2024-01-15 at midnight UTC.
    // In a timezone behind UTC (e.g. UTC-5) this is still 2024-01-14 locally.
    // In a timezone ahead of UTC (e.g. UTC+5) this is already 2024-01-15 locally.
    // We pin the result with local methods rather than UTC methods.
    const d = new Date(2024, 0, 15, 0, 0, 0, 0) // local midnight Jan 15
    expect(toLocalDateKey(d)).toBe('2024-01-15')
  })

  it('pads month and day with leading zeros', () => {
    const d = new Date(2025, 2, 5, 12, 0, 0) // Mar 5
    expect(toLocalDateKey(d)).toBe('2025-03-05')
  })

  it('accepts a millisecond timestamp and uses local date', () => {
    // Build a local-midnight timestamp for 2023-12-31
    const d = new Date(2023, 11, 31, 0, 0, 0, 0)
    expect(toLocalDateKey(d.getTime())).toBe('2023-12-31')
  })

  it('does NOT use the UTC date (local vs UTC divergence near midnight)', () => {
    // 2024-03-01 00:30 local time in UTC-8 is 2024-03-01 08:30 UTC — both
    // agree to March 1. The dangerous zone is when UTC ticks to the next day
    // before local does. Simulate: create 23:59 local, compare local vs UTC
    // year/month/day.
    const d = new Date(2024, 0, 31, 23, 59, 0, 0) // 2024-01-31 23:59 local
    const localKey = toLocalDateKey(d)
    // If the system is ahead of UTC, d.toISOString() might already be Feb 1.
    // What matters is that toLocalDateKey() returns the LOCAL date.
    const expectedLocal = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    expect(localKey).toBe(expectedLocal)
    // And specifically does NOT use UTC (which may differ)
    const utcKey = d.toISOString().slice(0, 10)
    // This assertion only fires when UTC and local differ — which depends on
    // the test-runner timezone. We guard so the test stays green in UTC too.
    if (utcKey !== expectedLocal) {
      expect(localKey).not.toBe(utcKey)
    }
  })
})

// ---------------------------------------------------------------------------
// toIntensity
// ---------------------------------------------------------------------------

describe('toIntensity', () => {
  it('returns 0 for 0 sets', () => expect(toIntensity(0)).toBe(0))
  it('returns 1 for 1 set', () => expect(toIntensity(1)).toBe(1))
  it('returns 1 for 9 sets', () => expect(toIntensity(9)).toBe(1))
  it('returns 2 for 10 sets', () => expect(toIntensity(10)).toBe(2))
  it('returns 2 for 19 sets', () => expect(toIntensity(19)).toBe(2))
  it('returns 3 for 20 sets', () => expect(toIntensity(20)).toBe(3))
  it('returns 3 for 29 sets', () => expect(toIntensity(29)).toBe(3))
  it('returns 4 for 30 sets', () => expect(toIntensity(30)).toBe(4))
  it('returns 4 for 100 sets', () => expect(toIntensity(100)).toBe(4))
})

// ---------------------------------------------------------------------------
// buildHeatmapGrid
// ---------------------------------------------------------------------------

/** Tiny stub factories so tests don't import real DB types */
function makeLog(id: string, completedAt: number) {
  return { id, completedAt }
}

function makeSet(workoutLogId: string, skipped = false) {
  return { workoutLogId, skipped }
}

describe('buildHeatmapGrid — grid structure', () => {
  // Pin "today" to a known Wednesday so assertions are deterministic.
  // 2025-01-08 is a Wednesday (getDay() === 3).
  const TODAY = new Date(2025, 0, 8) // Wed Jan 8 2025, local midnight

  it('produces exactly 52 columns and 7 rows', () => {
    const { weeks } = buildHeatmapGrid([], [], TODAY)
    expect(weeks).toHaveLength(52)
    weeks.forEach((w) => expect(w).toHaveLength(7))
  })

  it('sets endDate to today\'s local date key', () => {
    const { endDate } = buildHeatmapGrid([], [], TODAY)
    expect(endDate).toBe('2025-01-08')
  })

  it('sets startDate to Monday 51 weeks before today\'s Monday', () => {
    // Today = Wed Jan 8 2025; today's Monday = Jan 6.
    // 51 weeks before Jan 6 = Jan 6 - 357 days = Jan 14 2024.
    const { startDate } = buildHeatmapGrid([], [], TODAY)
    expect(startDate).toBe('2024-01-15')
  })

  it('last column contains today and no future days beyond today', () => {
    const { weeks } = buildHeatmapGrid([], [], TODAY)
    const lastWeek = weeks[51]
    // Today is Wednesday → rows 0 (Mon), 1 (Tue), 2 (Wed) = present/past;
    // rows 3–6 (Thu–Sun) = future → null
    expect(lastWeek[0]).not.toBeNull() // Mon Jan 6
    expect(lastWeek[1]).not.toBeNull() // Tue Jan 7
    expect(lastWeek[2]).not.toBeNull() // Wed Jan 8 (today)
    expect(lastWeek[3]).toBeNull()     // Thu Jan 9 — future
    expect(lastWeek[4]).toBeNull()     // Fri Jan 10
    expect(lastWeek[5]).toBeNull()     // Sat Jan 11
    expect(lastWeek[6]).toBeNull()     // Sun Jan 12
  })

  it('last non-null day in last column is today', () => {
    const { weeks } = buildHeatmapGrid([], [], TODAY)
    const lastWeek = weeks[51]
    const nonNull = lastWeek.filter((d): d is HeatmapDay => d !== null)
    const last = nonNull[nonNull.length - 1]
    expect(last.date).toBe('2025-01-08')
  })

  it('first cell in the grid is Monday of week 0', () => {
    const { weeks, startDate } = buildHeatmapGrid([], [], TODAY)
    const firstCell = weeks[0][0]
    expect(firstCell).not.toBeNull()
    expect(firstCell!.date).toBe(startDate)
  })
})

describe('buildHeatmapGrid — set counting', () => {
  // Today = Sun Feb 2 2025 (getDay() === 0, dow=6 Mon-indexed)
  const TODAY = new Date(2025, 1, 2) // Feb 2, 2025

  it('counts completed sets and assigns correct intensity', () => {
    // Workout completed Feb 2 with 25 non-skipped sets
    const log = makeLog('log1', new Date(2025, 1, 2, 12, 0, 0).getTime())
    const sets = Array.from({ length: 25 }, () => makeSet('log1'))
    const { weeks } = buildHeatmapGrid([log], sets, TODAY)
    // Feb 2 is Sunday (last column, row 6)
    const lastWeek = weeks[51]
    expect(lastWeek[6]).not.toBeNull()
    expect(lastWeek[6]!.setCount).toBe(25)
    expect(lastWeek[6]!.intensity).toBe(3) // 20–29 → bucket 3
  })

  it('skipped-only days count as empty (intensity 0)', () => {
    const log = makeLog('log2', new Date(2025, 1, 2, 9, 0, 0).getTime())
    const sets = [makeSet('log2', true), makeSet('log2', true)] // all skipped
    const { weeks } = buildHeatmapGrid([log], sets, TODAY)
    const lastWeek = weeks[51]
    expect(lastWeek[6]!.setCount).toBe(0)
    expect(lastWeek[6]!.intensity).toBe(0)
  })

  it('ignores set logs with no matching workout log', () => {
    const sets = [makeSet('orphan')]
    const { weeks } = buildHeatmapGrid([], sets, TODAY)
    const lastWeek = weeks[51]
    expect(lastWeek[6]!.setCount).toBe(0)
  })

  it('accumulates sets from multiple workouts on the same day', () => {
    const ts = new Date(2025, 1, 2, 8, 0, 0).getTime()
    const ts2 = new Date(2025, 1, 2, 18, 0, 0).getTime()
    const logs = [makeLog('a', ts), makeLog('b', ts2)]
    const sets = [
      ...Array.from({ length: 5 }, () => makeSet('a')),
      ...Array.from({ length: 8 }, () => makeSet('b')),
    ]
    const { weeks } = buildHeatmapGrid(logs, sets, TODAY)
    expect(weeks[51][6]!.setCount).toBe(13)
    expect(weeks[51][6]!.intensity).toBe(2) // 10–19 → bucket 2
  })
})

describe('buildHeatmapGrid — year boundary', () => {
  // Anchor on Jan 1, 2025 (a Wednesday).
  const TODAY = new Date(2025, 0, 1) // Wed Jan 1 2025

  it('correctly places a workout logged on Dec 31 2024', () => {
    const log = makeLog('log-dec31', new Date(2024, 11, 31, 20, 0, 0).getTime())
    const sets = [makeSet('log-dec31'), makeSet('log-dec31')]
    const { weeks } = buildHeatmapGrid([log], sets, TODAY)

    // Today = Wed Jan 1 2025; dow=2 (Mon=0). Today's Monday = Dec 30 2024.
    // Last column: Dec 30 (Mon) … Jan 5 (Sun), but Jan 2–5 are null (future).
    // Dec 31 2024 = row 1 (Tuesday) of the last column.
    const lastWeek = weeks[51]
    const dec31Cell = lastWeek[1]
    expect(dec31Cell).not.toBeNull()
    expect(dec31Cell!.date).toBe('2024-12-31')
    expect(dec31Cell!.setCount).toBe(2)
  })

  it('correctly assigns startDate to a date in the previous year', () => {
    const { startDate } = buildHeatmapGrid([], [], TODAY)
    // Today = Jan 1 2025; Monday of this week = Dec 30 2024.
    // 51 weeks before Dec 30 = Dec 30 - 357 days = Jan 7 2024.
    expect(startDate).toBe('2024-01-08')
  })
})

describe('buildHeatmapGrid — when today is Monday', () => {
  // Mon Jan 6 2025
  const TODAY = new Date(2025, 0, 6)

  it('last column row 0 is today, rows 1–6 are null', () => {
    const { weeks } = buildHeatmapGrid([], [], TODAY)
    const last = weeks[51]
    expect(last[0]!.date).toBe('2025-01-06')
    for (let r = 1; r <= 6; r++) {
      expect(last[r]).toBeNull()
    }
  })
})

describe('buildHeatmapGrid — when today is Sunday', () => {
  // Sun Jan 12 2025
  const TODAY = new Date(2025, 0, 12)

  it('entire last column is non-null (full week)', () => {
    const { weeks } = buildHeatmapGrid([], [], TODAY)
    const last = weeks[51]
    expect(last.every((d) => d !== null)).toBe(true)
    expect(last[0]!.date).toBe('2025-01-06') // Mon
    expect(last[6]!.date).toBe('2025-01-12') // Sun (today)
  })
})
