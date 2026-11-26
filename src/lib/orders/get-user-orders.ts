import type { Configuration, OrderStatus, PrismaClient } from '@prisma/client'
import { DEFAULT_CURRENCY, isCurrency, type Currency } from '@/config/currencies'
import { db as prisma } from '@/db'

export type UserOrder = {
  id: string
  createdAt: Date
  amountCents: number
  currency: Currency
  status: OrderStatus
  configuration: Pick<Configuration, 'model' | 'material' | 'finish' | 'color' | 'croppedImageUrl'>
}

export async function getUserOrders(userId: string, db: PrismaClient = prisma): Promise<UserOrder[]> {
  const orders = await db.order.findMany({
    where: { userId, isPaid: true },
    orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
    take: 50,
    select: {
      id: true,
      createdAt: true,
      amountCents: true,
      currency: true,
      Status: true,
      configuration: {
        select: { model: true, material: true, finish: true, color: true, croppedImageUrl: true },
      },
    },
  })

  return orders.map(({ Status, currency, ...order }) => ({
    ...order,
    currency: isCurrency(currency) ? currency : DEFAULT_CURRENCY,
    status: Status,
  }))
}
