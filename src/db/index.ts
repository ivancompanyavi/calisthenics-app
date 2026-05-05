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

export { db }
