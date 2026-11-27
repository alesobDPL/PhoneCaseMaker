import { mockKindeUser } from '../helpers/auth'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type Stripe from 'stripe'
import { db } from '@/db'
import { handleCheckoutCompleted } from '@/lib/orders/handle-checkout-completed'
import { calculatePrice } from '@/lib/pricing'
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

  it('creates a new order and leaves the unpaid one intact when the currency changes', async () => {
    const user = await createUser()
    const configuration = await createConfiguration({ material: 'polycarbonate', finish: 'textured' })
    const original = await createOrder({ userId: user.id, configurationId: configuration.id, currency: 'usd' })
    mockKindeUser(user)
    cookieStore.get.mockReturnValue({ value: 'eur' })

    expect(await createCheckoutSession({ configId: configuration.id, locale: 'es' }))
      .toEqual({ url: 'https://checkout.stripe.com/test' })

    const orders = await db.order.findMany({ where: { userId: user.id, configurationId: configuration.id } })
    expect(orders).toHaveLength(2)
    const created = orders.find(({ id }) => id !== original.id)!
    const eur = calculatePrice(configuration, 'eur')
    expect(created).toMatchObject({ currency: 'eur', amountCents: eur.amount, isPaid: false })
    expect(await db.order.findUniqueOrThrow({ where: { id: original.id } }))
      .toMatchObject({ currency: original.currency, amountCents: original.amountCents, isPaid: false })
    expect(stripe.checkout.sessions.create).toHaveBeenCalledWith(expect.objectContaining({
      metadata: { userId: user.id, orderId: created.id },
      line_items: [expect.objectContaining({
        price_data: expect.objectContaining({ currency: 'eur', unit_amount: eur.amount }),
      })],
    }))
  })

  it.each([
    ['usd cookie', { value: 'usd' }],
    ['no cookie', undefined],
  ] as const)('reuses an unpaid order unchanged with the same currency and amount (%s)', async (_label, cookie) => {
    const user = await createUser()
    const configuration = await createConfiguration({ material: 'polycarbonate', finish: 'textured' })
    await createOrder({ configurationId: configuration.id })
    await createOrder({ userId: user.id })
    const order = await createOrder({ userId: user.id, configurationId: configuration.id, currency: 'usd' })
    mockKindeUser(user)
    cookieStore.get.mockReturnValue(cookie)

    expect(await createCheckoutSession({ configId: configuration.id, locale: 'es' }))
      .toEqual({ url: 'https://checkout.stripe.com/test' })
    expect(await db.order.count()).toBe(3)
    expect(await db.order.findUniqueOrThrow({ where: { id: order.id } }))
      .toMatchObject({ currency: order.currency, amountCents: order.amountCents, isPaid: false })
    expect(stripe.checkout.sessions.create).toHaveBeenCalledWith(expect.objectContaining({
      metadata: { userId: user.id, orderId: order.id },
    }))
  })

  it('creates a new order at the current price when the unpaid one has a different amount', async () => {
    const user = await createUser()
    const configuration = await createConfiguration({ material: 'polycarbonate', finish: 'textured' })
    const current = calculatePrice(configuration, 'usd').amount
    const stale = await createOrder({
      userId: user.id, configurationId: configuration.id, currency: 'usd', amountCents: current + 100,
    })
    mockKindeUser(user)
    cookieStore.get.mockReturnValue({ value: 'usd' })

    await createCheckoutSession({ configId: configuration.id, locale: 'es' })

    const orders = await db.order.findMany({ where: { userId: user.id, configurationId: configuration.id } })
    expect(orders).toHaveLength(2)
    const created = orders.find(({ id }) => id !== stale.id)!
    expect(created).toMatchObject({ currency: 'usd', amountCents: current, isPaid: false })
    expect(await db.order.findUniqueOrThrow({ where: { id: stale.id } }))
      .toMatchObject({ currency: 'usd', amountCents: current + 100, isPaid: false })
    expect(stripe.checkout.sessions.create).toHaveBeenCalledWith(expect.objectContaining({
      metadata: { userId: user.id, orderId: created.id },
    }))
  })

  it('marks the first order paid when its Stripe session is paid after switching currency', async () => {
    const user = await createUser()
    const configuration = await createConfiguration({ material: 'polycarbonate', finish: 'textured' })
    const first = await createOrder({ userId: user.id, configurationId: configuration.id, currency: 'usd' })
    mockKindeUser(user)
    cookieStore.get.mockReturnValue({ value: 'eur' })

    await createCheckoutSession({ configId: configuration.id, locale: 'es' })
    const second = (await db.order.findMany({ where: { userId: user.id, configurationId: configuration.id } }))
      .find(({ id }) => id !== first.id)!

    const session = {
      id: 'cs_test_checkout',
      metadata: { orderId: first.id, userId: user.id },
      amount_total: first.amountCents,
      currency: 'usd',
    } as unknown as Stripe.Checkout.Session
    expect(await handleCheckoutCompleted(session, db)).toBe('paid')
    expect(await db.order.findUniqueOrThrow({ where: { id: first.id } })).toMatchObject({ isPaid: true })
    expect(await db.order.findUniqueOrThrow({ where: { id: second.id } })).toMatchObject({ isPaid: false })
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
          product_data: { name: 'Funda de iPhone personalizada', images: [configuration.imageUrl] },
        },
      }],
    }))
    expect(stripe.products.create).not.toHaveBeenCalled()
    expect(await db.order.findFirstOrThrow()).toMatchObject({ currency, amountCents: amount })
  })

  it.each([
    ['en', 'en', 'Custom iPhone Case'],
    ['de', 'es', 'Funda de iPhone personalizada'],
  ])('uses locale %s as %s in Stripe and return URLs', async (locale, expected, productName) => {
    const user = await createUser()
    const configuration = await createConfiguration()
    mockKindeUser(user)

    await createCheckoutSession({ configId: configuration.id, locale })

    const order = await db.order.findFirstOrThrow()
    expect(stripe.checkout.sessions.create).toHaveBeenCalledWith(expect.objectContaining({
      locale: expected,
      success_url: `${process.env.NEXT_PUBLIC_SERVER_URL}/${expected}/thank-you?orderId=${order.id}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SERVER_URL}/${expected}/configure/preview?id=${configuration.id}`,
      line_items: [expect.objectContaining({
        price_data: expect.objectContaining({
          product_data: expect.objectContaining({ name: productName }),
        }),
      })],
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
