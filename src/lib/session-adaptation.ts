// Pure session adaptation: rewrites a workout's slots into what the athlete can
// actually train TODAY. Composes the two adaptive primitives —
//
//   pattern-resolver   → "which difficulty of this movement pattern?"
//   gate-substitution  → "this is locked, so what instead?"
//
// — and adds the one rule neither can enforce alone: a movement is prescribed at
// most ONCE per session. That rule needs whole-session scope, which is why it
// lives here rather than in either primitive.
//
// Output contains only 'progression' and 'movement' entries: pattern slots are
// resolved and locked slots are substituted or dropped, so every downstream
// consumer (execution screen, session preview, workout detail) sees a session
// with no dead ends.
//
// Pure: takes data snapshots, returns new arrays. All I/O lives in
// workoutsRepository.resolveBlocks, which fetches the snapshots and calls this.

import { resolvePattern } from '@/lib/pattern-resolver'
import { evaluateProgressionGate } from '@/lib/progression-gate'
import {
  currentRungMovementId,
  substituteLockedProgression,
  type SubstitutionContext,
  type SubstitutionResult,
} from '@/lib/gate-substitution'
import type { SubstitutedFor } from '@/lib/execution-engine'
import type { BlockEntry } from '@/models/types'

export interface SessionAdaptationContext extends SubstitutionContext {
  /** Pattern chains, keyed so a slot's `pattern` field can be looked up. */
  patterns: { key: string; candidates: string[] }[]
}

export interface AdaptedSession {
  /** Slot-ordered entries, all 'progression' or 'movement'. */
  entries: BlockEntry[]
  /** Entry id → why its exercise was swapped. Display-only. */
  substitutedFor: Map<string, SubstitutedFor>
}

// The kind-independent half of a BlockEntry. When a slot is retargeted, its own
// prescription (rest, tempo, gate, load) survives; the exercise identity doesn't.
function stripEntryKind(entry: BlockEntry) {
  return {
    id: entry.id,
    blockId: entry.blockId,
    order: entry.order,
    targetReps: entry.targetReps,
    targetSeconds: entry.targetSeconds,
    perSide: entry.perSide,
    restSeconds: entry.restSeconds,
    tempo: entry.tempo,
    gate: entry.gate,
    targetWeightKg: entry.targetWeightKg,
    targetBandLevel: entry.targetBandLevel,
  }
}

export function adaptSessionEntries(
  blockIds: string[],
  entries: BlockEntry[],
  ctx: SessionAdaptationContext,
): AdaptedSession {
  const substitutedFor = new Map<string, SubstitutedFor>()

  // Fast-path: movement-bound entries are never gated, so there is nothing to
  // adapt and no reason to walk the session.
  if (!entries.some((e) => e.kind !== 'movement')) {
    return { entries, substitutedFor }
  }

  const progressionById = new Map(ctx.progressions.map((p) => [p.id, p]))

  // Slot order decides who wins a contested movement: walk blocks in order,
  // entries in order within each block, so earlier slots claim first.
  const blockOrder = new Map(blockIds.map((id, i) => [id, i]))
  const ordered = [...entries].sort(
    (a, b) =>
      (blockOrder.get(a.blockId) ?? 0) - (blockOrder.get(b.blockId) ?? 0) || a.order - b.order,
  )

  const claimed = new Set<string>()
  const claimRung = (progressionId: string) => {
    const progression = progressionById.get(progressionId)
    const movementId = progression && currentRungMovementId(progression, ctx.levelsByProgression)
    if (movementId) claimed.add(movementId)
  }
  const isUnlocked = (progressionId: string): boolean => {
    const progression = progressionById.get(progressionId)
    // Missing row (stale reference): leave it alone rather than substituting
    // blind — resolveEntry already degrades gracefully on an unknown id.
    if (!progression) return true
    return evaluateProgressionGate(
      progression.entryPrerequisites,
      ctx.progressions,
      ctx.movementPRs,
      !!progression.manuallyUnlockedAt,
    ).unlocked
  }

  const asProgressionEntry = (entry: BlockEntry, progressionId: string): BlockEntry => ({
    ...stripEntryKind(entry),
    kind: 'progression',
    progressionId,
  })

  const applySubstitution = (entry: BlockEntry, result: SubstitutionResult): BlockEntry => {
    substitutedFor.set(entry.id, {
      progressionId: result.forProgressionId,
      progressionName: result.forProgressionName,
      reason: result.reason,
    })
    claimed.add(result.movementId)
    if (result.substitution.kind === 'progression') {
      return asProgressionEntry(entry, result.substitution.progressionId)
    }
    return {
      ...stripEntryKind(entry),
      kind: 'movement',
      movementId: result.substitution.movementId,
      mode: result.substitution.mode,
      // The prerequisite threshold IS the target. The authored target belonged
      // to the exercise we just swapped out, so it must not carry over.
      targetReps: result.substitution.targetReps,
      targetSeconds: result.substitution.targetSeconds,
      perSide: undefined,
    }
  }

  // Two phases, because a substitution must not collide with a slot LATER in
  // the session. Phase 1 settles every slot that needs no substitution and
  // claims its movement; only then does phase 2 choose substitutes, against a
  // `claimed` set that already knows the whole session.
  type Settled =
    | { needsSubstitute: false; entry: BlockEntry }
    | { needsSubstitute: true; entry: BlockEntry; lockedProgressionId: string }

  const settled: Settled[] = []
  for (const entry of ordered) {
    if (entry.kind === 'movement') {
      claimed.add(entry.movementId)
      settled.push({ needsSubstitute: false, entry })
      continue
    }

    if (entry.kind === 'pattern') {
      const pattern = ctx.patterns.find((p) => p.key === entry.pattern)
      if (!pattern) continue // Unknown key (stale data) — drop the slot.
      const { progressionId } = resolvePattern(pattern.candidates, ctx.progressions, ctx.movementPRs)
      if (progressionId) {
        claimRung(progressionId)
        settled.push({ needsSubstitute: false, entry: asProgressionEntry(entry, progressionId) })
        continue
      }
      // Nothing in the chain is unlocked. Substitute against the EASIEST
      // candidate — the one closest to being earned — so the slot becomes
      // unlock work instead of vanishing from the session.
      const easiest = pattern.candidates[pattern.candidates.length - 1]
      const target = ctx.progressions.find((p) => p.name === easiest)
      if (target) settled.push({ needsSubstitute: true, entry, lockedProgressionId: target.id })
      continue
    }

    if (isUnlocked(entry.progressionId)) {
      claimRung(entry.progressionId)
      settled.push({ needsSubstitute: false, entry })
      continue
    }
    settled.push({ needsSubstitute: true, entry, lockedProgressionId: entry.progressionId })
  }

  const adapted: BlockEntry[] = []
  for (const slot of settled) {
    if (!slot.needsSubstitute) {
      adapted.push(slot.entry)
      continue
    }
    const result = substituteLockedProgression(slot.lockedProgressionId, ctx, claimed)
    if (result) adapted.push(applySubstitution(slot.entry, result))
  }

  return { entries: adapted, substitutedFor }
}
