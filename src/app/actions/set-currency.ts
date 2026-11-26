'use server'

import { cookies } from 'next/headers'
import type { Currency } from '@/config/currencies'
import { CURRENCY_COOKIE, CURRENCY_COOKIE_MAX_AGE, parseCurrency } from '@/lib/currency-preference'

export async function setCurrency(value: string): Promise<{ currency: Currency }> {
  const currency = parseCurrency(value)
  const cookieStore = await cookies()

  cookieStore.set(CURRENCY_COOKIE, currency, {
    maxAge: CURRENCY_COOKIE_MAX_AGE,
    sameSite: 'lax',
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
  })

  return { currency }
}
