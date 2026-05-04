import { db } from './index'
import { generateId } from '@/lib/utils'
import type { Movement, Progression, ProgressionLevel, Workout, WorkoutBlock, BlockEntry, SetMode } from '@/models/types'

interface SeedMovement {
  name: string
  description?: string
}

interface SeedProgression {
  name: string
  movements: string[]
}

interface SeedEntryDef {
  progression: string
  mode: SetMode
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
    movements: ['Wall Push-Ups', 'Incline Push-Ups', 'Knee Push-Ups', 'Push-Ups', 'Diamond Push-Ups', 'Archer Push-Ups', 'Pseudo Planche Push-Ups', 'One Arm Push-Ups'],
  },
  {
    name: 'Pull-Up Progression',
    movements: ['Dead Hang', 'Scapular Pulls', 'Australian Pull-Ups', 'Negative Pull-Ups', 'Band-Assisted Pull-Ups', 'Pull-Ups', 'L-Sit Pull-Ups', 'Archer Pull-Ups'],
  },
  {
    name: 'Dip Progression',
    movements: ['Parallel Bar Support Hold', 'Negative Dips', 'Band-Assisted Dips', 'Dips', 'Ring Dips', 'Weighted Dips'],
  },
  {
    name: 'Handstand Push-Up Progression',
    movements: ['Pike Push-Ups', 'Elevated Pike Push-Ups', 'Wall Handstand Hold', 'Wall Handstand Push-Ups', 'Freestanding Handstand Push-Ups'],
  },
  {
    name: 'L-Sit Progression',
    movements: ['Tucked L-Sit', 'One Leg L-Sit', 'L-Sit'],
  },
  {
    name: 'Squat Progression',
    movements: ['Assisted Squats', 'Bodyweight Squats', 'Bulgarian Split Squats', 'Shrimp Squats', 'Pistol Squats'],
  },
  {
    name: 'Leg Raise Progression',
    movements: ['Knee Raises', 'Leg Raises', 'Toes to Bar', 'Windshield Wipers'],
  },
  {
    name: 'Planche Progression',
    movements: ['Pseudo Planche Push-Ups', 'Tuck Planche', 'Advanced Tuck Planche', 'Straddle Planche', 'Full Planche'],
  },
  {
    name: 'Front Lever Progression',
    movements: ['Active Hang', 'Skin the Cat', 'Front Lever Tuck Hold', 'Front Lever'],
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
          { progression: 'Planche Progression', mode: 'max' },
          { progression: 'Planche Leans', mode: 'reps', targetReps: 10 },
          { progression: 'Planche Lean Hold', mode: 'max' },
        ],
      },
      {
        type: 'superset',
        rounds: 3,
        restSeconds: 60,
        entries: [
          { progression: 'Pseudo Push-Up Hold', mode: 'time', targetSeconds: 15 },
          { progression: 'Push-Up Progression', mode: 'reps', targetReps: 8 },
          { progression: 'Knee Archer Push-Ups', mode: 'reps', targetReps: 10, perSide: true },
          { progression: 'Slow Motion Push-Ups', mode: 'reps', targetReps: 1 },
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
          { progression: 'Push-Up Progression', mode: 'reps', targetReps: 10 },
          { progression: 'Pull-Up Progression', mode: 'reps', targetReps: 5 },
        ],
      },
      {
        type: 'superset',
        rounds: 3,
        restSeconds: 60,
        entries: [
          { progression: 'Dip Progression', mode: 'reps', targetReps: 8 },
          { progression: 'Squat Progression', mode: 'reps', targetReps: 10 },
        ],
      },
      {
        type: 'superset',
        rounds: 3,
        restSeconds: 45,
        entries: [
          { progression: 'L-Sit Progression', mode: 'time', targetSeconds: 20 },
          { progression: 'Leg Raise Progression', mode: 'reps', targetReps: 10 },
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
          { progression: 'Pull-Up Progression', mode: 'reps', targetReps: 6 },
        ],
      },
      {
        type: 'superset',
        rounds: 3,
        restSeconds: 60,
        entries: [
          { progression: 'Front Lever Progression', mode: 'max' },
          { progression: 'Leg Raise Progression', mode: 'reps', targetReps: 12 },
        ],
      },
      {
        type: 'set',
        rounds: 3,
        restSeconds: 60,
        entries: [
          { progression: 'L-Sit Progression', mode: 'max' },
        ],
      },
    ],
  },
]

