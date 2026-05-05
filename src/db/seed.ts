import { db } from './index'
import { generateId } from '@/lib/utils'
import type { Movement, Progression, ProgressionLevel, Workout, WorkoutBlock, BlockEntry, SetMode, Program, ProgramDay } from '@/models/types'

interface SeedMovement {
  name: string
  description?: string
}

interface SeedLevelDef {
  movement: string
  mode: SetMode
  defaultTargetReps?: number
  defaultTargetSeconds?: number
  perSide?: boolean
}

interface SeedProgression {
  name: string
  levels: SeedLevelDef[]
}

interface SeedEntryDef {
  progression?: string
  movement?: string
  mode?: SetMode
  targetReps?: number
  targetSeconds?: number
  perSide?: boolean
}

interface SeedBlockDef {
  type: 'set' | 'superset'
  rounds: number
  restSeconds: number
  entries: SeedEntryDef[]
}

interface SeedWorkout {
  name: string
  restBetweenBlocksSeconds?: number
  blocks: SeedBlockDef[]
}

interface SeedProgram {
  name: string
  totalCycles: number
  days: Array<{ workout: string } | null>
}

const SEED_PROGRAMS: SeedProgram[] = [
  {
    name: 'Calisthenics Fundamentals',
    totalCycles: 4,
    days: [
      { workout: 'Chest (Planche)' },
      null,
      { workout: 'Full Body A' },
      null,
      { workout: 'Pull Day' },
      { workout: 'Chest (Planche)' },
      null,
    ],
  },
]

