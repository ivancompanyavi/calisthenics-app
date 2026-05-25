import type { WeightUnit } from '@/models/types'

const KG_PER_LB = 0.45359237

export function kgToLb(kg: number): number {
  return kg / KG_PER_LB
}

export function lbToKg(lb: number): number {
  return lb * KG_PER_LB
}

// Display precision: one decimal place is the right grain for both units —
// modern scales report bodyweight to 0.1 kg / 0.2 lb, and gym plates exist
// in fractional sizes (1.25 kg / 1.25 lb). Trailing ".0" is stripped so
// whole values still read clean ("75 kg" not "75.0 kg").
export function formatWeight(kg: number | undefined, unit: WeightUnit): string {
  if (kg == null) return ''
  const value = unit === 'lb' ? kgToLb(kg) : kg
  return `${stripTrailingZero(value.toFixed(1))} ${unit}`
}

function stripTrailingZero(s: string): string {
  return s.replace(/\.0$/, '')
}

// Convert a user-typed value (in their preferred unit) back to canonical kg.
export function toKg(value: number, unit: WeightUnit): number {
  return unit === 'lb' ? lbToKg(value) : value
}

// Convert a canonical kg value to the user's preferred unit, for input
// pre-fill. Preserves the user's typed precision within a 0.1 grain.
export function fromKg(kg: number, unit: WeightUnit): number {
  const value = unit === 'lb' ? kgToLb(kg) : kg
  // Round to 1 decimal to avoid floating-point ugliness (e.g. 33.06934 lb
  // from a 15 kg input). Number, not string — call sites feed it into
  // <input value=...> directly.
  return Math.round(value * 10) / 10
}
