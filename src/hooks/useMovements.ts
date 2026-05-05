import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Movement } from '@/models/types'
import { queryKeys } from '@/lib/query-keys'
import { movementsRepository } from '@/repositories'

export function useMovements() {
  return useQuery({
    queryKey: queryKeys.movements.all,
    queryFn: () => movementsRepository.getAll(),
  })
}

export function useMovement(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.movements.detail(id!),
    queryFn: () => movementsRepository.getById(id!),
    enabled: !!id,
  })
}

export function useCreateMovement() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: Omit<Movement, 'id' | 'createdAt'>) => {
      return movementsRepository.create(data)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.movements.all })
    },
  })
}

export function useUpdateMovement() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Movement> & { id: string }) => {
      await movementsRepository.update(id, data)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.movements.all })
    },
  })
}

export function useDeleteMovement() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => movementsRepository.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.movements.all })
      qc.invalidateQueries({ queryKey: queryKeys.progressions.all })
    },
  })
}
