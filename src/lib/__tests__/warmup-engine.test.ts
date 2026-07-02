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

/** Build a movement map that covers all warm-up template exercise names. */
function makeFullMovementMap(): Map<string, WarmupMovementRecord> {
  const names = [
    'Wrist Rocks',
    'Wrist Push-Up Lean',
    'Scapular Pulls',
    'Dead Hang',
    'Band Dislocates',
    'Scapular Push-Ups',
    'Deep Squat Hold',
    'Leg Swings',
    'Hollow Body Hold',
  ]
  return new Map(
    names.map((name, i) => [
      name,
      { id: `warmup-mv-${i}`, name, seedImagePath: undefined },
    ]),
  )
}

// ── getTriggeredTemplateLabels ────────────────────────────────────────────────

describe('getTriggeredTemplateLabels', () => {
  it('returns empty array when no movements provided', () => {
    expect(getTriggeredTemplateLabels([])).toEqual([])
  })

  it('returns empty array when no tags/families match', () => {
    // A push movement with no prepTags that matches no template trigger.
    const mv = makeMovement({ family: 'push', prepTags: [] })
    expect(getTriggeredTemplateLabels([mv])).toEqual([])
  })

  it('triggers wrist template for a wrist-loaded movement', () => {
    const mv = makeMovement({ family: 'push', prepTags: ['wrist-loaded'] })
    const labels = getTriggeredTemplateLabels([mv])
    expect(labels).toContain('wrist')
  })

  it('triggers scap-pull template for a pull-family movement (no explicit tag)', () => {
    const mv = makeMovement({ family: 'pull', prepTags: [] })
    const labels = getTriggeredTemplateLabels([mv])
    expect(labels).toContain('scap-pull')
  })

  it('triggers scap-pull template for scap-pull prepTag regardless of family', () => {
    const mv = makeMovement({ family: 'push', prepTags: ['scap-pull'] })
    const labels = getTriggeredTemplateLabels([mv])
    expect(labels).toContain('scap-pull')
  })

  it('triggers heavy-push-overhead for heavy-push prepTag', () => {
    const mv = makeMovement({ family: 'push', prepTags: ['heavy-push'] })
    const labels = getTriggeredTemplateLabels([mv])
    expect(labels).toContain('heavy-push-overhead')
  })

  it('triggers heavy-push-overhead for overhead prepTag', () => {
    const mv = makeMovement({ family: 'push', prepTags: ['overhead'] })
    const labels = getTriggeredTemplateLabels([mv])
    expect(labels).toContain('heavy-push-overhead')
  })

  it('triggers legs template for a legs-family movement', () => {
    const mv = makeMovement({ family: 'legs', prepTags: [] })
    const labels = getTriggeredTemplateLabels([mv])
    expect(labels).toContain('legs')
  })

  it('triggers core template for a core-family movement', () => {
    const mv = makeMovement({ family: 'core', prepTags: [] })
    const labels = getTriggeredTemplateLabels([mv])
    expect(labels).toContain('core')
  })

  it('does NOT trigger core from a scap-pull tag alone (only a core-family movement does)', () => {
    // The scap-pull prep tag is on ordinary scapular-pull movements, so an
    // earlier scap-pull→core trigger over-fired hollow-body work on plain pull
    // days. Core now requires an actual core-family movement.
    const mv = makeMovement({ family: 'push', prepTags: ['scap-pull'] })
    const labels = getTriggeredTemplateLabels([mv])
    expect(labels).not.toContain('core')
  })

  it('deduplicates: two movements with the same family trigger a template only once', () => {
    const mv1 = makeMovement({ movementId: 'mv-1', family: 'pull', prepTags: [] })
    const mv2 = makeMovement({ movementId: 'mv-2', family: 'pull', prepTags: [] })
    const labels = getTriggeredTemplateLabels([mv1, mv2])
    expect(labels.filter((l) => l === 'scap-pull')).toHaveLength(1)
  })

  it('deduplicates: same prepTag on two movements triggers the template once', () => {
    const mv1 = makeMovement({ movementId: 'mv-1', family: 'push', prepTags: ['wrist-loaded'] })
    const mv2 = makeMovement({ movementId: 'mv-2', family: 'core', prepTags: ['wrist-loaded'] })
    const labels = getTriggeredTemplateLabels([mv1, mv2])
    expect(labels.filter((l) => l === 'wrist')).toHaveLength(1)
  })

  it('returns templates in canonical order: wrist before scap before heavy-push before legs before core', () => {
    const movements: WarmupMovementInput[] = [
      makeMovement({ movementId: 'mv-core', family: 'core', prepTags: [] }),
      makeMovement({ movementId: 'mv-legs', family: 'legs', prepTags: [] }),
      makeMovement({ movementId: 'mv-pull', family: 'pull', prepTags: ['scap-pull', 'wrist-loaded', 'heavy-push'] }),
    ]
    const labels = getTriggeredTemplateLabels(movements)
    const wristIdx = labels.indexOf('wrist')
    const scapIdx = labels.indexOf('scap-pull')
    const heavyIdx = labels.indexOf('heavy-push-overhead')
    const legsIdx = labels.indexOf('legs')
    const coreIdx = labels.indexOf('core')

    expect(wristIdx).toBeLessThan(scapIdx)
    expect(scapIdx).toBeLessThan(heavyIdx)
    expect(heavyIdx).toBeLessThan(legsIdx)
    expect(legsIdx).toBeLessThan(coreIdx)
  })
})

