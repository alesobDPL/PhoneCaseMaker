import { afterAll, beforeEach, expect, it } from 'vitest'
import { mockKindeUser } from '../helpers/auth'
import { createOrder, resetDb } from '../helpers/db'
import { signedStripeRequest } from '../helpers/stripe'
import { db } from '@/db'
import { getSessionUser } from '@/lib/auth/session'
import Stripe from 'stripe'

beforeEach(resetDb)
afterAll(async () => {
  mockKindeUser(null)
  await db.$disconnect()
})

it('creates an order and resets the database with usable auth and Stripe helpers', async () => {
  const order = await createOrder()
  expect(await db.order.count()).toBe(1)
  expect(order.amountCents).toBe(1400)
  expect(order.isSample).toBe(false)

  const user = await db.user.findUniqueOrThrow({ where: { id: order.userId } })
  mockKindeUser(user)
  expect(await getSessionUser()).toEqual({
    id: user.id,
    email: user.email,
    given_name: null,
    family_name: null,
    picture: null,
  })
  mockKindeUser(null)
  expect(await getSessionUser()).toBeNull()

  const event = { id: 'evt_smoke', type: 'checkout.session.completed', data: { object: {} } }
  const request = signedStripeRequest(event)
  const stripe = new Stripe('sk_test_example')
  expect(request.method).toBe('POST')
  expect(stripe.webhooks.constructEvent(
    await request.text(),
    request.headers.get('stripe-signature')!,
    'whsec_test',
  )).toMatchObject(event)

  await db.shippingAddress.create({
    data: { name: 'Test User', street: '123 Example Street', city: 'Santiago', postalCode: '8320000', country: 'CL', Orders: { connect: { id: order.id } } },
  })
  await db.billingAddress.create({
    data: { name: 'Test User', street: '123 Example Street', city: 'Santiago', postalCode: '8320000', country: 'CL', Orders: { connect: { id: order.id } } },
  })

  await resetDb()
  expect(await db.order.count()).toBe(0)
  expect(await db.user.count()).toBe(0)
  expect(await db.configuration.count()).toBe(0)
  expect(await db.shippingAddress.count()).toBe(0)
  expect(await db.billingAddress.count()).toBe(0)
})
