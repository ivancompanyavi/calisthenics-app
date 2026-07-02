import { describe, it, expect } from 'vitest'
import {
  getTriggeredTemplateLabels,
  buildWarmupBlock,
  type WarmupMovementInput,
  type WarmupMovementRecord,
} from '../warmup-engine'

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeMovement(overrides: Partial<WarmupMovementInput> = {}): WarmupMovementInput {
  return {
    movementId: 'mv-1',
    movementName: 'Pull-Ups',
    family: 'pull',
    prepTags: [],
    ...overrides,
  }
}

/** Build a movement map covering every dedicated warm-up drill name. */
function makeFullMovementMap(): Map<string, WarmupMovementRecord> {
  const names = [
    'Wrist Circles',
    'Wrist Rocks',
    'Band Pull-Aparts',
    'Scapular Shrugs',
    'Arm Circles',
    'Band Dislocates',
    'Wall Slides',
    'Leg Swings',
    'Hip Circles',
    'Ankle Rocks',
    'Cat-Cow',
    'Bird Dog',
  ]
  return new Map(
    names.map((name, i) => [name, { id: `warmup-mv-${i}`, name, seedImagePath: undefined }]),
  )
}

// ── getTriggeredTemplateLabels ────────────────────────────────────────────────

describe('getTriggeredTemplateLabels', () => {
  it('returns empty array when no movements provided', () => {
    expect(getTriggeredTemplateLabels([])).toEqual([])
  })

  it('triggers wrist template only for a wrist-loaded movement', () => {
    const mv = makeMovement({ family: 'push', prepTags: ['wrist-loaded'] })
    expect(getTriggeredTemplateLabels([mv])).toContain('wrist')
  })

  it('triggers pull template for a pull-family movement', () => {
    const mv = makeMovement({ family: 'pull', prepTags: [] })
    expect(getTriggeredTemplateLabels([mv])).toContain('pull')
  })

  it('triggers push template for a push-family movement', () => {
    const mv = makeMovement({ family: 'push', prepTags: [] })
    expect(getTriggeredTemplateLabels([mv])).toContain('push')
  })

  it('triggers push template for heavy-push / overhead prep tags', () => {
    expect(
      getTriggeredTemplateLabels([makeMovement({ family: 'pull', prepTags: ['heavy-push'] })]),
    ).toContain('push')
    expect(
      getTriggeredTemplateLabels([makeMovement({ family: 'pull', prepTags: ['overhead'] })]),
    ).toContain('push')
  })

  it('triggers legs template for a legs-family movement', () => {
    const mv = makeMovement({ family: 'legs', prepTags: [] })
    expect(getTriggeredTemplateLabels([mv])).toContain('legs')
  })

  it('triggers core template for a core-family movement', () => {
    const mv = makeMovement({ family: 'core', prepTags: [] })
    expect(getTriggeredTemplateLabels([mv])).toContain('core')
  })

  it('every family produces at least one template (no workout goes without a warm-up)', () => {
    for (const family of ['pull', 'push', 'legs', 'core'] as const) {
      const labels = getTriggeredTemplateLabels([makeMovement({ family, prepTags: [] })])
      expect(labels.length).toBeGreaterThan(0)
    }
  })

  it('deduplicates: two pull movements trigger the pull template once', () => {
    const mv1 = makeMovement({ movementId: 'a', family: 'pull' })
    const mv2 = makeMovement({ movementId: 'b', family: 'pull' })
    expect(getTriggeredTemplateLabels([mv1, mv2]).filter((l) => l === 'pull')).toHaveLength(1)
  })

  it('returns templates in canonical order: wrist → pull → push → legs → core', () => {
    const movements: WarmupMovementInput[] = [
      makeMovement({ movementId: 'c', family: 'core' }),
      makeMovement({ movementId: 'l', family: 'legs' }),
      makeMovement({ movementId: 'p', family: 'pull', prepTags: ['wrist-loaded', 'heavy-push'] }),
    ]
    const labels = getTriggeredTemplateLabels(movements)
    const idx = (l: string) => labels.indexOf(l)
    expect(idx('wrist')).toBeLessThan(idx('pull'))
    expect(idx('pull')).toBeLessThan(idx('push'))
    expect(idx('push')).toBeLessThan(idx('legs'))
    expect(idx('legs')).toBeLessThan(idx('core'))
  })
})

// ── buildWarmupBlock ─────────────────────────────────────────────────────────

describe('buildWarmupBlock', () => {
  it('returns null for an empty movements array', () => {
    expect(buildWarmupBlock([], makeFullMovementMap())).toBeNull()
  })

  it('builds a pull warm-up from dedicated mobility drills (not training movements)', () => {
    const mv = makeMovement({ family: 'pull', prepTags: [] })
    const block = buildWarmupBlock([mv], makeFullMovementMap())!
    const names = block.entries.map((e) => e.movementName)
    expect(names).toContain('Band Pull-Aparts')
    expect(names).toContain('Scapular Shrugs')
    // Never prescribes an actual pull training movement.
    expect(names).not.toContain('Scapular Pulls')
    expect(names).not.toContain('Dead Hang')
    expect(block.rounds).toBe(1)
    expect(block.restSeconds).toBe(0)
  })

  it('builds a legs warm-up of mobility drills (no Deep Squat Hold "exercise")', () => {
    const block = buildWarmupBlock([makeMovement({ family: 'legs' })], makeFullMovementMap())!
    const names = block.entries.map((e) => e.movementName)
    expect(names).toEqual(['Leg Swings', 'Hip Circles', 'Ankle Rocks'])
  })

  it('builds a core warm-up of light activation (Cat-Cow / Bird Dog, not Hollow Body Hold)', () => {
    const block = buildWarmupBlock([makeMovement({ family: 'core' })], makeFullMovementMap())!
    const names = block.entries.map((e) => e.movementName)
    expect(names).toContain('Cat-Cow')
    expect(names).toContain('Bird Dog')
    expect(names).not.toContain('Hollow Body Hold')
  })

  it('includes wrist drills when wrist-loaded tag is present', () => {
    const mv = makeMovement({ family: 'push', prepTags: ['wrist-loaded'] })
    const names = buildWarmupBlock([mv], makeFullMovementMap())!.entries.map((e) => e.movementName)
    expect(names).toContain('Wrist Circles')
    expect(names).toContain('Wrist Rocks')
  })

  it('sets perSide=true on unilateral drills (Leg Swings)', () => {
    const block = buildWarmupBlock([makeMovement({ family: 'legs' })], makeFullMovementMap())!
    expect(block.entries.find((e) => e.movementName === 'Leg Swings')?.perSide).toBe(true)
  })

  it('safety-net dedup: still drops a warm-up drill if it somehow appears in the session', () => {
    const mv = makeMovement({ family: 'pull' })
    const map = makeFullMovementMap()
    const bandId = map.get('Band Pull-Aparts')!.id
    const deduped = buildWarmupBlock([mv], map, new Set([bandId]))
    expect(deduped?.entries.some((e) => e.movementId === bandId)).toBe(false)
    // The other pull drill remains.
    expect(deduped?.entries.some((e) => e.movementName === 'Scapular Shrugs')).toBe(true)
  })

  it('gracefully omits drills whose movement is not in the map', () => {
    const block = buildWarmupBlock([makeMovement({ family: 'pull' })], new Map())
    expect(block).toBeNull()
  })
})
