import { describe, it, expect } from 'vitest'
import { evaluateSkills } from '../skill-atlas'
import type { Skill, Progression } from '@/models/types'
import type { MovementPR } from '@/repositories/workout-logs.repository'

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeProgression(overrides: Partial<Progression> & { id: string }): Progression {
  return {
    name: 'Test Progression',
    currentLevel: 0,
    createdAt: 0,
    ...overrides,
  }
}

function makePR(
  movementId: string,
  bestReps?: number,
  bestSeconds?: number,
): MovementPR {
  return {
    movementId,
    movementName: 'Test Movement',
    bestReps,
    bestSeconds,
  }
}

function makeSkill(overrides: Partial<Skill> & { id: string }): Skill {
  return {
    name: 'Test Skill',
    prerequisites: [],
    createdAt: 0,
    ...overrides,
  }
}

const emptyPRs = new Map<string, MovementPR>()

// ── achieved ─────────────────────────────────────────────────────────────────

describe('evaluateSkills — achieved', () => {
  it('marks a skill with no prerequisites as achieved', () => {
    const skill = makeSkill({ id: 's1' })
    const [result] = evaluateSkills([skill], [], emptyPRs)
    expect(result.status).toBe('achieved')
    expect(result.prerequisites).toHaveLength(0)
  })

  it('marks as achieved when progression-level prerequisite is met exactly', () => {
    const skill = makeSkill({
      id: 's1',
      prerequisites: [{ kind: 'progression-level', progressionId: 'p1', levelOrder: 5 }],
    })
    const progression = makeProgression({ id: 'p1', currentLevel: 5 })
    const [result] = evaluateSkills([skill], [progression], emptyPRs)
    expect(result.status).toBe('achieved')
    expect(result.prerequisites[0].met).toBe(true)
    expect(result.prerequisites[0].progress).toBe(1)
  })

  it('marks as achieved when progression-level is exceeded', () => {
    const skill = makeSkill({
      id: 's1',
      prerequisites: [{ kind: 'progression-level', progressionId: 'p1', levelOrder: 3 }],
    })
    const progression = makeProgression({ id: 'p1', currentLevel: 7 })
    const [result] = evaluateSkills([skill], [progression], emptyPRs)
    expect(result.status).toBe('achieved')
    expect(result.prerequisites[0].progress).toBe(1)
  })

  it('marks as achieved when movement-pr reps prerequisite is met', () => {
    const skill = makeSkill({
      id: 's1',
      prerequisites: [{ kind: 'movement-pr', movementId: 'm1', minReps: 10 }],
    })
    const prs = new Map([['m1', makePR('m1', 10)]])
    const [result] = evaluateSkills([skill], [], prs)
    expect(result.status).toBe('achieved')
    expect(result.prerequisites[0].met).toBe(true)
    expect(result.prerequisites[0].progress).toBe(1)
  })

  it('marks as achieved when movement-pr seconds prerequisite is met', () => {
    const skill = makeSkill({
      id: 's1',
      prerequisites: [{ kind: 'movement-pr', movementId: 'm1', minSeconds: 30 }],
    })
    const prs = new Map([['m1', makePR('m1', undefined, 45)]])
    const [result] = evaluateSkills([skill], [], prs)
    expect(result.status).toBe('achieved')
    expect(result.prerequisites[0].progress).toBe(1)
  })

  it('marks as achieved when all prerequisites (mixed kinds) are met', () => {
    const skill = makeSkill({
      id: 's1',
      prerequisites: [
        { kind: 'progression-level', progressionId: 'p1', levelOrder: 4 },
        { kind: 'movement-pr', movementId: 'm1', minReps: 8 },
      ],
    })
    const progression = makeProgression({ id: 'p1', currentLevel: 5 })
    const prs = new Map([['m1', makePR('m1', 10)]])
    const [result] = evaluateSkills([skill], [progression], prs)
    expect(result.status).toBe('achieved')
    expect(result.prerequisites.every((r) => r.met)).toBe(true)
  })
})

// ── blocked ───────────────────────────────────────────────────────────────────

describe('evaluateSkills — blocked', () => {
  it('marks as blocked when progression-level prerequisite has < 50% progress', () => {
    const skill = makeSkill({
      id: 's1',
      prerequisites: [{ kind: 'progression-level', progressionId: 'p1', levelOrder: 10 }],
    })
    const progression = makeProgression({ id: 'p1', currentLevel: 4 })
    const [result] = evaluateSkills([skill], [progression], emptyPRs)
    expect(result.status).toBe('blocked')
    expect(result.prerequisites[0].progress).toBeCloseTo(0.4)
    expect(result.prerequisites[0].met).toBe(false)
  })

  it('marks as blocked when movement-pr is missing entirely', () => {
    const skill = makeSkill({
      id: 's1',
      prerequisites: [{ kind: 'movement-pr', movementId: 'm1', minReps: 10 }],
    })
    const [result] = evaluateSkills([skill], [], emptyPRs)
    expect(result.status).toBe('blocked')
    expect(result.prerequisites[0].progress).toBe(0)
    expect(result.prerequisites[0].met).toBe(false)
  })

  it('marks as blocked when movement-pr exists but reps < 50% of threshold', () => {
    const skill = makeSkill({
      id: 's1',
      prerequisites: [{ kind: 'movement-pr', movementId: 'm1', minReps: 10 }],
    })
    const prs = new Map([['m1', makePR('m1', 3)]])
    const [result] = evaluateSkills([skill], [], prs)
    expect(result.status).toBe('blocked')
    expect(result.prerequisites[0].progress).toBeCloseTo(0.3)
  })

  it('marks as blocked when one prereq is < 50% even if others are met', () => {
    const skill = makeSkill({
      id: 's1',
      prerequisites: [
        { kind: 'progression-level', progressionId: 'p1', levelOrder: 5 },
        { kind: 'movement-pr', movementId: 'm1', minReps: 10 },
      ],
    })
    // First prereq is fully met, second has 0% progress.
    const progression = makeProgression({ id: 'p1', currentLevel: 5 })
    const [result] = evaluateSkills([skill], [progression], emptyPRs)
    expect(result.status).toBe('blocked')
    expect(result.prerequisites[0].met).toBe(true)
    expect(result.prerequisites[1].progress).toBe(0)
  })

  it('marks as blocked when progression not found in input (missing PR)', () => {
    const skill = makeSkill({
      id: 's1',
      prerequisites: [{ kind: 'progression-level', progressionId: 'unknown', levelOrder: 3 }],
    })
    const [result] = evaluateSkills([skill], [], emptyPRs)
    expect(result.status).toBe('blocked')
    expect(result.prerequisites[0].progress).toBe(0)
  })
})

