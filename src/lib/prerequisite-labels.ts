// Shared human-readable labelling for SkillPrerequisite edges. Used by both the
// skill atlas (useSkillAtlas) and the progression entry gate (useProgressionGates)
// so the two surfaces describe the same prerequisite identically.

import type { SkillPrerequisite, Progression, ProgressionLevel, Movement } from '@/models/types'

export interface PrereqLabel {
  /** Primary label, e.g. "Back Lever Progression" or "Pull-Ups". */
  label: string
  /** Secondary detail, e.g. "Reach Advanced Tuck Back Lever" or "8 reps". */
  detail: string | null
}

export interface PrereqLabelMaps {
  progressionNameById: Map<string, string>
  movementNameById: Map<string, string>
  /** `${progressionId}:${order}` → movement name at that rung. */
  rungMovementName: Map<string, string>
}

export function buildPrereqLabelMaps(
  progressions: Pick<Progression, 'id' | 'name'>[],
  levels: ProgressionLevel[],
  movements: Pick<Movement, 'id' | 'name'>[],
): PrereqLabelMaps {
  const progressionNameById = new Map(progressions.map((p) => [p.id, p.name]))
  const movementNameById = new Map(movements.map((m) => [m.id, m.name]))
  const rungMovementName = new Map<string, string>()
  for (const lvl of levels) {
    const mv = movementNameById.get(lvl.movementId)
    if (mv) rungMovementName.set(`${lvl.progressionId}:${lvl.order}`, mv)
  }
  return { progressionNameById, movementNameById, rungMovementName }
}

export function labelPrerequisite(
  prerequisite: SkillPrerequisite,
  maps: PrereqLabelMaps,
): PrereqLabel {
  if (prerequisite.kind === 'progression-level') {
    const progName = maps.progressionNameById.get(prerequisite.progressionId) ?? 'Progression'
    const rung = maps.rungMovementName.get(
      `${prerequisite.progressionId}:${prerequisite.levelOrder}`,
    )
    return {
      label: progName,
      detail: rung ? `Reach ${rung}` : `Reach level ${prerequisite.levelOrder + 1}`,
    }
  }
  const mvName = maps.movementNameById.get(prerequisite.movementId) ?? 'Movement'
  const detail =
    prerequisite.minReps != null
      ? `${prerequisite.minReps} reps`
      : prerequisite.minSeconds != null
        ? `Hold ${prerequisite.minSeconds}s`
        : 'Any PR'
  return { label: mvName, detail }
}
