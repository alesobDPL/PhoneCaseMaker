import type { Configuration } from '@prisma/client'
import { BASE_PRICE, PRODUCT_PRICES } from '@/config/products'

export function calculatePriceCents(
  configuration: Pick<Configuration, 'material' | 'finish'>,
): number {
  return BASE_PRICE
    + PRODUCT_PRICES.material[configuration.material ?? 'silicone']
    + PRODUCT_PRICES.finish[configuration.finish ?? 'smooth']
}
