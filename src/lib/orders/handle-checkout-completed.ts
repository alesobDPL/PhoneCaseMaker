import type { PrismaClient } from '@prisma/client'
import type Stripe from 'stripe'

type SessionWithCollectedInformation = Stripe.Checkout.Session & {
  collected_information?: {
    shipping_details?: Stripe.Checkout.Session.ShippingDetails | null
  } | null
}

export function getShippingDetails(session: SessionWithCollectedInformation) {
  const collected = session.collected_information?.shipping_details
  if (collected?.address) return collected

  const legacy = session.shipping_details
  return legacy?.address ? legacy : null
}

function addressData(address: Stripe.Address, name: string | null) {
  return {
    name: name ?? '',
    street: address.line1 ?? '',
    city: address.city ?? '',
    postalCode: address.postal_code ?? '',
    country: address.country ?? '',
    state: address.state,
  }
}

export async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session,
  db: PrismaClient,
): Promise<'paid' | 'already_processed' | 'ignored'> {
  const { orderId, userId } = session.metadata ?? {}
  if (!orderId || !userId) return 'ignored'

  return db.$transaction(async (tx) => {
    // Only the transaction that changes isPaid can create addresses.
    const { count } = await tx.order.updateMany({
      where: { id: orderId, isPaid: false },
      data: { isPaid: true },
    })

    if (count === 0) {
      const order = await tx.order.findUnique({ where: { id: orderId }, select: { id: true } })
      return order ? 'already_processed' : 'ignored'
    }

    const shipping = getShippingDetails(session)
    if (!shipping?.address) return 'paid'

    const customer = session.customer_details
    await tx.order.update({
      where: { id: orderId },
      data: {
        shippingAddress: {
          create: addressData(shipping.address, shipping.name ?? customer?.name ?? null),
        },
        ...(customer?.address ? {
          billingAddress: { create: addressData(customer.address, customer.name) },
        } : {}),
      },
    })

    return 'paid'
  })
}
