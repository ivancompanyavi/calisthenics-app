import './setup'
import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '@/db'
import { mealRepository } from '@/repositories/meal.repository'
import { foodLogRepository } from '@/repositories/foodLog.repository'
import { clearAllTables } from './setup'
import type { MealItem } from '@/models/types'

function ts(year: number, month: number, day: number, hour = 12): number {
  return new Date(year, month - 1, day, hour, 0, 0, 0).getTime()
}

const ITEMS: MealItem[] = [
  { name: 'Oats', source: 'quickadd', quantityG: 40, kcal: 154, proteinG: 5, carbG: 27, fatG: 3, fiberG: 4 },
  { name: 'Milk', source: 'custom', refId: 'seed-food-milk', servings: 1, kcal: 110, proteinG: 18, carbG: 9, fatG: 0, fiberG: 0, sodiumMg: 70 },
]

describe('mealRepository', () => {
  beforeEach(async () => {
    await clearAllTables()
  })

  it('create assigns an id + createdAt and stores the items array', async () => {
    const meal = await mealRepository.create({ name: 'Breakfast bowl', mealLabel: 'breakfast', items: ITEMS })
    expect(meal.id).toBeTruthy()
    expect(meal.createdAt).toEqual(expect.any(Number))
    const stored = await db.meals.get(meal.id)
    expect(stored?.name).toBe('Breakfast bowl')
    expect(stored?.items).toHaveLength(2)
  })

  describe('logMeal', () => {
    it('expands into one FoodLog per ingredient on the given day, sharing the meal label', async () => {
      const meal = await mealRepository.create({ name: 'Breakfast bowl', mealLabel: 'breakfast', items: ITEMS })

      const created = await mealRepository.logMeal(meal.id, ts(2026, 7, 13, 8))

      expect(created).toHaveLength(2)
      const day = await foodLogRepository.getByDay(ts(2026, 7, 13))
      expect(day).toHaveLength(2)
      expect(day.every((l) => l.mealLabel === 'breakfast')).toBe(true)
      expect(day.every((l) => l.date === ts(2026, 7, 13, 0))).toBe(true)

      const oats = day.find((l) => l.name === 'Oats')
      expect(oats).toMatchObject({ kcal: 154, proteinG: 5, carbG: 27, fatG: 3, fiberG: 4, quantityG: 40, source: 'quickadd' })
      const milk = day.find((l) => l.name === 'Milk')
      expect(milk).toMatchObject({ kcal: 110, proteinG: 18, source: 'custom', refId: 'seed-food-milk', servings: 1 })
    })

    it('an explicit mealLabel argument overrides the meal default', async () => {
      const meal = await mealRepository.create({ name: 'Bowl', mealLabel: 'breakfast', items: ITEMS })
      await mealRepository.logMeal(meal.id, ts(2026, 7, 13, 20), 'dinner')
      const day = await foodLogRepository.getByDay(ts(2026, 7, 13))
      expect(day.every((l) => l.mealLabel === 'dinner')).toBe(true)
    })

    it('totals from a logged meal match the sum of its items', async () => {
      const meal = await mealRepository.create({ name: 'Bowl', items: ITEMS })
      await mealRepository.logMeal(meal.id, ts(2026, 7, 13))
      const totals = await foodLogRepository.dayTotals(ts(2026, 7, 13))
      expect(totals.kcal).toBe(264) // 154 + 110
      expect(totals.proteinG).toBe(23) // 5 + 18
    })

    it('returns [] for an unknown meal id without writing anything', async () => {
      const created = await mealRepository.logMeal('nope', ts(2026, 7, 13))
      expect(created).toEqual([])
      expect(await db.foodLogs.count()).toBe(0)
    })

    it('stamps every entry with one shared mealInstanceId and carries sodium through', async () => {
      const meal = await mealRepository.create({ name: 'Bowl', items: ITEMS })
      const created = await mealRepository.logMeal(meal.id, ts(2026, 7, 13))

      const ids = new Set(created.map((l) => l.mealInstanceId))
      expect(ids.size).toBe(1)
      expect([...ids][0]).toBeTruthy()
      // Sodium (dropped before the fix) now lands on the FoodLog + day totals.
      const milk = created.find((l) => l.name === 'Milk')
      expect(milk?.sodiumMg).toBe(70)
      const totals = await foodLogRepository.dayTotals(ts(2026, 7, 13))
      expect(totals.sodiumMg).toBe(70)
    })

    it('deleteByMealInstance removes exactly the entries from one logged meal', async () => {
      const meal = await mealRepository.create({ name: 'Bowl', items: ITEMS })
      const created = await mealRepository.logMeal(meal.id, ts(2026, 7, 13))
      // An unrelated standalone entry on the same day should survive.
      await foodLogRepository.add({
        date: ts(2026, 7, 13), source: 'quickadd', name: 'Apple',
        kcal: 95, proteinG: 0, carbG: 25, fatG: 0, fiberG: 4,
      })

      const removed = await foodLogRepository.deleteByMealInstance(created[0].mealInstanceId!)
      expect(removed).toBe(2)
      const remaining = await foodLogRepository.getByDay(ts(2026, 7, 13))
      expect(remaining.map((l) => l.name)).toEqual(['Apple'])
    })
  })
})
