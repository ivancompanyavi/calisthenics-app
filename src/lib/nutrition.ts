import type { MealLabel } from '@/models/types'

// Shared meal-label constants — kept out of MealSection.tsx (a component
// file) so react-refresh doesn't complain about mixed component/non-component
// exports.
export const MEAL_TITLES: Record<MealLabel | 'unlabeled', string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack',
  unlabeled: 'Other',
}

export const MEAL_ORDER: (MealLabel | 'unlabeled')[] = ['breakfast', 'lunch', 'dinner', 'snack', 'unlabeled']
