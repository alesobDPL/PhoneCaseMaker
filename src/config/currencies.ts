export const CURRENCIES = ['usd', 'eur', 'clp'] as const
export type Currency = (typeof CURRENCIES)[number]
export const DEFAULT_CURRENCY: Currency = 'usd'

export const CURRENCY_CONFIG: Record<Currency, { code: 'USD' | 'EUR' | 'CLP'; minorUnitsPerUnit: 100 | 1 }> = {
  usd: { code: 'USD', minorUnitsPerUnit: 100 },
  eur: { code: 'EUR', minorUnitsPerUnit: 100 },
  clp: { code: 'CLP', minorUnitsPerUnit: 1 },
}

// Amounts are in minor units. CLP is a conservative approximation of 0.50 USD.
// https://docs.stripe.com/currencies#minimum-and-maximum-charge-amounts
export const STRIPE_MINIMUM_AMOUNT: Record<Currency, number> = {
  usd: 50,
  eur: 50,
  clp: 500,
}

export function isCurrency(value: unknown): value is Currency {
  return CURRENCIES.some(currency => currency === value)
}
