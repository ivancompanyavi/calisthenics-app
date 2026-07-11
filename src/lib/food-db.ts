// Offline USDA food database: lazily fetched once from the bundled asset at
// public/food-db/usda-foods.json (precached by the PWA's Workbox config so
// search works offline after first load). All nutrient values are per 100g.

export interface UsdaFood {
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

interface UsdaFoodDb {
  version: string
  generatedAt: string
  foods: UsdaFood[]
}

let loadPromise: Promise<UsdaFood[]> | null = null

async function loadFoodDb(): Promise<UsdaFood[]> {
  if (!loadPromise) {
    loadPromise = fetch('/food-db/usda-foods.json')
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load food db: ${res.status}`)
        return res.json() as Promise<UsdaFoodDb>
      })
      .then((db) => db.foods)
      .catch((err) => {
        // Reset so a later call can retry (e.g. after coming back online).
        loadPromise = null
        throw err
      })
  }
  return loadPromise
}

// Ranked search: name-prefix matches first, then word-boundary matches
// (query matches the start of some word within the name), then plain
// substring matches. Ties broken by shorter name (more specific match).
export async function searchFoods(query: string, limit = 30): Promise<UsdaFood[]> {
  const q = query.trim().toLowerCase()
  if (!q) return []

  const foods = await loadFoodDb()
  const wordBoundaryRe = new RegExp(`\\b${escapeRegExp(q)}`, 'i')

  const scored: { food: UsdaFood; rank: number }[] = []
  for (const food of foods) {
    const name = food.name.toLowerCase()
    let rank: number
    if (name.startsWith(q)) rank = 0
    else if (wordBoundaryRe.test(name)) rank = 1
    else if (name.includes(q)) rank = 2
    else continue
    scored.push({ food, rank })
  }

  scored.sort((a, b) => {
    if (a.rank !== b.rank) return a.rank - b.rank
    return a.food.name.length - b.food.name.length
  })

  return scored.slice(0, limit).map((s) => s.food)
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
