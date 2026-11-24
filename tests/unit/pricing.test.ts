import { describe, expect, it } from 'vitest'
import { calculatePriceCents } from '@/lib/pricing'

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
