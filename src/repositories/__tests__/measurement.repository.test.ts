import './setup'
import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '@/db'
import { measurementRepository } from '@/repositories/measurement.repository'
import { clearAllTables } from './setup'

function ts(year: number, month: number, day: number, hour = 12): number {
  return new Date(year, month - 1, day, hour, 0, 0, 0).getTime()
}

describe('measurementRepository', () => {
  beforeEach(async () => {
    await clearAllTables()
  })

  describe('log', () => {
    it('creates a new row when no entry exists for that calendar day', async () => {
      const entry = await measurementRepository.log(
        { waistCm: 80, source: 'tape' },
        ts(2026, 7, 9, 8),
      )

      expect(entry.id).toBeTruthy()
      expect(entry.waistCm).toBe(80)
      expect(await db.measurements.count()).toBe(1)
    })

    it('upserts (overwrites) an existing entry for the same calendar day', async () => {
      const first = await measurementRepository.log(
        { waistCm: 80, neckCm: 38, source: 'tape' },
        ts(2026, 7, 9, 8),
      )

      const second = await measurementRepository.log(
        { waistCm: 79.5, source: 'tape' },
        ts(2026, 7, 9, 20), // same day, later hour
      )

      expect(await db.measurements.count()).toBe(1)
      expect(second.id).toBe(first.id)
      const stored = await db.measurements.get(first.id)
      expect(stored?.waistCm).toBe(79.5)
      // Merged via spread over the existing row — fields not present in the
      // second call (like neckCm) are preserved rather than wiped.
      expect(stored?.neckCm).toBe(38)
    })

    it('creates a separate row for a different calendar day', async () => {
      await measurementRepository.log({ waistCm: 80, source: 'tape' }, ts(2026, 7, 9, 8))
      await measurementRepository.log({ waistCm: 79, source: 'tape' }, ts(2026, 7, 10, 8))

      expect(await db.measurements.count()).toBe(2)
    })
  })

  describe('getAll', () => {
    it('orders rows by date descending', async () => {
      await measurementRepository.log({ waistCm: 80 }, ts(2026, 7, 7))
      await measurementRepository.log({ waistCm: 79 }, ts(2026, 7, 9))
      await measurementRepository.log({ waistCm: 79.5 }, ts(2026, 7, 8))

      const all = await measurementRepository.getAll()
      expect(all.map((m) => m.waistCm)).toEqual([79, 79.5, 80])
    })
  })

  describe('getMostRecent', () => {
    it('returns the row with the latest date', async () => {
      await measurementRepository.log({ waistCm: 80 }, ts(2026, 7, 7))
      await measurementRepository.log({ waistCm: 79 }, ts(2026, 7, 9))

      const recent = await measurementRepository.getMostRecent()
      expect(recent?.waistCm).toBe(79)
    })

    it('returns undefined when there are no rows', async () => {
      expect(await measurementRepository.getMostRecent()).toBeUndefined()
    })
  })

  describe('delete', () => {
    it('removes the row', async () => {
      const entry = await measurementRepository.log({ waistCm: 80 }, ts(2026, 7, 9))

      await measurementRepository.delete(entry.id)

      expect(await db.measurements.get(entry.id)).toBeUndefined()
    })
  })
})
