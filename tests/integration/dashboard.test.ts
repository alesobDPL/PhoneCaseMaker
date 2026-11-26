import { mockKindeUser } from '../helpers/auth'
import { afterAll, afterEach, beforeEach, expect, it, vi } from 'vitest'
import { createOrder, createUser, resetDb } from '../helpers/db'
import { db } from '@/db'
import { getDashboardData } from '@/app/[locale]/dashboard/queries'
import { updateOrderStatus } from '@/app/[locale]/dashboard/actions'
import type { AuthzEnv } from '@/lib/authz'

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

const demoEnv: AuthzEnv = { adminEmail: 'admin@example.com', demoMode: true }

beforeEach(async () => {
  await resetDb()
  mockKindeUser(null)
  vi.stubEnv('ADMIN_EMAIL', demoEnv.adminEmail)
  vi.stubEnv('DEMO_MODE', 'true')
})

afterEach(() => {
  mockKindeUser(null)
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
})

afterAll(async () => { await db.$disconnect() })

it('demo visitor sees samples and own paid orders only', async () => {
  const visitor = await createUser()
  const own = await createOrder({ userId: visitor.id, isPaid: true, Status: 'shipped' })
  const sample = await createOrder({ isSample: true, isPaid: true, Status: 'fulfilled' })
  await createOrder({ userId: visitor.id, isPaid: false })
  await createOrder({ isPaid: true })
  await createOrder({ isSample: true, isPaid: false })

  const data = await getDashboardData(visitor, demoEnv)
  expect(data.orders.map(order => order.id).sort()).toEqual([own.id, sample.id].sort())
  expect(data.orders.find(order => order.id === own.id)).toMatchObject({
    canUpdate: true, user: { email: visitor.email }, configuration: { model: 'iphone15' },
  })
  expect(data.orders.find(order => order.id === sample.id)?.canUpdate).toBe(false)
  expect(data.revenue7dCents).toBe(own.amountCents + sample.amountCents)
  expect(data.revenue30dCents).toBe(own.amountCents + sample.amountCents)
  expect(data.countsByStatus).toEqual({ awaiting_shipment: 0, shipped: 1, fulfilled: 1 })
})

it("demo visitor cannot update a sample or another user's order", async () => {
  const visitor = await createUser()
  mockKindeUser(visitor)
  const sample = await createOrder({ userId: visitor.id, isSample: true, isPaid: true })
  const other = await createOrder({ isPaid: true })
  for (const order of [sample, other]) {
    await expect(updateOrderStatus({ orderId: order.id, status: 'shipped' })).rejects.toThrow()
    expect(await db.order.findUniqueOrThrow({ where: { id: order.id } })).toMatchObject({ Status: 'awaiting_shipment' })
  }
})

it('demo visitor updates own order', async () => {
  const visitor = await createUser()
  mockKindeUser(visitor)
  const order = await createOrder({ userId: visitor.id, isPaid: true })
  await updateOrderStatus({ orderId: order.id, status: 'shipped' })
  expect(await db.order.findUniqueOrThrow({ where: { id: order.id } })).toMatchObject({ Status: 'shipped' })
  await updateOrderStatus({ orderId: order.id, status: 'fulfilled' })
  expect(await db.order.findUniqueOrThrow({ where: { id: order.id } })).toMatchObject({ Status: 'fulfilled' })
})

it('admin sees all and updates non-sample orders', async () => {
  const admin = await createUser(demoEnv.adminEmail)
  mockKindeUser(admin)
  vi.stubEnv('DEMO_MODE', 'false')
  const own = await createOrder({ userId: admin.id, isPaid: true })
  const other = await createOrder({ isPaid: true })
  const sample = await createOrder({ isPaid: true, isSample: true })
  await createOrder({ isPaid: false })
  const data = await getDashboardData(admin, { ...demoEnv, demoMode: false })
  expect(data.orders.map(order => order.id).sort()).toEqual([own.id, other.id, sample.id].sort())
  expect(data.orders.filter(order => order.canUpdate).map(order => order.id).sort()).toEqual([own.id, other.id].sort())
  for (const order of [own, other]) {
    await updateOrderStatus({ orderId: order.id, status: 'fulfilled' })
    expect(await db.order.findUniqueOrThrow({ where: { id: order.id } })).toMatchObject({ Status: 'fulfilled' })
  }
  await expect(updateOrderStatus({ orderId: sample.id, status: 'shipped' })).rejects.toThrow()
  expect(await db.order.findUniqueOrThrow({ where: { id: sample.id } })).toMatchObject({ Status: 'awaiting_shipment' })
})

it('non-admin without demo mode is rejected', async () => {
  const visitor = await createUser()
  const order = await createOrder({ userId: visitor.id, isPaid: true })
  mockKindeUser(visitor)
  vi.stubEnv('DEMO_MODE', 'false')
  await expect(getDashboardData(visitor, { ...demoEnv, demoMode: false })).rejects.toThrow('Unauthorized')
  await expect(updateOrderStatus({ orderId: order.id, status: 'shipped' })).rejects.toThrow('Unauthorized')
  expect(await db.order.findUniqueOrThrow({ where: { id: order.id } })).toMatchObject({ Status: 'awaiting_shipment' })
})

it('revenue counts only paid orders in the window', async () => {
  const admin = await createUser(demoEnv.adminEmail)
  const now = new Date('2026-11-23T12:00:00Z')
  vi.spyOn(Date, 'now').mockReturnValue(now.getTime())
  const day = 24 * 60 * 60 * 1000
  const fixtures = [
    { age: 0, amountCents: 1400, isPaid: true, Status: 'awaiting_shipment' as const },
    { age: 7 * day, amountCents: 1900, isPaid: true, Status: 'shipped' as const },
    { age: 7 * day + 1, amountCents: 1700, isPaid: true, Status: 'fulfilled' as const },
    { age: 30 * day, amountCents: 2200, isPaid: true, Status: 'fulfilled' as const },
    { age: 30 * day + 1, amountCents: 1400, isPaid: true, Status: 'fulfilled' as const },
    { age: 2 * day, amountCents: 9900, isPaid: false, Status: 'awaiting_shipment' as const },
  ]
  for (const { age, ...order } of fixtures) {
    await createOrder({ ...order, createdAt: new Date(now.getTime() - age) })
  }
  const data = await getDashboardData(admin, demoEnv)
  expect(data.revenue7dCents).toBe(3300)
  expect(data.revenue30dCents).toBe(7200)
  expect(data.orders).toHaveLength(5)
  expect(data.countsByStatus).toEqual({ awaiting_shipment: 1, shipped: 1, fulfilled: 3 })
})
