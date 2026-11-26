import { mockKindeUser } from '../helpers/auth'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type Stripe from 'stripe'
import { db } from '@/db'
import { stripe } from '@/lib/stripe'
import { createConfiguration, createOrder, createUser, resetDb } from '../helpers/db'
import { createCheckoutSession } from '@/app/[locale]/configure/preview/actions'

describe('checkout session', () => {
  beforeEach(async () => {
    await resetDb()
    mockKindeUser(null)
    vi.spyOn(stripe.checkout.sessions, 'create').mockResolvedValue({
      id: 'cs_test_checkout', url: 'https://checkout.stripe.com/test',
    } as Stripe.Response<Stripe.Checkout.Session>)
    vi.spyOn(stripe.products, 'create').mockResolvedValue({
      id: 'prod_test', default_price: 'price_test',
    } as Stripe.Response<Stripe.Product>)
  })
  afterEach(() => vi.restoreAllMocks())

  it('reuses an unpaid order for the same user and configuration', async () => {
    const user = await createUser()
    const configuration = await createConfiguration()
    await createOrder({ configurationId: configuration.id })
    await createOrder({ userId: user.id })
    const order = await createOrder({ userId: user.id, configurationId: configuration.id })
    mockKindeUser(user)

    expect(await createCheckoutSession({ configId: configuration.id }))
      .toEqual({ url: 'https://checkout.stripe.com/test' })
    expect(await db.order.count()).toBe(3)
    expect(stripe.checkout.sessions.create).toHaveBeenCalledWith(expect.objectContaining({
      metadata: { userId: user.id, orderId: order.id },
    }))
  })

  it('creates a new order when the previous one is paid', async () => {
    const user = await createUser()
    const configuration = await createConfiguration()
    const paid = await createOrder({ userId: user.id, configurationId: configuration.id, isPaid: true })
    mockKindeUser(user)

    await createCheckoutSession({ configId: configuration.id })
    const orders = await db.order.findMany({ where: { userId: user.id, configurationId: configuration.id } })
    expect(orders).toHaveLength(2)
    const unpaid = orders.find(({ id }) => id !== paid.id)!
    expect(unpaid.isPaid).toBe(false)
    expect(stripe.checkout.sessions.create).toHaveBeenCalledWith(expect.objectContaining({
      metadata: { userId: user.id, orderId: unpaid.id },
    }))
  })

  it('uses price_data with the server price and card only', async () => {
    const user = await createUser()
    const configuration = await createConfiguration({ material: 'polycarbonate', finish: 'textured' })
    mockKindeUser(user)

    await createCheckoutSession({ configId: configuration.id })
    expect(stripe.checkout.sessions.create).toHaveBeenCalledWith(expect.objectContaining({
      mode: 'payment',
      payment_method_types: ['card'],
      shipping_address_collection: { allowed_countries: ['CL', 'US', 'DE'] },
      line_items: [{
        quantity: 1,
        price_data: {
          currency: 'USD', unit_amount: 2200,
          product_data: { name: 'Custom iPhone Case', images: [configuration.imageUrl] },
        },
      }],
    }))
    expect(stripe.products.create).not.toHaveBeenCalled()
    expect((await db.order.findFirstOrThrow()).amountCents).toBe(2200)
  })

  it('rejects when not logged in', async () => {
    const configuration = await createConfiguration()
    await expect(createCheckoutSession({ configId: configuration.id })).rejects.toThrow('You need to be logged in')
    expect(await db.order.count()).toBe(0)
    expect(stripe.checkout.sessions.create).not.toHaveBeenCalled()
    expect(stripe.products.create).not.toHaveBeenCalled()
  })
})
