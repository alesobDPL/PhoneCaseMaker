import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type Stripe from 'stripe'
import { db } from '@/db'
import { createOrder, resetDb } from '../helpers/db'
import { signedStripeRequest } from '../helpers/stripe'
import { POST } from '@/app/api/webhooks/route'
import { handleCheckoutCompleted } from '@/lib/orders/handle-checkout-completed'

function completedEvent(orderId?: string, userId?: string) {
  return {
    id: 'evt_checkout_completed',
    type: 'checkout.session.completed',
    data: {
      object: {
        id: 'cs_test_checkout',
        metadata: orderId ? { orderId, userId } : null,
        customer_details: {
          name: 'Billing Customer',
          email: 'customer@example.com',
          address: {
            line1: '100 Billing Street', city: 'Boston',
            country: 'US', postal_code: '02108', state: 'MA',
          },
        },
        shipping_details: {
          name: 'Shipping Customer',
          address: {
            line1: '200 Shipping Street', city: 'Santiago',
            country: 'CL', postal_code: '8320000', state: 'RM',
          },
        },
      },
    },
  }
}

async function expectNoPaymentWrites(orderId: string) {
  expect(await db.order.findUniqueOrThrow({ where: { id: orderId } }))
    .toMatchObject({ isPaid: false, shippingAddressId: null, billingAddressId: null })
  expect(await db.shippingAddress.count()).toBe(0)
  expect(await db.billingAddress.count()).toBe(0)
}

describe('checkout webhook', () => {
  beforeEach(resetDb)
  afterEach(() => vi.restoreAllMocks())

  it('marks the order paid and stores both addresses', async () => {
    const order = await createOrder()
    const response = await POST(signedStripeRequest(completedEvent(order.id, order.userId)))

    expect(response.status).toBe(200)
    const paid = await db.order.findUniqueOrThrow({
      where: { id: order.id }, include: { shippingAddress: true, billingAddress: true },
    })
    expect(paid.isPaid).toBe(true)
    expect(paid.shippingAddress).toMatchObject({ name: 'Shipping Customer', street: '200 Shipping Street' })
    expect(paid.billingAddress).toMatchObject({ name: 'Billing Customer', street: '100 Billing Street' })
    expect(await db.shippingAddress.count()).toBe(1)
    expect(await db.billingAddress.count()).toBe(1)
  })

  it.each(['sequential', 'simultaneous'] as const)(
    'same event twice keeps one set of addresses (%s)', async (delivery) => {
      const order = await createOrder()
      const event = completedEvent(order.id, order.userId)
      const deliver = () => POST(signedStripeRequest(event))
      const responses = delivery === 'simultaneous'
        ? await Promise.all([deliver(), deliver()])
        : [await deliver(), await deliver()]

      expect(responses.map(({ status }) => status)).toEqual([200, 200])
      expect((await db.order.findUniqueOrThrow({ where: { id: order.id } })).isPaid).toBe(true)
      expect(await db.shippingAddress.count()).toBe(1)
      expect(await db.billingAddress.count()).toBe(1)
    },
  )

  it('invalid signature returns 400 and writes nothing', async () => {
    const order = await createOrder()
    const response = await POST(signedStripeRequest(completedEvent(order.id, order.userId), 'whsec_wrong'))
    expect(response.status).toBe(400)
    await expectNoPaymentWrites(order.id)
  })

  it('missing signature returns 400 and writes nothing', async () => {
    const order = await createOrder()
    const response = await POST(new Request('http://localhost/api/webhooks', {
      method: 'POST', body: JSON.stringify(completedEvent(order.id, order.userId)),
    }))
    expect(response.status).toBe(400)
    await expectNoPaymentWrites(order.id)
  })

  it('missing metadata returns 200 and writes nothing', async () => {
    const order = await createOrder()
    expect((await POST(signedStripeRequest(completedEvent()))).status).toBe(200)
    await expectNoPaymentWrites(order.id)
  })

  it('unknown orderId returns 200 and writes nothing', async () => {
    const order = await createOrder()
    const event = completedEvent('missing-order', order.userId)
    expect((await POST(signedStripeRequest(event))).status).toBe(200)
    expect(await db.order.count()).toBe(1)
    await expectNoPaymentWrites(order.id)
  })

  it('session without shipping_details marks paid without addresses', async () => {
    const order = await createOrder()
    const event = completedEvent(order.id, order.userId)
    const session = { ...event.data.object, shipping_details: null }
    const response = await POST(signedStripeRequest({ ...event, data: { object: session } }))
    expect(response.status).toBe(200)
    expect(await db.order.findUniqueOrThrow({ where: { id: order.id } }))
      .toMatchObject({ isPaid: true, shippingAddressId: null, billingAddressId: null })
    expect(await db.shippingAddress.count()).toBe(0)
    expect(await db.billingAddress.count()).toBe(0)
  })

  it('other event types return 200', async () => {
    const order = await createOrder()
    const event = { ...completedEvent(order.id, order.userId), type: 'payment_intent.succeeded' }
    expect((await POST(signedStripeRequest(event))).status).toBe(200)
    await expectNoPaymentWrites(order.id)
  })

  it('unexpected database errors return 500 and write nothing', async () => {
    const order = await createOrder()
    vi.spyOn(db, '$transaction').mockRejectedValueOnce(new Error('Database unavailable'))
    expect((await POST(signedStripeRequest(completedEvent(order.id, order.userId)))).status).toBe(500)
    await expectNoPaymentWrites(order.id)
  })

  it('returns the handler result for paid, repeated and ignored sessions', async () => {
    const order = await createOrder()
    const session = completedEvent(order.id, order.userId).data.object as unknown as Stripe.Checkout.Session
    expect(await handleCheckoutCompleted(session, db)).toBe('paid')
    expect(await handleCheckoutCompleted(session, db)).toBe('already_processed')
    expect(await handleCheckoutCompleted({ ...session, metadata: null }, db)).toBe('ignored')
    expect(await handleCheckoutCompleted({ ...session, metadata: { orderId: 'missing-order', userId: order.userId } }, db))
      .toBe('ignored')
  })
})
