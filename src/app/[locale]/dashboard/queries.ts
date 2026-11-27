import { isCurrency, type Currency } from '@/config/currencies'
import { db } from '@/db'
import { canUpdateOrder, canViewDashboard, isAdmin, type AuthzEnv } from '@/lib/authz'
import type { OrderStatus } from '@prisma/client'

export async function getDashboardData(
  user: { id: string; email?: string | null },
  env: AuthzEnv,
) {
  if (!canViewDashboard(user, env)) throw new Error('Unauthorized')

  const orders = await db.order.findMany({
    where: {
      isPaid: true,
      ...(isAdmin(user, env) ? {} : { OR: [{ isSample: true }, { userId: user.id }] }),
    },
    include: { user: { select: { email: true } }, configuration: true },
    orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
  })

  const now = Date.now()
  const day = 24 * 60 * 60 * 1000
  const revenue7dByCurrency: Partial<Record<Currency, number>> = {}
  const revenue30dByCurrency: Partial<Record<Currency, number>> = {}
  const countsByStatus: Record<OrderStatus, number> = {
    awaiting_shipment: 0,
    shipped: 0,
    fulfilled: 0,
  }

  for (const order of orders) {
    countsByStatus[order.Status] += 1
    const age = now - order.createdAt.getTime()
    const { currency, amountCents } = order
    if (!isCurrency(currency) || age < 0) continue
    if (age <= 7 * day) revenue7dByCurrency[currency] = (revenue7dByCurrency[currency] ?? 0) + amountCents
    if (age <= 30 * day) revenue30dByCurrency[currency] = (revenue30dByCurrency[currency] ?? 0) + amountCents
  }

  return {
    revenue7dCents: revenue7dByCurrency.usd ?? 0,
    revenue30dCents: revenue30dByCurrency.usd ?? 0,
    revenue7dByCurrency,
    revenue30dByCurrency,
    countsByStatus,
    orders: orders.map(order => ({ ...order, canUpdate: canUpdateOrder(user, order, env) })),
  }
}
