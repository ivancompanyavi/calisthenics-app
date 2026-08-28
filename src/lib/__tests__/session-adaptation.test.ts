import { describe, it, expect } from 'vitest'
import { adaptSessionEntries, type SessionAdaptationContext } from '../session-adaptation'
import { SEED_PROGRESSIONS } from '@/db/seed/progressions'
import { SEED_WORKOUTS } from '@/db/seed/workouts'
import { SEED_PATTERNS } from '@/db/seed/patterns'
import type { BlockEntry, Progression, ProgressionLevel } from '@/models/types'
import type { MovementPR } from '@/repositories/workout-logs.repository'

// These tests run against the REAL seed program, not toy fixtures. The bug they
// guard is a data-shape bug: with a beginner's (empty) PR history, most of the
// pull progressions are gated, and before session adaptation a "pull day"
// collapsed to two trainable exercises plus a wall of locked dead ends. Toy
// fixtures can't catch that — only the real prerequisite graph can.

const progId = (name: string) => `prog:${name}`
const mvId = (name: string) => `mv:${name}`

// Mirrors what seedDatabase() writes: name references resolved to ids.
function buildSeedGraph(currentLevels: Record<string, number> = {}) {
  const progressions: Progression[] = SEED_PROGRESSIONS.map((p) => ({
    id: progId(p.name),
    name: p.name,
    currentLevel: currentLevels[p.name] ?? 0,
    createdAt: 0,
    entryPrerequisites: p.entryPrerequisites?.map((pr) =>
      pr.kind === 'progression-level'
        ? { kind: 'progression-level' as const, progressionId: progId(pr.progression), levelOrder: pr.levelOrder }
        : { kind: 'movement-pr' as const, movementId: mvId(pr.movement), minReps: pr.minReps, minSeconds: pr.minSeconds },
    ),
  }))

  const levelsByProgression = new Map<string, ProgressionLevel[]>()
  for (const p of SEED_PROGRESSIONS) {
    levelsByProgression.set(
      progId(p.name),
      p.levels.map((lvl, order) => ({
        id: `lvl:${p.name}:${order}`,
        progressionId: progId(p.name),
        movementId: mvId(lvl.movement),
        order,
        mode: lvl.mode,
        defaultTargetReps: lvl.defaultTargetReps,
        defaultTargetSeconds: lvl.defaultTargetSeconds,
        perSide: lvl.perSide,
      })),
    )
  }
  return { progressions, levelsByProgression }
}

function makeContext(
  prs: Map<string, MovementPR> = new Map(),
  currentLevels: Record<string, number> = {},
  lastTrained: Map<string, number> = new Map(),
): SessionAdaptationContext {
  const { progressions, levelsByProgression } = buildSeedGraph(currentLevels)
  return {
    progressions,
    levelsByProgression,
    movementPRs: prs,
    patterns: SEED_PATTERNS,
    lastTrainedByProgression: lastTrained,
  }
}

// A PR that is also RECENT — entry gates and prescription dosing read the
// windowed fields, so tests must set them to model current form.
function recentPR(
  movement: string,
  { reps, secs }: { reps?: number; secs?: number },
  at = 1000,
): [string, MovementPR] {
  return [
    mvId(movement),
    {
      movementId: mvId(movement),
      movementName: movement,
      bestReps: reps,
      bestRepsAt: reps != null ? at : undefined,
      recentBestReps: reps,
      recentBestRepsAt: reps != null ? at : undefined,
      bestSeconds: secs,
      bestSecondsAt: secs != null ? at : undefined,
      recentBestSeconds: secs,
      recentBestSecondsAt: secs != null ? at : undefined,
    },
  ]
}

const trainedProgressions = (...pairs: [string, number][]) =>
  new Map(pairs.map(([name, at]) => [progId(name), at] as const))

// Turn a seed workout into the BlockEntry rows resolveBlocks would receive.
function entriesFor(workoutName: string) {
  const workout = SEED_WORKOUTS.find((w) => w.name === workoutName)
  if (!workout) throw new Error(`No seed workout named ${workoutName}`)
  const blockIds: string[] = []
  const entries: BlockEntry[] = []
  workout.blocks.forEach((block, b) => {
    const blockId = `block:${b}`
    blockIds.push(blockId)
    block.entries.forEach((e, i) => {
      const shared = {
        id: `entry:${b}:${i}`,
        blockId,
        order: i,
        targetReps: e.targetReps,
        targetSeconds: e.targetSeconds,
        perSide: e.perSide,
        restSeconds: e.restSeconds,
      }
      if (e.pattern) entries.push({ ...shared, kind: 'pattern', pattern: e.pattern })
      else if (e.progression) entries.push({ ...shared, kind: 'progression', progressionId: progId(e.progression) })
      else if (e.movement) entries.push({ ...shared, kind: 'movement', movementId: mvId(e.movement), mode: e.mode ?? 'reps' })
    })
  })
  return { blockIds, entries }
}

