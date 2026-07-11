import { describe, expect, it } from 'vitest'
import type { BodyweightLog, FoodLog } from '@/models/types'
import {
  adherenceSeries,
  dailyTotals,
  estimateTDEE,
  weeklyAverages,
} from '@/lib/nutrition-trends'

// Helper: build an epoch-ms timestamp for a given Y/M/D at a given hour, so
// tests can construct entries that land on the same or different calendar
// days without depending on the machine's current date. Mirrors the `ts`
// helper in foodLog.repository.test.ts.
function ts(year: number, month: number, day: number, hour = 12): number {
  return new Date(year, month - 1, day, hour, 0, 0, 0).getTime()
}

function startOfDay(date: number): number {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

let idCounter = 0
function makeLog(overrides: Partial<FoodLog> & { loggedAt: number }): FoodLog {
  idCounter += 1
  return {
    id: `log-${idCounter}`,
    date: startOfDay(overrides.loggedAt),
    source: 'quickadd',
    name: 'Food',
    kcal: 0,
    proteinG: 0,
    carbG: 0,
    fatG: 0,
    fiberG: 0,
    ...overrides,
  }
}

function makeBW(date: number, kg: number): BodyweightLog {
  idCounter += 1
  return { id: `bw-${idCounter}`, date: startOfDay(date), kg }
}

describe('dailyTotals', () => {
  it('sums macros per calendar day and sorts ascending', () => {
    const logs: FoodLog[] = [
      makeLog({ loggedAt: ts(2026, 7, 9, 20), kcal: 500, proteinG: 40, carbG: 50, fatG: 15, fiberG: 5 }),
      makeLog({ loggedAt: ts(2026, 7, 9, 8), kcal: 300, proteinG: 20, carbG: 30, fatG: 10, fiberG: 2 }),
      makeLog({ loggedAt: ts(2026, 7, 8, 8), kcal: 100, proteinG: 5, carbG: 10, fatG: 2, fiberG: 1 }),
    ]

    const totals = dailyTotals(logs)

    expect(totals).toHaveLength(2)
    expect(totals[0].date).toBe(startOfDay(ts(2026, 7, 8)))
    expect(totals[1].date).toBe(startOfDay(ts(2026, 7, 9)))
    expect(totals[1]).toEqual({
      date: startOfDay(ts(2026, 7, 9)),
      kcal: 800,
      proteinG: 60,
      carbG: 80,
      fatG: 25,
      fiberG: 7,
    })
  })

  it('returns an empty array for no entries', () => {
    expect(dailyTotals([])).toEqual([])
  })
})

describe('weeklyAverages', () => {
  it('averages only over logged days and buckets by ISO (Monday-start) week', () => {
    // Week of Mon 2026-07-06..Sun 2026-07-12 ("this week", anchored to `now`).
    // Log two days in that week: Mon (2100 kcal) and Wed (1900 kcal) -> avg 2000.
    const now = ts(2026, 7, 9, 12) // Thursday
    const logs: FoodLog[] = [
      makeLog({ loggedAt: ts(2026, 7, 6, 8), kcal: 2100, proteinG: 150, carbG: 0, fatG: 0, fiberG: 0 }),
      makeLog({ loggedAt: ts(2026, 7, 8, 8), kcal: 1900, proteinG: 130, carbG: 0, fatG: 0, fiberG: 0 }),
    ]

    const result = weeklyAverages(logs, 2, now)

    const thisWeek = result.find((w) => w.weekStart === startOfDay(ts(2026, 7, 6)))
    expect(thisWeek).toBeDefined()
    expect(thisWeek?.loggedDays).toBe(2)
    expect(thisWeek?.avgKcal).toBe(2000)
    expect(thisWeek?.avgProtein).toBe(140)
  })

  it('omits weeks with zero logged days', () => {
    const now = ts(2026, 7, 9, 12)
    // Only log in the current week; the prior week (in the 2-week window) has nothing.
    const logs: FoodLog[] = [
      makeLog({ loggedAt: ts(2026, 7, 8, 8), kcal: 2000, proteinG: 100, carbG: 0, fatG: 0, fiberG: 0 }),
    ]

    const result = weeklyAverages(logs, 2, now)

    expect(result).toHaveLength(1)
    expect(result[0].weekStart).toBe(startOfDay(ts(2026, 7, 6)))
  })

  it('returns an empty array for no entries', () => {
    expect(weeklyAverages([], 8, ts(2026, 7, 9))).toEqual([])
  })

  it('sorts results ascending by weekStart', () => {
    const now = ts(2026, 7, 20, 12)
    const logs: FoodLog[] = [
      // Week of 2026-07-13
      makeLog({ loggedAt: ts(2026, 7, 14, 8), kcal: 2000, proteinG: 100, carbG: 0, fatG: 0, fiberG: 0 }),
      // Week of 2026-07-06
      makeLog({ loggedAt: ts(2026, 7, 7, 8), kcal: 1800, proteinG: 90, carbG: 0, fatG: 0, fiberG: 0 }),
    ]

    const result = weeklyAverages(logs, 3, now)
    const weekStarts = result.map((w) => w.weekStart)
    expect(weekStarts).toEqual([...weekStarts].sort((a, b) => a - b))
  })
})

describe('adherenceSeries', () => {
  const target = { kcal: 2200, proteinG: 160 }

  it('returns [] when target is undefined', () => {
    const logs = [makeLog({ loggedAt: ts(2026, 7, 9, 8), kcal: 2000, proteinG: 150, carbG: 0, fatG: 0, fiberG: 0 })]
    expect(adherenceSeries(logs, undefined, 14, ts(2026, 7, 9))).toEqual([])
  })

  it('computes deltas vs target for logged days only, within the trailing window', () => {
    const now = ts(2026, 7, 9, 12)
    const logs: FoodLog[] = [
      makeLog({ loggedAt: ts(2026, 7, 9, 8), kcal: 2300, proteinG: 170, carbG: 0, fatG: 0, fiberG: 0 }),
      // Outside the 1-day window.
      makeLog({ loggedAt: ts(2026, 7, 1, 8), kcal: 1000, proteinG: 50, carbG: 0, fatG: 0, fiberG: 0 }),
    ]

    const result = adherenceSeries(logs, target, 1, now)

    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({
      date: startOfDay(ts(2026, 7, 9)),
      kcal: 2300,
      proteinG: 170,
      targetKcal: 2200,
      targetProteinG: 160,
      kcalDelta: 100,
      proteinDelta: 10,
    })
  })

  it('excludes unlogged days rather than padding them in', () => {
    const now = ts(2026, 7, 9, 12)
    const logs: FoodLog[] = [
      makeLog({ loggedAt: ts(2026, 7, 9, 8), kcal: 2200, proteinG: 160, carbG: 0, fatG: 0, fiberG: 0 }),
    ]
    // 5-day window but only one logged day exists.
    const result = adherenceSeries(logs, target, 5, now)
    expect(result).toHaveLength(1)
  })
})

describe('estimateTDEE', () => {
  it('computes tdee via the coach-report formula on a synthetic 14+ day dataset', () => {
    const now = ts(2026, 7, 20, 12)
    const referenceDate = ts(2026, 7, 1)
    const latestDate = ts(2026, 7, 15) // 14 days elapsed

    const bodyweightLogs: BodyweightLog[] = [
      makeBW(referenceDate, 80),
      makeBW(latestDate, 79), // lost 1kg over 14 days
    ]

    // 14 distinct logged days within [referenceDate, latestDate], each 2500 kcal.
    const foodLogs: FoodLog[] = []
    for (let d = 1; d <= 14; d++) {
      foodLogs.push(
        makeLog({ loggedAt: ts(2026, 7, d, 8), kcal: 2500, proteinG: 180, carbG: 0, fatG: 0, fiberG: 0 }),
      )
    }

    const result = estimateTDEE(foodLogs, bodyweightLogs, 14, undefined, now)

    expect(result.insufficientData).toBeUndefined()
    const est = result as Exclude<typeof result, { insufficientData: true }>
    expect(est.elapsedDays).toBe(14)
    expect(est.avgKcal).toBeCloseTo(2500, 5)
    expect(est.weightChangeKg).toBeCloseTo(-1, 5)
    // tdee = 2500 - (-1 * 7700 / 14) = 2500 + 550 = 3050
    expect(est.tdee).toBeCloseTo(3050, 5)
  })

  it('suggests raise/lower/hold relative to currentTargetKcal using a ±100 kcal band', () => {
    const now = ts(2026, 7, 20, 12)
    const referenceDate = ts(2026, 7, 1)
    const latestDate = ts(2026, 7, 15)
    const bodyweightLogs: BodyweightLog[] = [makeBW(referenceDate, 80), makeBW(latestDate, 79)]
    const foodLogs: FoodLog[] = []
    for (let d = 1; d <= 14; d++) {
      foodLogs.push(
        makeLog({ loggedAt: ts(2026, 7, d, 8), kcal: 2500, proteinG: 180, carbG: 0, fatG: 0, fiberG: 0 }),
      )
    }
    // tdee is 3050 in this dataset.
    const raise = estimateTDEE(foodLogs, bodyweightLogs, 14, 2800, now)
    const lower = estimateTDEE(foodLogs, bodyweightLogs, 14, 3300, now)
    const hold = estimateTDEE(foodLogs, bodyweightLogs, 14, 3060, now)

    expect((raise as { suggestion: string }).suggestion).toBe('raise')
    expect((lower as { suggestion: string }).suggestion).toBe('lower')
    expect((hold as { suggestion: string }).suggestion).toBe('hold')
  })

  it('holds when currentTargetKcal is undefined', () => {
    const now = ts(2026, 7, 20, 12)
    const bodyweightLogs: BodyweightLog[] = [makeBW(ts(2026, 7, 1), 80), makeBW(ts(2026, 7, 15), 79)]
    const foodLogs: FoodLog[] = []
    for (let d = 1; d <= 14; d++) {
      foodLogs.push(
        makeLog({ loggedAt: ts(2026, 7, d, 8), kcal: 2500, proteinG: 180, carbG: 0, fatG: 0, fiberG: 0 }),
      )
    }
    const result = estimateTDEE(foodLogs, bodyweightLogs, 14, undefined, now)
    expect((result as { suggestion: string }).suggestion).toBe('hold')
  })

  it('returns insufficientData when fewer than 10 logged days exist in the window', () => {
    const now = ts(2026, 7, 20, 12)
    const bodyweightLogs: BodyweightLog[] = [makeBW(ts(2026, 7, 1), 80), makeBW(ts(2026, 7, 15), 79)]
    // Only 5 logged days.
    const foodLogs: FoodLog[] = []
    for (let d = 1; d <= 5; d++) {
      foodLogs.push(
        makeLog({ loggedAt: ts(2026, 7, d, 8), kcal: 2500, proteinG: 180, carbG: 0, fatG: 0, fiberG: 0 }),
      )
    }

    const result = estimateTDEE(foodLogs, bodyweightLogs, 14, undefined, now)

    expect(result.insufficientData).toBe(true)
    const insufficient = result as { insufficientData: true; elapsedDays: number; loggedDays: number }
    expect(insufficient.loggedDays).toBe(5)
    expect(insufficient.elapsedDays).toBe(14)
  })

  it('returns insufficientData when fewer than windowDays have elapsed between bodyweight readings', () => {
    const now = ts(2026, 7, 20, 12)
    // Only 7 days between reference and latest bodyweight reading.
    const bodyweightLogs: BodyweightLog[] = [makeBW(ts(2026, 7, 1), 80), makeBW(ts(2026, 7, 8), 79.5)]
    const foodLogs: FoodLog[] = []
    for (let d = 1; d <= 7; d++) {
      foodLogs.push(
        makeLog({ loggedAt: ts(2026, 7, d, 8), kcal: 2500, proteinG: 180, carbG: 0, fatG: 0, fiberG: 0 }),
      )
    }

    const result = estimateTDEE(foodLogs, bodyweightLogs, 14, undefined, now)

    expect(result.insufficientData).toBe(true)
    expect((result as { elapsedDays: number }).elapsedDays).toBe(7)
  })

  it('returns insufficientData when there are no bodyweight logs at all', () => {
    const result = estimateTDEE([], [], 14, undefined, ts(2026, 7, 20))
    expect(result).toEqual({ insufficientData: true, elapsedDays: 0, loggedDays: 0 })
  })
})
