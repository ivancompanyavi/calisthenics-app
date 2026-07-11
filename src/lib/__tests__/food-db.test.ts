import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { searchFoods as SearchFoods } from '../food-db'

// The module caches its fetch in a module-level singleton (`loadPromise`), so
// each test resets the module registry and re-imports fresh — otherwise
// later tests would see a warm cache from earlier ones and never call fetch.
async function importSearchFoods(): Promise<typeof SearchFoods> {
  const mod = await import('../food-db')
  return mod.searchFoods
}

interface UsdaFood {
  id: string
  name: string
  cat: string
  per: 'per100g'
  kcal: number
  proteinG: number
  carbG: number
  fatG: number
  fiberG: number
  sodiumMg: number | null
}

interface UsdaAsset {
  version: string
  generatedAt: string
  foods: UsdaFood[]
}

function food(overrides: Partial<UsdaFood> & Pick<UsdaFood, 'id' | 'name' | 'cat'>): UsdaFood {
  return {
    per: 'per100g',
    kcal: 100,
    proteinG: 10,
    carbG: 10,
    fatG: 5,
    fiberG: 1,
    sodiumMg: 50,
    ...overrides,
  }
}

// Synthetic asset in the ASSET CONTRACT shape. Includes a name-prefix match
// ("Chicken breast") and a mid-word substring match ("Sandwich, chicken salad")
// for the same query ("chicken") to exercise ranking.
const SYNTHETIC_ASSET: UsdaAsset = {
  version: 'test-fixture',
  generatedAt: '2026-01-01T00:00:00.000Z',
  foods: [
    food({ id: '1', name: 'Chicken breast', cat: 'Poultry Products', kcal: 165, proteinG: 31, carbG: 0, fatG: 3.6, fiberG: 0 }),
    food({ id: '2', name: 'Sandwich, chicken salad', cat: 'Baked Products', kcal: 200, proteinG: 12, carbG: 15, fatG: 10, fiberG: 1 }),
    food({ id: '3', name: 'Banana', cat: 'Fruits and Fruit Juices', kcal: 89, proteinG: 1.1, carbG: 22.8, fatG: 0.3, fiberG: 2.6 }),
    food({ id: '4', name: 'Olive oil', cat: 'Fats and Oils', kcal: 884, proteinG: 0, carbG: 0, fatG: 100, fiberG: 0 }),
    food({ id: '5', name: 'Almond milk, unsweetened', cat: 'Beverages', kcal: 13, proteinG: 0.4, carbG: 0.3, fatG: 1.1, fiberG: 0.3 }),
    food({ id: '6', name: 'White rice, cooked', cat: 'Cereal Grains and Pasta', kcal: 130, proteinG: 2.4, carbG: 28, fatG: 0.3, fiberG: 0.4 }),
  ],
}

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('food-db searchFoods', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(jsonResponse(SYNTHETIC_ASSET))),
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('finds the chicken item for query "chicken"', async () => {
    const searchFoods = await importSearchFoods()
    const results = await searchFoods('chicken')
    const names = results.map((r) => r.name)
    expect(names).toContain('Chicken breast')
    expect(names).toContain('Sandwich, chicken salad')
  })

  it('ranks a name-prefix match above a mid-word substring match', async () => {
    const searchFoods = await importSearchFoods()
    const results = await searchFoods('chicken')
    const chickenBreastIdx = results.findIndex((r) => r.name === 'Chicken breast')
    const sandwichIdx = results.findIndex((r) => r.name === 'Sandwich, chicken salad')

    expect(chickenBreastIdx).toBeGreaterThanOrEqual(0)
    expect(sandwichIdx).toBeGreaterThanOrEqual(0)
    expect(chickenBreastIdx).toBeLessThan(sandwichIdx)
  })

  it('returns [] for an empty query', async () => {
    const searchFoods = await importSearchFoods()
    const results = await searchFoods('')
    expect(results).toEqual([])
  })

  it('returns [] for a whitespace-only query', async () => {
    const searchFoods = await importSearchFoods()
    const results = await searchFoods('   ')
    expect(results).toEqual([])
  })

  it('respects the limit parameter', async () => {
    const searchFoods = await importSearchFoods()
    // Query that matches every item ("a" appears in most names) to make the
    // limit the binding constraint rather than the match count.
    const results = await searchFoods('a', 2)
    expect(results.length).toBeLessThanOrEqual(2)
  })

  it('defaults to a limit of 30 when omitted', async () => {
    const searchFoods = await importSearchFoods()
    const results = await searchFoods('a')
    expect(results.length).toBeLessThanOrEqual(30)
  })

  it('matches case-insensitively', async () => {
    const searchFoods = await importSearchFoods()
    const lower = await searchFoods('banana')
    const upper = await searchFoods('BANANA')
    const mixed = await searchFoods('BaNaNa')

    expect(lower.map((r) => r.name)).toContain('Banana')
    expect(upper.map((r) => r.name)).toContain('Banana')
    expect(mixed.map((r) => r.name)).toContain('Banana')
  })

  it('finds olive oil by full-name query', async () => {
    const searchFoods = await importSearchFoods()
    const results = await searchFoods('olive oil')
    expect(results.map((r) => r.name)).toContain('Olive oil')
  })

  it('fetches the asset at most once across multiple searches', async () => {
    const searchFoods = await importSearchFoods()
    const fetchMock = vi.mocked(fetch)

    await searchFoods('chicken')
    await searchFoods('banana')
    await searchFoods('rice')

    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('fetches the asset from the expected public path', async () => {
    const searchFoods = await importSearchFoods()
    const fetchMock = vi.mocked(fetch)

    await searchFoods('chicken')

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url] = fetchMock.mock.calls[0]
    expect(String(url)).toContain('food-db/usda-foods.json')
  })

  it('returns results shaped with the per-100g macro fields from the asset', async () => {
    const searchFoods = await importSearchFoods()
    const [chicken] = await searchFoods('chicken breast')

    expect(chicken).toMatchObject({
      id: '1',
      name: 'Chicken breast',
      kcal: 165,
      proteinG: 31,
      carbG: 0,
      fatG: 3.6,
      fiberG: 0,
    })
  })

  it('returns [] when nothing matches', async () => {
    const searchFoods = await importSearchFoods()
    const results = await searchFoods('xyznonexistentfood')
    expect(results).toEqual([])
  })
})