// The movement a resolved entry actually prescribes.
function movementOf(entry: BlockEntry, ctx: SessionAdaptationContext): string | undefined {
  if (entry.kind === 'movement') return entry.movementId
  if (entry.kind !== 'progression') return undefined
  const progression = ctx.progressions.find((p) => p.id === entry.progressionId)
  if (!progression) return undefined
  const levels = ctx.levelsByProgression.get(progression.id) ?? []
  return (levels[progression.currentLevel] ?? levels[0])?.movementId
}

// Human-readable session summary: what the athlete is actually handed.
function describeSession(workoutName: string, ctx: SessionAdaptationContext) {
  const { blockIds, entries } = entriesFor(workoutName)
  const result = adaptSessionEntries(blockIds, entries, ctx)
  const nameOf = new Map(ctx.progressions.map((p) => [p.id, p.name]))
  return result.entries.map((e) => {
    const sub = result.substitutedFor.get(e.id)
    const label =
      e.kind === 'progression'
        ? (nameOf.get(e.progressionId) ?? e.progressionId)
        : e.kind === 'movement'
          ? e.movementId.replace(/^mv:/, '')
          : `unresolved:${e.kind}`
    return { label, reason: sub?.reason, instead: sub?.progressionName, kind: e.kind }
  })
}

// A never-logged-anything beginner: every movement-PR gate reads 0.
const NO_HISTORY = new Map<string, MovementPR>()

describe('session adaptation — real seed program, no logged history', () => {
  const lockedProgressionIds = (ctx: SessionAdaptationContext) =>
    new Set(
      ctx.progressions
        .filter((p) => (p.entryPrerequisites ?? []).length > 0)
        .map((p) => p.id),
    )

  const adaptiveWorkouts = SEED_WORKOUTS.filter((w) => w.name.startsWith('Adaptive — ')).map(
    (w) => w.name,
  )
  const allWorkouts = SEED_WORKOUTS.map((w) => w.name)

  it('covers the adaptive program (guards against a renamed day silently untested)', () => {
    expect(adaptiveWorkouts.length).toBeGreaterThan(0)
  })

  // The headline guarantee: an athlete with zero logged history still gets a
  // full session on every adaptive day. This is the regression that started it
  // all — "Adaptive — Pull" showed two exercises because gated slots vanished.
  for (const name of adaptiveWorkouts) {
    it(`${name} yields a full session from zero history`, () => {
      const session = describeSession(name, makeContext(NO_HISTORY))
      expect(session.length, JSON.stringify(session, null, 2)).toBeGreaterThanOrEqual(4)
    })
  }

  for (const name of allWorkouts) {
    describe(name, () => {
      it('leaves no unresolved pattern slot', () => {
        const ctx = makeContext(NO_HISTORY)
        const { blockIds, entries } = entriesFor(name)
        const { entries: adapted } = adaptSessionEntries(blockIds, entries, ctx)
        expect(adapted.every((e) => e.kind !== 'pattern')).toBe(true)
      })

      it('hands out no locked progression (no dead-end slots)', () => {
        const ctx = makeContext(NO_HISTORY)
        const locked = lockedProgressionIds(ctx)
        const session = describeSession(name, ctx)
        // Substituted-in progressions are unlocked by construction; assert none
        // of the surviving progression entries has an unmet gate.
        const { blockIds, entries } = entriesFor(name)
        const { entries: adapted } = adaptSessionEntries(blockIds, entries, ctx)
        const stillLocked = adapted.filter(
          (e) => e.kind === 'progression' && locked.has(e.progressionId),
        )
        expect(stillLocked, `session was: ${JSON.stringify(session)}`).toEqual([])
      })

      // Authored workouts DO legitimately repeat a movement (a dead hang in a
      // warm-up block and again later). The invariant is only about what
      // adaptation adds: a substitute must be work the athlete isn't already
      // doing today, otherwise the swap adds nothing.
      it('never substitutes in a movement already prescribed elsewhere', () => {
        const ctx = makeContext(NO_HISTORY)
        const { blockIds, entries } = entriesFor(name)
        const { entries: adapted, substitutedFor } = adaptSessionEntries(blockIds, entries, ctx)
        const counts = new Map<string, number>()
        for (const e of adapted) {
          const m = movementOf(e, ctx)
          if (m) counts.set(m, (counts.get(m) ?? 0) + 1)
        }
        for (const e of adapted) {
          if (!substitutedFor.has(e.id)) continue
          const m = movementOf(e, ctx)
          expect(counts.get(m!), `substituted ${m} duplicates another slot`).toBe(1)
        }
      })
    })
  }
})

