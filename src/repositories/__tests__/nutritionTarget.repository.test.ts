import './setup'
import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '@/db'
import { nutritionTargetRepository } from '@/repositories/nutritionTarget.repository'
import { clearAllTables } from './setup'

describe('nutritionTargetRepository', () => {
  beforeEach(async () => {
    await clearAllTables()
  })

  describe('setTarget', () => {
    it('always inserts a new row rather than mutating an existing one', async () => {
      const first = await nutritionTargetRepository.setTarget({
        effectiveDate: 1_700_000_000_000,
        kcal: 2200,
        proteinG: 160,
        setBy: 'user',
      })
      const second = await nutritionTargetRepository.setTarget({
        effectiveDate: 1_700_500_000_000,
        kcal: 2000,
        proteinG: 170,
        setBy: 'coach',
      })

      expect(first.id).not.toBe(second.id)
      expect(await db.nutritionTargets.count()).toBe(2)
    })
  })

  describe('getCurrent', () => {
    it('returns the row with the latest effectiveDate regardless of insert order', async () => {
      await nutritionTargetRepository.setTarget({
        effectiveDate: 1_700_500_000_000, kcal: 2000, proteinG: 170, setBy: 'coach',
      })
      await nutritionTargetRepository.setTarget({
        effectiveDate: 1_700_000_000_000, kcal: 2200, proteinG: 160, setBy: 'user',
      })
      // Inserted last but has the latest effectiveDate — must still win.
      const latest = await nutritionTargetRepository.setTarget({
        effectiveDate: 1_701_000_000_000, kcal: 1900, proteinG: 180, setBy: 'coach', notes: 'cut phase',
      })

      const current = await nutritionTargetRepository.getCurrent()
      expect(current?.id).toBe(latest.id)
      expect(current?.kcal).toBe(1900)
      expect(current?.notes).toBe('cut phase')
    })

    it('returns undefined when no targets exist', async () => {
      expect(await nutritionTargetRepository.getCurrent()).toBeUndefined()
    })
  })

  describe('getAll', () => {
    it('orders rows by effectiveDate descending', async () => {
      await nutritionTargetRepository.setTarget({
        effectiveDate: 1_700_000_000_000, kcal: 2200, proteinG: 160, setBy: 'user',
      })
      await nutritionTargetRepository.setTarget({
        effectiveDate: 1_701_000_000_000, kcal: 1900, proteinG: 180, setBy: 'coach',
      })

      const all = await nutritionTargetRepository.getAll()
      expect(all.map((t) => t.kcal)).toEqual([1900, 2200])
    })
  })

  describe('delete', () => {
    it('removes the row', async () => {
      const target = await nutritionTargetRepository.setTarget({
        effectiveDate: 1_700_000_000_000, kcal: 2200, proteinG: 160, setBy: 'user',
      })

      await nutritionTargetRepository.delete(target.id)

      expect(await db.nutritionTargets.get(target.id)).toBeUndefined()
    })
  })
})
