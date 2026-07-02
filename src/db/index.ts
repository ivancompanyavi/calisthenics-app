import Dexie, { type EntityTable } from 'dexie'
import type {
  Movement,
  Progression,
  ProgressionLevel,
  Workout,
  WorkoutBlock,
  BlockEntry,
  WorkoutLog,
  SetLog,
  InProgressWorkout,
  Program,
  ProgramDay,
  ActiveProgram,
  BodyweightLog,
  Goal,
  Settings,
  Skill,
} from '@/models/types'

const db = new Dexie('CalisthenicsTracker') as Dexie & {
  movements: EntityTable<Movement, 'id'>
  progressions: EntityTable<Progression, 'id'>
  progressionLevels: EntityTable<ProgressionLevel, 'id'>
  workouts: EntityTable<Workout, 'id'>
  workoutBlocks: EntityTable<WorkoutBlock, 'id'>
  blockEntries: EntityTable<BlockEntry, 'id'>
  workoutLogs: EntityTable<WorkoutLog, 'id'>
  setLogs: EntityTable<SetLog, 'id'>
  inProgressWorkout: EntityTable<InProgressWorkout, 'id'>
  programs: EntityTable<Program, 'id'>
  programDays: EntityTable<ProgramDay, 'id'>
  activePrograms: EntityTable<ActiveProgram, 'id'>
  bodyweightLogs: EntityTable<BodyweightLog, 'id'>
  goals: EntityTable<Goal, 'id'>
  settings: EntityTable<Settings, 'id'>
  skills: EntityTable<Skill, 'id'>
}

db.version(1).stores({
  movements: 'id, name, createdAt',
  progressions: 'id, name, createdAt',
  progressionLevels: 'id, progressionId, movementId, order',
  workouts: 'id, name, createdAt',
  workoutBlocks: 'id, workoutId, order',
  blockEntries: 'id, blockId, progressionId, order',
  workoutLogs: 'id, workoutId, startedAt, completedAt',
  setLogs: 'id, workoutLogId, movementId, order',
  inProgressWorkout: 'id, workoutId',
})

db.version(2).stores({
  movements: 'id, name, createdAt',
  progressions: 'id, name, createdAt',
  progressionLevels: 'id, progressionId, movementId, order',
  workouts: 'id, name, createdAt',
  workoutBlocks: 'id, workoutId, order',
  blockEntries: 'id, blockId, progressionId, order',
  workoutLogs: 'id, workoutId, startedAt, completedAt',
  setLogs: 'id, workoutLogId, movementId, order',
  inProgressWorkout: 'id, workoutId',
}).upgrade(async (tx) => {
  await Promise.all([
    tx.table('movements').clear(),
    tx.table('progressions').clear(),
    tx.table('progressionLevels').clear(),
    tx.table('workouts').clear(),
    tx.table('workoutBlocks').clear(),
    tx.table('blockEntries').clear(),
    tx.table('workoutLogs').clear(),
    tx.table('setLogs').clear(),
    tx.table('inProgressWorkout').clear(),
  ])
})

db.version(3).stores({
  movements: 'id, name, createdAt',
  progressions: 'id, name, createdAt',
  progressionLevels: 'id, progressionId, movementId, order',
  workouts: 'id, name, createdAt',
  workoutBlocks: 'id, workoutId, order',
  blockEntries: 'id, blockId, progressionId, movementId, order',
  workoutLogs: 'id, workoutId, startedAt, completedAt',
  setLogs: 'id, workoutLogId, movementId, order',
  inProgressWorkout: 'id, workoutId',
}).upgrade(async (tx) => {
  await Promise.all([
    tx.table('movements').clear(),
    tx.table('progressions').clear(),
    tx.table('progressionLevels').clear(),
    tx.table('workouts').clear(),
    tx.table('workoutBlocks').clear(),
    tx.table('blockEntries').clear(),
    tx.table('workoutLogs').clear(),
    tx.table('setLogs').clear(),
    tx.table('inProgressWorkout').clear(),
  ])
})

db.version(4).stores({
  movements: 'id, name, createdAt',
  progressions: 'id, name, createdAt',
  progressionLevels: 'id, progressionId, movementId, order',
  workouts: 'id, name, createdAt',
  workoutBlocks: 'id, workoutId, order',
  blockEntries: 'id, blockId, progressionId, movementId, order',
  workoutLogs: 'id, workoutId, startedAt, completedAt',
  setLogs: 'id, workoutLogId, movementId, order',
  inProgressWorkout: 'id, workoutId',
  programs: 'id, name, createdAt',
  programDays: 'id, programId, dayNumber',
  activePrograms: 'id, programId, status',
})

// v5: switch programs from date-driven scheduling to sequence-driven.
// ActiveProgram gains cycleProgress[]. Wipe per-run data (logs, active runs,
// in-progress workouts) so the new model starts from a clean state; seed
// definitions (movements/workouts/programs) stay intact.
db.version(5).stores({
  movements: 'id, name, createdAt',
  progressions: 'id, name, createdAt',
  progressionLevels: 'id, progressionId, movementId, order',
  workouts: 'id, name, createdAt',
  workoutBlocks: 'id, workoutId, order',
  blockEntries: 'id, blockId, progressionId, movementId, order',
  workoutLogs: 'id, workoutId, startedAt, completedAt',
  setLogs: 'id, workoutLogId, movementId, order',
  inProgressWorkout: 'id, workoutId',
  programs: 'id, name, createdAt',
  programDays: 'id, programId, dayNumber',
  activePrograms: 'id, programId, status',
}).upgrade(async (tx) => {
  await Promise.all([
    tx.table('workoutLogs').clear(),
    tx.table('setLogs').clear(),
    tx.table('inProgressWorkout').clear(),
    tx.table('activePrograms').clear(),
  ])
})