describe('session adaptation — the reported failure', () => {
  it('Adaptive — Pull no longer collapses to two exercises', () => {
    const ctx = makeContext(NO_HISTORY)
    const session = describeSession('Adaptive — Pull', ctx)
    const { blocks } = SEED_WORKOUTS.find((w) => w.name === 'Adaptive — Pull')!
    // Every authored slot survives — the lever slot becomes unlock work instead
    // of vanishing, which is what left the day with only 2 exercises.
    expect(session).toHaveLength(blocks.length)
  })

  it('the locked lever slot becomes its unlock work, labelled', () => {
    const ctx = makeContext(NO_HISTORY)
    const session = describeSession('Adaptive — Pull', ctx)
    const substituted = session.filter((s) => s.reason === 'unlock')
    expect(substituted.length).toBeGreaterThan(0)
    // Back Lever is gated on a 45s Dead Hang — the athlete should be handed the
    // hang, not a checklist.
    expect(session.map((s) => s.label)).toContain('Dead Hang')
    expect(substituted.some((s) => s.instead === 'Back Lever Progression')).toBe(true)
  })

  it('a day of mostly-gated slots still yields trainable work', () => {
    // "Adaptive — Pull & Core" is the worst case for a beginner: two of its five
    // slots (muscle-up, flag) are optional patterns whose whole chain is locked,
    // so before adaptation they were dropped outright.
    const ctx = makeContext(NO_HISTORY)
    const session = describeSession('Adaptive — Pull & Core', ctx)
    expect(session.length, JSON.stringify(session)).toBeGreaterThanOrEqual(4)
    // At least one of those gated slots came back as real work.
    expect(session.some((s) => s.reason === 'unlock')).toBe(true)
  })

  it('a 45s dead hang unlocks the lever line as an OFFER, not an auto-start', () => {
    // Unlocking is not adopting: the German Hang is a loaded shoulder position
    // nobody should be handed silently. The slot keeps maintaining the gate
    // evidence and the step-up arrives as a suggestion instead.
    const withHang = new Map<string, MovementPR>([recentPR('Dead Hang', { secs: 45 })])
    const ctx = makeContext(withHang)
    const { blockIds, entries } = entriesFor('Adaptive — Pull')
    const result = adaptSessionEntries(blockIds, entries, ctx)
    const session = describeSession('Adaptive — Pull', ctx)
    expect(session.some((s) => s.label === 'Back Lever Progression')).toBe(false)
    expect(session.filter((s) => s.reason === 'prep')).toHaveLength(1)
    expect(result.upgradeSuggestions.map((s) => s.progressionName)).toContain(
      'Back Lever Progression',
    )
  })

  it('the lever slot prescribes the lever chain once the athlete engages it', () => {
    const withHang = new Map<string, MovementPR>([recentPR('Dead Hang', { secs: 45 })])
    const engaged = makeContext(
      withHang,
      {},
      trainedProgressions(['Back Lever Progression', 500]),
    )
    const session = describeSession('Adaptive — Pull', engaged)
    expect(session.some((s) => s.label === 'Back Lever Progression')).toBe(true)
  })
})

