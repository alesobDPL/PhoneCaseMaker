'use server'

import { db } from '@/db'
import { getSessionUser } from '@/lib/auth/session'
import { notFound } from 'next/navigation'

export async function getPaymentStatus({ orderId }: { orderId: string }): Promise<{ isPaid: boolean }> {
  const user = await getSessionUser()
  if (!user) notFound()

  const order = await db.order.findFirst({
    where: { id: orderId, userId: user.id },
    select: { isPaid: true },
  })

  if (!order) notFound()
  return { isPaid: order.isPaid }
}
