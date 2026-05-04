export interface Movement {
  id: string
  name: string
  photo?: Blob
  description?: string
  createdAt: number
}

export interface Progression {
  id: string
  name: string
  currentLevel: number
  createdAt: number
}

export interface ProgressionLevel {
  id: string
  progressionId: string
  movementId: string
  order: number
}

export type BlockType = 'set' | 'superset'
export type SetMode = 'reps' | 'time'

export interface Workout {
  id: string
  name: string
  createdAt: number
}

export interface WorkoutBlock {
  id: string
  workoutId: string
  type: BlockType
  order: number
  rounds: number
  restSeconds: number
}

export interface BlockEntry {
  id: string
  blockId: string
  progressionId: string
  mode: SetMode
  targetReps?: number
  targetSeconds?: number
  order: number
}

export interface WorkoutLog {
  id: string
  workoutId: string
  workoutName: string
  startedAt: number
  completedAt: number
}

export interface SetLog {
  id: string
  workoutLogId: string
  movementId: string
  movementName: string
  targetReps?: number
  actualReps?: number
  targetSeconds?: number
  actualSeconds?: number
  round: number
  order: number
}

export interface InProgressWorkout {
  id: string
  workoutId: string
  workoutName: string
  startedAt: number
  currentBlockIndex: number
  currentRound: number
  currentEntryIndex: number
  completedSets: SetLog[]
}
