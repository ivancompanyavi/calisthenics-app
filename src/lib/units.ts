import type { WeightUnit } from '@/models/types'

const KG_PER_LB = 0.45359237

export function kgToLb(kg: number): number {
  return kg / KG_PER_LB
}

export function lbToKg(lb: number): number {
  return lb * KG_PER_LB
}

// Round to a reasonable display precision per unit. kg gets 1 decimal (most
// stacks/dumbbells move in 0.5kg steps); lb gets no decimals (lb plates step
// in 2.5/5/10 lb increments — sub-pound precision is illusory).
export function formatWeight(kg: number | undefined, unit: WeightUnit): string {
  if (kg == null) return ''
  if (unit === 'lb') return `${Math.round(kgToLb(kg))} lb`
  return `${roundToHalf(kg)} kg`
}

function roundToHalf(n: number): number {
  return Math.round(n * 2) / 2
}

// Convert a user-typed value (in their preferred unit) back to canonical kg.
export function toKg(value: number, unit: WeightUnit): number {
  return unit === 'lb' ? lbToKg(value) : value
}

// Convert a canonical kg value to the user's preferred unit, for input
// pre-fill. Mirrors formatWeight's rounding choices.
export function fromKg(kg: number, unit: WeightUnit): number {
  if (unit === 'lb') return Math.round(kgToLb(kg))
  return roundToHalf(kg)
}