const SEED_MOVEMENTS: SeedMovement[] = [
  { name: 'Wall Push-Ups', description: 'Push-ups performed against a wall, great for beginners.' },
  { name: 'Incline Push-Ups', description: 'Push-ups with hands on an elevated surface.' },
  { name: 'Knee Push-Ups', description: 'Push-ups from the knees instead of toes.' },
  { name: 'Push-Ups', description: 'Standard push-ups from the toes.' },
  { name: 'Diamond Push-Ups', description: 'Push-ups with hands close together forming a diamond shape.' },
  { name: 'Archer Push-Ups', description: 'Wide push-ups shifting weight to one arm.' },
  { name: 'Pseudo Planche Push-Ups', description: 'Push-ups with hands turned back near the waist.' },
  { name: 'One Arm Push-Ups', description: 'Push-ups performed with a single arm.' },

  { name: 'Dead Hang', description: 'Passive hang from a bar to build grip strength.' },
  { name: 'Active Hang', description: 'Hang from a bar with scapulae depressed and retracted.' },
  { name: 'Scapular Pulls', description: 'Hang from the bar and pull shoulder blades down and together.' },
  { name: 'Negative Pull-Ups', description: 'Jump to the top and slowly lower yourself.' },
  { name: 'Band-Assisted Pull-Ups', description: 'Pull-ups with a resistance band for assistance.' },
  { name: 'Pull-Ups', description: 'Standard pull-ups with palms facing away.' },
  { name: 'L-Sit Pull-Ups', description: 'Pull-ups while holding an L-sit position.' },
  { name: 'Archer Pull-Ups', description: 'Wide-grip pull-ups shifting weight to one arm.' },

  { name: 'Parallel Bar Support Hold', description: 'Hold yourself up on parallel bars with arms locked.' },
  { name: 'Negative Dips', description: 'Lower yourself slowly on dip bars.' },
  { name: 'Band-Assisted Dips', description: 'Dips with a resistance band for assistance.' },
  { name: 'Dips', description: 'Standard parallel bar dips.' },
  { name: 'Ring Dips', description: 'Dips performed on gymnastic rings.' },
  { name: 'Weighted Dips', description: 'Dips with additional weight attached.' },

  { name: 'Wall Handstand Hold', description: 'Hold a handstand position against a wall.' },
  { name: 'Pike Push-Ups', description: 'Push-ups in a pike position to target shoulders.' },
  { name: 'Elevated Pike Push-Ups', description: 'Pike push-ups with feet on an elevated surface.' },
  { name: 'Wall Handstand Push-Ups', description: 'Handstand push-ups against a wall.' },
  { name: 'Freestanding Handstand Push-Ups', description: 'Handstand push-ups without wall support.' },

  { name: 'Tucked L-Sit', description: 'L-sit with knees tucked on the floor or parallettes.' },
  { name: 'One Leg L-Sit', description: 'L-sit with one leg extended.' },
  { name: 'L-Sit', description: 'Full L-sit hold with both legs extended.' },

  { name: 'Assisted Squats', description: 'Squats while holding onto a support.' },
  { name: 'Bodyweight Squats', description: 'Standard squats with no added weight.' },
  { name: 'Bulgarian Split Squats', description: 'Single-leg squat with rear foot elevated.' },
  { name: 'Shrimp Squats', description: 'Single-leg squat holding the back foot.' },
  { name: 'Pistol Squats', description: 'Full single-leg squat with the other leg extended.' },

  { name: 'Knee Raises', description: 'Hang from a bar and raise knees to chest.' },
  { name: 'Leg Raises', description: 'Hang from a bar and raise straight legs.' },
  { name: 'Toes to Bar', description: 'Hang from a bar and bring toes to touch the bar.' },
  { name: 'Windshield Wipers', description: 'Hang and rotate extended legs side to side.' },

  { name: 'Plank', description: 'Standard forearm plank hold.' },
  { name: 'Side Plank', description: 'Plank on one forearm, body sideways.' },
  { name: 'Hollow Body Hold', description: 'Lie on back with arms and legs extended off the ground.' },
  { name: 'Superman Hold', description: 'Lie face down and lift arms and legs off the ground.' },

  { name: 'Jumping Jacks', description: 'Classic cardio warm-up exercise.' },
  { name: 'Burpees', description: 'Full body exercise combining squat, plank, and jump.' },
  { name: 'Mountain Climbers', description: 'Plank position alternating knee drives.' },
  { name: 'Box Jumps', description: 'Jump onto an elevated surface.' },
  { name: 'Australian Pull-Ups', description: 'Inverted rows under a low bar.' },
  { name: 'Tuck Planche', description: 'Planche position with knees tucked to chest.' },
  { name: 'Advanced Tuck Planche', description: 'Planche with hips higher and knees slightly extended.' },
  { name: 'Straddle Planche', description: 'Planche with legs spread apart.' },
  { name: 'Full Planche', description: 'Horizontal hold with body fully extended.' },
  { name: 'Planche Leans', description: 'Lean forward in a planche position on the floor, shifting weight onto hands.' },
  { name: 'Planche Lean Hold', description: 'Hold the forward-leaning planche position isometrically.' },
  { name: 'Pseudo Push-Up Hold', description: 'Hold the bottom or top position of a pseudo planche push-up.' },
  { name: 'Knee Archer Push-Ups', description: 'Archer push-ups performed from the knees, shifting weight to one arm per rep.' },
  { name: 'Slow Motion Push-Ups', description: 'Push-ups performed at an extremely slow tempo for time under tension.' },
  { name: 'Skin the Cat', description: 'Hang and rotate body through arms on rings or bar.' },
  { name: 'Back Lever', description: 'Hang inverted with body horizontal behind the bar.' },
  { name: 'Front Lever Tuck Hold', description: 'Inverted horizontal hold with knees tucked.' },
  { name: 'Front Lever', description: 'Horizontal hold facing up with body fully extended.' },
  { name: 'Muscle-Up', description: 'Pull-up transitioning above the bar into a dip.' },
]

