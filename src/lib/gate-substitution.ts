// Pure locked-slot substitution: when a workout slot points at a progression the
// athlete hasn't unlocked, decide what to train INSTEAD of showing a dead end.
//
// ── Why this exists ─────────────────────────────────────────────────────────
// The entry gate (src/lib/progression-gate.ts) answers "may I train this?" but
// not "then what do I do today?". Without an answer to the second question a
// gated program hands a novice a session of locked slots — the workout becomes
// unfollowable, which is the exact failure this module fixes.
//
// ── The rule ────────────────────────────────────────────────────────────────
// For a locked progression, in order:
//
//   1. UNLOCK WORK — train the requirement that is blocking it, hardest-blocked
//      first (lowest progress). "Back Lever is locked on a 45s Dead Hang" →
//      prescribe Dead Hang for 45s. Doing the work is what opens the gate, so
//      the substitution is self-clearing: log the hang, the slot upgrades
//      itself next session.
//
//      A blocker that is ITSELF locked recurses (Front Lever needs Back Lever
//      needs a 45s Dead Hang → Dead Hang), bounded by MAX_DEPTH and a visited
//      set so a mis-authored prerequisite cycle can't hang the resolver.
//
//   2. BEST UNLOCKED ALTERNATIVE — if every blocker is already prescribed
//      elsewhere in the same session (`claimed`), fall back to the hardest
//      UNLOCKED progression in the same movement pattern. Keeps the slot as
//      real training volume in the intended pattern instead of repeating an
//      exercise the athlete is already doing today.
//
//   3. DROP — nothing distinct to offer; the caller omits the slot.
//
// Pure: no I/O, no mutation. `claimed` is read-only here; the caller threads it
// through the session in slot order so earlier slots win a contested movement.

import { evaluateProgressionGate } from '@/lib/progression-gate'
import type { Progression, ProgressionLevel, SetMode, SkillPrerequisite } from '@/models/types'
import type { MovementPR } from '@/repositories/workout-logs.repository'

// Guards against a prerequisite chain that is long or (mis-authored) cyclic.
// Real chains are 2–3 deep (front lever → back lever → dead hang).
const MAX_DEPTH = 6

/** What the slot becomes. Mirrors the two concrete BlockEntry kinds. */
export type Substitution =
  | {
      kind: 'movement'
      movementId: string
      mode: SetMode
      targetReps?: number
      targetSeconds?: number
    }
  | { kind: 'progression'; progressionId: string }

/** Why a slot was swapped — drives the "→ unlocks X" / "instead of X" label. */
export type SubstitutionReason = 'unlock' | 'alternative'

export interface SubstitutionResult {
  substitution: Substitution
  /** Movement actually trained. The caller adds this to `claimed`. */
  movementId: string
  reason: SubstitutionReason
  /** The locked progression this stands in for, for display. */
  forProgressionId: string
  forProgressionName: string
}

export interface SubstitutionContext {
  /** Every progression — prerequisites can reference ones not in this workout. */
  progressions: Progression[]
  /** Levels per progression, ordered by `order`. */
  levelsByProgression: Map<string, ProgressionLevel[]>
  movementPRs: Map<string, MovementPR>
  /** Pattern chains (hardest → easiest, by progression NAME) for step 2. */
  patterns: { candidates: string[] }[]
}

/** The movement a progression prescribes right now (its `currentLevel` rung). */
export function currentRungMovementId(
  progression: Progression,
  levelsByProgression: Map<string, ProgressionLevel[]>,
): string | undefined {
  const levels = levelsByProgression.get(progression.id) ?? []
  return (levels[progression.currentLevel] ?? levels[0])?.movementId
}

function isUnlocked(progression: Progression, ctx: SubstitutionContext): boolean {
  return evaluateProgressionGate(
    progression.entryPrerequisites,
    ctx.progressions,
    ctx.movementPRs,
    !!progression.manuallyUnlockedAt,
  ).unlocked
}

// A movement-PR prerequisite maps straight onto a movement-bound slot: the
// threshold IS the target. A thresholdless prereq ("any PR") becomes a max-effort
// set, since logging anything satisfies it.
function movementPrerequisiteSlot(
  prerequisite: Extract<SkillPrerequisite, { kind: 'movement-pr' }>,
): Substitution {
  if (prerequisite.minSeconds != null) {
    return {
      kind: 'movement',
      movementId: prerequisite.movementId,
      mode: 'time',
      targetSeconds: prerequisite.minSeconds,
    }
  }
  if (prerequisite.minReps != null) {
    return {
      kind: 'movement',
      movementId: prerequisite.movementId,
      mode: 'reps',
      targetReps: prerequisite.minReps,
    }
  }
  return { kind: 'movement', movementId: prerequisite.movementId, mode: 'max' }
}

