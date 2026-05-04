import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { db } from '@/db'
import type { Movement } from '@/models/types'
import { generateId } from '@/lib/utils'

export function useMovements() {
  return useQuery({
    queryKey: ['movements'],
    queryFn: () => db.movements.orderBy('name').toArray(),
  })
}

export function useMovement(id: string | undefined) {
  return useQuery({
    queryKey: ['movements', id],
    queryFn: () => (id ? db.movements.get(id) : undefined),
    enabled: !!id,
  })
}

export function useCreateMovement() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: Omit<Movement, 'id' | 'createdAt'>) => {
      const movement: Movement = {
        ...data,
        id: generateId(),
        createdAt: Date.now(),
      }
      await db.movements.add(movement)

      const progression = {
        id: generateId(),
        name: movement.name,
        currentLevel: 0,
        createdAt: Date.now(),
      }
      await db.progressions.add(progression)
      await db.progressionLevels.add({
        id: generateId(),
        progressionId: progression.id,
        movementId: movement.id,
        order: 0,
      })

      return movement
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['movements'] })
      qc.invalidateQueries({ queryKey: ['progressions'] })
    },
  })
}

export function useUpdateMovement() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Movement> & { id: string }) => {
      await db.movements.update(id, data)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['movements'] })
    },
  })
}

export function useDeleteMovement() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await db.transaction('rw', [db.movements, db.progressionLevels], async () => {
        await db.movements.delete(id)
        await db.progressionLevels.where('movementId').equals(id).delete()
      })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['movements'] })
      qc.invalidateQueries({ queryKey: ['progressions'] })
    },
  })
}