describe('session adaptation — substitution policy', () => {
  it('picks the requirement furthest from met when several block a slot', () => {
    // Muscle-Up needs 8 pull-ups AND 5 ring dips. With 6 pull-ups logged (75%)
    // and no ring dips (0%), ring dips is the real limiter.
    const prs = new Map<string, MovementPR>([recentPR('Pull-Ups', { reps: 6 })])
    const ctx = makeContext(prs)
    const { blockIds, entries } = entriesFor('Adaptive — Pull & Core')
    const { entries: adapted, substitutedFor } = adaptSessionEntries(blockIds, entries, ctx)
    const muscleUpSlot = adapted.find(
      (e) => substitutedFor.get(e.id)?.progressionName === 'Muscle-Up Progression',
    )
    expect(muscleUpSlot).toBeDefined()
    expect(muscleUpSlot!.kind).toBe('movement')
    expect(muscleUpSlot!.movementId).toBe(mvId('Ring Dips'))
  })

  // The gate threshold is the GOAL, not today's dose. Prescribing 45s to someone
  // who holds 20s prescribes failure every session.
  it('prescribes a max-effort set when there is no PR to dose from', () => {
    const ctx = makeContext(NO_HISTORY)
    const { blockIds, entries } = entriesFor('Adaptive — Pull')
    const { entries: adapted } = adaptSessionEntries(blockIds, entries, ctx)
    const hang = adapted.find((e) => e.kind === 'movement' && e.movementId === mvId('Dead Hang'))
    expect(hang).toBeDefined()
    // Unknown level → find out, and create the PR everything downstream needs.
    expect(hang!.kind === 'movement' && hang!.mode).toBe('max')
    expect(hang!.targetSeconds).toBeUndefined()
    // The authored target belonged to the swapped-out exercise; it must not leak.
    expect(hang!.targetReps).toBeUndefined()
  })

  it('steps up from the current best, and never past the requirement', () => {
    const withHang = (secs: number) => new Map<string, MovementPR>([recentPR('Dead Hang', { secs })])
    const hangTarget = (secs: number) => {
      const ctx = makeContext(withHang(secs))
      const { blockIds, entries } = entriesFor('Adaptive — Pull')
      const { entries: adapted } = adaptSessionEntries(blockIds, entries, ctx)
      return adapted.find((e) => e.kind === 'movement' && e.movementId === mvId('Dead Hang'))
    }
    // 20s best → a reachable 25s, not the 45s gate.
    expect(hangTarget(20)?.targetSeconds).toBe(25)
    // Near the gate, the step is clamped to the requirement itself.
    expect(hangTarget(43)?.targetSeconds).toBe(45)
  })

  it('is a no-op for a workout of plain movement entries', () => {
    const ctx = makeContext(NO_HISTORY)
    const entries: BlockEntry[] = [
      { id: 'e1', blockId: 'b1', order: 0, kind: 'movement', movementId: mvId('Push-Ups'), mode: 'reps' },
    ]
    const result = adaptSessionEntries(['b1'], entries, ctx)
    expect(result.entries).toBe(entries)
    expect(result.substitutedFor.size).toBe(0)
  })

  it('a qualifying pull-up PR never auto-programs weighted pull-ups', () => {
    // The failure that drove an athlete off the app: a logged session whose
    // targets went in unedited (4×8 pull-ups, one 45s hang) tripped the
    // weighted-pull-up and back-lever gates, and the next "Adaptive — Pull"
    // prescribed +25%-BW weighted pull-ups and a German Hang to someone
    // working sets of 4. Unlocks must be offers; the slot stays on the line
    // the athlete has actually been training.
    const prs = new Map<string, MovementPR>([
      recentPR('Pull-Ups', { reps: 8 }),
      recentPR('Dead Hang', { secs: 45 }),
      recentPR('Ring Row', { reps: 10 }),
      recentPR('Tucked L-Sit', { secs: 30 }),
    ])
    const lastTrained = trainedProgressions(
      ['Pull-Up Progression', 900],
      ['Rowing Progression', 900],
      ['L-Sit Progression', 900],
    )
    const ctx = makeContext(prs, {}, lastTrained)
    const { blockIds, entries } = entriesFor('Adaptive — Pull')
    const result = adaptSessionEntries(blockIds, entries, ctx)
    const session = describeSession('Adaptive — Pull', ctx)
    const labels = session.map((s) => s.label)

    // The athlete keeps the exercises they have been training…
    expect(labels).toContain('Pull-Up Progression')
    expect(labels).toContain('Rowing Progression')
    expect(labels).toContain('L-Sit Progression')
    // …and is not silently moved onto the newly-unlocked lines.
    expect(labels).not.toContain('Weighted Pull-Up Progression')
    expect(labels).not.toContain('Back Lever Progression')
    // The lever slot holds as gate maintenance instead of vanishing.
    expect(session.some((s) => s.reason === 'prep')).toBe(true)
    // Both unlocks arrive as opt-in suggestions.
    const suggested = result.upgradeSuggestions.map((s) => s.progressionName)
    expect(suggested).toContain('Weighted Pull-Up Progression')
    expect(suggested).toContain('Back Lever Progression')
  })

  it('drops a slot with nothing distinct left to offer rather than repeating', () => {
    // Two slots on the same locked progression: the second has no unlock work
    // left (claimed) and no unlocked alternative outside the chain.
    const ctx = makeContext(NO_HISTORY)
    const flag = ctx.progressions.find((p) => p.name === 'Human Flag Progression')!
    const entries: BlockEntry[] = [
      { id: 'e1', blockId: 'b1', order: 0, kind: 'progression', progressionId: flag.id },
      { id: 'e2', blockId: 'b2', order: 0, kind: 'progression', progressionId: flag.id },
    ]
    const { entries: adapted } = adaptSessionEntries(['b1', 'b2'], entries, ctx)
    expect(adapted).toHaveLength(1)
  })
})
