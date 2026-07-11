import { db } from '@/db'
import type { Measurement } from '@/models/types'
import { generateId } from '@/lib/utils'

export const measurementRepository = {
  getAll: () => db.measurements.orderBy('date').reverse().toArray(),

  getMostRecent: async (): Promise<Measurement | undefined> => {
    return db.measurements.orderBy('date').reverse().first()
  },

  // Adds an entry, but if there's already a row for the same calendar date
  // overwrites it instead — mirrors bodyweightRepository.log's same-day
  // upsert behavior so repeat entries in one day don't clutter history.
  log: async (
    data: Omit<Measurement, 'id' | 'date'>,
    date: number = Date.now(),
  ): Promise<Measurement> => {
    const dayStart = new Date(date)
    dayStart.setHours(0, 0, 0, 0)
    const dayEnd = new Date(dayStart)
    dayEnd.setDate(dayEnd.getDate() + 1)

    const sameDay = await db.measurements
      .where('date')
      .between(dayStart.getTime(), dayEnd.getTime(), true, false)
      .first()

    if (sameDay) {
      const updated: Measurement = { ...sameDay, ...data, date }
      await db.measurements.put(updated)
      return updated
    }

    const entry: Measurement = { id: generateId(), date, ...data }
    await db.measurements.add(entry)
    return entry
  },

  delete: (id: string) => db.measurements.delete(id),
}