// ── in-reach ─────────────────────────────────────────────────────────────────

describe('evaluateSkills — in-reach', () => {
  it('marks as in-reach when all prerequisites are ≥ 50% but none fully met', () => {
    const skill = makeSkill({
      id: 's1',
      prerequisites: [
        { kind: 'progression-level', progressionId: 'p1', levelOrder: 10 },
        { kind: 'movement-pr', movementId: 'm1', minReps: 10 },
      ],
    })
    const progression = makeProgression({ id: 'p1', currentLevel: 5 }) // 50%
    const prs = new Map([['m1', makePR('m1', 7)]]) // 70%
    const [result] = evaluateSkills([skill], [progression], prs)
    expect(result.status).toBe('in-reach')
    expect(result.prerequisites[0].progress).toBe(0.5)
    expect(result.prerequisites[1].progress).toBeCloseTo(0.7)
  })

  it('marks as in-reach when progression is exactly at 50% threshold', () => {
    const skill = makeSkill({
      id: 's1',
      prerequisites: [{ kind: 'progression-level', progressionId: 'p1', levelOrder: 10 }],
    })
    const progression = makeProgression({ id: 'p1', currentLevel: 5 })
    const [result] = evaluateSkills([skill], [progression], emptyPRs)
    expect(result.status).toBe('in-reach')
    expect(result.prerequisites[0].progress).toBe(0.5)
  })

  it('marks as in-reach when one prereq is met (100%) and the other is ≥ 50%', () => {
    const skill = makeSkill({
      id: 's1',
      prerequisites: [
        { kind: 'progression-level', progressionId: 'p1', levelOrder: 4 },
        { kind: 'movement-pr', movementId: 'm1', minReps: 8 },
      ],
    })
    // First prereq fully met.
    const progression = makeProgression({ id: 'p1', currentLevel: 4 })
    // Second prereq: 5/8 ≈ 62.5%, not fully met.
    const prs = new Map([['m1', makePR('m1', 5)]])
    const [result] = evaluateSkills([skill], [progression], prs)
    expect(result.status).toBe('in-reach')
    expect(result.prerequisites[0].progress).toBe(1)
    expect(result.prerequisites[1].progress).toBeCloseTo(0.625)
  })
})

// ── edge cases ────────────────────────────────────────────────────────────────

describe('evaluateSkills — edge cases', () => {
  it('levelOrder 0 is always met and shows 100% progress', () => {
    const skill = makeSkill({
      id: 's1',
      prerequisites: [{ kind: 'progression-level', progressionId: 'p1', levelOrder: 0 }],
    })
    const progression = makeProgression({ id: 'p1', currentLevel: 0 })
    const [result] = evaluateSkills([skill], [progression], emptyPRs)
    expect(result.status).toBe('achieved')
    expect(result.prerequisites[0].progress).toBe(1)
    expect(result.prerequisites[0].met).toBe(true)
  })

  it('missing PR does not crash — progress is 0', () => {
    const skill = makeSkill({
      id: 's1',
      prerequisites: [{ kind: 'movement-pr', movementId: 'no-such-movement', minReps: 5 }],
    })
    expect(() => evaluateSkills([skill], [], emptyPRs)).not.toThrow()
    const [result] = evaluateSkills([skill], [], emptyPRs)
    expect(result.prerequisites[0].progress).toBe(0)
    expect(result.prerequisites[0].met).toBe(false)
  })

  it('movement-pr with no threshold is met by having any PR', () => {
    const skill = makeSkill({
      id: 's1',
      prerequisites: [{ kind: 'movement-pr', movementId: 'm1' }],
    })
    // No PR → blocked.
    const [r1] = evaluateSkills([skill], [], emptyPRs)
    expect(r1.status).toBe('blocked')

    // Has PR → achieved.
    const prs = new Map([['m1', makePR('m1', 1)]])
    const [r2] = evaluateSkills([skill], [], prs)
    expect(r2.status).toBe('achieved')
  })

  it('handles multiple skills independently', () => {
    const skills = [
      makeSkill({
        id: 's1',
        prerequisites: [{ kind: 'progression-level', progressionId: 'p1', levelOrder: 10 }],
      }),
      makeSkill({
        id: 's2',
        prerequisites: [{ kind: 'progression-level', progressionId: 'p1', levelOrder: 3 }],
      }),
    ]
    const progression = makeProgression({ id: 'p1', currentLevel: 3 })
    const results = evaluateSkills(skills, [progression], emptyPRs)
    expect(results).toHaveLength(2)
    expect(results[0].status).toBe('blocked') // 3/10 = 30%
    expect(results[1].status).toBe('achieved') // 3/3 = 100%
  })
})
