import { execFileSync } from 'node:child_process'
import { resolve } from 'node:path'
import { PrismaClient } from '@prisma/client'

export default async function globalSetup() {
  // Use Node directly so migration deployment also works on Windows.
  execFileSync(process.execPath, [
    resolve('node_modules/prisma/build/index.js'), 'migrate', 'deploy',
  ], { env: process.env, stdio: 'inherit' })

  const prisma = new PrismaClient()
  let configurationId: string
  try {
    const configuration = await prisma.configuration.create({
      data: {
        width: 500,
        height: 500,
        imageUrl: '/samples/case-2.png',
        croppedImageUrl: '/samples/case-2.png',
        model: 'iphone15',
        color: 'black',
        material: 'polycarbonate',
        finish: 'textured',
      },
    })
    configurationId = configuration.id
    process.env.E2E_CONFIGURATION_ID = configurationId
  } finally {
    await prisma.$disconnect()
  }

  return async () => {
    const cleanup = new PrismaClient()
    try {
      await cleanup.configuration.delete({ where: { id: configurationId } })
    } finally {
      await cleanup.$disconnect()
      delete process.env.E2E_CONFIGURATION_ID
    }
  }
}
