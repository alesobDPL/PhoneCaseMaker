import { randomUUID } from 'node:crypto'
import type { Configuration, Order, Prisma, User } from '@prisma/client'
import { db } from '@/db'
import { calculatePriceCents } from '@/lib/pricing'

export async function resetDb(): Promise<void> {
  await db.$executeRaw`
    TRUNCATE TABLE "Order", "Configuration", "User", "ShippingAddress", "BillingAddress"
    RESTART IDENTITY CASCADE
  `
}

export async function createUser(email?: string): Promise<User> {
  return db.user.create({ data: { email: email ?? `${randomUUID()}@example.com` } })
}

export async function createConfiguration(
  overrides: Partial<Prisma.ConfigurationCreateInput> = {},
): Promise<Configuration> {
  return db.configuration.create({
    data: {
      width: 500,
      height: 500,
      imageUrl: 'https://example.com/case.jpg',
      croppedImageUrl: 'https://example.com/case-cropped.jpg',
      model: 'iphone15',
      color: 'black',
      material: 'silicone',
      finish: 'smooth',
      ...overrides,
    },
  })
}

export async function createOrder(
  overrides: Partial<Prisma.OrderUncheckedCreateInput> = {},
): Promise<Order> {
  const userId = overrides.userId ?? (await createUser()).id
  const configuration = overrides.configurationId
    ? await db.configuration.findUniqueOrThrow({ where: { id: overrides.configurationId } })
    : await createConfiguration()

  return db.order.create({
    data: {
      userId,
      configurationId: configuration.id,
      amountCents: calculatePriceCents(configuration),
      ...overrides,
    },
  })
}
