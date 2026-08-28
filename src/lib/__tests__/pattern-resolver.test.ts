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

// A PR that is also RECENT — entry gates only read the windowed fields.
function makePR(movementId: string, bestReps: number, at = 1000): MovementPR {
  return {
    movementId,
    movementName: movementId,
    bestReps,
    bestRepsAt: at,
    recentBestReps: bestReps,
    recentBestRepsAt: at,
  }
}

// An all-time PR whose evidence has gone STALE (outside the gate window).
function makeStalePR(movementId: string, bestReps: number): MovementPR {
  return { movementId, movementName: movementId, bestReps, bestRepsAt: 1000 }
}

const gate = (movement: string, minReps: number): SkillPrerequisite[] => [
  { kind: 'movement-pr', movementId: movement, minReps },
]

const emptyPRs = new Map<string, MovementPR>()
const noTraining = new Map<string, number>()
const trained = (...pairs: [string, number][]) =>
  new Map(pairs.map(([name, at]) => [`id-${name}`, at] as const))

// Chain hardest → easiest: OAC (gated 8 pull-ups) → Weighted (gated 8) → base.
const CHAIN = ['OAC', 'Weighted', 'Base']
const buildProgs = () => [
  makeProgression('OAC', { entryPrerequisites: gate('pullups', 8) }),
  makeProgression('Weighted', { entryPrerequisites: gate('pullups', 8) }),
  makeProgression('Base'), // ungated
]
const qualifyingPRs = new Map([['pullups', makePR('pullups', 8)]])

describe('resolvePattern — unlock state', () => {
  it('falls back to the ungated base when nothing harder is unlocked', () => {
    const res = resolvePattern(CHAIN, buildProgs(), emptyPRs, noTraining)
    expect(res.progressionName).toBe('Base')
    expect(res.engaged).toBe(false)
  })

  it('stale all-time evidence does not unlock a line (gates read current form)', () => {
    const stale = new Map([['pullups', makeStalePR('pullups', 8)]])
    const res = resolvePattern(CHAIN, buildProgs(), stale, noTraining)
    expect(res.progressionName).toBe('Base')
    expect(res.suggestion).toBeNull()
  })

  it('returns null when every candidate is gated and locked', () => {
    const progs = [
      makeProgression('FrontLever', { entryPrerequisites: gate('pullups', 8) }),
      makeProgression('BackLever', { entryPrerequisites: gate('deadhang', 1) }),
    ]
    const res = resolvePattern(['FrontLever', 'BackLever'], progs, emptyPRs, noTraining)
    expect(res.progressionId).toBeNull()
    expect(res.held).toBeNull()
  })

  it('skips candidate names that do not resolve to a progression', () => {
    const res = resolvePattern(['Ghost', 'Base'], buildProgs(), emptyPRs, noTraining)
    expect(res.progressionName).toBe('Base')
  })
})

