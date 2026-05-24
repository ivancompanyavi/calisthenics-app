import { db } from '@/db'
import type { Settings } from '@/models/types'

const SINGLETON_ID = 'singleton' as const

const DEFAULT_SETTINGS: Settings = {
  id: SINGLETON_ID,
  weightUnit: 'lb',
}

export const settingsRepository = {
  get: async (): Promise<Settings> => {
    const row = await db.settings.get(SINGLETON_ID)
    if (row) return row
    // Lazy-seed the singleton row on first read so callers always get a
    // concrete Settings object instead of having to handle undefined.
    await db.settings.put(DEFAULT_SETTINGS)
    return DEFAULT_SETTINGS
  },

  update: async (patch: Partial<Omit<Settings, 'id'>>): Promise<Settings> => {
    const current = await settingsRepository.get()
    const next: Settings = { ...current, ...patch }
    await db.settings.put(next)
    return next
  },
}
