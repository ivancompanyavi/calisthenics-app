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
  // Classification fields — set by the seed; optional so user-created
  // movements (which have no seed entry) can omit them without a type error.
  family?: MovementFamily
  prepTags?: PrepTag[]
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
  // Snooze fields for the readiness suggest-and-confirm card.
  // Non-indexed — no Dexie version bump required.
  // Set when the user dismisses the "ready to advance" card; cleared when they
  // advance or when a new qualifying session re-surfaces the card.
  dismissedAt?: number
  dismissedAtSessionCount?: number
}

// Advancement gate for a single progression rung. All numeric thresholds are
// "at least this" — sessions must hit the count AND each qualifying session
// must pass the effort/volume gates. Fields are intentionally optional so only
// the relevant gates need to be specified; absent gates are treated as
// non-vetoes (matching wasCleanHit semantics).
export interface ExitCriteria {
  // Number of consecutive qualifying sessions required to exit the rung.
  sessions: number
  // Minimum non-skipped sets per session (omit = no minimum).
  sets?: number
  // Minimum reps per set in reps mode (omit = target-hit is sufficient).
  minReps?: number
  // Minimum RIR on the last reps-mode set (omit = defaults to 2 when present;
  // absent RIR is always a non-veto).
  minRIR?: number
  // Minimum hold seconds per set in time/max mode (omit = target-hit is sufficient).
  minHoldSeconds?: number
  // Minimum SIR on the last time/max-mode set (omit = defaults to 1 when
  // present; absent SIR is always a non-veto).
  minSIR?: number
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
  // When present, overrides the global fallback used by evaluateExitCriteria.
  exitCriteria?: ExitCriteria
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
  // Loadable-exercise prescription. Stored canonically in kg; UI converts to
  // lb based on the user's Settings preference. Absent means "no weight" —
  // most calisthenics exercises (push-ups, pull-ups, holds) don't carry it.
  targetWeightKg?: number
  // Independent band-resistance prescription for band exercises. Numeric so
  // a future progression can compare across sessions. Convention: 1 = thinnest,
  // 5 = thickest, but the exact mapping is user-defined.
  targetBandLevel?: number
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
  // Seconds-in-reserve at the end of a hold set. 0 = nothing left (failure),
  // 1 = ~5s left, 2 = 10s+ left. Only captured on the final time/max set of
  // an exercise. Optional — pre-SIR logs and non-hold sets leave this undefined.
  sir?: 0 | 1 | 2
  // Weight / band-level prescription and actual performance. Stored canonical
  // in kg; UI converts based on Settings. See BlockEntryShared for semantics.
  targetWeightKg?: number
  actualWeightKg?: number
  targetBandLevel?: number
  actualBandLevel?: number
  // When true, this set is part of the auto-generated warm-up pre-block and
  // must be excluded from PR derivation, progression readiness metrics, and
  // volume accounting. Never set by hand on user-created logs.
  warmup?: boolean
}

// Bodyweight reading. The weekly Saturday prompt drives most rows; ad-hoc
// readings are also allowed. `kg` is stored — the UI does the unit display.
export interface BodyweightLog {
  id: string
  date: number
  kg: number
  notes?: string
}

// User-created food. No bundled USDA database in Phase 1a — every food the
// user logs against by refId lives here. Macros are per the unit named by
// `per`: either per 100g (scale by quantityG/100) or per serving (scale by
// servings, using servingGrams if a gram-quantity is also needed).
export interface CustomFood {
  id: string
  name: string
  brand?: string
  per: 'per100g' | 'perServing'
  servingGrams?: number
  kcal: number
  proteinG: number
  carbG: number
  fatG: number
  fiberG: number
  sodiumMg?: number
  createdAt: number
}

// 'usda' is reserved for Phase 1b (bundled USDA database lookups) — not
// produced by anything in Phase 1a, but included now so FoodLog rows written
// today remain forward-compatible with that source once it lands.
export type FoodSource = 'custom' | 'quickadd' | 'usda' | 'barcode'
export type MealLabel = 'breakfast' | 'lunch' | 'dinner' | 'snack'

