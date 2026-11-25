import { cookies } from 'next/headers'
import { DEFAULT_CURRENCY, isCurrency, type Currency } from '@/config/currencies'

export const CURRENCY_COOKIE = 'CURRENCY'
export const CURRENCY_COOKIE_MAX_AGE = 60 * 60 * 24 * 365

export function parseCurrency(value: string | undefined | null): Currency {
  const normalized = typeof value === 'string' ? value.trim().toLowerCase() : undefined
  return isCurrency(normalized) ? normalized : DEFAULT_CURRENCY
}

export async function getCurrencyPreference(): Promise<Currency> {
  const cookieStore = await cookies()
  return parseCurrency(cookieStore.get(CURRENCY_COOKIE)?.value)
}
