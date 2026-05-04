import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { db } from '@/db'
import type { Progression, ProgressionLevel } from '@/models/types'
import { generateId } from '@/lib/utils'

export function useProgressions() {
  return useQuery({
    queryKey: ['progressions'],
    queryFn: () => db.progressions.orderBy('name').toArray(),
  })
}

export function useProgression(id: string | undefined) {
  return useQuery({
    queryKey: ['progressions', id],
    queryFn: () => (id ? db.progressions.get(id) : undefined),
    enabled: !!id,
  })
}

export function useProgressionLevels(progressionId: string | undefined) {
  return useQuery({
    queryKey: ['progressionLevels', progressionId],
    queryFn: async () => {
      if (!progressionId) return []
      const levels = await db.progressionLevels
        .where('progressionId')
        .equals(progressionId)
        .sortBy('order')
      const movementIds = levels.map((l) => l.movementId)
      const movements = await db.movements.bulkGet(movementIds)
      return levels.map((level, i) => ({
        ...level,
        movement: movements[i],
      }))
    },
    enabled: !!progressionId,
  })
}

export function useCreateProgression() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: { name: string; movementIds: string[] }) => {
      const progression: Progression = {
        id: generateId(),
        name: data.name,
        currentLevel: 0,
        createdAt: Date.now(),
      }
      const levels: ProgressionLevel[] = data.movementIds.map((movementId, i) => ({
        id: generateId(),
        progressionId: progression.id,
        movementId,
        order: i,
      }))
      await db.transaction('rw', [db.progressions, db.progressionLevels], async () => {
        await db.progressions.add(progression)
        await db.progressionLevels.bulkAdd(levels)
      })
      return progression
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['progressions'] })
    },
  })
}

export function useUpdateProgression() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: { id: string; name: string; currentLevel?: number; movementIds: string[] }) => {
      await db.transaction('rw', [db.progressions, db.progressionLevels], async () => {
        await db.progressions.update(data.id, {
          name: data.name,
          ...(data.currentLevel !== undefined && { currentLevel: data.currentLevel }),
        })
        await db.progressionLevels.where('progressionId').equals(data.id).delete()
        const levels: ProgressionLevel[] = data.movementIds.map((movementId, i) => ({
          id: generateId(),
          progressionId: data.id,
          movementId,
          order: i,
        }))
        await db.progressionLevels.bulkAdd(levels)
      })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['progressions'] })
      qc.invalidateQueries({ queryKey: ['progressionLevels'] })
    },
  })
}

export function useDeleteProgression() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await db.transaction('rw', [db.progressions, db.progressionLevels], async () => {
        await db.progressions.delete(id)
        await db.progressionLevels.where('progressionId').equals(id).delete()
      })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['progressions'] })
    },
  })
}

export function useUpdateCurrentLevel() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, currentLevel }: { id: string; currentLevel: number }) => {
      await db.progressions.update(id, { currentLevel })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['progressions'] })
    },
  })
}
