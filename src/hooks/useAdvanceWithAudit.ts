import { useCallback } from 'react'
import { useUpdateCurrentLevel } from './useProgressions'
import { progressionsRepository } from '@/repositories/progressions.repository'
import { workoutsRepository } from '@/repositories/workouts.repository'
import { auditAdvance } from '@/lib/advance-audit'
import { useConfirm } from '@/components/ui/confirm-context'

/**
 * Wraps useUpdateCurrentLevel with an advance-audit step.
 *
 * When advancing to a higher level, the hook:
 *   1. Loads the progression's levels to find the target movement.
 *   2. Fetches all workout entry groups.
 *   3. Runs auditAdvance to detect movement-kind entries that would duplicate
 *      the target movement in the rotation.
 *   4. If conflicts are found, shows a confirm dialog before committing.
 *
 * When moving to a lower level (regression) the audit is skipped — going
 * back never introduces duplicates.
 *
 * Usage:
 *   const { advance, isPending } = useAdvanceWithAudit()
 *   // advance returns a Promise<void> so callers can await it.
 *   await advance(progressionId, currentLevel, newLevel)
 */
export function useAdvanceWithAudit() {
  const updateCurrentLevel = useUpdateCurrentLevel()
  const confirm = useConfirm()

  const advance = useCallback(
    async (progressionId: string, currentLevel: number, newLevel: number): Promise<void> => {
      // Only audit when genuinely advancing (skips regressions and no-ops).
      if (newLevel > currentLevel) {
        const levels = await progressionsRepository.getLevels(progressionId)
        const targetLevel = levels[newLevel]

        if (targetLevel) {
          const groups = await workoutsRepository.getWorkoutEntryGroups()
          const conflicts = auditAdvance(groups, targetLevel.movementId)

          if (conflicts.length > 0) {
            const movementName = targetLevel.movement?.name ?? 'the next movement'
            const workoutList = conflicts.join(', ')
            const ok = await confirm({
              title: 'Duplicate exercise warning',
              description: `Advancing puts ${movementName} in your rotation twice — it's directly referenced in: ${workoutList}.`,
              confirmLabel: 'Advance anyway',
              cancelLabel: 'Cancel',
            })
            if (!ok) return
          }
        }
      }

      await updateCurrentLevel.mutateAsync({ id: progressionId, currentLevel: newLevel })
    },
    [updateCurrentLevel, confirm],
  )

  return { advance, isPending: updateCurrentLevel.isPending }
}
