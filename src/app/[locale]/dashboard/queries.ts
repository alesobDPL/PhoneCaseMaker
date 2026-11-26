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
  let revenue7dCents = 0
  let revenue30dCents = 0
  const countsByStatus: Record<OrderStatus, number> = {
    awaiting_shipment: 0,
    shipped: 0,
    fulfilled: 0,
  }

  for (const order of orders) {
    countsByStatus[order.Status] += 1
    const age = now - order.createdAt.getTime()
    if (age >= 0 && age <= 7 * day) revenue7dCents += order.amountCents
    if (age >= 0 && age <= 30 * day) revenue30dCents += order.amountCents
  }

  return {
    revenue7dCents,
    revenue30dCents,
    countsByStatus,
    orders: orders.map(order => ({ ...order, canUpdate: canUpdateOrder(user, order, env) })),
  }
}