// One logged food entry. Macros are denormalized — already scaled to the
// quantity actually eaten — so history/reports never need to re-join against
// CustomFood (which may since have been edited or deleted).
export interface FoodLog {
  id: string
  date: number // start-of-day epoch ms; the grouping key for daily totals
  loggedAt: number
  mealLabel?: MealLabel
  source: FoodSource
  refId?: string // CustomFood id this was logged from; undefined for quickadd
  name: string
  quantityG?: number
  servings?: number
  kcal: number
  proteinG: number
  carbG: number
  fatG: number
  fiberG: number
  sodiumMg?: number
  // Groups entries logged together from one Meal template (see mealRepository
  // .logMeal) so they can later be edited/removed as a unit. Absent for
  // individually-logged foods.
  mealInstanceId?: string
  notes?: string
}

// A reusable meal template — a named set of ingredients (e.g. "Breakfast bowl"
// = oats + milk + banana). Logging a meal expands into one FoodLog per item.
//
// Ingredients are SNAPSHOTTED, not linked to CustomFood by id: each item stores
// its own name + already-scaled macros. That keeps a meal self-contained — a
// food being edited or deleted never breaks it, and custom/USDA/quick-add
// ingredients are all handled uniformly. Mirrors FoodLog's denormalized-macros
// philosophy. `refId`/`source` are kept for provenance only.
export interface MealItem {
  name: string
  source: FoodSource
  refId?: string // the food this was captured from; provenance only, may be stale
  quantityG?: number
  servings?: number
  // Macros for this item at the portion above — already scaled, written
  // verbatim onto the FoodLog when the meal is logged.
  kcal: number
  proteinG: number
  carbG: number
  fatG: number
  fiberG: number
  sodiumMg?: number
}

export interface Meal {
  id: string
  name: string
  mealLabel?: MealLabel // default label stamped on entries when the meal is logged
  items: MealItem[]
  createdAt: number
}

// Body-measurement snapshot (tape or DEXA). Every field but id/date is
// optional — a single entry can record just the fields the user measured
// that day.
export interface Measurement {
  id: string
  date: number
  waistCm?: number
  neckCm?: number
  chestCm?: number
  leftArmCm?: number
  rightArmCm?: number
  leftThighCm?: number
  rightThighCm?: number
  hipsCm?: number
  leftCalfCm?: number
  rightCalfCm?: number
  bodyFatPct?: number
  source?: 'tape' | 'dexa'
  notes?: string
}

// Dated nutrition target. Rows are never mutated in place — a change in
// target inserts a new row so history is preserved; the "current" target is
// whichever row has the latest effectiveDate.
export interface NutritionTarget {
  id: string
  effectiveDate: number
  kcal: number
  proteinG: number
  carbG?: number
  fatG?: number
  fiberG?: number
  ratePctPerWeek?: number
  setBy: 'coach' | 'user'
  notes?: string
}

export type MovementFamily = 'push' | 'pull' | 'legs' | 'core'

// Prep-tag set used to derive warm-up needs for a given workout day.
// wrist-loaded → planche / handstand / parallette skills (require wrist warm-up)
// scap-pull    → heavy scapular-depression exercises (front lever, back lever, …)
// overhead     → pressing in the overhead / handstand plane
// heavy-push   → max-effort horizontal / vertical pressing
// hinge        → hip-hinge-dominant lower-body exercises
// grip         → exercises where grip fatigue is a real limiter (rows, pull-ups…)
export type PrepTag = 'wrist-loaded' | 'scap-pull' | 'overhead' | 'heavy-push' | 'hinge' | 'grip'

export type WeightUnit = 'kg' | 'lb'

