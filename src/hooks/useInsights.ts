import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'
import { workoutLogsRepository, bodyweightRepository } from '@/repositories'

export interface WeeklyVolume {
  week: string
  count: number
}

export interface ProgressionTrend {
  movementName: string
  // bodyweightKg is the nearest weigh-in on or before the session date.
  // Absent (undefined) when no weigh-in exists in that window.
  data: { date: string; value: number; bodyweightKg?: number }[]
  improving: boolean
}

export interface InsightsData {
  streak: number
  weeklyVolume: WeeklyVolume[]
  totalSetsThisWeek: number
  totalSetsLastWeek: number
  progressionTrends: ProgressionTrend[]
}

function getWeekStart(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - d.getDay())
  return d
}

function formatWeekLabel(date: Date): string {
  return `${date.getMonth() + 1}/${date.getDate()}`
}

export function useInsights() {
  return useQuery({
    queryKey: queryKeys.insights,
    queryFn: async (): Promise<InsightsData> => {
      const [logs, setLogs, bodyweightLogs] = await Promise.all([
        workoutLogsRepository.getAll(),
        workoutLogsRepository.getAllSetLogs(),
        bodyweightRepository.getAll(),
      ])
      // bodyweightRepository.getAll returns newest-first; we want oldest-first
      // here so the "nearest on-or-before" lookup is a clean linear scan from
      // the end (most recent entries scanned first).
      const bodyweightByDateAsc = [...bodyweightLogs].reverse()
      const nearestBodyweightAt = (timestamp: number): number | undefined => {
        // Walk newest-first and return the first reading ≤ timestamp. Cheap
        // enough for sub-thousand-row scale; revisit if it ever isn't.
        for (let i = bodyweightByDateAsc.length - 1; i >= 0; i--) {
          if (bodyweightByDateAsc[i].date <= timestamp) {
            return bodyweightByDateAsc[i].kg
          }
        }
        return undefined
      }

      const now = new Date()
      const thisWeekStart = getWeekStart(now)
      const lastWeekStart = new Date(thisWeekStart)
      lastWeekStart.setDate(lastWeekStart.getDate() - 7)

      let streak = 0
      const weekStart = getWeekStart(now)
      const checkWeek = new Date(weekStart)
      while (true) {
        const weekEnd = new Date(checkWeek)
        weekEnd.setDate(weekEnd.getDate() + 7)
        const hasWorkout = logs.some(
          (l) => l.completedAt >= checkWeek.getTime() && l.completedAt < weekEnd.getTime()
        )
        if (hasWorkout) {
          streak++
          checkWeek.setDate(checkWeek.getDate() - 7)
        } else {
          break
        }
      }

      const weeklyVolume: WeeklyVolume[] = []
      for (let i = 7; i >= 0; i--) {
        const wStart = new Date(thisWeekStart)
        wStart.setDate(wStart.getDate() - i * 7)
        const wEnd = new Date(wStart)
        wEnd.setDate(wEnd.getDate() + 7)
        const count = logs.filter(
          (l) => l.completedAt >= wStart.getTime() && l.completedAt < wEnd.getTime()
        ).length
        weeklyVolume.push({ week: formatWeekLabel(wStart), count })
      }

      const thisWeekEnd = new Date(thisWeekStart)
      thisWeekEnd.setDate(thisWeekEnd.getDate() + 7)
      const thisWeekLogIds = new Set(
        logs.filter((l) => l.completedAt >= thisWeekStart.getTime() && l.completedAt < thisWeekEnd.getTime()).map((l) => l.id)
      )
      const lastWeekEnd = new Date(thisWeekStart)
      const lastWeekLogIds = new Set(
        logs.filter((l) => l.completedAt >= lastWeekStart.getTime() && l.completedAt < lastWeekEnd.getTime()).map((l) => l.id)
      )
      const totalSetsThisWeek = setLogs.filter((s) => thisWeekLogIds.has(s.workoutLogId)).length
      const totalSetsLastWeek = setLogs.filter((s) => lastWeekLogIds.has(s.workoutLogId)).length

      const movementSets = new Map<string, { date: number; value: number }[]>()
      for (const setLog of setLogs) {
        const log = logs.find((l) => l.id === setLog.workoutLogId)
        if (!log) continue
        const value = setLog.actualReps ?? setLog.actualSeconds ?? 0
        if (value === 0) continue

        const arr = movementSets.get(setLog.movementName) ?? []
        arr.push({ date: log.completedAt, value })
        movementSets.set(setLog.movementName, arr)
      }

      const progressionTrends: ProgressionTrend[] = []
      for (const [movementName, entries] of movementSets) {
        if (entries.length < 2) continue
        entries.sort((a, b) => a.date - b.date)
        const recent = entries.slice(-8)
        const data = recent.map((e) => ({
          date: new Date(e.date).toLocaleDateString([], { month: 'short', day: 'numeric' }),
          value: e.value,
          bodyweightKg: nearestBodyweightAt(e.date),
        }))

        const firstHalf = recent.slice(0, Math.ceil(recent.length / 2))
        const secondHalf = recent.slice(Math.ceil(recent.length / 2))
        const avgFirst = firstHalf.reduce((s, e) => s + e.value, 0) / firstHalf.length
        const avgSecond = secondHalf.reduce((s, e) => s + e.value, 0) / secondHalf.length
        const improving = avgSecond > avgFirst

        progressionTrends.push({ movementName, data, improving })
      }

      progressionTrends.sort((a, b) => b.data.length - a.data.length)

      return {
        streak,
        weeklyVolume,
        totalSetsThisWeek,
        totalSetsLastWeek,
        progressionTrends: progressionTrends.slice(0, 6),
      }
    },
  })
}
