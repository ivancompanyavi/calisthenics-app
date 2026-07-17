import { describe, it, expect } from 'vitest'
import { SEED_PROGRESSIONS } from '../progressions'
import { SEED_MOVEMENTS } from '../movements'

// The seed resolver (resolveSeedPrerequisites) SILENTLY DROPS any entry-gate
// prerequisite whose progression/movement name doesn't match a seed entry. A
// typo would therefore produce a weaker gate with no error. These tests guard
// every referenced name and the level indices against that footgun.

const progressionNames = new Set(SEED_PROGRESSIONS.map((p) => p.name))
const movementNames = new Set(SEED_MOVEMENTS.map((m) => m.name))

describe('progression entry gates — referential integrity', () => {
  for (const p of SEED_PROGRESSIONS) {
    if (!p.entryPrerequisites?.length) continue
    describe(p.name, () => {
      for (const prereq of p.entryPrerequisites!) {
        if (prereq.kind === 'progression-level') {
          it(`references an existing progression "${prereq.progression}"`, () => {
            expect(progressionNames.has(prereq.progression)).toBe(true)
          })
          it(`"${prereq.progression}" has a rung at levelOrder ${prereq.levelOrder}`, () => {
            const target = SEED_PROGRESSIONS.find((x) => x.name === prereq.progression)
            expect(target).toBeDefined()
            expect(prereq.levelOrder).toBeGreaterThanOrEqual(0)
            expect(prereq.levelOrder).toBeLessThan(target!.levels.length)
          })
          it('does not gate a progression on itself', () => {
            expect(prereq.progression).not.toBe(p.name)
          })
        } else {
          it(`references an existing movement "${prereq.movement}"`, () => {
            expect(movementNames.has(prereq.movement)).toBe(true)
          })
          it('specifies at least one threshold', () => {
            expect(prereq.minReps !== undefined || prereq.minSeconds !== undefined).toBe(true)
          })
        }
      }
    })
  }
})

describe('progression entry gates — coverage sanity', () => {
  it('gates the expected number of ladders (12) and leaves the rest foundational', () => {
    const gated = SEED_PROGRESSIONS.filter((p) => p.entryPrerequisites?.length)
    expect(gated).toHaveLength(12)
  })
})
