import { describe, expect, it } from 'vitest'
import { formatMoney, formatRegion } from '@/lib/money'

function normalizeSpaces(value: string): string {
  return value.replace(/[\u00a0\u202f]/g, ' ')
}

describe('formatMoney', () => {
  it('formats USD with two decimal places', () => {
    const english = normalizeSpaces(formatMoney(14_00, 'usd', 'en'))
    const spanish = normalizeSpaces(formatMoney(14_00, 'usd', 'es'))

    expect(english.startsWith('$')).toBe(true)
    expect(english).toContain('14.00')
    expect(spanish).toContain('14,00')
  })

  it('formats EUR with two decimal places', () => {
    const english = normalizeSpaces(formatMoney(13_00, 'eur', 'en'))
    const spanish = normalizeSpaces(formatMoney(13_00, 'eur', 'es'))

    expect(english).toContain('€')
    expect(english).toContain('13.00')
    expect(spanish).toContain('13,00')
  })

  it('formats CLP without decimal places', () => {
    const english = normalizeSpaces(formatMoney(13_990, 'clp', 'en'))
    const spanish = normalizeSpaces(formatMoney(13_990, 'clp', 'es'))

    expect(english).toContain('13,990')
    expect(english).not.toContain('.')
    expect(spanish).toContain('13.990')
    expect(spanish).not.toContain(',')
  })
})

describe('formatRegion', () => {
  it.each([
    ['es', 'es-CL'],
    ['en', 'en-US'],
    ['fr', 'en-US'],
  ])('uses %s locale with region %s', (locale, region) => {
    expect(formatRegion(locale)).toBe(region)
  })
})
