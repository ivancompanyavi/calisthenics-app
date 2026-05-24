import { describe, expect, it } from 'vitest'
import { kgToLb, lbToKg, formatWeight, toKg, fromKg } from '@/lib/units'

describe('units', () => {
  it('round-trips kg→lb→kg within float tolerance', () => {
    const kg = 22.5
    expect(lbToKg(kgToLb(kg))).toBeCloseTo(kg, 6)
  })

  it('formats kg to one decimal rounded to 0.5', () => {
    expect(formatWeight(22.5, 'kg')).toBe('22.5 kg')
    expect(formatWeight(22.7, 'kg')).toBe('22.5 kg')
    expect(formatWeight(22.8, 'kg')).toBe('23 kg')
  })

  it('formats lb to nearest integer', () => {
    // 10 kg ≈ 22.0462 lb → rounds to 22
    expect(formatWeight(10, 'lb')).toBe('22 lb')
    // 22.5 kg ≈ 49.6 lb → rounds to 50
    expect(formatWeight(22.5, 'lb')).toBe('50 lb')
  })

  it('returns empty string for undefined kg', () => {
    expect(formatWeight(undefined, 'kg')).toBe('')
    expect(formatWeight(undefined, 'lb')).toBe('')
  })

  it('toKg passes through kg values', () => {
    expect(toKg(15, 'kg')).toBe(15)
  })

  it('toKg converts lb values to kg', () => {
    // 50 lb ≈ 22.68 kg
    expect(toKg(50, 'lb')).toBeCloseTo(22.68, 1)
  })

  it('fromKg rounds for lb display', () => {
    expect(fromKg(10, 'lb')).toBe(22)
  })

  it('fromKg rounds kg to nearest 0.5', () => {
    expect(fromKg(22.3, 'kg')).toBe(22.5)
    expect(fromKg(22.1, 'kg')).toBe(22)
  })
})
