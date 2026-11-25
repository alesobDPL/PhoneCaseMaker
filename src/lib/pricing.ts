import type { Configuration } from '@prisma/client'
import type { Currency } from '@/config/currencies'
import { PRICE_LIST } from '@/config/products'

export function calculatePrice(
  configuration: Pick<Configuration, 'material' | 'finish'>,
  currency: Currency,
): { amount: number; currency: Currency } {
  const { base, material, finish } = PRICE_LIST[currency]
  const amount = base
    + material[configuration.material ?? 'silicone']
    + finish[configuration.finish ?? 'smooth']

  return { amount, currency }
}

export function calculatePriceCents(
  configuration: Pick<Configuration, 'material' | 'finish'>,
): number {
  return calculatePrice(configuration, 'usd').amount
}
