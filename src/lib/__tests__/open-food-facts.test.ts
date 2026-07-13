import { describe, expect, it } from 'vitest'
import { mapOffProduct } from '../open-food-facts'

describe('mapOffProduct', () => {
  it('maps a complete product to a per-100g food (sodium g → mg)', () => {
    const food = mapOffProduct('737628064502', {
      status: 1,
      product: {
        product_name: 'Peanut Butter',
        brands: 'Acme, SubBrand',
        nutriments: {
          'energy-kcal_100g': 588,
          proteins_100g: 25,
          carbohydrates_100g: 20,
          fat_100g: 50,
          fiber_100g: 6,
          sodium_100g: 0.43, // grams
        },
      },
    })
    expect(food).toEqual({
      barcode: '737628064502',
      name: 'Peanut Butter',
      brand: 'Acme', // first brand only
      per: 'per100g',
      kcal: 588,
      proteinG: 25,
      carbG: 20,
      fatG: 50,
      fiberG: 6,
      sodiumMg: 430,
    })
  })

  it('returns null when the product is not found (status 0)', () => {
    expect(mapOffProduct('x', { status: 0 })).toBeNull()
  })

  it('returns null when there is no usable energy value', () => {
    expect(
      mapOffProduct('x', { status: 1, product: { product_name: 'Water', nutriments: {} } }),
    ).toBeNull()
  })

  it('returns null when the product has no name', () => {
    expect(
      mapOffProduct('x', { status: 1, product: { nutriments: { 'energy-kcal_100g': 100 } } }),
    ).toBeNull()
  })

  it('derives kcal from kJ when energy-kcal is absent', () => {
    const food = mapOffProduct('x', {
      status: 1,
      product: { product_name: 'Juice', nutriments: { energy_100g: 418.4 } }, // 100 kcal
    })
    expect(food?.kcal).toBe(100)
  })

  it('derives sodium from salt when sodium is absent (salt × 0.4)', () => {
    const food = mapOffProduct('x', {
      status: 1,
      product: { product_name: 'Crackers', nutriments: { 'energy-kcal_100g': 400, salt_100g: 1 } },
    })
    expect(food?.sodiumMg).toBe(400) // 1 g salt → 0.4 g sodium → 400 mg
  })

  it('defaults missing macros to 0 and omits sodium when neither sodium nor salt present', () => {
    const food = mapOffProduct('x', {
      status: 1,
      product: { product_name: 'Mystery', nutriments: { 'energy-kcal_100g': 200 } },
    })
    expect(food).toMatchObject({ proteinG: 0, carbG: 0, fatG: 0, fiberG: 0 })
    expect(food?.sodiumMg).toBeUndefined()
  })
})
