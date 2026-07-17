import { describe, it, expect } from 'vitest'
import { evaluateProgressionGate } from '../progression-gate'
import type { Progression, SkillPrerequisite } from '@/models/types'
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

function makePR(movementId: string, bestReps?: number, bestSeconds?: number): MovementPR {
  return { movementId, movementName: 'Test Movement', bestReps, bestSeconds }
}

const emptyPRs = new Map<string, MovementPR>()

// ── No prerequisites → always unlocked ─────────────────────────────────────────

describe('evaluateProgressionGate — no prerequisites', () => {
  it('unlocks a progression with an undefined prerequisite list', () => {
    const gate = evaluateProgressionGate(undefined, [], emptyPRs)
    expect(gate.unlocked).toBe(true)
    expect(gate.prerequisitesMet).toBe(true)
    expect(gate.manuallyUnlocked).toBe(false)
    expect(gate.prerequisites).toHaveLength(0)
  })

  it('unlocks a progression with an empty prerequisite list', () => {
    const gate = evaluateProgressionGate([], [], emptyPRs)
    expect(gate.unlocked).toBe(true)
    expect(gate.prerequisitesMet).toBe(true)
  })
})

// ── movement-pr gate ───────────────────────────────────────────────────────────

describe('evaluateProgressionGate — movement-pr prerequisite', () => {
  const prereqs: SkillPrerequisite[] = [{ kind: 'movement-pr', movementId: 'pullups', minReps: 8 }]

  it('locks when the PR is below the threshold and reports progress', () => {
    const prs = new Map([['pullups', makePR('pullups', 3)]])
    const gate = evaluateProgressionGate(prereqs, [], prs)
    expect(gate.unlocked).toBe(false)
    expect(gate.prerequisitesMet).toBe(false)
    expect(gate.prerequisites[0].met).toBe(false)
    expect(gate.prerequisites[0].progress).toBeCloseTo(3 / 8)
  })

  it('locks when the athlete has no PR for the movement at all', () => {
    const gate = evaluateProgressionGate(prereqs, [], emptyPRs)
    expect(gate.unlocked).toBe(false)
    expect(gate.prerequisites[0].progress).toBe(0)
  })

  it('unlocks when the PR meets the threshold', () => {
    const prs = new Map([['pullups', makePR('pullups', 8)]])
    const gate = evaluateProgressionGate(prereqs, [], prs)
    expect(gate.unlocked).toBe(true)
    expect(gate.prerequisitesMet).toBe(true)
    expect(gate.prerequisites[0].progress).toBe(1)
  })

  it('honours a seconds-based threshold', () => {
    const prereq: SkillPrerequisite[] = [
      { kind: 'movement-pr', movementId: 'german-hang', minSeconds: 30 },
    ]
    const locked = evaluateProgressionGate(prereq, [], new Map([['german-hang', makePR('german-hang', undefined, 20)]]))
    expect(locked.unlocked).toBe(false)
    const unlocked = evaluateProgressionGate(prereq, [], new Map([['german-hang', makePR('german-hang', undefined, 45)]]))
    expect(unlocked.unlocked).toBe(true)
  })
})

// ── progression-level gate ─────────────────────────────────────────────────────

describe('evaluateProgressionGate — progression-level prerequisite', () => {
  const prereqs: SkillPrerequisite[] = [
    { kind: 'progression-level', progressionId: 'p-pullup', levelOrder: 4 },
  ]

  it('locks when the referenced progression is below the required level', () => {
    const gate = evaluateProgressionGate(prereqs, [makeProgression({ id: 'p-pullup', currentLevel: 2 })], emptyPRs)
    expect(gate.unlocked).toBe(false)
    expect(gate.prerequisites[0].progress).toBeCloseTo(2 / 4)
  })

  it('unlocks when the referenced progression reaches the required level', () => {
    const gate = evaluateProgressionGate(prereqs, [makeProgression({ id: 'p-pullup', currentLevel: 4 })], emptyPRs)
    expect(gate.unlocked).toBe(true)
  })

  it('treats a missing referenced progression as unmet', () => {
    const gate = evaluateProgressionGate(prereqs, [], emptyPRs)
    expect(gate.unlocked).toBe(false)
    expect(gate.prerequisites[0].progress).toBe(0)
  })
})

// ── multiple prerequisites (all must be met) ───────────────────────────────────

describe('evaluateProgressionGate — multiple prerequisites', () => {
  const prereqs: SkillPrerequisite[] = [
    { kind: 'movement-pr', movementId: 'pullups', minReps: 8 },
    { kind: 'progression-level', progressionId: 'p-row', levelOrder: 2 },
  ]

  it('stays locked while any single prerequisite is unmet', () => {
    const prs = new Map([['pullups', makePR('pullups', 10)]])
    const gate = evaluateProgressionGate(prereqs, [makeProgression({ id: 'p-row', currentLevel: 1 })], prs)
    expect(gate.unlocked).toBe(false)
    expect(gate.prerequisites.filter((p) => p.met)).toHaveLength(1)
  })

  it('unlocks only when every prerequisite is met', () => {
    const prs = new Map([['pullups', makePR('pullups', 10)]])
    const gate = evaluateProgressionGate(prereqs, [makeProgression({ id: 'p-row', currentLevel: 3 })], prs)
    expect(gate.unlocked).toBe(true)
    expect(gate.prerequisitesMet).toBe(true)
  })
})

// ── "unblock anyway" override ───────────────────────────────────────────────────

describe('evaluateProgressionGate — manual override', () => {
  const prereqs: SkillPrerequisite[] = [{ kind: 'movement-pr', movementId: 'pullups', minReps: 8 }]

  it('unlocks despite unmet prerequisites, but flags it as manual', () => {
    const prs = new Map([['pullups', makePR('pullups', 3)]])
    const gate = evaluateProgressionGate(prereqs, [], prs, true)
    expect(gate.unlocked).toBe(true)
    expect(gate.prerequisitesMet).toBe(false)
    expect(gate.manuallyUnlocked).toBe(true)
    // Progress is still reported so the UI can show what remains un-earned.
    expect(gate.prerequisites[0].met).toBe(false)
  })

  it('does not mark as manual when prerequisites are genuinely met', () => {
    const prs = new Map([['pullups', makePR('pullups', 8)]])
    const gate = evaluateProgressionGate(prereqs, [], prs, true)
    expect(gate.unlocked).toBe(true)
    expect(gate.prerequisitesMet).toBe(true)
    // manuallyUnlocked reflects the input flag; callers can prefer prerequisitesMet
    // to decide whether to show an "opened manually" badge.
    expect(gate.manuallyUnlocked).toBe(true)
  })
})