const SEED_PROGRESSIONS: SeedProgression[] = [
  {
    name: 'Push-Up Progression',
    levels: [
      { movement: 'Wall Push-Ups', mode: 'reps', defaultTargetReps: 15 },
      { movement: 'Incline Push-Ups', mode: 'reps', defaultTargetReps: 12 },
      { movement: 'Knee Push-Ups', mode: 'reps', defaultTargetReps: 12 },
      { movement: 'Push-Ups', mode: 'reps', defaultTargetReps: 10 },
      { movement: 'Diamond Push-Ups', mode: 'reps', defaultTargetReps: 10 },
      { movement: 'Archer Push-Ups', mode: 'reps', defaultTargetReps: 8, perSide: true },
      { movement: 'Pseudo Planche Push-Ups', mode: 'reps', defaultTargetReps: 8 },
      { movement: 'One Arm Push-Ups', mode: 'reps', defaultTargetReps: 5, perSide: true },
    ],
  },
  {
    name: 'Pull-Up Progression',
    levels: [
      { movement: 'Dead Hang', mode: 'time', defaultTargetSeconds: 30 },
      { movement: 'Scapular Pulls', mode: 'reps', defaultTargetReps: 10 },
      { movement: 'Australian Pull-Ups', mode: 'reps', defaultTargetReps: 12 },
      { movement: 'Negative Pull-Ups', mode: 'reps', defaultTargetReps: 8 },
      { movement: 'Band-Assisted Pull-Ups', mode: 'reps', defaultTargetReps: 8 },
      { movement: 'Pull-Ups', mode: 'reps', defaultTargetReps: 8 },
      { movement: 'L-Sit Pull-Ups', mode: 'reps', defaultTargetReps: 6 },
      { movement: 'Archer Pull-Ups', mode: 'reps', defaultTargetReps: 5, perSide: true },
    ],
  },
  {
    name: 'Dip Progression',
    levels: [
      { movement: 'Parallel Bar Support Hold', mode: 'time', defaultTargetSeconds: 30 },
      { movement: 'Negative Dips', mode: 'reps', defaultTargetReps: 8 },
      { movement: 'Band-Assisted Dips', mode: 'reps', defaultTargetReps: 10 },
      { movement: 'Dips', mode: 'reps', defaultTargetReps: 10 },
      { movement: 'Ring Dips', mode: 'reps', defaultTargetReps: 8 },
      { movement: 'Weighted Dips', mode: 'reps', defaultTargetReps: 8 },
    ],
  },
  {
    name: 'Handstand Push-Up Progression',
    levels: [
      { movement: 'Pike Push-Ups', mode: 'reps', defaultTargetReps: 12 },
      { movement: 'Elevated Pike Push-Ups', mode: 'reps', defaultTargetReps: 10 },
      { movement: 'Wall Handstand Hold', mode: 'time', defaultTargetSeconds: 30 },
      { movement: 'Wall Handstand Push-Ups', mode: 'reps', defaultTargetReps: 8 },
      { movement: 'Freestanding Handstand Push-Ups', mode: 'reps', defaultTargetReps: 5 },
    ],
  },
  {
    name: 'L-Sit Progression',
    levels: [
      { movement: 'Tucked L-Sit', mode: 'time', defaultTargetSeconds: 20 },
      { movement: 'One Leg L-Sit', mode: 'time', defaultTargetSeconds: 15 },
      { movement: 'L-Sit', mode: 'time', defaultTargetSeconds: 15 },
    ],
  },
  {
    name: 'Squat Progression',
    levels: [
      { movement: 'Assisted Squats', mode: 'reps', defaultTargetReps: 15 },
      { movement: 'Bodyweight Squats', mode: 'reps', defaultTargetReps: 15 },
      { movement: 'Bulgarian Split Squats', mode: 'reps', defaultTargetReps: 10, perSide: true },
      { movement: 'Shrimp Squats', mode: 'reps', defaultTargetReps: 8, perSide: true },
      { movement: 'Pistol Squats', mode: 'reps', defaultTargetReps: 5, perSide: true },
    ],
  },
  {
    name: 'Leg Raise Progression',
    levels: [
      { movement: 'Knee Raises', mode: 'reps', defaultTargetReps: 12 },
      { movement: 'Leg Raises', mode: 'reps', defaultTargetReps: 10 },
      { movement: 'Toes to Bar', mode: 'reps', defaultTargetReps: 8 },
      { movement: 'Windshield Wipers', mode: 'reps', defaultTargetReps: 6 },
    ],
  },
  {
    name: 'Planche Progression',
    levels: [
      { movement: 'Pseudo Planche Push-Ups', mode: 'reps', defaultTargetReps: 10 },
      { movement: 'Tuck Planche', mode: 'max' },
      { movement: 'Advanced Tuck Planche', mode: 'max' },
      { movement: 'Straddle Planche', mode: 'max' },
      { movement: 'Full Planche', mode: 'max' },
    ],
  },
  {
    name: 'Front Lever Progression',
    levels: [
      { movement: 'Active Hang', mode: 'time', defaultTargetSeconds: 30 },
      { movement: 'Skin the Cat', mode: 'reps', defaultTargetReps: 8 },
      { movement: 'Front Lever Tuck Hold', mode: 'max' },
      { movement: 'Front Lever', mode: 'max' },
    ],
  },
]

