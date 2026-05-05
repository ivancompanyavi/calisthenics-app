import { db } from '@/db'
import type { Program, ProgramDay, ActiveProgram } from '@/models/types'
import { generateId } from '@/lib/utils'

export interface SaveProgramData {
  name: string
  totalCycles: number
  days: Array<{ workoutId?: string }>
}

export interface TodaySchedule {
  programName: string
  programId: string
  activeProgramId?: string
  dayNumber: number
  cycleLengthDays: number
  currentCycle: number
  totalCycles: number
  isRestDay: boolean
  workoutId?: string
  workoutName?: string
  nextWorkoutName?: string
  nextWorkoutDayLabel?: string
  justCompleted?: boolean
}

export interface ProgramHistoryEntry {
  id: string
  startedAt: number
  status: 'completed' | 'abandoned'
  endLabel: string
  workoutsCompleted: number
}

export interface CompletionInfo {
  programId: string
  programName: string
  activeProgramId: string
  startedAt: number
  totalDays: number
  workoutsCompleted: number
  workoutsScheduled: number
}

export const programsRepository = {
  getAll: async () => {
    const programs = await db.programs.orderBy('createdAt').reverse().toArray()
    const allActive = await db.activePrograms.toArray()
    const completedCounts = new Map<string, number>()
    for (const ap of allActive) {
      if (ap.status === 'completed') {
        completedCounts.set(ap.programId, (completedCounts.get(ap.programId) ?? 0) + 1)
      }
    }
    return programs.map((p) => ({ ...p, completedCount: completedCounts.get(p.id) ?? 0 }))
  },

  getById: (id: string) => db.programs.get(id),

  getDays: (programId: string) =>
    db.programDays.where('programId').equals(programId).sortBy('dayNumber'),

  save: async (data: SaveProgramData & { id?: string }) => {
    const programId = data.id ?? generateId()

    await db.transaction('rw', [db.programs, db.programDays], async () => {
      if (data.id) {
        await db.programs.update(programId, {
          name: data.name,
          cycleLengthDays: data.days.length,
          totalCycles: data.totalCycles,
        })
        await db.programDays.where('programId').equals(programId).delete()
      } else {
        const program: Program = {
          id: programId,
          name: data.name,
          cycleLengthDays: data.days.length,
          totalCycles: data.totalCycles,
          createdAt: Date.now(),
        }
        await db.programs.add(program)
      }

      const days: ProgramDay[] = data.days.map((d, i) => ({
        id: generateId(),
        programId,
        dayNumber: i + 1,
        workoutId: d.workoutId,
      }))
      await db.programDays.bulkAdd(days)
    })

    return programId
  },

  delete: async (id: string) => {
    await db.transaction('rw', [db.programs, db.programDays, db.activePrograms], async () => {
      await db.programDays.where('programId').equals(id).delete()
      await db.activePrograms.where('programId').equals(id).delete()
      await db.programs.delete(id)
    })
  },

  getActive: async (): Promise<(ActiveProgram & { program: Program }) | undefined> => {
    const active = await db.activePrograms.where('status').equals('active').first()
    if (!active) return undefined
    const program = await db.programs.get(active.programId)
    if (!program) return undefined
    return { ...active, program }
  },

  activate: async (programId: string) => {
    await db.transaction('rw', [db.activePrograms], async () => {
      const current = await db.activePrograms.where('status').equals('active').first()
      if (current) {
        await db.activePrograms.update(current.id, { status: 'abandoned' })
      }

      const startOfToday = new Date()
      startOfToday.setHours(0, 0, 0, 0)

      const activeProgram: ActiveProgram = {
        id: generateId(),
        programId,
        startedAt: startOfToday.getTime(),
        currentCycle: 0,
        status: 'active',
      }
      await db.activePrograms.add(activeProgram)
    })
  },

  deactivate: async (id: string) => {
    await db.activePrograms.update(id, { status: 'abandoned' })
  },

  complete: async (id: string) => {
    await db.activePrograms.update(id, { status: 'completed' })
  },

  getTodaySchedule: async (): Promise<TodaySchedule | undefined> => {
    const active = await db.activePrograms.where('status').equals('active').first()
    if (!active) return undefined

    const program = await db.programs.get(active.programId)
    if (!program) return undefined

    const now = new Date()
    now.setHours(0, 0, 0, 0)
    const daysSinceStart = Math.floor((now.getTime() - active.startedAt) / (1000 * 60 * 60 * 24))
    const currentCycle = Math.floor(daysSinceStart / program.cycleLengthDays)

    if (program.totalCycles > 0 && currentCycle >= program.totalCycles) {
      await db.activePrograms.update(active.id, { status: 'completed' })
      return {
        programName: program.name,
        programId: program.id,
        activeProgramId: active.id,
        dayNumber: program.cycleLengthDays,
        cycleLengthDays: program.cycleLengthDays,
        currentCycle: program.totalCycles - 1,
        totalCycles: program.totalCycles,
        isRestDay: true,
        justCompleted: true,
      }
    }

    const dayInCycle = (daysSinceStart % program.cycleLengthDays) + 1

    const days = await db.programDays
      .where('programId')
      .equals(program.id)
      .sortBy('dayNumber')

    const today = days.find((d) => d.dayNumber === dayInCycle)
    const isRestDay = !today?.workoutId

    let workoutName: string | undefined
    if (today?.workoutId) {
      const workout = await db.workouts.get(today.workoutId)
      workoutName = workout?.name
    }

    let nextWorkoutName: string | undefined
    let nextWorkoutDayLabel: string | undefined
    if (isRestDay) {
      for (let offset = 1; offset <= program.cycleLengthDays; offset++) {
        const nextDayNum = ((dayInCycle - 1 + offset) % program.cycleLengthDays) + 1
        const nextDay = days.find((d) => d.dayNumber === nextDayNum)
        if (nextDay?.workoutId) {
          const workout = await db.workouts.get(nextDay.workoutId)
          nextWorkoutName = workout?.name
          nextWorkoutDayLabel = offset === 1 ? 'tomorrow' : `in ${offset} days`
          break
        }
      }
    }

    return {
      programName: program.name,
      programId: program.id,
      dayNumber: dayInCycle,
      cycleLengthDays: program.cycleLengthDays,
      currentCycle,
      totalCycles: program.totalCycles,
      isRestDay,
      workoutId: today?.workoutId,
      workoutName,
      nextWorkoutName,
      nextWorkoutDayLabel,
    }
  },

  getHistory: async (programId: string): Promise<ProgramHistoryEntry[]> => {
    const runs = await db.activePrograms
      .where('programId')
      .equals(programId)
      .toArray()

    const finished = runs
      .filter((r) => r.status !== 'active')
      .sort((a, b) => b.startedAt - a.startedAt)

    const results: ProgramHistoryEntry[] = []
    for (const run of finished) {
      const program = await db.programs.get(run.programId)
      const durationMs = program
        ? program.cycleLengthDays * (program.totalCycles || 1) * 86400000
        : 0
      const endTimestamp = run.startedAt + durationMs

      const logs = await db.workoutLogs
        .where('startedAt')
        .between(run.startedAt, endTimestamp)
        .toArray()

      results.push({
        id: run.id,
        startedAt: run.startedAt,
        status: run.status as 'completed' | 'abandoned',
        endLabel: new Date(endTimestamp).toLocaleDateString(),
        workoutsCompleted: logs.length,
      })
    }

    return results
  },

  getCompletionStats: async (activeProgramId: string): Promise<CompletionInfo | undefined> => {
    const active = await db.activePrograms.get(activeProgramId)
    if (!active || active.status !== 'completed') return undefined

    const program = await db.programs.get(active.programId)
    if (!program) return undefined

    const totalDays = program.cycleLengthDays * program.totalCycles
    const endTimestamp = active.startedAt + totalDays * 86400000

    const days = await db.programDays
      .where('programId')
      .equals(program.id)
      .toArray()
    const workoutsScheduled = days.filter((d) => d.workoutId).length * program.totalCycles

    const logs = await db.workoutLogs
      .where('startedAt')
      .between(active.startedAt, endTimestamp)
      .toArray()

    return {
      programId: program.id,
      programName: program.name,
      activeProgramId: active.id,
      startedAt: active.startedAt,
      totalDays,
      workoutsCompleted: logs.length,
      workoutsScheduled,
    }
  },

  getCompletedCount: async (programId: string): Promise<number> => {
    const runs = await db.activePrograms
      .where('programId')
      .equals(programId)
      .toArray()
    return runs.filter((r) => r.status === 'completed').length
  },

  checkWorkoutUsage: async (workoutId: string): Promise<string[]> => {
    const days = await db.programDays.where('workoutId').equals(workoutId).toArray()
    const programIds = [...new Set(days.map((d) => d.programId))]
    const programs = await db.programs.bulkGet(programIds)
    return programs.filter(Boolean).map((p) => p!.name)
  },
}
