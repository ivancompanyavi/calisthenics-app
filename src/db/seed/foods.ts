import type { CustomFood } from '@/models/types'

// Ivan's real staple foods, from his logged daily diet. Seeded like the rest of
// the program data — this is a personal app, so seed = the owner's actual data
// (see CLAUDE.md). Only the packaged/label items live here; generic whole foods
// (oats, chicken, eggs, veg, oil) are found via the USDA "Search foods" tab and
// don't need a custom-food row.
//
// `per: 'perServing'` — the amount entered when logging is a serving count;
// `servingGrams` is metadata for reference (not used to scale a per-serving food).
// Values are the user's own label readings (see docs/daily-diet-macros.md).
export type SeedFood = Omit<CustomFood, 'id' | 'createdAt'> & { slug: string }

export const SEED_FOODS: SeedFood[] = [
  { slug: 'milk', name: 'Milk', per: 'perServing', servingGrams: 240, kcal: 110, proteinG: 18, carbG: 9, fatG: 0, fiberG: 0, sodiumMg: 70 },
  { slug: 'red-kidney-beans', name: 'Red kidney beans', per: 'perServing', servingGrams: 130, kcal: 150, proteinG: 10, carbG: 30, fatG: 1, fiberG: 9, sodiumMg: 280 },
  { slug: 'greek-yogurt', name: 'Greek yogurt', per: 'perServing', servingGrams: 140, kcal: 90, proteinG: 10, carbG: 7, fatG: 2.5, fiberG: 0, sodiumMg: 55 },
  { slug: 'light-tuna', name: 'Light tuna (flaked)', per: 'perServing', servingGrams: 60, kcal: 60, proteinG: 13, carbG: 0, fatG: 0.5, fiberG: 0, sodiumMg: 130 },
  { slug: 'chocolate-jello', name: 'Chocolate Jell-O', per: 'perServing', kcal: 60, proteinG: 2, carbG: 11, fatG: 1.5, fiberG: 0, sodiumMg: 170 },
  { slug: 'cottage-cheese', name: 'Cottage cheese', per: 'perServing', servingGrams: 113, kcal: 100, proteinG: 18, carbG: 7, fatG: 2, fiberG: 0, sodiumMg: 470 },
  { slug: 'protein-shake', name: 'Protein shake', per: 'perServing', kcal: 120, proteinG: 27, carbG: 1, fatG: 1, fiberG: 0, sodiumMg: 120 },

  // Whole foods used in the cut-plan meals (USDA FoodData Central, per 100 g
  // unless noted). Non-starchy veg is here for à-la-carte logging, but it's
  // low-cal enough that weighing it is optional.
  { slug: 'oats', name: 'Rolled oats (dry)', per: 'per100g', kcal: 389, proteinG: 16.9, carbG: 66.3, fatG: 6.9, fiberG: 10.6 },
  { slug: 'blueberries', name: 'Blueberries', per: 'per100g', kcal: 57, proteinG: 0.7, carbG: 14.5, fatG: 0.3, fiberG: 2.4 },
  { slug: 'chicken-breast', name: 'Chicken breast (cooked)', per: 'per100g', kcal: 165, proteinG: 31, carbG: 0, fatG: 3.6, fiberG: 0, sodiumMg: 74 },
  { slug: 'white-rice', name: 'White rice (cooked)', per: 'per100g', kcal: 130, proteinG: 2.7, carbG: 28.2, fatG: 0.3, fiberG: 0.4 },
  { slug: 'salmon', name: 'Salmon (cooked)', per: 'per100g', kcal: 206, proteinG: 22, carbG: 0, fatG: 12.4, fiberG: 0 },
  { slug: 'sweet-potato', name: 'Sweet potato (cooked)', per: 'per100g', kcal: 90, proteinG: 2, carbG: 20.7, fatG: 0.15, fiberG: 3.3 },
  { slug: 'avocado', name: 'Avocado', per: 'per100g', kcal: 160, proteinG: 2, carbG: 8.5, fatG: 14.7, fiberG: 6.7 },
  { slug: 'banana', name: 'Banana', per: 'perServing', servingGrams: 118, kcal: 105, proteinG: 1.3, carbG: 27, fatG: 0.4, fiberG: 3.1 },
  { slug: 'olive-oil', name: 'Olive oil', per: 'perServing', servingGrams: 14, kcal: 119, proteinG: 0, carbG: 0, fatG: 13.5, fiberG: 0 },
  { slug: 'broccoli', name: 'Broccoli', per: 'per100g', kcal: 34, proteinG: 2.8, carbG: 6.6, fatG: 0.4, fiberG: 2.6 },
  { slug: 'cauliflower', name: 'Cauliflower', per: 'per100g', kcal: 25, proteinG: 1.9, carbG: 5, fatG: 0.3, fiberG: 2 },
  { slug: 'bell-pepper', name: 'Bell pepper', per: 'per100g', kcal: 31, proteinG: 1, carbG: 6, fatG: 0.3, fiberG: 2.1 },

  // Prepared dish — homemade mashed potato (boiled potato + skim milk + skyr).
  // Per-100g values derived from the recipe total (433 kcal / 610 g); log
  // whatever portion you actually scoop.
  { slug: 'mashed-potato', name: 'Mashed potato (homemade)', per: 'per100g', kcal: 71, proteinG: 4.4, carbG: 13.7, fatG: 0.1, fiberG: 2.4, sodiumMg: 192 },
]
