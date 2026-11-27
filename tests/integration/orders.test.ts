import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '@/db'
import { getUserOrders } from '@/lib/orders/get-user-orders'
import { createConfiguration, createOrder, createUser, resetDb } from '../helpers/db'

describe('getUserOrders', () => {
  beforeEach(resetDb)

  it('returns only the buyer’s paid orders with the newest first', async () => {
    const buyer = await createUser()
    const otherBuyer = await createUser()
    const older = await createOrder({
      userId: buyer.id,
      createdAt: new Date('2026-01-01T12:00:00Z'),
      isPaid: true,
      currency: 'legacy',
    })
    const newer = await createOrder({
      userId: buyer.id,
      createdAt: new Date('2026-02-01T12:00:00Z'),
      isPaid: true,
      amountCents: 13_990,
      currency: 'clp',
      Status: 'shipped',
    })
    await createOrder({ userId: buyer.id })
    await createOrder({ userId: otherBuyer.id, isPaid: true })

    const configuration = {
      model: 'iphone15',
      material: 'silicone',
      finish: 'smooth',
      color: 'black',
      croppedImageUrl: 'https://example.com/case-cropped.jpg',
    }

    expect(await getUserOrders(buyer.id)).toEqual([
      {
        id: newer.id,
        createdAt: newer.createdAt,
        amountCents: 13_990,
        currency: 'clp',
        status: 'shipped',
        configuration,
      },
      {
        id: older.id,
        createdAt: older.createdAt,
        amountCents: older.amountCents,
        currency: 'usd',
        status: 'awaiting_shipment',
        configuration,
      },
    ])
  })

  it('limits results to 50 and breaks date ties by ascending id', async () => {
    const buyer = await createUser()
    const configuration = await createConfiguration()
    const createdAt = new Date('2026-01-01T12:00:00Z')
    const ids = Array.from({ length: 51 }, (_, index) => `order-${String(index).padStart(2, '0')}`)

    await db.order.createMany({
      data: [...ids].reverse().map((id) => ({
        id,
        userId: buyer.id,
        configurationId: configuration.id,
        createdAt,
        isPaid: true,
        amountCents: 1400,
      })),
    })

    const orders = await getUserOrders(buyer.id, db)

    expect(orders.map(({ id }) => id)).toEqual(ids.slice(0, 50))
  })
})