/**
 * Ordered unlock-work candidates for a locked progression: the exercises that,
 * if trained, open its gate. Furthest-from-met first, so the athlete works the
 * requirement that is actually holding them back.
 */
function unlockCandidates(
  progressionId: string,
  ctx: SubstitutionContext,
  visited: Set<string>,
  depth: number,
): Substitution[] {
  if (depth > MAX_DEPTH || visited.has(progressionId)) return []
  visited.add(progressionId)

  const progression = ctx.progressions.find((p) => p.id === progressionId)
  if (!progression) return []

  const gate = evaluateProgressionGate(
    progression.entryPrerequisites,
    ctx.progressions,
    ctx.movementPRs,
    !!progression.manuallyUnlockedAt,
  )

  const unmet = gate.prerequisites
    .filter((pr) => !pr.met)
    // Ascending progress: the requirement you're furthest from comes first.
    .sort((a, b) => a.progress - b.progress)

  const out: Substitution[] = []
  for (const { prerequisite } of unmet) {
    if (prerequisite.kind === 'movement-pr') {
      out.push(movementPrerequisiteSlot(prerequisite))
      continue
    }
    const target = ctx.progressions.find((p) => p.id === prerequisite.progressionId)
    if (!target) continue
    if (isUnlocked(target, ctx)) {
      // Trainable now — climbing it at its current rung is the work that
      // satisfies the level requirement.
      out.push({ kind: 'progression', progressionId: target.id })
    } else {
      // Blocked by something blocked: drill down to real work.
      out.push(...unlockCandidates(target.id, ctx, visited, depth + 1))
    }
  }
  return out
}

/** Resolved movement for a candidate, or undefined when it can't be trained. */
function candidateMovementId(
  candidate: Substitution,
  ctx: SubstitutionContext,
): string | undefined {
  if (candidate.kind === 'movement') return candidate.movementId
  const progression = ctx.progressions.find((p) => p.id === candidate.progressionId)
  return progression ? currentRungMovementId(progression, ctx.levelsByProgression) : undefined
}

// Step 2: the hardest unlocked progression in a pattern that also lists the
// locked one — same movement pattern, difficulty the athlete has earned.
function patternAlternative(
  lockedName: string,
  ctx: SubstitutionContext,
  claimed: ReadonlySet<string>,
): { progressionId: string; movementId: string } | null {
  const byName = new Map(ctx.progressions.map((p) => [p.name, p]))
  for (const pattern of ctx.patterns) {
    if (!pattern.candidates.includes(lockedName)) continue
    for (const name of pattern.candidates) {
      if (name === lockedName) continue
      const candidate = byName.get(name)
      if (!candidate || !isUnlocked(candidate, ctx)) continue
      const movementId = currentRungMovementId(candidate, ctx.levelsByProgression)
      if (!movementId || claimed.has(movementId)) continue
      return { progressionId: candidate.id, movementId }
    }
  }
  return null
}

/**
 * Decide what a locked progression slot becomes. Returns null when the slot has
 * nothing distinct to offer and should be dropped from the session.
 *
 * `claimed` holds movement ids already prescribed today, so the same exercise is
 * never handed out twice.
 */
export function substituteLockedProgression(
  progressionId: string,
  ctx: SubstitutionContext,
  claimed: ReadonlySet<string>,
): SubstitutionResult | null {
  const locked = ctx.progressions.find((p) => p.id === progressionId)
  if (!locked) return null

  const base = { forProgressionId: locked.id, forProgressionName: locked.name }

  // 1. Unlock work, first one not already on today's card.
  for (const candidate of unlockCandidates(locked.id, ctx, new Set(), 0)) {
    const movementId = candidateMovementId(candidate, ctx)
    if (!movementId || claimed.has(movementId)) continue
    return { substitution: candidate, movementId, reason: 'unlock', ...base }
  }

  // 2. Best unlocked alternative in the same pattern.
  const alternative = patternAlternative(locked.name, ctx, claimed)
  if (alternative) {
    return {
      substitution: { kind: 'progression', progressionId: alternative.progressionId },
      movementId: alternative.movementId,
      reason: 'alternative',
      ...base,
    }
  }

  // 3. Nothing distinct to offer.
  return null
}
