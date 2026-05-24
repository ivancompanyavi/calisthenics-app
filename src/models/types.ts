export interface Movement {
  id: string
  name: string
  photo?: Blob
  seedImagePath?: string
  description?: string
  coachingCues?: string
  // External URL for a form-check reference (YouTube, Instagram, blog post).
  // Stored as a plain string — we don't embed video to keep IndexedDB lean.
  referenceUrl?: string
  createdAt: number
}

export interface Progression {
  id: string
  name: string
  currentLevel: number
  createdAt: number
  // See Workout.seedFingerprint — same idea for progressions. Lets the seed
  // loop skip the levels rewrite when nothing changed.
  seedFingerprint?: string
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
export type BlockEntryKind = 'progression' | 'movement'

// Tempo notation per rep: eccentric (descent) - bottom pause - concentric
// (ascent) - top pause, all in seconds. Convention matches Vadnal/Sommer:
// e.g. 3-1-1-0 = 3s down, 1s bottom, 1s up, 0s top. `X` (max speed) on the
// concentric is encoded as 0.
export interface TempoSpec {
  eccentric: number
  bottomPause: number
  concentric: number
  topPause: number
}

// Pre-flight autoregulation gate. When present on a BlockEntry the execution
// engine shows the question before entering the exercise phase; on a No
// answer with `skipOnNo: true` the entry is auto-skipped and logged with the
// gate's reason in SetLog.notes.
export interface GateSpec {
  question: string
  skipOnNo: boolean
}

export interface Workout {
  id: string
  name: string
  restBetweenBlocksSeconds?: number
  createdAt: number
  // Hash of the seed definition the row was last reconciled against. Lets the
  // seed-on-startup loop skip the expensive blocks/entries rewrite when the
  // seed hasn't changed since the last run. Absent on user-created workouts.
  seedFingerprint?: string
}

export interface WorkoutBlock {
  id: string
  workoutId: string
  type: BlockType
  order: number
  rounds: number
  restSeconds: number
}

interface BlockEntryShared {
  id: string
  blockId: string
  order: number
  targetReps?: number
  targetSeconds?: number
  perSide?: boolean
  restSeconds?: number
  tempo?: TempoSpec
  gate?: GateSpec
}

// Discriminated union: an entry is either driven by a progression (movement +
// mode are derived from the progression's current level) or a standalone
// movement (movement + mode live on the entry itself). `kind` lets TypeScript
// narrow the two paths instead of the previous "trust the optional fields"
// pattern that allowed nonsensical { progressionId, movementId } pairs.
export type BlockEntry =
  | (BlockEntryShared & {
      kind: 'progression'
      progressionId: string
      movementId?: never
      mode?: never
    })
  | (BlockEntryShared & {
      kind: 'movement'
      movementId: string
      mode: SetMode
      progressionId?: never
    })

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
  // When the set was performed against a progression, record which one so
  // history/analytics can group across renames and level changes without
  // reverse-engineering the link from movementId.
  progressionId?: string
  targetReps?: number
  actualReps?: number
  targetSeconds?: number
  actualSeconds?: number
  perSide?: boolean
  skipped?: boolean
  notes?: string
  round: number
  order: number
  // Reps-in-reserve at the end of the set. 0 = went to failure, 3 = could have
  // done 3 more clean reps. Optional — pre-RIR logs leave this undefined.
  rir?: number
}

// Bodyweight reading. The weekly Saturday prompt drives most rows; ad-hoc
// readings are also allowed. `kg` is stored — the UI does the unit display.
export interface BodyweightLog {
  id: string
  date: number
  kg: number
  notes?: string
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
  programDayIndex?: number
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
  // See Workout.seedFingerprint — same idea for programs.
  seedFingerprint?: string
}

export interface ProgramDay {
  id: string
  programId: string
  dayNumber: number
  workoutId?: string
}

export type ActiveProgramStatus = 'active' | 'completed' | 'abandoned'

export type CycleSlotStatus = 'pending' | 'done' | 'skipped'

export interface CycleSlot {
  status: CycleSlotStatus
  completedAt?: number
  workoutLogId?: string
}

export interface ActiveProgram {
  id: string
  programId: string
  startedAt: number
  currentCycle: number
  status: ActiveProgramStatus
  cycleProgress: CycleSlot[]
  // Most recent slot completion (workout or rest). Survives cycle resets so
  // "I already trained today" can be checked even if the rest-day mark was
  // what completed the cycle.
  lastActivityAt?: number
  lastActivityName?: string
  lastActivityWasRest?: boolean
}

// DraftEntry mirrors BlockEntry's discriminated union shape (TS's Omit<> over
// a union collapses the discrimination, so we define it directly).
interface DraftEntryShared {
  id: string
  targetReps?: number
  targetSeconds?: number
  perSide?: boolean
  restSeconds?: number
  tempo?: TempoSpec
  gate?: GateSpec
}

export type DraftEntry =
  | (DraftEntryShared & {
      kind: 'progression'
      progressionId: string
      movementId?: never
      mode?: never
    })
  | (DraftEntryShared & {
      kind: 'movement'
      movementId: string
      mode: SetMode
      progressionId?: never
    })

export interface DraftBlock {
  id: string
  type: BlockType
  rounds: number
  restSeconds: number
  entries: DraftEntry[]
}
