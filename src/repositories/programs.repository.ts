import { db } from '@/db'
import type {
  Program,
  ProgramDay,
  ActiveProgram,
  CycleSlot,
  Workout,
} from '@/models/types'
import { generateId } from '@/lib/utils'
import {
  makeFreshCycle,
  getCurrentSlotIndex,
  isCycleComplete,
  markSlotDone as markSlotDonePure,
  markSlotSkipped as markSlotSkippedPure,
  resizeCycle,
  isSameLocalDay,
} from '@/lib/program-engine'

export interface SaveProgramData {
  name: string
  totalCycles: number
  days: Array<{ workoutId?: string }>
}

export interface CycleSlotView {
  dayNumber: number
  workoutId?: string
  workoutName?: string
  status: CycleSlot['status']
  completedAt?: number
}

export interface CurrentSlot {
  programId: string
  programName: string
  activeProgramId: string
  currentCycle: number
  totalCycles: number
  cycleLengthDays: number
  cycleSlots: CycleSlotView[]
  // Index into cycleSlots that the pointer is on. null = cycle complete.
  pointerIndex: number | null
  // Convenience for the Home screen.
  pointerWorkoutId?: string
  pointerWorkoutName?: string
  pointerIsRestDay: boolean
  // True once totalCycles is reached.
  programCompleted: boolean
  // True when the user has already marked a slot done today (workout or rest).
  // Home uses this to switch to a "good work, see you tomorrow" state instead
  // of nagging them to do the next pointer workout.
  didActivityToday: boolean
  todayActivityName?: string
  todayActivityWasRest?: boolean
}

export interface ProgramHistoryEntry {
  id: string
  startedAt: number
  status: 'completed' | 'abandoned'
  workoutsCompleted: number
}

async function resolveSlots(
  activeProgram: ActiveProgram,
  program: Program,
): Promise<{ slots: CycleSlotView[]; days: ProgramDay[]; workouts: Map<string, Workout> }> {
  const days = await db.programDays
    .where('programId')
    .equals(program.id)
    .sortBy('dayNumber')

  const workoutIds = [...new Set(days.map((d) => d.workoutId).filter(Boolean) as string[])]
  const workoutsArr = await db.workouts.bulkGet(workoutIds)
  const workouts = new Map<string, Workout>()
  for (const w of workoutsArr) {
    if (w) workouts.set(w.id, w)
  }

  const cycle = activeProgram.cycleProgress
  const slots: CycleSlotView[] = days.map((day, i) => {
    const slot = cycle[i] ?? { status: 'pending' as const }
    return {
      dayNumber: day.dayNumber,
      workoutId: day.workoutId,
      workoutName: day.workoutId ? workouts.get(day.workoutId)?.name : undefined,
      status: slot.status,
      completedAt: slot.completedAt,
    }
  })

  return { slots, days, workouts }
}

// Lazy-fixes: ensure cycleProgress exists and matches the program's day count.
// Returns the (possibly updated) active program.
async function ensureCycleProgressShape(
  active: ActiveProgram,
  program: Program,
): Promise<ActiveProgram> {
  const expectedLength = program.cycleLengthDays
  const current = active.cycleProgress ?? []
  if (current.length === expectedLength) return active

  const next = current.length === 0
    ? makeFreshCycle(expectedLength)
    : resizeCycle(current, expectedLength)
  await db.activePrograms.update(active.id, { cycleProgress: next })
  return { ...active, cycleProgress: next }
}

