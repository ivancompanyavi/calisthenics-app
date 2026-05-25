import { describe, expect, it } from 'vitest'
import { kgToLb, lbToKg, formatWeight, toKg, fromKg } from '@/lib/units'

describe('units', () => {
  it('round-trips kg→lb→kg within float tolerance', () => {
    const kg = 22.5
    expect(lbToKg(kgToLb(kg))).toBeCloseTo(kg, 6)
  })

  it('formats kg with up to 1 decimal, trimming trailing zero', () => {
    expect(formatWeight(75, 'kg')).toBe('75 kg')
    expect(formatWeight(75.3, 'kg')).toBe('75.3 kg')
    expect(formatWeight(75.34, 'kg')).toBe('75.3 kg')
    expect(formatWeight(75.36, 'kg')).toBe('75.4 kg')
  })

  it('formats lb with up to 1 decimal, trimming trailing zero', () => {
    // 10 kg ≈ 22.0462 lb → "22 lb" (trailing .0 stripped)
    expect(formatWeight(10, 'lb')).toBe('22 lb')
    // 22.5 kg ≈ 49.6 lb
    expect(formatWeight(22.5, 'lb')).toBe('49.6 lb')
  })

  it('returns empty string for undefined kg', () => {
    expect(formatWeight(undefined, 'kg')).toBe('')
    expect(formatWeight(undefined, 'lb')).toBe('')
  })

  it('toKg passes through kg values', () => {
    expect(toKg(15, 'kg')).toBe(15)
  })

  it('toKg converts lb values to kg without rounding', () => {
    // 50 lb ≈ 22.68 kg — preserves storage precision
    expect(toKg(50, 'lb')).toBeCloseTo(22.68, 1)
  })

  it('fromKg keeps 1-decimal precision for lb', () => {
    // 10 kg ≈ 22.0462 lb → 22 (one decimal, trailing zero implicit)
    expect(fromKg(10, 'lb')).toBe(22)
    // 22.5 kg ≈ 49.6 lb
    expect(fromKg(22.5, 'lb')).toBeCloseTo(49.6, 1)
  })

  it('fromKg keeps 1-decimal precision for kg', () => {
    expect(fromKg(22.3, 'kg')).toBe(22.3)
    expect(fromKg(22.34, 'kg')).toBe(22.3)
    expect(fromKg(22.36, 'kg')).toBe(22.4)
  })
})