// ── buildWarmupBlock ─────────────────────────────────────────────────────────

describe('buildWarmupBlock', () => {
  it('returns null when no movements trigger any template', () => {
    const mv = makeMovement({ family: 'push', prepTags: [] })
    const map = makeFullMovementMap()
    const block = buildWarmupBlock([mv], map)
    expect(block).toBeNull()
  })

  it('returns null for an empty movements array', () => {
    const map = makeFullMovementMap()
    const block = buildWarmupBlock([], map)
    expect(block).toBeNull()
  })

  it('drops warm-up exercises already in the session (no duplication)', () => {
    // A pull movement fires the scap-pull template (Scapular Pulls + Dead Hang).
    const mv = makeMovement({ family: 'pull', prepTags: ['scap-pull'] })
    const map = makeFullMovementMap()
    const scapularPullsId = map.get('Scapular Pulls')!.id

    // Without dedup: Scapular Pulls is present.
    const withDup = buildWarmupBlock([mv], map)
    expect(withDup?.entries.some((e) => e.movementId === scapularPullsId)).toBe(true)

    // With Scapular Pulls already in the session: it must be excluded, but the
    // non-duplicate Dead Hang stays.
    const deduped = buildWarmupBlock([mv], map, new Set([scapularPullsId]))
    expect(deduped?.entries.some((e) => e.movementId === scapularPullsId)).toBe(false)
    expect(deduped?.entries.some((e) => e.movementName === 'Dead Hang')).toBe(true)
  })

  it('returns null when every triggered warm-up exercise is already in the session', () => {
    const mv = makeMovement({ family: 'core', prepTags: [] }) // fires core → Hollow Body Hold
    const map = makeFullMovementMap()
    const hollowId = map.get('Hollow Body Hold')!.id
    const block = buildWarmupBlock([mv], map, new Set([hollowId]))
    expect(block).toBeNull()
  })

  it('returns a ResolvedBlock when templates fire', () => {
    const mv = makeMovement({ family: 'pull', prepTags: ['wrist-loaded'] })
    const map = makeFullMovementMap()
    const block = buildWarmupBlock([mv], map)
    expect(block).not.toBeNull()
    expect(block!.rounds).toBe(1)
    expect(block!.restSeconds).toBe(0)
    expect(block!.type).toBe('set')
  })

  it('includes wrist exercises when wrist-loaded tag is present', () => {
    const mv = makeMovement({ family: 'push', prepTags: ['wrist-loaded'] })
    const map = makeFullMovementMap()
    const block = buildWarmupBlock([mv], map)!
    const names = block.entries.map((e) => e.movementName)
    expect(names).toContain('Wrist Rocks')
    expect(names).toContain('Wrist Push-Up Lean')
  })

  it('includes scap-pull exercises when pull family present', () => {
    const mv = makeMovement({ family: 'pull', prepTags: [] })
    const map = makeFullMovementMap()
    const block = buildWarmupBlock([mv], map)!
    const names = block.entries.map((e) => e.movementName)
    expect(names).toContain('Scapular Pulls')
    expect(names).toContain('Dead Hang')
  })

  it('includes legs exercises for a legs-family movement', () => {
    const mv = makeMovement({ family: 'legs', prepTags: [] })
    const map = makeFullMovementMap()
    const block = buildWarmupBlock([mv], map)!
    const names = block.entries.map((e) => e.movementName)
    expect(names).toContain('Deep Squat Hold')
    expect(names).toContain('Leg Swings')
  })

  it('sets perSide=true on Leg Swings', () => {
    const mv = makeMovement({ family: 'legs', prepTags: [] })
    const map = makeFullMovementMap()
    const block = buildWarmupBlock([mv], map)!
    const legSwings = block.entries.find((e) => e.movementName === 'Leg Swings')
    expect(legSwings?.perSide).toBe(true)
  })

  it('includes hollow body hold for core-family movement', () => {
    const mv = makeMovement({ family: 'core', prepTags: [] })
    const map = makeFullMovementMap()
    const block = buildWarmupBlock([mv], map)!
    const names = block.entries.map((e) => e.movementName)
    expect(names).toContain('Hollow Body Hold')
  })

  it('includes band dislocates + scapular push-ups for heavy-push tag', () => {
    const mv = makeMovement({ family: 'push', prepTags: ['heavy-push'] })
    const map = makeFullMovementMap()
    const block = buildWarmupBlock([mv], map)!
    const names = block.entries.map((e) => e.movementName)
    expect(names).toContain('Band Dislocates')
    expect(names).toContain('Scapular Push-Ups')
  })

  it('entries appear in wrist→scap→heavy-push→legs→core order', () => {
    const movements: WarmupMovementInput[] = [
      makeMovement({ movementId: 'mv-1', family: 'core', prepTags: [] }),
      makeMovement({ movementId: 'mv-2', family: 'legs', prepTags: [] }),
      makeMovement({ movementId: 'mv-3', family: 'pull', prepTags: ['wrist-loaded', 'heavy-push'] }),
    ]
    const map = makeFullMovementMap()
    const block = buildWarmupBlock(movements, map)!
    const names = block.entries.map((e) => e.movementName)

    const wristIdx = names.indexOf('Wrist Rocks')
    const scapIdx = names.indexOf('Scapular Pulls')
    const bandIdx = names.indexOf('Band Dislocates')
    const sqHoldIdx = names.indexOf('Deep Squat Hold')
    const hollowIdx = names.indexOf('Hollow Body Hold')

    expect(wristIdx).toBeLessThan(scapIdx)
    expect(scapIdx).toBeLessThan(bandIdx)
    expect(bandIdx).toBeLessThan(sqHoldIdx)
    expect(sqHoldIdx).toBeLessThan(hollowIdx)
  })

  it('gracefully omits exercises whose movement is not in the map', () => {
    const mv = makeMovement({ family: 'pull', prepTags: ['wrist-loaded'] })
    // Empty map — no movements can be resolved.
    const block = buildWarmupBlock([mv], new Map())
    // All exercises skipped → null (no entries to form a block).
    expect(block).toBeNull()
  })

  it('partial map: includes resolved exercises only', () => {
    const mv = makeMovement({ family: 'pull', prepTags: [] })
    // Only Dead Hang is in the map; Scapular Pulls is missing.
    const map = new Map<string, WarmupMovementRecord>([
      ['Dead Hang', { id: 'dh-id', name: 'Dead Hang' }],
    ])
    const block = buildWarmupBlock([mv], map)!
    const names = block.entries.map((e) => e.movementName)
    expect(names).toContain('Dead Hang')
    expect(names).not.toContain('Scapular Pulls')
  })
})
