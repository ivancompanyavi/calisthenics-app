import { useEffect, useRef, useState } from 'react'
import { PartyPopper } from 'lucide-react'
import { useSkillAtlas } from '@/hooks/useSkillAtlas'
import { useSettings, useUpdateSettings } from '@/hooks/useSettings'

// Post-workout reward: when a skill-atlas node flips to achieved that hasn't
// been celebrated before, show a one-time "unlocked!" card. Reacts to the
// atlas recomputing after the workout save (so it's race-free wrt the PR
// refetch), and persists the celebrated set so it never repeats.
//
// First encounter (celebratedSkillIds undefined) seeds the set silently with
// whatever's already achieved — otherwise a user adopting the feature would be
// flooded with celebrations for skills they earned long ago.
export function UnlockCelebration() {
  const { data: atlas } = useSkillAtlas()
  const { data: settings } = useSettings()
  const updateSettings = useUpdateSettings()

  const celebrated = settings?.celebratedSkillIds
  const achievedIds = atlas
    ? atlas.results.filter((r) => r.status === 'achieved').map((r) => r.skillId)
    : null

  // Freeze the celebrated baseline once, the moment settings first load. What
  // we display is derived against this frozen baseline, so persisting newly
  // shown ids (in the effect) never collapses the celebration mid-view.
  // setState-during-render is the codebase's "store info from previous renders"
  // pattern (see WorkoutExecution) — guarded so it fires exactly once.
  const [baseline, setBaseline] = useState<string[] | null>(null)
  if (baseline === null && celebrated !== undefined) {
    setBaseline(celebrated)
  }

  const seededRef = useRef(false)
  useEffect(() => {
    if (!achievedIds) return
    if (celebrated === undefined) {
      // First run — seed silently, celebrate nothing this time.
      if (!seededRef.current) {
        seededRef.current = true
        updateSettings.mutate({ celebratedSkillIds: achievedIds })
      }
      return
    }
    // Fold any freshly-achieved ids into the persisted set (idempotent).
    const seen = new Set(celebrated)
    const fresh = achievedIds.filter((id) => !seen.has(id))
    if (fresh.length > 0) {
      updateSettings.mutate({ celebratedSkillIds: [...celebrated, ...fresh] })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [achievedIds?.join(','), celebrated?.join(',')])

  if (!atlas || !achievedIds || baseline === null) return null
  const baseSet = new Set(baseline)
  const displayed = achievedIds.filter((id) => !baseSet.has(id))
  if (displayed.length === 0) return null

  const names = displayed
    .map((id) => atlas.skills.find((s) => s.id === id)?.name)
    .filter((n): n is string => !!n)
  if (names.length === 0) return null

  return (
    <div className="w-full max-w-sm rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-center space-y-1.5">
      <p className="flex items-center justify-center gap-1.5 text-sm font-semibold text-emerald-400">
        <PartyPopper className="h-4 w-4" /> Skill{names.length > 1 ? 's' : ''} unlocked!
      </p>
      {names.map((n) => (
        <p key={n} className="text-lg font-bold">
          {n}
        </p>
      ))}
    </div>
  )
}
