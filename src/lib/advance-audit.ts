import type { BlockEntry } from '@/models/types'

/**
 * Minimal shape representing a workout and its block entries, used for
 * the advance-audit check. Returned by workoutsRepository.getWorkoutEntryGroups.
 */
export interface WorkoutEntryGroup {
  workoutName: string
  entries: BlockEntry[]
}

/**
 * Returns the names of workouts that directly reference targetMovementId via
 * a movement-kind block entry.
 *
 * This is the hazard check described in CLAUDE.md: when a progression advances
 * to a new rung, the rung's movement may already be pinned as a direct
 * (movement-kind) entry in an existing workout, which would place it in the
 * rotation twice.
 *
 * Only movement-kind entries are flagged; progression-kind entries resolve at
 * runtime to whatever the current level is and are intentionally not counted.
 *
 * @param groups - One group per workout: { workoutName, entries }. Build from
 *   workoutsRepository.getWorkoutEntryGroups().
 * @param targetMovementId - The movementId of the rung being advanced INTO.
 * @returns Sorted array of workout names that contain the movement directly.
 */
export function auditAdvance(groups: WorkoutEntryGroup[], targetMovementId: string): string[] {
  return groups
    .filter((g) =>
      g.entries.some((e) => e.kind === 'movement' && e.movementId === targetMovementId),
    )
    .map((g) => g.workoutName)
    .sort()
}