// v6: BlockEntry becomes a discriminated union with a `kind` field. SetLog
// gains an optional `progressionId` to make progression-grouped history
// queries possible without joining via name. Non-destructive: existing rows
// are transformed in place. New blockEntries index on `kind`; setLogs index
// on `progressionId` for fast per-progression queries.
db.version(6).stores({
  movements: 'id, name, createdAt',
  progressions: 'id, name, createdAt',
  progressionLevels: 'id, progressionId, movementId, order',
  workouts: 'id, name, createdAt',
  workoutBlocks: 'id, workoutId, order',
  blockEntries: 'id, blockId, progressionId, movementId, kind, order',
  workoutLogs: 'id, workoutId, startedAt, completedAt',
  setLogs: 'id, workoutLogId, movementId, progressionId, order',
  inProgressWorkout: 'id, workoutId',
  programs: 'id, name, createdAt',
  programDays: 'id, programId, dayNumber',
  activePrograms: 'id, programId, status',
}).upgrade(async (tx) => {
  // Backfill `kind` on every existing BlockEntry based on which legacy field
  // it carries. Movement-kind entries default mode to 'reps' to satisfy the
  // new required-mode constraint for that branch of the union.
  const entries = await tx.table('blockEntries').toArray()
  const updates = entries.map((e: Record<string, unknown>) => {
    if (e.progressionId) {
      return { ...e, kind: 'progression', movementId: undefined, mode: undefined }
    }
    return {
      ...e,
      kind: 'movement',
      mode: e.mode ?? 'reps',
      progressionId: undefined,
    }
  })
  if (updates.length > 0) {
    await tx.table('blockEntries').bulkPut(updates)
  }
  // SetLog.progressionId is optional; existing rows simply have it absent.
  // No backfill needed — the field defaults to undefined.
})

// v7: BlockEntry gains optional tempo + gate fields (non-indexed, no schema
// change needed there — additive). SetLog gains optional rir (also non-indexed).
// New `bodyweightLogs` table for the weekly Saturday weigh-in. Non-destructive
// — no clear, no upgrade transform required for additive properties.
db.version(7).stores({
  movements: 'id, name, createdAt',
  progressions: 'id, name, createdAt',
  progressionLevels: 'id, progressionId, movementId, order',
  workouts: 'id, name, createdAt',
  workoutBlocks: 'id, workoutId, order',
  blockEntries: 'id, blockId, progressionId, movementId, kind, order',
  workoutLogs: 'id, workoutId, startedAt, completedAt',
  setLogs: 'id, workoutLogId, movementId, progressionId, order',
  inProgressWorkout: 'id, workoutId',
  programs: 'id, name, createdAt',
  programDays: 'id, programId, dayNumber',
  activePrograms: 'id, programId, status',
  bodyweightLogs: 'id, date',
})

// v8: goals table. Indexed by movementId so the Home widget can look up
// active goals for a given movement quickly. Additive — no upgrade transform.
db.version(8).stores({
  movements: 'id, name, createdAt',
  progressions: 'id, name, createdAt',
  progressionLevels: 'id, progressionId, movementId, order',
  workouts: 'id, name, createdAt',
  workoutBlocks: 'id, workoutId, order',
  blockEntries: 'id, blockId, progressionId, movementId, kind, order',
  workoutLogs: 'id, workoutId, startedAt, completedAt',
  setLogs: 'id, workoutLogId, movementId, progressionId, order',
  inProgressWorkout: 'id, workoutId',
  programs: 'id, name, createdAt',
  programDays: 'id, programId, dayNumber',
  activePrograms: 'id, programId, status',
  bodyweightLogs: 'id, date',
  goals: 'id, movementId, createdAt',
})

// v9: settings singleton + additive weight fields on BlockEntry and SetLog.
// The weight/band fields are non-indexed (we never query by them) so adding
// them needs no schema change beyond declaring the new `settings` table.
db.version(9).stores({
  movements: 'id, name, createdAt',
  progressions: 'id, name, createdAt',
  progressionLevels: 'id, progressionId, movementId, order',
  workouts: 'id, name, createdAt',
  workoutBlocks: 'id, workoutId, order',
  blockEntries: 'id, blockId, progressionId, movementId, kind, order',
  workoutLogs: 'id, workoutId, startedAt, completedAt',
  setLogs: 'id, workoutLogId, movementId, progressionId, order',
  inProgressWorkout: 'id, workoutId',
  programs: 'id, name, createdAt',
  programDays: 'id, programId, dayNumber',
  activePrograms: 'id, programId, status',
  bodyweightLogs: 'id, date',
  goals: 'id, movementId, createdAt',
  settings: 'id',
})

// v10: skills table for the atlas feature. Additive — no upgrade transform
// needed. prerequisites are stored as a JSON array (non-indexed).
db.version(10).stores({
  movements: 'id, name, createdAt',
  progressions: 'id, name, createdAt',
  progressionLevels: 'id, progressionId, movementId, order',
  workouts: 'id, name, createdAt',
  workoutBlocks: 'id, workoutId, order',
  blockEntries: 'id, blockId, progressionId, movementId, kind, order',
  workoutLogs: 'id, workoutId, startedAt, completedAt',
  setLogs: 'id, workoutLogId, movementId, progressionId, order',
  inProgressWorkout: 'id, workoutId',
  programs: 'id, name, createdAt',
  programDays: 'id, programId, dayNumber',
  activePrograms: 'id, programId, status',
  bodyweightLogs: 'id, date',
  goals: 'id, movementId, createdAt',
  settings: 'id',
  skills: 'id, name, createdAt',
})

export { db }
