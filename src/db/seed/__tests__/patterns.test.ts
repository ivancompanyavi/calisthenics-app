import { describe, it, expect } from 'vitest'
import { SEED_PATTERNS } from '../patterns'
import { SEED_PROGRESSIONS } from '../progressions'

// Guards the pattern-slot invariants the resolver relies on. Without these, a
// typo'd candidate or a gated fallback would silently produce an empty slot at
// runtime — the exact "missing exercises" failure the adaptive design must
// never allow.

const progressionByName = new Map(SEED_PROGRESSIONS.map((p) => [p.name, p]))

describe('seed patterns — referential integrity', () => {
  it('has unique keys', () => {
    const keys = SEED_PATTERNS.map((p) => p.key)
    expect(new Set(keys).size).toBe(keys.length)
  })

  for (const pattern of SEED_PATTERNS) {
    describe(pattern.key, () => {
      it('has at least one candidate', () => {
        expect(pattern.candidates.length).toBeGreaterThan(0)
      })

      it('references only existing progressions', () => {
        for (const name of pattern.candidates) {
          expect(progressionByName.has(name), `missing progression: ${name}`).toBe(true)
        }
      })

      if (!pattern.optional) {
        it('ends in an ungated foundational progression (never an empty slot)', () => {
          const base = progressionByName.get(pattern.candidates[pattern.candidates.length - 1])
          expect(base).toBeDefined()
          expect(base!.entryPrerequisites ?? []).toHaveLength(0)
        })
      }
    })
  }
})
