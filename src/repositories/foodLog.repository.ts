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
  sodiumMg: number
}

// A distinct previously-logged food, deduped by identity (source+refId, or
// lowercased name for quickadd entries with no refId) and carrying the most
// recent entry's portion/macros so the UI can offer a one-tap re-log with the
// same quantity that was actually eaten last time.
export interface RecentDistinctFood {
  key: string
  name: string
  source: FoodLog['source']
  refId?: string
  mealLabel?: FoodLog['mealLabel']
  quantityG?: number
  servings?: number
  kcal: number
  proteinG: number
  carbG: number
  fatG: number
  fiberG: number
  sodiumMg?: number
  lastLoggedAt: number
}

function distinctFoodKey(log: FoodLog): string {
  if (log.refId) return `${log.source}:${log.refId}`
  return `${log.source}:${log.name.trim().toLowerCase()}`
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

  // Deletes every entry logged together from one meal template (shared
  // mealInstanceId). mealInstanceId isn't indexed — filter in JS, which is fine
  // at these data volumes. Returns the number of rows removed.
  deleteByMealInstance: (mealInstanceId: string): Promise<number> =>
    db.foodLogs.filter((l) => l.mealInstanceId === mealInstanceId).delete(),

  // All entries whose grouping day matches the calendar day of `date`.
  getByDay: (date: number = Date.now()): Promise<FoodLog[]> => {
    const day = startOfDay(date)
    return db.foodLogs.where('date').equals(day).toArray()
  },

  getRecent: (n: number): Promise<FoodLog[]> => {
    return db.foodLogs.orderBy('loggedAt').reverse().limit(n).toArray()
  },

  // All entries whose grouping day falls within [startDate, endDate] inclusive
  // (compared by calendar day). Uses the `date` index, so it's a bounded range
  // scan rather than loading every row — this backs the trends view's windows
  // (weekly averages / adaptive TDEE) without an arbitrary row cap.
  getInDateRange: (startDate: number, endDate: number): Promise<FoodLog[]> => {
    return db.foodLogs
      .where('date')
      .between(startOfDay(startDate), startOfDay(endDate), true, true)
      .toArray()
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
        sodiumMg: acc.sodiumMg + (e.sodiumMg ?? 0),
      }),
      { kcal: 0, proteinG: 0, carbG: 0, fatG: 0, fiberG: 0, sodiumMg: 0 },
    )
  },

  // Newest-first distinct foods for fast re-logging. "Distinct" is keyed by
  // source+refId (or lowercased name for refId-less quickadd rows) — recency
  // is purely a function of loggedAt, with no today-vs-past filtering, so a
  // food eaten twice today still just contributes its single most-recent
  // occurrence.
  getRecentDistinctFoods: async (limit: number = 20): Promise<RecentDistinctFood[]> => {
    const all = await db.foodLogs.orderBy('loggedAt').reverse().toArray()
    const seen = new Set<string>()
    const result: RecentDistinctFood[] = []
    for (const log of all) {
      const key = distinctFoodKey(log)
      if (seen.has(key)) continue
      seen.add(key)
      result.push({
        key,
        name: log.name,
        source: log.source,
        refId: log.refId,
        mealLabel: log.mealLabel,
        quantityG: log.quantityG,
        servings: log.servings,
        kcal: log.kcal,
        proteinG: log.proteinG,
        carbG: log.carbG,
        fatG: log.fatG,
        fiberG: log.fiberG,
        sodiumMg: log.sodiumMg,
        lastLoggedAt: log.loggedAt,
      })
      if (result.length >= limit) break
    }
    return result
  },

  // Clones every foodLog on fromDate's calendar day into toDate's day. Goes
  // through `add()` for each entry (rather than a bulk Dexie insert) so the id
  // generation / date-normalization invariants stay in one place. Time-of-day
  // is preserved when easy (offset from the source day's start carried over
  // onto the destination day); `add()` derives the new `date` field from the
  // computed `loggedAt`, so it always lands on toDate's calendar day.
  copyDay: async (fromDate: number, toDate: number): Promise<FoodLog[]> => {
    const sourceEntries = await foodLogRepository.getByDay(fromDate)
    const toDayStart = startOfDay(toDate)
    const created: FoodLog[] = []
    for (const entry of sourceEntries) {
      const timeOfDayMs = entry.loggedAt - entry.date
      const newLoggedAt = toDayStart + timeOfDayMs
      const { id: _id, date: _date, loggedAt: _loggedAt, ...rest } = entry
      const clone = await foodLogRepository.add({
        ...rest,
        loggedAt: newLoggedAt,
      })
      created.push(clone)
    }
    return created
  },
}
