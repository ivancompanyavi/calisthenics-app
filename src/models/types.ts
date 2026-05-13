export interface Movement {
  id: string
  name: string
  photo?: Blob
  seedImagePath?: string
  description?: string
  coachingCues?: string
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
  mode: SetMode
  defaultTargetReps?: number
  defaultTargetSeconds?: number
  perSide?: boolean
}

export type BlockType = 'set' | 'superset'
export type SetMode = 'reps' | 'time' | 'max'

export interface Workout {
  id: string
  name: string
  restBetweenBlocksSeconds?: number
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
  progressionId?: string
  movementId?: string
  mode?: SetMode
  targetReps?: number
  targetSeconds?: number
  perSide?: boolean
  restSeconds?: number
  order: number
}

export interface WorkoutLog {
  id: string
  workoutId: string
  workoutName: string
  startedAt: number
  completedAt: number
  notes?: string
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
  perSide?: boolean
  skipped?: boolean
  notes?: string
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

export interface LevelUpCandidate {
  progressionId: string
  progressionName: string
  nextMovementName: string
}

export interface Program {
  id: string
  name: string
  cycleLengthDays: number
  totalCycles: number
  createdAt: number
}

export interface ProgramDay {
  id: string
  programId: string
  dayNumber: number
  workoutId?: string
}

export type ActiveProgramStatus = 'active' | 'completed' | 'abandoned'

export interface ActiveProgram {
  id: string
  programId: string
  startedAt: number
  currentCycle: number
  status: ActiveProgramStatus
}

export type DraftEntry = Omit<BlockEntry, 'blockId' | 'order'> & { id: string }

export interface DraftBlock {
  id: string
  type: BlockType
  rounds: number
  restSeconds: number
  entries: DraftEntry[]
}
