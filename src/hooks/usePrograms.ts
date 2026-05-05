import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'
import { programsRepository, type SaveProgramData } from '@/repositories/programs.repository'

export function usePrograms() {
  return useQuery({
    queryKey: queryKeys.programs.all,
    queryFn: () => programsRepository.getAll(),
  })
}

export function useProgram(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.programs.detail(id!),
    queryFn: () => programsRepository.getById(id!),
    enabled: !!id,
  })
}

export function useProgramDays(programId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.programs.days(programId!),
    queryFn: () => programsRepository.getDays(programId!),
    enabled: !!programId,
  })
}

export function useActiveProgram() {
  return useQuery({
    queryKey: queryKeys.programs.active,
    queryFn: () => programsRepository.getActive(),
  })
}

export function useTodaySchedule() {
  return useQuery({
    queryKey: queryKeys.programs.todaySchedule,
    queryFn: () => programsRepository.getTodaySchedule(),
  })
}

export function useCreateProgram() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: SaveProgramData) => programsRepository.save(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.programs.all })
    },
  })
}

export function useUpdateProgram() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: SaveProgramData & { id: string }) => programsRepository.save(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.programs.all })
    },
  })
}

export function useDeleteProgram() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => programsRepository.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.programs.all })
      qc.invalidateQueries({ queryKey: queryKeys.programs.active })
      qc.invalidateQueries({ queryKey: queryKeys.programs.todaySchedule })
    },
  })
}

export function useActivateProgram() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (programId: string) => programsRepository.activate(programId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.programs.active })
      qc.invalidateQueries({ queryKey: queryKeys.programs.todaySchedule })
    },
  })
}

export function useDeactivateProgram() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => programsRepository.deactivate(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.programs.active })
      qc.invalidateQueries({ queryKey: queryKeys.programs.todaySchedule })
    },
  })
}

export function useProgramHistory(programId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.programs.history(programId!),
    queryFn: () => programsRepository.getHistory(programId!),
    enabled: !!programId,
  })
}

export function useProgramCompletionStats(activeProgramId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.programs.completionStats(activeProgramId!),
    queryFn: () => programsRepository.getCompletionStats(activeProgramId!),
    enabled: !!activeProgramId,
  })
}
