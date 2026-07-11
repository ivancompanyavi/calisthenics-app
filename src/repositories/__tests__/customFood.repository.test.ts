import './setup'
import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '@/db'
import { customFoodRepository } from '@/repositories/customFood.repository'
import { clearAllTables } from './setup'

describe('customFoodRepository', () => {
  beforeEach(async () => {
    await clearAllTables()
  })

  describe('create', () => {
    it('generates an id and createdAt, and persists the row', async () => {
      const food = await customFoodRepository.create({
        name: 'Chicken Breast',
        per: 'per100g',
        kcal: 165, proteinG: 31, carbG: 0, fatG: 3.6, fiberG: 0,
      })

      expect(food.id).toBeTruthy()
      expect(typeof food.createdAt).toBe('number')
      expect(food.name).toBe('Chicken Breast')

      const stored = await db.customFoods.get(food.id)
      expect(stored?.name).toBe('Chicken Breast')
      expect(stored?.kcal).toBe(165)
    })

    it('supports perServing foods with brand + servingGrams', async () => {
      const food = await customFoodRepository.create({
        name: 'Protein Bar',
        brand: 'Quest',
        per: 'perServing',
        servingGrams: 60,
        kcal: 200, proteinG: 20, carbG: 22, fatG: 8, fiberG: 12,
        sodiumMg: 210,
      })

      const stored = await db.customFoods.get(food.id)
      expect(stored?.brand).toBe('Quest')
      expect(stored?.servingGrams).toBe(60)
      expect(stored?.sodiumMg).toBe(210)
    })
  })

  describe('getById', () => {
    it('returns the matching row', async () => {
      const food = await customFoodRepository.create({
        name: 'Oats', per: 'per100g', kcal: 389, proteinG: 17, carbG: 66, fatG: 7, fiberG: 10,
      })

      const found = await customFoodRepository.getById(food.id)
      expect(found?.name).toBe('Oats')
    })

    it('returns undefined for an unknown id', async () => {
      expect(await customFoodRepository.getById('nope')).toBeUndefined()
    })
  })

  describe('getAll', () => {
    it('returns rows ordered by name ascending', async () => {
      await customFoodRepository.create({
        name: 'Zucchini', per: 'per100g', kcal: 17, proteinG: 1, carbG: 3, fatG: 0, fiberG: 1,
      })
      await customFoodRepository.create({
        name: 'Apple', per: 'per100g', kcal: 52, proteinG: 0, carbG: 14, fatG: 0, fiberG: 2,
      })
      await customFoodRepository.create({
        name: 'Mango', per: 'per100g', kcal: 60, proteinG: 1, carbG: 15, fatG: 0, fiberG: 2,
      })

      const all = await customFoodRepository.getAll()
      expect(all.map((f) => f.name)).toEqual(['Apple', 'Mango', 'Zucchini'])
    })
  })

  describe('update', () => {
    it('applies partial changes without touching id', async () => {
      const food = await customFoodRepository.create({
        name: 'Rice', per: 'per100g', kcal: 130, proteinG: 3, carbG: 28, fatG: 0, fiberG: 0,
      })

      await customFoodRepository.update(food.id, { kcal: 135, name: 'Rice (cooked)' })

      const updated = await db.customFoods.get(food.id)
      expect(updated?.id).toBe(food.id)
      expect(updated?.kcal).toBe(135)
      expect(updated?.name).toBe('Rice (cooked)')
      expect(updated?.proteinG).toBe(3)
    })
  })

  describe('delete', () => {
    it('removes the row', async () => {
      const food = await customFoodRepository.create({
        name: 'Broccoli', per: 'per100g', kcal: 34, proteinG: 3, carbG: 7, fatG: 0, fiberG: 3,
      })

      await customFoodRepository.delete(food.id)

      expect(await db.customFoods.get(food.id)).toBeUndefined()
    })
  })
})
