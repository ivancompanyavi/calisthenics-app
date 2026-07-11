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
})
