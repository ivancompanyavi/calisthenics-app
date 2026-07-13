// Barcode → food lookup via the Open Food Facts API. Free, no API key, no user
// auth (a descriptive User-Agent is requested by OFF but browsers forbid
// setting that header, so we omit it — reads still work + are CORS-enabled).
// Online-only by nature; callers handle the offline / not-found cases.
//
// Data is crowd-sourced (ODbL licence) — coverage and completeness vary, so
// the mapper is defensive and the UI always lets the user review before saving.

export interface ScannedFood {
  barcode: string
  name: string
  brand?: string
  per: 'per100g'
  kcal: number
  proteinG: number
  carbG: number
  fatG: number
  fiberG: number
  sodiumMg?: number
}

interface OffResponse {
  status?: number
  product?: {
    product_name?: string
    brands?: string
    nutriments?: Record<string, unknown>
  }
}

const num = (v: unknown): number | undefined =>
  typeof v === 'number' && Number.isFinite(v) ? v : undefined

// Pure mapper (separated from the fetch so it's unit-testable). Returns null
// when the product is missing, unnamed, or has no usable energy value — i.e.
// nothing worth logging.
export function mapOffProduct(barcode: string, res: OffResponse): ScannedFood | null {
  if (res.status !== 1 || !res.product) return null
  const p = res.product
  const n = p.nutriments ?? {}

  let kcal = num(n['energy-kcal_100g'])
  if (kcal === undefined) {
    // Some products only carry energy in kJ — convert (1 kcal = 4.184 kJ).
    const kj = num(n['energy_100g'])
    if (kj !== undefined) kcal = Math.round((kj / 4.184) * 10) / 10
  }
  if (kcal === undefined) return null

  const name = (p.product_name ?? '').trim()
  if (!name) return null

  // OFF stores sodium/salt per 100 g in GRAMS. Prefer sodium; else derive from
  // salt (sodium ≈ salt × 0.4). Convert to mg for our model.
  const sodiumG = num(n['sodium_100g']) ?? (num(n['salt_100g']) !== undefined ? num(n['salt_100g'])! * 0.4 : undefined)

  return {
    barcode,
    name,
    brand: p.brands?.split(',')[0]?.trim() || undefined,
    per: 'per100g',
    kcal,
    proteinG: num(n['proteins_100g']) ?? 0,
    carbG: num(n['carbohydrates_100g']) ?? 0,
    fatG: num(n['fat_100g']) ?? 0,
    fiberG: num(n['fiber_100g']) ?? 0,
    sodiumMg: sodiumG !== undefined ? Math.round(sodiumG * 1000) : undefined,
  }
}

// Looks up a scanned barcode. Returns null when the product isn't in the
// database (or has no loggable data); throws on network/server errors so the
// caller can distinguish "not found" from "couldn't reach the service".
export async function lookupBarcode(barcode: string): Promise<ScannedFood | null> {
  const url = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}.json?fields=product_name,brands,nutriments`
  const res = await fetch(url, { headers: { Accept: 'application/json' } })
  if (res.status === 404) return null
  if (!res.ok) throw new Error(`Open Food Facts request failed (${res.status})`)
  const json = (await res.json()) as OffResponse
  return mapOffProduct(barcode, json)
}
