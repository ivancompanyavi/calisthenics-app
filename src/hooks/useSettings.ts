import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { settingsRepository } from '@/repositories'
import { queryKeys } from '@/lib/query-keys'
import type { Settings, WeightUnit } from '@/models/types'

export function useSettings() {
  return useQuery({
    queryKey: queryKeys.settings,
    queryFn: () => settingsRepository.get(),
  })
}

// Convenience: read the current weight unit with a sensible default while the
// query is still loading. Most call sites only need the unit, not the full
// Settings object. Default matches DEFAULT_SETTINGS in the settings repo.
export function useWeightUnit(): WeightUnit {
  const { data } = useSettings()
  return data?.weightUnit ?? 'lb'
}

export function useUpdateSettings() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (patch: Partial<Omit<Settings, 'id'>>) =>
      settingsRepository.update(patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.settings })
    },
  })
}
