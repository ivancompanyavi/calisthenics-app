import './setup'
import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '@/db'
import { foodLogRepository } from '@/repositories/foodLog.repository'
import { clearAllTables } from './setup'

// Helper: build an epoch-ms timestamp for a given Y/M/D at a given hour, so
// tests can construct entries that land on the same or different calendar
// days without depending on the machine's current date.
function ts(year: number, month: number, day: number, hour = 12): number {
  return new Date(year, month - 1, day, hour, 0, 0, 0).getTime()
}

describe('foodLogRepository', () => {
  beforeEach(async () => {
    await clearAllTables()
  })

  describe('add', () => {
    it('defaults date to the start-of-day of loggedAt when date is omitted', async () => {
      const loggedAt = ts(2026, 7, 9, 14) // 2pm
      const entry = await foodLogRepository.add({
        loggedAt,
        source: 'quickadd',
        name: 'Chicken Breast',
        kcal: 200, proteinG: 40, carbG: 0, fatG: 4, fiberG: 0,
      })

      expect(entry.date).toBe(ts(2026, 7, 9, 0))
      expect(entry.loggedAt).toBe(loggedAt)
      expect(entry.id).toBeTruthy()

      const stored = await db.foodLogs.get(entry.id)
      expect(stored?.date).toBe(ts(2026, 7, 9, 0))
    })

    it('honors an explicit date override, normalized to its own start-of-day', async () => {
      const entry = await foodLogRepository.add({
        date: ts(2026, 7, 5, 23),
        loggedAt: ts(2026, 7, 9, 14),
        source: 'custom',
        name: 'Rice',
        kcal: 130, proteinG: 3, carbG: 28, fatG: 0, fiberG: 0,
      })

      expect(entry.date).toBe(ts(2026, 7, 5, 0))
    })
  })

  describe('getInDateRange', () => {
    it('returns entries whose day is within [start, end] inclusive, excluding outside', async () => {
      for (const d of [3, 5, 9, 12]) {
        await foodLogRepository.add({
          loggedAt: ts(2026, 7, d, 10),
          source: 'quickadd', name: `Day ${d}`,
          kcal: 100, proteinG: 10, carbG: 10, fatG: 2, fiberG: 1,
        })
      }
      // Range 5..9 inclusive (bounds given mid-day still match by calendar day).
      const inRange = await foodLogRepository.getInDateRange(ts(2026, 7, 5, 18), ts(2026, 7, 9, 6))
      expect(inRange.map((e) => e.name).sort()).toEqual(['Day 5', 'Day 9'])
    })

    it('returns [] when no entries fall in the range', async () => {
      await foodLogRepository.add({
        loggedAt: ts(2026, 7, 1, 10),
        source: 'quickadd', name: 'Old',
        kcal: 100, proteinG: 10, carbG: 10, fatG: 2, fiberG: 1,
      })
      const inRange = await foodLogRepository.getInDateRange(ts(2026, 7, 10, 0), ts(2026, 7, 20, 0))
      expect(inRange).toEqual([])
    })
  })

  describe('getByDay', () => {
    it('groups entries by calendar day regardless of time-of-day', async () => {
      await foodLogRepository.add({
        loggedAt: ts(2026, 7, 9, 8),
        source: 'quickadd', name: 'Breakfast',
        kcal: 300, proteinG: 20, carbG: 30, fatG: 10, fiberG: 2,
      })
      await foodLogRepository.add({
        loggedAt: ts(2026, 7, 9, 20),
        source: 'quickadd', name: 'Dinner',
        kcal: 500, proteinG: 40, carbG: 50, fatG: 15, fiberG: 5,
      })
      await foodLogRepository.add({
        loggedAt: ts(2026, 7, 10, 8),
        source: 'quickadd', name: 'Next day breakfast',
        kcal: 300, proteinG: 20, carbG: 30, fatG: 10, fiberG: 2,
      })

      const day9 = await foodLogRepository.getByDay(ts(2026, 7, 9, 12))
      expect(day9).toHaveLength(2)
      expect(day9.map((e) => e.name).sort()).toEqual(['Breakfast', 'Dinner'])

      const day10 = await foodLogRepository.getByDay(ts(2026, 7, 10, 0))
      expect(day10).toHaveLength(1)
      expect(day10[0].name).toBe('Next day breakfast')
    })

    it('returns an empty array for a day with no entries', async () => {
      const result = await foodLogRepository.getByDay(ts(2026, 7, 9))
      expect(result).toEqual([])
    })
  })

  describe('dayTotals', () => {
    it('sums macros across all entries for the day', async () => {
      await foodLogRepository.add({
        loggedAt: ts(2026, 7, 9, 8),
        source: 'quickadd', name: 'A',
        kcal: 300, proteinG: 20, carbG: 30, fatG: 10, fiberG: 2,
      })
      await foodLogRepository.add({
        loggedAt: ts(2026, 7, 9, 20),
        source: 'quickadd', name: 'B',
        kcal: 500, proteinG: 40, carbG: 50, fatG: 15, fiberG: 5,
      })
      // Different day — must not be included.
      await foodLogRepository.add({
        loggedAt: ts(2026, 7, 10, 8),
        source: 'quickadd', name: 'C',
        kcal: 1000, proteinG: 100, carbG: 100, fatG: 100, fiberG: 100,
      })

      const totals = await foodLogRepository.dayTotals(ts(2026, 7, 9, 12))
      expect(totals).toEqual({ kcal: 800, proteinG: 60, carbG: 80, fatG: 25, fiberG: 7 })
    })

    it('returns all-zero totals for a day with no entries', async () => {
      const totals = await foodLogRepository.dayTotals(ts(2026, 7, 9))
      expect(totals).toEqual({ kcal: 0, proteinG: 0, carbG: 0, fatG: 0, fiberG: 0 })
    })
  })

  describe('update', () => {
    it('re-normalizes date to start-of-day when changes include a new date', async () => {
      const entry = await foodLogRepository.add({
        loggedAt: ts(2026, 7, 9, 14),
        source: 'quickadd', name: 'Oats',
        kcal: 150, proteinG: 5, carbG: 27, fatG: 3, fiberG: 4,
      })

      await foodLogRepository.update(entry.id, { date: ts(2026, 7, 11, 23) })

      const updated = await db.foodLogs.get(entry.id)
      expect(updated?.date).toBe(ts(2026, 7, 11, 0))
    })

    it('applies non-date changes without touching date', async () => {
      const entry = await foodLogRepository.add({
        loggedAt: ts(2026, 7, 9, 14),
        source: 'quickadd', name: 'Oats',
        kcal: 150, proteinG: 5, carbG: 27, fatG: 3, fiberG: 4,
      })

      await foodLogRepository.update(entry.id, { name: 'Oats (updated)', kcal: 160 })

      const updated = await db.foodLogs.get(entry.id)
      expect(updated?.name).toBe('Oats (updated)')
      expect(updated?.kcal).toBe(160)
      expect(updated?.date).toBe(entry.date)
    })
  })

  describe('getRecent', () => {
    it('orders by loggedAt descending and respects the limit', async () => {
      await foodLogRepository.add({
        loggedAt: ts(2026, 7, 7, 8), source: 'quickadd', name: 'Oldest',
        kcal: 100, proteinG: 1, carbG: 1, fatG: 1, fiberG: 1,
      })
      await foodLogRepository.add({
        loggedAt: ts(2026, 7, 9, 8), source: 'quickadd', name: 'Newest',
        kcal: 100, proteinG: 1, carbG: 1, fatG: 1, fiberG: 1,
      })
      await foodLogRepository.add({
        loggedAt: ts(2026, 7, 8, 8), source: 'quickadd', name: 'Middle',
        kcal: 100, proteinG: 1, carbG: 1, fatG: 1, fiberG: 1,
      })

      const recent = await foodLogRepository.getRecent(2)
      expect(recent).toHaveLength(2)
      expect(recent.map((e) => e.name)).toEqual(['Newest', 'Middle'])
    })
  })

  describe('delete', () => {
    it('removes the entry', async () => {
      const entry = await foodLogRepository.add({
        loggedAt: ts(2026, 7, 9, 8), source: 'quickadd', name: 'To delete',
        kcal: 100, proteinG: 1, carbG: 1, fatG: 1, fiberG: 1,
      })

      await foodLogRepository.delete(entry.id)

      expect(await db.foodLogs.get(entry.id)).toBeUndefined()
    })
  })

  describe('getRecentDistinctFoods', () => {
    it('dedupes by refId identity, keeping the most recent occurrence', async () => {
      await foodLogRepository.add({
        loggedAt: ts(2026, 7, 7, 8), source: 'custom', refId: 'food-1', name: 'Chicken',
        quantityG: 100, kcal: 165, proteinG: 31, carbG: 0, fatG: 4, fiberG: 0,
      })
      await foodLogRepository.add({
        loggedAt: ts(2026, 7, 9, 8), source: 'custom', refId: 'food-1', name: 'Chicken',
        quantityG: 200, kcal: 330, proteinG: 62, carbG: 0, fatG: 8, fiberG: 0,
      })

      const result = await foodLogRepository.getRecentDistinctFoods()

      expect(result).toHaveLength(1)
      expect(result[0].key).toBe('custom:food-1')
      expect(result[0].quantityG).toBe(200)
      expect(result[0].kcal).toBe(330)
      expect(result[0].lastLoggedAt).toBe(ts(2026, 7, 9, 8))
    })

    it('dedupes refId-less quickadd entries by lowercased name', async () => {
      await foodLogRepository.add({
        loggedAt: ts(2026, 7, 7, 8), source: 'quickadd', name: 'Protein Shake',
        kcal: 200, proteinG: 30, carbG: 5, fatG: 3, fiberG: 0,
      })
      await foodLogRepository.add({
        loggedAt: ts(2026, 7, 9, 8), source: 'quickadd', name: 'protein shake',
        kcal: 250, proteinG: 35, carbG: 5, fatG: 4, fiberG: 0,
      })

      const result = await foodLogRepository.getRecentDistinctFoods()

      expect(result).toHaveLength(1)
      expect(result[0].key).toBe('quickadd:protein shake')
      expect(result[0].kcal).toBe(250)
    })

    it('orders distinct foods newest-first by their most recent occurrence', async () => {
      await foodLogRepository.add({
        loggedAt: ts(2026, 7, 5, 8), source: 'quickadd', name: 'Oldest food',
        kcal: 100, proteinG: 1, carbG: 1, fatG: 1, fiberG: 1,
      })
      await foodLogRepository.add({
        loggedAt: ts(2026, 7, 9, 8), source: 'quickadd', name: 'Newest food',
        kcal: 100, proteinG: 1, carbG: 1, fatG: 1, fiberG: 1,
      })
      await foodLogRepository.add({
        loggedAt: ts(2026, 7, 7, 8), source: 'quickadd', name: 'Middle food',
        kcal: 100, proteinG: 1, carbG: 1, fatG: 1, fiberG: 1,
      })

      const result = await foodLogRepository.getRecentDistinctFoods()

      expect(result.map((r) => r.name)).toEqual(['Newest food', 'Middle food', 'Oldest food'])
    })

    it('respects the limit even when more distinct foods exist', async () => {
      for (let i = 0; i < 5; i++) {
        await foodLogRepository.add({
          loggedAt: ts(2026, 7, 1 + i, 8), source: 'quickadd', name: `Food ${i}`,
          kcal: 100, proteinG: 1, carbG: 1, fatG: 1, fiberG: 1,
        })
      }

      const result = await foodLogRepository.getRecentDistinctFoods(3)

      expect(result).toHaveLength(3)
      expect(result.map((r) => r.name)).toEqual(['Food 4', 'Food 3', 'Food 2'])
    })
  })

  describe('copyDay', () => {
    it('clones entries into the target day with new ids, leaving originals untouched', async () => {
      const a = await foodLogRepository.add({
        loggedAt: ts(2026, 7, 9, 8), source: 'quickadd', name: 'Breakfast',
        kcal: 300, proteinG: 20, carbG: 30, fatG: 10, fiberG: 2,
      })
      const b = await foodLogRepository.add({
        loggedAt: ts(2026, 7, 9, 20), source: 'quickadd', name: 'Dinner',
        kcal: 500, proteinG: 40, carbG: 50, fatG: 15, fiberG: 5,
      })

      const created = await foodLogRepository.copyDay(ts(2026, 7, 9, 12), ts(2026, 7, 11, 12))

      expect(created).toHaveLength(2)
      const createdIds = created.map((e) => e.id)
      expect(createdIds).not.toContain(a.id)
      expect(createdIds).not.toContain(b.id)
      expect(created.every((e) => e.date === ts(2026, 7, 11, 0))).toBe(true)

      // Originals still present, unmodified.
      const originalDay = await foodLogRepository.getByDay(ts(2026, 7, 9))
      expect(originalDay).toHaveLength(2)
      expect(originalDay.map((e) => e.id).sort()).toEqual([a.id, b.id].sort())
    })

    it('preserves time-of-day offset when cloning', async () => {
      await foodLogRepository.add({
        loggedAt: ts(2026, 7, 9, 8), source: 'quickadd', name: 'Breakfast',
        kcal: 300, proteinG: 20, carbG: 30, fatG: 10, fiberG: 2,
      })

      const [clone] = await foodLogRepository.copyDay(ts(2026, 7, 9, 12), ts(2026, 7, 11, 12))

      expect(clone.loggedAt).toBe(ts(2026, 7, 11, 8))
    })

    it('produces a target-day total matching the source day total', async () => {
      await foodLogRepository.add({
        loggedAt: ts(2026, 7, 9, 8), source: 'quickadd', name: 'Breakfast',
        kcal: 300, proteinG: 20, carbG: 30, fatG: 10, fiberG: 2,
      })
      await foodLogRepository.add({
        loggedAt: ts(2026, 7, 9, 20), source: 'quickadd', name: 'Dinner',
        kcal: 500, proteinG: 40, carbG: 50, fatG: 15, fiberG: 5,
      })

      await foodLogRepository.copyDay(ts(2026, 7, 9, 12), ts(2026, 7, 11, 12))

      const sourceTotals = await foodLogRepository.dayTotals(ts(2026, 7, 9))
      const targetTotals = await foodLogRepository.dayTotals(ts(2026, 7, 11))
      expect(targetTotals).toEqual(sourceTotals)
    })

    it('returns an empty array and creates nothing when the source day has no entries', async () => {
      const created = await foodLogRepository.copyDay(ts(2026, 7, 9), ts(2026, 7, 11))

      expect(created).toEqual([])
      expect(await foodLogRepository.getByDay(ts(2026, 7, 11))).toEqual([])
    })
  })
})
