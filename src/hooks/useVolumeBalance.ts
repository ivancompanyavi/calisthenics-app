import { useMemo } from 'react'
import type { MovementFamily } from '@/models/types'
import { useAllSetLogs } from '@/hooks/useHistory'
import { useWorkoutLogs } from '@/hooks/useHistory'
import { useMovements } from '@/hooks/useMovements'
import {
  computeWeeklyFamilySplit,
  computeFamilyShareWarnings,
  computeCrossDayDriftWarnings,
} from '@/lib/volume-balance'
import type { WeeklyFamilySplit, VolumeWarning } from '@/lib/volume-balance'

export interface VolumeBalanceData {
  splits: WeeklyFamilySplit[]
  warnings: VolumeWarning[]
}

export function useVolumeBalance(): {
  data: VolumeBalanceData | null
  isLoading: boolean
} {
  const { data: setLogs, isLoading: loadingSets } = useAllSetLogs()
  const { data: workoutLogs, isLoading: loadingLogs } = useWorkoutLogs()
  const { data: movements, isLoading: loadingMovements } = useMovements()

  const data = useMemo((): VolumeBalanceData | null => {
    if (!setLogs || !workoutLogs || !movements) return null

    // Build movement-id → family lookup; skip movements without a family
    const familyByMovement = new Map<string, MovementFamily>(
      movements
        .filter((m): m is typeof m & { family: MovementFamily } => m.family != null)
        .map((m) => [m.id, m.family]),
    )

    const splits = computeWeeklyFamilySplit(setLogs, workoutLogs, familyByMovement)
    const familyShareWarnings = computeFamilyShareWarnings(splits)
    const crossDayWarnings = computeCrossDayDriftWarnings(
      setLogs,
      workoutLogs,
      familyByMovement,
    )

    return {
      splits,
      warnings: [...familyShareWarnings, ...crossDayWarnings],
    }
  }, [setLogs, workoutLogs, movements])

  return {
    data,
    isLoading: loadingSets || loadingLogs || loadingMovements,
  }
}
