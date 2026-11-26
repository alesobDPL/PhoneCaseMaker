import { mockKindeUser } from '../helpers/auth'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type Stripe from 'stripe'
import { db } from '@/db'
import { stripe } from '@/lib/stripe'
import { createConfiguration, createOrder, createUser, resetDb } from '../helpers/db'
import { createCheckoutSession } from '@/app/[locale]/configure/preview/actions'

const cookieStore = vi.hoisted(() => ({ get: vi.fn() }))
vi.mock('next/headers', () => ({ cookies: async () => cookieStore }))

describe('checkout session', () => {
  beforeEach(async () => {
    await resetDb()
    mockKindeUser(null)
    cookieStore.get.mockReset()
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
    const configuration = await createConfiguration({ material: 'polycarbonate', finish: 'textured' })
    await createOrder({ configurationId: configuration.id })
    await createOrder({ userId: user.id })
    const order = await createOrder({ userId: user.id, configurationId: configuration.id, currency: 'usd' })
    mockKindeUser(user)
    cookieStore.get.mockReturnValue({ value: 'clp' })
    vi.mocked(stripe.checkout.sessions.create).mockImplementationOnce(async () => {
      expect(await db.order.findUniqueOrThrow({ where: { id: order.id } }))
        .toMatchObject({ currency: 'clp', amountCents: 21970 })
      return { url: 'https://checkout.stripe.com/test' } as Stripe.Response<Stripe.Checkout.Session>
    })

    expect(await createCheckoutSession({ configId: configuration.id, locale: 'es' }))
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

    await createCheckoutSession({ configId: configuration.id, locale: 'es' })
    const orders = await db.order.findMany({ where: { userId: user.id, configurationId: configuration.id } })
    expect(orders).toHaveLength(2)
    const unpaid = orders.find(({ id }) => id !== paid.id)!
    expect(unpaid.isPaid).toBe(false)
    expect(stripe.checkout.sessions.create).toHaveBeenCalledWith(expect.objectContaining({
      metadata: { userId: user.id, orderId: unpaid.id },
    }))
  })

  it.each([
    ['eur', 'eur', 2100],
    ['clp', 'clp', 21970],
    ['xyz', 'usd', 2200],
  ] as const)('uses the %s cookie to charge %s %i using card only', async (cookie, currency, amount) => {
    const user = await createUser()
    const configuration = await createConfiguration({ material: 'polycarbonate', finish: 'textured' })
    mockKindeUser(user)
    cookieStore.get.mockReturnValue({ value: cookie })

    await expect(createCheckoutSession({ configId: configuration.id, locale: 'es' }))
      .resolves.toEqual({ url: 'https://checkout.stripe.com/test' })
    expect(cookieStore.get).toHaveBeenCalledWith('CURRENCY')
    expect(stripe.checkout.sessions.create).toHaveBeenCalledWith(expect.objectContaining({
      mode: 'payment',
      payment_method_types: ['card'],
      shipping_address_collection: { allowed_countries: ['CL', 'US', 'DE'] },
      line_items: [{
        quantity: 1,
        price_data: {
          currency, unit_amount: amount,
          product_data: { name: 'Custom iPhone Case', images: [configuration.imageUrl] },
        },
      }],
    }))
    expect(stripe.products.create).not.toHaveBeenCalled()
    expect(await db.order.findFirstOrThrow()).toMatchObject({ currency, amountCents: amount })
  })

  it.each([['en', 'en'], ['de', 'es']])('uses locale %s as %s in Stripe and return URLs', async (locale, expected) => {
    const user = await createUser()
    const configuration = await createConfiguration()
    mockKindeUser(user)

    await createCheckoutSession({ configId: configuration.id, locale })

    const order = await db.order.findFirstOrThrow()
    expect(stripe.checkout.sessions.create).toHaveBeenCalledWith(expect.objectContaining({
      locale: expected,
      success_url: `${process.env.NEXT_PUBLIC_SERVER_URL}/${expected}/thank-you?orderId=${order.id}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SERVER_URL}/${expected}/configure/preview?id=${configuration.id}`,
    }))
  })

  it('returns unauthenticated when not logged in', async () => {
    const configuration = await createConfiguration()
    await expect(createCheckoutSession({ configId: configuration.id, locale: 'es' }))
      .resolves.toEqual({ error: 'unauthenticated' })
    expect(await db.order.count()).toBe(0)
    expect(stripe.checkout.sessions.create).not.toHaveBeenCalled()
    expect(stripe.products.create).not.toHaveBeenCalled()
  })

  it('returns not_found for a missing configuration', async () => {
    mockKindeUser(await createUser())
    await expect(createCheckoutSession({ configId: 'missing-configuration', locale: 'es' }))
      .resolves.toEqual({ error: 'not_found' })
    expect(await db.order.count()).toBe(0)
    expect(stripe.checkout.sessions.create).not.toHaveBeenCalled()
  })

  it('returns stripe_error when Stripe rejects the session', async () => {
    mockKindeUser(await createUser())
    const configuration = await createConfiguration()
    vi.mocked(stripe.checkout.sessions.create).mockRejectedValueOnce(new Error('Stripe unavailable'))

    await expect(createCheckoutSession({ configId: configuration.id, locale: 'es' }))
      .resolves.toEqual({ error: 'stripe_error' })
  })

  it('returns stripe_error when Stripe provides no checkout URL', async () => {
    mockKindeUser(await createUser())
    const configuration = await createConfiguration()
    vi.mocked(stripe.checkout.sessions.create).mockResolvedValueOnce({
      url: null,
    } as Stripe.Response<Stripe.Checkout.Session>)

    await expect(createCheckoutSession({ configId: configuration.id, locale: 'es' }))
      .resolves.toEqual({ error: 'stripe_error' })
  })
})
