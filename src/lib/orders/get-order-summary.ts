import { DEFAULT_CURRENCY, isCurrency } from '@/config/currencies'
import { db } from '@/db'
import { notFound } from 'next/navigation'

export async function getOrderSummary(orderId: string, userId: string) {
  const order = await db.order.findFirst({
    where: { id: orderId, userId },
    select: {
      id: true,
      isPaid: true,
      amountCents: true,
      currency: true,
      configuration: {
        select: { croppedImageUrl: true, model: true, material: true, finish: true },
      },
      shippingAddress: {
        select: { name: true, street: true, city: true, state: true, postalCode: true, country: true },
      },
    },
  })

  if (!order) notFound()
  const { currency, ...summary } = order
  return { ...summary, currency: isCurrency(currency) ? currency : DEFAULT_CURRENCY }
}
