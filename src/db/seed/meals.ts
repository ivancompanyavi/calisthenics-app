import type { Meal } from '@/models/types'

// The aggressive-cut day, seeded as three meal templates (breakfast / lunch /
// dinner). Snacks are intentionally NOT a meal — those foods are logged loose
// through the day. Each ingredient's macros are snapshotted (already scaled to
// the portion) per the Meal model; `refId` points at the seeded CustomFood for
// provenance only. Logging a meal expands into one FoodLog per item.
//
// Three meals ≈ 1,815 kcal · 161 P · 170 C · 57 F; add the loose snacks
// (Greek yogurt + cottage cheese + banana ≈ 415 kcal · 48 P) for a full day of
// ~2,230 kcal · 209 P (see docs/aggressive-cut-plan.md).
export type SeedMeal = Omit<Meal, 'id' | 'createdAt'> & { slug: string }

const food = (slug: string) => `seed-food-${slug}`

export const SEED_MEALS: SeedMeal[] = [
  {
    slug: 'breakfast',
    name: 'Breakfast (cut plan)',
    mealLabel: 'breakfast',
    items: [
      { name: 'Protein shake', source: 'custom', refId: food('protein-shake'), servings: 1, kcal: 120, proteinG: 27, carbG: 1, fatG: 1, fiberG: 0, sodiumMg: 120 },
      { name: 'Rolled oats (dry)', source: 'custom', refId: food('oats'), quantityG: 50, kcal: 195, proteinG: 8.5, carbG: 33.2, fatG: 3.5, fiberG: 5.3 },
      { name: 'Milk', source: 'custom', refId: food('milk'), servings: 1, kcal: 110, proteinG: 18, carbG: 9, fatG: 0, fiberG: 0, sodiumMg: 70 },
      { name: 'Blueberries', source: 'custom', refId: food('blueberries'), quantityG: 100, kcal: 57, proteinG: 0.7, carbG: 14.5, fatG: 0.3, fiberG: 2.4 },
    ],
  },
  {
    slug: 'lunch',
    name: 'Lunch (cut plan)',
    mealLabel: 'lunch',
    items: [
      { name: 'Chicken breast (cooked)', source: 'custom', refId: food('chicken-breast'), quantityG: 180, kcal: 297, proteinG: 55.8, carbG: 0, fatG: 6.5, fiberG: 0 },
      { name: 'White rice (cooked)', source: 'custom', refId: food('white-rice'), quantityG: 120, kcal: 156, proteinG: 3.2, carbG: 33.8, fatG: 0.4, fiberG: 0.5 },
      { name: 'Broccoli', source: 'custom', refId: food('broccoli'), quantityG: 150, kcal: 51, proteinG: 4.2, carbG: 10, fatG: 0.6, fiberG: 3.9 },
      { name: 'Olive oil', source: 'custom', refId: food('olive-oil'), servings: 1, kcal: 119, proteinG: 0, carbG: 0, fatG: 13.5, fiberG: 0 },
    ],
  },
  {
    slug: 'dinner',
    name: 'Dinner (cut plan)',
    mealLabel: 'dinner',
    items: [
      { name: 'Salmon (cooked)', source: 'custom', refId: food('salmon'), quantityG: 130, kcal: 268, proteinG: 28.6, carbG: 0, fatG: 16.1, fiberG: 0 },
      { name: 'Sweet potato (cooked)', source: 'custom', refId: food('sweet-potato'), quantityG: 150, kcal: 135, proteinG: 3, carbG: 31, fatG: 0.2, fiberG: 5 },
      { name: 'Red kidney beans', source: 'custom', refId: food('red-kidney-beans'), servings: 1, kcal: 150, proteinG: 10, carbG: 30, fatG: 1, fiberG: 9, sodiumMg: 280 },
      { name: 'Mixed greens & veg', source: 'quickadd', kcal: 40, proteinG: 2, carbG: 8, fatG: 0.4, fiberG: 3 },
      { name: 'Olive oil', source: 'custom', refId: food('olive-oil'), servings: 1, kcal: 119, proteinG: 0, carbG: 0, fatG: 13.5, fiberG: 0 },
    ],
  },
  // No "snacks" meal on purpose — the snack foods (Greek yogurt, cottage
  // cheese, banana) are seeded individually so they can be logged whenever
  // through the day rather than as one lumped meal.
]
