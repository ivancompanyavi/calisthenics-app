import { db } from '@/db'
import type { FoodLog } from '@/models/types'
import { generateId } from '@/lib/utils'

// Normalizes any timestamp to its calendar-day start (local time), matching
// the `date` grouping key stored on FoodLog rows.
function startOfDay(date: number): number {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

export interface DayTotals {
  kcal: number
  proteinG: number
  carbG: number
  fatG: number
  fiberG: number
}

export const foodLogRepository = {
  add: async (
    data: Omit<FoodLog, 'id' | 'date' | 'loggedAt'> & { date?: number; loggedAt?: number },
  ): Promise<FoodLog> => {
    const { date, loggedAt, ...rest } = data
    const resolvedLoggedAt = loggedAt ?? Date.now()
    const entry: FoodLog = {
      id: generateId(),
      date: startOfDay(date ?? resolvedLoggedAt),
      loggedAt: resolvedLoggedAt,
      ...rest,
    }
    await db.foodLogs.add(entry)
    return entry
  },

  update: async (id: string, changes: Partial<Omit<FoodLog, 'id'>>) => {
    const normalized = changes.date !== undefined ? { ...changes, date: startOfDay(changes.date) } : changes
    await db.foodLogs.update(id, normalized)
  },

  delete: (id: string) => db.foodLogs.delete(id),

  // All entries whose grouping day matches the calendar day of `date`.
  getByDay: (date: number = Date.now()): Promise<FoodLog[]> => {
    const day = startOfDay(date)
    return db.foodLogs.where('date').equals(day).toArray()
  },

  getRecent: (n: number): Promise<FoodLog[]> => {
    return db.foodLogs.orderBy('loggedAt').reverse().limit(n).toArray()
  },

  dayTotals: async (date: number = Date.now()): Promise<DayTotals> => {
    const entries = await foodLogRepository.getByDay(date)
    return entries.reduce<DayTotals>(
      (acc, e) => ({
        kcal: acc.kcal + e.kcal,
        proteinG: acc.proteinG + e.proteinG,
        carbG: acc.carbG + e.carbG,
        fatG: acc.fatG + e.fatG,
        fiberG: acc.fiberG + e.fiberG,
      }),
      { kcal: 0, proteinG: 0, carbG: 0, fatG: 0, fiberG: 0 },
    )
  },
}
