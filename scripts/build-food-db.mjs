#!/usr/bin/env node
/**
 * Builds public/food-db/usda-foods.json — a curated, offline-first bundle of
 * common whole foods (SR Legacy + Foundation Foods) from USDA FoodData Central.
 *
 * Usage: node scripts/build-food-db.mjs
 *
 * What it does:
 *   1. Scrapes https://fdc.nal.usda.gov/download-datasets for the current
 *      date-stamped bulk-download URLs (SR Legacy + Foundation, JSON format).
 *   2. Downloads + unzips both into a temp dir.
 *   3. Filters to ~1,500-2,500 common whole foods (see FILTERING below).
 *   4. Extracts 6 per-100g nutrients per food.
 *   5. Writes public/food-db/usda-foods.json in the asset contract shape.
 *
 * FILTERING:
 *   - Foundation Foods: included wholesale (already a small, curated, modern
 *     nutrient-dense reference set) — just requires an energy(kcal) value.
 *   - SR Legacy: restricted to common whole-food categories (dairy/egg,
 *     poultry, beef, pork, fish/seafood, vegetables, fruits, legumes,
 *     nuts/seeds, cereal grains/pasta, basic breads within Baked Products,
 *     fats/oils, beverages), with branded/restaurant/fast-food/baby-food
 *     entries excluded, then de-duplicated by a "base name" (first two
 *     comma-separated description segments) capped at 2 variants per base,
 *     prioritising raw then plain cooked forms (so "raw" + "cooked" survive,
 *     not every trim/grade/cut combination)
 *     to avoid the extreme cut/trim/grade duplication inherent to SR Legacy
 *     (e.g. "Beef, rib, shortribs, separable lean only, choice, raw" has
 *     dozens of near-identical siblings).
 *   - Entries already present in Foundation Foods (exact description match)
 *     are dropped from SR Legacy to avoid duplicates; Foundation wins.
 */