const SEED_WORKOUTS: SeedWorkout[] = [
  {
    name: 'Chest (Planche)',
    restBetweenBlocksSeconds: 120,
    blocks: [
      {
        type: 'superset',
        rounds: 3,
        restSeconds: 60,
        entries: [
          { progression: 'Planche Progression' },
          { movement: 'Planche Leans', mode: 'reps', targetReps: 10 },
          { movement: 'Planche Lean Hold', mode: 'max' },
        ],
      },
      {
        type: 'superset',
        rounds: 3,
        restSeconds: 60,
        entries: [
          { movement: 'Pseudo Push-Up Hold', mode: 'time', targetSeconds: 15 },
          { progression: 'Push-Up Progression', targetReps: 8 },
          { movement: 'Knee Archer Push-Ups', mode: 'reps', targetReps: 10, perSide: true },
          { movement: 'Slow Motion Push-Ups', mode: 'reps', targetReps: 1 },
        ],
      },
    ],
  },
  {
    name: 'Full Body A',
    restBetweenBlocksSeconds: 90,
    blocks: [
      {
        type: 'superset',
        rounds: 3,
        restSeconds: 60,
        entries: [
          { progression: 'Push-Up Progression', targetReps: 10 },
          { progression: 'Pull-Up Progression', targetReps: 5 },
        ],
      },
      {
        type: 'superset',
        rounds: 3,
        restSeconds: 60,
        entries: [
          { progression: 'Dip Progression', targetReps: 8 },
          { progression: 'Squat Progression', targetReps: 10 },
        ],
      },
      {
        type: 'superset',
        rounds: 3,
        restSeconds: 45,
        entries: [
          { progression: 'L-Sit Progression', targetSeconds: 20 },
          { progression: 'Leg Raise Progression', targetReps: 10 },
        ],
      },
    ],
  },
  {
    name: 'Pull Day',
    restBetweenBlocksSeconds: 90,
    blocks: [
      {
        type: 'set',
        rounds: 4,
        restSeconds: 90,
        entries: [
          { progression: 'Pull-Up Progression', targetSeconds: 30 },
        ],
      },
      {
        type: 'superset',
        rounds: 3,
        restSeconds: 60,
        entries: [
          { progression: 'Front Lever Progression' },
          { progression: 'Leg Raise Progression', targetReps: 12 },
        ],
      },
      {
        type: 'set',
        rounds: 3,
        restSeconds: 60,
        entries: [
          { progression: 'L-Sit Progression' },
        ],
      },
    ],
  },
]

async function ensureMovementsExist(): Promise<Map<string, string>> {
  const movementMap = new Map<string, string>()
  const existing = await db.movements.toArray()
  for (const m of existing) {
    movementMap.set(m.name, m.id)
  }

  const toAdd: Movement[] = []
  for (const m of SEED_MOVEMENTS) {
    if (!movementMap.has(m.name)) {
      const id = generateId()
      movementMap.set(m.name, id)
      toAdd.push({ id, name: m.name, description: m.description, createdAt: Date.now() })
    }
  }

  if (toAdd.length > 0) {
    await db.movements.bulkAdd(toAdd)
  }
  return movementMap
}

async function ensureProgressionsExist(movementMap: Map<string, string>): Promise<Map<string, string>> {
  const progressionMap = new Map<string, string>()
  const existing = await db.progressions.toArray()
  for (const p of existing) {
    progressionMap.set(p.name, p.id)
  }

  const newProgressions: Progression[] = []
  const newLevels: ProgressionLevel[] = []

  for (const sp of SEED_PROGRESSIONS) {
    if (progressionMap.has(sp.name)) continue
    const progId = generateId()
    progressionMap.set(sp.name, progId)
    newProgressions.push({ id: progId, name: sp.name, currentLevel: 0, createdAt: Date.now() })

    for (let i = 0; i < sp.levels.length; i++) {
      const lvl = sp.levels[i]
      const movementId = movementMap.get(lvl.movement)
      if (!movementId) continue
      newLevels.push({
        id: generateId(),
        progressionId: progId,
        movementId,
        order: i,
        mode: lvl.mode,
        defaultTargetReps: lvl.defaultTargetReps,
        defaultTargetSeconds: lvl.defaultTargetSeconds,
        perSide: lvl.perSide,
      })
    }
  }

  if (newProgressions.length > 0) {
    await db.progressions.bulkAdd(newProgressions)
    await db.progressionLevels.bulkAdd(newLevels)
  }
  return progressionMap
}

