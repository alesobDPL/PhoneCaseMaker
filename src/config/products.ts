import type { Currency } from './currencies'

export const PRICE_LIST: Record<Currency, {
  base: number
  material: { silicone: number; polycarbonate: number }
  finish: { smooth: number; textured: number }
}> = {
  usd: {
    base: 14_00,
    material: { silicone: 0, polycarbonate: 5_00 },
    finish: { smooth: 0, textured: 3_00 },
  },
  eur: {
    base: 13_00,
    material: { silicone: 0, polycarbonate: 5_00 },
    finish: { smooth: 0, textured: 3_00 },
  },
  clp: {
    base: 13_990,
    material: { silicone: 0, polycarbonate: 4_990 },
    finish: { smooth: 0, textured: 2_990 },
  },
}
