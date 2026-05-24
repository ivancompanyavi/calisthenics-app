import { db } from '@/db'
import type { BodyweightLog } from '@/models/types'
import { generateId } from '@/lib/utils'

export const bodyweightRepository = {
  getAll: () => db.bodyweightLogs.orderBy('date').reverse().toArray(),

  getMostRecent: async (): Promise<BodyweightLog | undefined> => {
    return db.bodyweightLogs.orderBy('date').reverse().first()
  },

  // Adds an entry, but if there's already a row for the same calendar date
  // overwrites it instead — avoids cluttering history with multiple Saturday
  // weigh-ins from the same morning.
  log: async (kg: number, notes?: string, date: number = Date.now()): Promise<BodyweightLog> => {
    const dayStart = new Date(date)
    dayStart.setHours(0, 0, 0, 0)
    const dayEnd = new Date(dayStart)
    dayEnd.setDate(dayEnd.getDate() + 1)

    const sameDay = await db.bodyweightLogs
      .where('date')
      .between(dayStart.getTime(), dayEnd.getTime(), true, false)
      .first()

    if (sameDay) {
      const updated = { ...sameDay, kg, notes: notes ?? sameDay.notes, date }
      await db.bodyweightLogs.put(updated)
      return updated
    }

    const entry: BodyweightLog = { id: generateId(), date, kg, notes }
    await db.bodyweightLogs.add(entry)
    return entry
  },

  delete: (id: string) => db.bodyweightLogs.delete(id),
}