export async function seedDatabase() {
  const movementCount = await db.movements.count()
  if (movementCount > 0) return

  const movementMap = new Map<string, string>()
  const movements: Movement[] = SEED_MOVEMENTS.map((m) => {
    const id = generateId()
    movementMap.set(m.name, id)
    return {
      id,
      name: m.name,
      description: m.description,
      createdAt: Date.now(),
    }
  })

  const progressionMap = new Map<string, string>()
  const progressions: Progression[] = []
  const levels: ProgressionLevel[] = []

  for (const sp of SEED_PROGRESSIONS) {
    const progId = generateId()
    progressionMap.set(sp.name, progId)
    progressions.push({
      id: progId,
      name: sp.name,
      currentLevel: 0,
      createdAt: Date.now(),
    })

    for (let i = 0; i < sp.movements.length; i++) {
      const movementId = movementMap.get(sp.movements[i])
      if (!movementId) continue
      levels.push({
        id: generateId(),
        progressionId: progId,
        movementId,
        order: i,
      })
    }
  }

  // Auto-wrap standalone movements referenced by workouts as single-level progressions
  for (const sw of SEED_WORKOUTS) {
    for (const block of sw.blocks) {
      for (const entry of block.entries) {
        if (!progressionMap.has(entry.progression)) {
          const movementId = movementMap.get(entry.progression)
          if (!movementId) continue
          const progId = generateId()
          progressionMap.set(entry.progression, progId)
          progressions.push({
            id: progId,
            name: entry.progression,
            currentLevel: 0,
            createdAt: Date.now(),
          })
          levels.push({
            id: generateId(),
            progressionId: progId,
            movementId,
            order: 0,
          })
        }
      }
    }
  }

  const workouts: Workout[] = []
  const workoutBlocks: WorkoutBlock[] = []
  const blockEntries: BlockEntry[] = []

  for (const sw of SEED_WORKOUTS) {
    const workoutId = generateId()
    workouts.push({
      id: workoutId,
      name: sw.name,
      restBetweenBlocksSeconds: sw.restBetweenBlocksSeconds,
      createdAt: Date.now(),
    })

    for (let i = 0; i < sw.blocks.length; i++) {
      const blockDef = sw.blocks[i]
      const blockId = generateId()
      workoutBlocks.push({
        id: blockId,
        workoutId,
        type: blockDef.type,
        order: i,
        rounds: blockDef.rounds,
        restSeconds: blockDef.restSeconds,
      })

      for (let j = 0; j < blockDef.entries.length; j++) {
        const entryDef = blockDef.entries[j]
        const progressionId = progressionMap.get(entryDef.progression)
        if (!progressionId) continue
        blockEntries.push({
          id: generateId(),
          blockId,
          progressionId,
          mode: entryDef.mode,
          targetReps: entryDef.targetReps,
          targetSeconds: entryDef.targetSeconds,
          perSide: entryDef.perSide,
          order: j,
        })
      }
    }
  }

  await db.transaction('rw', [db.movements, db.progressions, db.progressionLevels, db.workouts, db.workoutBlocks, db.blockEntries], async () => {
    await db.movements.bulkAdd(movements)
    await db.progressions.bulkAdd(progressions)
    await db.progressionLevels.bulkAdd(levels)
    await db.workouts.bulkAdd(workouts)
    await db.workoutBlocks.bulkAdd(workoutBlocks)
    await db.blockEntries.bulkAdd(blockEntries)
  })
}