describe('resolvePattern — engagement beats unlock state', () => {
  it('qualifying PRs alone do NOT jump the slot to the hardest unlocked line', () => {
    // The reported failure: one qualifying set used to reprogram the slot to
    // weighted work the athlete never asked for.
    const res = resolvePattern(CHAIN, buildProgs(), qualifyingPRs, noTraining)
    expect(res.progressionName).toBe('Base')
    expect(res.engaged).toBe(false)
    // The unlock is offered, not applied. Hardest unlocked line is suggested.
    expect(res.suggestion?.progressionName).toBe('OAC')
  })

  it('stays on the most recently trained unlocked line', () => {
    const res = resolvePattern(CHAIN, buildProgs(), qualifyingPRs, trained(['Base', 50]))
    expect(res.progressionName).toBe('Base')
    expect(res.engaged).toBe(true)
  })

  it('a trained harder line resolves once the athlete has actually trained it', () => {
    const res = resolvePattern(
      CHAIN,
      buildProgs(),
      qualifyingPRs,
      trained(['Weighted', 100], ['Base', 50]),
    )
    expect(res.progressionName).toBe('Weighted')
    // OAC is still unengaged — it stays an offer.
    expect(res.suggestion?.progressionName).toBe('OAC')
  })

  it('dropping back down sticks: the most recent engagement wins over the harder line', () => {
    const res = resolvePattern(
      CHAIN,
      buildProgs(),
      qualifyingPRs,
      trained(['Weighted', 100], ['Base', 200]),
    )
    expect(res.progressionName).toBe('Base')
    // Weighted was engaged before — it is not re-suggested.
    expect(res.suggestion?.progressionName).toBe('OAC')
  })

  it('a trained line whose gate evidence went stale re-locks and falls away', () => {
    const stale = new Map([['pullups', makeStalePR('pullups', 8)]])
    const res = resolvePattern(
      CHAIN,
      buildProgs(),
      stale,
      trained(['Weighted', 100], ['Base', 50]),
    )
    expect(res.progressionName).toBe('Base')
  })

  it('adoptedAt counts as engagement (accepting the upgrade card)', () => {
    const progs = [
      makeProgression('OAC', { entryPrerequisites: gate('pullups', 8) }),
      makeProgression('Weighted', { entryPrerequisites: gate('pullups', 8), adoptedAt: 500 }),
      makeProgression('Base'),
    ]
    const res = resolvePattern(CHAIN, progs, qualifyingPRs, trained(['Base', 100]))
    expect(res.progressionName).toBe('Weighted')
  })

  it('manual unlock counts as engagement', () => {
    const progs = [
      makeProgression('Weighted', {
        entryPrerequisites: gate('pullups', 8),
        manuallyUnlockedAt: 123,
      }),
      makeProgression('Base'),
    ]
    const res = resolvePattern(['Weighted', 'Base'], progs, emptyPRs, noTraining)
    expect(res.progressionName).toBe('Weighted')
    expect(res.engaged).toBe(true)
  })
})

describe('resolvePattern — optional patterns', () => {
  const optional = { optional: true }
  const leverProgs = () => [
    makeProgression('FrontLever', { entryPrerequisites: gate('pullups', 20) }),
    makeProgression('BackLever', { entryPrerequisites: gate('pullups', 8) }),
  ]

  it('an unlocked but never-engaged chain is held, not auto-started', () => {
    const res = resolvePattern(
      ['FrontLever', 'BackLever'],
      leverProgs(),
      qualifyingPRs,
      noTraining,
      optional,
    )
    expect(res.progressionId).toBeNull()
    expect(res.held?.progressionName).toBe('BackLever')
    expect(res.suggestion?.progressionName).toBe('BackLever')
  })

  it('resolves normally once the athlete engages the line', () => {
    const res = resolvePattern(
      ['FrontLever', 'BackLever'],
      leverProgs(),
      qualifyingPRs,
      trained(['BackLever', 100]),
      optional,
    )
    expect(res.progressionName).toBe('BackLever')
    expect(res.held).toBeNull()
  })
})

describe('resolvePattern — suggestion snooze', () => {
  it('a dismissed upgrade stays hidden while the evidence is unchanged', () => {
    const progs = [
      makeProgression('Weighted', {
        entryPrerequisites: gate('pullups', 8),
        upgradeDismissedAt: 2000, // after the PR at t=1000
      }),
      makeProgression('Base'),
    ]
    const res = resolvePattern(['Weighted', 'Base'], progs, qualifyingPRs, trained(['Base', 100]))
    expect(res.progressionName).toBe('Base')
    expect(res.suggestion).toBeNull()
  })

  it('fresh gate evidence re-earns a dismissed suggestion', () => {
    const progs = [
      makeProgression('Weighted', {
        entryPrerequisites: gate('pullups', 8),
        upgradeDismissedAt: 2000,
      }),
      makeProgression('Base'),
    ]
    const freshPRs = new Map([['pullups', makePR('pullups', 9, 3000)]]) // newer than dismissal
    const res = resolvePattern(['Weighted', 'Base'], progs, freshPRs, trained(['Base', 100]))
    expect(res.suggestion?.progressionName).toBe('Weighted')
  })
})