async function ensureWorkoutsExist(progressionMap: Map<string, string>, movementMap: Map<string, string>) {
  const existingWorkouts = await db.workouts.toArray()
  const existingNames = new Set(existingWorkouts.map((w) => w.name))

  const newWorkouts: Workout[] = []
  const newBlocks: WorkoutBlock[] = []
  const newEntries: BlockEntry[] = []

  for (const sw of SEED_WORKOUTS) {
    if (existingNames.has(sw.name)) continue

    const workoutId = generateId()
    newWorkouts.push({
      id: workoutId,
      name: sw.name,
      restBetweenBlocksSeconds: sw.restBetweenBlocksSeconds,
      createdAt: Date.now(),
    })

    for (let i = 0; i < sw.blocks.length; i++) {
      const blockDef = sw.blocks[i]
      const blockId = generateId()
      newBlocks.push({
        id: blockId,
        workoutId,
        type: blockDef.type,
        order: i,
        rounds: blockDef.rounds,
        restSeconds: blockDef.restSeconds,
      })

      for (let j = 0; j < blockDef.entries.length; j++) {
        const entryDef = blockDef.entries[j]

        if (entryDef.movement) {
          const movementId = movementMap.get(entryDef.movement)
          if (!movementId) continue
          newEntries.push({
            id: generateId(),
            blockId,
            movementId,
            mode: entryDef.mode,
            targetReps: entryDef.targetReps,
            targetSeconds: entryDef.targetSeconds,
            perSide: entryDef.perSide,
            order: j,
          })
        } else if (entryDef.progression) {
          const progressionId = progressionMap.get(entryDef.progression)
          if (!progressionId) continue
          newEntries.push({
            id: generateId(),
            blockId,
            progressionId,
            targetReps: entryDef.targetReps,
            targetSeconds: entryDef.targetSeconds,
            perSide: entryDef.perSide,
            order: j,
          })
        }
      }
    }
  }

  if (newWorkouts.length > 0) {
    await db.transaction('rw', [db.workouts, db.workoutBlocks, db.blockEntries], async () => {
      await db.workouts.bulkAdd(newWorkouts)
      await db.workoutBlocks.bulkAdd(newBlocks)
      await db.blockEntries.bulkAdd(newEntries)
    })
  }
}

async function ensureProgramsExist() {
  const existingPrograms = await db.programs.toArray()
  const existingNames = new Set(existingPrograms.map((p) => p.name))

  const allWorkouts = await db.workouts.toArray()
  const workoutByName = new Map(allWorkouts.map((w) => [w.name, w.id]))

  const newPrograms: Program[] = []
  const newDays: ProgramDay[] = []

  for (const sp of SEED_PROGRAMS) {
    if (existingNames.has(sp.name)) continue

    const programId = generateId()
    newPrograms.push({
      id: programId,
      name: sp.name,
      cycleLengthDays: sp.days.length,
      totalCycles: sp.totalCycles,
      createdAt: Date.now(),
    })

    for (let i = 0; i < sp.days.length; i++) {
      const day = sp.days[i]
      newDays.push({
        id: generateId(),
        programId,
        dayNumber: i + 1,
        workoutId: day ? workoutByName.get(day.workout) : undefined,
      })
    }
  }

  if (newPrograms.length > 0) {
    await db.transaction('rw', [db.programs, db.programDays], async () => {
      await db.programs.bulkAdd(newPrograms)
      await db.programDays.bulkAdd(newDays)
    })
  }
}

export async function seedDatabase() {
  const movementMap = await ensureMovementsExist()
  const progressionMap = await ensureProgressionsExist(movementMap)
  await ensureWorkoutsExist(progressionMap, movementMap)
  await ensureProgramsExist()
}
