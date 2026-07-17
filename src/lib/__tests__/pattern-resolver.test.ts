import { describe, it, expect } from 'vitest'
import { resolvePattern } from '../pattern-resolver'
import type { Progression, SkillPrerequisite } from '@/models/types'
import type { MovementPR } from '@/repositories/workout-logs.repository'

function makeProgression(
  name: string,
  overrides: Partial<Progression> = {},
): Progression {
  return { id: `id-${name}`, name, currentLevel: 0, createdAt: 0, ...overrides }
}

function makePR(movementId: string, bestReps?: number): MovementPR {
  return { movementId, movementName: movementId, bestReps }
}

const gate = (movement: string, minReps: number): SkillPrerequisite[] => [
  { kind: 'movement-pr', movementId: movement, minReps },
]

const emptyPRs = new Map<string, MovementPR>()

// Chain hardest → easiest: OAC (gated 8 pull-ups) → Weighted (gated 8) → base.
const CHAIN = ['OAC', 'Weighted', 'Base']
const buildProgs = () => [
  makeProgression('OAC', { entryPrerequisites: gate('pullups', 8) }),
  makeProgression('Weighted', { entryPrerequisites: gate('pullups', 8) }),
  makeProgression('Base'), // ungated
]

describe('resolvePattern', () => {
  it('falls back to the ungated base when nothing harder is unlocked', () => {
    const res = resolvePattern(CHAIN, buildProgs(), emptyPRs)
    expect(res.progressionName).toBe('Base')
  })

  it('picks the hardest unlocked when the athlete qualifies', () => {
    // 8 pull-ups unlocks both OAC and Weighted → hardest (OAC) wins.
    const prs = new Map([['pullups', makePR('pullups', 8)]])
    const res = resolvePattern(CHAIN, buildProgs(), prs)
    expect(res.progressionName).toBe('OAC')
  })

  it('picks the middle rung when only it is unlocked', () => {
    const progs = [
      makeProgression('OAC', { entryPrerequisites: gate('pullups', 15) }),
      makeProgression('Weighted', { entryPrerequisites: gate('pullups', 8) }),
      makeProgression('Base'),
    ]
    const prs = new Map([['pullups', makePR('pullups', 10)]]) // ≥8, <15
    const res = resolvePattern(CHAIN, progs, prs)
    expect(res.progressionName).toBe('Weighted')
  })

  it('returns null when every candidate is gated and locked (optional slot)', () => {
    const progs = [
      makeProgression('IronCross', { entryPrerequisites: gate('pullups', 8) }),
      makeProgression('FrontLever', { entryPrerequisites: gate('pullups', 8) }),
      makeProgression('BackLever', { entryPrerequisites: gate('deadhang', 1) }),
    ]
    const res = resolvePattern(['IronCross', 'FrontLever', 'BackLever'], progs, emptyPRs)
    expect(res.progressionId).toBeNull()
  })

  it('honours the manual unblock override', () => {
    const progs = [
      makeProgression('Weighted', {
        entryPrerequisites: gate('pullups', 8),
        manuallyUnlockedAt: 123,
      }),
      makeProgression('Base'),
    ]
    const res = resolvePattern(['Weighted', 'Base'], progs, emptyPRs)
    expect(res.progressionName).toBe('Weighted')
  })

  it('skips candidate names that do not resolve to a progression', () => {
    const res = resolvePattern(['Ghost', 'Base'], buildProgs(), emptyPRs)
    expect(res.progressionName).toBe('Base')
  })
})
