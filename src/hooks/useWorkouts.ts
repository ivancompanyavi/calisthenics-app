import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'
import { workoutsRepository, type SaveWorkoutData } from '@/repositories/workouts.repository'
import { programsRepository } from '@/repositories/programs.repository'

export type { SaveWorkoutData }

export function useWorkouts() {
  return useQuery({
    queryKey: queryKeys.workouts.all,
    queryFn: () => workoutsRepository.getAll(),
  })
}

export function useWorkout(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.workouts.detail(id!),
    queryFn: () => workoutsRepository.getById(id!),
    enabled: !!id,
  })
}

export function useWorkoutBlocks(workoutId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.workouts.blocks(workoutId!),
    queryFn: () => workoutsRepository.getBlocks(workoutId!),
    enabled: !!workoutId,
  })
}

export function useBlockEntries(blockId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.workouts.entries(blockId!),
    queryFn: () => workoutsRepository.getEntries(blockId!),
    enabled: !!blockId,
  })
}

export function useAllBlockEntries(blockIds: string[]) {
  return useQuery({
    queryKey: queryKeys.workouts.entriesBulk(blockIds),
    queryFn: () => workoutsRepository.getEntriesBulk(blockIds),
    enabled: blockIds.length > 0,
  })
}

// Opt-in step-up offers for a workout's pattern slots (harder unlocked lines
// the adaptive resolver is deliberately NOT auto-applying). Invalidated with
// the progressions key: adopting/dismissing writes to the progression row.
export function useUpgradeSuggestions(workoutId: string | undefined) {
  return useQuery({
    queryKey: [...queryKeys.progressions.all, 'upgradeSuggestions', workoutId],
    queryFn: async () => {
      const blocks = await workoutsRepository.getBlocks(workoutId!)
      const entries = await workoutsRepository.getEntriesBulk(blocks.map((b) => b.id))
      const { upgradeSuggestions } = await workoutsRepository.resolveBlocksDetailed(blocks, entries)
      return upgradeSuggestions
    },
    enabled: !!workoutId,
  })
}

export function useSaveWorkout() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: SaveWorkoutData & { id?: string }) => workoutsRepository.save(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.workouts.all })
      qc.invalidateQueries({ queryKey: ['workoutBlocks'] })
      qc.invalidateQueries({ queryKey: ['blockEntries'] })
    },
  })
}

export function useDeleteWorkout() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => workoutsRepository.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.workouts.all })
      qc.invalidateQueries({ queryKey: queryKeys.programs.currentSlot })
    },
  })
}

export async function checkWorkoutProgramUsage(workoutId: string): Promise<string[]> {
  return programsRepository.checkWorkoutUsage(workoutId)
}
