// Pure adaptive-pattern resolver: given a pattern's candidate chain (hardest →
// easiest) and the current data snapshots, decide which progression the slot
// trains today.
//
// ── Engagement, not just unlock state ────────────────────────────────────────
// "Unlocked" means the athlete MAY start a line — it must never mean they are
// silently moved onto it. A single qualifying set (real or a target logged
// unedited) used to jump the slot to the hardest unlocked line; this is the
// exact failure that put a +25%-BW weighted pull-up in front of an athlete
// working sets of 4. So the slot resolves to the unlocked candidate the
// athlete is ENGAGED with — most recently trained, explicitly adopted
// (adoptedAt), or manually unlocked — and a harder unlocked line is returned
// as an opt-in `suggestion` instead of being auto-selected.
//
// When no candidate is engaged (fresh athlete, or a chain never started):
//   - a non-`optional` pattern falls back to its EASIEST unlocked candidate —
//     the ungated foundational base (invariant enforced by the seed patterns
//     test), so the slot always resolves;
//   - an `optional` pattern resolves to null and instead returns the easiest
//     unlocked line as `held` — trainable, but not started. The caller turns a
//     held slot into gate-maintenance work rather than auto-starting the line
//     (a lever chain must not begin with a German Hang nobody asked for).
//
// Returns progressionId AND held null when nothing in the chain is unlocked.
//
// Suggestion snooze: a dismissed upgrade (upgradeDismissedAt) stays hidden
// until gate evidence NEWER than the dismissal appears — a fresh qualifying
// PR re-earns the card; the same stale evidence never re-nags.

import { evaluateProgressionGate } from '@/lib/progression-gate'
import type { Progression } from '@/models/types'
import type { MovementPR } from '@/repositories/workout-logs.repository'

export interface PatternSuggestion {
  progressionId: string
  progressionName: string
}

export interface PatternResolution {
  progressionId: string | null
  progressionName: string | null
  // True when the resolved line was picked through engagement (trained /
  // adopted / manually unlocked) rather than the unengaged easiest fallback.
  engaged: boolean
  // Unlocked line the athlete can opt into but hasn't — an opt-in step-up,
  // never applied automatically. Null when there is nothing to offer or the
  // offer is snoozed.
  suggestion: PatternSuggestion | null
  // Optional pattern only: the unlocked-but-never-engaged line the slot is
  // holding back. Set exactly when progressionId is null but the chain has an
  // unlocked candidate; the caller prescribes its gate-maintenance work.
  held: PatternSuggestion | null
}

const EMPTY: PatternResolution = {
  progressionId: null,
  progressionName: null,
  engaged: false,
  suggestion: null,
  held: null,
}

// The newest timestamp among the movement-PR evidence that currently satisfies
// a progression's gate. Used to decide whether a dismissed upgrade suggestion
// has been re-earned by fresh evidence. Progression-level prerequisites carry
// no timestamp and contribute nothing.
function gateEvidenceAt(progression: Progression, movementPRs: Map<string, MovementPR>): number {
  let newest = 0
  for (const prereq of progression.entryPrerequisites ?? []) {
    if (prereq.kind !== 'movement-pr') continue
    const pr = movementPRs.get(prereq.movementId)
    if (!pr) continue
    if (prereq.minSeconds != null) {
      newest = Math.max(newest, pr.recentBestSecondsAt ?? 0)
    } else {
      newest = Math.max(newest, pr.recentBestRepsAt ?? 0)
    }
  }
  return newest
}

function isSnoozed(progression: Progression, movementPRs: Map<string, MovementPR>): boolean {
  const dismissedAt = progression.upgradeDismissedAt ?? 0
  if (dismissedAt === 0) return false
  return gateEvidenceAt(progression, movementPRs) <= dismissedAt
}

function asSuggestion(p: Progression): PatternSuggestion {
  return { progressionId: p.id, progressionName: p.name }
}

export function resolvePattern(
  candidates: string[],
  progressions: Progression[],
  movementPRs: Map<string, MovementPR>,
  lastTrainedByProgression: Map<string, number>,
  opts: { optional?: boolean } = {},
): PatternResolution {
  const byName = new Map(progressions.map((p) => [p.name, p]))

  // Unlocked candidates in chain order (hardest first).
  const unlocked: Progression[] = []
  for (const name of candidates) {
    const prog = byName.get(name)
    if (!prog) continue
    const gate = evaluateProgressionGate(
      prog.entryPrerequisites,
      progressions,
      movementPRs,
      !!prog.manuallyUnlockedAt,
    )
    if (gate.unlocked) unlocked.push(prog)
  }

  if (unlocked.length === 0) return EMPTY

  const engagedAt = (p: Progression): number =>
    Math.max(
      lastTrainedByProgression.get(p.id) ?? 0,
      p.adoptedAt ?? 0,
      p.manuallyUnlockedAt ?? 0,
    )

  // Most recently engaged unlocked line wins; chain order (hardest first)
  // breaks ties.
  let resolved: Progression | null = null
  for (const p of unlocked) {
    if (engagedAt(p) === 0) continue
    if (!resolved || engagedAt(p) > engagedAt(resolved)) resolved = p
  }

  if (!resolved && opts.optional) {
    // Never started: hold the easiest unlocked line instead of auto-starting.
    const held = unlocked[unlocked.length - 1]
    return {
      ...EMPTY,
      held: asSuggestion(held),
      suggestion: isSnoozed(held, movementPRs) ? null : asSuggestion(held),
    }
  }

  const engaged = resolved != null
  // Unengaged non-optional: start at the bottom of what's unlocked, never the top.
  if (!resolved) resolved = unlocked[unlocked.length - 1]

  // The step-up offer: hardest unlocked line strictly above the resolved one
  // that the athlete never engaged with.
  let suggestion: PatternSuggestion | null = null
  const resolvedIdx = unlocked.indexOf(resolved)
  for (let i = 0; i < resolvedIdx; i++) {
    const candidate = unlocked[i]
    if (engagedAt(candidate) > 0) continue
    if (isSnoozed(candidate, movementPRs)) continue
    suggestion = asSuggestion(candidate)
    break
  }

  return {
    progressionId: resolved.id,
    progressionName: resolved.name,
    engaged,
    suggestion,
    held: null,
  }
}