// App-level user preferences. Singleton row (id always 'singleton'). Storage
// of weight values everywhere is canonical kg; this just controls display +
// input conversion at the UI layer.
export interface Settings {
  id: 'singleton'
  weightUnit: WeightUnit
  // Whether to play audio beeps + haptic pulses at T-3/2/1 and T-0 during
  // rest and time-mode exercise countdowns. Defaults to true.
  // Stored as a non-indexed field so no schema-version bump is required.
  soundCues?: boolean
  // When true, the rest timer freezes at 0:00 and waits for a manual tap
  // before entering the next exercise. When false (default), rest reaching
  // zero auto-advances into the next exercise (and arms its timer for
  // time/max modes) — the original behavior, which also fires the end-of-rest
  // cue on the resting→exercise transition.
  // Non-indexed — no Dexie version bump required.
  waitAfterRest?: boolean
  // When true, the warm-up pre-block is prepended to the execution queue.
  // When false (or absent), the warm-up is skipped. Last choice persists.
  // Non-indexed — no Dexie version bump required.
  warmupEnabled?: boolean
  // When true, opening the app on a scheduled-workout day fires a local
  // notification naming today's workout (requires Notification permission).
  // Local-first only — true background/push delivery needs a server, which is
  // deliberately out of scope (see docs/notifications-spike.md). Default false.
  // Non-indexed — no Dexie version bump required.
  workoutRemindersEnabled?: boolean
  // One-way mirror of training data to a private GitHub repo (coach sync).
  // The PAT lives here in plaintext — this is a single-user local-first app
  // with no server, so there's nowhere safer to put it; the token should be
  // scoped fine-grained/repo-limited on the GitHub side.
  // Non-indexed — no Dexie version bump required.
  githubSync?: {
    token: string
    owner: string
    repo: string
    enabled: boolean
    // Set when a push completes successfully; cleared implicitly by absence.
    lastSyncedAt?: number
    // True whenever local data has changed since the last confirmed push (or
    // a push attempt failed). The scheduler treats this as "sync owed" and
    // retries on next save, app start, and the `online` event.
    pendingSync?: boolean
    // Set to the error message of the most recent failed attempt; cleared on
    // the next successful push. Purely informational for the Settings UI.
    lastError?: string
    // The git blob sha of snapshot.json this device last synced with (pushed
    // or pulled) — the "base" for divergence detection. If the remote sha
    // differs from this, another device wrote since we last synced.
    lastSyncedSha?: string
    // Set when an automatic sync found the remote had diverged and backed off
    // instead of clobbering it. Signals the user to run a manual sync (which
    // surfaces the conflict resolver). Cleared once any sync resolves cleanly.
    needsAttention?: boolean
  }
}

// A self-set training goal pinned to a specific movement. Progress is
// derived at view time by comparing the movement's PR to targetReps/
// targetSeconds — no completedAt field, since "done" is a function of PRs
// that may continue improving past the goal.
export interface Goal {
  id: string
  movementId: string
  // At least one of these is set. Reps for rep-based goals (e.g., 10 pull-ups),
  // seconds for hold-based goals (e.g., 30s tuck planche hold).
  targetReps?: number
  targetSeconds?: number
  deadline?: number
  createdAt: number
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
  // Resolved blocks including any pre-start entry reordering. Absent on older
  // crash-recovery records — the hook falls back to re-resolving from the
  // workout definition in that case.
  blocks?: import('@/lib/execution-engine').ResolvedBlock[]
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
  // Optional human-readable notes (e.g. phase intent, deload guidance).
  // Non-indexed — no Dexie version bump required.
  description?: string
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
  targetWeightKg?: number
  targetBandLevel?: number
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

// ──────────────────────── Skill Atlas ────────────────────────

// A prerequisite for a skill node. Seed files reference progressions and
// movements by name; ensureSkillsExist() resolves those to ids at sync time.
export type SkillPrerequisite =
  | {
      kind: 'progression-level'
      // User's currentLevel in this progression must be ≥ levelOrder.
      progressionId: string
      levelOrder: number
    }
  | {
      kind: 'movement-pr'
      // User must have a PR for this movement meeting the threshold.
      movementId: string
      minReps?: number
      minSeconds?: number
    }

// A skill node in the atlas. Prerequisites are stored with resolved ids so
// the evaluator never needs to do name lookups at evaluation time.
export interface Skill {
  id: string
  name: string
  description?: string
  prerequisites: SkillPrerequisite[]
  // Content fingerprint — same semantics as Workout.seedFingerprint.
  seedFingerprint?: string
  createdAt: number
}
