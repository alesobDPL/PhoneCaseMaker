import { afterEach, describe, expect, it, vi } from 'vitest'
import { setCurrency } from '@/app/actions/set-currency'
import { isCurrency } from '@/config/currencies'
import { getCurrencyPreference, parseCurrency } from '@/lib/currency-preference'

const cookieStore = vi.hoisted(() => ({ get: vi.fn(), set: vi.fn() }))
vi.mock('next/headers', () => ({ cookies: async () => cookieStore }))

describe('parseCurrency', () => {
  it.each([
    ['usd', 'usd'],
    ['eur', 'eur'],
    [' CLP ', 'clp'],
    ['EUR', 'eur'],
  ])('normalizes %s to %s', (value, currency) => {
    expect(parseCurrency(value)).toBe(currency)
  })

  it.each([
    { description: 'an unknown code', value: 'xyz' },
    { description: 'an empty string', value: '' },
    { description: 'undefined', value: undefined },
    { description: 'null', value: null },
    { description: 'a compound value', value: 'usd;eur' },
    { description: 'a 5000-character value', value: 'x'.repeat(5_000) },
  ])('defaults to USD for $description', ({ value }) => {
    expect(parseCurrency(value)).toBe('usd')
  })
})

describe('isCurrency', () => {
  it('recognizes only exact lowercase currency codes', () => {
    expect(isCurrency('usd')).toBe(true)
    expect(isCurrency('eur')).toBe(true)
    expect(isCurrency('clp')).toBe(true)
    expect(isCurrency('EUR')).toBe(false)
    expect(isCurrency(null)).toBe(false)
  })
})

describe('getCurrencyPreference', () => {
  it.each([
    { cookie: { value: ' EUR ' }, currency: 'eur' },
    { cookie: { value: 'usd;eur' }, currency: 'usd' },
    { cookie: undefined, currency: 'usd' },
  ])('reads CURRENCY and returns $currency for $cookie', async ({ cookie, currency }) => {
    cookieStore.get.mockReset().mockReturnValue(cookie)

    await expect(getCurrencyPreference()).resolves.toBe(currency)
    expect(cookieStore.get).toHaveBeenCalledWith('CURRENCY')
  })
})

describe('setCurrency', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    cookieStore.set.mockClear()
  })

  it.each([
    { environment: 'production', value: ' EUR ', currency: 'eur', secure: true },
    { environment: 'development', value: 'usd;eur', currency: 'usd', secure: false },
  ])('sets the normalized cookie in $environment', async ({ environment, value, currency, secure }) => {
    vi.stubEnv('NODE_ENV', environment)

    await expect(setCurrency(value)).resolves.toEqual({ currency })
    expect(cookieStore.set).toHaveBeenCalledExactlyOnceWith('CURRENCY', currency, {
      maxAge: 31_536_000,
      sameSite: 'lax',
      path: '/',
      httpOnly: true,
      secure,
    })
  })
})
