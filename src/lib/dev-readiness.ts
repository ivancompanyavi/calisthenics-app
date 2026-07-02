// DEV-ONLY testing helper. Dynamically imported from main.tsx behind an
// `import.meta.env.DEV` guard, so it is tree-shaken out of production builds
// and never ships to the live app.
//
// Usage in the browser console:
//   __seedReadiness('Pull-Up Progression')        // 3 qualifying sessions (default)
//   __seedReadiness('Planche Progression', 4)     // custom session count
// Then refresh the page — the "ready to advance" card should appear on Home,
// the Library progression card, and the next post-workout summary.

import { db } from '@/db'
import { generateId } from '@/lib/utils'
import type { SetLog } from '@/models/types'

const DAY_MS = 24 * 60 * 60 * 1000

async function seedReadiness(progressionName: string, sessions = 3): Promise<string> {
  const progressions = await db.progressions.toArray()
  const prog = progressions.find((p) => p.name === progressionName)
  if (!prog) {
    const names = progressions.map((p) => `"${p.name}"`).join(', ')
    return `No progression named "${progressionName}". Available: ${names}`
  }

  const levels = (await db.progressionLevels.toArray())
    .filter((l) => l.progressionId === prog.id)
    .sort((a, b) => a.order - b.order)
  const level = levels[prog.currentLevel]
  if (!level) return `Progression "${progressionName}" has no level at currentLevel ${prog.currentLevel}`

  const movement = await db.movements.get(level.movementId)
  const movementName = movement?.name ?? 'Unknown'

  // Targets that will "hit target" for the qualifying check.
  const targetReps = level.defaultTargetReps ?? 5
  const targetSeconds = level.defaultTargetSeconds ?? 20
  const now = Date.now()

  for (let i = 0; i < sessions; i++) {
    const completedAt = now - (sessions - 1 - i) * DAY_MS
    const logId = generateId()
    await db.workoutLogs.add({
      id: logId,
      workoutId: 'dev-seed',
      workoutName: `[dev] readiness seed ${i + 1}/${sessions}`,
      startedAt: completedAt - 20 * 60 * 1000,
      completedAt,
    })

    // Three qualifying sets for the current-rung movement.
    for (let s = 0; s < 3; s++) {
      const isLast = s === 2
      const base: SetLog = {
        id: generateId(),
        workoutLogId: logId,
        movementId: level.movementId,
        movementName,
        progressionId: prog.id,
        round: 0,
        order: s,
        skipped: false,
      }
      if (level.mode === 'reps') {
        base.targetReps = targetReps
        base.actualReps = targetReps
        if (isLast) base.rir = 2 // reserve → qualifies
      } else if (level.mode === 'time') {
        base.targetSeconds = targetSeconds
        base.actualSeconds = targetSeconds
        if (isLast) base.sir = 1
      } else {
        // max-mode hold: no target; relative-to-best rule needs a consistent
        // best hold with reserve.
        base.actualSeconds = targetSeconds
        if (isLast) base.sir = 1
      }
      await db.setLogs.add(base)
    }
  }

  return `Seeded ${sessions} qualifying sessions for "${progressionName}" (rung: ${movementName}, mode: ${level.mode}). Refresh the page to see the readiness card.`
}

export function installReadinessDevTools(): void {
  const w = window as unknown as {
    __seedReadiness?: (name: string, sessions?: number) => void
  }
  w.__seedReadiness = (name: string, sessions = 3) => {
    seedReadiness(name, sessions)
      .then((msg) => console.log(`[__seedReadiness] ${msg}`))
      .catch((err) => console.error('[__seedReadiness] failed:', err))
  }
  console.log(
    '[dev] __seedReadiness(progressionName, sessions=3) available — seeds qualifying sessions, then refresh.',
  )
}
