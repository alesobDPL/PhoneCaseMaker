import { CURRENCY_CONFIG, type Currency } from '@/config/currencies'

export function formatRegion(locale: string): 'es-CL' | 'en-US' {
  return locale === 'es' ? 'es-CL' : 'en-US'
}

export function formatMoney(amount: number, currency: Currency, locale: string): string {
  const { code, minorUnitsPerUnit } = CURRENCY_CONFIG[currency]
  const fractionDigits = minorUnitsPerUnit === 100 ? 2 : 0

  return new Intl.NumberFormat(formatRegion(locale), {
    style: 'currency',
    currency: code,
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(amount / minorUnitsPerUnit)
}