import { mkdtempSync, readFileSync, writeFileSync, mkdirSync, rmSync, readdirSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = path.resolve(__dirname, '..')
const OUT_PATH = path.join(REPO_ROOT, 'public', 'food-db', 'usda-foods.json')
const DOWNLOAD_PAGE = 'https://fdc.nal.usda.gov/download-datasets'
const UA = 'Mozilla/5.0 (compatible; calisthenics-tracker-food-db-builder/1.0)'

const CATEGORY_WHITELIST = new Set([
  'Dairy and Egg Products',
  'Poultry Products',
  'Beef Products',
  'Pork Products',
  'Finfish and Shellfish Products',
  'Vegetables and Vegetable Products',
  'Fruits and Fruit Juices',
  'Legumes and Legume Products',
  'Nut and Seed Products',
  'Cereal Grains and Pasta',
  'Baked Products',
  'Fats and Oils',
  'Beverages',
])

// Baked Products is huge and mostly branded snack/dessert junk in SR Legacy;
// restrict it to basic bread-type items per the task's "Breads/basic Baked" scope.
const BREAD_KEYWORDS = [
  'bread', 'tortilla', 'roll', 'bagel', 'pita', 'muffin', 'biscuit',
  'waffle', 'pancake', 'pie crust', 'pretzel',
]

// Known brand/company names that show up even inside SR Legacy's nominally
// generic categories (gluten-free lines, novelty snacks, commodity products).
const BRAND_MARKERS = [
  'Pillsbury', 'Kraft', 'Pepperidge Farm', 'Goya', 'Gamesa', 'La Moderna',
  'Udi', 'Rudi', 'Andrea', 'Glutino', 'Crunchmaster', 'George Weston',
  'Nabisco', 'General Mills', 'Kellogg', 'Quaker', 'Betty Crocker',
  'Duncan Hines', 'Sara Lee', 'Wonder Bread', "Thomas'", 'Entenmann',
  'Hostess', 'Little Debbie', 'Keebler', 'Ritz', 'Triscuit', 'Cheerios',
  'Coca-Cola', 'Pepsi', 'Snapple', 'Gatorade', 'Red Bull', 'Starbucks',
  'Dannon', 'Yoplait', 'Chobani', 'Land O Lakes', 'Philadelphia',
  'Hellmann', 'Best Foods', 'Jif', 'Skippy', 'Smucker', 'Welch',
  'Tropicana', 'Minute Maid', 'McCormick', 'Hidden Valley', 'Heinz',
  'Campbell', 'Progresso', 'Swanson', 'Tyson', 'Perdue', 'Oscar Mayer',
  'Hormel', 'Jimmy Dean', 'Butterball', 'Jennie-O', 'Morningstar',
  'Boca ', 'Lightlife', 'Silk ', 'Blue Diamond', 'Nature Valley',
  'Clif ', 'Luna ', 'Special K', 'Fiber One', 'Interstate Brands',
]

const KEYWORD_BLOCKLIST = [
  'separable', 'trimmed to', 'usda commodity', 'restaurant', 'fast food',
  'strained', 'junior', 'variety meats', 'formula, ',
]

// USDA nutrient identifiers differ between SR Legacy (nutrient.number, string)
// and modern datasets (nutrient.id, number). Each entry lists both, in
// preference order (we want the kcal energy nutrient, not the kJ one).
const NUTRIENT_SPECS = {
  // Energy: prefer the plain "Energy" (kcal) nutrient, then Atwater General /
  // Specific factor kcal. Many Foundation Foods report energy ONLY under the
  // Atwater ids (2047/2048), so without them those foods get dropped for
  // "missing energy" — that's why raw strawberries/blueberries disappeared.
  kcal: { numbers: ['208'], ids: [1008, 2047, 2048] },
  proteinG: { numbers: ['203'], ids: [1003] },
  fatG: { numbers: ['204'], ids: [1004] },
  carbG: { numbers: ['205'], ids: [1005] },
  // Fiber: classic "Fiber, total dietary" (1079), falling back to the AOAC
  // 2011.25 method (2033) that many Foundation Foods report instead — without
  // it, recovered Foundation whole foods show 0 g fibre.
  fiberG: { numbers: ['291'], ids: [1079, 2033] },
  sodiumMg: { numbers: ['307'], ids: [1093] },
}

function log(...args) {
  console.log('[build-food-db]', ...args)
}

async function fetchText(url) {
  const res = await fetch(url, { headers: { 'User-Agent': UA } })
  if (!res.ok) throw new Error(`GET ${url} -> HTTP ${res.status}`)
  return res.text()
}

async function downloadFile(url, destPath) {
  const res = await fetch(url, { headers: { 'User-Agent': UA } })
  if (!res.ok) throw new Error(`GET ${url} -> HTTP ${res.status}`)
  const buf = Buffer.from(await res.arrayBuffer())
  writeFileSync(destPath, buf)
  return buf.length
}

/** Discover the current SR Legacy + Foundation Foods JSON bulk-download URLs. */
async function discoverDatasetUrls() {
  log('Fetching dataset listing from', DOWNLOAD_PAGE)
  const html = await fetchText(DOWNLOAD_PAGE)
  const zipHrefs = [...html.matchAll(/href="([^"]*\.zip)"/gi)].map((m) => m[1])
  if (zipHrefs.length === 0) {
    throw new Error('Could not find any .zip links on the USDA download-datasets page. Page format may have changed.')
  }

  const toAbsolute = (href) => (href.startsWith('http') ? href : `https://fdc.nal.usda.gov${href}`)

  // Foundation Foods JSON — pick the most recent date-stamped file.
  const foundationCandidates = zipHrefs
    .filter((h) => /foundation_food_json_\d{4}-\d{2}-\d{2}\.zip$/i.test(h))
    .sort() // ISO dates sort lexicographically
  if (foundationCandidates.length === 0) {
    throw new Error('Could not find a FoodData_Central_foundation_food_json_*.zip link on the download page.')
  }
  const foundationUrl = toAbsolute(foundationCandidates[foundationCandidates.length - 1])

  // SR Legacy JSON — currently only one vintage exists (2018-04), but pick the
  // latest available in case USDA ever republishes it.
  const srCandidates = zipHrefs
    .filter((h) => /sr_legacy_food_json_[\d-]+\.zip$/i.test(h))
    .sort()
  if (srCandidates.length === 0) {
    throw new Error('Could not find a FoodData_Central_sr_legacy_food_json_*.zip link on the download page.')
  }
  const srUrl = toAbsolute(srCandidates[srCandidates.length - 1])

  return { foundationUrl, srUrl }
}

function unzip(zipPath, destDir) {
  mkdirSync(destDir, { recursive: true })
  execFileSync('unzip', ['-o', zipPath, '-d', destDir], { stdio: 'pipe' })
}

function locateJsonFile(dir) {
  const entries = readdirSync(dir)
  for (const entry of entries) {
    const full = path.join(dir, entry)
    const stat = statSync(full)
    if (stat.isDirectory()) {
      const nested = locateJsonFile(full)
      if (nested) return nested
    } else if (entry.toLowerCase().endsWith('.json')) {
      return full
    }
  }
  return null
}

function getNutrientAmount(foodNutrients, spec) {
  // Prefer matching by modern numeric id, then by legacy string "number".
  for (const id of spec.ids) {
    const hit = foodNutrients.find((n) => n.nutrient && n.nutrient.id === id)
    if (hit && typeof hit.amount === 'number') return hit.amount
  }
  for (const number of spec.numbers) {
    const hit = foodNutrients.find((n) => n.nutrient && n.nutrient.number === number)
    if (hit && typeof hit.amount === 'number') return hit.amount
  }
  return null
}

function round1(n) {
  return Math.round(n * 10) / 10
}

function extractFood(raw) {
  const foodNutrients = raw.foodNutrients || []
  const kcal = getNutrientAmount(foodNutrients, NUTRIENT_SPECS.kcal)
  if (kcal === null) return null // skip foods missing energy

  const proteinG = getNutrientAmount(foodNutrients, NUTRIENT_SPECS.proteinG) ?? 0
  const fatG = getNutrientAmount(foodNutrients, NUTRIENT_SPECS.fatG) ?? 0
  const carbG = getNutrientAmount(foodNutrients, NUTRIENT_SPECS.carbG) ?? 0
  const fiberG = getNutrientAmount(foodNutrients, NUTRIENT_SPECS.fiberG) ?? 0
  const sodiumMgRaw = getNutrientAmount(foodNutrients, NUTRIENT_SPECS.sodiumMg)

  return {
    id: String(raw.fdcId),
    name: raw.description,
    cat: raw.foodCategory && raw.foodCategory.description ? raw.foodCategory.description : 'Other',
    per: 'per100g',
    kcal: round1(kcal),
    proteinG: round1(proteinG),
    carbG: round1(carbG),
    fatG: round1(fatG),
    fiberG: round1(fiberG),
    sodiumMg: sodiumMgRaw === null ? null : round1(sodiumMgRaw),
  }
}

function containsAny(haystackLower, needles) {
  return needles.some((n) => haystackLower.includes(n))
}

// SR Legacy's convention for branded/commercial entries is to embed the brand
// name in ALL CAPS within the description (e.g. "Beverages, ARIZONA, tea,
// ready-to-drink, lemon", "SILK Plain soy yogurt", "HORMEL, Cure 81 Ham").
// This is far more reliable than any hand-maintained brand list — verified
// against the full dataset to produce zero false positives on genuinely
// generic (Title Case) entries.
const ALL_CAPS_BRAND_RE = /\b[A-Z]{3,}\b/

function isBranded(description) {
  if (ALL_CAPS_BRAND_RE.test(description)) return true
  const descLower = description.toLowerCase()
  if (BRAND_MARKERS.some((b) => descLower.includes(b.toLowerCase()))) return true
  // Possessive brand markers, e.g. "Rudi's, Gluten-Free Bakery, ..."
  if (descLower.includes("'s ") || descLower.includes("'s,")) return true
  return false
}

function passesSrLegacyFilter(raw) {
  const desc = raw.description
  if (!desc) return false
  const catName = raw.foodCategory && raw.foodCategory.description
  if (!catName || !CATEGORY_WHITELIST.has(catName)) return false

  const descLower = desc.toLowerCase()
  if (containsAny(descLower, KEYWORD_BLOCKLIST)) return false
  if (isBranded(desc)) return false

  if (catName === 'Baked Products' && !containsAny(descLower, BREAD_KEYWORDS)) {
    return false
  }
  return true
}

function baseKey(description) {
  const parts = description.split(',').map((p) => p.trim())
  const key = parts.length > 1 ? `${parts[0]},${parts[1]}` : parts[0]
  return key.toLowerCase()
}

// Rank preparation forms within a base group so the plain whole-food variants
// win over heavily-qualified cut/trim/grade ones: raw first, then simple cooked
// forms, then everything else. Prevents the length-only sort from dropping a
// "raw" staple in favour of two over-qualified variants (the failure mode that
// left, e.g., only canned/frozen forms of some fruits in the bundle).
function prepRank(descLower) {
  if (/\braw\b/.test(descLower)) return 0
  if (/\b(cooked|boiled|roasted|grilled|baked|steamed|dry|dried)\b/.test(descLower)) return 1
  return 2
}

function dedupeSrLegacy(foods) {
  const groups = new Map()
  for (const f of foods) {
    const key = baseKey(f.description)
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(f)
  }
  const result = []
  for (const group of groups.values()) {
    // Prioritise raw, then plain cooked forms, breaking ties by shorter
    // description (surfaces plain forms over qualified variants). Cap at 2 per
    // base food so a raw + a cooked variant survive without the full
    // cut/trim/grade explosion.
    group.sort((a, b) => {
      const rankDiff = prepRank(a.description.toLowerCase()) - prepRank(b.description.toLowerCase())
      if (rankDiff !== 0) return rankDiff
      return a.description.length - b.description.length
    })
    result.push(...group.slice(0, 2))
  }
  return result
}

async function main() {
  const workDir = mkdtempSync(path.join(tmpdir(), 'usda-food-db-'))
  log('Working dir:', workDir)

  try {
    const { foundationUrl, srUrl } = await discoverDatasetUrls()
    log('Foundation Foods URL:', foundationUrl)
    log('SR Legacy URL:', srUrl)

    const foundationZip = path.join(workDir, 'foundation.zip')
    const srZip = path.join(workDir, 'sr_legacy.zip')

    log('Downloading Foundation Foods...')
    const foundationSize = await downloadFile(foundationUrl, foundationZip)
    log(`  ${(foundationSize / 1024).toFixed(0)} KB`)

    log('Downloading SR Legacy...')
    const srSize = await downloadFile(srUrl, srZip)
    log(`  ${(srSize / 1024 / 1024).toFixed(1)} MB`)

    const foundationDir = path.join(workDir, 'foundation')
    const srDir = path.join(workDir, 'sr_legacy')
    log('Unzipping...')
    unzip(foundationZip, foundationDir)
    unzip(srZip, srDir)

    const foundationJsonPath = locateJsonFile(foundationDir)
    const srJsonPath = locateJsonFile(srDir)
    if (!foundationJsonPath) throw new Error('Could not locate Foundation Foods JSON after unzip.')
    if (!srJsonPath) throw new Error('Could not locate SR Legacy JSON after unzip.')

    log('Parsing Foundation Foods JSON...')
    const foundationData = JSON.parse(readFileSync(foundationJsonPath, 'utf8'))
    const foundationRaw = (foundationData.FoundationFoods || []).filter(Boolean)
    log(`  ${foundationRaw.length} raw entries`)

    log('Parsing SR Legacy JSON...')
    const srData = JSON.parse(readFileSync(srJsonPath, 'utf8'))
    const srRaw = (srData.SRLegacyFoods || []).filter(Boolean)
    log(`  ${srRaw.length} raw entries`)

    // Foundation Foods: keep wholesale, just need energy present.
    const foundationDescLower = new Set(foundationRaw.map((f) => f.description.trim().toLowerCase()))

    // SR Legacy: category + brand + keyword filtering, then de-dupe, then
    // drop anything already covered by Foundation Foods (Foundation wins).
    const srFilteredRaw = srRaw
      .filter(passesSrLegacyFilter)
      .filter((f) => !foundationDescLower.has(f.description.trim().toLowerCase()))
    const srDeduped = dedupeSrLegacy(srFilteredRaw)
    log(`  SR Legacy: ${srRaw.length} -> ${srFilteredRaw.length} (filtered) -> ${srDeduped.length} (deduped)`)

    const combinedRaw = [...foundationRaw, ...srDeduped]

    const extracted = []
    const seenDescriptions = new Set()
    for (const raw of combinedRaw) {
      const food = extractFood(raw)
      if (!food) continue
      const descKey = food.name.trim().toLowerCase()
      if (seenDescriptions.has(descKey)) continue // final safety dedupe
      seenDescriptions.add(descKey)
      extracted.push(food)
    }

    extracted.sort((a, b) => a.name.localeCompare(b.name))

    log(`Final food count: ${extracted.length}`)

    // Surface whether common raw whole-food staples made it in. A silent gap
    // here is exactly how "no raw strawberry" slipped through — now it's
    // visible on every build. (Warn-only; doesn't fail the build.)
    const STAPLE_CHECKS = [
      'strawberries, raw', 'blueberries, raw', 'banana', 'apple', 'orange',
      'broccoli, raw', 'spinach, raw', 'carrot', 'potato', 'sweet potato',
      'chicken', 'egg', 'rice', 'oat', 'salmon',
    ]
    const missingStaples = STAPLE_CHECKS.filter(
      (s) => !extracted.some((f) => f.name.toLowerCase().includes(s)),
    )
    if (missingStaples.length > 0) {
      log(`⚠️  staple check — MISSING: ${missingStaples.join(', ')}`)
    } else {
      log('staple check — all present')
    }

    if (extracted.length < 1000 || extracted.length > 4000) {
      throw new Error(
        `Final food count ${extracted.length} is outside the expected 1000-4000 sanity range. Aborting without writing output.`,
      )
    }

    const asset = {
      version: 'sr+foundation',
      generatedAt: new Date().toISOString(),
      foods: extracted,
    }

    mkdirSync(path.dirname(OUT_PATH), { recursive: true })
    writeFileSync(OUT_PATH, JSON.stringify(asset))
    log('Wrote', OUT_PATH)
  } finally {
    try {
      rmSync(workDir, { recursive: true, force: true })
    } catch {
      // best-effort cleanup
    }
  }
}

main().catch((err) => {
  console.error('[build-food-db] FAILED:', err.message)
  process.exit(1)
})
