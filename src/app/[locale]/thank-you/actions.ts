'use server'

import { db } from '@/db'
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server'
import { notFound } from 'next/navigation'

export async function getPaymentStatus({ orderId }: { orderId: string }): Promise<{ isPaid: boolean }> {
  const { getUser } = getKindeServerSession()
  const user = await getUser()
  if (!user) notFound()

  const order = await db.order.findFirst({
    where: { id: orderId, userId: user.id },
    select: { isPaid: true },
  })

  if (!order) notFound()
  return { isPaid: order.isPaid }
}
