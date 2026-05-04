import { db } from './index'
import { generateId } from '@/lib/utils'
import type { Movement, Progression, ProgressionLevel } from '@/models/types'

interface SeedMovement {
  name: string
  description?: string
}

interface SeedProgression {
  name: string
  movements: string[]
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

  const progressions: Progression[] = []
  const levels: ProgressionLevel[] = []

  for (const sp of SEED_PROGRESSIONS) {
    const progId = generateId()
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

  await db.transaction('rw', [db.movements, db.progressions, db.progressionLevels], async () => {
    await db.movements.bulkAdd(movements)
    await db.progressions.bulkAdd(progressions)
    await db.progressionLevels.bulkAdd(levels)
  })
}
