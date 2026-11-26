import { describe, expect, it } from 'vitest'
import { CURRENCIES, STRIPE_MINIMUM_AMOUNT } from '@/config/currencies'
import { BASE_PRICE, PRODUCT_PRICES } from '@/config/products'
import { calculatePrice, calculatePriceCents } from '@/lib/pricing'

describe('calculatePrice', () => {
  it.each([
    ['usd', 'silicone', 'smooth', 14_00],
    ['usd', 'polycarbonate', 'smooth', 19_00],
    ['usd', 'silicone', 'textured', 17_00],
    ['usd', 'polycarbonate', 'textured', 22_00],
    ['eur', 'silicone', 'smooth', 13_00],
    ['eur', 'polycarbonate', 'smooth', 18_00],
    ['eur', 'silicone', 'textured', 16_00],
    ['eur', 'polycarbonate', 'textured', 21_00],
    ['clp', 'silicone', 'smooth', 13_990],
    ['clp', 'polycarbonate', 'smooth', 18_980],
    ['clp', 'silicone', 'textured', 16_980],
    ['clp', 'polycarbonate', 'textured', 21_970],
  ] as const)('prices %s %s with a %s finish at %d minor units', (currency, material, finish, amount) => {
    expect(calculatePrice({ material, finish }, currency)).toEqual({ amount, currency })
  })

  it('defaults null material and finish to silicone and smooth in CLP', () => {
    expect(calculatePrice({ material: null, finish: null }, 'clp')).toEqual({ amount: 13_990, currency: 'clp' })
    expect(calculatePrice({ material: null, finish: 'textured' }, 'clp').amount).toBe(16_980)
    expect(calculatePrice({ material: 'polycarbonate', finish: null }, 'clp').amount).toBe(18_980)
  })

  it('keeps every price above the Stripe minimum', () => {
    for (const currency of CURRENCIES) {
      const { amount } = calculatePrice({ material: 'silicone', finish: 'smooth' }, currency)
      expect(amount).toBeGreaterThan(STRIPE_MINIMUM_AMOUNT[currency])
    }
  })
})

describe('calculatePriceCents', () => {
  it('prices silicone with a smooth finish at 1400 cents', () => {
    expect(calculatePriceCents({ material: 'silicone', finish: 'smooth' })).toBe(1400)
  })

  it('prices polycarbonate with a smooth finish at 1900 cents', () => {
    expect(calculatePriceCents({ material: 'polycarbonate', finish: 'smooth' })).toBe(1900)
  })

  it('prices silicone with a textured finish at 1700 cents', () => {
    expect(calculatePriceCents({ material: 'silicone', finish: 'textured' })).toBe(1700)
  })

  it('prices polycarbonate with a textured finish at 2200 cents', () => {
    expect(calculatePriceCents({ material: 'polycarbonate', finish: 'textured' })).toBe(2200)
  })

  it('defaults null material and finish to silicone and smooth', () => {
    expect(calculatePriceCents({ material: null, finish: null })).toBe(1400)
    expect(calculatePriceCents({ material: null, finish: 'smooth' })).toBe(1400)
    expect(calculatePriceCents({ material: 'silicone', finish: null })).toBe(1400)
  })
})

it('keeps the legacy USD exports', () => {
  expect(BASE_PRICE).toBe(14_00)
  expect(PRODUCT_PRICES).toEqual({
    material: { silicone: 0, polycarbonate: 5_00 },
    finish: { smooth: 0, textured: 3_00 },
  })
})
