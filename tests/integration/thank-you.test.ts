import { mockKindeUser } from '../helpers/auth'
import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '@/db'
import { createOrder, createUser, resetDb } from '../helpers/db'
import { getPaymentStatus } from '@/app/thank-you/actions'
import { getOrderSummary } from '@/lib/orders/get-order-summary'
import { parseOrderIdParam } from '@/lib/orders/parse-order-id-param'

const NOT_FOUND = /NEXT_NOT_FOUND|NEXT_HTTP_ERROR_FALLBACK;404/

describe('thank-you orderId parameters', () => {
  it('accepts a single non-empty orderId', () => {
    expect(parseOrderIdParam('order-123')).toBe('order-123')
  })

  it('missing or repeated orderId parameters are not found', () => {
    expect(parseOrderIdParam(undefined)).toBeNull()
    expect(parseOrderIdParam('')).toBeNull()
    expect(parseOrderIdParam(['one', 'two'])).toBeNull()
    expect(parseOrderIdParam(['one'])).toBeNull()
    expect(parseOrderIdParam([])).toBeNull()
  })
})

describe('thank-you order access', () => {
  beforeEach(async () => {
    await resetDb()
    mockKindeUser(null)
  })

  it('owner gets isPaid false then true', async () => {
    const user = await createUser()
    const order = await createOrder({ userId: user.id })
    mockKindeUser(user)

    expect(await getPaymentStatus({ orderId: order.id })).toEqual({ isPaid: false })
    expect(await getOrderSummary(order.id, user.id)).toMatchObject({
      id: order.id, isPaid: false, amountCents: 1400,
      configuration: { model: 'iphone15', material: 'silicone', finish: 'smooth', croppedImageUrl: 'https://example.com/case-cropped.jpg' },
      shippingAddress: null,
    })

    await db.order.update({ where: { id: order.id }, data: { isPaid: true } })
    expect(await getPaymentStatus({ orderId: order.id })).toEqual({ isPaid: true })
    expect((await getOrderSummary(order.id, user.id)).isPaid).toBe(true)
  })

  it("other user's order is not found", async () => {
    const order = await createOrder()
    const other = await createUser()
    mockKindeUser(other)

    await expect(getPaymentStatus({ orderId: order.id })).rejects.toThrow(NOT_FOUND)
    await expect(getOrderSummary(order.id, other.id)).rejects.toThrow(NOT_FOUND)
  })

  it('anonymous is not found', async () => {
    const order = await createOrder()
    await expect(getPaymentStatus({ orderId: order.id })).rejects.toThrow(NOT_FOUND)
  })

  it('missing orders are not found', async () => {
    const user = await createUser()
    mockKindeUser(user)
    await expect(getPaymentStatus({ orderId: 'missing-order' })).rejects.toThrow(NOT_FOUND)
    await expect(getOrderSummary('missing-order', user.id)).rejects.toThrow(NOT_FOUND)
  })
})