// If the cycle is complete, reset slots and bump currentCycle (or mark the
// whole program completed when we've reached totalCycles).
async function maybeResetCycle(
  active: ActiveProgram,
  program: Program,
): Promise<ActiveProgram> {
  if (!isCycleComplete(active.cycleProgress)) return active

  const nextCycleIndex = active.currentCycle + 1
  if (program.totalCycles > 0 && nextCycleIndex >= program.totalCycles) {
    await db.activePrograms.update(active.id, {
      status: 'completed',
      currentCycle: nextCycleIndex,
    })
    return { ...active, status: 'completed', currentCycle: nextCycleIndex }
  }

  const fresh = makeFreshCycle(program.cycleLengthDays)
  await db.activePrograms.update(active.id, {
    currentCycle: nextCycleIndex,
    cycleProgress: fresh,
  })
  return { ...active, currentCycle: nextCycleIndex, cycleProgress: fresh }
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

    await db.transaction('rw', [db.programs, db.programDays, db.activePrograms], async () => {
      if (data.id) {
        await db.programs.update(programId, {
          name: data.name,
          cycleLengthDays: data.days.length,
          totalCycles: data.totalCycles,
        })
        await db.programDays.where('programId').equals(programId).delete()

        // Resize any active runs of this program to match the new day count.
        const activeRuns = await db.activePrograms.where('programId').equals(programId).toArray()
        for (const run of activeRuns) {
          if (run.status !== 'active') continue
          const resized = resizeCycle(run.cycleProgress ?? [], data.days.length)
          await db.activePrograms.update(run.id, { cycleProgress: resized })
        }
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
    const program = await db.programs.get(programId)
    if (!program) return

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
        cycleProgress: makeFreshCycle(program.cycleLengthDays),
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

  getCurrentSlot: async (): Promise<CurrentSlot | undefined> => {
    const rawActive = await db.activePrograms.where('status').equals('active').first()
    if (!rawActive) return undefined

    const program = await db.programs.get(rawActive.programId)
    if (!program) return undefined

    let active = await ensureCycleProgressShape(rawActive, program)
    active = await maybeResetCycle(active, program)

    const { slots } = await resolveSlots(active, program)
    const pointerIndex = active.status === 'completed' ? null : getCurrentSlotIndex(active.cycleProgress)
    const pointerSlot = pointerIndex !== null ? slots[pointerIndex] : undefined

    const didActivityToday =
      active.lastActivityAt !== undefined && isSameLocalDay(active.lastActivityAt, Date.now())

    return {
      programId: program.id,
      programName: program.name,
      activeProgramId: active.id,
      currentCycle: active.currentCycle,
      totalCycles: program.totalCycles,
      cycleLengthDays: program.cycleLengthDays,
      cycleSlots: slots,
      pointerIndex,
      pointerWorkoutId: pointerSlot?.workoutId,
      pointerWorkoutName: pointerSlot?.workoutName,
      pointerIsRestDay: pointerSlot ? !pointerSlot.workoutId : false,
      programCompleted: active.status === 'completed',
      didActivityToday,
      todayActivityName: didActivityToday ? active.lastActivityName : undefined,
      todayActivityWasRest: didActivityToday ? active.lastActivityWasRest : undefined,
    }
  },

  markSlotDone: async (slotIndex: number, workoutLogId?: string) => {
    const active = await db.activePrograms.where('status').equals('active').first()
    if (!active) return
    const program = await db.programs.get(active.programId)
    if (!program) return

    // Look up what the user actually did so we can stash a display name on
    // the active program (survives cycle resets unlike cycleProgress entries).
    const days = await db.programDays
      .where('programId')
      .equals(program.id)
      .sortBy('dayNumber')
    const day = days[slotIndex]
    let activityName = 'Workout'
    let wasRest = false
    if (!day?.workoutId) {
      activityName = 'Rest day'
      wasRest = true
    } else {
      const workout = await db.workouts.get(day.workoutId)
      activityName = workout?.name ?? 'Workout'
    }

    const now = Date.now()
    const next = markSlotDonePure(
      active.cycleProgress ?? makeFreshCycle(program.cycleLengthDays),
      slotIndex,
      workoutLogId,
      now,
    )
    await db.activePrograms.update(active.id, {
      cycleProgress: next,
      lastActivityAt: now,
      lastActivityName: activityName,
      lastActivityWasRest: wasRest,
    })

    // Auto-reset if this completion finished the cycle. lastActivity fields
    // stay on the record — they aren't touched by the reset.
    if (isCycleComplete(next)) {
      await maybeResetCycle({ ...active, cycleProgress: next }, program)
    }
  },

  markSlotSkipped: async (slotIndex: number) => {
    const active = await db.activePrograms.where('status').equals('active').first()
    if (!active) return
    const program = await db.programs.get(active.programId)
    if (!program) return

    const next = markSlotSkippedPure(
      active.cycleProgress ?? makeFreshCycle(program.cycleLengthDays),
      slotIndex,
      Date.now(),
    )
    await db.activePrograms.update(active.id, { cycleProgress: next })

    if (isCycleComplete(next)) {
      await maybeResetCycle({ ...active, cycleProgress: next }, program)
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

    return finished.map((run) => {
      const cycle = run.cycleProgress ?? []
      const completed = cycle.filter((s) => s.status === 'done').length
      return {
        id: run.id,
        startedAt: run.startedAt,
        status: run.status as 'completed' | 'abandoned',
        workoutsCompleted: completed,
      }
    })
  },

  checkWorkoutUsage: async (workoutId: string): Promise<string[]> => {
    const days = await db.programDays.where('workoutId').equals(workoutId).toArray()
    const programIds = [...new Set(days.map((d) => d.programId))]
    const programs = await db.programs.bulkGet(programIds)
    return programs.filter(Boolean).map((p) => p!.name)
  },
}
