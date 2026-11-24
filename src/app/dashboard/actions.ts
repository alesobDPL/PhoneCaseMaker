'use server'

import { db } from '@/db'
import { canUpdateOrder, canViewDashboard, getAuthzEnv, isAdmin } from '@/lib/authz'
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server'
import { OrderStatus } from '@prisma/client'
import { revalidatePath } from 'next/cache'

export async function updateOrderStatus({ orderId, status }: {
  orderId: string
  status: OrderStatus
}): Promise<void> {
  const user = await getKindeServerSession().getUser()
  const env = getAuthzEnv()
  if (!user || !canViewDashboard(user, env)) throw new Error('Unauthorized')
  if (!Object.values(OrderStatus).includes(status)) throw new Error('Invalid order status')

  const order = await db.order.findUnique({ where: { id: orderId } })
  if (!order || !canUpdateOrder(user, order, env)) throw new Error('Unauthorized')

  // Keep sample and ownership restrictions in the write as well as the check.
  const result = await db.order.updateMany({
    where: {
      id: orderId,
      isSample: false,
      ...(isAdmin(user, env) ? {} : { userId: user.id }),
    },
    data: { Status: status },
  })
  if (result.count !== 1) throw new Error('Unauthorized')
  revalidatePath('/dashboard')
}
