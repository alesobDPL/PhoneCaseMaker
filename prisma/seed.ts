import { PrismaClient, type OrderStatus } from '@prisma/client'
import { calculatePriceCents } from '../src/lib/pricing'

const prisma = new PrismaClient()

async function main() {
  await prisma.$transaction(async tx => {
    await tx.order.deleteMany({ where: { isSample: true } })

    const users = []
    for (const [index, name] of ['alex', 'jordan', 'taylor'].entries()) {
      users.push(await tx.user.upsert({
        where: { id: `sample-user-${index + 1}` },
        update: {},
        create: { id: `sample-user-${index + 1}`, email: `${name}@example.com` },
      }))
    }

    const images = ['case-1.jpg', 'case-2.png', 'case-3.png', 'case-4.png']
    const models = ['iphone15', 'iphone14', 'iphone13', 'iphone12'] as const
    const configurations = []
    for (const [index, image] of images.entries()) {
      configurations.push(await tx.configuration.upsert({
        where: { id: `sample-configuration-${index + 1}` },
        update: {},
        create: {
          id: `sample-configuration-${index + 1}`,
          width: 500,
          height: 500,
          imageUrl: `/samples/${image}`,
          croppedImageUrl: `/samples/${image}`,
          model: models[index],
          color: index % 2 === 0 ? 'black' : 'blue',
          material: index % 2 === 0 ? 'silicone' : 'polycarbonate',
          finish: index < 2 ? 'smooth' : 'textured',
        },
      }))
    }

    const agesInDays = [1, 3, 6, 9, 14, 20, 25, 29]
    const statuses: OrderStatus[] = ['awaiting_shipment', 'shipped', 'fulfilled']
    const now = Date.now()
    for (const [index, age] of agesInDays.entries()) {
      const configuration = configurations[index % configurations.length]
      await tx.order.create({
        data: {
          userId: users[index % users.length].id,
          configurationId: configuration.id,
          amountCents: calculatePriceCents(configuration),
          isPaid: true,
          isSample: true,
          Status: statuses[index % statuses.length],
          createdAt: new Date(now - age * 24 * 60 * 60 * 1000),
        },
      })
    }
  }, {
    // Remote databases (e.g. Neon from another region) need more than the 5 s default
    // for these sequential writes.
    maxWait: 10_000,
    timeout: 30_000,
  })
  console.log('Seeded 8 paid sample orders for 3 example users.')
}

main()
  .catch(error => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => { await prisma.$disconnect() })
